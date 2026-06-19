import { customFetch } from "./fetchClient";

// CLOUDINARY-KONFIGURATION (Für deine Fangfotos)
const CLOUDINARY_URL = "https://cloudinary.com";
const UPLOAD_PRESET = "ml_default";

/* ==========================================================================
   1. FÄNGE FÜR EINEN SPOT LADEN
   ========================================================================== */
export async function getCatchesForSpot(spotId: string) {
  return await customFetch(`/api/catches/spot/${spotId}`);
}

/* ==========================================================================
   2. NEUEN FANG EINTRAGEN (Mit optionalem Foto-Upload zu Cloudinary)
   ========================================================================== */
export async function createCatch(
  spotId: string,
  species: string,
  weight: number | null,
  length: number | null,
  notes: string,
  imageFile: File | null,
) {
  let finalImageUrl = "";

  // Falls ein Foto vom Fisch ausgewählt wurde, laden wir es hoch
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
      console.error("Cloudinary Fang-Upload fehlgeschlagen:", err);
    }
  }

  // Daten sicher an dein Backend übergeben
  return await customFetch("/api/catches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      spotId,
      species,
      weight,
      length,
      imageUrl: finalImageUrl,
      notes,
      caughtAt: new Date().toISOString(),
    }),
  });
}

/* ==========================================================================
   3. ALLE FÄNGE GLOBAL ABRUFEN (Für das Haupt-Tagebuch)
   ========================================================================== */
export async function getAllCatches() {
  return await customFetch("/api/catches");
}

/* ==========================================================================
   4. FANG LÖSCHEN
   ========================================================================== */
export async function deleteCatch(catchId: string) {
  return await customFetch(`/api/catches/${catchId}`, {
    method: "DELETE",
  });
}

/* ==========================================================================
   5. SICHTBARKEIT (COMMUNITY) AKTUALISIEREN
   ========================================================================== */
export async function updateCatchVisibility(
  catchId: string,
  isPublic: boolean,
) {
  return await customFetch(`/api/catches/${catchId}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublic }),
  });
}
/* ==========================================================================
   6. GLOBALEN COMMUNITY-FEED ABRUFEN
   ========================================================================== */
export async function getCommunityFeed() {
  return await customFetch("/api/catches/community");
}

/* ==========================================================================
   7. LIKE AUF EINEN FANG TOGGELN
   ========================================================================== */
export async function toggleLikeCatch(catchId: string) {
  return await customFetch(`/api/catches/${catchId}/like`, {
    method: "POST",
  });
}

/* ==========================================================================
   8. DISLIKE AUF EINEN FANG TOGGELN
   ========================================================================== */
export async function toggleDislikeCatch(catchId: string) {
  return await customFetch(`/api/catches/${catchId}/dislike`, {
    method: "POST",
  });
}

/* ==========================================================================
   9. KOMMENTAR ZU EINEM FANG HINZUFÜGEN
   ========================================================================== */
export async function addCommentToCatch(catchId: string, commentText: string) {
  return await customFetch(`/api/catches/${catchId}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: commentText }),
  });
}
/* ==========================================================================
   10. KOMMENTAR LÖSCHEN
   ========================================================================== */
export async function deleteCommentFromCatch(
  catchId: string,
  commentId: string,
) {
  return await customFetch(`/api/catches/${catchId}/comment/${commentId}`, {
    method: "DELETE",
  });
}
