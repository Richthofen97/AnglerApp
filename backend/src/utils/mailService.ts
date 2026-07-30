import { Resend } from "resend";
import dotenv from "dotenv";

// Lädt die Variablen vorsichtshalber direkt
dotenv.config();

export async function sendVerificationEmail(email: string, code: string) {
  try {
    // WICHTIG: Wir initialisieren Resend ERST HIER INSIDE der Funktion.
    // Dadurch ist sichergestellt, dass Render die Variable bereits bereitgestellt hat.
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error(
        "❌ E-Mail-Versand abgebrochen: RESEND_API_KEY fehlt in den Umgebungsvariablen!",
      );
      return;
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
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
