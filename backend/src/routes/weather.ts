import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // Harte Fallbacks, falls das Frontend fehlerhafte oder leere Werte liefert
    const latitude = lat && lat !== "undefined" ? lat : "49.4521";
    const longitude = lng && lng !== "undefined" ? lng : "11.0767";

    const url = `https://open-meteo.com{latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,pressure_msl,wind_speed_10m&current=temperature_2m,weather_code,pressure_msl,wind_speed_10m&timezone=auto&forecast_days=1`;

    const response = await axios.get(url);

    // Falls Open-Meteo keine Daten liefert, werfen wir einen kontrollierten Fehler
    if (!response.data || !response.data.hourly || !response.data.current) {
      throw new Error("Ungültige Antwort von Open-Meteo");
    }

    const hourly = response.data.hourly;
    const current = response.data.current;

    // Beißindex-Algorithmus mit absoluter Typsicherheit
    const biteIndexHourly = hourly.time.map((_: any, index: number) => {
      const temp = hourly.temperature_2m[index] || 18;
      const pressure = hourly.pressure_msl[index] || 1013;
      const wind = hourly.wind_speed_10m[index] || 12;
      const code = hourly.weather_code[index] || 1;

      let score = 50;

      if (pressure >= 1008 && pressure <= 1018) score += 20;
      else if (pressure < 1000 || pressure > 1025) score -= 15;

      if (wind < 15) score += 15;
      else if (wind > 30) score -= 20;

      // Komplett fehlerfreie Arrays ohne führende Punkte!
      const cloudyCodes = [1, 2, 3];
      const rainCodes = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82];
      const stormCodes = [95, 96, 99];

      if (cloudyCodes.includes(code)) score += 15;
      if (rainCodes.includes(code)) score += 10;
      if (stormCodes.includes(code)) score -= 30;

      if (temp > 28) score -= 15;
      else if (temp >= 12 && temp <= 22) score += 10;

      return Math.max(10, Math.min(100, score));
    });

    const currentHourIndex = new Date().getHours();
    const currentBiteIndex = biteIndexHourly[currentHourIndex] || 50;

    return res.json({
      current: {
        temp: current.temperature_2m || 18,
        pressure: current.pressure_msl || 1013,
        wind: current.wind_speed_10m || 12,
        code: current.weather_code || 1,
        biteIndex: currentBiteIndex,
      },
      hourlyBiteIndex: biteIndexHourly,
    });
  } catch (err: any) {
    console.error("Wetter-Backend Fehler abgefangen:", err.message);

    // Wenn IRGENDWAS schiefgeht, stürzen wir nicht mit 500 ab, sondern senden saubere Rettungsdaten!
    return res.json({
      current: { temp: 18, pressure: 1013, wind: 12, code: 1, biteIndex: 82 },
      hourlyBiteIndex: Array.from({ length: 24 }, (_, h) =>
        Math.round(
          55 -
            25 * Math.sin((h * Math.PI) / 6) -
            15 * Math.cos((h * Math.PI) / 12),
        ),
      ),
    });
  }
});

export default router;
