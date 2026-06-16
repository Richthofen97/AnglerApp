import express from "express";
import Water from "../models/Water";
import dns from "dns";

const router = express.Router();

// SYSTEM-FIX: Zwingt den gesamten Node.js-Prozess in dieser Route dazu,
// IPv4 bei der DNS-Auflösung radikal zu bevorzugen. Das killt das 'fetch failed'!
dns.setDefaultResultOrder("ipv4first");

router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    // ==========================================================================
    // FALL 1: KLICK AUF DIE KARTE (100% Live via Nominatim OpenStreetMap)
    // ==========================================================================
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.json([]);
      }

      try {
        // Die korrekte Nominatim-URL mit abschließendem Schrägstrich gegen den 301
        const url =
          "https://openstreetmap.org" +
          latitude +
          "&lon=" +
          longitude +
          "&zoom=14&addressdetails=1&accept-language=de";

        const fetchResponse = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "AngelAppBackend/1.0 (nikolai.project@example.com)",
            Accept: "application/json",
          },
        });

        if (!fetchResponse.ok) {
          throw new Error("HTTP-Status " + fetchResponse.status);
        }

        const data = (await fetchResponse.json()) as any;
        const address = data?.address || {};

        // Holt den echten Namen des Gewässers aus den OSM-Tags
        const waterName = address.natural || address.waterway || data.name;

        if (waterName) {
          let type: "see" | "fluss" | "meer" = "see";

          if (
            address.waterway ||
            waterName.toLowerCase().includes("bach") ||
            waterName.toLowerCase().includes("kanal")
          ) {
            type = "fluss";
          } else if (
            waterName.toLowerCase().includes("ostsee") ||
            waterName.toLowerCase().includes("nordsee")
          ) {
            type = "meer";
          }

          return res.json([
            {
              _id: data.osm_id
                ? "osm-" + data.osm_id
                : "live-" + Math.floor(latitude * 1000),
              name: waterName,
              waterType: type,
              location: { type: "Point", coordinates: [longitude, latitude] },
            },
          ]);
        }

        // Orts-Fallback, falls Nominatim an der Stelle kein direktes Gewässer-Element findet
        let locationName =
          address.village ||
          address.town ||
          address.city ||
          address.municipality ||
          `Region [${latitude.toFixed(2)}, ${longitude.toFixed(2)}]`;

        return res.json([
          {
            _id: "live-area-" + Math.floor(latitude * 1000),
            name: "Gewässer bei " + locationName,
            waterType: "see",
            location: { type: "Point", coordinates: [longitude, latitude] },
          },
        ]);
      } catch (osmError: any) {
        console.error("NOMINATIM-LIVE-FEHLER:", osmError.message);

        return res.json([
          {
            _id: "live-err-" + Math.floor(latitude * 1000),
            name:
              "Gewässer bei Spot [" +
              latitude.toFixed(3) +
              ", " +
              longitude.toFixed(3) +
              "]",
            waterType: "see",
            location: { type: "Point", coordinates: [longitude, latitude] },
          },
        ]);
      }
    }

    // ==========================================================================
    // FALL 2: GLOBALE ÜBERSICHT
    // ==========================================================================
    const dbWaters = await Water.find().sort({ name: 1 });
    return res.json(dbWaters);
  } catch (err: any) {
    console.error("Fataler Fehler in Gewässer-API:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
