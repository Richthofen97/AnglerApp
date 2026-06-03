import express from "express";
import Water from "../models/Water";

const router = express.Router();

// GET all waters
router.get("/", async (req, res) => {
  const waters = await Water.find();
  res.json(waters);
});

// CREATE water
router.post("/", async (req, res) => {
  try {
    const { name, location, lat, lng } = req.body;

    const water = await Water.create({
      name,
      location,
      lat,
      lng,
    });

    res.status(201).json(water);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE water by ID
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
