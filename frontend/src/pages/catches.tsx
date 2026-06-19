// TEIL 1 VON 3: IMPORTS UND STATES
import { useEffect, useState } from "react";
// deleteCatch wurde hier in den API-Imports ergänzt
import {
  getAllCatches,
  createCatch,
  deleteCatch,
  updateCatchVisibility,
} from "../api/catches";

import { getSpots } from "../api/spots";
import { FISCH_LEXIKON } from "../pages/fishData";
import {
  Fish,
  Scale,
  Ruler,
  Calendar,
  MapPin,
  Notebook,
  Plus,
  Camera,
  Trash2, // Neues Icon für den Lösch-Button
} from "lucide-react";
import "../App.css";
// Hilfsfunktion: Holt den Bild-Pfad aus der fishData (.image)
const getFishFallbackImage = (speciesName: string): string | undefined => {
  if (!speciesName) return undefined;

  // Findet den passenden Fisch im Lexikon (ignoriert Groß-/Kleinschreibung)
  const fishMatch = FISCH_LEXIKON.find(
    (f) => f.name.toLowerCase() === speciesName.toLowerCase(),
  );

  // Gibt den Pfad aus dem "image"-Feld deines Objekts zurück
  return fishMatch?.image;
};

type GlobalCatch = {
  _id: string;
  species: string;
  weight?: number;
  length?: number;
  imageUrl?: string;
  notes?: string;
  caughtAt: string;
  spotId?: { _id: string; name: string; location: string; imageUrl?: string };
};

type PersonalSpot = {
  _id: string;
  name: string;
};

