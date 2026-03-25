import { describe, it, expect, beforeEach, vi } from "vitest";
import { ArubaClient } from "../src/client.js";
import { Config } from "../src/config.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("ArubaClient", () => {
  let client: ArubaClient;
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      customerId: "test-customer-id",
      username: "test-user",
      password: "test-pass",
      baseUrl: "https://test.api.com",
      verifySsl: true,
      enableWrite: false,
    };
    client = new ArubaClient(mockConfig);
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("should authenticate and store tokens", async () => {
      const mockTokenResponse = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await client.authenticate();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://test.api.com/oauth2/token",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
      );
    });

    it("should throw error on authentication failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(client.authenticate()).rejects.toThrow(
        /OAuth authentication failed/
      );
    });
  });

  describe("API requests", () => {
    beforeEach(async () => {
      // Mock successful authentication
      const mockTokenResponse = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await client.authenticate();
      vi.clearAllMocks();
    });

    it("should make GET request", async () => {
      const mockResponse = { devices: [] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.get("/monitoring/v2/devices", {
        limit: "100",
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/monitoring/v2/devices?limit=100"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
          }),
        })
      );
    });

    it("should make POST request", async () => {
      const mockResponse = { success: true };
      const body = { name: "test-group" };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.post("/configuration/v1/groups", body);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/configuration/v1/groups"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        })
      );
    });

    it("should handle 401 and retry with refresh", async () => {
      const mockResponse = { devices: [] };
      const mockRefreshResponse = {
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      // First request fails with 401
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Refresh token call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      // Retry succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.get("/monitoring/v2/devices");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial, refresh, retry
    });

    it("should handle 204 No Content", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await client.delete("/guest/v1/visitors/123");

      expect(result).toEqual({ success: true });
    });
  });

  describe("PATCH requests", () => {
    beforeEach(async () => {
      const mockTokenResponse = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await client.authenticate();
      vi.clearAllMocks();
    });

    it("should make PATCH request", async () => {
      const mockResponse = { success: true };
      const body = { wpa_passphrase: "newpassword" };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.patch("/configuration/v1/wlans/MyGroup/Guest", body);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/configuration/v1/wlans/MyGroup/Guest"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(body),
        })
      );
    });
  });
});
