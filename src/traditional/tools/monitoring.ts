import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArubaClient } from "../../client.js";

export function registerMonitoringTools(server: McpServer, client: ArubaClient): void {
  // list_devices
  server.registerTool(
    "list_devices",
    {
      description: "List all devices (APs, switches, gateways) with status and health",
      inputSchema: {
        device_type: z
          .enum(["ACCESS POINTS", "SWITCHES", "GATEWAYS", "ALL"])
          .optional()
          .describe("Filter by device type"),
        status: z
          .enum(["Up", "Down"])
          .optional()
          .describe("Filter by connectivity status"),
        site: z.string().optional().describe("Filter by site name"),
        group: z.string().optional().describe("Filter by group name"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      if (args.device_type && args.device_type !== "ALL") {
        params.device_type = args.device_type;
      }
      if (args.status) params.status = args.status;
      if (args.site) params.site = args.site;
      if (args.group) params.group = args.group;

      const results = await client.get("/monitoring/v2/devices", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_device_details
  server.registerTool(
    "get_device_details",
    {
      description: "Get detailed information about a specific device",
      inputSchema: {
        serial: z.string().describe("Device serial number"),
      },
    },
    async (args) => {
      const result = await client.get(`/monitoring/v1/devices/${args.serial}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // list_clients
  server.registerTool(
    "list_clients",
    {
      description: "List connected wireless and wired clients",
      inputSchema: {
        network: z
          .enum(["wireless", "wired", "all"])
          .optional()
          .describe("Network type filter"),
        site: z.string().optional().describe("Filter by site name"),
        group: z.string().optional().describe("Filter by group name"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      if (args.network && args.network !== "all") {
        params.network = args.network;
      }
      if (args.site) params.site = args.site;
      if (args.group) params.group = args.group;

      const results = await client.get("/monitoring/v1/clients", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_client_details
  server.registerTool(
    "get_client_details",
    {
      description: "Get detailed information about a specific client",
      inputSchema: {
        mac_address: z.string().describe("Client MAC address"),
      },
    },
    async (args) => {
      const result = await client.get(`/monitoring/v1/clients/${args.mac_address}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // list_events
  server.registerTool(
    "list_events",
    {
      description: "List network events and alerts",
      inputSchema: {
        event_type: z
          .string()
          .optional()
          .describe("Filter by event type (e.g. 'Gateway', 'AP', 'Client')"),
        severity: z
          .enum(["critical", "major", "minor", "warning", "info"])
          .optional()
          .describe("Filter by severity level"),
        from_timestamp: z
          .number()
          .optional()
          .describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z
          .number()
          .optional()
          .describe("End time (Unix timestamp in seconds)"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      if (args.event_type) params.event_type = args.event_type;
      if (args.severity) params.severity = args.severity;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);

      const results = await client.get("/central/v1/events", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_network_health
  server.registerTool(
    "get_network_health",
    {
      description: "Get overall network health summary",
      inputSchema: {
        site: z.string().optional().describe("Filter by site name"),
        group: z.string().optional().describe("Filter by group name"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {};
      if (args.site) params.site = args.site;
      if (args.group) params.group = args.group;

      const result = await client.get("/monitoring/v1/networks/health", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
