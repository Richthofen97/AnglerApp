import express from "express";
import Water from "../models/Water";

const router = express.Router();

// 1. GET: Holt entweder die echten Live-Gewässer via OSM ODER alle aus der DB gespeicherten
router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    // Wenn auf die Karte geklickt wurde, fragen wir LIVE OpenStreetMap ab
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      // OverpassQL-Abfrage: Suche Flüsse (waterway) und Seen (natural=water) im Umkreis von 2000 Metern
      const overpassQuery = `
        [out:json][timeout:10];
        (
          way["waterway"](around:2000, ${latitude}, ${longitude});
          way["natural"="water"](around:2000, ${latitude}, ${longitude});
          relation["natural"="water"](around:2000, ${latitude}, ${longitude});
        );
        out tags center;
      `;

      const osmUrl = `https://overpass-api.de{encodeURIComponent(overpassQuery)}`;

      const osmResponse = await fetch(osmUrl);
      if (!osmResponse.ok)
        throw new Error("OSM OpenStreetMap API antwortet nicht");

      const osmData = await osmResponse.json();

      // Filtert die OSM-Ergebnisse und bereitet sie für dein Frontend vor
      const realWaters = osmData.elements
        .filter((el: any) => el.tags && el.tags.name) // Nur Gewässer mit Namen
        .map((el: any) => {
          // Gewässertyp bestimmen
          let type: "see" | "fluss" | "meer" = "see";
          if (
            el.tags.waterway ||
            el.tags.water === "river" ||
            el.tags.water === "canal"
          ) {
            type = "fluss";
          } else if (el.tags.water === "sea" || el.tags.bay) {
            type = "meer";
          }

          return {
            _id: el.id.toString(), // OSM-ID als String nutzen
            name: el.tags.name,
            waterType: type,
            location: {
              type: "Point",
              coordinates: [
                el.center ? el.center.lon : longitude,
                el.center ? el.center.lat : latitude,
              ],
            },
          };
        });

      // Doppelte Gewässernamen herausfiltern (z.B. wenn ein Fluss aus vielen Stücken besteht)
      const uniqueWaters = realWaters.filter(
        (water: any, index: number, self: any[]) =>
          self.findIndex((w) => w.name === water.name) === index,
      );

      // Falls absolut gar nichts im Umkreis gefunden wurde
      if (uniqueWaters.length === 0) {
        return res.json([
          {
            _id: "unbekannt",
            name: "Unbekanntes Gewässer",
            waterType: "see",
            location: { type: "Point", coordinates: [longitude, latitude] },
          },
        ]);
      }

      // Sende die echten Gewässer (max 5) zurück ans Frontend
      return res.json(uniqueWaters.slice(0, 5));
    }

    // Wenn KEINE Koordinaten übergeben wurden (Übersichtsliste), holt es deine gespeicherten Favoriten-Gewässer aus der DB
    const dbWaters = await Water.find().sort({ name: 1 });
    res.json(dbWaters);
  } catch (err: any) {
    console.error("Fehler in der Gewässer-API:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. SEED-Route (Kannst du leer lassen, da wir keine künstlichen Daten mehr brauchen)
router.get("/seed", async (req, res) => {
  res.json({
    message:
      "Seed nicht mehr notwendig. Wir nutzen jetzt die Live-API von OpenStreetMap! 🌍",
  });
});

export default router;
