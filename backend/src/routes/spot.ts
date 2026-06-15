import express from "express";

import Spot from "../models/Spot";

const router = express.Router();

/* -------------------------------------------------------------
   1. GET all personal spots
------------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const spots = await Spot.find()
      .populate({
        path: "waterId",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    res.json(spots);
  } catch (err: any) {
    console.error("Fehler bei GET /api/spots:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   2. CREATE new personal spot
------------------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { waterId, name, location, lat, lng, imageUrl } = req.body;

    const finalWaterId =
      !waterId || waterId === "default" || waterId === "" ? null : waterId;

    const newSpot = await Spot.create({
      waterId: finalWaterId,
      name,
      location,
      lat: Number(lat),
      lng: Number(lng),
      imageUrl,
    });

    const populatedSpot = await newSpot.populate({
      path: "waterId",
      strictPopulate: false,
    });

    res.status(201).json(populatedSpot);
  } catch (err: any) {
    console.error("Fehler bei POST /api/spots:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   3. PATCH favorite status
------------------------------------------------------------- */
router.patch("/:id/favorite", async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;

    const updatedSpot = await Spot.findByIdAndUpdate(
      id,
      { isFavorite },
      { new: true },
    ).populate({
      path: "waterId",
      strictPopulate: false,
    });

    if (!updatedSpot)
      return res.status(404).json({ message: "Spot nicht gefunden" });
    res.json(updatedSpot);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   4. PATCH update spot notes
------------------------------------------------------------- */
router.patch("/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updatedSpot = await Spot.findByIdAndUpdate(
      id,
      { notes },
      { new: true },
    );

    if (!updatedSpot)
      return res.status(404).json({ message: "Spot nicht gefunden" });
    res.json(updatedSpot);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   5. DELETE spot permanent
------------------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const deletedSpot = await Spot.findByIdAndDelete(req.params.id);
    if (!deletedSpot)
      return res.status(404).json({ message: "Spot nicht gefunden" });
    res.json({ message: "Spot erfolgreich gelöscht", id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
