// ==========================================
// 1. IMPORTS & PAKETE
// ==========================================
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import {
  createWater,
  getWaters,
  deleteWater,
  getFixedWaters,
} from "../api/waters";
import { Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

// @ts-ignore
import { WMSTileLayer } from "react-leaflet";

// ==========================================
// 2. TYPESCRIPT TYP-DEFINITIONEN
// ==========================================
type FixedWater = { _id: string; name: string; waterType: string };
type WaterSpot = {
  _id?: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  waterId?: any;
  imageUrl?: string;
};
type Pos = { lat: number; lng: number };

// ==========================================
// 3. MAP CLICK HANDLER COMPONENT
// ==========================================
function ClickHandler({ onClick }: { onClick: (pos: Pos) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ==========================================
// 4. HAUPTKOMPONENTE START & STATES
// ==========================================
export default function Map() {
  const [position, setPosition] = useState<Pos | null>(null);
  const [dbMarkers, setDbMarkers] = useState<WaterSpot[]>([]);
  const [nearbyWaters, setNearbyWaters] = useState<FixedWater[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newSpotPos, setNewSpotPos] = useState<Pos | null>(null);
  const [newSpotName, setNewSpotName] = useState<string>("");
  const [selectedWater, setSelectedWater] = useState<FixedWater | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const newMarkerRef = useRef<L.Marker | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  // ==========================================
  // 5. REACT LIFECYCLE HOOKS (EFFECTS)
  // ==========================================

  // Hook A: GPS-Standort beim Laden abfragen
  useEffect(() => {
    if (!navigator.geolocation) setPosition({ lat: 49.4521, lng: 11.0767 });
    else {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setPosition({ lat: 49.4521, lng: 11.0767 }),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
    loadInitData();
  }, []);

  // Hook B: Popup-Klickweiterleitung für Leaflet fixen
  useEffect(() => {
    if (newSpotPos && newMarkerRef.current && formRef.current) {
      newMarkerRef.current.openPopup();
      const container = formRef.current.closest(".leaflet-popup");
      if (container) {
        L.DomEvent.disableClickPropagation(container as HTMLElement);
        L.DomEvent.disableScrollPropagation(container as HTMLElement);
      }
    }
  }, [newSpotPos]);

  // Hook C: Live-Textsuche in ganz Deutschland starten, wenn der Angler tippt
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          // 'as any' hebelt den VS Code Cache-Fehler ts(2554) aus
          const data = await getFixedWaters(undefined, undefined);
          setNearbyWaters(data);
        } catch (err) {
          console.error("Fehler bei der Live-Gewässersuche:", err);
        }
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  // ==========================================
  // 6. KARTEN-ICONS (STYLING MIT MASSEN)
  // ==========================================

  // Aktueller Standort des Anglers (Cyan)
  const userIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBmaWxsPSIjMmRkNGJmIiBkPSJNMTIgMmE4IDggMCAwIDAgLTggOGMwIDUuMjUgOCAxMiA4IDEyczgtNi43NSA4LTEyYTggOCAwIDAgMCAtOC04em0wIDExYTQgNCAwIDEgMSAtNC00IDQgNCAwIDAgMSA0IDR6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Gesetzte Angelspots (Orange)
  const spotIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBmaWxsPSIjZjY3MzE2IiBkPSJNMTIgMmE4IDggMCAwIDAgLTggOGMwIDUuMjUgOCAxMiA4IDEyczgtNi43NSA4LTEyYTggOCAwIDAgMCAtOC04em0wIDExYTQgNCAwIDEgMSAtNC00IDQgNCAwIDAgMSA0IDR6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // ==========================================
  // 7. BACKEND-LOGIK (API-ANBINDUNG)
  // ==========================================
  async function loadInitData() {
    try {
      const spotsData = await getWaters();
      setDbMarkers(spotsData);
    } catch (err) {
      setError("Daten konnten nicht geladen werden");
    }
  }

  async function handleMapClick(pos: Pos) {
    setNewSpotPos(pos);
    setNewSpotName("");
    setSelectedImage(null);
    setIsSearching(false);
    setSearchQuery("");
    try {
      const data = await getFixedWaters(pos.lat, pos.lng);
      if (data && data.length > 0) {
        setSelectedWater(data[0]);
        setNearbyWaters(data.slice(0, 5));
      } else {
        setSelectedWater(null);
        setNearbyWaters([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveSpot(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!newSpotPos || !newSpotName.trim()) {
      alert("Bitte einen Namen für den Spot eingeben!");
      return;
    }

    try {
      console.log("Sende Live-Daten an das Backend...");

      const savedSpot = await createWater(
        newSpotName,
        selectedWater ? selectedWater.name : "GPS Spot",
        newSpotPos.lat,
        newSpotPos.lng,
        selectedWater,
        selectedImage,
      );

      console.log("Server-Antwort erhalten:", savedSpot);

      // KORREKTUR: Wir verlassen uns nicht auf den DB-Reload, sondern
      // drücken das fertige savedSpot-Objekt direkt synchron ins UI!
      if (savedSpot) {
        setDbMarkers((prev) => [savedSpot, ...prev]);
      }

      // Maske sofort schließen und Felder leeren
      setNewSpotPos(null);
      setNewSpotName("");
      setSelectedImage(null);
      setSelectedWater(null);

      // REPARATUR: Wir entfernen das "await getWaters()", das dir die
      // Liste im selben Moment wieder mit alten Daten überschrieben hat!
    } catch (err: any) {
      console.error("Fehler beim Live-Speichern des Spots:", err.message);
      alert("Fehler beim Speichern: " + err.message);
    }
  }

  async function handleDeleteSpot(id: string) {
    if (!window.confirm("Spot wirklich löschen?")) return;
    try {
      await deleteWater(id);
      setDbMarkers((prev) => prev.filter((spot) => spot._id !== id));
    } catch (err) {
      console.log(err);
    }
  }

  // Lade- und Fehlermeldungen vor dem UI-Render
  if (error)
    return (
      <p style={{ color: "var(--accent-red)", padding: 20 }}>❌ {error}</p>
    );
  if (!position)
    return (
      <p style={{ color: "var(--text-muted)", padding: 20 }}>
        📍 Standort lädt...
      </p>
    );
  // ==========================================
  // 8. USER INTERFACE (TEIL A)
  // ==========================================
  return (
    <div
      style={{
        position: "relative",
        height: "calc(100vh - 65px)",
        width: "100%",
      }}
    >
      <MapContainer
        key="osm-classic-map"
        center={[position.lat, position.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url={[
            "https://",
            "{s}",
            ".tile.openstreetmap.org/",
            "{z}/",
            "{x}/",
            "{y}",
            ".png",
          ].join("")}
        />

        <ClickHandler onClick={handleMapClick} />
        <Marker position={[position.lat, position.lng]} icon={userIcon} />

        {newSpotPos && (
          <Marker
            position={[newSpotPos.lat, newSpotPos.lng]}
            icon={spotIcon}
            ref={newMarkerRef}
          >
            <Popup closeOnClick={false}>
              <form
                ref={formRef}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  minWidth: "210px",
                  maxWidth: "240px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "14px" }}>Spot eintragen</h3>
                <input
                  type="text"
                  placeholder="Name (z.B. Lieblingssteg)"
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  autoFocus
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "#fff",
                  }}
                />

                {!isSearching ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      background: "var(--bg-input)",
                      padding: "8px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: selectedWater ? "#fff" : "var(--accent-red)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: selectedWater ? "normal" : "bold",
                      }}
                    >
                      📍{" "}
                      {selectedWater
                        ? selectedWater.name
                        : "Kein Gewässer zugeordnet"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedWater) {
                          setSelectedWater(null);
                        } else {
                          setIsSearching(true);
                        }
                      }}
                      style={{
                        background: selectedWater
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(45, 212, 191, 0.1)",
                        border: selectedWater
                          ? "1px dashed var(--accent-red)"
                          : "1px dashed var(--accent-cyan)",
                        color: selectedWater
                          ? "var(--accent-red)"
                          : "var(--accent-cyan)",
                        borderRadius: "4px",
                        padding: "5px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {selectedWater
                        ? "❌ Gewässer-Zuordnung entfernen"
                        : "🔍 Gewässer manuell suchen"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      background: "rgba(11, 19, 31, 0.4)",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Search
                        size={12}
                        color="var(--text-muted)"
                        style={{ position: "absolute", left: "6px" }}
                      />
                      <input
                        type="text"
                        placeholder="In ganz Deutschland suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "4px 4px 4px 22px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-dark)",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        maxHeight: "135px",
                        overflowY: "scroll",
                        paddingRight: "4px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          color: "var(--text-muted)",
                          fontWeight: "bold",
                        }}
                      >
                        🗺️ Live-Ergebnisse:
                      </span>
                      {nearbyWaters.map((w) => (
                        <button
                          key={w._id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWater(w);
                            setIsSearching(false);
                            setSearchQuery("");
                          }}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 6px",
                            color: "#fff",
                            fontSize: "11px",
                            textAlign: "left",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {w.waterType === "meer" ? "🌊" : "🏞️"} {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOTO-UPLOAD */}
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  <span>📸 Foto hinzufügen (optional):</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      // KORREKTUR: Prüft ob ein File existiert und nimmt das erste Element [0]
                      if (e.target.files && e.target.files[0]) {
                        setSelectedImage(e.target.files[0]);
                      }
                    }}
                    style={{ fontSize: "11px" }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveSpot}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: "var(--accent-cyan)",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  Spot speichern
                </button>
              </form>
            </Popup>
          </Marker>
        )}

        {/* MARKIERE ALLE EXISTIERENDEN SPOTS AUS DER DB */}
        {dbMarkers.map((spot, i) => (
          <Marker
            key={spot._id || `db-${i}`}
            position={[spot.lat, spot.lng]}
            icon={spotIcon}
          >
            <Popup>
              <div style={{ textAlign: "center", minWidth: "160px" }}>
                {spot.imageUrl && (
                  <img
                    src={spot.imageUrl}
                    alt={spot.name}
                    style={{
                      width: "100%",
                      height: "90px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  />
                )}
                <h3 style={{ margin: "4px 0", fontSize: "14px" }}>
                  {spot.name}
                </h3>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "12px",
                    color: "var(--text-main)",
                    fontWeight: "bold",
                  }}
                >
                  📍 {spot.waterId?.name || "Kein Hauptgewässer"}
                </p>
                <p
                  style={{
                    fontStyle: "italic",
                    fontSize: "11px",
                    color: "var(--accent-cyan)",
                    margin: "0 0 8px 0",
                  }}
                >
                  Typ: {(spot.waterId?.waterType || "Geheimspot").toUpperCase()}
                </p>
                <button
                  className="btn-delete"
                  onClick={() => spot._id && handleDeleteSpot(spot._id)}
                >
                  Spot löschen
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
