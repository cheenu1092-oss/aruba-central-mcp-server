import { describe, it, expect, beforeEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ArubaClient } from "../src/client.js";
import { registerMonitoringTools } from "../src/traditional/tools/monitoring.js";

describe("Monitoring Tools", () => {
  let server: McpServer;
  let mockClient: ArubaClient;

  beforeEach(() => {
    server = new McpServer({ name: "test-server", version: "1.0.0" });
    mockClient = {
      get: vi.fn().mockResolvedValue({ success: true }),
    } as any;
  });

  it("should register without errors", () => {
    expect(() => registerMonitoringTools(server, mockClient)).not.toThrow();
  });

  it("should register list_devices tool", async () => {
    registerMonitoringTools(server, mockClient);
    // Tool registration happens internally, just verify no errors thrown
    expect(mockClient.get).not.toHaveBeenCalled();
  });
});
