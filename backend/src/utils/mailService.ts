import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Lädt die Variablen aus der .env-Datei (wichtig, damit SMTP_PASS nicht leer ist)
dotenv.config();

let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  // Nutzt die Gmail SMTP-Daten aus der .env-Datei
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "://gmail.com", // Tippfehler korrigiert
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // true für Port 465 (SSL)
    auth: {
      user: process.env.SMTP_USER || "angelappbynikolai@gmail.com",
      pass: process.env.SMTP_PASS, // Greift auf dein neues App-Passwort zu
    },
    tls: {
      // Verhindert, dass Node.js den Verbindungsaufbau lokal blockiert
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const client = await getTransporter();

    await client.sendMail({
      // Wichtig: 'from' muss mit deiner Gmail-Adresse übereinstimmen
      from: '"Angler App" <angelappbynikolai@gmail.com>',
      to: email,
      subject: "Dein Angler App Verifizierungscode",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #fff; border-radius: 10px;">
          <h2 style="color: #06b6d4;">Willkommen bei der Angler App! 🐟</h2>
          <p>Dein Registrierungscode lautet:</p>
          <div style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p>Dieser Code ist für die nächsten 15 Minuten gültig.</p>
        </div>
      `,
    });

    console.log(`✉️ Verifizierungscode erfolgreich an ${email} gesendet!`);
  } catch (error) {
    console.error("Fehler beim E-Mail-Versand:", error);
  }
}
