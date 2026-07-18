#!/usr/bin/env node

/**
 * MCP PLC Core — CLI entry point.
 *
 * Usage:
 *   mcp-plc --adapter modbus --host 192.168.1.100 --port 502
 *   mcp-plc --adapter s7 --host 192.168.1.100 --port 102
 *   mcp-plc --adapter ./my-custom-adapter.js
 *
 * Environment variables:
 *   PLC_HOST       PLC IP address (default: 127.0.0.1)
 *   PLC_PORT       PLC port (default: depends on adapter)
 *   PLC_ADAPTER    Adapter name or path to custom adapter
 *   PLC_RACK       Rack number (S7 only, default: 0)
 *   PLC_SLOT       Slot number (S7 only, default: 1)
 */

import { startServer } from "./server.js";
import { PLCAdapter, AdapterConfig } from "./adapter.js";

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const adapterName = getArg("adapter", process.env.PLC_ADAPTER || "modbus");
const host = getArg("host", process.env.PLC_HOST || "127.0.0.1");
const port = parseInt(getArg("port", process.env.PLC_PORT || "0"));
const rack = parseInt(getArg("rack", process.env.PLC_RACK || "0"));
const slot = parseInt(getArg("slot", process.env.PLC_SLOT || "1"));

async function loadAdapter(): Promise<PLCAdapter> {
  // Built-in adapters
  if (adapterName === "modbus") {
    const { ModbusTCPAdapter } = await import("./adapters/modbus.js");
    return new ModbusTCPAdapter({ host, port: port || 502 });
  }

  if (adapterName === "s7") {
    const { S7Adapter } = await import("./adapters/s7.js");
    return new S7Adapter({ host, port: port || 102, rack, slot });
  }

  // Custom adapter — load from path
  const mod = await import(adapterName);
  const AdapterClass = mod.default || mod[Object.keys(mod)[0]];
  return new AdapterClass({ host, port });
}

async function main() {
  const adapter = await loadAdapter();

  // Setpoint safety limits — customize for your application
  const limits: Record<string, { min: number; max: number }> = {
    temperature: { min: 0, max: 50 },
    pressure: { min: 0, max: 10 },
    speed: { min: 0, max: 3000 },
  };

  await startServer({ adapter, limits });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
