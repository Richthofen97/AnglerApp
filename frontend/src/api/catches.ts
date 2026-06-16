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
