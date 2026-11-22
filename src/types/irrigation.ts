export type NavSection = 'dashboard' | 'test' | 'how-it-works';

export type OperatingMode = 'automatic' | 'manual';

export type DecisionRuleId =
  | 'SENSOR_FAILURE'
  | 'RAIN_DETECTED'
  | 'DRY_SOIL_ON'
  | 'MOISTURE_SUFFICIENT'
  | 'MANUAL_ON'
  | 'MANUAL_OFF';

export interface SensorState {
  soilMoisture: number; // 0 to 100 (%)
  temperature: number; // °C
  humidity: number; // 0 to 100 (%)
  rainDetected: boolean;
  sensorsHealthy: boolean;
  lastUpdated: string;
}

export interface IrrigationDecision {
  pumpOn: boolean;
  ruleId: DecisionRuleId;
  headline: string;
  explanation: string;
  severity: 'active' | 'idle' | 'rain' | 'error' | 'manual';
}

export interface MoistureHistoryPoint {
  time: string;
  moisture: number;
  pumpOn: boolean;
}
