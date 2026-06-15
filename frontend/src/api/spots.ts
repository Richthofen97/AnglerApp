const API_URL = import.meta.env.VITE_API_URL;

// CLOUDINARY-KONFIGURATION (Bleibt exakt gleich für dein Profil)
const CLOUDINARY_URL = "https://cloudinary.com";
const UPLOAD_PRESET = "ml_default";

// 1. Alle persönlichen Spots abrufen
export async function getSpots() {
  const res = await fetch(`${API_URL}/api/spots`);
  if (!res.ok) throw new Error("Fehler beim Laden der Spots");
  return await res.json();
}

// 2. Einen Spot dauerhaft löschen
export async function deleteSpot(id: string) {
  const res = await fetch(`${API_URL}/api/spots/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Fehler beim Löschen des Spots");
  return await res.json();
}

// 3. Favoriten-Schalter für einen Spot umschalten
export async function toggleSpotFavorite(id: string, isFavorite: boolean) {
  const res = await fetch(`${API_URL}/api/spots/${id}/favorite`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });
  if (!res.ok) throw new Error("Favoriten-Status konnte nicht geändert werden");
  return await res.json();
}

// 4. Persönliche Notizen für einen Spot auf der Detailseite speichern
export async function updateSpotNotes(id: string, notes: string) {
  const res = await fetch(`${API_URL}/api/spots/${id}/notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error("Notizen konnten nicht gespeichert werden");
  return await res.json();
}

// 5. Neuen Spot anlegen (Lädt optionales Foto hoch und verknüpft es mit der fixen waterId)
export async function createSpot(
  waterId: string,
  name: string,
  location: string,
  lat: number,
  lng: number,
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

  // Schickt die sauberen JSON-Daten mitsamt der Cloud-Bild-URL ans Backend
  const res = await fetch(`${API_URL}/api/spots`, {
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

  if (!res.ok) throw new Error("Fehler beim Erstellen des Spots");
  return await res.json();
}
