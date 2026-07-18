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
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PLCAdapter } from "./adapter.js";

export interface MCPServerOptions {
  adapter: PLCAdapter;
  /** Safety limits for setpoints: { parameter: { min, max } } */
  limits?: Record<string, { min: number; max: number }>;
}

export function createMCPServer(opts: MCPServerOptions) {
  const { adapter, limits = {} } = opts;

  const server = new McpServer({
    name: "mcp-plc",
    version: "1.0.0",
  });

  // ──────────────────────────────────────────────────────────
  // TOOLS
  // ──────────────────────────────────────────────────────────

  server.tool(
    "read_sensor",
    "Read a sensor value from the PLC.",
    {
      sensor: z.string().describe("Sensor name (e.g. temperature, pressure, motor_speed)"),
    },
    async ({ sensor }) => {
      try {
        const sensors = await adapter.readSensors();
        const value = sensors[sensor];

        if (value === undefined) {
          const available = Object.keys(sensors).join(", ");
          return {
            content: [{ type: "text" as const, text: `Unknown sensor: "${sensor}". Available: ${available}` }],
            isError: true,
          };
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              sensor,
              value,
              adapter: adapter.name,
              protocol: adapter.protocol,
              timestamp: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error reading sensor: ${err}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_alarms",
    "Get all active alarms from the PLC.",
    {},
    async () => {
      try {
        const alarms = await adapter.readAlarms();
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              adapter: adapter.name,
              activeCount: alarms.count,
              alarms: alarms.active,
              timestamp: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error reading alarms: ${err}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_status",
    "Get overall PLC system status.",
    {},
    async () => {
      try {
        const [status, sensors, alarms, setpoints, outputs] = await Promise.all([
          adapter.readStatus(),
          adapter.readSensors(),
          adapter.readAlarms(),
          adapter.readSetpoints(),
          adapter.readOutputs(),
        ]);

        const statusEmoji = {
          running: "🟢",
          stopped: "⚫",
          fault: "🔴",
          maintenance: "🟡",
        }[status.status] || "❓";

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              status: status.status,
              statusText: `${statusEmoji} ${status.status}`,
              adapter: {
                name: adapter.name,
                protocol: adapter.protocol,
                connected: adapter.isConnected(),
              },
              sensors,
              alarms: { count: alarms.count, active: alarms.active.map(a => a.code) },
              setpoints,
              outputs,
              timestamp: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error reading status: ${err}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_setpoints",
    "Get current setpoint values.",
    {},
    async () => {
      try {
        const setpoints = await adapter.readSetpoints();
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              adapter: adapter.name,
              setpoints,
              timestamp: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error reading setpoints: ${err}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "write_setpoint",
    "Write a setpoint value to the PLC. Validates against safety limits.",
    {
      parameter: z.string().describe("Parameter name (e.g. temperature, pressure, speed)"),
      value: z.number().describe("New setpoint value"),
    },
    async ({ parameter, value }) => {
      if (!adapter.writeSetpoint) {
        return {
          content: [{ type: "text" as const, text: `Write not supported by ${adapter.name} adapter.` }],
          isError: true,
        };
      }

      // Check safety limits
      const limit = limits[parameter];
      if (limit && (value < limit.min || value > limit.max)) {
        return {
          content: [{
            type: "text" as const,
            text: `⚠️ Safety limit: ${parameter} must be between ${limit.min} and ${limit.max}. Value ${value} rejected.`,
          }],
          isError: true,
        };
      }

      try {
        const success = await adapter.writeSetpoint(parameter, value);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success,
              parameter,
              newValue: value,
              adapter: adapter.name,
              timestamp: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error writing setpoint: ${err}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_all",
    "Get all PLC data at once: sensors, alarms, status, setpoints, outputs.",
    {},
    async () => {
      try {
        const [sensors, alarms, status, setpoints, outputs] = await Promise.all([
          adapter.readSensors(),
          adapter.readAlarms(),
          adapter.readStatus(),
          adapter.readSetpoints(),
          adapter.readOutputs(),
        ]);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              adapter: adapter.name,
              protocol: adapter.protocol,
              connected: adapter.isConnected(),
              sensors,
              alarms: { count: alarms.count, active: alarms.active },
              status: status.status,
              setpoints,
              outputs,
              timestamp: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err}` }],
          isError: true,
        };
      }
    }
  );

  // ──────────────────────────────────────────────────────────
  // RESOURCES
  // ──────────────────────────────────────────────────────────

  server.resource(
    "tags",
    "plc://tags",
    async () => {
      const sensors = await adapter.readSensors();
      return {
        contents: [{
          uri: "plc://tags",
          mimeType: "application/json",
          text: JSON.stringify({
            adapter: adapter.name,
            protocol: adapter.protocol,
            sensors: Object.keys(sensors).map(name => ({
              name,
              type: typeof sensors[name],
            })),
          }, null, 2),
        }],
      };
    }
  );

  server.resource(
    "alarms",
    "plc://alarms",
    async () => {
      const alarms = await adapter.readAlarms();
      return {
        contents: [{
          uri: "plc://alarms",
          mimeType: "application/json",
          text: JSON.stringify({
            adapter: adapter.name,
            alarms: alarms.active,
          }, null, 2),
        }],
      };
    }
  );

  server.resource(
    "status",
    "plc://status",
    async () => {
      const status = await adapter.readStatus();
      return {
        contents: [{
          uri: "plc://status",
          mimeType: "application/json",
          text: JSON.stringify({
            adapter: adapter.name,
            connected: adapter.isConnected(),
            ...status,
          }, null, 2),
        }],
      };
    }
  );

  server.resource(
    "info",
    "plc://info",
    async () => ({
      contents: [{
        uri: "plc://info",
        mimeType: "application/json",
        text: JSON.stringify({
          server: "mcp-plc-core",
          version: "1.0.0",
          adapter: adapter.name,
          protocol: adapter.protocol,
          connected: adapter.isConnected(),
          capabilities: {
            readSensors: true,
            readAlarms: true,
            readStatus: true,
            readSetpoints: true,
            readOutputs: true,
            writeSetpoint: !!adapter.writeSetpoint,
            readRaw: !!adapter.readRaw,
            writeRaw: !!adapter.writeRaw,
          },
          limits,
        }, null, 2),
      }],
    })
  );

  return server;
}

/**
 * Start MCP server with given adapter.
 */
export async function startServer(opts: MCPServerOptions) {
  const { adapter } = opts;

  console.error(`🔌 MCP PLC Core starting...`);
  console.error(`   Adapter: ${adapter.name} (${adapter.protocol})`);

  try {
    await adapter.connect();
    console.error(`✅ Connected to PLC via ${adapter.protocol}`);
  } catch (err) {
    console.error(`⚠️  Could not connect: ${err}`);
    console.error(`   Server will start anyway (tool calls will fail)`);
  }

  const server = createMCPServer(opts);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`🚀 MCP PLC Core ready`);
}
