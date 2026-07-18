/**
 * MCP PLC Core Server
 *
 * Generic MCP server for industrial PLC communication.
 * Works with any PLC via adapter pattern — implement PLCAdapter
 * for your specific PLC type.
 *
 * Tools:
 *   - read_sensor    → read sensor value
 *   - get_alarms     → get active alarms
 *   - get_status     → get system status
 *   - get_setpoints  → get current setpoints
 *   - write_setpoint → write setpoint (if adapter supports it)
 *   - get_all        → all data at once
 *
 * Resources:
 *   - plc://tags     → available tags/sensors
 *   - plc://alarms   → alarm definitions
 *   - plc://status   → current status
 *   - plc://info     → PLC and adapter info
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PLCAdapter } from "./adapter.js";
export interface MCPServerOptions {
    adapter: PLCAdapter;
    /** Safety limits for setpoints: { parameter: { min, max } } */
    limits?: Record<string, {
        min: number;
        max: number;
    }>;
}
export declare function createMCPServer(opts: MCPServerOptions): McpServer;
/**
 * Start MCP server with given adapter.
 */
export declare function startServer(opts: MCPServerOptions): Promise<void>;
//# sourceMappingURL=server.d.ts.map