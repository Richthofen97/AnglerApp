import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const latitudeNum = parseFloat(lat as string);
    const longitudeNum = parseFloat(lng as string);

    const latitude = !isNaN(latitudeNum) ? latitudeNum.toString() : "49.4521";
    const longitude = !isNaN(longitudeNum)
      ? longitudeNum.toString()
      : "11.0767";

    const baseUrl = "https://api.open-meteo.com/v1/forecast?";
    const params =
      "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m";

    // Wichtig: Wir erzwingen Europe/Berlin direkt in der Open-Meteo API
    const weatherUrl = `${baseUrl}latitude=${latitude}&longitude=${longitude}&hourly=${params}&current=${params}&timezone=Europe/Berlin&forecast_days=1`;

    console.log(
      "=== LADE WETTER FÜR KOORDINATEN ===",
      `Lat: ${latitude}, Lng: ${longitude}`,
    );

    const response = await axios.get(weatherUrl, { timeout: 7000 }); // Timeout leicht erhöht auf 7s

    if (!response.data || !response.data.hourly || !response.data.current) {
      throw new Error("Ungültige Antwortstruktur von Open-Meteo");
    }

    const hourly = response.data.hourly;
    const current = response.data.current;

    const biteIndexHourly = hourly.time.map((_: any, index: number) => {
      const temp = hourly.temperature_2m[index] ?? 18;
      const wind = hourly.wind_speed_10m[index] ?? 12;
      const code = hourly.weather_code[index] ?? 1;

      let score = 50;

      if (wind < 15) score += 15;
      else if (wind > 30) score -= 20;

      const cloudyCodes = "1,2,3".split(",").map(Number);
      const rainCodes = "51,53,55,61,63,65,66,67,80,81,82"
        .split(",")
        .map(Number);
      const stormCodes = "95,96,99".split(",").map(Number);

      if (cloudyCodes.includes(code)) score += 15;
      if (rainCodes.includes(code)) score += 10;
      if (stormCodes.includes(code)) score -= 30;

      if (temp > 28) score -= 15;
      else if (temp >= 12 && temp <= 22) score += 10;

      return Math.max(10, Math.min(100, score));
    });

    // FIX: Holt die aktuelle Stunde passend zur deutschen Zeitzone (Europe/Berlin)
    const currentHourInGermany = parseInt(
      new Date().toLocaleString("de-DE", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
      }),
    );
    const currentBiteIndex = biteIndexHourly[currentHourInGermany] || 50;

    return res.json({
      current: {
        temp: current.temperature_2m ?? 18,
        humidity: current.relative_humidity_2m ?? 60,
        wind: current.wind_speed_10m ?? 12,
        code: current.weather_code ?? 1,
        biteIndex: currentBiteIndex,
      },
      hourlyBiteIndex: biteIndexHourly,
    });
  } catch (err: any) {
    // WICHTIG: Loggt den echten Fehler im Render-Dashboard, damit wir ihn sehen!
    console.error("❌ ECHTER WETTER-FEHLER AUF RENDER:", err.message);

    // Bessere Fallback-Werte (statisch statt Math.random), damit man merkt, dass es ein Fallback ist
    return res.json({
      current: {
        temp: 18,
        humidity: 60,
        wind: 10,
        code: 1,
        biteIndex: 75,
      },
      hourlyBiteIndex: Array.from({ length: 24 }, () => 75),
    });
  }
});

export default router;
