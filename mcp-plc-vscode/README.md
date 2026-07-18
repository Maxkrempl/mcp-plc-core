# MCP PLC Core — VS Code Extension

**Connect any PLC to VS Code Copilot / Claude via MCP.**

Read sensors, check alarms, monitor production lines — all from inside VS Code. Works with Siemens, Schneider, ABB, WAGO, CODESYS, Arduino, or any custom PLC.

```
VS Code Copilot / Claude
    ↓ MCP protocol (inside VS Code)
MCP PLC VS Code Extension
    ↓ adapter (Modbus / S7 / custom)
PLC → Sensors, Alarms, Motors
```

## Features

- 🔌 **Connect to any PLC** — Modbus TCP or Siemens S7
- 📊 **Sidebar panel** — live sensor values + alarms tree
- 🤖 **MCP tools** — Copilot/Claude can read sensors, check alarms, get status
- ⚡ **Status bar** — always-visible PLC connection state
- 🔁 **Auto-polling** — configurable refresh interval
- 🛡️ **Safety limits** — setpoint writes validated before execution

## Install

### From Source

```bash
cd templates/mcp-plc-vscode
npm install
npm run build
```

Then in VS Code:
1. `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
2. Select the `.vscode-extension` or use `vsce package`

### As MCP Server (without extension)

Add to your `claude_desktop_config.json` or VS Code MCP settings:

```json
{
  "mcpServers": {
    "plc": {
      "command": "npx",
      "args": ["mcp-plc", "--adapter", "modbus"],
      "env": {
        "PLC_HOST": "192.168.1.100"
      }
    }
  }
}
```

## Usage

### 1. Connect to PLC

`Ctrl+Shift+P` → **MCP PLC: Connect to PLC**

Or click the `$(zap) PLC: Disconnected` status bar item.

### 2. Sidebar Panels

- **MCP PLC** panel in activity bar
  - **PLC Status** — live sensors, connection state
  - **Alarms** — active alarms with priority icons

### 3. Copilot Integration

Ask Copilot:
- "What's the temperature on the line?"
- "Are there any active alarms?"
- "Give me the full PLC status"
- "Set the temperature setpoint to 35°C"

### 4. Commands

| Command | Description |
|---------|-------------|
| `MCP PLC: Connect to PLC` | Connect to a PLC |
| `MCP PLC: Disconnect` | Disconnect from PLC |
| `MCP PLC: Read Sensor` | Pick and read a sensor |
| `MCP PLC: Get Alarms` | Show active alarms |
| `MCP PLC: Get All Data` | Open all data as JSON |
| `MCP PLC: Refresh Status` | Force status refresh |

## Configuration

```json
{
  "mcp-plc.host": "192.168.1.100",
  "mcp-plc.port": 502,
  "mcp-plc.adapter": "modbus",
  "mcp-plc.rack": 0,
  "mcp-plc.slot": 1,
  "mcp-plc.pollInterval": 2000
}
```

## Supported PLCs

| PLC | Adapter | Status |
|-----|---------|--------|
| Siemens S7-1200/1500 | `s7` | ✅ Built-in |
| Schneider M340/M580 | `modbus` | ✅ Built-in |
| ABB AC500 | `modbus` | ✅ Built-in |
| WAGO PFC200 | `modbus` | ✅ Built-in |
| CODESYS | `modbus` | ✅ Built-in |
| Arduino/ESP32 | `modbus` | ✅ Built-in |
| Mitsubishi / Omron / Allen-Bradley | custom | 🔨 Write adapter |

## Architecture

```
src/
└── extension.ts       ← VS Code extension (status bar, tree views, commands)
    ├── cmdConnect     → Quick pick adapter/host/port → connect
    ├── pollStatus     → Auto-refresh sensors + alarms
    ├── statusTree     → Sidebar: live sensor values
    ├── alarmTree      → Sidebar: active alarms with icons
    └── statusBar      → Bottom-right: connection state
```

## License

MIT

---

**HD WebDesign** — MCP for industrial automation
