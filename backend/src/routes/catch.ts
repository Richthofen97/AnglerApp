import express from "express";
import jwt from "jsonwebtoken";
import Catch from "../models/Catch";

const router = express.Router();

/* -------------------------------------------------------------
   AUTH MIDDLEWARE (Sichert auch die Fänge ab)
------------------------------------------------------------- */
const verifyToken = (
  req: any,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Kein Token vorhanden" });

  try {
    const secret = process.env.JWT_SECRET || "dein_standard_geheimnis";
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Ungültiges Token" });
  }
};
/* -------------------------------------------------------------
   1. GET all catches for the logged-in user (/api/catches)
------------------------------------------------------------- */
router.get("/", verifyToken, async (req: any, res) => {
  try {
    console.log(`📚 LADE GLOBALER FANGTAGEBUCH FÜR USER-ID: ${req.user.id}`);

    // Holt alle Fänge des Users und lädt die Spot-Details (Name, Location) direkt mit!
    const allCatches = await Catch.find({ userId: req.user.id })
      .populate({
        path: "spotId",
        select: "name location imageUrl", // Holt nur die wichtigsten Spot-Infos
        strictPopulate: false,
      })
      .sort({ caughtAt: -1 }); // Neueste Fänge zuerst

    res.json(allCatches);
  } catch (err: any) {
    console.error("Fehler bei GET /api/catches:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   2. GET all catches for a specific spot (/api/catches/spot/:spotId)
------------------------------------------------------------- */
router.get("/spot/:spotId", verifyToken, async (req: any, res) => {
  try {
    // Lädt nur Fänge, die zu diesem Spot gehören UND dem eingeloggten User gehören!
    const catches = await Catch.find({
      spotId: req.params.spotId,
      userId: req.user.id,
    }).sort({ caughtAt: -1 });

    res.json(catches);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   3. CREATE a new catch (/api/catches)
------------------------------------------------------------- */
router.post("/", verifyToken, async (req: any, res) => {
  try {
    const { spotId, species, weight, length, imageUrl, notes, caughtAt } =
      req.body;

    if (!spotId || !species) {
      return res
        .status(400)
        .json({ message: "Spot und Fischart sind Pflichtfelder" });
    }

    const newCatch = await Catch.create({
      userId: req.user.id, // Automatische Kontobindung
      spotId,
      species,
      weight: weight ? Number(weight) : undefined,
      length: length ? Number(length) : undefined,
      imageUrl,
      notes,
      caughtAt: caughtAt ? new Date(caughtAt) : new Date(),
    });

    res.status(201).json(newCatch);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
