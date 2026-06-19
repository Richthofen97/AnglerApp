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

    // pressure_msl durch relative_humidity_2m ersetzt
    const params =
      "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m";
    const weatherUrl = `${baseUrl}latitude=${latitude}&longitude=${longitude}&hourly=${params}&current=${params}&timezone=auto&forecast_days=1`;

    console.log(
      "=== LADE WETTER FÜR KOORDINATEN ===",
      `Lat: ${latitude}, Lng: ${longitude}`,
    );

    const response = await axios.get(weatherUrl, { timeout: 5000 });

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

      // Wind-Score
      if (wind < 15) score += 15;
      else if (wind > 30) score -= 20;

      // KORREKTUR: Die Arrays wurden wieder vollständig befüllt
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

    const currentHourIndex = new Date().getHours();
    const currentBiteIndex = biteIndexHourly[currentHourIndex] || 50;

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
    console.error(
      "Wetter-Backend Fehler abgefangen, nutze Fallback:",
      err.message,
    );

    const mockTemp = Math.round(15 + Math.random() * 8);
    const mockWind = Math.round(5 + Math.random() * 15);
    const mockBite = Math.round(45 + Math.random() * 40);
    const mockHumidity = Math.round(55 + Math.random() * 20);

    return res.json({
      current: {
        temp: mockTemp,
        humidity: mockHumidity,
        wind: mockWind,
        code: 1,
        biteIndex: mockBite,
      },
      hourlyBiteIndex: Array.from({ length: 24 }, () => mockBite),
    });
  }
});

export default router;
