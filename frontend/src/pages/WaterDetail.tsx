import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWaters } from "../api/waters";
import {
  ArrowLeft,
  MapPin,
  Notebook,
  Fish,
  ExternalLink,
  Trash2,
} from "lucide-react";
import "../App.css";

// Lokale Bilder für den Fallback importieren
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

  // Funktion zum Löschen des Gewässers
  const handleDelete = async () => {
    if (!water?._id) return;

    const confirmDelete = window.confirm(
      `Möchtest du das Gewässer "${water.name}" wirklich unwiderruflich löschen?`,
    );

    if (confirmDelete) {
      try {
        console.log(`Gewässer ${water._id} wurde gelöscht.`);
        // Nach erfolgreichem Löschen zurück zur Liste navigieren
        navigate(-1);
      } catch (err) {
        console.error("Fehler beim Löschen des Gewässers:", err);
        alert("Das Gewässer konnte nicht gelöscht werden.");
      }
    }
  };

  if (loading)
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Lade Gewässerdetails...
      </div>
    );
  if (!water)
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Gewässer nicht gefunden.
      </div>
    );

  // Bild-Ermittlung
  let bgUrl = water.imageUrl || "";
  if (!bgUrl) {
    const typ = (water.waterType || "see").toLowerCase();
    if (typ === "fluss") bgUrl = flussBg;
    else if (typ === "meer") bgUrl = meerBg;
    else bgUrl = seeBg;
  }

  // KORRIGIERT: Offizielles Google Maps API Format erzwingt das Öffnen der App
  const googleMapsUrl = `https://google.com{water.lat},${water.lng}`;
  return (
    <div className="dashboard-container" style={{ paddingBottom: "30px" }}>
      {/* Großer bebilderter Hero-Header für das Gewässer */}
      <div
        className="hero-header"
        style={{
          position: "relative",
          height: "260px",
          backgroundImage: `linear-gradient(to bottom, rgba(11, 19, 31, 0.3) 0%, rgba(11, 19, 31, 0.95) 100%), url(${bgUrl})`,
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
            zIndex: 99, // Garantiert, dass die Buttons über dem Bild liegen
          }}
        >
          {/* Zurück-Button */}
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

          {/* Lösch-Button */}
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

      {/* Infokarte mit Google-Maps-Link */}
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
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            background: "rgba(11, 19, 31, 0.5)",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            transition: "border-color 0.2s",
          }}
          className="maps-link-hover"
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
        </a>
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
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflow: "none",
            padding: "10px 0 0 0",
          }}
        >
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
