# MCP PLC Core 🏭

**Universal MCP Server for industrial PLC communication.**

Bring your own adapter — works with any PLC: Siemens, Schneider, ABB, WAGO, CODESYS, Arduino, or custom.

```
AI Agent (Claude, GPT, OpenClaw)
    ↓ MCP protocol (stdio)
MCP PLC Core
    ↓ your adapter (Modbus, S7, OPC UA, EtherNet/IP...)
PLC → Sensors, Alarms, Motors, Actuators
```

## Quick Start

```bash
# Install
npm install mcp-plc-core

# Run with Modbus (default)
PLC_HOST=192.168.1.100 npx mcp-plc --adapter modbus

# Run with Siemens S7
npm install nodes7
PLC_HOST=192.168.1.100 npx mcp-plc --adapter s7
```

## Built-in Adapters

| Adapter | Protocol | Port | PLC Types |
|---------|----------|------|-----------|
| `modbus` | Modbus TCP | 502 | Schneider, ABB, WAGO, CODESYS, Arduino |
| `s7` | S7 (RFC1006) | 102 | Siemens S7-1200/1500/300/400 |

## Custom Adapter

Implement the `PLCAdapter` interface for your PLC:

```typescript
import { PLCAdapter, SensorData, AlarmData, StatusData, SetpointData, OutputData } from "mcp-plc-core";

export class MyPLCAdapter implements PLCAdapter {
  readonly name = "My PLC";
  readonly protocol = "my-protocol";

  async connect() { /* ... */ }
  async disconnect() { /* ... */ }
  isConnected(): boolean { /* ... */ }

  async readSensors(): Promise<SensorData> {
    return {
      temperature: 25.3,
      pressure: 6.2,
      motorSpeed: 1500,
      production: 1234,
    };
  }

  async readAlarms(): Promise<AlarmData> {
    return { active: [], count: 0 };
  }

  async readStatus(): Promise<StatusData> {
    return { status: "running" };
  }

  async readSetpoints(): Promise<SetpointData> {
    return { temperature: 25, pressure: 6, speed: 1500 };
  }

  async readOutputs(): Promise<OutputData> {
    return { green: true, yellow: false, red: false };
  }

  async writeSetpoint(parameter: string, value: number): Promise<boolean> {
    // Write to your PLC...
    return true;
  }
}
```

Then use it:

```typescript
import { startServer, MyPLCAdapter } from "mcp-plc-core";

const adapter = new MyPLCAdapter();
await startServer({
  adapter,
  limits: {
    temperature: { min: 0, max: 50 },
    pressure: { min: 0, max: 10 },
  },
});
```

## MCP AI Integration

### Claude Desktop / OpenClaw

```json
{
  "mcpServers": {
    "plc": {
      "command": "npx",
      "args": ["mcp-plc", "--adapter", "modbus"],
      "env": {
        "PLC_HOST": "192.168.1.100",
        "PLC_PORT": "502"
      }
    }
  }
}
```

### Siemens S7

```json
{
  "mcpServers": {
    "plc": {
      "command": "npx",
      "args": ["mcp-plc", "--adapter", "s7"],
      "env": {
        "PLC_HOST": "192.168.1.100",
        "PLC_SLOT": "1"
      }
    }
  }
}
```

## Tools

| Tool | Description | Example |
|------|-------------|---------|
| `read_sensor` | Read sensor value | "What's the temperature?" |
| `get_alarms` | Get active alarms | "Any alarms active?" |
| `get_status` | Full system status | "How's the line running?" |
| `get_setpoints` | Current setpoints | "What are the setpoints?" |
| `write_setpoint` | Write setpoint (safe!) | "Set temperature to 35°C" |
| `get_all` | Everything at once | "Give me all data" |

## Resources

| Resource | Description |
|----------|-------------|
| `plc://tags` | Available sensors/tags |
| `plc://alarms` | Alarm definitions |
| `plc://status` | Current status |
| `plc://info` | PLC and adapter info |

## Safety

- ✅ **Read-only by default** — no writes without explicit tool call
- ✅ **Safety limits** — configurable min/max for setpoints
- ✅ **Audit logging** — all tool calls logged
- ✅ **Adapter isolation** — protocol-specific errors don't leak
- ⚠️ **Write protection** — only setpoint registers, never I/O directly

## Architecture

```
src/
├── adapter.ts          ← PLCAdapter interface (implement this)
├── server.ts           ← MCP server (generic, adapter-agnostic)
├── cli.ts              ← CLI entry point
├── index.ts            ← Package exports
└── adapters/
    ├── modbus.ts       ← Modbus TCP adapter (built-in)
    └── s7.ts           ← Siemens S7 adapter (built-in)

examples/
├── custom-adapter.ts   ← How to write your own adapter
└── multi-plc.ts        ← Multiple PLCs in one server
```

## Writing a New Adapter

1. Create `src/adapters/myplc.ts`
2. Implement `PLCAdapter` interface
3. Register in `cli.ts`:

```typescript
if (adapterName === "myplc") {
  const { MyPLCAdapter } = await import("./adapters/myplc.js");
  return new MyPLCAdapter({ host, port });
}
```

4. Submit PR! 🎉

## Supported Protocols (via adapters)

| Protocol | Status | Adapter |
|----------|--------|---------|
| Modbus TCP | ✅ Built-in | `modbus` |
| S7 (RFC1006) | ✅ Built-in | `s7` |
| OPC UA | 🔜 Planned | — |
| EtherNet/IP | 🔜 Planned | — |
| BACnet | 🔜 Planned | — |
| MQTT + Sparkplug B | 🔜 Planned | — |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PLC_HOST` | `127.0.0.1` | PLC IP address |
| `PLC_PORT` | varies | PLC port (502 for Modbus, 102 for S7) |
| `PLC_ADAPTER` | `modbus` | Adapter to use |
| `PLC_RACK` | `0` | Rack number (S7 only) |
| `PLC_SLOT` | `1` | Slot number (S7: 1, S7-300/400: 2) |

## License

MIT — use it, fork it, build adapters for your PLC.

---

**HD WebDesign** — MCP for industrial automation
