import { Config } from "./config.js";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class ArubaClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Obtain OAuth access token using password grant
   */
  async authenticate(): Promise<void> {
    const tokenUrl = `${this.config.baseUrl}/oauth2/token`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "password",
      username: this.config.username,
      password: this.config.password,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth authentication failed: ${response.status} ${error}`);
    }

    const data: TokenResponse = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiry = Date.now() + data.expires_in * 1000;
  }

  /**
   * Refresh OAuth token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      return this.authenticate();
    }

    const tokenUrl = `${this.config.baseUrl}/oauth2/token`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      // Refresh failed, re-authenticate
      return this.authenticate();
    }

    const data: TokenResponse = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiry = Date.now() + data.expires_in * 1000;
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureToken(): Promise<void> {
    if (!this.config.accessToken || !this.config.tokenExpiry) {
      return this.authenticate();
    }

    // Refresh if token expires in next 5 minutes
    if (this.config.tokenExpiry - Date.now() < 5 * 60 * 1000) {
      return this.refreshAccessToken();
    }
  }

  /**
   * Make an authenticated API request
   */
  async request(
    method: string,
    path: string,
    params?: Record<string, string>,
    body?: unknown
  ): Promise<unknown> {
    await this.ensureToken();

    const url = new URL(path, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (response.status === 401) {
      // Token expired, refresh and retry
      await this.refreshAccessToken();
      headers.Authorization = `Bearer ${this.config.accessToken}`;
      const retryResponse = await fetch(url.toString(), options);
      if (!retryResponse.ok) {
        const error = await retryResponse.text();
        throw new Error(
          `API request failed after retry: ${retryResponse.status} ${error}`
        );
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get(path: string, params?: Record<string, string>): Promise<unknown> {
    return this.request("GET", path, params);
  }

  /**
   * POST request
   */
  async post(path: string, body: unknown): Promise<unknown> {
    return this.request("POST", path, undefined, body);
  }

  /**
   * PUT request
   */
  async put(path: string, body: unknown): Promise<unknown> {
    return this.request("PUT", path, undefined, body);
  }

  /**
   * DELETE request
   */
  async delete(path: string): Promise<unknown> {
    return this.request("DELETE", path);
  }
}
