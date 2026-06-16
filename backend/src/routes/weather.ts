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

    const baseUrl = "https://open-meteo.com?";
    const params = "temperature_2m,weather_code,pressure_msl,wind_speed_10m";
    const weatherUrl = `${baseUrl}latitude=${latitude}&longitude=${longitude}&hourly=${params}&current=${params}&timezone=auto&forecast_days=1`;

    console.log("=== API JETZT MIT ECHTEN KOORDINATEN ===", weatherUrl);

    const response = await axios.get(weatherUrl, { timeout: 5000 });

    if (!response.data || !response.data.hourly || !response.data.current) {
      throw new Error("Ungültige Antwortstruktur von Open-Meteo");
    }

    const hourly = response.data.hourly;
    const current = response.data.current;

    const biteIndexHourly = hourly.time.map((_: any, index: number) => {
      const temp = hourly.temperature_2m[index] ?? 18;
      const pressure = hourly.pressure_msl[index] ?? 1013;
      const wind = hourly.wind_speed_10m[index] ?? 12;
      const code = hourly.weather_code[index] ?? 1;

      let score = 50;

      if (pressure >= 1008 && pressure <= 1018) score += 20;
      else if (pressure < 1000 || pressure > 1025) score -= 15;

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

    const currentHourIndex = new Date().getHours();
    const currentBiteIndex = biteIndexHourly[currentHourIndex] || 50;

    return res.json({
      current: {
        temp: current.temperature_2m ?? 18,
        pressure: current.pressure_msl ?? 1013,
        wind: current.wind_speed_10m ?? 12,
        code: current.weather_code ?? 1,
        biteIndex: currentBiteIndex,
      },
      hourlyBiteIndex: biteIndexHourly,
    });
  } catch (err: any) {
    console.error("Wetter-Backend Fehler abgefangen:", err.message);

    const mockTemp = Math.round(15 + Math.random() * 8);
    const mockWind = Math.round(5 + Math.random() * 15);
    const mockBite = Math.round(45 + Math.random() * 40);

    return res.json({
      current: {
        temp: mockTemp,
        pressure: 1013,
        wind: mockWind,
        code: 1,
        biteIndex: mockBite,
      },
      hourlyBiteIndex: Array.from({ length: 24 }, () => mockBite),
    });
  }
});

export default router;
