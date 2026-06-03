import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

console.log("AUTH ROUTES GELADEN");

/**
 * REGISTER USER
 */
router.post("/register", async (req: Request, res: Response) => {
  console.log("REGISTER HIT");

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Alle Felder sind Pflicht" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User existiert bereits" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User erstellt",
      userId: newUser._id,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Server Fehler",
      error: err.message,
    });
  }
});

/**
 * LOGIN USER
 */
router.post("/login", async (req: Request, res: Response) => {
  console.log("LOGIN HIT");

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Alle Felder sind Pflicht" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User nicht gefunden" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Falsches Passwort" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login erfolgreich",
      token,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Server Fehler",
      error: err.message,
    });
  }
});

/**
 * GET CURRENT USER (PROTECTED)
 */
router.get("/me", verifyToken, async (req: any, res: Response) => {
  console.log("ME HIT");

  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User nicht gefunden" });
    }

    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({
      message: "Server Fehler",
      error: err.message,
    });
  }
});

export default router;
