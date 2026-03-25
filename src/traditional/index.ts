#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ArubaClient } from "../client.js";
import { Config } from "../config.js";
import { registerMonitoringTools } from "./tools/monitoring.js";
import { registerDeviceTools } from "./tools/devices.js";
import { registerConfigurationTools } from "./tools/configuration.js";
import { registerApprfTools } from "./tools/apprf.js";
import { registerGuestTools } from "./tools/guest.js";

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

  // Initialize client
  const client = new ArubaClient(config);

  // Create MCP server
  const server = new McpServer({
    name: "aruba-central-mcp-server",
    version: "1.0.0",
  });

  // Register all tool groups
  registerMonitoringTools(server, client);
  registerDeviceTools(server, client, config);
  registerConfigurationTools(server, client, config);
  registerApprfTools(server, client);
  registerGuestTools(server, client, config);

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Aruba Central MCP Server running on stdio");
  console.error(`Write operations: ${config.enableWrite ? "ENABLED" : "DISABLED"}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
