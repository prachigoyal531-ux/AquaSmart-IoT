import { IrrigationDecision, OperatingMode, SensorState } from '../types/irrigation';

export const DRY_SOIL_THRESHOLD = 30;

export function getSoilStatusLabel(soilMoisture: number, sensorsHealthy: boolean): string {
  if (!sensorsHealthy || Number.isNaN(soilMoisture) || soilMoisture < 0 || soilMoisture > 100) {
    return 'Sensor Error';
  }
  if (soilMoisture < DRY_SOIL_THRESHOLD) return 'Dry Soil';
  if (soilMoisture <= 65) return 'Sufficient';
  return 'Wet Soil';
}

export function evaluateIrrigation(
  sensors: SensorState,
  mode: OperatingMode,
  manualPumpOn: boolean
): IrrigationDecision {
  const invalidSensors =
    !sensors.sensorsHealthy ||
    Number.isNaN(sensors.soilMoisture) ||
    sensors.soilMoisture < 0 ||
    sensors.soilMoisture > 100 ||
    Number.isNaN(sensors.temperature) ||
    Number.isNaN(sensors.humidity);

  // Manual Mode handling
  if (mode === 'manual') {
    if (manualPumpOn) {
      return {
        pumpOn: true,
        ruleId: 'MANUAL_ON',
        headline: 'Pump ON – Manual control active.',
        explanation:
          'You turned the water pump ON manually. Automatic soil and rain rules are paused while Manual mode is selected.',
        severity: 'manual',
      };
    }
    return {
      pumpOn: false,
      ruleId: 'MANUAL_OFF',
      headline: 'Pump OFF – Stopped in manual mode.',
      explanation:
        'The water pump is turned OFF manually. Switch back to Automatic mode to let sensors control irrigation.',
      severity: 'idle',
    };
  }

  // Rule 1: Sensor failure safety halt
  if (invalidSensors) {
    return {
      pumpOn: false,
      ruleId: 'SENSOR_FAILURE',
      headline: 'Pump OFF – Sensor error detected. Automatic irrigation stopped.',
      explanation:
        'One or more sensor readings failed or went offline. For safety, the controller keeps the water pump OFF until sensors recover.',
      severity: 'error',
    };
  }

  // Rule 2: Rain detection overrides everything
  if (sensors.rainDetected) {
    return {
      pumpOn: false,
      ruleId: 'RAIN_DETECTED',
      headline: 'Pump OFF – Rain detected. Irrigation stopped.',
      explanation: `Rain is detected on the field sensor (soil moisture is ${sensors.soilMoisture}%). Irrigation is paused to save water.`,
      severity: 'rain',
    };
  }

  // Rule 3: Dry soil (< 30%) and no rain -> Pump ON
  if (sensors.soilMoisture < DRY_SOIL_THRESHOLD) {
    return {
      pumpOn: true,
      ruleId: 'DRY_SOIL_ON',
      headline: 'Pump ON – Soil is dry. Irrigation started.',
      explanation: `Soil moisture is ${sensors.soilMoisture}% (below the ${DRY_SOIL_THRESHOLD}% dry threshold) and no rain is detected.`,
      severity: 'active',
    };
  }

  // Rule 4: Sufficient moisture (>= 30%) -> Pump OFF
  return {
    pumpOn: false,
    ruleId: 'MOISTURE_SUFFICIENT',
    headline: 'Pump OFF – Soil moisture is sufficient.',
    explanation: `Soil moisture is ${sensors.soilMoisture}% (${DRY_SOIL_THRESHOLD}% or above). No irrigation is needed right now.`,
    severity: 'idle',
  };
}
