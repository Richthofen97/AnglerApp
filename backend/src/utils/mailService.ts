import { Resend } from "resend";
import dotenv from "dotenv";

// Lädt die Umgebungsvariablen aus der .env-Datei
dotenv.config();

// Initialisiert Resend mit dem API-Key aus den Umgebungsvariablen
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      // Wichtig: Im kostenlosen Testmodus von Resend muss hier 'onboarding@resend.dev' stehen
      from: "Angler App <onboarding@resend.dev>",
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

    if (error) {
      console.error("Fehler beim E-Mail-Versand via Resend:", error);
      return;
    }

    console.log(
      `✉️ Verifizierungscode erfolgreich via Resend an ${email} gesendet! ID: ${data?.id}`,
    );
  } catch (error) {
    console.error("Unerwarteter Fehler beim E-Mail-Versand:", error);
  }
}
