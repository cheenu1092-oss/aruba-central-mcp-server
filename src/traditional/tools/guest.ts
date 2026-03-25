import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArubaClient } from "../../client.js";
import { Config } from "../../config.js";

export function registerGuestTools(server: McpServer, client: ArubaClient, config: Config): void {
  // list_guest_visitors
  server.registerTool(
    "list_guest_visitors",
    {
      description: "List guest visitors and their access status",
      inputSchema: {
        status: z
          .enum(["active", "expired", "all"])
          .optional()
          .describe("Filter by visitor status"),
        from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        to_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      if (args.status && args.status !== "all") {
        params.status = args.status;
      }
      if (args.from_date) params.from_date = args.from_date;
      if (args.to_date) params.to_date = args.to_date;

      const results = await client.get("/guest/v1/visitors", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_visitor_details
  server.registerTool(
    "get_visitor_details",
    {
      description: "Get details about a specific guest visitor",
      inputSchema: {
        visitor_id: z.string().describe("Visitor ID"),
      },
    },
    async (args) => {
      const result = await client.get(`/guest/v1/visitors/${args.visitor_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // list_guest_portals
  server.registerTool(
    "list_guest_portals",
    {
      description: "List configured guest portals",
      inputSchema: {
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      const results = await client.get("/guest/v1/portals", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // Write operations (gated by --enable-write)
  if (config.enableWrite) {
    // create_visitor
    server.registerTool(
      "create_visitor",
      {
        description: "Create a new guest visitor account",
        inputSchema: {
          name: z.string().describe("Visitor name"),
          email: z.string().optional().describe("Visitor email"),
          phone: z.string().optional().describe("Visitor phone number"),
          company: z.string().optional().describe("Visitor company name"),
          valid_from: z.string().optional().describe("Access start time (ISO 8601)"),
          valid_until: z.string().describe("Access end time (ISO 8601)"),
          notify_visitor: z
            .boolean()
            .optional()
            .describe("Send credentials to visitor (default: false)"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {
          name: args.name,
          valid_until: args.valid_until,
          notify_visitor: args.notify_visitor ?? false,
        };

        if (args.email) body.email = args.email;
        if (args.phone) body.phone = args.phone;
        if (args.company) body.company = args.company;
        if (args.valid_from) body.valid_from = args.valid_from;

        const result = await client.post("/guest/v1/visitors", body);
        return {
          content: [
            {
              type: "text",
              text: `Visitor created: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // update_visitor
    server.registerTool(
      "update_visitor",
      {
        description: "Update an existing guest visitor",
        inputSchema: {
          visitor_id: z.string().describe("Visitor ID"),
          name: z.string().optional().describe("New visitor name"),
          email: z.string().optional().describe("New visitor email"),
          valid_until: z.string().optional().describe("New access end time (ISO 8601)"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {};

        if (args.name !== undefined) body.name = args.name;
        if (args.email !== undefined) body.email = args.email;
        if (args.valid_until !== undefined) body.valid_until = args.valid_until;

        if (Object.keys(body).length === 0) {
          throw new Error("At least one field must be provided for update");
        }

        const result = await client.patch(`/guest/v1/visitors/${args.visitor_id}`, body);
        return {
          content: [
            {
              type: "text",
              text: `Visitor updated: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // delete_visitor
    server.registerTool(
      "delete_visitor",
      {
        description: "Delete a guest visitor account",
        inputSchema: {
          visitor_id: z.string().describe("Visitor ID"),
        },
      },
      async (args) => {
        const result = await client.delete(`/guest/v1/visitors/${args.visitor_id}`);
        return {
          content: [
            {
              type: "text",
              text: `Visitor deleted: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );
  }
}
