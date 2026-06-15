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
import { WMSTileLayer } from "react-leaflet";

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

function ClickHandler({ onClick }: { onClick: (pos: Pos) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function Map() {
  const [position, setPosition] = useState<Pos | null>(null);
  const [dbMarkers, setDbMarkers] = useState<WaterSpot[]>([]);
  const [allFixedWaters, setAllFixedWaters] = useState<FixedWater[]>([]);
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
    if (!newSpotPos || !newSpotName.trim()) return;

    // Wenn "Default" gewählt ist, senden wir einen leeren String ans Backend
    const waterId =
      selectedWater && selectedWater._id !== "default" ? selectedWater._id : "";

    try {
      // ✅ HAARGENAU ABGESTIMMT: Alle 6 Argumente in der exakt richtigen Reihenfolge!
      await createWater(
        newSpotName, // 1. name
        "GPS Spot", // 2. location
        newSpotPos.lat, // 3. lat
        newSpotPos.lng, // 4. lng
        waterId, // 5. waterType (Hier übergeben wir die ID oder "")
        selectedImage, // 6. imageFile
      );

      setNewSpotPos(null);
      setNewSpotName("");
      setSelectedImage(null);
      setSelectedWater(null);

      // Karte mit den neuen Spots frisch laden
      setDbMarkers(await getWaters());
    } catch (err) {
      console.log("Fehler beim Speichern des Spots:", err);
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

  const filteredWaters = allFixedWaters
    .filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);
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

  const userIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBmaWxsPSIjMmRkNGJmIiBkPSJNMTIgMmE4IDggMCAwIDAgLTggOGMwIDUuMjUgOCAxMiA4IDEyczgtNi43NSA4LTEyYTggOCAwIDAgMCAtOC04em0wIDExYTQgNCAwIDEgMSAtNC00IDQgNCAwIDAgMSA0IDR6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
  const spotIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBmaWxsPSIjZjY3MzE2IiBkPSJNMTIgMmE4IDggMCAwIDAgLTggOGMwIDUuMjUgOCAxMiA4IDEyczgtNi43NSA4LTEyYTggOCAwIDAgMCAtOC04em0wIDExYTQgNCAwIDEgMSAtNC00IDQgNCAwIDAgMSA0IDR6Ii8+PC9zdmc+",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <MapContainer
      key="osm-classic-map"
      center={[position.lat, position.lng]}
      zoom={13}
      style={{ height: "calc(100vh - 65px)", width: "100%" }}
    >
      {/* DIE ABSOLUT SICHERE STRUKTUR: Kein Verquetschen der URL mehr möglich! */}
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
                      maxHeight: "110px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
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
                      ),
                    )}
                  </div>
                </div>
              )}

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
              <h3 style={{ margin: "4px 0", fontSize: "14px" }}>{spot.name}</h3>
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
  );
}
