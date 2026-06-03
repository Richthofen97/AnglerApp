import {
  CloudSun,
  Wind,
  Gauge,
  Fish,
  Sun,
  Cloud,
  CloudRain,
} from "lucide-react";

type WeatherCardProps = { weather: any; myWaters: any[] };

export default function WeatherCard({ weather, myWaters }: WeatherCardProps) {
  const getWeatherDetails = (code: number) => {
    if (code === 0)
      return {
        text: "Klar",
        icon: <Sun size={20} color="var(--accent-cyan)" />,
      };
    if (code >= 1 && code <= 3)
      return {
        text: "Bewölkt",
        icon: <CloudSun size={20} color="var(--accent-cyan)" />,
      };
    if (code >= 45 && code <= 48)
      return {
        text: "Nebel",
        icon: <Cloud size={20} color="var(--text-muted)" />,
      };
    return {
      text: "Regen",
      icon: <CloudRain size={20} color="var(--accent-cyan)" />,
    };
  };
  const details = getWeatherDetails(weather.current.code);

  return (
    <div className="weather-card">
      <div className="weather-main">
        <div className="weather-temp-box">
          <span className="weather-degree">
            {Math.round(weather.current.temp)}
          </span>
          <span className="weather-unit">°C</span>
        </div>
        <div className="weather-info">
          <div
            className="weather-condition"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {details.icon}
            <span>{details.text}</span>
          </div>
          <div className="weather-location">
            {myWaters.length > 0 ? myWaters[0].name : "Aktueller Standort"}
          </div>
        </div>
      </div>
      <div className="weather-details-grid">
        <div className="detail-item">
          <span className="detail-label">
            <Wind size={12} /> Wind
          </span>
          <span className="detail-value">
            {Math.round(weather.current.wind)} km/h
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">
            <Gauge size={12} /> Druck
          </span>
          <span className="detail-value">
            {Math.round(weather.current.pressure)} hPa
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">
            <Fish size={12} /> Biss-Id
          </span>
          <span className="detail-value bite-active">
            {weather.current.biteIndex}%
          </span>
        </div>
      </div>
    </div>
  );
}
