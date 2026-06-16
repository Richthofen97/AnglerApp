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
   2. PROFILE / GET ME (Absolut abgesichert via customFetch)
   ========================================================================== */
export async function getMe(token: string) {
  try {
    // KORREKTUR: customFetch übernimmt die URL-Verkettung und zieht das Token im Hintergrund.
    // Das token-Argument wird hier ignoriert, damit Altsysteme in App.tsx nicht crashen.
    const data = await customFetch("/api/auth/me", {
      method: "GET",
    });

    return { ok: true, data };
  } catch (err: any) {
    console.error("Profil-Ladefehler im Frontend:", err.message);
    return { ok: false, data: { message: err.message } };
  }
}
