import express from "express";
import Water from "../models/Water";

const router = express.Router();

// 1. GET all fixed waters (Gibt alle fixen Gewässer alphabetisch sortiert zurück)
router.get("/", async (req, res) => {
  try {
    const waters = await Water.find().sort({ name: 1 });
    res.json(waters);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SEED-Route (KORRIGIERT: Speichert die echten GPS-Punkte für die Umkreissuche!)
router.get("/seed", async (req, res) => {
  try {
    await Water.deleteMany({}); // Löscht die alten Einträge ohne Koordinaten

    const defaultWaters = await Water.create([
      {
        name: "Main (Abschnitt Bamberg)",
        waterType: "fluss",
        location: { type: "Point", coordinates: [10.8861, 49.8988] }, // [Longitude, Latitude]
      },
      {
        name: "Baggersee Burgebrach",
        waterType: "see",
        location: { type: "Point", coordinates: [10.7422, 49.8259] },
      },
      {
        name: "Regnitz (Forchheim)",
        waterType: "fluss",
        location: { type: "Point", coordinates: [11.0539, 49.7214] },
      },
      {
        name: "Großer Brombachsee",
        waterType: "see",
        location: { type: "Point", coordinates: [10.9231, 49.1345] },
      },
      {
        name: "Ostsee (Kieler Bucht)",
        waterType: "meer",
        location: { type: "Point", coordinates: [10.1523, 54.3541] },
      },
    ]);
    res.json({
      message: "Fixe Gewässer mit Geodaten erfolgreich eingespeist! 🎣",
      data: defaultWaters,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
