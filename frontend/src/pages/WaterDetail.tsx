import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWaters, deleteWater } from "../api/waters";
import {
  ArrowLeft,
  MapPin,
  Notebook,
  Fish,
  ExternalLink,
  Trash2,
} from "lucide-react";
import "../App.css";

// Deine originalen, lokalen Bildimports
import seeBg from "../assets/see.jpg";
import flussBg from "../assets/fluss.jpg";
import meerBg from "../assets/meer.jpg";

type WaterSpot = {
  _id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  waterType?: string;
  imageUrl?: string;
  notes?: string;
};

export default function WaterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [water, setWater] = useState<WaterSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [localNotes, setLocalNotes] = useState("");

  useEffect(() => {
    async function loadDetailData() {
      try {
        const allWaters = await getWaters();
        const currentWater = allWaters.find((w: any) => w._id === id);
        if (currentWater) {
          setWater(currentWater);
          setLocalNotes(currentWater.notes || "");
        }
        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Laden der Details:", err);
        setLoading(false);
      }
    }
    loadDetailData();
  }, [id]);

  const handleDelete = async () => {
    if (!water?._id) return;

    const confirmDelete = window.confirm(
      `Möchtest du das Gewässer "${water.name}" wirklich unwiderruflich löschen?`,
    );

    if (confirmDelete) {
      try {
        await deleteWater(water._id);
        navigate(-1);
      } catch (err) {
        console.error("Fehler beim Löschen des Gewässers:", err);
        alert("Das Gewässer konnte nicht gelöscht werden.");
      }
    }
  };

  if (loading) {
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Lade Gewässerdetails...
      </div>
    );
  }
  if (!water) {
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Gewässer nicht gefunden.
      </div>
    );
  }

  // KORRIGIERT: Ermittelt den Pfad und filtert kaputte/leere Datenbankeinträge aus
  let currentHeaderImage = "";

  if (
    water.imageUrl &&
    water.imageUrl.trim() !== "" &&
    /\.(jpeg|jpg|gif|png|webp)$/i.test(water.imageUrl.trim())
  ) {
    currentHeaderImage = water.imageUrl.trim();
  } else {
    const typ = (water.waterType || "see").toLowerCase().trim();
    if (typ === "fluss") currentHeaderImage = flussBg;
    else if (typ === "meer") currentHeaderImage = meerBg;
    else currentHeaderImage = seeBg;
  }

  return (
    <div className="dashboard-container" style={{ paddingBottom: "30px" }}>
      {/* Großer bebilderter Hero-Header für das Gewässer */}
      <div
        className="hero-header"
        style={{
          position: "relative",
          height: "260px",
          // REPARIERT: Nutzt jetzt die oben sauber deklarierte Variable! Schließt TS-Fehler aus.
          backgroundImage: `linear-gradient(to bottom, rgba(11, 19, 31, 0.3) 0%, rgba(11, 19, 31, 0.95) 100%), url(${currentHeaderImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        {/* Obere Button-Leiste (Zurück & Löschen) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            position: "relative",
            zIndex: 99,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(22, 34, 47, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "var(--text-main)",
              padding: "10px",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              backdropFilter: "blur(4px)",
              width: "40px",
              height: "40px",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={handleDelete}
            title="Gewässer löschen"
            style={{
              background: "rgba(239, 68, 68, 0.25)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#ef4444",
              padding: "10px",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              backdropFilter: "blur(4px)",
              width: "40px",
              height: "40px",
              justifyContent: "center",
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Gewässer-Titel-Infos */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <span
            style={{
              fontSize: "11px",
              color: "var(--accent-cyan)",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {(water.waterType || "SEE").toUpperCase()}
          </span>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              margin: "4px 0 2px 0",
              color: "#ffffff",
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.9)",
            }}
          >
            {water.name}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#e2e8f0",
              margin: 0,
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
            }}
          >
            {water.location || "GPS Spot"}
          </p>
        </div>
      </div>

      {/* Infokarte mit nativer Smartphone-App-Weiche */}
      <div
        className="weather-card"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
        }}
      >
        <h3
          style={{
            margin: "0 0 10px 0",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-main)",
          }}
        >
          <MapPin size={16} color="var(--accent-cyan)" /> Standorts-Koordinaten
        </h3>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const lat = water.lat;
            const lng = water.lng;
            const userAgent =
              navigator.userAgent || navigator.vendor || (window as any).opera;

            // 1. WEICHE: Für Apple-Geräte (iPhone, iPad)
            if (
              /iPad|iPhone|iPod/.test(userAgent) &&
              !(window as any).MSStream
            ) {
              // Erzwingt den Start der offiziellen Google Maps App auf iOS
              window.location.href = `comgooglemaps://?q=${lat},${lng}&zoom=14`;

              // Fallback: Falls Google Maps nicht installiert ist, öffnet es nach 1 Sekunde im Browser
              setTimeout(() => {
                window.location.href = `https://google.com{lat},${lng}`;
              }, 1000);
            }
            // 2. WEICHE: Für Android-Geräte
            else if (/android/i.test(userAgent)) {
              // Der native Android-Systembefehl öffnet direkt die Maps-App
              window.location.href = `geo:${lat},${lng}?q=${lat},${lng}`;
            }
            // 3. WEICHE: Für Desktop-PCs und Laptops
            else {
              window.open(
                `https://google.com{lat},${lng}`,
                "_blank",
                "noopener,noreferrer",
              );
            }
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(11, 19, 31, 0.5)",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            cursor: "pointer",
            textAlign: "left",
            boxSizing: "border-box",
            position: "relative",
            zIndex: 99999,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
              color: "var(--accent-orange)",
            }}
          >
            {water.lat.toFixed(5)} / {water.lng.toFixed(5)}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            <span>In Google Maps öffnen</span>
            <ExternalLink size={12} />
          </div>
        </button>
      </div>

      {/* Interaktives Notizfeld */}
      <div className="chart-card">
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-main)",
          }}
        >
          <Notebook size={16} color="var(--accent-cyan)" /> Meine Notizen
        </h3>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder="z.B. Beste Beißzeit bei Westwind, flache Uferkante, Krautbetten..."
          style={{
            width: "100%",
            height: "100px",
            padding: "12px",
            borderRadius: "12px",
            background: "var(--bg-dark)",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            resize: "none",
            fontSize: "13px",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <button
          style={{
            alignSelf: "flex-end",
            padding: "6px 14px",
            borderRadius: "8px",
            background: "var(--accent-cyan)",
            color: "#000",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Notiz speichern
        </button>
      </div>

      {/* Fang-Galerie Vorschau */}
      <div className="chart-card">
        <h3
          style={{
            margin: "0 0 4px 0",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-main)",
          }}
        >
          <Fish size={16} color="var(--accent-cyan)" /> Fänge an diesem Spot
        </h3>
        <div style={{ display: "flex", gap: "10px", padding: "10px 0 0 0" }}>
          <p
            style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}
          >
            Noch keine Fänge an diesem Gewässer eingetragen.
          </p>
        </div>
      </div>
    </div>
  );
}
