/**
 * mcp-plc-core — MCP Server for industrial PLC communication.
 *
 * Usage:
 *   import { startServer, ModbusTCPAdapter } from "mcp-plc-core";
 *
 *   const adapter = new ModbusTCPAdapter({ host: "192.168.1.100", port: 502 });
 *   await startServer({ adapter, limits: { temperature: { min: 0, max: 50 } } });
 */

export { PLCAdapter, AdapterConfig, SensorData, AlarmData, Alarm, StatusData, SetpointData, OutputData } from "./adapter.js";
export { createMCPServer, startServer, MCPServerOptions } from "./server.js";
export { ModbusTCPAdapter, ModbusAdapterConfig } from "./adapters/modbus.js";
export { S7Adapter, S7AdapterConfig } from "./adapters/s7.js";
