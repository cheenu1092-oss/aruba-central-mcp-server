# 🌐 Aruba Central MCP Server

**MCP (Model Context Protocol) server for HPE Aruba Networking Central — AI-powered network management.**

> Manage your Aruba infrastructure (APs, switches, gateways) through AI agents.

## What This Is

An MCP server that wraps the [Aruba Central REST API](https://developer.arubanetworks.com/central/docs). Connect your AI agent (Claude, etc.) to:

- **Monitor**: Devices, clients, events, network health
- **Configure**: Groups, templates, WLANs, device settings
- **Manage**: Device inventory, provisioning, firmware
- **Analyze**: AppRF statistics, presence analytics, guest access

## Two Variants

| Variant | How It Works | Use Case |
|---------|--------------|----------|
| **Traditional** | Pre-built MCP tools (`list_devices`, `get_client_stats`, etc.) | Safe, discoverable operations |
| **Code Mode** | Agent gets API schema + executor, composes raw calls | Power users, edge cases, chaining |

## Installation

```bash
npm install -g aruba-central-mcp-server
# or
npx aruba-central-mcp-server
```

## Configuration

Create `.env`:

```bash
# Aruba Central OAuth Credentials (from API Gateway)
ARUBA_CLIENT_ID=your_client_id
ARUBA_CLIENT_SECRET=your_client_secret
ARUBA_CUSTOMER_ID=your_customer_id
ARUBA_USERNAME=your_username
ARUBA_PASSWORD=your_password

# API Base URL (regional)
ARUBA_BASE_URL=https://apigw-prod2.central.arubanetworks.com  # US East
# Or: apigw-uswest4.central.arubanetworks.com (US West)
# Or: apigw-apeast1.central.arubanetworks.com (APAC)
# Or: apigw-eucentral3.central.arubanetworks.com (EU)

# Optional
ARUBA_VERIFY_SSL=true
ARUBA_ENABLE_WRITE=false  # Enable write operations (POST/PUT/DELETE)
```

### Getting OAuth Credentials

1. Log into Aruba Central: https://central.arubanetworks.com
2. Go to **Account Home** → **Platform Integration** → **API Gateway**
3. Click **System Apps & Tokens** → **Add Apps & Tokens**
4. Create application, select API permissions, generate token
5. Copy `client_id`, `client_secret`, and `customer_id`

## Usage

### Traditional Mode (Pre-built Tools)

```bash
aruba-central-mcp-server traditional
# or
npm start
```

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aruba-central": {
      "command": "npx",
      "args": ["aruba-central-mcp-server", "traditional"],
      "env": {
        "ARUBA_CLIENT_ID": "...",
        "ARUBA_CLIENT_SECRET": "...",
        "ARUBA_CUSTOMER_ID": "..."
      }
    }
  }
}
```

### Code Mode (Full API Access)

```bash
aruba-central-mcp-server code-mode
```

## API Coverage

### ✅ Monitoring
- Device status, uptime, connectivity
- Client sessions, statistics, connectivity
- Network events and alerts
- Site/group monitoring

### ✅ Configuration
- Group management (WLAN, templates, variables)
- Device configuration (CLI, settings)
- Template management (AP, switch, gateway)
- WLAN/SSID configuration

### ✅ Device Inventory
- Device listing, filtering, search
- Provisioning and onboarding
- Firmware management
- License management

### ✅ Guest Access
- Visitor management
- Portal configuration
- Session tracking

### ✅ AppRF (Application Visibility)
- Top applications by traffic
- Application statistics per client/device

### 📋 Future
- Presence Analytics
- Location services
- WAN Health monitoring
- Security events

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Watch mode
npm run test:watch
```

## Architecture

```
src/
├── config.ts                  # OAuth token management
├── client.ts                  # REST client with token refresh
├── traditional/
│   ├── index.ts               # MCP server setup
│   └── tools/
│       ├── monitoring.ts      # Device/client monitoring
│       ├── devices.ts         # Device inventory
│       ├── configuration.ts   # Groups/templates/WLANs
│       ├── apprf.ts           # Application statistics
│       └── guest.ts           # Guest portal
└── code-mode/
    ├── index.ts               # Code mode server
    ├── schemas/               # API schemas
    └── executor.ts            # Sandboxed executor
```

## API Reference

- [Getting Started](https://developer.arubanetworks.com/central/docs/rest-api-getting-started)
- [API Reference](https://developer.arubanetworks.com/central/reference)
- [Python SDK](https://developer.arubanetworks.com/central/docs/python-getting-started)

## License

MIT

## Contributing

Part of [Net Infra MCP](https://github.com/cheenu1092-oss/net-infra-mcp) — the definitive collection of network infrastructure MCP servers.
