/**
 * mcp-plc-core — MCP Server for industrial PLC communication.
 *
 * Usage:
 *   import { startServer, ModbusTCPAdapter } from "mcp-plc-core";
 *
 *   const adapter = new ModbusTCPAdapter({ host: "192.168.1.100", port: 502 });
 *   await startServer({ adapter, limits: { temperature: { min: 0, max: 50 } } });
 */
export { createMCPServer, startServer } from "./server.js";
export { ModbusTCPAdapter } from "./adapters/modbus.js";
export { S7Adapter } from "./adapters/s7.js";
//# sourceMappingURL=index.js.map