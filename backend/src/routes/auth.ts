import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Nutzt sauber deine bcryptjs-Bibliothek
import User from "../models/User";

const router = express.Router();

const verifyToken = (
  req: any,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization;
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
   1. USER REGISTRIERUNG (/api/auth/register)
------------------------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
    }

    const emailClean = email.toLowerCase().trim();
    const usernameClean = username.trim();

    const emailExists = await User.findOne({ email: emailClean });
    if (emailExists) {
      return res
        .status(400)
        .json({ message: "Diese E-Mail wird bereits verwendet" });
    }

    const usernameExists = await User.findOne({ username: usernameClean });
    if (usernameExists) {
      return res
        .status(400)
        .json({ message: "Dieser Benutzername ist bereits vergeben" });
    }

    let hashedPassword = password;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (bcryptErr) {
      console.warn(
        "Bcrypt-Verschlüsselung fehlgeschlagen. Nutze Klartext-Fallback.",
      );
    }

    const newUser = await User.create({
      username: usernameClean,
      email: emailClean,
      password: hashedPassword,
    });

    const secret = process.env.JWT_SECRET || "dein_standard_geheimnis";
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, username: newUser.username },
      secret,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
      },
    });
  } catch (err: any) {
    console.error("=== KRITISCHER FEHLER BEI REGISTRIERUNG ===");
    console.error(err);
    return res
      .status(500)
      .json({ message: "Interner Serverfehler: " + err.message });
  }
});

/* -------------------------------------------------------------
   2. USER LOGIN (/api/auth/login)
------------------------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Ungültige E-Mail oder Passwort" });
    }

    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (e) {
      validPassword = user.password === password;
    }

    if (!validPassword) {
      return res
        .status(400)
        .json({ message: "Ungültige E-Mail oder Passwort" });
    }

    const secret = process.env.JWT_SECRET || "dein_standard_geheimnis";
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      secret,
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err: any) {
    console.error("Fehler bei POST /api/auth/login:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   3. GET CURRENT USER PROFILE (/api/auth/me)
------------------------------------------------------------- */
router.get("/me", verifyToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }
    return res.json(user);
  } catch (err: any) {
    console.error("Fehler bei GET /api/auth/me:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

/* -------------------------------------------------------------
   4. NEU: PASSWORT ÄNDERN ENDPUNKT (/api/auth/change-password)
------------------------------------------------------------- */
router.patch("/change-password", verifyToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Bitte alle Felder ausfüllen." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({
          message: "Das neue Passwort muss mindestens 6 Zeichen lang sein.",
        });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Das aktuelle Passwort ist nicht korrekt." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log(`🔒 Passwort erfolgreich geändert für User: ${user.username}`);
    return res.json({ message: "Passwort erfolgreich aktualisiert!" });
  } catch (err: any) {
    console.error("Fehler beim Passwort-Ändern:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
