import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWaters, deleteWater } from "../api/waters";
// NEW: Importiert die eben erstellten API-Funktionen für dein Fangbuch
import { getCatchesForSpot, createCatch } from "../api/catches";
import { customFetch } from "../api/fetchClient";
// NEU: Importiert das Lexikon für die Dropdown-Auswahl
import { FISCH_LEXIKON } from "../pages/fishData";

import {
  ArrowLeft,
  MapPin,
  Notebook,
  Fish,
  ExternalLink,
  Trash2,
  Plus, // NEW: Icon für den "Fang hinzufügen"-Button
  Scale, // NEW: Icon für das Gewicht im Formular
  Ruler, // NEW: Icon für die Länge im Formular
  Camera, // NEW: Icon für den Foto-Upload im Formular
} from "lucide-react";
import "../App.css";
import { getWaterImage } from "../utils/waterImageHelper";
import { getLiveWeather } from "../api/weather";

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

// NEW: TypeScript-Typ für die geladenen Fische aus deiner MongoDB
type FishCatch = {
  _id: string;
  species: string;
  weight?: number;
  length?: number;
  imageUrl?: string;
  notes?: string;
  caughtAt: string;
};

export default function WaterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [water, setWater] = useState<WaterSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [localNotes, setLocalNotes] = useState("");
  const [spotWeather, setSpotWeather] = useState<any>(null);

  // ==========================================================================
  // NEW STATES: FÜR DIE FANG-GALERIE UND DAS MITGELIEFERTE FORMULAR-MODAL
  // ==========================================================================
  const [catches, setCatches] = useState<FishCatch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NEU: Setzt standardmäßig den ersten Fisch aus deinem Lexikon als Vorauswahl
  const [newSpecies, setNewSpecies] = useState(FISCH_LEXIKON[0]?.name || "");
  const [newWeight, setNewWeight] = useState<string>("");
  const [newLength, setNewLength] = useState<string>("");
  const [newCatchNotes, setNewCatchNotes] = useState("");
  const [catchImage, setCatchImage] = useState<File | null>(null);
  const [isSavingCatch, setIsSavingCatch] = useState(false);
  useEffect(() => {
    async function loadDetailData() {
      if (!id) return;
      try {
        const allWaters = await getWaters();
        const currentWater = allWaters.find((w: any) => w._id === id);
        if (currentWater) {
          setWater(currentWater);
          setLocalNotes(currentWater.notes || "");

          try {
            // 1. Nutzt jetzt die umgestellte getLiveWeather-Funktion (POST via Browser)
            const weatherData = await getLiveWeather(
              currentWater.lat,
              currentWater.lng,
            );
            if (weatherData && weatherData.current) {
              setSpotWeather(weatherData.current);
            }
          } catch (weatherErr) {
            console.error(
              "Fehler beim Laden des Gewässer-Wetters:",
              weatherErr,
            );
          }

          // 2. NEW CALL: Lädt alle Fische, die an exakt diesem Spot überlistet wurden
          const catchData = await getCatchesForSpot(id);
          setCatches(catchData);
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
    if (
      !water?._id ||
      !window.confirm(`"${water.name}" wirklich unwiderruflich löschen?`)
    )
      return;
    try {
      await deleteWater(water._id);
      navigate(-1);
    } catch (err) {
      alert("Löschen fehlgeschlagen.");
    }
  };

  const handleSaveNotes = async () => {
    if (!water?._id) return;
    try {
      console.log("Sende Notiz-Update an das Backend...");
      await customFetch(`/api/spots/${water._id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: localNotes }),
      });
      alert("Notiz erfolgreich gespeichert!");
    } catch (err: any) {
      console.error("Fehler beim Speichern der Notiz:", err.message);
      alert("Notiz konnte nicht gespeichert werden.");
    }
  };
  // ==========================================================================
  // NEW FUNCTION: NEUEN FISCH IN DIE DATENBANK EINTRAGEN
  // ==========================================================================
  const handleSaveCatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newSpecies.trim()) {
      alert("Bitte wähle eine Fischart aus!");
      return;
    }

    try {
      setIsSavingCatch(true);

      const savedCatch = await createCatch(
        id,
        newSpecies.trim(),
        newWeight ? Number(newWeight) : null,
        newLength ? Number(newLength) : null,
        newCatchNotes.trim(),
        catchImage,
      );

      // LIVE-UPDATE: Den neuen Fang direkt oben in die Liste schieben
      setCatches((prev) => [savedCatch, ...prev]);

      // Formular zurücksetzen & Modal schließen
      setNewSpecies(FISCH_LEXIKON?.[0]?.name || "");
      setNewWeight("");
      setNewLength("");
      setNewCatchNotes("");
      setCatchImage(null);
      setIsModalOpen(false);

      alert("Petri Heil! Dein Fang wurde eingetragen.");
    } catch (err: any) {
      console.error("Fehler beim Speichern des Fangs:", err);
      alert("Fang konnte nicht gespeichert werden.");
    } finally {
      setIsSavingCatch(false);
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

  const headerImg = getWaterImage(water);

  return (
    <div className="dashboard-container" style={{ paddingBottom: "30px" }}>
      <div
        className="hero-header"
        style={{
          position: "relative",
          height: "260px",
          padding: "16px",
          boxSizing: "border-box",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: `linear-gradient(to bottom, rgba(11, 19, 31, 0.3) 0%, rgba(11, 19, 31, 0.95) 100%), url(${headerImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(22, 34, 47, 0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "var(--text-main)",
              padding: "10px",
              borderRadius: "12px",
              cursor: "pointer",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: "rgba(239, 68, 68, 0.25)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#ef4444",
              padding: "10px",
              borderRadius: "12px",
              cursor: "pointer",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
        <div>
          <span
            style={{
              fontSize: "11px",
              color: "var(--accent-cyan)",
              fontWeight: "bold",
              textTransform: "uppercase",
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
              textShadow: "0 2px 6px rgba(0,0,0,0.9)",
            }}
          >
            {water.name}
          </h1>
          <p style={{ fontSize: "13px", color: "#e2e8f0", margin: 0 }}>
            {water.location || "GPS Spot"}
          </p>
        </div>
      </div>
      {spotWeather && (
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "16px",
            margin: "0 16px 16px 16px",
            display: "flex",
            justifyContent: "space-around",
            boxSizing: "border-box",
          }}
        >
          {/* 1. WETTER STATUS ICON */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "20px",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {(spotWeather.current?.code ?? spotWeather.code) === 0
                ? "☀️"
                : (spotWeather.current?.code ?? spotWeather.code) <= 3
                  ? "⛅"
                  : "🌧️"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Status
            </span>
          </div>

          {/* 2. TEMPERATUR */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#fff",
                display: "block",
              }}
            >
              {Math.round(spotWeather.current?.temp ?? spotWeather.temp ?? 0)}°C
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Temp
            </span>
          </div>

          {/* 3. BISS-INDEX / BEISSINDEX */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "var(--accent-cyan)",
                display: "block",
              }}
            >
              {spotWeather.current?.biteIndex ?? spotWeather.biteIndex ?? 50}%
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: "bold",
              }}
            >
              Beißindex
            </span>
          </div>

          {/* 4. WIND */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#fff",
                display: "block",
              }}
            >
              {Math.round(spotWeather.current?.wind ?? spotWeather.wind ?? 0)}{" "}
              <span style={{ fontSize: "11px", fontWeight: "normal" }}>
                km/h
              </span>
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Wind
            </span>
          </div>

          {/* 5. LUFTFEUCHTIGKEIT */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#fff",
                display: "block",
              }}
            >
              {Math.round(
                spotWeather.current?.humidity ?? spotWeather.humidity ?? 60,
              )}
              %
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Feuchte
            </span>
          </div>
        </div>
      )}

      <div
        className="weather-card"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
          margin: "0 16px 16px 16px",
          padding: "16px",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
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
          <MapPin size={16} color="var(--accent-cyan)" /> Koordinaten
        </h3>
        <button
          type="button"
          onClick={() => {
            const agent = navigator.userAgent || navigator.vendor;
            if (/iPad|iPhone|iPod/.test(agent)) {
              window.location.href = `comgooglemaps://?q=${water.lat},${water.lng}&zoom=14`;
              setTimeout(() => {
                window.location.href = `https://google.com{water.lat},${water.lng}`;
              }, 1000);
            } else if (/android/i.test(agent)) {
              window.location.href = `geo:${water.lat},${water.lng}?q=${water.lat},${water.lng}`;
            } else {
              window.open(
                `https://google.com{water.lat},${water.lng}`,
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
            <span>Öffnen</span>
            <ExternalLink size={12} />
          </div>
        </button>
      </div>

      <div
        className="chart-card"
        style={{
          margin: "0 16px 16px 16px",
          padding: "16px",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
          <Notebook size={16} color="var(--accent-cyan)" /> Notizen
        </h3>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder="Beste Beißzeit bei Westwind..."
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
          }}
        />
        <button
          onClick={handleSaveNotes}
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
            marginTop: "8px",
          }}
        >
          Speichern
        </button>
      </div>
      {/* ==========================================================================
         DYNAMISCHE FANG-GALERIE / FANGTAGEBUCH
         ========================================================================== */}
      <div
        className="chart-card"
        style={{
          margin: "0 16px 16px 16px",
          padding: "16px",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--text-main)",
            }}
          >
            <Fish size={16} color="var(--accent-cyan)" /> Fänge an diesem Spot
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "var(--accent-cyan)",
              border: "none",
              color: "#000",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {catches.length === 0 ? (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              margin: "10px 0 0 0",
            }}
          >
            Noch keine Fänge an diesem Gewässer eingetragen. Klicke auf das
            Plus, um deinen ersten Fisch zu loggen!
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {catches.map((item) => (
              <div
                key={item._id}
                style={{
                  background: "rgba(11, 19, 31, 0.5)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.species}
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "8px",
                      background: "var(--bg-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <Fish
                      size={24}
                      color="var(--text-muted)"
                      style={{ margin: "auto" }}
                    />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "16px",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {item.species}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.weight && (
                      <span>
                        ⚖️{" "}
                        {item.weight >= 1000
                          ? (item.weight / 1000).toFixed(2) + " kg"
                          : item.weight + " g"}
                      </span>
                    )}
                    {item.length && <span>📏 {item.length} cm</span>}
                    <span style={{ marginLeft: "auto", fontSize: "11px" }}>
                      {new Date(item.caughtAt).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                  {item.notes && (
                    <p
                      style={{
                        margin: "6px 0 0 0",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.7)",
                        fontStyle: "italic",
                      }}
                    >
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* POPOVER MODAL / FORMULAR FÜR DEN NEUEN FANG-EINTRAG */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(11, 19, 31, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              padding: "20px",
              width: "100%",
              maxWidth: "420px",
              boxSizing: "border-box",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "#fff",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Fish size={18} color="var(--accent-cyan)" /> Fang eintragen
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "18px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveCatch}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* NEU: DROPDOWN-AUSWAHL FÜR DIE FISCHART AUS DEM LEXIKON */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Fischart *
                </label>
                <select
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--bg-dark)",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    fontSize: "14px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {FISCH_LEXIKON.map((fish, idx) => (
                    <option key={idx} value={fish.name}>
                      {fish.name} ({fish.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Zeile: Gewicht & Länge */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Scale size={12} /> Gewicht (g)
                  </label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="z.B. 2450"
                    style={{
                      padding: "10px",
                      width: "100%",
                      borderRadius: "10px",
                      background: "var(--bg-dark)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Ruler size={12} /> Länge (cm)
                  </label>
                  <input
                    type="number"
                    value={newLength}
                    onChange={(e) => setNewLength(e.target.value)}
                    placeholder="z.B. 65"
                    style={{
                      padding: "10px",
                      width: "100%",
                      borderRadius: "10px",
                      background: "var(--bg-dark)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Feld: Notizen */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Details / Köder
                </label>
                <textarea
                  value={newCatchNotes}
                  onChange={(e) => setNewCatchNotes(e.target.value)}
                  placeholder="Köder, Uhrzeit, Wetter oder Kampfverlauf..."
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--bg-dark)",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    fontSize: "13px",
                    height: "60px",
                    resize: "none",
                  }}
                />
              </div>

              {/* Feld: Foto-Upload */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Camera size={12} /> Foto hochladen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCatchImage(e.target.files ? e.target.files[0] : null)
                  }
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                />
              </div>

              {/* Buttons: Absenden & Abbrechen */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    background: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSavingCatch}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--accent-cyan)",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    opacity: isSavingCatch ? 0.6 : 1,
                  }}
                >
                  {isSavingCatch ? "Lädt hoch..." : "Petri Heil!"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
