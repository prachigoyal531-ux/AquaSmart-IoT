import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CloudRain,
  Droplets,
  Pause,
  Play,
  Power,
  Sliders,
  Thermometer,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAquaSmart } from '../context/AquaSmartContext';
import { DRY_SOIL_THRESHOLD, getSoilStatusLabel } from '../engine/irrigationEngine';
import { NavSection } from '../types/irrigation';

interface DashboardPageProps {
  onNavigate: (section: NavSection) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const {
    sensors,
    mode,
    manualPumpOn,
    decision,
    history,
    autoSimulate,
    setAutoSimulate,
    setMode,
    setManualPumpOn,
  } = useAquaSmart();

  const soilStatus = getSoilStatusLabel(sensors.soilMoisture, sensors.sensorsHealthy);
  const moisturePercent = sensors.sensorsHealthy
    ? Math.max(0, Math.min(100, sensors.soilMoisture))
    : 0;

  const bannerStyles =
    decision.severity === 'error'
      ? 'bg-[#FEF2F2] border-[#FECACA]'
      : decision.severity === 'active' || decision.severity === 'manual'
      ? 'bg-[#ECFDF3] border-[#A7F3D0]'
      : decision.severity === 'rain'
      ? 'bg-[#EFF6FF] border-[#BFDBFE]'
      : 'bg-white border-[#DCE3DA]';

  const pumpBadgeStyles = decision.pumpOn
    ? 'bg-[#15803D] text-white'
    : 'bg-[#E7ECE6] text-[#374151]';

