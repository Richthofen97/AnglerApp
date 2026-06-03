import { useEffect, useState } from "react";
import { getWaters } from "../api/waters";
import { getLiveWeather } from "../api/weather";
import HeroImage from "../components/HeroImage";
import {
  CloudSun,
  Wind,
  Gauge,
  Fish,
  LogOut,
  Activity,
  Cloud,
  Sun,
  CloudRain,
  Anchor, // Neues Icon für die Favoriten-Kacheln
} from "lucide-react";
import "../app.css";

type WaterSpot = {
  _id?: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
};
type WeatherData = {
  current: {
    temp: number;
    pressure: number;
    wind: number;
    code: number;
    biteIndex: number;
  };
  hourlyBiteIndex: number[];
};

const fallbackWeatherData: WeatherData = {
  current: { temp: 18, pressure: 1013, wind: 12, code: 1, biteIndex: 82 },
  hourlyBiteIndex: Array.from({ length: 24 }, (_, h) =>
    Math.round(
      55 - 25 * Math.sin((h * Math.PI) / 6) - 15 * Math.cos((h * Math.PI) / 12),
    ),
  ),
};

export default function Home({
  username,
  onLogout,
}: {
  username: string;
  email: string;
  onLogout: () => void;
}) {
  const [myWaters, setMyWaters] = useState<WaterSpot[]>([]);
  const [weather, setWeather] = useState<WeatherData>(fallbackWeatherData);
  const [timeX, setTimeX] = useState<number>(50);
  const [currentTimeString, setCurrentTimeString] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} Uhr`;
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const watersData = await getWaters();
        const validWaters = Array.isArray(watersData) ? watersData : [];
        setMyWaters(validWaters);

        let lat = 49.4521;
        let lng = 11.0767;

        if (validWaters.length > 0 && validWaters[0]) {
          lat = validWaters[0].lat;
          lng = validWaters[0].lng;
        }

        const weatherData = await getLiveWeather(lat, lng);
        if (
          weatherData &&
          weatherData.current &&
          Array.isArray(weatherData.hourlyBiteIndex)
        ) {
          setWeather(weatherData);
        }
      } catch (err) {
        console.log("Wetter nutzt Design-Fallback:", err);
      }
    }
    loadDashboardData();

    function updateClock() {
      const now = new Date();
      setTimeX(((now.getHours() * 60 + now.getMinutes()) / 1440) * 100);
      setCurrentTimeString(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} Uhr`,
      );
    }

    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const generateLivePath = () =>
    weather.hourlyBiteIndex
      .map(
        (v, h) =>
          `${h === 0 ? "M" : "L"} ${(h / 23) * 100} ${22 - ((v - 10) / 90) * 16}`,
      )
      .join(" ");
  const getCurrentY = () =>
    22 -
    (((weather.hourlyBiteIndex[new Date().getHours()] || 50) - 10) / 90) * 16;
  const weatherDetails = getWeatherDetails(weather.current.code);

  return (
    <div className="dashboard-container">
      {/* Randloser Header */}
      <div
        className="hero-header"
        style={{ position: "relative", zIndex: 1, overflow: "hidden" }}
      >
        <HeroImage />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(11, 19, 31, 0.1) 0%, rgba(11, 19, 31, 0.8) 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        ></div>

        <div
          className="hero-top-row"
          style={{ position: "relative", zIndex: 10 }}
        >
          <div>
            <span className="app-logo-text">Angler</span>
            <span className="app-logo-sub">Dein Angelabenteuer</span>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: "rgba(22, 34, 47, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "var(--text-main)",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

        <div style={{ position: "relative", zIndex: 10, marginTop: "auto" }}>
          <h1
            style={{
              verticalAlign: "baseline",
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 4px 0",
              color: "#ffffff",
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.95)",
            }}
          >
            Guten Morgen, {username || "test"}!
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#e2e8f0",
              margin: 0,
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.85)",
            }}
          >
            Petri Heil und einen erfolgreichen Tag!
          </p>
        </div>
      </div>

      {/* Wetter */}
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
              {weatherDetails.icon}
              <span>{weatherDetails.text}</span>
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

      {/* NEU HINZUGEFÜGT: Waagerechtes Favoriten-Karussell (Wird nur gerendert, wenn Gewässer da sind) */}
      {myWaters.length > 0 && (
        <div className="favorites-section">
          <h3 className="section-title" style={{ marginBottom: "10px" }}>
            Favoriten
          </h3>
          <div className="favorites-carousel">
            {myWaters.map((water, i) => (
              <div key={`fav-${water._id || i}`} className="favorite-item-card">
                <div className="favorite-icon-box">
                  <Anchor size={16} color="var(--accent-cyan)" />
                </div>
                <div className="favorite-item-info">
                  <h4>{water.name}</h4>
                  <p>{water.location || "Gewässer"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagramm */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <Activity size={16} color="var(--accent-cyan)" />
            <span>Beißverlauf (Live-Wetter)</span>
          </div>
          <span className="chart-subtitle">Aktuell: {currentTimeString}</span>
        </div>
        <div className="chart-visual-container">
          <div className="chart-grid-line" style={{ top: "0%" }}></div>
          <div className="chart-grid-line" style={{ top: "50%" }}></div>
          <div className="chart-grid-line" style={{ top: "100%" }}></div>
          <svg
            viewBox="0 0 100 25"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--accent-cyan)"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="var(--accent-cyan)"
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>
            <path
              d={`${generateLivePath()} L 100 25 L 0 25 Z`}
              fill="url(#waveGradient)"
            />
            <path
              d={generateLivePath()}
              fill="none"
              stroke="var(--accent-cyan)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1={timeX}
              y1="0"
              x2={timeX}
              y2="25"
              stroke="var(--accent-orange)"
              strokeWidth="0.6"
              strokeDasharray="1,1"
            />
            <circle
              cx={timeX}
              cy={getCurrentY()}
              r="1.8"
              fill="var(--accent-orange)"
            />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            00:00
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            06:00
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            12:00
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            18:00
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            24:00
          </span>
        </div>
      </div>

      {/* Gewässer */}
      <h2 className="section-title">Meine Gewässer ({myWaters.length})</h2>
      <div className="waters-list">
        {myWaters.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Noch keine Gewässer eingetragen.
          </p>
        ) : (
          myWaters.map((w, i) => (
            <div key={w._id || i} className="water-item-card">
              <div className="water-item-info">
                <h3>{w.name}</h3>
                <p>{w.location || "GPS Spot"}</p>
              </div>
              <div className="water-item-badge">
                {typeof w.lat === "number" ? w.lat.toFixed(2) : "0.00"} /{" "}
                {typeof w.lng === "number" ? w.lng.toFixed(2) : "0.00"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
