import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude und Longitude fehlen." });
    }

    // 1. Live-Wetterdaten von Open-Meteo abrufen (Vollkommen ohne API-Key!)
    const url = `https://open-meteo.com{lat}&longitude=${lng}&hourly=temperature_2m,weather_code,pressure_msl,wind_speed_10m&current=temperature_2m,weather_code,pressure_msl,wind_speed_10m&timezone=auto&forecast_days=1`;
    const response = await axios.get(url);

    const hourly = response.data.hourly;
    const current = response.data.current;

    // 2. Beißindex-Algorithmus für alle 24 Stunden berechnen
    const biteIndexHourly = hourly.time.map((_: any, index: number) => {
      const temp = hourly.temperature_2m[index];
      const pressure = hourly.pressure_msl[index];
      const wind = hourly.wind_speed_10m[index];
      const code = hourly.weather_code[index];

      let score = 50; // Startwert (neutral)

      // Faktor Luftdruck (Fische lieben stabilen Standardluftdruck von ~1013 hPa)
      if (pressure >= 1008 && pressure <= 1018) score += 20;
      else if (pressure < 1000 || pressure > 1025) score -= 15;

      // Faktor Wind (Zu starker Wind drückt auf die Beißlaune)
      if (wind < 15) score += 15;
      else if (wind > 30) score -= 20;

      // Faktor Bewölkung/Wetter (Leichter Regen/Bewölkung regt Raubfische an, extremes Unwetter blockiert)
      if ([1, 2, 3].includes(code)) score += 15; // Leicht bewölkt / wolkig
      if ([51, 53, 61, 63].includes(code)) score += 10; // Leichter Regen / Nieselregen
      if ([95, 96, 99].includes(code)) score -= 30; // Gewitter / Unwetter

      // Faktor Temperatur (Extreme Hitze drückt Sauerstoff aus dem Wasser)
      if (temp > 28) score -= 15;
      else if (temp >= 12 && temp <= 22) score += 10;

      // Grenzen absichern (0 bis 100%)
      return Math.max(10, Math.min(100, score));
    });

    // Aktuellen Index ermitteln
    const currentHourIndex = new Date().getHours();
    const currentBiteIndex = biteIndexHourly[currentHourIndex] || 50;

    // Alles sauber verpackt ans Frontend senden
    res.json({
      current: {
        temp: current.temperature_2m,
        pressure: current.pressure_msl,
        wind: current.wind_speed_10m,
        code: current.weather_code,
        biteIndex: currentBiteIndex,
      },
      hourlyBiteIndex: biteIndexHourly, // Ein Array mit genau 24 Zahlenwerten!
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
