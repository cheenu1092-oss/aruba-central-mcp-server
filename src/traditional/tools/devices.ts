import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ArubaClient } from "../../client.js";
import { Config } from "../../config.js";

export function registerDeviceTools(server: McpServer, client: ArubaClient, config: Config): void {
  // get_device_inventory
  server.registerTool(
    "get_device_inventory",
    {
      description: "Get device inventory (subscription, licenses, hardware details)",
      inputSchema: {
        serial: z.string().optional().describe("Filter by device serial number"),
        sku: z.string().optional().describe("Filter by SKU/part number"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {
        limit: String(args.limit ?? 100),
      };

      if (args.serial) params.serial = args.serial;
      if (args.sku) params.sku = args.sku;

      const results = await client.get("/platform/device_inventory/v1/devices", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // get_firmware_compliance
  server.registerTool(
    "get_firmware_compliance",
    {
      description: "Check firmware compliance status across devices",
      inputSchema: {
        device_type: z
          .enum(["IAP", "MAS", "HP", "CONTROLLER"])
          .optional()
          .describe("Filter by device type"),
        group: z.string().optional().describe("Filter by group name"),
      },
    },
    async (args) => {
      const params: Record<string, string> = {};
      if (args.device_type) params.device_type = args.device_type;
      if (args.group) params.group = args.group;

      const result = await client.get("/firmware/v1/upgrade/compliance", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Write operations (gated by --enable-write)
  if (config.enableWrite) {
    // provision_device
    server.registerTool(
      "provision_device",
      {
        description: "Provision a device to a group",
        inputSchema: {
          serial: z.string().describe("Device serial number"),
          group: z.string().describe("Target group name"),
          mac_address: z.string().optional().describe("MAC address (required for some device types)"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {
          serial: args.serial,
          group: args.group,
        };

        if (args.mac_address) body.mac_address = args.mac_address;

        const result = await client.post("/configuration/v1/devices/provision", body);
        return {
          content: [
            {
              type: "text",
              text: `Device provisioned: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // move_device
    server.registerTool(
      "move_device",
      {
        description: "Move a device to a different group",
        inputSchema: {
          serial: z.string().describe("Device serial number"),
          group: z.string().describe("Target group name"),
        },
      },
      async (args) => {
        const body = {
          serial: args.serial,
          group: args.group,
        };

        const result = await client.post("/configuration/v1/devices/move", body);
        return {
          content: [
            {
              type: "text",
              text: `Device moved: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // reboot_device
    server.registerTool(
      "reboot_device",
      {
        description: "Reboot a device remotely",
        inputSchema: {
          serial: z.string().describe("Device serial number"),
        },
      },
      async (args) => {
        const body = {
          serial: args.serial,
        };

        const result = await client.post("/device_management/v1/device/reboot", body);
        return {
          content: [
            {
              type: "text",
              text: `Device reboot initiated: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );

    // upgrade_firmware
    server.registerTool(
      "upgrade_firmware",
      {
        description: "Upgrade device firmware",
        inputSchema: {
          serial: z.string().describe("Device serial number"),
          firmware_version: z.string().describe("Target firmware version"),
          reboot: z.boolean().optional().describe("Reboot after upgrade (default: true)"),
        },
      },
      async (args) => {
        const body: Record<string, unknown> = {
          serial: args.serial,
          firmware_version: args.firmware_version,
          reboot: args.reboot ?? true,
        };

        const result = await client.post("/firmware/v1/upgrade", body);
        return {
          content: [
            {
              type: "text",
              text: `Firmware upgrade initiated: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }
    );
  }
}
