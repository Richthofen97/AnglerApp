import express from "express";
import Water from "../models/Water";

const router = express.Router();

// 1. GET: Holt entweder echte Gewässer via OSM oder die aus der DB
router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    // Wenn Koordinaten übergeben wurden, fragen wir die Live-API von OpenStreetMap ab
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      // OverpassQL-Abfrage: Suche Flüsse und Seen im Umkreis von 2000 Metern
      const overpassQuery = `
        [out:json][timeout:15];
        (
          way["waterway"](around:2000, ${latitude}, ${longitude});
          way["natural"="water"](around:2000, ${latitude}, ${longitude});
          relation["natural"="water"](around:2000, ${latitude}, ${longitude});
        );
        out tags center;
      `;

      const osmUrl = `https://overpass-api.de{encodeURIComponent(overpassQuery)}`;

      try {
        // WICHTIG: Wir fügen einen User-Agent Header hinzu, damit die OSM-API uns nicht blockiert!
        const osmResponse = await fetch(osmUrl, {
          headers: {
            "User-Agent":
              "AnglerApp/1.0 (https://anglerapp.onrender.com; contact@example.com)",
          },
        });

        if (!osmResponse.ok) {
          throw new Error(
            `OSM-API antwortete mit Status ${osmResponse.status}`,
          );
        }

        const osmData = await osmResponse.json();

        if (!osmData.elements || osmData.elements.length === 0) {
          return res.json([
            {
              _id: "unbekannt",
              name: "Unbekanntes Gewässer",
              waterType: "see",
            },
          ]);
        }

        // Filtert die OSM-Ergebnisse
        const realWaters = osmData.elements
          .filter((el: any) => el.tags && el.tags.name)
          .map((el: any) => {
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
              _id: el.id.toString(),
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

        // Doppelte Namen eliminieren
        const uniqueWaters = realWaters.filter(
          (water: any, index: number, self: any[]) =>
            self.findIndex((w) => w.name === water.name) === index,
        );

        return res.json(uniqueWaters.slice(0, 5));
      } catch (osmError) {
        console.error(
          "Direkter OSM-Fehler abgefangen, nutze leeres Fallback:",
          osmError,
        );
        // Fallback: Sende ein Dummy-Objekt, damit das Frontend nicht einfriert oder 500 wirft!
        return res.json([
          {
            _id: "osm-error",
            name: "Gewässer-Suche fehlgeschlagen (OSM)",
            waterType: "see",
          },
        ]);
      }
    }

    // Wenn keine Koordinaten übergeben wurden (Übersichtsliste im Hauptmenü)
    const dbWaters = await Water.find().sort({ name: 1 });
    res.json(dbWaters);
  } catch (err: any) {
    console.error("Fataler Fehler in der Gewässer-Route:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. SEED-Route (Sicherheits-Dummy)
router.get("/seed", async (req, res) => {
  res.json({ message: "Live-API aktiv." });
});

export default router;
