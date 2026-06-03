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

// Leaflet CSS direkt importieren, um Darstellungsfehler zu beheben
import "leaflet/dist/leaflet.css";

type WaterSpot = {
  _id?: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
};

type Pos = {
  lat: number;
  lng: number;
};

function ClickHandler({ onClick }: { onClick: (pos: Pos) => void }) {
  useMapEvents({
    click(e) {
      onClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
}

export default function Map() {
  const [position, setPosition] = useState<Pos | null>(null);
  const [dbMarkers, setDbMarkers] = useState<WaterSpot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // States für das Erstellen eines neuen temporären Markers
  const [newSpotPos, setNewSpotPos] = useState<Pos | null>(null);
  const [newSpotName, setNewSpotName] = useState<string>("");

  const newMarkerRef = useRef<L.Marker | null>(null);

  // -----------------------------
  // INITIAL LOAD (GPS + DATABASE)
  // -----------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition({ lat: 49.4521, lng: 11.0767 });
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
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

  // Öffnet das Popup des neuen Markers automatisch, sobald er auf der Karte erscheint
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

  // Klick auf Map: Setzt einen temporären Vorschau-Marker
  function handleMapClick(pos: Pos) {
    setNewSpotPos(pos);
    setNewSpotName(""); // Eingabefeld leeren
  }

  // Absenden des Popup-Formulars speichert in der MongoDB
  async function handleSaveSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpotPos || !newSpotName.trim()) return;

    try {
      // 1. Backend-Call absetzen und auf DB-Eintrag warten
      await createWater(
        newSpotName,
        "GPS Spot",
        newSpotPos.lat,
        newSpotPos.lng,
      );

      // 2. Eingabe-Zustand sofort aufräumen
      setNewSpotPos(null);
      setNewSpotName("");

      // 3. Frisch mit der MongoDB synchronisieren
      await loadWaters();
    } catch (err) {
      console.log("Fehler beim Speichern:", err);
      setNewSpotPos(null);
      setNewSpotName("");
    }
  }

  // Gewässer aus der DB löschen
  async function handleDeleteSpot(id: string) {
    if (!window.confirm("Möchtest du diesen Spot wirklich löschen?")) return;

    try {
      // 1. API Call zum Löschen absenden
      await deleteWater(id);
      // 2. UI direkt aktualisieren, indem wir den entfernten Spot herausfiltern
      setDbMarkers((prev) => prev.filter((spot) => spot._id !== id));
    } catch (err) {
      console.log("Fehler beim Löschen des Spots:", err);
      alert("Fehler beim Löschen des Gewässers.");
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

  // Base64-Grafiken für fehlerfreies Rendering in Vite
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

      {/* Eigener Standort */}
      <Marker position={[position.lat, position.lng]} icon={userIcon} />

      {/* Temporärer Marker für die neue Eingabe */}
      {newSpotPos && (
        <Marker
          position={[newSpotPos.lat, newSpotPos.lng]}
          icon={spotIcon}
          ref={newMarkerRef}
        >
          <Popup closeOnClick={false}>
            <form onSubmit={handleSaveSpot} className="map-popup-form">
              <h3>Neuen Spot eintragen</h3>
              <input
                type="text"
                placeholder="Gewässername (z.B. Baggersee)"
                value={newSpotName}
                onChange={(e) => setNewSpotName(e.target.value)}
                autoFocus
              />
              <button type="submit">Speichern</button>
            </form>
          </Popup>
        </Marker>
      )}

      {/* Alle bereits gespeicherten Spots aus der MongoDB */}
      {dbMarkers.map((spot, i) => (
        <Marker
          key={spot._id || `db-${i}`}
          position={[spot.lat, spot.lng]}
          icon={spotIcon}
        >
          <Popup>
            <div className="map-popup-form">
              <h3>{spot.name}</h3>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Lat: {spot.lat.toFixed(4)} | Lng: {spot.lng.toFixed(4)}
              </p>
              {/* Führt jetzt die echte Lösch-Funktion im Backend aus */}
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
