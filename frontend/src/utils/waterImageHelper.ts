// Korrigierte Pfade und Dateinamen basierend auf deiner Ordnerstruktur
import seeBg from "../assets/see.jpg";
import flussBg from "../assets/fluss.jpg";
import meerBg from "../assets/meer.jpg";

interface WaterImageInput {
  imageUrl?: string | null;
  waterType?: string | null;
}

export const getWaterImage = (water?: WaterImageInput | null): string => {
  if (!water) return seeBg;

  const trimmedUrl = water.imageUrl?.trim();

  // 1. Prüfen, ob eine gültige Bild-URL existiert
  if (
    trimmedUrl &&
    trimmedUrl !== "" &&
    /\.(jpeg|jpg|gif|png|webp)$/i.test(trimmedUrl)
  ) {
    return trimmedUrl;
  }

  // 2. Fallback basierend auf dem Gewässertyp
  const typ = (water.waterType || "see").toLowerCase().trim();

  if (typ === "fluss") return flussBg;
  if (typ === "meer") return meerBg;

  return seeBg; // Absolutes Fallback (see.jpg)
};
