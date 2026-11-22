import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory store for real ESP32 / Arduino hardware telemetry ingestion
interface HardwarePayload {
  deviceId: string;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  rainDetected: boolean;
  flowRateLpm: number;
  receivedAt: string;
}

let latestHardwareTelemetry: HardwarePayload | null = null;

// Helper: deterministic simulated weather generator for fallback or demo mode
function generateSimulatedWeather(location: string) {
  const seed = location
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const conditions = [
    { condition: 'Clear Sky', rainProb: 10, tempBase: 27, humidityBase: 52 },
    { condition: 'Partly Cloudy', rainProb: 22, tempBase: 25, humidityBase: 58 },
    { condition: 'Sunny & Warm', rainProb: 8, tempBase: 31, humidityBase: 44 },
    { condition: 'Scattered Clouds', rainProb: 35, tempBase: 23, humidityBase: 64 },
  ];

  const picked = conditions[seed % conditions.length];
  const nowHour = new Date().getHours();
  const diurnalOffset = Math.sin(((nowHour - 6) / 24) * Math.PI * 2) * 4;
  const temperature = Number((picked.tempBase + diurnalOffset).toFixed(1));

  const forecast = Array.from({ length: 6 }, (_, idx) => {
    const slotDate = new Date(Date.now() + (idx + 1) * 3 * 3600 * 1000);
    const label = slotDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const slotProb = Math.min(95, Math.max(5, picked.rainProb + ((idx * 7 + seed) % 24) - 8));
    return {
      time: label,
      temperature: Number((temperature + Math.sin(idx) * 2.2).toFixed(1)),
      humidity: Math.min(92, Math.max(30, Math.round(picked.humidityBase + idx * 1.5))),
      rainProbability: slotProb,
      condition: slotProb > 55 ? 'Light Showers' : picked.condition,
    };
  });

  return {
    location: location || 'Pune, India',
    temperature,
    humidity: picked.humidityBase,
    condition: picked.condition,
    rainProbability: picked.rainProb,
    windSpeedKmh: Number((8 + (seed % 11)).toFixed(1)),
    isDemo: true,
    source: 'Simulated Demo Weather',
    updatedAt: new Date().toISOString(),
    forecast,
  };
}

function mapWmoCodeToCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Light Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

