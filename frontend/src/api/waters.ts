const API_URL = import.meta.env.VITE_API_URL;

// CLOUDINARY-KONFIGURATION (Nutzt deinen Cloud-Namen)
const CLOUDINARY_URL = "https://cloudinary.com";
const UPLOAD_PRESET = "ml_default";

export async function getWaters() {
  const res = await fetch(`${API_URL}/api/waters`);
  if (!res.ok) throw new Error("Fehler beim Laden der Gewässer");
  return await res.json();
}

export async function deleteWater(id: string) {
  const res = await fetch(`${API_URL}/api/waters/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Fehler beim Löschen des Gewässers");
  return await res.json();
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  const res = await fetch(`${API_URL}/api/waters/${id}/favorite`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });
  if (!res.ok) throw new Error("Favoriten-Status konnte nicht geändert werden");
  return await res.json();
}

export async function createWater(
  name: string,
  location: string,
  lat: number,
  lng: number,
  waterType: string,
  imageFile: File | null,
) {
  let finalImageUrl = "";

  // 1. Wenn ein Bild ausgewählt wurde, lade es direkt zu Cloudinary hoch
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
      } else {
        console.error(
          "Cloudinary Upload fehlgeschlagen:",
          await cloudRes.text(),
        );
      }
    } catch (cloudErr) {
      console.error("Netzwerkfehler beim Cloudinary-Upload:", cloudErr);
    }
  }

  // Fallback: Wunderschöne Standard-Angelbilder, falls kein eigenes Bild hochgeladen wurde
  if (!finalImageUrl) {
    if (waterType === "fluss") finalImageUrl = "https://unsplash.com";
    else if (waterType === "meer") finalImageUrl = "https://unsplash.com";
    else finalImageUrl = "https://unsplash.com";
  }

  // 2. Schicke alle Daten mitsamt der Cloud-Bild-URL an dein Node.js Backend
  const res = await fetch(`${API_URL}/api/waters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      location,
      lat,
      lng,
      waterType,
      imageUrl: finalImageUrl,
    }),
  });

  if (!res.ok) throw new Error("Fehler beim Erstellen des Gewässers");
  return await res.json();
}
