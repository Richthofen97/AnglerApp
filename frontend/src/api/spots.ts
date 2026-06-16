// Ganz oben importieren (Achte darauf, dass der Pfad zu deiner fetchClient-Datei stimmt!)
import { customFetch } from "./fetchClient";

// CLOUDINARY-KONFIGURATION (Bleibt für den Foto-Upload aktiv)
const CLOUDINARY_URL = "https://cloudinary.com";
const UPLOAD_PRESET = "ml_default";

/* ==========================================================================
   1. SPOTS ABRUFEN (KORREKTUR: Nutzt jetzt customFetch für das automatische Token!)
   ========================================================================== */
export async function getSpots() {
  // customFetch setzt automatisch http://10.10.1.120:5000 davor und hängt das Token an
  return await customFetch("/api/spots");
}

/* ==========================================================================
   2. SPOT LÖSCHEN
   ========================================================================== */
export async function deleteSpot(id: string) {
  return await customFetch(`/api/spots/${id}`, {
    method: "DELETE",
  });
}

/* ==========================================================================
   3. FAVORITEN-STATUS UMSCHALTEN
   ========================================================================== */
export async function toggleSpotFavorite(id: string, isFavorite: boolean) {
  return await customFetch(`/api/spots/${id}/favorite`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });
}

/* ==========================================================================
   4. NOTIZEN SPEICHERN
   ========================================================================== */
export async function updateSpotNotes(id: string, notes: string) {
  return await customFetch(`/api/spots/${id}/notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
}

/* ==========================================================================
   5. NEUEN SPOT ERSTELLEN
   ========================================================================== */
export async function createSpot(
  waterId: string,
  name: string,
  location: string,
  lat: number,
  lng: number,
  imageFile: File | null,
) {
  let finalImageUrl = "";

  // Cloudinary bleibt unberührt, da es ein externer Dienst ist
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

  // Schickt die Daten geschützt an dein Backend
  return await customFetch("/api/spots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      waterId,
      name,
      location,
      lat,
      lng,
      imageUrl: finalImageUrl,
    }),
  });
}
