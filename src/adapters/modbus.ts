/**
 * Modbus TCP Adapter — built-in for mcp-plc-core.
 *
 * Works with any Modbus TCP PLC:
 *   - Schneider M340/M580
 *   - ABB AC500
 *   - WAGO
 *   - CODESYS
 *   - Arduino + Modbus shield
 *   - Any Modbus simulator
 *
 * Register map (default — override in config):
 *   0: Temperature x10
 *   1: Pressure x10
 *   2: Motor speed (RPM)
 *   3: Production counter
 *   4: Alarm flags (bitmask)
 *   5: Status (0=stop, 1=run, 2=fault)
 *   6: Setpoint temp x10
 *   7: Setpoint pressure x10
 *   8: Setpoint speed
 *   9-11: Digital outputs
 */

import net from "net";
import { PLCAdapter, SensorData, AlarmData, Alarm, StatusData, SetpointData, OutputData } from "../adapter.js";

export interface ModbusAdapterConfig {
  host: string;
  port: number;
  /** Custom register map — override default addresses */
  registerMap?: Record<string, number>;
}

export class ModbusTCPAdapter implements PLCAdapter {
  readonly name = "Modbus TCP";
  readonly protocol = "modbus";

  private socket: net.Socket | null = null;
  private connected = false;
  private transactionId = 0;
  private config: ModbusAdapterConfig;

  constructor(config: ModbusAdapterConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      this.socket.connect(this.config.port, this.config.host, () => {
        this.connected = true;
        resolve();
      });
      this.socket.on("error", (err) => {
        this.connected = false;
        reject(err);
      });
      this.socket.on("close", () => {
        this.connected = false;
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.end(() => resolve());
      } else {
        resolve();
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  private buildReadRequest(address: number, count: number): Buffer {
    this.transactionId++;
    const buffer = Buffer.alloc(12);
    buffer.writeUInt16BE(this.transactionId, 0);
    buffer.writeUInt16BE(0, 2);
    buffer.writeUInt16BE(6, 4);
    buffer.writeUInt8(1, 6);
    buffer.writeUInt8(0x03, 7);
    buffer.writeUInt16BE(address, 8);
    buffer.writeUInt16BE(count, 10);
    return buffer;
  }

  private buildWriteRequest(address: number, value: number): Buffer {
    this.transactionId++;
    const buffer = Buffer.alloc(11);
    buffer.writeUInt16BE(this.transactionId, 0);
    buffer.writeUInt16BE(0, 2);
    buffer.writeUInt16BE(7, 4);
    buffer.writeUInt8(1, 6);
    buffer.writeUInt8(0x06, 7);
    buffer.writeUInt16BE(address, 8);
    buffer.writeUInt16BE(value, 9);
    return buffer;
  }

  async readRegisters(address: number, count: number): Promise<number[]> {
    if (!this.socket || !this.connected) throw new Error("Not connected");

    return new Promise((resolve, reject) => {
      const request = this.buildReadRequest(address, count);
      const timeout = setTimeout(() => reject(new Error("Modbus read timeout")), 3000);

      const onData = (data: Buffer) => {
        clearTimeout(timeout);
        this.socket?.off("data", onData);
        const functionCode = data[7];
        if (functionCode === 0x83) {
          reject(new Error("Modbus error: " + data[8]));
          return;
        }
        const registers: number[] = [];
        for (let i = 0; i < count; i++) {
          registers.push(data.readUInt16BE(9 + i * 2));
        }
        resolve(registers);
      };

      this.socket!.on("data", onData);
      this.socket!.write(request);
    });
  }

  async writeRegister(address: number, value: number): Promise<boolean> {
    if (!this.socket || !this.connected) throw new Error("Not connected");

    return new Promise((resolve, reject) => {
      const request = this.buildWriteRequest(address, value);
      const timeout = setTimeout(() => reject(new Error("Modbus write timeout")), 3000);

      const onData = (data: Buffer) => {
        clearTimeout(timeout);
        this.socket?.off("data", onData);
        resolve(true);
      };

      this.socket!.on("data", onData);
      this.socket!.write(request);
    });
  }

  async readSensors(): Promise<SensorData> {
    const regs = await this.readRegisters(0, 4);
    return {
      temperature: regs[0] / 10,
      pressure: regs[1] / 10,
      motorSpeed: regs[2],
      production: regs[3],
    };
  }

  async readAlarms(): Promise<AlarmData> {
    const regs = await this.readRegisters(4, 2);
    const flags = regs[0];
    const active: Alarm[] = [];

    if (flags & 1) active.push({
      code: "TEMPERATURE_HIGH",
      description: "Visoka temperatura (> 80°C)",
      priority: "CRITICAL",
      action: "Takoj znižaj temperaturo",
    });
    if (flags & 2) active.push({
      code: "PRESSURE_LOW",
      description: "Nizek tlak (< 3 bar)",
      priority: "CRITICAL",
      action: "Preveri črpalke",
    });
    if (flags & 4) active.push({
      code: "MOTOR_FAULT",
      description: "Motor previsoka hitrost (> 2800 RPM)",
      priority: "WARNING",
      action: "Preveri obremenitev",
    });

    return { active, count: active.length };
  }

  async readStatus(): Promise<StatusData> {
    const regs = await this.readRegisters(5, 1);
    const code = regs[0];
    return {
      status: code === 1 ? "running" : code === 2 ? "fault" : "stopped",
    };
  }

  async readSetpoints(): Promise<SetpointData> {
    const regs = await this.readRegisters(6, 3);
    return {
      temperature: regs[0] / 10,
      pressure: regs[1] / 10,
      speed: regs[2],
    };
  }

  async readOutputs(): Promise<OutputData> {
    const regs = await this.readRegisters(9, 3);
    return {
      green: regs[0] === 1,
      yellow: regs[1] === 1,
      red: regs[2] === 1,
    };
  }

  async writeSetpoint(parameter: string, value: number): Promise<boolean> {
    const map: Record<string, { address: number; scale: number }> = {
      temperature: { address: 6, scale: 10 },
      pressure: { address: 7, scale: 10 },
      speed: { address: 8, scale: 1 },
    };

    const entry = map[parameter];
    if (!entry) throw new Error(`Unknown parameter: ${parameter}`);

    return this.writeRegister(entry.address, Math.round(value * entry.scale));
  }
}
