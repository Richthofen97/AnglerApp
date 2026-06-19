const API_URL = import.meta.env.VITE_API_URL;

export async function getLiveWeather(lat: number, lng: number) {
  try {
    // Der Browser holt die echten Wetterdaten direkt von Open-Meteo ohne Blockade
    const baseUrl = "https://api.open-meteo.com/v1/forecast?";
    const openMeteoUrl = `${baseUrl}latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weather_code,wind_speed_10m&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Europe/Berlin&forecast_days=1`;

    const response = await fetch(openMeteoUrl);
    if (!response.ok)
      throw new Error("Direktabruf bei Open-Meteo fehlgeschlagen.");
    const rawWeatherData = await response.json();

    // Wir senden die Wetterdaten per POST an dein Backend für die Beißindex-Berechnung
    const res = await fetch(`${API_URL}/api/weather`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rawWeatherData),
    });

    if (!res.ok)
      throw new Error("Backend konnte den Beißindex nicht berechnen.");
    return await res.json();
  } catch (error) {
    console.error("Fehler beim Wetter-Direktabruf:", error);
    return {
      current: { temp: 22, humidity: 50, wind: 10, code: 1, biteIndex: 75 },
      hourlyBiteIndex: Array.from({ length: 24 }, () => 75),
    };
  }
}
