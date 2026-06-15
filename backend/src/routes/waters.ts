import express from "express";
import Water from "../models/Water";

const router = express.Router();

// 1. GET: Holt entweder die 5 nächsten Gewässer ODER alle Gewässer (für die Übersicht)
router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    // Wenn GPS-Daten übergeben wurden, berechne die 5 nächsten Gewässer
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      try {
        const nearbyWaters = await Water.find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude], // Wichtig bei MongoDB: [lng, lat]
              },
            },
          },
        }).limit(5); // Streng limitiert auf die 5 nächsten Treffer

        return res.json(nearbyWaters);
      } catch (geoIndexError) {
        console.error(
          "Geo-Index wird noch aufgebaut, nutze Fallback:",
          geoIndexError,
        );
        // Falls der Index in der Cloud noch lädt: Gib einfach die ersten 5 Gewässer aus, statt 500!
        const fallbackWaters = await Water.find().limit(5);
        return res.json(fallbackWaters);
      }
    }

    // Wenn KEINE Koordinaten übergeben wurden, schicke alle Gewässer alphabetisch (für die Übersicht)
    const allWaters = await Water.find().sort({ name: 1 });
    res.json(allWaters);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SEED-Route (Bleibt als Absicherung, falls du deine Datenbank befüllen musst)
router.get("/seed", async (req, res) => {
  try {
    await Water.deleteMany({});
    const defaultWaters = await Water.insertMany([
      {
        name: "Main-Donau-Kanal",
        waterType: "fluss",
        location: { type: "Point", coordinates: [11.0767, 49.4521] },
      },
      {
        name: "Rhein",
        waterType: "fluss",
        location: { type: "Point", coordinates: [7.5889, 50.3569] },
      },
      {
        name: "Ostsee",
        waterType: "meer",
        location: { type: "Point", coordinates: [11.0, 54.0] },
      },
      {
        name: "Baggersee Burgebrach",
        waterType: "see",
        location: { type: "Point", coordinates: [10.8262, 49.8259] },
      },
      {
        name: "Bodensee",
        waterType: "see",
        location: { type: "Point", coordinates: [9.4794, 47.6355] },
      },
    ]);
    res.json({ message: "Gewässer geladen!", data: defaultWaters });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
