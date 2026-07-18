/**
 * PLC Adapter Interface — implement this for your PLC type.
 *
 * This is the core abstraction layer. Your adapter handles
 * the specific protocol (Modbus, S7, OPC UA, EtherNet/IP, etc.)
 * while the MCP server stays generic.
 *
 * Example implementations:
 *   - examples/modbus-adapter.ts  (Modbus TCP/RTU)
 *   - examples/s7-adapter.ts      (Siemens S7)
 */

export interface PLCAdapter {
  /** Human-readable name (e.g. "Modbus TCP", "Siemens S7-1500") */
  readonly name: string;

  /** Protocol identifier (e.g. "modbus", "s7", "opcua") */
  readonly protocol: string;

  /** Connect to the PLC */
  connect(): Promise<void>;

  /** Disconnect from the PLC */
  disconnect(): Promise<void>;

  /** Check if connected */
  isConnected(): boolean;

  /** Read all sensor values */
  readSensors(): Promise<SensorData>;

  /** Read all active alarms */
  readAlarms(): Promise<AlarmData>;

  /** Read system status */
  readStatus(): Promise<StatusData>;

  /** Read setpoints */
  readSetpoints(): Promise<SetpointData>;

  /** Read digital outputs */
  readOutputs(): Promise<OutputData>;

  /** Write a setpoint (optional — return false if not supported) */
  writeSetpoint?(parameter: string, value: number): Promise<boolean>;

  /** Read raw data block / register area (optional) */
  readRaw?(area: string, offset: number, length: number): Promise<number[]>;

  /** Write raw data block / register area (optional) */
  writeRaw?(area: string, offset: number, data: number[]): Promise<boolean>;
}

export interface SensorData {
  temperature?: number;
  pressure?: number;
  motorSpeed?: number;
  production?: number;
  /** Add custom sensors here */
  [key: string]: number | undefined;
}

export interface AlarmData {
  active: Alarm[];
  count: number;
}

export interface Alarm {
  code: string;
  description: string;
  priority: "CRITICAL" | "WARNING" | "INFO";
  /** Recommended action */
  action?: string;
}

export interface StatusData {
  status: "stopped" | "running" | "fault" | "maintenance";
  /** Additional status info */
  details?: Record<string, any>;
}

export interface SetpointData {
  [parameter: string]: number;
}

export interface OutputData {
  [name: string]: boolean;
}

export interface AdapterConfig {
  host: string;
  port: number;
  /** Protocol-specific options */
  options?: Record<string, any>;
}
