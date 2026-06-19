import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // Nutzt sauber deine bcryptjs-Bibliothek
import User from "../models/User";
import { sendVerificationEmail } from "../utils/mailService"; // NEU: Mail-Service importiert

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
   1. USER REGISTRIERUNG MIT E-MAIL-VALIDIERUNG & OTP (/api/auth/register)
------------------------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
    }
    const emailClean = email.toLowerCase().trim();
    const usernameClean = username.trim();

    // 1. 🔒 E-MAIL-PRÜFUNG (Option A)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(emailClean)) {
      return res.status(400).json({
        message: "Bitte eine echte E-Mail-Adresse (z.B. .de, .com) angeben.",
      });
    }

    // 2. 🔒 EINZELNE PASSWORT-CHECKS (Gibt dem User exakte Rückmeldung)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Das Passwort muss mindestens 8 Zeichen lang sein." });
    }

    // Prüft auf mindestens einen Großbuchstaben
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message: "Das Passwort muss mindestens einen Großbuchstaben enthalten.",
      });
    }

    // Prüft auf mindestens eine Zahl
    if (!/\d/.test(password)) {
      return res
        .status(400)
        .json({ message: "Das Passwort muss mindestens eine Zahl enthalten." });
    }

    // Prüft auf mindestens ein Sonderzeichen (z. B. !, @, #, $, %, etc.)
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        message: "Das Passwort muss mindestens ein Sonderzeichen enthalten.",
      });
    }

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🎲 Generiere einen 6-stelligen OTP Code als String
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten gültig

    // User wird als unverifiziert (isVerified: false) angelegt
    await User.create({
      username: usernameClean,
      email: emailClean,
      password: hashedPassword,
      isVerified: false,
      verificationCode: code,
      verificationCodeExpires: expires,
    });

    // Code asynchron per Mail senden (blockiert den Response nicht)
    sendVerificationEmail(emailClean, code);

    // Wir senden hier bewusst KEIN Token mit, da der User sich erst verifizieren muss!
    return res.status(201).json({
      message:
        "Registrierung erfolgreich. Bitte prüfe dein E-Mail-Postfach nach dem Bestätigungscode.",
      email: emailClean,
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
   2. USER LOGIN MIT ISVERIFIED-CHECK (/api/auth/login)
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

    // 🔒 NEU: Verhindert den Login, wenn die E-Mail noch nicht bestätigt wurde
    if (!user.isVerified) {
      return res.status(401).json({
        message:
          "Dein Account ist noch nicht verifiziert. Bitte bestätige zuerst deine E-Mail.",
        isVerified: false, // Wichtig fürs Frontend, um das Code-Eingabefeld einzublenden
        email: user.email,
      });
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
   2b. NEU: CODE VERIFIZIEREN ENDPUNKT (/api/auth/verify-code)
------------------------------------------------------------- */
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "E-Mail und Code sind Pflichtfelder." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "Dieser Account ist bereits verifiziert." });
    }

    // Prüfen, ob der Code übereinstimmt
    if (user.verificationCode !== code.trim()) {
      return res
        .status(400)
        .json({ message: "Ungültiger Verifizierungscode." });
    }

    // Prüfen, ob der Code bereits abgelaufen ist (15 Min Limit)
    if (
      user.verificationCodeExpires &&
      new Date() > user.verificationCodeExpires
    ) {
      return res.status(400).json({
        message: "Der Code ist abgelaufen. Bitte registriere dich erneut.",
      });
    }

    // Account freischalten und temporäre Code-Felder leeren
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Login-Token ausstellen, da die Verifizierung erfolgreich war
    const secret = process.env.JWT_SECRET || "dein_standard_geheimnis";
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      secret,
      { expiresIn: "7d" },
    );

    return res.json({
      message: "E-Mail erfolgreich verifiziert! 🎉",
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Interner Serverfehler: " + err.message });
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
   4. PASSWORT ÄNDERN ENDPUNKT (/api/auth/change-password)
------------------------------------------------------------- */
router.patch("/change-password", verifyToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Bitte alle Felder ausfüllen." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
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
