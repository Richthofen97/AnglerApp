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

    const allCatches = await Catch.find({ userId: req.user.id })
      .populate({
        path: "spotId",
        select: "name location imageUrl",
        strictPopulate: false,
      })
      .sort({ caughtAt: -1 });

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
    const {
      spotId,
      species,
      weight,
      length,
      imageUrl,
      notes,
      caughtAt,
      isPublic,
    } = req.body;

    if (!spotId || !species) {
      return res
        .status(400)
        .json({ message: "Spot und Fischart sind Pflichtfelder" });
    }

    const newCatch = await Catch.create({
      userId: req.user.id,
      spotId,
      species,
      weight: weight ? Number(weight) : undefined,
      length: length ? Number(length) : undefined,
      imageUrl,
      notes,
      caughtAt: caughtAt ? new Date(caughtAt) : new Date(),
      isPublic: isPublic !== undefined ? Boolean(isPublic) : false,
    });

    res.status(201).json(newCatch);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   4. PATCH update visibility of a specific catch (/api/catches/:id/visibility)
------------------------------------------------------------- */
router.patch("/:id/visibility", verifyToken, async (req: any, res) => {
  try {
    const { isPublic } = req.body;

    if (isPublic === undefined) {
      return res
        .status(400)
        .json({ message: "Sichtbarkeitsstatus (isPublic) fehlt im Request" });
    }

    const updatedCatch = await Catch.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isPublic: Boolean(isPublic) },
      { new: true },
    );

    if (!updatedCatch) {
      return res.status(404).json({
        message: "Fang nicht gefunden oder keine Berechtigung zur Bearbeitung.",
      });
    }

    res.json(updatedCatch);
  } catch (err: any) {
    console.error("Fehler bei PATCH /api/catches/:id/visibility:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   5. DELETE a specific catch (/api/catches/:id)
------------------------------------------------------------- */
router.delete("/:id", verifyToken, async (req: any, res) => {
  try {
    console.log(
      `🗑️ LÖSCH-ANFRAGE FÜR FANG-ID: ${req.params.id} VON USER: ${req.user.id}`,
    );

    const deletedCatch = await Catch.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedCatch) {
      return res.status(404).json({
        message: "Fang nicht gefunden oder keine Berechtigung zum Löschen.",
      });
    }

    res.json({ message: "Fang erfolgreich gelöscht! ✅" });
  } catch (err: any) {
    console.error("Fehler bei DELETE /api/catches/:id:", err.message);
    res.status(500).json({ message: err.message });
  }
});
/* -------------------------------------------------------------
   6. GET all public catches for the social feed (/api/catches/community)
------------------------------------------------------------- */
router.get("/community", verifyToken, async (req: any, res) => {
  try {
    console.log("🌐 LADE ÖFFENTLICHEN COMMUNITY-FEED");

    const communityCatches = await Catch.find({ isPublic: true })
      .populate({
        path: "userId",
        select: "username",
        strictPopulate: false,
      })
      .populate({
        path: "spotId",
        select: "name location",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    res.json(communityCatches);
  } catch (err: any) {
    console.error("Fehler bei GET /api/catches/community:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   7. POST toggle like on a catch (/api/catches/:id/like)
------------------------------------------------------------- */
router.post("/:id/like", verifyToken, async (req: any, res) => {
  try {
    const catchItem = await Catch.findById(req.params.id);
    if (!catchItem)
      return res.status(404).json({ message: "Fang nicht gefunden" });

    const userId = req.user.id;
    const hasLiked = catchItem.likes.includes(userId);
    const hasDisliked = catchItem.dislikes.includes(userId);

    if (hasLiked) {
      catchItem.likes = catchItem.likes.filter(
        (id: any) => id.toString() !== userId.toString(),
      );
    } else {
      catchItem.likes.push(userId);
      if (hasDisliked) {
        catchItem.dislikes = catchItem.dislikes.filter(
          (id: any) => id.toString() !== userId.toString(),
        );
      }
    }

    await catchItem.save();
    res.json(catchItem);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   8. POST toggle dislike on a catch (/api/catches/:id/dislike)
------------------------------------------------------------- */
router.post("/:id/dislike", verifyToken, async (req: any, res) => {
  try {
    const catchItem = await Catch.findById(req.params.id);
    if (!catchItem)
      return res.status(404).json({ message: "Fang nicht gefunden" });

    const userId = req.user.id;
    const hasLiked = catchItem.likes.includes(userId);
    const hasDisliked = catchItem.dislikes.includes(userId);

    if (hasDisliked) {
      catchItem.dislikes = catchItem.dislikes.filter(
        (id: any) => id.toString() !== userId.toString(),
      );
    } else {
      catchItem.dislikes.push(userId);
      if (hasLiked) {
        catchItem.likes = catchItem.likes.filter(
          (id: any) => id.toString() !== userId.toString(),
        );
      }
    }

    await catchItem.save();
    res.json(catchItem);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   9. POST add a comment to a catch (/api/catches/:id/comment)
------------------------------------------------------------- */
router.post("/:id/comment", verifyToken, async (req: any, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "Kommentartext darf nicht leer sein" });
    }

    const catchItem = await Catch.findById(req.params.id);
    if (!catchItem)
      return res.status(404).json({ message: "Fang nicht gefunden" });

    const newComment = {
      userId: req.user.id,
      userName: req.user.username || "Angler",
      text: text.trim(),
      createdAt: new Date(),
    };

    catchItem.comments.push(newComment);
    await catchItem.save();

    res.status(201).json(catchItem);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
/* -------------------------------------------------------------
   10. DELETE a comment from a catch (/api/catches/:id/comment/:commentId)
------------------------------------------------------------- */
router.delete("/:id/comment/:commentId", verifyToken, async (req: any, res) => {
  try {
    const catchItem = await Catch.findById(req.params.id);
    if (!catchItem)
      return res.status(404).json({ message: "Fang nicht gefunden" });

    // Findet den Kommentar im Array
    const comment = catchItem.comments.id(req.params.commentId);
    if (!comment)
      return res.status(404).json({ message: "Kommentar nicht gefunden" });

    // Sicherheits-Check: Nur der Verfasser des Kommentars darf ihn löschen
    if (comment.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Keine Berechtigung zum Löschen dieses Kommentars." });
    }

    // Entfernt den Kommentar aus dem Array
    catchItem.comments.pull(req.params.commentId);
    await catchItem.save();

    res.json(catchItem);
  } catch (err: any) {
    console.error(
      "Fehler bei DELETE /api/catches/:id/comment/:commentId:",
      err.message,
    );
    res.status(500).json({ message: err.message });
  }
});

// DER WICHTIGE EXPORT FÜR DEINE SERVER.TS
export default router;
