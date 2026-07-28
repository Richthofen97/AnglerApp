import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Lädt die Variablen aus der .env-Datei (wichtig, damit SMTP_PASS nicht leer ist)
dotenv.config();

let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  // Optimiert für den E-Mail-Versand von Render-Servern aus
  transporter = nodemailer.createTransport({
    host: "://gmail.com",
    port: 587, // Port auf 587 ändern (STARTTLS)
    secure: false, // MUSS false sein bei Port 587, da die Verbindung unverschlüsselt startet
    auth: {
      user: process.env.SMTP_USER || "angelappbynikolai@gmail.com",
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // Erzwingt, dass Node nicht wegen lokaler Zertifikate oder IPv6-Handshakes abbricht
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