// GET /api/weather?location=...&mode=live|simulated
app.get('/api/weather', async (req, res) => {
  const location = String(req.query.location || 'Pune, India').trim();
  const mode = String(req.query.mode || 'live').trim();

  if (mode === 'simulated') {
    return res.json(generateSimulatedWeather(location));
  }

  // 1. Try OpenWeatherMap if server env key is configured
  const owmKey = process.env.OPENWEATHER_API_KEY?.trim();
  if (owmKey) {
    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${owmKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&cnt=6&appid=${owmKey}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (currentRes.ok && forecastRes.ok) {
        const current = (await currentRes.json()) as any;
        const forecastData = (await forecastRes.json()) as any;
        const slots = (forecastData.list || []).slice(0, 6).map((item: any) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          temperature: Number((item.main?.temp ?? 25).toFixed(1)),
          humidity: Math.round(item.main?.humidity ?? 55),
          rainProbability: Math.round((item.pop ?? 0) * 100),
          condition: item.weather?.[0]?.main || 'Clear',
        }));

        const maxNextRainProb = slots.length
          ? Math.max(...slots.slice(0, 2).map((s: any) => s.rainProbability))
          : 0;

        return res.json({
          location: `${current.name || location}${current.sys?.country ? `, ${current.sys.country}` : ''}`,
          temperature: Number((current.main?.temp ?? 25).toFixed(1)),
          humidity: Math.round(current.main?.humidity ?? 55),
          condition: current.weather?.[0]?.description
            ? current.weather[0].description.replace(/\b\w/g, (l: string) => l.toUpperCase())
            : 'Clear Sky',
          rainProbability: maxNextRainProb,
          windSpeedKmh: Number(((current.wind?.speed ?? 2.5) * 3.6).toFixed(1)),
          isDemo: false,
          source: 'OpenWeatherMap Live API',
          updatedAt: new Date().toISOString(),
          forecast: slots,
        });
      }
    } catch {
      // Fall through to Open-Meteo or Demo fallback
    }
  }

  // 2. Try Open-Meteo keyless live weather API
  try {
    const cityOnly = location.split(',')[0].trim();
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOnly)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(4500) }
    );

    if (geoRes.ok) {
      const geoData = (await geoRes.json()) as any;
      const place = geoData.results?.[0];
      if (place) {
        const meteoRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&forecast_days=2&timezone=auto`,
          { signal: AbortSignal.timeout(4500) }
        );

        if (meteoRes.ok) {
          const meteo = (await meteoRes.json()) as any;
          const nowIso = meteo.current?.time;
          const hourlyTimes: string[] = meteo.hourly?.time || [];
          let startIndex = hourlyTimes.findIndex((t) => t >= (nowIso || ''));
          if (startIndex < 0) startIndex = 0;

          const forecast = [];
          for (let offset = 1; offset <= 6; offset++) {
            const idx = Math.min(startIndex + offset * 3, hourlyTimes.length - 1);
            const rawTime = hourlyTimes[idx] || '';
            const hhmm = rawTime.includes('T') ? rawTime.split('T')[1].slice(0, 5) : `+${offset * 3}h`;
            forecast.push({
              time: hhmm,
              temperature: Number((meteo.hourly?.temperature_2m?.[idx] ?? 24).toFixed(1)),
              humidity: Math.round(meteo.hourly?.relative_humidity_2m?.[idx] ?? 55),
              rainProbability: Math.round(meteo.hourly?.precipitation_probability?.[idx] ?? 10),
              condition: mapWmoCodeToCondition(meteo.hourly?.weather_code?.[idx] ?? 0),
            });
          }

          const nearTermRain = forecast.length
            ? Math.max(...forecast.slice(0, 2).map((f) => f.rainProbability))
            : 10;

          return res.json({
            location: `${place.name}${place.country ? `, ${place.country}` : ''}`,
            temperature: Number((meteo.current?.temperature_2m ?? 25).toFixed(1)),
            humidity: Math.round(meteo.current?.relative_humidity_2m ?? 55),
            condition: mapWmoCodeToCondition(meteo.current?.weather_code ?? 0),
            rainProbability: nearTermRain,
            windSpeedKmh: Number((meteo.current?.wind_speed_10m ?? 9).toFixed(1)),
            isDemo: false,
            source: 'Open-Meteo Live Weather',
            updatedAt: new Date().toISOString(),
            forecast,
          });
        }
      }
    }
  } catch {
    // Gracefully fall back to simulated weather
  }

  return res.json(generateSimulatedWeather(location));
});

// POST /api/iot/telemetry - Real ESP32 / Arduino HTTP ingestion endpoint
app.post('/api/iot/telemetry', (req, res) => {
  const {
    deviceId = 'ESP32-FIELD-01',
    soilMoisture,
    temperature,
    humidity,
    rainDetected = false,
    flowRateLpm = 0,
  } = req.body || {};

  if (
    typeof soilMoisture !== 'number' ||
    typeof temperature !== 'number' ||
    typeof humidity !== 'number'
  ) {
    return res.status(400).json({
      error: 'Invalid telemetry payload. Numeric soilMoisture, temperature, and humidity are required.',
    });
  }

  latestHardwareTelemetry = {
    deviceId: String(deviceId),
    soilMoisture: Math.max(0, Math.min(100, Number(soilMoisture.toFixed(1)))),
    temperature: Number(temperature.toFixed(1)),
    humidity: Math.max(0, Math.min(100, Number(humidity.toFixed(1)))),
    rainDetected: Boolean(rainDetected),
    flowRateLpm: Math.max(0, Number(Number(flowRateLpm).toFixed(1))),
    receivedAt: new Date().toISOString(),
  };

  return res.json({
    ok: true,
    message: 'Hardware telemetry accepted',
    telemetry: latestHardwareTelemetry,
  });
});

// GET /api/iot/telemetry - Fetch latest hardware payload
app.get('/api/iot/telemetry', (_req, res) => {
  if (!latestHardwareTelemetry) {
    return res.json({ connected: false, telemetry: null });
  }
  const ageMs = Date.now() - new Date(latestHardwareTelemetry.receivedAt).getTime();
  return res.json({
    connected: ageMs < 60_000,
    ageSeconds: Math.round(ageMs / 1000),
    telemetry: latestHardwareTelemetry,
  });
});

// POST /api/recommendations - Server-side Gemini AI Agronomy Advisory with rule-based fallback
app.post('/api/recommendations', async (req, res) => {
  const { sensors, weather, crop, decision } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(200).json({
      source: 'rule-based',
      notice: 'Gemini API key is not configured on the server. Showing intelligent rule-based agronomy advisories.',
      recommendations: buildFallbackRecommendations(sensors, weather, crop, decision),
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Analyze this live smart agriculture telemetry and return 3 concise, actionable irrigation and crop health recommendations:
Crop: ${crop?.name || 'Wheat'} (Optimal Soil Moisture: ${crop?.minMoisture ?? 30}%-${crop?.maxMoisture ?? 45}%, Growth Stage: ${crop?.growthStage || 'Vegetative'})
Sensors: Soil Moisture = ${sensors?.soilMoisture ?? 35}%, Air Temp = ${sensors?.temperature ?? 26}°C, Humidity = ${sensors?.humidity ?? 55}%, Rain Detected = ${Boolean(sensors?.rainDetected)}, Sensors Online = ${Boolean(sensors?.sensorsOnline)}
Weather Forecast: Condition = ${weather?.condition || 'Clear'}, Near-Term Rain Probability = ${weather?.rainProbability ?? 10}%, Location = ${weather?.location || 'Farm'}
Current Engine Decision: ${decision?.reason || 'Monitoring'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an agricultural irrigation engineer for AquaSmart. Provide concise, practical, science-backed irrigation and water-conservation recommendations tailored to the telemetry. Keep titles under 6 words and descriptions 1-2 crisp sentences.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              priority: { type: Type.STRING, description: 'One of: high, medium, optimal' },
              category: { type: Type.STRING, description: 'One of: Irrigation, Weather, Crop Health, Conservation' },
            },
            required: ['title', 'detail', 'priority', 'category'],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '[]').trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      return res.json({
        source: 'gemini',
        model: 'gemini-4-hydrogen',
        recommendations: parsed.slice(0, 4),
      });
    }
  } catch (err) {
    console.error('Gemini API error:', err instanceof Error ? err.message : err);
  }

  return res.json({
    source: 'rule-based',
    notice: 'AI service unavailable right now. Showing rule-based agronomy advisories.',
    recommendations: buildFallbackRecommendations(sensors, weather, crop, decision),
  });
});

function buildFallbackRecommendations(sensors: any, weather: any, crop: any, _decision: any) {
  const recs: Array<{ title: string; detail: string; priority: string; category: string }> = [];
  const moisture = Number(sensors?.soilMoisture ?? 35);
  const minM = Number(crop?.minMoisture ?? 30);
  const maxM = Number(crop?.maxMoisture ?? 45);
  const temp = Number(sensors?.temperature ?? 25);
  const rainProb = Number(weather?.rainProbability ?? 10);

  if (!sensors?.sensorsOnline) {
    return [
      {
        title: 'Inspect Sensor Node Connectivity',
        detail: 'Field sensor telemetry is offline. Check ESP32 power supply and probe wiring before resuming automatic irrigation.',
        priority: 'high',
        category: 'Irrigation',
      },
    ];
  }

  if (sensors?.rainDetected) {
    recs.push({
      title: 'Rainfall Active — Pump Locked Off',
      detail: `Natural precipitation is replenishing the ${crop?.name || 'crop'} root zone. Keep irrigation paused to avoid waterlogging and nutrient runoff.`,
      priority: 'optimal',
      category: 'Weather',
    });
  } else if (moisture < minM && rainProb >= 60) {
    recs.push({
      title: 'Postpone Irrigation for Expected Rain',
      detail: `Moisture (${moisture}%) is below ${minM}%, but ${rainProb}% rain probability is forecast shortly. Holding pump saves irrigation water.`,
      priority: 'medium',
      category: 'Conservation',
    });
  } else if (moisture < minM) {
    recs.push({
      title: 'Immediate Root-Zone Hydration Needed',
      detail: `Soil moisture at ${moisture}% is below the ${minM}% minimum for ${crop?.name || 'this crop'}. Irrigate until moisture reaches ${maxM}%.`,
      priority: 'high',
      category: 'Irrigation',
    });
  } else if (moisture > maxM) {
    recs.push({
      title: 'Soil Saturated — Avoid Over-Irrigation',
      detail: `Current moisture (${moisture}%) exceeds the ${maxM}% upper bound. Allow natural drainage to protect root aeration.`,
      priority: 'optimal',
      category: 'Crop Health',
    });
  } else {
    recs.push({
      title: 'Optimal Moisture Band Maintained',
      detail: `Soil moisture (${moisture}%) sits comfortably inside ${crop?.name || 'crop'}'s ${minM}%–${maxM}% target window. No watering cycle required.`,
      priority: 'optimal',
      category: 'Crop Health',
    });
  }

  if (temp >= 33) {
    recs.push({
      title: 'High Evapotranspiration Risk',
      detail: `Ambient temperature is ${temp}°C. Schedule active irrigation cycles during early morning or dusk to cut evaporation loss by up to 30%.`,
      priority: 'high',
      category: 'Weather',
    });
  } else {
    recs.push({
      title: 'Favorable Microclimate Window',
      detail: `Moderate ${temp}°C ambient temperature keeps canopy transpiration steady and minimizes moisture loss between cycles.`,
      priority: 'optimal',
      category: 'Weather',
    });
  }

  recs.push({
    title: `${crop?.name || 'Crop'} ${crop?.growthStage || 'Growth'} Care`,
    detail: `Maintain consistent moisture between ${minM}% and ${maxM}% during ${crop?.growthStage || 'active growth'} to maximize yield per liter.`,
    priority: 'medium',
    category: 'Conservation',
  });

  return recs;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AquaSmart server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
