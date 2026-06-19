import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const latitudeNum = parseFloat(lat as string);
    const longitudeNum = parseFloat(lng as string);

    // Nutzen Nürnberg als Fallback
    const latitude = !isNaN(latitudeNum) ? latitudeNum : 49.4521;
    const longitude = !isNaN(longitudeNum) ? longitudeNum : 11.0767;

    // Wir nutzen die zuverlässige DWD API (Bright Sky), die Render-Server erlaubt
    const weatherUrl = `https://brightsky.dev{latitude}&lon=${longitude}&date=${new Date().toISOString().split("T")[0]}`;

    console.log(
      "=== API RUFT DWD WETTER (BRIGHT SKY) ABRUFEN ===",
      `Lat: ${latitude}, Lng: ${longitude}`,
    );

    const response = await axios.get(weatherUrl, { timeout: 8000 });

    if (!response.data || !response.data.weather) {
      throw new Error("Ungültige Antwortstruktur von Bright Sky");
    }

    const dwdWeatherData = response.data.weather;

    // Erstellt ein Array mit 24 Stunden, da Bright Sky stündliche Daten liefert
    const biteIndexHourly = Array.from({ length: 24 }).map((_, index) => {
      // Findet den passenden Eintrag für die Stunde oder nutzt den aktuellsten Eintrag als Fallback
      const hourData =
        dwdWeatherData.find(
          (w: any) => new Date(w.timestamp).getHours() === index,
        ) || dwdWeatherData[0];

      const temp = hourData?.temperature ?? 18;
      const wind = (hourData?.wind_speed ?? 12) * 3.6; // Umrechnung von m/s in km/h für deinen Algorithmus
      const condition = hourData?.icon ?? "clear";

      let score = 50;

      // Wind-Score (km/h)
      if (wind < 15) score += 15;
      else if (wind > 30) score -= 20;

      // Wetterbedingungen auswerten (Bright Sky nutzt Text-Icons statt Codes)
      if (["partly-cloudy", "cloudy"].includes(condition)) score += 15;
      if (["rain", "sleet", "snow"].includes(condition)) score += 10;
      if (["fog", "hail", "thunderstorm"].includes(condition)) score -= 30;

      if (temp > 28) score -= 15;
      else if (temp >= 12 && temp <= 22) score += 10;

      return Math.max(10, Math.min(100, score));
    });

    // Holt die aktuelle Stunde passend zur deutschen Zeitzone (Europe/Berlin)
    const currentHourInGermany = parseInt(
      new Date().toLocaleString("de-DE", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
      }),
    );

    // Aktuelle Live-Wetterwerte für das Dashboard extrahieren
    const liveData =
      dwdWeatherData.find(
        (w: any) => new Date(w.timestamp).getHours() === currentHourInGermany,
      ) || dwdWeatherData[0];

    // Mappe die DWD-Text-Icons zurück auf deine Frontend-Codes (0=Sonne, 1=Wolken, 45=Nebel, rest=Regen)
    let frontendCode = 1;
    if (liveData?.icon === "clear-day" || liveData?.icon === "clear-night")
      frontendCode = 0;
    if (liveData?.icon === "fog") frontendCode = 45;
    if (["rain", "thunderstorm", "snow", "sleet"].includes(liveData?.icon))
      frontendCode = 80;

    const currentBiteIndex = biteIndexHourly[currentHourInGermany] || 50;

    return res.json({
      current: {
        temp: liveData?.temperature ?? 18,
        humidity: liveData?.relative_humidity ?? 60,
        wind: Math.round((liveData?.wind_speed ?? 12) * 3.6), // km/h
        code: frontendCode,
        biteIndex: currentBiteIndex,
      },
      hourlyBiteIndex: biteIndexHourly,
    });
  } catch (err: any) {
    console.error("❌ BACKEND WETTER-FEHLER:", err.message);

    // Sicherer Fallback-Wert für den absoluten Notfall (Keine 42 Grad mehr!)
    return res.json({
      current: { temp: 17, humidity: 65, wind: 12, code: 1, biteIndex: 70 },
      hourlyBiteIndex: Array.from({ length: 24 }, () => 70),
    });
  }
});

export default router;
