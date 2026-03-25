import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArubaClient } from "../../client.js";

export function registerApprfTools(server: McpServer, client: ArubaClient): void {
  // get_top_applications
  server.registerTool(
    "get_top_applications",
    {
      description: "Get top applications by traffic/usage",
      inputSchema: {
        group: z.string().optional().describe("Filter by group name"),
        site: z.string().optional().describe("Filter by site name"),
        from_timestamp: z
          .number()
          .optional()
          .describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z.number().optional().describe("End time (Unix timestamp in seconds)"),
        count: z.number().optional().describe("Number of top apps to return (default: 10)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        count: String(args.count ?? 10),
      };

      if (args.group) params.group = args.group;
      if (args.site) params.site = args.site;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);

      const results = await client.get("/apprf/v1/top_applications", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_application_stats
  server.registerTool(
    "get_application_stats",
    {
      description: "Get statistics for a specific application",
      inputSchema: {
        application_name: z.string().describe("Application name (e.g. 'YouTube', 'Netflix')"),
        group: z.string().optional().describe("Filter by group name"),
        site: z.string().optional().describe("Filter by site name"),
        from_timestamp: z
          .number()
          .optional()
          .describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z.number().optional().describe("End time (Unix timestamp in seconds)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        application_name: args.application_name,
      };

      if (args.group) params.group = args.group;
      if (args.site) params.site = args.site;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);

      const result = await client.get("/apprf/v1/application/stats", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // get_client_application_usage
  server.registerTool(
    "get_client_application_usage",
    {
      description: "Get application usage for a specific client",
      inputSchema: {
        mac_address: z.string().describe("Client MAC address"),
        from_timestamp: z
          .number()
          .optional()
          .describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z.number().optional().describe("End time (Unix timestamp in seconds)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        mac: args.mac_address,
      };

      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);

      const result = await client.get("/apprf/v1/client/applications", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // get_application_categories
  server.registerTool(
    "get_application_categories",
    {
      description: "List application categories and their traffic statistics",
      inputSchema: {
        group: z.string().optional().describe("Filter by group name"),
        site: z.string().optional().describe("Filter by site name"),
        from_timestamp: z
          .number()
          .optional()
          .describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z.number().optional().describe("End time (Unix timestamp in seconds)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {};

      if (args.group) params.group = args.group;
      if (args.site) params.site = args.site;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);

      const results = await client.get("/apprf/v1/categories", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );
}
