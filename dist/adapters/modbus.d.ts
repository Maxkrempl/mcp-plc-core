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
import { PLCAdapter, SensorData, AlarmData, StatusData, SetpointData, OutputData } from "../adapter.js";
export interface ModbusAdapterConfig {
    host: string;
    port: number;
    /** Custom register map — override default addresses */
    registerMap?: Record<string, number>;
}
export declare class ModbusTCPAdapter implements PLCAdapter {
    readonly name = "Modbus TCP";
    readonly protocol = "modbus";
    private socket;
    private connected;
    private transactionId;
    private config;
    constructor(config: ModbusAdapterConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    private buildReadRequest;
    private buildWriteRequest;
    readRegisters(address: number, count: number): Promise<number[]>;
    writeRegister(address: number, value: number): Promise<boolean>;
    readSensors(): Promise<SensorData>;
    readAlarms(): Promise<AlarmData>;
    readStatus(): Promise<StatusData>;
    readSetpoints(): Promise<SetpointData>;
    readOutputs(): Promise<OutputData>;
    writeSetpoint(parameter: string, value: number): Promise<boolean>;
}
//# sourceMappingURL=modbus.d.ts.map