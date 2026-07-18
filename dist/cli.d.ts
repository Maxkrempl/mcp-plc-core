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
export {};
//# sourceMappingURL=cli.d.ts.map