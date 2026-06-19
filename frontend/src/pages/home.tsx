import { useEffect, useState } from "react";
import { getWaters, toggleFavorite } from "../api/waters";
import { getLiveWeather } from "../api/weather";
import HeroImage from "../components/HeroImage";
import { getWaterImage } from "../utils/waterImageHelper";
import {
  CloudSun,
  Wind,
  Fish,
  LogOut,
  Activity,
  Cloud,
  Sun,
  CloudRain,
  Compass,
  Heart,
  MoreVertical,
  User,
  Droplets,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../App.css";

type WaterSpot = {
  _id?: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  waterId?: { name: string; waterType: string };
  imageUrl?: string;
  isFavorite?: boolean;
};

const fallbackWeatherData = {
  current: { temp: 18, pressure: 1013, wind: 12, code: 1, biteIndex: 82 },
  hourlyBiteIndex: Array.from({ length: 24 }, (_, h) =>
    Math.round(
      55 - 25 * Math.sin((h * Math.PI) / 6) - 15 * Math.cos((h * Math.PI) / 12),
    ),
  ),
};

export default function Home({
  username,
  email: _email,
  onLogout,
}: {
  username: string;
  email: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [mySpots, setMySpots] = useState<WaterSpot[]>([]);
  const [weather, setWeather] = useState<any>(fallbackWeatherData);
  const [timeX, setTimeX] = useState<number>(50);
  const [currentTimeString, setCurrentTimeString] = useState<string>("");

  // NEU: State, um das Ausfahren des Dropdowns zu steuern
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  async function loadDashboardData() {
    try {
      const spotsData = await getWaters();
      const validSpots = Array.isArray(spotsData) ? spotsData : [];
      setMySpots(validSpots);

      const lat =
        validSpots.length > 0 && validSpots[0] ? validSpots[0].lat : 49.4521;
      const lng =
        validSpots.length > 0 && validSpots[0] ? validSpots[0].lng : 11.0767;

      const weatherData = await getLiveWeather(lat, lng);
      if (weatherData && weatherData.current) {
        setWeather(weatherData);
      }
    } catch (err) {
      console.log("Wetter nutzt Fallback:", err);
    }
  }

  useEffect(() => {
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

  async function handleToggleFavorite(id: string, currentStatus: boolean) {
    try {
      const newStatus = !currentStatus;
      setMySpots((p) =>
        p.map((w) => (w._id === id ? { ...w, isFavorite: newStatus } : w)),
      );
      await toggleFavorite(id, newStatus);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  }

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
        (v: number, h: number) =>
          `${h === 0 ? "M" : "L"} ${(h / 23) * 100} ${22 - ((v - 10) / 90) * 16}`,
      )
      .join(" ");

  const getCurrentY = () =>
    22 -
    (((weather.hourlyBiteIndex[new Date().getHours()] || 50) - 10) / 90) * 16;
  const weatherDetails = getWeatherDetails(weather.current.code);
  const favoriteWaters = mySpots.filter((w) => w.isFavorite === true);

  return (
    <div className="dashboard-container">
      {/* Header */}
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

          {/* Relativer Container, damit das Menü exakt unter den 3 Punkten aufploppt */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
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
              <MoreVertical size={16} />
            </button>

            {/* AUSGEFAHRENES DROPDOWN-MENÜ */}
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background:
                    "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "130px",
                  overflow: "hidden",
                  zIndex: 9999, // Liegt immer über allen Elementen
                }}
              >
                {/* 1. BUTTON: Profilseite */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profil"); // HIER GEÄNDERT: Von /profile zu /profil
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-main)",
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <User size={14} color="var(--accent-cyan)" />
                  <span>Profil</span>
                </button>

                {/* Trennlinie */}
                <div
                  style={{ height: "1px", background: "var(--border-color)" }}
                ></div>

                {/* 2. BUTTON: Ausloggen */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-main)",
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut size={14} color="var(--accent-orange)" />
                  <span>Ausloggen</span>
                </button>
              </div>
            )}
          </div>
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
            {/* GEÄNDERT: Zeigt jetzt immer verlässlich an, dass es dein GPS-Standort ist */}
            <div className="weather-location">Aktueller Standort</div>
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

          {/* GEÄNDERT: Druck entfernt, Luftfeuchtigkeit (Humidity) hinzugefügt */}
          <div className="detail-item">
            <span className="detail-label">
              <Droplets size={12} /> Feuchte
            </span>
            <span className="detail-value">
              {Math.round(weather.current.humidity)} %
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

      {/* Favoriten */}
      {favoriteWaters.length > 0 && (
        <div className="favorites-section">
          <h3 className="section-title" style={{ marginBottom: "10px" }}>
            Favoriten
          </h3>
          <div className="favorites-carousel">
            {favoriteWaters.map((spot, i) => {
              const currentType = (
                spot.waterId?.waterType || "see"
              ).toLowerCase();

              // NUTZT DIE NEUE HILFSFUNKTION: Kombiniert Bild-URL und Typ-Logik
              const bgUrl = getWaterImage({
                imageUrl: spot.imageUrl,
                waterType: spot.waterId?.waterType,
              });

              return (
                <div
                  key={`fav-${spot._id || i}`}
                  className="favorite-item-card"
                  onClick={() => spot._id && navigate(`/gewaesser/${spot._id}`)}
                  style={{
                    // Erhöhter Kontrast, damit das neue Standardbild perfekt durchschimmert
                    background: `linear-gradient(to bottom, rgba(22, 34, 47, 0.4), rgba(15, 23, 42, 0.75)), url(${bgUrl}) center/cover no-repeat`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="favorite-icon-box"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    <Compass size={16} color="var(--accent-cyan)" />
                  </div>
                  <div
                    className="favorite-item-info"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    <h4>{spot.name}</h4>
                    <p>{currentType.toUpperCase()}</p>
                  </div>
                </div>
              );
            })}
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

      {/* Gewässer-Liste */}
      <h2 className="section-title">
        Meine persönlichen Spots ({mySpots.length})
      </h2>
      <div className="waters-list">
        {mySpots.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Noch keine Angel-Spots eingetragen. Gehe auf die Karte, um einen
            Spot zu speichern!
          </p>
        ) : (
          mySpots.map((w, i) => {
            const spotName = w.name || "Unbenannter Spot";
            const associatedWater = w.waterId?.name || "Keine Auswahl";
            const currentType = (w.waterId?.waterType || "see").toLowerCase();

            // NUTZT DIE NEUE HILFSFUNKTION: Ersetzt das alte Unsplash-Fallback
            const bgUrl = getWaterImage({
              imageUrl: w.imageUrl,
              waterType: w.waterId?.waterType,
            });

            return (
              <div
                key={w._id || i}
                className="water-item-card"
                onClick={() => w._id && navigate(`/gewaesser/${w._id}`)}
                style={{
                  position: "relative",
                  // Das neue Standardbild fügt sich perfekt in den bestehenden Verlauf ein
                  background: `linear-gradient(to right, rgba(11, 19, 31, 0.9) 35%, rgba(11, 19, 31, 0.15)), url(${bgUrl}) center/cover no-repeat`,
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: "75px",
                  cursor: "pointer",
                }}
              >
                <div
                  className="water-item-info"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <h3
                    style={{
                      margin: "0 0 2px 0",
                      color: "#fff",
                      fontSize: "16px",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {spotName}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--accent-cyan)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    📍 {associatedWater} ({currentType.toUpperCase()})
                  </p>
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-heart"
                    onClick={() =>
                      w._id && handleToggleFavorite(w._id, !!w.isFavorite)
                    }
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                    }}
                  >
                    <Heart
                      size={22}
                      fill={
                        w.isFavorite ? "var(--accent-orange)" : "transparent"
                      }
                      color={
                        w.isFavorite
                          ? "var(--accent-orange)"
                          : "var(--text-muted)"
                      }
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
