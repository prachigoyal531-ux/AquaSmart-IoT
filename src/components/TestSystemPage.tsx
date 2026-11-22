import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Droplets,
  Power,
  RotateCcw,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useAquaSmart } from '../context/AquaSmartContext';
import { DRY_SOIL_THRESHOLD } from '../engine/irrigationEngine';

export function TestSystemPage() {
  const {
    sensors,
    mode,
    manualPumpOn,
    decision,
    updateSensors,
    setMode,
    setManualPumpOn,
    resetDemo,
    setAutoSimulate,
  } = useAquaSmart();

  const applyManualChange = (patch: Parameters<typeof updateSensors>[0]) => {
    setAutoSimulate(false);
    updateSensors(patch);
  };

  const applyPreset = (
    preset: 'dry' | 'sufficient' | 'rain' | 'error'
  ) => {
    setAutoSimulate(false);
    setMode('automatic');
    if (preset === 'dry') {
      updateSensors({
        soilMoisture: 18,
        temperature: 31,
        humidity: 44,
        rainDetected: false,
        sensorsHealthy: true,
      });
    } else if (preset === 'sufficient') {
      updateSensors({
        soilMoisture: 48,
        temperature: 25,
        humidity: 58,
        rainDetected: false,
        sensorsHealthy: true,
      });
    } else if (preset === 'rain') {
      updateSensors({
        soilMoisture: 22,
        temperature: 22,
        humidity: 84,
        rainDetected: true,
        sensorsHealthy: true,
      });
    } else {
      updateSensors({
        sensorsHealthy: false,
        rainDetected: false,
      });
    }
  };

  const rules = [
    {
      id: 'SENSOR_FAILURE',
      label: 'Sensor Failure',
      condition: 'If sensors fail or disconnect',
      action: 'Pump OFF + Error Message',
    },
    {
      id: 'RAIN_DETECTED',
      label: 'Rain Override',
      condition: 'If rain is detected (any soil moisture)',
      action: 'Pump OFF',
    },
    {
      id: 'DRY_SOIL_ON',
      label: 'Dry Soil Trigger',
      condition: `Soil moisture < ${DRY_SOIL_THRESHOLD}% and no rain`,
      action: 'Pump ON',
    },
    {
      id: 'MOISTURE_SUFFICIENT',
      label: 'Sufficient Moisture',
      condition: `Soil moisture ≥ ${DRY_SOIL_THRESHOLD}%`,
      action: 'Pump OFF',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Reset Button */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#15803D]">
            Interactive Demonstration Mode · Simulated Demo Data
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#111814] mt-1">
            Test Your System
          </h1>
          <p className="text-sm text-[#4A554D] mt-1">
            Adjust soil moisture, temperature, rain, or sensor status to watch the water pump respond automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDemo}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4DDD2] bg-white hover:bg-[#F4F7F3] text-xs font-semibold text-[#111814] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-[#15803D]" />
          <span>Reset Default Readings</span>
        </button>
      </section>

      {/* Main Split: Left Controls / Right Live Pump Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Sensor & Mode Controls (7 cols) */}
        <section className="lg:col-span-7 bg-white border border-[#DCE3DA] rounded-xl p-6 space-y-6">
          {/* Quick 1-Click Presets */}
          <div className="space-y-2.5 pb-5 border-b border-[#E8EDE7]">
            <div className="text-xs font-semibold text-[#4A554D]">
              Quick Demo Scenarios (1-Click)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('dry')}
                className="px-3 py-2 rounded-lg border border-[#DCE3DA] bg-[#FAFBF9] hover:border-[#15803D] hover:bg-[#EFFAF2] text-xs font-semibold text-[#111814] transition-colors"
              >
                Dry Soil (18%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('sufficient')}
                className="px-3 py-2 rounded-lg border border-[#DCE3DA] bg-[#FAFBF9] hover:border-[#15803D] hover:bg-[#EFFAF2] text-xs font-semibold text-[#111814] transition-colors"
              >
                Moist Soil (48%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('rain')}
                className="px-3 py-2 rounded-lg border border-[#DCE3DA] bg-[#FAFBF9] hover:border-[#0284C7] hover:bg-[#EFF6FF] text-xs font-semibold text-[#111814] transition-colors"
              >
                Rain Detected
              </button>
              <button
                type="button"
                onClick={() => applyPreset('error')}
                className="px-3 py-2 rounded-lg border border-[#DCE3DA] bg-[#FAFBF9] hover:border-[#DC2626] hover:bg-[#FEF2F2] text-xs font-semibold text-[#111814] transition-colors"
              >
                Sensor Failure
              </button>
            </div>
          </div>

          {/* Soil Moisture Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="moisture-slider"
                className="flex items-center gap-2 text-sm font-semibold text-[#111814]"
              >
                <Droplets className="w-4 h-4 text-[#15803D]" />
                <span>Soil Moisture</span>
              </label>
              <span className="font-mono tabular-nums text-lg font-bold text-[#111814]">
                {sensors.sensorsHealthy ? `${sensors.soilMoisture}%` : 'Offline'}
              </span>
            </div>

            <input
              id="moisture-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              disabled={!sensors.sensorsHealthy}
              value={sensors.soilMoisture}
              onChange={(e) =>
                applyManualChange({ soilMoisture: Number(e.target.value) })
              }
              className="w-full h-2.5 bg-[#E6ECE4] rounded-lg appearance-none cursor-pointer accent-[#15803D] disabled:opacity-40"
            />

            <div className="flex justify-between text-xs text-[#5B685E] font-mono tabular-nums">
              <span>0% (Very Dry)</span>
              <span className="text-[#B45309] font-semibold">30% Threshold</span>
              <span>100% (Wet)</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2.5 pt-2 border-t border-[#F0F4EF]">
            <div className="flex items-center justify-between">
              <label
                htmlFor="temperature-slider"
                className="flex items-center gap-2 text-sm font-semibold text-[#111814]"
              >
                <Thermometer className="w-4 h-4 text-[#D97706]" />
                <span>Temperature</span>
              </label>
              <span className="font-mono tabular-nums text-lg font-bold text-[#111814]">
                {sensors.sensorsHealthy ? `${sensors.temperature}°C` : 'Offline'}
              </span>
            </div>

            <input
              id="temperature-slider"
              type="range"
              min={10}
              max={45}
              step={1}
              disabled={!sensors.sensorsHealthy}
              value={sensors.temperature}
              onChange={(e) =>
                applyManualChange({ temperature: Number(e.target.value) })
              }
              className="w-full h-2.5 bg-[#E6ECE4] rounded-lg appearance-none cursor-pointer accent-[#D97706] disabled:opacity-40"
            />

            <div className="flex justify-between text-xs text-[#5B685E] font-mono tabular-nums">
              <span>10°C</span>
              <span>25°C</span>
              <span>45°C</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div className="space-y-2.5 pt-2 border-t border-[#F0F4EF]">
            <div className="flex items-center justify-between">
              <label
                htmlFor="humidity-slider"
                className="flex items-center gap-2 text-sm font-semibold text-[#111814]"
              >
                <Wind className="w-4 h-4 text-[#0284C7]" />
                <span>Humidity</span>
              </label>
              <span className="font-mono tabular-nums text-lg font-bold text-[#111814]">
                {sensors.sensorsHealthy ? `${sensors.humidity}%` : 'Offline'}
              </span>
            </div>

            <input
              id="humidity-slider"
              type="range"
              min={20}
              max={95}
              step={1}
              disabled={!sensors.sensorsHealthy}
              value={sensors.humidity}
              onChange={(e) =>
                applyManualChange({ humidity: Number(e.target.value) })
              }
              className="w-full h-2.5 bg-[#E6ECE4] rounded-lg appearance-none cursor-pointer accent-[#0284C7] disabled:opacity-40"
            />
          </div>

          {/* Toggle Row: Rain Detection & Sensor Health */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8EDE7]">
            {/* Rain Detection Toggle */}
            <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E4EBE2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#111814]">
                  <CloudRain className="w-4 h-4 text-[#0284C7]" />
                  <span>Rain Detection</span>
                </span>
                <span
                  className={`text-xs font-semibold ${
                    sensors.rainDetected ? 'text-[#0284C7]' : 'text-[#5B685E]'
                  }`}
                >
                  {sensors.rainDetected ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={!sensors.sensorsHealthy}
                  onClick={() => applyManualChange({ rainDetected: false })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                    !sensors.rainDetected
                      ? 'bg-white border border-[#15803D] text-[#15803D] shadow-sm'
                      : 'bg-transparent border border-[#DCE3DA] text-[#5B685E]'
                  }`}
                >
                  No Rain
                </button>
                <button
                  type="button"
                  disabled={!sensors.sensorsHealthy}
                  onClick={() => applyManualChange({ rainDetected: true })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                    sensors.rainDetected
                      ? 'bg-[#0284C7] border border-[#0284C7] text-white shadow-sm'
                      : 'bg-transparent border border-[#DCE3DA] text-[#5B685E]'
                  }`}
                >
                  Rain Detected
                </button>
              </div>
            </div>

            {/* Sensor Fault Simulation */}
            <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E4EBE2] space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#111814]">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  <span>Sensor Status</span>
                </span>
                <span
                  className={`text-xs font-semibold ${
                    sensors.sensorsHealthy ? 'text-[#15803D]' : 'text-[#DC2626]'
                  }`}
                >
                  {sensors.sensorsHealthy ? 'Working' : 'Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyManualChange({ sensorsHealthy: true })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    sensors.sensorsHealthy
                      ? 'bg-white border border-[#15803D] text-[#15803D] shadow-sm'
                      : 'bg-transparent border border-[#DCE3DA] text-[#5B685E]'
                  }`}
                >
                  Working
                </button>
                <button
                  type="button"
                  onClick={() => applyManualChange({ sensorsHealthy: false })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    !sensors.sensorsHealthy
                      ? 'bg-[#DC2626] border border-[#DC2626] text-white shadow-sm'
                      : 'bg-transparent border border-[#DCE3DA] text-[#5B685E]'
                  }`}
                >
                  Sensor Fail
                </button>
              </div>
            </div>
          </div>

          {/* Operating Mode & Manual Pump Switch */}
          <div className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E4EBE2] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#111814]">Operating Mode</div>
                <div className="text-xs text-[#5B685E]">
                  Automatic follows sensor rules; Manual lets you switch the pump directly.
                </div>
              </div>

              <div className="inline-flex p-1 bg-[#E8EFE7] rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setMode('automatic')}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === 'automatic'
                      ? 'bg-white text-[#15803D] shadow-sm'
                      : 'text-[#5B685E] hover:text-[#111814]'
                  }`}
                >
                  Automatic Mode
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === 'manual'
                      ? 'bg-white text-[#111814] shadow-sm'
                      : 'text-[#5B685E] hover:text-[#111814]'
                  }`}
                >
                  Manual Mode
                </button>
              </div>
            </div>

            {mode === 'manual' && (
              <div className="pt-3 border-t border-[#DCE3DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#374151]">
                  Manual Water Pump Control:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualPumpOn(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      manualPumpOn
                        ? 'bg-[#15803D] text-white'
                        : 'bg-white border border-[#D4DDD2] text-[#374151] hover:bg-[#F4F7F3]'
                    }`}
                  >
                    Turn Pump ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualPumpOn(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      !manualPumpOn
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-white border border-[#D4DDD2] text-[#374151] hover:bg-[#F4F7F3]'
                    }`}
                  >
                    Turn Pump OFF
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right: Live Pump Output & Rule Evaluation (5 cols) */}
        <section className="lg:col-span-5 space-y-5">
          {/* Large Water Pump Indicator Card */}
          <div
            className={`rounded-xl border p-6 text-center space-y-4 transition-colors ${
              decision.severity === 'error'
                ? 'bg-[#FEF2F2] border-[#FECACA]'
                : decision.pumpOn
                ? 'bg-[#ECFDF3] border-[#86EFAC]'
                : decision.severity === 'rain'
                ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                : 'bg-white border-[#DCE3DA]'
            }`}
          >
            <div className="text-xs font-semibold text-[#5B685E]">
              Live Water Pump Output
            </div>

            <div
              className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-transform duration-200 ${
                decision.severity === 'error'
                  ? 'bg-[#DC2626] text-white'
                  : decision.pumpOn
                  ? 'bg-[#15803D] text-white scale-105'
                  : 'bg-[#E5ECE3] text-[#4A554D]'
              }`}
            >
              {decision.severity === 'error' ? (
                <AlertTriangle className="w-10 h-10" />
              ) : (
                <Power className="w-10 h-10" />
              )}
            </div>

            <div>
              <div
                className={`font-display font-extrabold text-3xl tracking-tight ${
                  decision.severity === 'error'
                    ? 'text-[#DC2626]'
                    : decision.pumpOn
                    ? 'text-[#15803D]'
                    : 'text-[#111814]'
                }`}
              >
                PUMP {decision.pumpOn ? 'ON' : 'OFF'}
              </div>
              <p className="font-display font-semibold text-base text-[#111814] mt-2">
                {decision.headline}
              </p>
              <p className="text-xs text-[#4A554D] mt-1.5 leading-relaxed">
                {decision.explanation}
              </p>
            </div>
          </div>

          {/* Automatic Decision Rules Evaluator */}
          <div className="bg-white border border-[#DCE3DA] rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-display font-semibold text-base text-[#111814]">
                Automatic Decision Logic
              </h2>
              <p className="text-xs text-[#5B685E] mt-0.5">
                {mode === 'automatic'
                  ? 'The highlighted rule below is currently controlling the pump.'
                  : 'Paused because Manual Mode is active.'}
              </p>
            </div>

            <div className="space-y-2.5">
              {rules.map((rule) => {
                const isTriggered = mode === 'automatic' && decision.ruleId === rule.id;
                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-lg border transition-colors ${
                      isTriggered
                        ? rule.id === 'SENSOR_FAILURE'
                          ? 'bg-[#FEF2F2] border-[#DC2626]'
                          : rule.id === 'RAIN_DETECTED'
                          ? 'bg-[#EFF6FF] border-[#0284C7]'
                          : 'bg-[#ECFDF3] border-[#15803D]'
                        : 'bg-[#FAFBF9] border-[#E8EDE7]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#111814] flex items-center gap-1.5">
                        {isTriggered && (
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              rule.id === 'SENSOR_FAILURE'
                                ? 'text-[#DC2626]'
                                : rule.id === 'RAIN_DETECTED'
                                ? 'text-[#0284C7]'
                                : 'text-[#15803D]'
                            }`}
                          />
                        )}
                        <span>{rule.label}</span>
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#4A554D]">
                        {rule.action}
                      </span>
                    </div>
                    <div className="text-xs text-[#5B685E] mt-1">{rule.condition}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
