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
    const weatherUrl = `${baseUrl}latitude=${latitude}&longitude=${longitude}&hourly=${params}&current=${params}&timezone=Europe/Berlin&forecast_days=1`;

    console.log(
      "=== API RUFT WETTER ABRUFEN ===",
      `Lat: ${latitude}, Lng: ${longitude}`,
    );

    // TARNUNG: Wir fügen Header hinzu, damit Open-Meteo den Render-Server nicht blockiert!
    const response = await axios.get(weatherUrl, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

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
    console.error("❌ ECHTER WETTER-FEHLER AUF RENDER:", err.message);

    // Deutlicher Test-Fallback (42 Grad), damit du in der UI SOFORT siehst, ob er im Catch-Block landet
    return res.json({
      current: {
        temp: 42,
        humidity: 99,
        wind: 99,
        code: 1,
        biteIndex: 10,
      },
      hourlyBiteIndex: Array.from({ length: 24 }, () => 10),
    });
  }
});

export default router;
