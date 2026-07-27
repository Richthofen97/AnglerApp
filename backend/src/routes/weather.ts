import express from "express";

const router = express.Router();

// Umgestellt von GET auf POST, da wir die Daten jetzt vom Frontend empfangen
router.post("/", async (req, res) => {
  try {
    // Das Frontend schickt uns die komplette, rohe Antwort von Open-Meteo im req.body
    const weatherData = req.body;

    if (!weatherData || !weatherData.hourly || !weatherData.current) {
      throw new Error("Fehlende oder ungültige Wetterdaten im Request-Body");
    }

    const hourly = weatherData.hourly;
    const current = weatherData.current;

    // Berechnung des Beißindexes anhand der übermittelten Daten
    const biteIndexHourly = hourly.time.map((_: any, index: number) => {
      const temp = hourly.temperature_2m[index] ?? 18;
      const wind = hourly.wind_speed_10m[index] ?? 12;
      const code = hourly.weather_code[index] ?? 1;

      let score = 50;
      if (wind < 15) score += 15;
      else if (wind > 30) score -= 20;

      const cloudyCodes = [1, 2, 3];
      const rainCodes = [51, 53, 55, 61, 63, 65, 67, 80, 81, 82];
      const stormCodes = [95, 96, 99];

      if (cloudyCodes.includes(code)) score += 15;
      if (rainCodes.includes(code)) score += 10;
      if (stormCodes.includes(code)) score -= 30;

      if (temp > 30) score -= 20;
      else if (temp >= 12 && temp <= 22) score += 10;

      return Math.max(10, Math.min(100, score));
    });

    // Aktuelle deutsche Stunde ermitteln
    const currentHourInGermany = parseInt(
      new Date().toLocaleString("de-DE", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
      }),
    );
    const currentBiteIndex = biteIndexHourly[currentHourInGermany] || 50;

    // Rückgabe der fertig berechneten Daten an dein Frontend
    return res.json({
      current: {
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m ?? 60,
        wind: current.wind_speed_10m ?? 12,
        code: current.weather_code ?? 1,
        biteIndex: currentBiteIndex,
      },
      hourlyBiteIndex: biteIndexHourly,
    });
  } catch (err: any) {
    console.error("❌ BACKEND WETTER-BERECHNUNGSFEHLER:", err.message);

    // Fallback falls beim Parsen der Daten etwas schiefgeht
    return res.json({
      current: { temp: 36, humidity: 40, wind: 12, code: 0, biteIndex: 35 },
      hourlyBiteIndex: Array.from({ length: 24 }, () => 35),
    });
  }
});

export default router;
