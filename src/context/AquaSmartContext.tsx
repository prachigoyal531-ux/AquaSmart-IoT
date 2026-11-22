import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { evaluateIrrigation } from '../engine/irrigationEngine';
import {
  IrrigationDecision,
  MoistureHistoryPoint,
  OperatingMode,
  SensorState,
} from '../types/irrigation';

const STORAGE_KEY = 'aquasmart_simple_state_v1';

export const DEFAULT_SENSOR_STATE: SensorState = {
  soilMoisture: 42,
  temperature: 26,
  humidity: 55,
  rainDetected: false,
  sensorsHealthy: true,
  lastUpdated: new Date().toISOString(),
};

interface PersistedState {
  sensors: SensorState;
  mode: OperatingMode;
  manualPumpOn: boolean;
}

function buildInitialHistory(currentMoisture: number, currentPumpOn: boolean): MoistureHistoryPoint[] {
  const now = Date.now();
  const samples = [46, 44, 41, 37, 32, 27, 25, 34, 40, currentMoisture];
  return samples.map((val, idx) => {
    const dt = new Date(now - (samples.length - 1 - idx) * 60_000);
    return {
      time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      moisture: val,
      pumpOn: idx === samples.length - 1 ? currentPumpOn : val < 30,
    };
  });
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        sensors: { ...DEFAULT_SENSOR_STATE, lastUpdated: new Date().toISOString() },
        mode: 'automatic',
        manualPumpOn: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      sensors: {
        ...DEFAULT_SENSOR_STATE,
        ...(parsed.sensors || {}),
        lastUpdated: new Date().toISOString(),
      },
      mode: parsed.mode === 'manual' ? 'manual' : 'automatic',
      manualPumpOn: Boolean(parsed.manualPumpOn),
    };
  } catch {
    return {
      sensors: { ...DEFAULT_SENSOR_STATE, lastUpdated: new Date().toISOString() },
      mode: 'automatic',
      manualPumpOn: false,
    };
  }
}

interface AquaSmartContextValue {
  sensors: SensorState;
  mode: OperatingMode;
  manualPumpOn: boolean;
  decision: IrrigationDecision;
  history: MoistureHistoryPoint[];
  autoSimulate: boolean;
  setAutoSimulate: (enabled: boolean) => void;
  updateSensors: (patch: Partial<SensorState>) => void;
  setMode: (mode: OperatingMode) => void;
  setManualPumpOn: (on: boolean) => void;
  resetDemo: () => void;
}

const AquaSmartContext = createContext<AquaSmartContextValue | null>(null);

export function AquaSmartProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadPersistedState(), []);

  const [sensors, setSensors] = useState<SensorState>(initial.sensors);
  const [mode, setModeState] = useState<OperatingMode>(initial.mode);
  const [manualPumpOn, setManualPumpOnState] = useState<boolean>(initial.manualPumpOn);
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);

  const decision = useMemo(
    () => evaluateIrrigation(sensors, mode, manualPumpOn),
    [sensors, mode, manualPumpOn]
  );

  const [history, setHistory] = useState<MoistureHistoryPoint[]>(() =>
    buildInitialHistory(initial.sensors.soilMoisture, evaluateIrrigation(initial.sensors, initial.mode, initial.manualPumpOn).pumpOn)
  );

  // Persist user's state cleanly
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sensors, mode, manualPumpOn } satisfies PersistedState)
      );
    } catch {
      // Ignore storage errors
    }
  }, [sensors, mode, manualPumpOn]);

  const appendHistoryPoint = useCallback((moisture: number, pumpOn: boolean) => {
    const label = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setHistory((prev) => [...prev.slice(-14), { time: label, moisture, pumpOn }]);
  }, []);

  const updateSensors = useCallback(
    (patch: Partial<SensorState>) => {
      setSensors((prev) => {
        const next: SensorState = {
          ...prev,
          ...patch,
          lastUpdated: new Date().toISOString(),
        };
        const nextDecision = evaluateIrrigation(next, mode, manualPumpOn);
        if (patch.soilMoisture !== undefined || patch.rainDetected !== undefined || patch.sensorsHealthy !== undefined) {
          appendHistoryPoint(
            next.sensorsHealthy ? next.soilMoisture : 0,
            nextDecision.pumpOn
          );
        }
        return next;
      });
    },
    [appendHistoryPoint, manualPumpOn, mode]
  );

  const setMode = useCallback((nextMode: OperatingMode) => {
    setModeState(nextMode);
    if (nextMode === 'manual') {
      // Preserve current pump state when entering manual so transition is smooth
      const currentEval = evaluateIrrigation(sensors, 'automatic', false);
      setManualPumpOnState(currentEval.pumpOn);
    }
  }, [sensors]);

  const setManualPumpOn = useCallback((on: boolean) => {
    setManualPumpOnState(on);
  }, []);

  const resetDemo = useCallback(() => {
    setAutoSimulate(false);
    const fresh: SensorState = {
      ...DEFAULT_SENSOR_STATE,
      lastUpdated: new Date().toISOString(),
    };
    setSensors(fresh);
    setModeState('automatic');
    setManualPumpOnState(false);
    setHistory(buildInitialHistory(fresh.soilMoisture, false));
  }, []);

  // Optional live auto-simulation cycle (dries slowly when pump is OFF, hydrates when pump is ON)
  useEffect(() => {
    if (!autoSimulate) return;

    const timer = setInterval(() => {
      setSensors((prev) => {
        if (!prev.sensorsHealthy) return prev;
        const currEval = evaluateIrrigation(prev, mode, manualPumpOn);
        let nextMoisture = prev.soilMoisture;

        if (currEval.pumpOn) {
          nextMoisture = Math.min(48, prev.soilMoisture + 3);
        } else if (prev.rainDetected) {
          nextMoisture = Math.min(75, prev.soilMoisture + 2);
        } else {
          nextMoisture = Math.max(14, prev.soilMoisture - 2);
        }

        const nextTemp = Number(
          Math.max(18, Math.min(38, prev.temperature + (Math.random() - 0.5) * 0.6)).toFixed(1)
        );
        const nextHumidity = Math.round(
          Math.max(30, Math.min(88, prev.humidity + (Math.random() - 0.5) * 2))
        );

        const next: SensorState = {
          ...prev,
          soilMoisture: nextMoisture,
          temperature: nextTemp,
          humidity: nextHumidity,
          lastUpdated: new Date().toISOString(),
        };

        const nextEval = evaluateIrrigation(next, mode, manualPumpOn);
        appendHistoryPoint(nextMoisture, nextEval.pumpOn);
        return next;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [autoSimulate, appendHistoryPoint, manualPumpOn, mode]);

  const value: AquaSmartContextValue = {
    sensors,
    mode,
    manualPumpOn,
    decision,
    history,
    autoSimulate,
    setAutoSimulate,
    updateSensors,
    setMode,
    setManualPumpOn,
    resetDemo,
  };

  return <AquaSmartContext.Provider value={value}>{children}</AquaSmartContext.Provider>;
}

export function useAquaSmart() {
  const ctx = useContext(AquaSmartContext);
  if (!ctx) {
    throw new Error('useAquaSmart must be used inside AquaSmartProvider');
  }
  return ctx;
}
