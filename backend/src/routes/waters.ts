import express from "express";
import Water from "../models/Water";

const router = express.Router();

// 1. GET all waters (Sortiert nach den neuesten Einträgen)
router.get("/", async (req, res) => {
  try {
    const waters = await Water.find().sort({ createdAt: -1 });
    res.json(waters);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE water (Nimmt Gewässerart und Cloudinary-Bild-URL entgegen)
router.post("/", async (req, res) => {
  try {
    const { name, location, lat, lng, waterType, imageUrl } = req.body;

    const water = await Water.create({
      name,
      location,
      lat: Number(lat),
      lng: Number(lng),
      waterType: waterType || "see", // Speichert den Typ
      imageUrl: imageUrl || "", // Speichert die Bild-URL
    });

    res.status(201).json(water);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 3. PATCH favorite status (Schaltet das Herz im Backend um)
router.patch("/:id/favorite", async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;

    const updatedWater = await Water.findByIdAndUpdate(
      id,
      { isFavorite },
      { new: true }, // Gibt das aktualisierte Dokument zurück
    );

    if (!updatedWater) {
      return res.status(404).json({ message: "Gewässer nicht gefunden" });
    }

    res.json(updatedWater);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// 4. DELETE water by ID (Löscht den Spot permanent)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedWater = await Water.findByIdAndDelete(id);

    if (!deletedWater) {
      return res.status(404).json({ message: "Gewässer nicht gefunden" });
    }

    res.json({ message: "Gewässer erfolgreich gelöscht", id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
