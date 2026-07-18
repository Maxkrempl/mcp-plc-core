/**
 * Siemens S7 Adapter — built-in for mcp-plc-core.
 *
 * Works with Siemens S7-1200/1500/300/400.
 * Requires: npm install nodes7
 *
 * Data Block layout (default — override in config):
 *   DB1:  Sensor data (REAL0-temp, REAL4-press, INT8-speed, INT10-prod, WORD12-alarms, WORD14-status)
 *   DB10: Setpoints (REAL0-temp, REAL4-press, INT8-speed)
 *   DB20: Digital outputs (X0.0-green, X0.1-yellow, X0.2-red)
 *
 * TIA Portal requirements:
 *   - Enable GET/PUT Access (Properties > Protection)
 *   - Disable Optimized Block Access for DB1, DB10, DB20
 *   - Slot = 1 for S7-1200/1500
 */

import { PLCAdapter, SensorData, AlarmData, Alarm, StatusData, SetpointData, OutputData } from "../adapter.js";

// Dynamic import for nodes7 (CJS module)
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export interface S7AdapterConfig {
  host: string;
  port: number;
  rack?: number;
  slot?: number;
  /** Custom DB numbers — override defaults */
  db?: {
    sensors?: number;
    setpoints?: number;
    outputs?: number;
  };
}

export class S7Adapter implements PLCAdapter {
  readonly name: string;
  readonly protocol = "s7";

  private conn: any;
  private connected = false;
  private config: Required<S7AdapterConfig>;

  private variables: Record<string, string> = {};

  constructor(config: S7AdapterConfig) {
    this.config = {
      host: config.host,
      port: config.port || 102,
      rack: config.rack ?? 0,
      slot: config.slot ?? 1,
      db: {
        sensors: config.db?.sensors ?? 1,
        setpoints: config.db?.setpoints ?? 10,
        outputs: config.db?.outputs ?? 20,
      },
    };

    this.name = `Siemens S7 (DB${this.config.db.sensors}/DB${this.config.db.setpoints}/DB${this.config.db.outputs})`;

    // Build tag mapping from config
    const sDb = this.config.db.sensors;
    const pDb = this.config.db.setpoints;
    const oDb = this.config.db.outputs;

    this.variables = {
      temperature:   `DB${sDb},REAL0`,
      pressure:      `DB${sDb},REAL4`,
      motorSpeed:    `DB${sDb},INT8`,
      production:    `DB${sDb},INT10`,
      alarmFlags:    `DB${sDb},WORD12`,
      status:        `DB${sDb},WORD14`,
      setpointTemp:  `DB${pDb},REAL0`,
      setpointPress: `DB${pDb},REAL4`,
      setpointSpeed: `DB${pDb},INT8`,
      outputGreen:   `DB${oDb},X0.0`,
      outputYellow:  `DB${oDb},X0.1`,
      outputRed:     `DB${oDb},X0.2`,
    };
  }

  async connect(): Promise<void> {
    const nodes7 = require("nodes7");
    this.conn = new nodes7();

    return new Promise((resolve, reject) => {
      this.conn.initiateConnection(
        {
          port: this.config.port,
          host: this.config.host,
          rack: this.config.rack,
          slot: this.config.slot,
        },
        (err: any) => {
          if (err) {
            reject(new Error(`S7 connection failed: ${err}`));
          } else {
            this.connected = true;
            this.conn.setTranslationCB((tag: string) => this.variables[tag]);
            this.conn.addItems(Object.keys(this.variables));
            resolve();
          }
        }
      );
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.connected) { resolve(); return; }
      this.conn.dropConnection(() => {
        this.connected = false;
        resolve();
      });
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async readAll(): Promise<Record<string, any>> {
    if (!this.connected) throw new Error("Not connected to S7 PLC");
    return new Promise((resolve, reject) => {
      this.conn.readAllItems((bad: boolean, values: Record<string, any>) => {
        if (bad) reject(new Error("S7 read error"));
        else resolve(values);
      });
    });
  }

  async readSensors(): Promise<SensorData> {
    const v = await this.readAll();
    return {
      temperature: v.temperature || 0,
      pressure: v.pressure || 0,
      motorSpeed: v.motorSpeed || 0,
      production: v.production || 0,
    };
  }

  async readAlarms(): Promise<AlarmData> {
    const v = await this.readAll();
    const flags = v.alarmFlags || 0;
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
    const v = await this.readAll();
    const code = v.status || 0;
    return {
      status: code === 1 ? "running" : code === 2 ? "fault" : "stopped",
    };
  }

  async readSetpoints(): Promise<SetpointData> {
    const v = await this.readAll();
    return {
      temperature: v.setpointTemp || 0,
      pressure: v.setpointPress || 0,
      speed: v.setpointSpeed || 0,
    };
  }

  async readOutputs(): Promise<OutputData> {
    const v = await this.readAll();
    return {
      green: !!v.outputGreen,
      yellow: !!v.outputYellow,
      red: !!v.outputRed,
    };
  }

  async writeSetpoint(parameter: string, value: number): Promise<boolean> {
    const map: Record<string, string> = {
      temperature: "setpointTemp",
      pressure: "setpointPress",
      speed: "setpointSpeed",
    };

    const tag = map[parameter];
    if (!tag) throw new Error(`Unknown parameter: ${parameter}`);

    return new Promise((resolve, reject) => {
      this.conn.writeItems(tag, value, (bad: boolean) => {
        if (bad) reject(new Error(`S7 write error for ${parameter}`));
        else resolve(true);
      });
    });
  }
}
