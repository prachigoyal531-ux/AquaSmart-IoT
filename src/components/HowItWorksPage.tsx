import React from 'react';
import {
  ArrowRight,
  CloudRain,
  Cpu,
  Droplets,
  GitBranch,
  Power,
  Thermometer,
  Zap,
} from 'lucide-react';

const FLOW_BLOCKS = [
  {
    title: 'Sensors',
    subtitle: 'Soil, DHT22 & Rain',
    icon: Droplets,
  },
  {
    title: 'ESP32',
    subtitle: 'Microcontroller',
    icon: Cpu,
  },
  {
    title: 'Decision Making',
    subtitle: 'Moisture & Rain Rules',
    icon: GitBranch,
  },
  {
    title: 'Relay Module',
    subtitle: 'Electrical Switch',
    icon: Zap,
  },
  {
    title: 'Water Pump',
    subtitle: 'Field Irrigation',
    icon: Power,
  },
];

const WORKING_STEPS = [
  {
    number: '1',
    title: 'Sensors measure soil moisture, temperature, humidity, and rainfall.',
    detail:
      'Field sensors continuously check how dry the soil is, the surrounding air temperature and humidity, and whether rain is falling.',
  },
  {
    number: '2',
    title: 'ESP32 receives the sensor readings.',
    detail:
      'The ESP32 microcontroller reads the analog and digital signals from every sensor and converts them into readable percentages and values.',
  },
  {
    number: '3',
    title: 'The controller checks whether irrigation is needed.',
    detail:
      'If soil moisture is below 30% and no rain is detected, watering is needed. If moisture is 30% or higher, or if rain is detected, watering is skipped.',
  },
  {
    number: '4',
    title: 'The relay controls the water pump.',
    detail:
      'The ESP32 sends a safe low-voltage signal to the relay module, which acts like an automatic switch to turn the water pump ON or OFF.',
  },
  {
    number: '5',
    title: 'The field receives water only when required.',
    detail:
      'Crops stay hydrated without over-watering, saving water and electricity compared to fixed timer irrigation.',
  },
];

const HARDWARE_ITEMS = [
  {
    name: 'Soil Moisture Sensor',
    icon: Droplets,
    description:
      'Inserted into the soil to measure how much water is present near the plant roots. Tells the system if the soil is dry or wet.',
  },
  {
    name: 'DHT22 Sensor',
    icon: Thermometer,
    description:
      'Measures the ambient air temperature (°C) and relative humidity (%) around the crops to monitor weather conditions.',
  },
  {
    name: 'Rain Sensor',
    icon: CloudRain,
    description:
      'Detects raindrops falling on its sensing plate. Immediately stops automatic irrigation when it rains so water is not wasted.',
  },
  {
    name: 'ESP32 Microcontroller',
    icon: Cpu,
    description:
      'The brain of the project. Reads all sensor values, runs the irrigation rules, connects over Wi-Fi, and commands the relay.',
  },
  {
    name: 'Relay Module',
    icon: Zap,
    description:
      'An electronic switch that safely separates the low-power ESP32 from the higher-power water pump circuit.',
  },
  {
    name: 'Water Pump',
    icon: Power,
    description:
      'Pumps water from the tank into the crop irrigation pipes whenever the relay switches it ON.',
  },
];

export function HowItWorksPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <p className="text-xs font-medium text-[#15803D]">
          System Overview · Simple Architecture & Hardware Guide
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#111814] mt-1">
          How AquaSmart Works
        </h1>
        <p className="text-sm text-[#4A554D] mt-1 max-w-2xl">
          A step-by-step look at how sensors, the ESP32 controller, and the relay work together to water crops automatically only when needed.
        </p>
      </section>

      {/* Visual Block Diagram */}
      <section className="bg-white border border-[#DCE3DA] rounded-xl p-6 space-y-5">
        <div>
          <h2 className="font-display font-semibold text-base text-[#111814]">
            System Block Diagram
          </h2>
          <p className="text-xs text-[#5B685E] mt-0.5">
            Signal flow from field sensing to automatic water pump control
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {FLOW_BLOCKS.map((block, index) => {
            const Icon = block.icon;
            return (
              <React.Fragment key={block.title}>
                <div className="flex-1 p-4 rounded-xl bg-[#F8FAF7] border border-[#DCE3DA] flex items-center lg:flex-col lg:text-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] text-[#15803D] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm text-[#111814]">
                      {block.title}
                    </div>
                    <div className="text-xs text-[#5B685E] mt-0.5">{block.subtitle}</div>
                  </div>
                </div>

                {index < FLOW_BLOCKS.length - 1 && (
                  <div className="flex justify-center text-[#15803D] shrink-0">
                    <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* 5-Step Explanation + Prototype Image */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#DCE3DA] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display font-semibold text-base text-[#111814]">
              Step-by-Step Working Process
            </h2>
            <p className="text-xs text-[#5B685E] mt-0.5">
              How each irrigation cycle runs automatically
            </p>
          </div>

          <ol className="space-y-4">
            {WORKING_STEPS.map((step) => (
              <li key={step.number} className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-[#15803D] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-display font-semibold text-sm text-[#111814]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#4A554D] mt-1 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#DCE3DA] rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 min-h-[240px] bg-[#EEF2EC]">
            <img
              src="/src/assets/images/iot_esp32_node_1794827455280.jpg"
              alt="ESP32 smart irrigation hardware prototype with soil sensor, DHT22, rain plate, relay, and water pump"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 space-y-1.5 border-t border-[#E8EDE7]">
            <h3 className="font-display font-semibold text-sm text-[#111814]">
              Hardware Prototype Setup
            </h3>
            <p className="text-xs text-[#4A554D] leading-relaxed">
              This dashboard runs completely in Demo Mode without requiring physical hardware. When an ESP32 board is connected later, it can send JSON readings to the built-in <span className="font-mono text-[#111814]">/api/iot/telemetry</span> endpoint.
            </p>
          </div>
        </div>
      </section>

      {/* Hardware Components Explained Simply */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-[#111814]">
            Hardware Components Explained
          </h2>
          <p className="text-xs text-[#5B685E] mt-0.5">
            The role of each physical component in the smart irrigation system
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HARDWARE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="bg-white border border-[#DCE3DA] rounded-xl p-5 space-y-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF3EC] text-[#15803D] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-sm text-[#111814]">
                  {item.name}
                </h3>
                <p className="text-xs text-[#4A554D] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
