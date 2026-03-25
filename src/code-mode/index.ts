#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ArubaClient } from "../client.js";
import { Config } from "../config.js";
import { ArubaExecutor } from "./executor.js";

async function main() {
  // Load configuration from environment
  const config: Config = {
    clientId: process.env.ARUBA_CLIENT_ID ?? "",
    clientSecret: process.env.ARUBA_CLIENT_SECRET ?? "",
    customerId: process.env.ARUBA_CUSTOMER_ID ?? "",
    username: process.env.ARUBA_USERNAME ?? "",
    password: process.env.ARUBA_PASSWORD ?? "",
    baseUrl:
      process.env.ARUBA_BASE_URL ?? "https://apigw-prod2.central.arubanetworks.com",
    verifySsl: process.env.ARUBA_VERIFY_SSL !== "false",
    enableWrite: process.env.ARUBA_ENABLE_WRITE === "true",
  };

  // Validate required config
  if (
    !config.clientId ||
    !config.clientSecret ||
    !config.customerId ||
    !config.username ||
    !config.password
  ) {
    throw new Error(
      "Missing required environment variables. Set ARUBA_CLIENT_ID, ARUBA_CLIENT_SECRET, ARUBA_CUSTOMER_ID, ARUBA_USERNAME, ARUBA_PASSWORD"
    );
  }

  // Initialize client and executor
  const client = new ArubaClient(config);
  const executor = new ArubaExecutor(client, config);

  // Create MCP server
  const server = new McpServer({
    name: "aruba-central-mcp-server-code-mode",
    version: "1.0.0",
  });

  // Register the execute_aruba_call tool
  server.registerTool(
    "execute_aruba_call",
    {
      description: [
        "Execute an arbitrary Aruba Central REST API call.",
        "GET requests are always allowed. POST/PUT/PATCH/DELETE require --enable-write flag.",
        "Rate limited. All calls are audit-logged.",
        "",
        "Examples:",
        "  GET /monitoring/v2/devices?limit=100",
        "  GET /monitoring/v1/clients/00:11:22:33:44:55",
        "  POST /configuration/v1/wlans/MyGroup (body: {essid:'Guest',type:'guest'})",
      ].join("\n"),
      inputSchema: {
        method: z
          .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
          .describe("HTTP method"),
        path: z
          .string()
          .describe(
            'API path relative to base URL, e.g. "/monitoring/v2/devices" or "/configuration/v1/groups"'
          ),
        params: z
          .record(z.string(), z.string())
          .optional()
          .describe("Query parameters (for GET requests)"),
        body: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Request body for POST/PUT/PATCH requests"),
      },
    },
    async (args) => {
      const result = await executor.execute({
        method: args.method,
        path: args.path,
        params: args.params,
        body: args.body,
      });

      if (!result.success) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: result.status
                ? `Aruba API error ${result.status}: ${result.error}`
                : `Error: ${result.error}`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    }
  );

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Aruba Central MCP Server (Code Mode) running on stdio");
  console.error(`Write operations: ${config.enableWrite ? "ENABLED" : "DISABLED"}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
