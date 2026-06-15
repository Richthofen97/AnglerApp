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
import { Search, Edit2, HelpCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Verhindert TypeScript-Fehler für zukünftige WMS-Karten
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
// 4. HAUPTKOMPONENTE (START)
// ==========================================
export default function Map() {
  // --- Daten- und Positions-States ---
  const [position, setPosition] = useState<Pos | null>(null);
  const [dbMarkers, setDbMarkers] = useState<WaterSpot[]>([]);
  const [allFixedWaters, setAllFixedWaters] = useState<FixedWater[]>([]);
  const [nearbyWaters, setNearbyWaters] = useState<FixedWater[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- Formular- und Such-States ---
  const [newSpotPos, setNewSpotPos] = useState<Pos | null>(null);
  const [newSpotName, setNewSpotName] = useState<string>("");
  const [selectedWater, setSelectedWater] = useState<FixedWater | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  // --- DOM- & Leaflet-Referenzen ---
  const newMarkerRef = useRef<L.Marker | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // --- Hook 1: GPS-Standort beim Laden abfragen ---
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

  // --- Hook 2: Popup-Klickweiterleitung für Leaflet fixen ---
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
  // ==========================================
  // 5. KARTEN-ICONS (STYLING)
  // ==========================================

  // Icon für den aktuellen Standort des Anglers (Cyan)
  const userIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBmaWxsPSIjMmRkNGJmIiBkPSJNMTIgMmE4IDggMCAwIDAgLTggOGMwIDUuMjUgOCAxMiA4IDEyczgtNi43NSA4LTEyYTggOCAwIDAgMCAtOC04em0wIDExYTQgNCAwIDEgMSAtNC00IDQgNCAwIDAgMSA0IDR6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Icon für die Angel-Spots auf der Karte (Orange)
  const spotIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBmaWxsPSIjZjY3MzE2IiBkPSJNMTIgMmE4IDggMCAwIDAgLTggOGMwIDUuMjUgOCAxMiA4IDEyczgtNi43NSA4LTEyYTggOCAwIDAgMCAtOC04em0wIDExYTQgNCAwIDEgMSAtNC00IDQgNCAwIDAgMSA0IDR6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
  // ==========================================
  // 6. BACKEND-LOGIK (API-ANBINDUNG)
  // ==========================================

  // Lädt beim Start alle gesetzten Spots und die feste Gewässerliste
  async function loadInitData() {
    try {
      const [spotsData, allFixedData] = await Promise.all([
        getWaters(),
        getFixedWaters(),
      ]);
      setDbMarkers(spotsData);
      setAllFixedWaters(allFixedData);
    } catch (err) {
      setError("Daten konnten nicht geladen werden");
    }
  }

  // Wird aufgerufen, wenn auf die Karte geklickt wird (öffnet Formular & sucht nahe Gewässer)
  async function handleMapClick(pos: Pos) {
    setNewSpotPos(pos);
    setNewSpotName("");
    setSelectedImage(null);
    setIsSearching(false);
    setSearchQuery("");
    try {
      // Holt die 5 nächsten Gewässer basierend auf den Klick-Koordinaten
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

  // Schickt das ausgefüllte Formular an das Backend ab
  async function handleSaveSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpotPos || !newSpotName.trim()) return;

    const waterId =
      selectedWater && selectedWater._id !== "default" ? selectedWater._id : "";

    try {
      await createWater(
        newSpotName,
        "GPS Spot",
        newSpotPos.lat,
        newSpotPos.lng,
        waterId,
        selectedImage,
      );

      setNewSpotPos(null);
      setNewSpotName("");
      setSelectedImage(null);
      setSelectedWater(null);

      // Karte nach dem Speichern direkt aktualisieren
      setDbMarkers(await getWaters());
    } catch (err) {
      console.log("Fehler beim Speichern des Spots:", err);
    }
  }

  // Löscht einen gesetzten Angelspot nach Bestätigung
  async function handleDeleteSpot(id: string) {
    if (!window.confirm("Spot wirklich löschen?")) return;
    try {
      await deleteWater(id);
      setDbMarkers((prev) => prev.filter((spot) => spot._id !== id));
    } catch (err) {
      console.log(err);
    }
  }

  // Filtert die Gewässerliste in Echtzeit für das Suchfeld im Popup
  const filteredWaters = allFixedWaters
    .filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  // --- Lade- und Fehlerprüfungen vor dem JSX-Render ---
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
  // 7. USER INTERFACE (HTML / JSX RENDER)
  // ==========================================
  return (
    <div
      style={{
        position: "relative",
        height: "calc(100vh - 65px)",
        width: "100%",
      }}
    >
      {/* BUTTON: Seitenleiste ein- und ausblenden */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={{
          position: "absolute",
          top: "10px",
          left: "50px",
          zIndex: 1000,
          padding: "8px 12px",
          background: "var(--bg-dark)",
          color: "var(--accent-cyan)",
          border: "1px solid var(--border-color)",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {showSidebar ? "⬅️ Schließen" : "🗺️ Gewässer-Übersicht"}
      </button>

      {/* SEITENLEISTE: Übersicht der Gewässer */}
      {showSidebar && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "10px",
            width: "280px",
            maxHeight: "calc(100% - 80px)",
            background: "rgba(11, 19, 31, 0.95)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            zIndex: 1000,
            padding: "15px",
            color: "#fff",
            overflowY: "auto",
            boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
          }}
        >
          {/* Sektion 1: Dynamische Umkreissuche */}
          <h3
            style={{
              margin: "0 0 10px 0",
              fontSize: "15px",
              color: "var(--accent-cyan)",
            }}
          >
            📍 Die 5 nächsten Gewässer:
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginBottom: "20px",
            }}
          >
            {nearbyWaters.length === 0 ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Klicke auf die Karte, um nahe Gewässer anzuzeigen.
              </p>
            ) : (
              nearbyWaters.map((w) => (
                <div
                  key={w._id}
                  style={{
                    fontSize: "13px",
                    padding: "6px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                  }}
                >
                  {w.waterType === "meer" ? "🌊" : "🏞️"}{" "}
                  <strong>{w.name}</strong>{" "}
                  <span
                    style={{ fontSize: "11px", color: "var(--text-muted)" }}
                  >
                    ({w.waterType})
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Sektion 2: Alle geladenen fixen Gewässer */}
          <h3
            style={{
              margin: "0 0 10px 0",
              fontSize: "15px",
              color: "var(--accent-orange)",
            }}
          >
            🗂️ Alle Gewässer ({allFixedWaters.length}):
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {allFixedWaters.map((w) => (
              <div
                key={w._id}
                style={{
                  fontSize: "12px",
                  padding: "4px 6px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                  borderLeft: "3px solid var(--border-color)",
                }}
              >
                {w.name}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ==========================================
          8. LEAFLET MAP CONTAINER & MARKER (TEIL A)
          ========================================== */}
      <MapContainer
        key="osm-classic-map"
        center={[position.lat, position.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OpenStreetMap Kachel-Ebene */}
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

        {/* Klick-Erfassung auf der Karte aktivieren */}
        <ClickHandler onClick={handleMapClick} />

        {/* Marker für den aktuellen Standort des Anglers */}
        <Marker position={[position.lat, position.lng]} icon={userIcon} />

        {/* Temporärer Marker für das Eintragen eines neuen Spots */}
        {newSpotPos && (
          <Marker
            position={[newSpotPos.lat, newSpotPos.lng]}
            icon={spotIcon}
            ref={newMarkerRef}
          >
            <Popup closeOnClick={false}>
              <form
                ref={formRef}
                onSubmit={handleSaveSpot}
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

                {/* Gewässer-Auswahl: Normalansicht vs. Suchmodus */}
                {!isSearching ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--bg-input)",
                      padding: "6px 8px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "140px",
                      }}
                    >
                      📍{" "}
                      {selectedWater ? selectedWater.name : "Kein Gewässer nah"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSearching(true);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-cyan)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      <Edit2 size={10} /> Ändern
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
                        placeholder="Gewässer suchen..."
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
                        maxHeight: "135px", // Etwas höher für mehr Sichtbarkeit
                        overflowY: "scroll", // Erzwingt die Scrollbar bei Bedarf
                        paddingRight: "4px", // Verhindert, dass Text unter die Scrollbar rutscht
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        marginBottom: "8px", // Schafft Luft nach unten zum Foto-Upload
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          color: "var(--text-muted)",
                          fontWeight: "bold",
                        }}
                      >
                        {searchQuery ? "🔍 Ergebnisse:" : "🗺️ Alle Gewässer:"}
                      </span>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWater({
                              _id: "default",
                              name: "Allgemeines Gewässer",
                              waterType: "see",
                            });
                            setIsSearching(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "rgba(246, 115, 22, 0.1)",
                            border: "1px dashed var(--accent-orange)",
                            borderRadius: "4px",
                            padding: "4px",
                            color: "var(--accent-orange)",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          <HelpCircle size={10} /> Default-Gewässer
                        </button>
                      )}
                      {(searchQuery ? filteredWaters : allFixedWaters).map(
                        (w) => (
                          <button
                            key={w._id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWater(w);
                              setIsSearching(false);
                              searchQuery && setSearchQuery("");
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
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Foto-Upload */}
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  <span>📸 Foto hinzufügen (optional):</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedImage(e.target.files[0]);
                      }
                    }}
                    style={{ fontSize: "11px" }}
                  />
                </label>
                <button
                  type="submit"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: "var(--accent-cyan)",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Speichern
                </button>
              </form>
            </Popup>
          </Marker>
        )}

        {/* Alle gespeicherten Spots aus der Datenbank auf der Karte einzeichnen */}
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
                  📍 {spot.waterId?.name || "Gewässer"}
                </p>
                <p
                  style={{
                    fontStyle: "italic",
                    fontSize: "11px",
                    color: "var(--accent-cyan)",
                    margin: "0 0 8px 0",
                  }}
                >
                  Typ: {(spot.waterId?.waterType || "see").toUpperCase()}
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
