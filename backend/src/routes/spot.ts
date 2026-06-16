import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose"; // IMPORT ERGÄNZT für die ID-Validierung
import Spot from "../models/Spot";
import Water from "../models/Water";

const router = express.Router();

/* -------------------------------------------------------------
   AUTH MIDDLEWARE (Sichert die Routen ab und liest die User-ID aus)
------------------------------------------------------------- */
const verifyToken = (
  req: any,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization;

  // REPARATUR: Holt über [1] den reinen Token-String nach dem Wort "Bearer" aus dem Array!
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Zugriff verweigert: Kein Token vorhanden" });
  }

  try {
    const secret = process.env.JWT_SECRET || "dein_standard_geheimnis";
    const verified = jwt.verify(token, secret) as any;
    req.user = verified;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Ungültiges oder abgelaufenes Token" });
  }
};

/* -------------------------------------------------------------
   1. GET all personal spots (NUR FÜR DEN EINGELOGGTEN USER)
------------------------------------------------------------- */
router.get("/", verifyToken, async (req: any, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Ungültige Benutzer-Sitzung" });
    }

    const spots = await Spot.find({ userId: req.user.id })
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
   2. CREATE new personal spot (ABSOLUT ID-SICHER & FIX)
------------------------------------------------------------- */
router.post("/", verifyToken, async (req: any, res) => {
  try {
    const {
      waterId,
      name,
      location,
      lat,
      lng,
      imageUrl,
      waterName,
      waterType,
    } = req.body;

    const isGenericId =
      waterId &&
      (waterId.startsWith("live-") ||
        waterId.startsWith("unbekannt") ||
        waterId.startsWith("osm-"));

    const finalWaterId =
      !waterId || waterId === "default" || waterId === "" || isGenericId
        ? null
        : waterId;

    if (finalWaterId) {
      try {
        // KORREKTUR: Wir prüfen, ob die ID formal eine echte MongoDB-ID ist
        const isValidObjectId = mongoose.Types.ObjectId.isValid(finalWaterId);

        // REPARATUR: Nur wenn es eine echte ObjectId ist, fragen wir die DB ab!
        // Das verhindert den unsichtbaren CastError-Absturz im Backend komplett.
        if (isValidObjectId) {
          const waterExists = await Water.findById(finalWaterId);

          if (!waterExists) {
            await Water.create({
              _id: finalWaterId,
              name: waterName || "Echtes Gewässer",
              waterType: waterType || "see",
              location: {
                type: "Point",
                coordinates: [Number(lng), Number(lat)],
              },
            });
            console.log(
              `Neues Live-Gewässer registriert: ${waterName} (${finalWaterId})`,
            );
          }
        } else {
          console.log(
            `Generische Gewässer-ID übersprungen (keine gültige ObjectId): ${finalWaterId}`,
          );
        }
      } catch (waterErr: any) {
        console.log(
          `Gewässer-Registrierung übersprungen oder abgefangen: ${waterErr.message}`,
        );
      }
    }

    // Erstellt den Spot absolut crash-sicher und verknüpft ihn mit deiner echten User-ID
    const newSpot = await Spot.create({
      userId: req.user.id,
      waterId: mongoose.Types.ObjectId.isValid(finalWaterId)
        ? finalWaterId
        : null,
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
router.patch("/:id/favorite", verifyToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;

    const updatedSpot = await Spot.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isFavorite },
      { new: true },
    ).populate({
      path: "waterId",
      strictPopulate: false,
    });

    if (!updatedSpot)
      return res
        .status(404)
        .json({ message: "Spot nicht gefunden oder Zugriff verweigert" });
    res.json(updatedSpot);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   4. PATCH update spot notes
------------------------------------------------------------- */
router.patch("/:id/notes", verifyToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const updatedSpot = await Spot.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { notes },
      { new: true },
    );

    if (!updatedSpot)
      return res
        .status(404)
        .json({ message: "Spot nicht gefunden oder Zugriff verweigert" });
    res.json(updatedSpot);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   5. DELETE spot permanent
------------------------------------------------------------- */
router.delete("/:id", verifyToken, async (req: any, res) => {
  try {
    const deletedSpot = await Spot.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!deletedSpot)
      return res
        .status(404)
        .json({ message: "Spot nicht gefunden oder Zugriff verweigert" });
    res.json({ message: "Spot erfolgreich gelöscht", id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
