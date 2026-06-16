// Ganz oben importieren (Passe den Pfad an, falls die Datei in einem anderen Ordner liegt)
import { customFetch } from "./fetchClient";

// CLOUDINARY-KONFIGURATION (Bleibt für den Foto-Upload aktiv)
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dplpvrcv7/image/upload";
const UPLOAD_PRESET = "ml_default";

/* ==========================================================================
   1. FIXE HAUPTGEWÄSSER (Die Live-Schnittstelle)
   ========================================================================== */

// Holt die Liste der echten Live-Gewässer via OpenStreetMap aus dem Backend!
export async function getFixedWaters(lat?: number, lng?: number) {
  let endpoint = "/api/waters";

  // Verhindert, dass "undefined" als String-Text übertragen wird, falls die Werte fehlen
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    endpoint += `?lat=${lat}&lng=${lng}`;
  } else {
    // Wenn Hook C (die Textsuche) anspringt und keine Koordinaten hat, brechen wir sofort ab
    return [];
  }

  return await customFetch(endpoint);
}

/* ==========================================================================
   2. SPOTS (Laden, Erstellen, Löschen & Updaten)
   ========================================================================== */

// Ruft alle Spots ab (Lädt jetzt nur noch die des eingeloggten Nutzers!)
export async function getWaters() {
  return await customFetch("/api/spots");
}

// Löscht einen Spot über seine ID
export async function deleteWater(id: string) {
  return await customFetch(`/api/spots/${id}`, {
    method: "DELETE",
  });
}

// Schaltet den Favoriten-Status per Herz-Klick um
export async function toggleFavorite(id: string, isFavorite: boolean) {
  return await customFetch(`/api/spots/${id}/favorite`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });
}

// Speichert die persönlichen Notizen auf der Detailseite
export async function updateWaterNotes(id: string, notes: string) {
  return await customFetch(`/api/spots/${id}/notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
}

// Erstellt einen neuen Spot und schickt Gewässer-Details für die OSM-Registrierung mit!
export async function createWater(
  name: string,
  location: string,
  lat: number,
  lng: number,
  waterType: any,
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

  const targetWaterId = waterType && waterType._id ? waterType._id : waterType;
  const targetWaterName = waterType && waterType.name ? waterType.name : "";
  const targetWaterType =
    waterType && waterType.waterType ? waterType.waterType : "see";

  return await customFetch("/api/spots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      waterId: targetWaterId,
      name,
      location,
      lat,
      lng,
      imageUrl: finalImageUrl,
      waterName: targetWaterName,
      waterType: targetWaterType,
    }),
  });
}
