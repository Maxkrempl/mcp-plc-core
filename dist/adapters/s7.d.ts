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
import { PLCAdapter, SensorData, AlarmData, StatusData, SetpointData, OutputData } from "../adapter.js";
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
export declare class S7Adapter implements PLCAdapter {
    readonly name: string;
    readonly protocol = "s7";
    private conn;
    private connected;
    private config;
    private variables;
    constructor(config: S7AdapterConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    private readAll;
    readSensors(): Promise<SensorData>;
    readAlarms(): Promise<AlarmData>;
    readStatus(): Promise<StatusData>;
    readSetpoints(): Promise<SetpointData>;
    readOutputs(): Promise<OutputData>;
    writeSetpoint(parameter: string, value: number): Promise<boolean>;
}
//# sourceMappingURL=s7.d.ts.map