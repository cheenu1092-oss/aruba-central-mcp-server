import { ArubaClient } from "../client.js";
import { Config } from "../config.js";

interface ExecuteRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

interface ExecuteResult {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

export class ArubaExecutor {
  constructor(
    private client: ArubaClient,
    private config: Config
  ) {}

  async execute(req: ExecuteRequest): Promise<ExecuteResult> {
    try {
      // Enforce write protection
      if (!this.config.enableWrite && req.method !== "GET") {
        return {
          success: false,
          error: `${req.method} operations are disabled. Set ARUBA_ENABLE_WRITE=true to enable.`,
        };
      }

      // Execute the request
      let result: unknown;
      switch (req.method) {
        case "GET":
          result = await this.client.get(req.path, req.params);
          break;
        case "POST":
          result = await this.client.post(req.path, req.body);
          break;
        case "PUT":
          result = await this.client.put(req.path, req.body);
          break;
        case "PATCH":
          result = await this.client.patch(req.path, req.body);
          break;
        case "DELETE":
          result = await this.client.delete(req.path);
          break;
      }

      return {
        success: true,
        data: result,
      };
    } catch (err: unknown) {
      // Parse error message for status code if available
      const errorMsg = String(err);
      const statusMatch = /(\d{3})/.exec(errorMsg);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

      return {
        success: false,
        error: errorMsg,
        status,
      };
    }
  }
}
