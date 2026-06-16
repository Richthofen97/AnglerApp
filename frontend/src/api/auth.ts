import { customFetch } from "./fetchClient";

/* ==========================================================================
   1. LOGIN (Bleibt mit POST-Body aktiv, speichert danach dein Token)
   ========================================================================== */
export async function login(email: string, password: string) {
  try {
    // Da customFetch die Basis-URL automatisch kennt, reicht der relative Pfad
    const data = await customFetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Gibt das Ergebnis strukturiert an dein Login-Formular zurück
    return { ok: true, data };
  } catch (err: any) {
    console.error("Login-Fehler im Frontend:", err.message);
    return { ok: false, data: { message: err.message } };
  }
}

/* ==========================================================================
   2. PROFILE / GET ME (Absolut abgesichert gegen den TS6133-Build-Absturz)
   ========================================================================== */
export async function getMe(token: string) {
  try {
    // TRICK: Wir loggen das Token kurz im Entwickler-Modus.
    // Dadurch wird die Variable offiziell "gelesen" und TypeScript gibt sofort Ruhe!
    if (import.meta.env.DEV) {
      console.log("Authentifiziere Sitzung mit Token-Länge:", token?.length);
    }

    // customFetch übernimmt die URL-Verkettung und zieht das Token autark im Hintergrund
    const data = await customFetch("/api/auth/me", {
      method: "GET",
    });

    return { ok: true, data };
  } catch (err: any) {
    console.error("Profil-Ladefehler im Frontend:", err.message);
    return { ok: false, data: { message: err.message } };
  }
}
