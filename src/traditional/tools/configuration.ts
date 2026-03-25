import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArubaClient } from "../../client.js";
import { Config } from "../../config.js";

export function registerConfigurationTools(
  server: McpServer,
  client: ArubaClient,
  config: Config
): void {
  // list_groups
  server.registerTool(
    "list_groups",
    {
      description: "List all configuration groups",
      inputSchema: {
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      const results = await client.get("/configuration/v1/groups", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_group_details
  server.registerTool(
    "get_group_details",
    {
      description: "Get configuration details for a specific group",
      inputSchema: {
        group: z.string().describe("Group name"),
      },
    },
    async (args) => {
      const result = await client.get(`/configuration/v1/groups/${args.group}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // list_wlans
  server.registerTool(
    "list_wlans",
    {
      description: "List WLANs/SSIDs configured in a group",
      inputSchema: {
        group: z.string().describe("Group name"),
      },
    },
    async (args) => {
      const result = await client.get(`/configuration/v1/wlans/${args.group}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // get_wlan_details
  server.registerTool(
    "get_wlan_details",
    {
      description: "Get configuration details for a specific WLAN",
      inputSchema: {
        group: z.string().describe("Group name"),
        ssid: z.string().describe("SSID name"),
      },
    },
    async (args) => {
      const result = await client.get(`/configuration/v1/wlans/${args.group}/${args.ssid}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // list_templates
  server.registerTool(
    "list_templates",
    {
      description: "List configuration templates",
      inputSchema: {
        group: z.string().describe("Group name"),
        device_type: z
          .enum(["IAP", "ArubaSwitch", "MobilityController", "CX"])
          .optional()
          .describe("Filter by device type"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        group: args.group,
      };

      if (args.device_type) params.device_type = args.device_type;

      const results = await client.get("/configuration/v1/templates", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // Write operations (gated by --enable-write)
  if (config.enableWrite) {
    // create_group
    server.registerTool(
      "create_group",
      {
        description: "Create a new configuration group",
        inputSchema: {
          group: z.string().describe("Group name"),
          group_password: z.string().optional().describe("Group password for APs"),
          architecture: z
            .enum(["Instant", "AOS10"])
            .optional()
            .describe("Architecture type (default: Instant)"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {
          group: args.group,
          architecture: args.architecture ?? "Instant",
        };

        if (args.group_password) body.group_password = args.group_password;

        const result = await client.post("/configuration/v1/groups", body);
        return {
          content: [
            {
              type: "text",
              text: `Group created: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // create_wlan
    server.registerTool(
      "create_wlan",
      {
        description: "Create a new WLAN/SSID in a group",
        inputSchema: {
          group: z.string().describe("Group name"),
          essid: z.string().describe("SSID name"),
          type: z
            .enum(["employee", "guest"])
            .optional()
            .describe("WLAN type (default: employee)"),
          opmode: z
            .enum(["open", "wpa2-psk", "wpa3-sae", "wpa2-8021x"])
            .optional()
            .describe("Security mode (default: open)"),
          wpa_passphrase: z
            .string()
            .optional()
            .describe("Pre-shared key (required for wpa2-psk/wpa3-sae)"),
          vlan_id: z.number().optional().describe("VLAN ID"),
          hide_ssid: z.boolean().optional().describe("Hide SSID broadcast (default: false)"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {
          essid: args.essid,
          type: args.type ?? "employee",
          opmode: args.opmode ?? "open",
          hide_ssid: args.hide_ssid ?? false,
        };

        if (args.wpa_passphrase) body.wpa_passphrase = args.wpa_passphrase;
        if (args.vlan_id) body.vlan = args.vlan_id;

        const result = await client.post(`/configuration/v1/wlans/${args.group}`, body);
        return {
          content: [
            {
              type: "text",
              text: `WLAN created: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // update_wlan
    server.registerTool(
      "update_wlan",
      {
        description: "Update an existing WLAN configuration",
        inputSchema: {
          group: z.string().describe("Group name"),
          ssid: z.string().describe("SSID name"),
          wpa_passphrase: z.string().optional().describe("New pre-shared key"),
          vlan_id: z.number().optional().describe("New VLAN ID"),
          hide_ssid: z.boolean().optional().describe("Hide SSID broadcast"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {};

        if (args.wpa_passphrase !== undefined) body.wpa_passphrase = args.wpa_passphrase;
        if (args.vlan_id !== undefined) body.vlan = args.vlan_id;
        if (args.hide_ssid !== undefined) body.hide_ssid = args.hide_ssid;

        if (Object.keys(body).length === 0) {
          throw new Error("At least one field must be provided for update");
        }

        const result = await client.patch(
          `/configuration/v1/wlans/${args.group}/${args.ssid}`,
          body
        );
        return {
          content: [
            {
              type: "text",
              text: `WLAN updated: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // delete_wlan
    server.registerTool(
      "delete_wlan",
      {
        description: "Delete a WLAN/SSID",
        inputSchema: {
          group: z.string().describe("Group name"),
          ssid: z.string().describe("SSID name"),
        },
      },
      async (args) => {
        const result = await client.delete(`/configuration/v1/wlans/${args.group}/${args.ssid}`);
        return {
          content: [
            {
              type: "text",
              text: `WLAN deleted: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );
  }
}
