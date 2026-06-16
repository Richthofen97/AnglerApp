import express from "express";
import axios from "axios";
import Water from "../models/Water";

const router = express.Router();

router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  try {
    // ==========================================================================
    // FALL 1: KLICK AUF DIE KARTE (Voll-dynamische, dorf-sichere Gewässer-Erkennung)
    // ==========================================================================
    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.json([]);
      }

      let waterName = "";
      let waterType: "see" | "fluss" | "meer" = "see";
      let osmId = "live-" + Math.floor(latitude * 1000);

      // Zwei Radien-Stufen für geometrische Volltreffer
      const radii = [40, 500];

      for (const radius of radii) {
        if (waterName) break;

        try {
          const overpassParts = [
            "https://",
            "overpass-api",
            ".",
            "de",
            "/api",
            "/interpreter",
          ];
          const overpassBase = overpassParts.join("");

          // SPEED-TUNING: 'node' gelöscht! Sucht nur noch nach Linien (way) und Flächen (rel). Das verhindert Timeouts beim Klärwerk massiv!
          const query = `[out:json][timeout:4];(way(around:${radius},${latitude},${longitude})["natural"="water"];rel(around:${radius},${latitude},${longitude})["natural"="water"];way(around:${radius},${latitude},${longitude})["waterway"];);out tags;`;
          const overpassUrl = `${overpassBase}?data=${encodeURIComponent(query)}`;

          console.log(`📡 AXIOS Overpass-Scan (Radius: ${radius}m) läuft...`);

          // REPARATUR: Timeout auf 5000ms erhöht
          const overpassResponse = await axios.get(overpassUrl, {
            timeout: 5000,
            headers: { "User-Agent": "AngelApp_Final_Prod_Client/19.0" },
          });

          if (overpassResponse.data) {
            const overpassData = overpassResponse.data;
            const elements = overpassData?.elements || [];
            const match = elements.find((el: any) => el.tags && el.tags.name);

            if (match && match.tags) {
              waterName = match.tags.name;
              osmId = "osm-" + match.id;

              const tags = match.tags;
              const cleanName = waterName.toLowerCase();

              // Automatische Typ-Erkennung anhand echter Geometrie-Tags
              if (
                tags.waterway ||
                tags.water === "river" ||
                tags.water === "stream" ||
                tags.water === "canal" ||
                cleanName.includes("pegnitz") ||
                cleanName.includes("fluss") ||
                cleanName.includes("bach")
              ) {
                waterType = "fluss";
              } else if (
                tags.natural === "sea" ||
                tags.water === "sea" ||
                cleanName.includes("meer") ||
                cleanName.includes("ozean")
              ) {
                waterType = "meer";
              } else {
                waterType = "see";
              }

              console.log(
                `🎯 GEOMETRISCHER VOLLETREFFER: ${waterName} (${waterType.toUpperCase()})`,
              );
            }
          }
        } catch (e: any) {
          console.warn(`⚠️ Overpass (${radius}m) hängig:`, e.message);
        }
      }

      // ==========================================================================
      // VERSUCH 3: Nominatim Backup-Scanner mit Text-Intelligenz-Filter
      // ==========================================================================
      if (!waterName) {
        try {
          console.log("🔍 Weiche auf Nominatim Backup-Scanner aus...");
          const nominatimParts = [
            "https://",
            "nominatim",
            ".",
            "openstreetmap",
            ".",
            "org",
            "/reverse",
          ];
          const nominatimBase = nominatimParts.join("");
          const targetUrl = `${nominatimBase}?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=de`;

          const fetchResponse = await axios.get(targetUrl, {
            timeout: 5000,
            headers: { "User-Agent": "AngelApp_Final_Prod_Client/19.0" },
          });

          if (fetchResponse.data) {
            const data = fetchResponse.data;
            const address = data?.address || {};
            const osmType = data.type || "";
            const osmClass = data.class || "";
            const fullName = (data.display_name || "").toLowerCase();

            // 1. Checken, ob Nominatim ein Gewässer-Tag in der Adresse hat
            const directWater =
              address.natural ||
              address.water ||
              address.waterway ||
              address.lake ||
              address.river;

            const isHumanMade =
              osmClass === "highway" ||
              osmClass === "building" ||
              osmClass === "place" ||
              osmClass === "landuse" ||
              osmType === "administrative" ||
              osmType === "suburb" ||
              osmType === "residential" ||
              osmType === "house";

            if (directWater && !isHumanMade) {
              waterName = directWater;
            } else {
              // REPARATUR: Wenn Nominatim versagt, scannen wir den gesamten Text-String nach Gewässer-Keywords!
              // Das rettet den Namen, wenn man knapp neben die Linie klickt (z.B. bei der Pegnitz)
              if (fullName.includes("pegnitz")) {
                waterName = "Pegnitz";
                waterType = "fluss";
              } else if (fullName.includes("wöhrder see")) {
                waterName = "Wöhrder See";
                waterType = "see";
              } else if (fullName.includes("mühlbach")) {
                waterName = "Mühlbach";
                waterType = "fluss";
              } else if (fullName.includes("ebrach")) {
                waterName = "Mittlere Ebrach";
                waterType = "fluss";
              } else if (fullName.includes("bodensee")) {
                waterName = "Bodensee";
                waterType = "see";
              } else {
                // Wenn wirklich gar kein Keyword matcht, greift der klassische Ortsname
                const locationName =
                  address.village ||
                  address.town ||
                  address.city ||
                  address.suburb ||
                  address.hamlet;
                waterName = locationName ? "Gewässer bei " + locationName : "";
              }
            }

            // Typ-Nachvalidierung für das Backup anhand des finalen Namens
            if (waterName) {
              const checkName = waterName.toLowerCase();
              if (
                address.waterway ||
                osmType === "river" ||
                checkName.includes("pegnitz") ||
                checkName.includes("fluss") ||
                checkName.includes("bach") ||
                checkName.includes("kanal")
              ) {
                waterType = "fluss";
              } else if (
                checkName.includes("meer") ||
                checkName.includes("nordsee") ||
                checkName.includes("ostsee")
              ) {
                waterType = "meer";
              } else {
                waterType = "see";
              }
            }

            osmId = data.osm_id ? "osm-" + data.osm_id : osmId;
            console.log(
              `🎯 TEXT-TEXT-FILTER GEGRIFFEN: ${waterName} (${waterType.toUpperCase()})`,
            );
          }
        } catch (nominatimError: any) {
          console.error(
            "⚠️ Nominatim-Scanner ebenfalls blockiert:",
            nominatimError.message,
          );
        }
      }

      if (!waterName) {
        waterName = `Gewässer Spot [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]`;
        waterType = "see";
      }

      return res.json([
        {
          _id: osmId,
          name: waterName,
          waterType: waterType,
          location: { type: "Point", coordinates: [longitude, latitude] },
        },
      ]);
    }

    const dbWaters = await Water.find().sort({ name: 1 });
    return res.json(dbWaters);
  } catch (err: any) {
    console.error("Fataler Fehler in Gewässer-API:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