  return (
    <div className="space-y-6">
      {/* Page Title & Demo Data Notice */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#15803D]">
            Simulated Demo Data · No physical hardware connected
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#111814] mt-1">
            Smart Irrigation Dashboard
          </h1>
          <p className="text-sm text-[#4A554D] mt-1">
            Monitors soil moisture and rain to turn the water pump ON or OFF automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setAutoSimulate(!autoSimulate)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
              autoSimulate
                ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                : 'bg-white border-[#D4DDD2] text-[#374151] hover:bg-[#F4F7F3]'
            }`}
          >
            {autoSimulate ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Stop Auto-Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Auto-Simulate Readings</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('test')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <span>Open Interactive Test Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Prominent Irrigation Decision Banner */}
      <section className={`rounded-xl border p-5 sm:p-6 transition-colors ${bannerStyles}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                decision.severity === 'error'
                  ? 'bg-[#DC2626] text-white'
                  : decision.severity === 'rain'
                  ? 'bg-[#0284C7] text-white'
                  : decision.pumpOn
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#E5ECE3] text-[#4A554D]'
              }`}
            >
              {decision.severity === 'error' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : decision.severity === 'rain' ? (
                <CloudRain className="w-6 h-6" />
              ) : (
                <Power className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-[#5B685E]">
                Current Irrigation Decision · {mode === 'automatic' ? 'Automatic Mode' : 'Manual Mode'}
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#111814]">
                {decision.headline}
              </h2>
              <p className="text-sm text-[#4A554D] leading-relaxed">
                {decision.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div
              className={`px-4 py-2 rounded-lg font-display font-bold text-sm tracking-wide whitespace-nowrap ${pumpBadgeStyles}`}
            >
              PUMP {decision.pumpOn ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      </section>

      {/* 6 Essential Dashboard Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Soil Moisture */}
        <div className="bg-white border border-[#DCE3DA] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A554D]">Soil Moisture</span>
            <Droplets className="w-5 h-5 text-[#15803D]" />
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono tabular-nums text-4xl font-bold text-[#111814]">
              {sensors.sensorsHealthy ? `${sensors.soilMoisture}%` : 'Error'}
            </span>
            <span
              className={`text-sm font-semibold ${
                !sensors.sensorsHealthy
                  ? 'text-[#DC2626]'
                  : sensors.soilMoisture < DRY_SOIL_THRESHOLD
                  ? 'text-[#D97706]'
                  : 'text-[#15803D]'
              }`}
            >
              {soilStatus}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="relative h-2.5 bg-[#EEF2EC] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  !sensors.sensorsHealthy
                    ? 'bg-[#DC2626]'
                    : sensors.soilMoisture < DRY_SOIL_THRESHOLD
                    ? 'bg-[#D97706]'
                    : 'bg-[#16A34A]'
                }`}
                style={{ width: `${moisturePercent}%` }}
              />
              {/* 30% dry threshold marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#111814]/50"
                style={{ left: `${DRY_SOIL_THRESHOLD}%` }}
                title="30% Dry Threshold"
              />
            </div>
            <div className="flex justify-between text-xs text-[#5B685E]">
              <span>Dry below {DRY_SOIL_THRESHOLD}%</span>
              <span className="font-mono tabular-nums">Demo sensor</span>
            </div>
          </div>
        </div>

        {/* 2. Temperature */}
        <div className="bg-white border border-[#DCE3DA] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A554D]">Temperature</span>
            <Thermometer className="w-5 h-5 text-[#D97706]" />
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono tabular-nums text-4xl font-bold text-[#111814]">
              {sensors.sensorsHealthy ? `${sensors.temperature}°C` : 'Error'}
            </span>
            <span
              className={`text-sm font-semibold ${
                !sensors.sensorsHealthy
                  ? 'text-[#DC2626]'
                  : sensors.temperature >= 34
                  ? 'text-[#D97706]'
                  : 'text-[#15803D]'
              }`}
            >
              {!sensors.sensorsHealthy
                ? 'Offline'
                : sensors.temperature >= 34
                ? 'Hot'
                : sensors.temperature <= 18
                ? 'Cool'
                : 'Normal'}
            </span>
          </div>

          <div className="text-xs text-[#5B685E]">
            DHT22 air temperature reading (simulated)
          </div>
        </div>

        {/* 3. Humidity */}
        <div className="bg-white border border-[#DCE3DA] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A554D]">Humidity</span>
            <Wind className="w-5 h-5 text-[#0284C7]" />
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono tabular-nums text-4xl font-bold text-[#111814]">
              {sensors.sensorsHealthy ? `${sensors.humidity}%` : 'Error'}
            </span>
            <span className="text-sm font-semibold text-[#4A554D]">
              {!sensors.sensorsHealthy
                ? 'Offline'
                : sensors.humidity >= 75
                ? 'Humid'
                : sensors.humidity <= 35
                ? 'Dry Air'
                : 'Comfortable'}
            </span>
          </div>

          <div className="text-xs text-[#5B685E]">
            DHT22 relative air humidity (simulated)
          </div>
        </div>

        {/* 4. Rain Detection */}
        <div className="bg-white border border-[#DCE3DA] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A554D]">Rain Detection</span>
            <CloudRain
              className={`w-5 h-5 ${
                sensors.rainDetected ? 'text-[#0284C7]' : 'text-[#6A776D]'
              }`}
            />
          </div>

          <div>
            <span
              className={`font-display text-3xl font-bold ${
                !sensors.sensorsHealthy
                  ? 'text-[#DC2626]'
                  : sensors.rainDetected
                  ? 'text-[#0284C7]'
                  : 'text-[#111814]'
              }`}
            >
              {!sensors.sensorsHealthy
                ? 'Sensor Error'
                : sensors.rainDetected
                ? 'Detected'
                : 'Not Detected'}
            </span>
          </div>

          <div className="text-xs text-[#5B685E]">
            {sensors.rainDetected
              ? 'Rain override active — automatic watering stopped'
              : 'Clear weather — automatic irrigation allowed'}
          </div>
        </div>

        {/* 5. Water Pump Status */}
        <div
          className={`rounded-xl border p-6 flex flex-col justify-between space-y-4 transition-colors ${
            decision.pumpOn
              ? 'bg-[#F0FDF4] border-[#86EFAC]'
              : 'bg-white border-[#DCE3DA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A554D]">Water Pump Status</span>
            <Power
              className={`w-5 h-5 ${
                decision.pumpOn ? 'text-[#15803D]' : 'text-[#6A776D]'
              }`}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span
              className={`font-display text-4xl font-bold ${
                decision.pumpOn ? 'text-[#15803D]' : 'text-[#111814]'
              }`}
            >
              {decision.pumpOn ? 'ON' : 'OFF'}
            </span>

            {mode === 'manual' && (
              <button
                type="button"
                onClick={() => setManualPumpOn(!manualPumpOn)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  manualPumpOn
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                    : 'bg-[#15803D] hover:bg-[#166534] text-white'
                }`}
              >
                {manualPumpOn ? 'Turn OFF' : 'Turn ON'}
              </button>
            )}
          </div>

          <div className="text-xs text-[#5B685E]">
            {decision.pumpOn
              ? 'Water is flowing to the field through the relay'
              : 'Pump is idle on standby'}
          </div>
        </div>

        {/* 6. Operating Mode */}
        <div className="bg-white border border-[#DCE3DA] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#4A554D]">Operating Mode</span>
            <Sliders className="w-5 h-5 text-[#15803D]" />
          </div>

          <div
            className="grid grid-cols-2 gap-1.5 p-1 bg-[#F1F5F0] rounded-lg"
            role="group"
            aria-label="Operating Mode"
          >
            <button
              type="button"
              onClick={() => setMode('automatic')}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'automatic'
                  ? 'bg-white text-[#15803D] shadow-sm'
                  : 'text-[#5B685E] hover:text-[#111814]'
              }`}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'manual'
                  ? 'bg-white text-[#111814] shadow-sm'
                  : 'text-[#5B685E] hover:text-[#111814]'
              }`}
            >
              Manual
            </button>
          </div>

          <div className="text-xs text-[#5B685E]">
            {mode === 'automatic'
              ? 'Sensors control the pump automatically'
              : 'Use the pump button to control watering manually'}
          </div>
        </div>
      </section>

      {/* Simple Soil Moisture Trend Chart */}
      <section className="bg-white border border-[#DCE3DA] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-semibold text-base text-[#111814]">
              Recent Soil Moisture Trend
            </h2>
            <p className="text-xs text-[#5B685E]">
              Updates live as sensor readings change. The dashed line marks the {DRY_SOIL_THRESHOLD}% dry-soil trigger.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#5B685E]">
            Simulated Demo Data
          </span>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="simpleMoistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE3" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#5B685E' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5B685E' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DCE3DA',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine
                y={DRY_SOIL_THRESHOLD}
                stroke="#D97706"
                strokeDasharray="4 4"
                label={{
                  value: '30% Dry Limit',
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: '#B45309',
                }}
              />
              <Area
                type="monotone"
                dataKey="moisture"
                name="Soil Moisture (%)"
                stroke="#15803D"
                strokeWidth={2.5}
                fill="url(#simpleMoistureGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
