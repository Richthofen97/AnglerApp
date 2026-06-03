import { useEffect, useState } from "react";
import { getWaters, toggleFavorite } from "../api/waters";
import { getLiveWeather } from "../api/weather";
import HeroImage from "../components/HeroImage";
import WeatherCard from "../components/WeatherCard";
import BiteChart from "../components/BiteChart";
import { LogOut, Heart, BookOpen, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Hook-Import bleibt hier oben
import "../App.css";

type WaterSpot = {
  _id?: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  waterType?: string;
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
  onLogout,
}: {
  username: string;
  email: string;
  onLogout: () => void;
}) {
  // ✅ RICHTIG: Hooks MÜSSEN direkt in der ersten Zeile der Hauptfunktion stehen!
  const navigate = useNavigate();

  const [myWaters, setMyWaters] = useState<WaterSpot[]>([]);
  const [weather, setWeather] = useState<any>(fallbackWeatherData);
  const [timeX, setTimeX] = useState<number>(50);
  const [currentTimeString, setCurrentTimeString] = useState<string>("");

  async function loadDashboardData() {
    try {
      const watersData = await getWaters();
      const validWaters = Array.isArray(watersData) ? watersData : [];
      setMyWaters(validWaters);

      const lat =
        validWaters.length > 0 && validWaters[0] ? validWaters[0].lat : 49.4521;
      const lng =
        validWaters.length > 0 && validWaters[0] ? validWaters[0].lng : 11.0767;

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
      setMyWaters((p) =>
        p.map((w) => (w._id === id ? { ...w, isFavorite: newStatus } : w)),
      );
      await toggleFavorite(id, newStatus);
    } catch (err) {
      console.error(err);
      loadDashboardData();
    }
  }

  const favoriteWaters = myWaters.filter((w) => w.isFavorite === true);

  const getKachelClass = (water: WaterSpot) => {
    const typ = (water.waterType || "see").toLowerCase().trim();
    if (typ === "fluss") return "bg-fluss";
    if (typ === "meer") return "bg-meer";
    return "bg-see";
  };

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
      <WeatherCard weather={weather} myWaters={myWaters} />

      {/* Tagebuch Button */}
      <div style={{ padding: "0 20px" }}>
        <button
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
          onClick={() => (window.location.hash = "#/faenge")}
        >
          <BookOpen size={16} color="var(--accent-cyan)" />
          <span>Mein Fangtagebuch öffnen</span>
        </button>
      </div>

      {/* Favoriten */}
      {favoriteWaters.length > 0 && (
        <div className="favorites-section">
          <h3 className="section-title" style={{ marginBottom: "10px" }}>
            Favoriten
          </h3>
          <div className="favorites-carousel">
            {favoriteWaters.map((water, i) => {
              const bgClass = getKachelClass(water);
              const customStyle =
                water.imageUrl && water.imageUrl.trim() !== ""
                  ? {
                      background: `linear-gradient(to bottom, rgba(22, 34, 47, 0.75), rgba(15, 23, 42, 0.55)), url(${water.imageUrl}) center/cover no-repeat`,
                    }
                  : {};

              return (
                <div
                  key={`fav-${water._id || i}`}
                  className={`favorite-item-card ${bgClass}`}
                  onClick={() =>
                    water._id && navigate(`/gewaesser/${water._id}`)
                  }
                  style={{
                    ...customStyle,
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="favorite-icon-box"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    {/* Das neue Kompass-Icon lädt jetzt garantiert ohne Fehler */}
                    <Compass size={16} color="var(--accent-cyan)" />
                  </div>
                  <div
                    className="favorite-item-info"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    <h4>{water.name}</h4>
                    <p>{(water.waterType || "SEE").toUpperCase()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Diagramm */}
      <BiteChart
        weather={weather}
        timeX={timeX}
        currentTimeString={currentTimeString}
      />

      {/* Gewässer-Liste */}
      <h2 className="section-title">Meine Gewässer ({myWaters.length})</h2>
      <div className="waters-list">
        {myWaters.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Noch keine Gewässer eingetragen.
          </p>
        ) : (
          myWaters.map((w, i) => {
            const bgClass = getKachelClass(w);
            const customStyle =
              w.imageUrl && w.imageUrl.trim() !== ""
                ? {
                    background: `linear-gradient(to right, rgba(11, 19, 31, 0.85) 45%, rgba(11, 19, 31, 0.2)), url(${w.imageUrl}) center/cover no-repeat`,
                  }
                : {};

            return (
              <div
                key={w._id || i}
                className={`water-item-card ${bgClass}`}
                onClick={() => w._id && navigate(`/gewaesser/${w._id}`)}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minHeight: "75px",
                  cursor: "pointer",
                  ...customStyle,
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
                    {w.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--accent-cyan)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {(w.waterType || "SEE").toUpperCase()}
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
