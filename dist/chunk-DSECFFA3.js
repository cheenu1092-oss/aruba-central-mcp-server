// src/client.ts
var ArubaClient = class {
  config;
  constructor(config) {
    this.config = config;
  }
  /**
   * Obtain OAuth access token using password grant
   */
  async authenticate() {
    const tokenUrl = `${this.config.baseUrl}/oauth2/token`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "password",
      username: this.config.username,
      password: this.config.password
    });
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth authentication failed: ${response.status} ${error}`);
    }
    const data = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiry = Date.now() + data.expires_in * 1e3;
  }
  /**
   * Refresh OAuth token using refresh token
   */
  async refreshAccessToken() {
    if (!this.config.refreshToken) {
      return this.authenticate();
    }
    const tokenUrl = `${this.config.baseUrl}/oauth2/token`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken
    });
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!response.ok) {
      return this.authenticate();
    }
    const data = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiry = Date.now() + data.expires_in * 1e3;
  }
  /**
   * Ensure we have a valid access token
   */
  async ensureToken() {
    if (!this.config.accessToken || !this.config.tokenExpiry) {
      return this.authenticate();
    }
    if (this.config.tokenExpiry - Date.now() < 5 * 60 * 1e3) {
      return this.refreshAccessToken();
    }
  }
  /**
   * Make an authenticated API request
   */
  async request(method, path, params, body) {
    await this.ensureToken();
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    const headers = {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json"
    };
    const options = {
      method,
      headers
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url.toString(), options);
    if (response.status === 401) {
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
    if (response.status === 204) {
      return { success: true };
    }
    return response.json();
  }
  /**
   * GET request
   */
  async get(path, params) {
    return this.request("GET", path, params);
  }
  /**
   * POST request
   */
  async post(path, body) {
    return this.request("POST", path, void 0, body);
  }
  /**
   * PUT request
   */
  async put(path, body) {
    return this.request("PUT", path, void 0, body);
  }
  /**
   * PATCH request
   */
  async patch(path, body) {
    return this.request("PATCH", path, void 0, body);
  }
  /**
   * DELETE request
   */
  async delete(path) {
    return this.request("DELETE", path);
  }
};

export {
  ArubaClient
};
