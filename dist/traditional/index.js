#!/usr/bin/env node
import {
  ArubaClient
} from "../chunk-DSECFFA3.js";

// src/traditional/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/traditional/tools/monitoring.ts
import { z } from "zod";
function registerMonitoringTools(server, client) {
  server.registerTool(
    "list_devices",
    {
      description: "List all devices (APs, switches, gateways) with status and health",
      inputSchema: {
        device_type: z.enum(["ACCESS POINTS", "SWITCHES", "GATEWAYS", "ALL"]).optional().describe("Filter by device type"),
        status: z.enum(["Up", "Down"]).optional().describe("Filter by connectivity status"),
        site: z.string().optional().describe("Filter by site name"),
        group: z.string().optional().describe("Filter by group name"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      if (args.device_type && args.device_type !== "ALL") {
        params.device_type = args.device_type;
      }
      if (args.status) params.status = args.status;
      if (args.site) params.site = args.site;
      if (args.group) params.group = args.group;
      const results = await client.get("/monitoring/v2/devices", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_device_details",
    {
      description: "Get detailed information about a specific device",
      inputSchema: {
        serial: z.string().describe("Device serial number")
      }
    },
    async (args) => {
      const result = await client.get(`/monitoring/v1/devices/${args.serial}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "list_clients",
    {
      description: "List connected wireless and wired clients",
      inputSchema: {
        network: z.enum(["wireless", "wired", "all"]).optional().describe("Network type filter"),
        site: z.string().optional().describe("Filter by site name"),
        group: z.string().optional().describe("Filter by group name"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      if (args.network && args.network !== "all") {
        params.network = args.network;
      }
      if (args.site) params.site = args.site;
      if (args.group) params.group = args.group;
      const results = await client.get("/monitoring/v1/clients", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_client_details",
    {
      description: "Get detailed information about a specific client",
      inputSchema: {
        mac_address: z.string().describe("Client MAC address")
      }
    },
    async (args) => {
      const result = await client.get(`/monitoring/v1/clients/${args.mac_address}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "list_events",
    {
      description: "List network events and alerts",
      inputSchema: {
        event_type: z.string().optional().describe("Filter by event type (e.g. 'Gateway', 'AP', 'Client')"),
        severity: z.enum(["critical", "major", "minor", "warning", "info"]).optional().describe("Filter by severity level"),
        from_timestamp: z.number().optional().describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z.number().optional().describe("End time (Unix timestamp in seconds)"),
        limit: z.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      if (args.event_type) params.event_type = args.event_type;
      if (args.severity) params.severity = args.severity;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);
      const results = await client.get("/central/v1/events", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_network_health",
    {
      description: "Get overall network health summary",
      inputSchema: {
        site: z.string().optional().describe("Filter by site name"),
        group: z.string().optional().describe("Filter by group name")
      }
    },
    async (args) => {
      const params = {};
      if (args.site) params.site = args.site;
      if (args.group) params.group = args.group;
      const result = await client.get("/monitoring/v1/networks/health", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
}

// src/traditional/tools/devices.ts
import { z as z2 } from "zod";
function registerDeviceTools(server, client, config) {
  server.registerTool(
    "get_device_inventory",
    {
      description: "Get device inventory (subscription, licenses, hardware details)",
      inputSchema: {
        serial: z2.string().optional().describe("Filter by device serial number"),
        sku: z2.string().optional().describe("Filter by SKU/part number"),
        limit: z2.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      if (args.serial) params.serial = args.serial;
      if (args.sku) params.sku = args.sku;
      const results = await client.get("/platform/device_inventory/v1/devices", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_firmware_compliance",
    {
      description: "Check firmware compliance status across devices",
      inputSchema: {
        device_type: z2.enum(["IAP", "MAS", "HP", "CONTROLLER"]).optional().describe("Filter by device type"),
        group: z2.string().optional().describe("Filter by group name")
      }
    },
    async (args) => {
      const params = {};
      if (args.device_type) params.device_type = args.device_type;
      if (args.group) params.group = args.group;
      const result = await client.get("/firmware/v1/upgrade/compliance", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  if (config.enableWrite) {
    server.registerTool(
      "provision_device",
      {
        description: "Provision a device to a group",
        inputSchema: {
          serial: z2.string().describe("Device serial number"),
          group: z2.string().describe("Target group name"),
          mac_address: z2.string().optional().describe("MAC address (required for some device types)")
        }
      },
      async (args) => {
        const body = {
          serial: args.serial,
          group: args.group
        };
        if (args.mac_address) body.mac_address = args.mac_address;
        const result = await client.post("/configuration/v1/devices/provision", body);
        return {
          content: [
            {
              type: "text",
              text: `Device provisioned: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "move_device",
      {
        description: "Move a device to a different group",
        inputSchema: {
          serial: z2.string().describe("Device serial number"),
          group: z2.string().describe("Target group name")
        }
      },
      async (args) => {
        const body = {
          serial: args.serial,
          group: args.group
        };
        const result = await client.post("/configuration/v1/devices/move", body);
        return {
          content: [
            {
              type: "text",
              text: `Device moved: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "reboot_device",
      {
        description: "Reboot a device remotely",
        inputSchema: {
          serial: z2.string().describe("Device serial number")
        }
      },
      async (args) => {
        const body = {
          serial: args.serial
        };
        const result = await client.post("/device_management/v1/device/reboot", body);
        return {
          content: [
            {
              type: "text",
              text: `Device reboot initiated: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "upgrade_firmware",
      {
        description: "Upgrade device firmware",
        inputSchema: {
          serial: z2.string().describe("Device serial number"),
          firmware_version: z2.string().describe("Target firmware version"),
          reboot: z2.boolean().optional().describe("Reboot after upgrade (default: true)")
        }
      },
      async (args) => {
        const body = {
          serial: args.serial,
          firmware_version: args.firmware_version,
          reboot: args.reboot ?? true
        };
        const result = await client.post("/firmware/v1/upgrade", body);
        return {
          content: [
            {
              type: "text",
              text: `Firmware upgrade initiated: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
  }
}

// src/traditional/tools/configuration.ts
import { z as z3 } from "zod";
function registerConfigurationTools(server, client, config) {
  server.registerTool(
    "list_groups",
    {
      description: "List all configuration groups",
      inputSchema: {
        limit: z3.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      const results = await client.get("/configuration/v1/groups", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_group_details",
    {
      description: "Get configuration details for a specific group",
      inputSchema: {
        group: z3.string().describe("Group name")
      }
    },
    async (args) => {
      const result = await client.get(`/configuration/v1/groups/${args.group}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "list_wlans",
    {
      description: "List WLANs/SSIDs configured in a group",
      inputSchema: {
        group: z3.string().describe("Group name")
      }
    },
    async (args) => {
      const result = await client.get(`/configuration/v1/wlans/${args.group}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_wlan_details",
    {
      description: "Get configuration details for a specific WLAN",
      inputSchema: {
        group: z3.string().describe("Group name"),
        ssid: z3.string().describe("SSID name")
      }
    },
    async (args) => {
      const result = await client.get(`/configuration/v1/wlans/${args.group}/${args.ssid}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "list_templates",
    {
      description: "List configuration templates",
      inputSchema: {
        group: z3.string().describe("Group name"),
        device_type: z3.enum(["IAP", "ArubaSwitch", "MobilityController", "CX"]).optional().describe("Filter by device type")
      }
    },
    async (args) => {
      const params = {
        group: args.group
      };
      if (args.device_type) params.device_type = args.device_type;
      const results = await client.get("/configuration/v1/templates", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  if (config.enableWrite) {
    server.registerTool(
      "create_group",
      {
        description: "Create a new configuration group",
        inputSchema: {
          group: z3.string().describe("Group name"),
          group_password: z3.string().optional().describe("Group password for APs"),
          architecture: z3.enum(["Instant", "AOS10"]).optional().describe("Architecture type (default: Instant)")
        }
      },
      async (args) => {
        const body = {
          group: args.group,
          architecture: args.architecture ?? "Instant"
        };
        if (args.group_password) body.group_password = args.group_password;
        const result = await client.post("/configuration/v1/groups", body);
        return {
          content: [
            {
              type: "text",
              text: `Group created: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "create_wlan",
      {
        description: "Create a new WLAN/SSID in a group",
        inputSchema: {
          group: z3.string().describe("Group name"),
          essid: z3.string().describe("SSID name"),
          type: z3.enum(["employee", "guest"]).optional().describe("WLAN type (default: employee)"),
          opmode: z3.enum(["open", "wpa2-psk", "wpa3-sae", "wpa2-8021x"]).optional().describe("Security mode (default: open)"),
          wpa_passphrase: z3.string().optional().describe("Pre-shared key (required for wpa2-psk/wpa3-sae)"),
          vlan_id: z3.number().optional().describe("VLAN ID"),
          hide_ssid: z3.boolean().optional().describe("Hide SSID broadcast (default: false)")
        }
      },
      async (args) => {
        const body = {
          essid: args.essid,
          type: args.type ?? "employee",
          opmode: args.opmode ?? "open",
          hide_ssid: args.hide_ssid ?? false
        };
        if (args.wpa_passphrase) body.wpa_passphrase = args.wpa_passphrase;
        if (args.vlan_id) body.vlan = args.vlan_id;
        const result = await client.post(`/configuration/v1/wlans/${args.group}`, body);
        return {
          content: [
            {
              type: "text",
              text: `WLAN created: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "update_wlan",
      {
        description: "Update an existing WLAN configuration",
        inputSchema: {
          group: z3.string().describe("Group name"),
          ssid: z3.string().describe("SSID name"),
          wpa_passphrase: z3.string().optional().describe("New pre-shared key"),
          vlan_id: z3.number().optional().describe("New VLAN ID"),
          hide_ssid: z3.boolean().optional().describe("Hide SSID broadcast")
        }
      },
      async (args) => {
        const body = {};
        if (args.wpa_passphrase !== void 0) body.wpa_passphrase = args.wpa_passphrase;
        if (args.vlan_id !== void 0) body.vlan = args.vlan_id;
        if (args.hide_ssid !== void 0) body.hide_ssid = args.hide_ssid;
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
              text: `WLAN updated: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "delete_wlan",
      {
        description: "Delete a WLAN/SSID",
        inputSchema: {
          group: z3.string().describe("Group name"),
          ssid: z3.string().describe("SSID name")
        }
      },
      async (args) => {
        const result = await client.delete(`/configuration/v1/wlans/${args.group}/${args.ssid}`);
        return {
          content: [
            {
              type: "text",
              text: `WLAN deleted: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
  }
}

// src/traditional/tools/apprf.ts
import { z as z4 } from "zod";
function registerApprfTools(server, client) {
  server.registerTool(
    "get_top_applications",
    {
      description: "Get top applications by traffic/usage",
      inputSchema: {
        group: z4.string().optional().describe("Filter by group name"),
        site: z4.string().optional().describe("Filter by site name"),
        from_timestamp: z4.number().optional().describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z4.number().optional().describe("End time (Unix timestamp in seconds)"),
        count: z4.number().optional().describe("Number of top apps to return (default: 10)")
      }
    },
    async (args) => {
      const params = {
        count: String(args.count ?? 10)
      };
      if (args.group) params.group = args.group;
      if (args.site) params.site = args.site;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);
      const results = await client.get("/apprf/v1/top_applications", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_application_stats",
    {
      description: "Get statistics for a specific application",
      inputSchema: {
        application_name: z4.string().describe("Application name (e.g. 'YouTube', 'Netflix')"),
        group: z4.string().optional().describe("Filter by group name"),
        site: z4.string().optional().describe("Filter by site name"),
        from_timestamp: z4.number().optional().describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z4.number().optional().describe("End time (Unix timestamp in seconds)")
      }
    },
    async (args) => {
      const params = {
        application_name: args.application_name
      };
      if (args.group) params.group = args.group;
      if (args.site) params.site = args.site;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);
      const result = await client.get("/apprf/v1/application/stats", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_client_application_usage",
    {
      description: "Get application usage for a specific client",
      inputSchema: {
        mac_address: z4.string().describe("Client MAC address"),
        from_timestamp: z4.number().optional().describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z4.number().optional().describe("End time (Unix timestamp in seconds)")
      }
    },
    async (args) => {
      const params = {
        mac: args.mac_address
      };
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);
      const result = await client.get("/apprf/v1/client/applications", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_application_categories",
    {
      description: "List application categories and their traffic statistics",
      inputSchema: {
        group: z4.string().optional().describe("Filter by group name"),
        site: z4.string().optional().describe("Filter by site name"),
        from_timestamp: z4.number().optional().describe("Start time (Unix timestamp in seconds)"),
        to_timestamp: z4.number().optional().describe("End time (Unix timestamp in seconds)")
      }
    },
    async (args) => {
      const params = {};
      if (args.group) params.group = args.group;
      if (args.site) params.site = args.site;
      if (args.from_timestamp) params.from_timestamp = String(args.from_timestamp);
      if (args.to_timestamp) params.to_timestamp = String(args.to_timestamp);
      const results = await client.get("/apprf/v1/categories", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
}

// src/traditional/tools/guest.ts
import { z as z5 } from "zod";
function registerGuestTools(server, client, config) {
  server.registerTool(
    "list_guest_visitors",
    {
      description: "List guest visitors and their access status",
      inputSchema: {
        status: z5.enum(["active", "expired", "all"]).optional().describe("Filter by visitor status"),
        from_date: z5.string().optional().describe("Start date (YYYY-MM-DD)"),
        to_date: z5.string().optional().describe("End date (YYYY-MM-DD)"),
        limit: z5.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      if (args.status && args.status !== "all") {
        params.status = args.status;
      }
      if (args.from_date) params.from_date = args.from_date;
      if (args.to_date) params.to_date = args.to_date;
      const results = await client.get("/guest/v1/visitors", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  server.registerTool(
    "get_visitor_details",
    {
      description: "Get details about a specific guest visitor",
      inputSchema: {
        visitor_id: z5.string().describe("Visitor ID")
      }
    },
    async (args) => {
      const result = await client.get(`/guest/v1/visitors/${args.visitor_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  server.registerTool(
    "list_guest_portals",
    {
      description: "List configured guest portals",
      inputSchema: {
        limit: z5.number().optional().describe("Maximum number of results (default: 100)")
      }
    },
    async (args) => {
      const params = {
        limit: String(args.limit ?? 100)
      };
      const results = await client.get("/guest/v1/portals", params);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  if (config.enableWrite) {
    server.registerTool(
      "create_visitor",
      {
        description: "Create a new guest visitor account",
        inputSchema: {
          name: z5.string().describe("Visitor name"),
          email: z5.string().optional().describe("Visitor email"),
          phone: z5.string().optional().describe("Visitor phone number"),
          company: z5.string().optional().describe("Visitor company name"),
          valid_from: z5.string().optional().describe("Access start time (ISO 8601)"),
          valid_until: z5.string().describe("Access end time (ISO 8601)"),
          notify_visitor: z5.boolean().optional().describe("Send credentials to visitor (default: false)")
        }
      },
      async (args) => {
        const body = {
          name: args.name,
          valid_until: args.valid_until,
          notify_visitor: args.notify_visitor ?? false
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
              text: `Visitor created: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "update_visitor",
      {
        description: "Update an existing guest visitor",
        inputSchema: {
          visitor_id: z5.string().describe("Visitor ID"),
          name: z5.string().optional().describe("New visitor name"),
          email: z5.string().optional().describe("New visitor email"),
          valid_until: z5.string().optional().describe("New access end time (ISO 8601)")
        }
      },
      async (args) => {
        const body = {};
        if (args.name !== void 0) body.name = args.name;
        if (args.email !== void 0) body.email = args.email;
        if (args.valid_until !== void 0) body.valid_until = args.valid_until;
        if (Object.keys(body).length === 0) {
          throw new Error("At least one field must be provided for update");
        }
        const result = await client.patch(`/guest/v1/visitors/${args.visitor_id}`, body);
        return {
          content: [
            {
              type: "text",
              text: `Visitor updated: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
    server.registerTool(
      "delete_visitor",
      {
        description: "Delete a guest visitor account",
        inputSchema: {
          visitor_id: z5.string().describe("Visitor ID")
        }
      },
      async (args) => {
        const result = await client.delete(`/guest/v1/visitors/${args.visitor_id}`);
        return {
          content: [
            {
              type: "text",
              text: `Visitor deleted: ${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }
    );
  }
}

// src/traditional/index.ts
async function main() {
  const config = {
    clientId: process.env.ARUBA_CLIENT_ID ?? "",
    clientSecret: process.env.ARUBA_CLIENT_SECRET ?? "",
    customerId: process.env.ARUBA_CUSTOMER_ID ?? "",
    username: process.env.ARUBA_USERNAME ?? "",
    password: process.env.ARUBA_PASSWORD ?? "",
    baseUrl: process.env.ARUBA_BASE_URL ?? "https://apigw-prod2.central.arubanetworks.com",
    verifySsl: process.env.ARUBA_VERIFY_SSL !== "false",
    enableWrite: process.env.ARUBA_ENABLE_WRITE === "true"
  };
  if (!config.clientId || !config.clientSecret || !config.customerId || !config.username || !config.password) {
    throw new Error(
      "Missing required environment variables. Set ARUBA_CLIENT_ID, ARUBA_CLIENT_SECRET, ARUBA_CUSTOMER_ID, ARUBA_USERNAME, ARUBA_PASSWORD"
    );
  }
  const client = new ArubaClient(config);
  const server = new McpServer({
    name: "aruba-central-mcp-server",
    version: "1.0.0"
  });
  registerMonitoringTools(server, client);
  registerDeviceTools(server, client, config);
  registerConfigurationTools(server, client, config);
  registerApprfTools(server, client);
  registerGuestTools(server, client, config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aruba Central MCP Server running on stdio");
  console.error(`Write operations: ${config.enableWrite ? "ENABLED" : "DISABLED"}`);
}
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
