import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { createWater, getWaters, deleteWater } from "../api/waters";

import "leaflet/dist/leaflet.css";

type WaterSpot = {
  _id?: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  waterType?: string;
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
  const [error, setError] = useState<string | null>(null);

  // States für neuen Spot (inklusive Gewässertyp und Bilddatei)
  const [newSpotPos, setNewSpotPos] = useState<Pos | null>(null);
  const [newSpotName, setNewSpotName] = useState<string>("");
  const [waterType, setWaterType] = useState<string>("see");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const newMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition({ lat: 49.4521, lng: 11.0767 });
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.log("GPS BLOCKED:", err);
          setPosition({ lat: 49.4521, lng: 11.0767 });
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
    loadWaters();
  }, []);

  useEffect(() => {
    if (newSpotPos && newMarkerRef.current) {
      newMarkerRef.current.openPopup();
    }
  }, [newSpotPos]);

  async function loadWaters() {
    try {
      const data = await getWaters();
      setDbMarkers(data);
    } catch (err) {
      console.log("Fehler beim Laden der Gewässer:", err);
      setError("Gewässer konnten nicht geladen werden");
    }
  }

  function handleMapClick(pos: Pos) {
    setNewSpotPos(pos);
    setNewSpotName("");
    setWaterType("see");
    setSelectedImage(null);
  }

  // KORRIGIERT: Übergibt jetzt alle 6 geforderten Argumente an die API
  async function handleSaveSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpotPos || !newSpotName.trim()) return;

    try {
      await createWater(
        newSpotName,
        waterType.toUpperCase(),
        newSpotPos.lat,
        newSpotPos.lng,
        waterType,
        selectedImage,
      );

      setNewSpotPos(null);
      setNewSpotName("");
      setWaterType("see");
      setSelectedImage(null);
      await loadWaters();
    } catch (err) {
      console.log("Fehler beim Speichern:", err);
      setNewSpotPos(null);
      setNewSpotName("");
    }
  }

  async function handleDeleteSpot(id: string) {
    if (!window.confirm("Möchtest du diesen Spot wirklich löschen?")) return;
    try {
      await deleteWater(id);
      setDbMarkers((prev) => prev.filter((spot) => spot._id !== id));
    } catch (err) {
      console.log("Fehler beim Löschen des Spots:", err);
    }
  }

  if (error)
    return (
      <p style={{ color: "var(--accent-red)", padding: 20 }}>❌ {error}</p>
    );
  if (!position)
    return (
      <p style={{ color: "var(--text-muted)", padding: 20 }}>
        📍 Standort wird geladen...
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
      center={[position.lat, position.lng]}
      zoom={13}
      style={{ height: "calc(100vh - 65px)", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              onSubmit={handleSaveSpot}
              className="map-popup-form"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minWidth: "180px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "14px" }}>
                Neuen Spot eintragen
              </h3>

              <input
                type="text"
                placeholder="Gewässername"
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

              {/* Auswahl des Typs */}
              <select
                value={waterType}
                onChange={(e) => setWaterType(e.target.value)}
                style={{
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "#fff",
                }}
              >
                <option value="see">🏞️ See</option>
                <option value="fluss">🏞️ Fluss</option>
                <option value="meer">🌊 Meer</option>
              </select>

              {/* Foto-Upload Feld */}
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
                <span>📸 Eigenes Foto hinzufügen (optional):</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0])
                      setSelectedImage(e.target.files[0]);
                  }}
                  style={{ fontSize: "11px" }}
                />
              </label>

              <button
                type="submit"
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
            <div
              className="map-popup-form"
              style={{ textAlign: "center", minWidth: "150px" }}
            >
              {spot.imageUrl && (
                <img
                  src={spot.imageUrl}
                  alt={spot.name}
                  style={{
                    width: "100%",
                    maxHeight: "90px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                />
              )}
              <h3 style={{ margin: "4px 0", fontSize: "14px" }}>{spot.name}</h3>
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "11px",
                  color: "var(--accent-cyan)",
                  margin: "0 0 8px 0",
                }}
              >
                Typ: {spot.waterType?.toUpperCase() || "SEE"}
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
