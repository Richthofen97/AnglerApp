import { BrevoClient } from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error(
        "❌ E-Mail-Versand abgebrochen: BREVO_API_KEY fehlt in den Umgebungsvariablen!",
      );
      return;
    }

    // Initialisiert den neuen Brevo-Client (v6 Standard)
    const brevo = new BrevoClient({ apiKey });

    // Sendet die transaktionale E-Mail direkt über die HTTPS-Schnittstelle
    await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "Angler App",
        email: "angelappbynikolai@gmail.com", // Deine registrierte Gmail-Adresse
      },
      to: [{ email: email }],
      subject: "Dein Angler App Verifizierungscode",
      htmlContent: `
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

    console.log(
      `✉️ Verifizierungscode erfolgreich via Brevo an ${email} gesendet!`,
    );
  } catch (error) {
    console.error("Fehler beim E-Mail-Versand via Brevo API:", error);
  }
}
