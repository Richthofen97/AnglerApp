const API_URL = import.meta.env.VITE_API_URL;

// CLOUDINARY-KONFIGURATION (Bleibt für deine Bilder-Cloud aktiv)
const CLOUDINARY_URL = "https://cloudinary.com";
const UPLOAD_PRESET = "ml_default";

/* ==========================================================================
   1. FIXE HAUPTGEWÄSSER
   ========================================================================== */

// Holt die Liste der echten Live-Gewässer via OpenStreetMap aus dem Backend!
export async function getFixedWaters(lat?: number, lng?: number) {
  let url = `${API_URL}/api/waters`;
  if (lat && lng) {
    url += `?lat=${lat}&lng=${lng}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fehler beim Laden der fixen Gewässer");
  return await res.json();
}

/* ==========================================================================
   2. SPOTS
   ========================================================================== */

// Ruft alle Spots ab
export async function getWaters() {
  const res = await fetch(`${API_URL}/api/spots`);
  if (!res.ok) throw new Error("Fehler beim Laden der Spots");
  return await res.json();
}

// Löscht einen Spot über seine ID
export async function deleteWater(id: string) {
  const res = await fetch(`${API_URL}/api/spots/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Fehler beim Löschen des Spots");
  return await res.json();
}

// Schaltet den Favoriten-Status per Herz-Klick um
export async function toggleFavorite(id: string, isFavorite: boolean) {
  const res = await fetch(`${API_URL}/api/spots/${id}/favorite`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });
  if (!res.ok) throw new Error("Favoriten-Status konnte nicht geändert werden");
  return await res.json();
}

// Speichert die persönlichen Notizen auf der Detailseite
export async function updateWaterNotes(id: string, notes: string) {
  const res = await fetch(`${API_URL}/api/spots/${id}/notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error("Notizen konnten nicht gespeichert werden");
  return await res.json();
}

// KORRIGIERT: Erstellt einen neuen Spot und schickt Gewässer-Details für die OSM-Registrierung mit!
export async function createWater(
  name: string,
  location: string,
  lat: number,
  lng: number,
  waterType: any, // Typ auf any geändert, da hier nun das gewählte Gewässer-Objekt reinkommt
  imageFile: File | null,
) {
  let finalImageUrl = "";

  if (imageFile) {
    const cloudinaryData = new FormData();
    cloudinaryData.append("file", imageFile);
    cloudinaryData.append("upload_preset", UPLOAD_PRESET);

    try {
      const cloudRes = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: cloudinaryData,
      });

      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        finalImageUrl = cloudJson.secure_url;
      }
    } catch (err) {
      console.error("Cloudinary-Upload fehlgeschlagen:", err);
    }
  }

  // Extrahiert die Daten, je nachdem, ob waterType ein Objekt (OSM) oder ein String ("default") ist
  const targetWaterId = waterType && waterType._id ? waterType._id : waterType;
  const targetWaterName = waterType && waterType.name ? waterType.name : "";
  const targetWaterType =
    waterType && waterType.waterType ? waterType.waterType : "see";

  // Schickt alle Daten an das /api/spots Backend
  const res = await fetch(`${API_URL}/api/spots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      waterId: targetWaterId,
      name,
      location,
      lat,
      lng,
      imageUrl: finalImageUrl,
      waterName: targetWaterName, // Wichtig für die automatische Datenbank-Registrierung im Backend
      waterType: targetWaterType, // Übermittelt den Typ (fluss/see/meer)
    }),
  });

  if (!res.ok) throw new Error("Fehler beim Erstellen des Spots");
  return await res.json();
}