export default function Diary() {
  const [catches, setCatches] = useState<GlobalCatch[]>([]);
  const [spots, setSpots] = useState<PersonalSpot[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Detail-States
  const [selectedCatch, setSelectedCatch] = useState<GlobalCatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formular-States für den neuen Fang
  const [selectedSpotId, setSelectedSpotId] = useState("");

  const [newSpecies, setNewSpecies] = useState(FISCH_LEXIKON[0]?.name || "");
  const [newWeight, setNewWeight] = useState("");
  const [newLength, setNewLength] = useState("");
  const [newCatchNotes, setNewCatchNotes] = useState("");
  const [catchImage, setCatchImage] = useState<File | null>(null);
  const [isSavingCatch, setIsSavingCatch] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Neuer State für den Lösch-Vorgang
  // TEIL 2 VON 3: LOGIK, USEEFFECT UND LÖSCH-FUNKTION
  useEffect(() => {
    async function loadDiaryData() {
      try {
        const [catchData, spotData] = await Promise.all([
          getAllCatches(),
          getSpots(),
        ]);

        setCatches(catchData);
        setSpots(spotData);

        if (spotData && spotData.length > 0) {
          setSelectedSpotId(spotData[0]._id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Laden der Tagebuch-Daten:", err);
        setLoading(false);
      }
    }
    loadDiaryData();
  }, []);

  // NEUE FUNKTION: LÖSCHEN EINES FANGS
  const handleDeleteCatch = async (catchId: string) => {
    const confirmDelete = window.confirm(
      "Möchtest du diesen Fang wirklich unwiderruflich löschen?",
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);

      // Ruft die DELETE-Route deines Backends auf
      await deleteCatch(catchId);

      // Entfernt den gelöschten Fang sofort aus dem UI-State
      setCatches((prev) => prev.filter((item) => item._id !== catchId));

      // Schließt das Detail-Modal
      setSelectedCatch(null);

      alert("Der Fang wurde erfolgreich gelöscht.");
    } catch (err) {
      console.error("Fehler beim Löschen des Fangs:", err);
      alert("Fang konnte nicht gelöscht werden.");
    } finally {
      setIsDeleting(false);
    }
  };
  // NEUE FUNKTION: SICHTBARKEIT (COMMUNITY) ÄNDERN
  const handleToggleVisibility = async (currentCatch: GlobalCatch) => {
    // 1. Zuerst den aktuellen Status ermitteln und umdrehen
    const currentStatus = (currentCatch as any).isPublic || false;
    const newStatus = !currentStatus;

    try {
      // 2. Jetzt die API mit dem richtig definierten newStatus aufrufen
      await updateCatchVisibility(currentCatch._id, newStatus);

      // 3. UI-State sofort aktualisieren
      setCatches((prev) =>
        prev.map((item) =>
          item._id === currentCatch._id
            ? ({ ...item, isPublic: newStatus } as any)
            : item,
        ),
      );

      // 4. Auch das aktuell geöffnete Detail-Modal aktualisieren
      setSelectedCatch((prev) =>
        prev ? ({ ...prev, isPublic: newStatus } as any) : null,
      );

      alert(
        newStatus
          ? "Der Fang ist jetzt in der Community sichtbar! 🌐"
          : "Der Fang wurde auf privat (Offline) gestellt. 🔒",
      );
    } catch (err) {
      console.error("Fehler beim Ändern der Sichtbarkeit:", err);
      alert("Status konnte nicht geändert werden.");
    }
  };

  const handleSaveGlobalCatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpotId) {
      alert("Bitte erstelle zuerst einen Angelspot auf der Karte!");
      return;
    }
    if (!newSpecies.trim()) {
      alert("Bitte wähle eine Fischart aus!");
      return;
    }

    try {
      setIsSavingCatch(true);

      const savedCatch = await createCatch(
        selectedSpotId,
        newSpecies.trim(),
        newWeight ? Number(newWeight) : null,
        newLength ? Number(newLength) : null,
        newCatchNotes.trim(),
        catchImage,
      );

      const associatedSpot = spots.find((s) => s._id === selectedSpotId);
      const uiCatch: GlobalCatch = {
        ...savedCatch,
        spotId: associatedSpot
          ? {
              _id: associatedSpot._id,
              name: associatedSpot.name,
              location: "GPS Spot",
            }
          : undefined,
      };

      setCatches((prev) => [uiCatch, ...prev]);

      setNewSpecies(FISCH_LEXIKON[0]?.name || "");
      setNewWeight("");
      setNewLength("");
      setNewCatchNotes("");
      setCatchImage(null);
      setIsModalOpen(false);

      alert("Petri Heil! Der Fang wurde in dein Tagebuch eingetragen.");
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fang konnte nicht gespeichert werden.");
    } finally {
      setIsSavingCatch(false);
    }
  };

  if (loading)
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Lade dein Tagebuch...
      </div>
    );
  // TEIL 3.1 VON 3: DIARY-LAYOUT UND DETAILKARTE
  return (
    <div
      className="dashboard-container"
      style={{ paddingBottom: "80px", paddingInline: "16px" }}
    >
      {/* HEADER-ZEILE MIT RECHTEN ADD-BUTTON */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0",
        }}
      >
        <h2
          style={{
            color: "#fff",
            fontSize: "22px",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          🎯 Mein Fangtagebuch
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "var(--accent-cyan)",
            border: "none",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "12px",
            padding: "8px 14px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <Plus size={16} /> Fang loggen
        </button>
      </div>
      {catches.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Noch keine Einträge im Tagebuch vorhanden. Klicke oben auf "Fang
          loggen" oder trage einen Fisch direkt über deine Spots ein!
        </p>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}
        >
          {catches.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedCatch(item)}
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                height: "100px",
                boxSizing: "border-box",
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.species}
                  style={{ width: "120px", height: "100%", objectFit: "cover" }}
                />
              ) : getFishFallbackImage(item.species) ? (
                <img
                  src={getFishFallbackImage(item.species)}
                  alt={item.species}
                  style={{ width: "120px", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "120px",
                    height: "100%",
                    background: "var(--bg-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Fish size={28} color="var(--text-muted)" />
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {item.species}
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "11px",
                      color: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <MapPin size={10} />{" "}
                    {item.spotId?.name || "Unbekannter Spot"}
                  </p>
                </div>
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
                        ? (item.weight / 1000).toFixed(1) + "kg"
                        : item.weight + "g"}
                    </span>
                  )}
                  {item.length && <span>📏 {item.length}cm</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* DETAILLIERTE FANGKARTE (MODAL 1) */}
      {selectedCatch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(11, 19, 31, 0.9)",
            backdropFilter: "blur(8px)",
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
              borderRadius: "24px",
              width: "100%",
              maxWidth: "380px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                position: "relative",
                height: "220px",
                background: "var(--bg-dark)",
              }}
            >
              {selectedCatch.imageUrl ? (
                <img
                  src={selectedCatch.imageUrl}
                  alt={selectedCatch.species}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : getFishFallbackImage(selectedCatch.species) ? (
                <img
                  src={getFishFallbackImage(selectedCatch.species)}
                  alt={selectedCatch.species}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Fish size={48} color="var(--text-muted)" />
                </div>
              )}

              <button
                onClick={() => setSelectedCatch(null)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(11, 19, 31, 0.7)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {selectedCatch.species}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MapPin size={14} color="var(--accent-cyan)" />{" "}
                  {selectedCatch.spotId?.name || "Gewässer-Spot"}
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "rgba(11, 19, 31, 0.4)",
                    border: "1px solid var(--border-color)",
                    padding: "10px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Scale size={16} color="var(--accent-orange)" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "block",
                      }}
                    >
                      Gewicht
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedCatch.weight
                        ? selectedCatch.weight >= 1000
                          ? (selectedCatch.weight / 1000).toFixed(2) + " kg"
                          : selectedCatch.weight + " g"
                        : "--"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(11, 19, 31, 0.4)",
                    border: "1px solid var(--border-color)",
                    padding: "10px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Ruler size={16} color="var(--accent-cyan)" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "block",
                      }}
                    >
                      Länge
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedCatch.length
                        ? selectedCatch.length + " cm"
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                <Calendar size={14} />
                <span>
                  Gefangen am:{" "}
                  {new Date(selectedCatch.caughtAt).toLocaleDateString("de-DE")}
                </span>
              </div>
              {selectedCatch.notes && (
                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                    }}
                  >
                    <Notebook size={12} /> Details & Köder
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.85)",
                      fontStyle: "italic",
                    }}
                  >
                    "{selectedCatch.notes}"
                  </p>
                </div>
              )}

              {/* BUTTONS FÜR COMMUNITY-SWITCH UND LÖSCHEN */}
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "12px",
                  marginTop: "4px",
                  display: "flex",
                  justifyContent:
                    "space-between" /* Ändert Ausrichtung, damit Platz für beide ist */,
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Neuer Community-Switch Button */}
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(selectedCatch)}
                  style={{
                    background: (selectedCatch as any).isPublic
                      ? "rgba(34, 197, 94, 0.15)" /* Grün wenn veröffentlicht */
                      : "rgba(255, 255, 255, 0.05)" /* Grau wenn offline */,
                    border: (selectedCatch as any).isPublic
                      ? "1px solid rgba(34, 197, 94, 0.4)"
                      : "1px solid var(--border-color)",
                    color: (selectedCatch as any).isPublic
                      ? "#22c55e"
                      : "var(--text-muted)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    flex: 1 /* Teilt sich den Platz gleichmäßig auf */,
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: (selectedCatch as any).isPublic
                        ? "#22c55e"
                        : "#64748b",
                      display: "inline-block",
                    }}
                  />
                  {(selectedCatch as any).isPublic
                    ? "🌐 Veröffentlicht"
                    : "🔒 Offline"}
                </button>

                {/* Bestehender Lösch-Button (angepasst für Flexbox) */}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteCatch(selectedCatch._id)}
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#ef4444",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    opacity: isDeleting ? 0.6 : 1,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Löscht..." : "Fang löschen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FANG EINTRAGEN MODAL (MODAL 2) WITH SPOT- & LEXIKON-DROPDOWN */}
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
                <Fish size={18} color="var(--accent-cyan)" /> Fang hinzufügen
              </h3>
              <button
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
              onSubmit={handleSaveGlobalCatch}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Gewässer / Spot auswählen *
                </label>
                <select
                  value={selectedSpotId}
                  onChange={(e) => setSelectedSpotId(e.target.value)}
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
                  {spots.length === 0 ? (
                    <option value="">-- Keine Spots vorhanden --</option>
                  ) : (
                    spots.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

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
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    Gewicht (g)
                  </label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="z.B. 1850"
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      background: "var(--bg-dark)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      width: "100%",
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
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    Länge (cm)
                  </label>
                  <input
                    type="number"
                    value={newLength}
                    onChange={(e) => setNewLength(e.target.value)}
                    placeholder="z.B. 55"
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      background: "var(--bg-dark)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Details / Köder
                </label>
                <textarea
                  value={newCatchNotes}
                  onChange={(e) => setNewCatchNotes(e.target.value)}
                  placeholder="Wetter, Beißzeit, Köderfarbe..."
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--bg-dark)",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    fontSize: "13px",
                    height: "55px",
                    resize: "none",
                  }}
                />
              </div>

              {/* AKTUALISIERTER BILD-UPLOAD-BEREICH (KAMERA & GALERIE) */}
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
                  <Camera size={12} /> Foto hinzufügen (Optional)
                </label>

                <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                  {/* Button für Direkt-Kamera */}
                  <label
                    style={{
                      flex: 1,
                      background: "var(--bg-dark)",
                      border: "1px dashed var(--border-color)",
                      borderRadius: "10px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  >
                    <Camera size={16} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: "500" }}>Foto aufnehmen</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment" /* Öffnet die Kamera auf Mobilgeräten */
                      onChange={(e) =>
                        setCatchImage(e.target.files ? e.target.files[0] : null)
                      }
                      style={{ display: "none" }}
                    />
                  </label>

                  {/* Button für Galerie */}
                  <label
                    style={{
                      flex: 1,
                      background: "var(--bg-dark)",
                      border: "1px dashed var(--border-color)",
                      borderRadius: "10px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  >
                    <Plus size={16} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: "500" }}>Aus Galerie</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCatchImage(e.target.files ? e.target.files[0] : null)
                      }
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {/* Anzeige des ausgewählten Dateinamens */}
                {catchImage && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                      background: "rgba(0,0,0,0.2)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      ✓ {catchImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCatchImage(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "11px",
                        padding: "0 2px",
                        fontWeight: "bold",
                      }}
                    >
                      Entfernen
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCatchImage(null);
                  }}
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
