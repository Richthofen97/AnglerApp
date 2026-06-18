import { GoogleGenAI } from "@google/genai";

// Definition der Typen, die vom Frontend gesendet werden
interface ChatHistoryMessage {
  sender: "user" | "ai";
  text: string;
}

interface FishingContext {
  spots: any[];
  catches: any[];
}

export const generateText = async (
  prompt: string,
  history: ChatHistoryMessage[] = [],
  context: FishingContext = { spots: [], catches: [] },
): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Sicherheitsprüfung für die Produktionsumgebung auf Render
    if (!apiKey) {
      console.error(
        "Kritischer Fehler: GEMINI_API_KEY ist in den Umgebungsvariablen nicht definiert!",
      );
      throw new Error("API-Konfigurationsfehler auf dem Server.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Fallbacks einbauen, falls Datenstrukturen unvollständig aus der DB kommen
    const safeSpots = context?.spots || [];
    const safeCatches = context?.catches || [];

    // 1. System-Instruction für die Persönlichkeit und die MongoDB-Daten bauen
    const systemInstruction = `
      Du bist ein professioneller KI-Angel-Assistent für eine spezialisierte Angler-App.
      Deine Antworten sind präzise, hilfreich und nutzen Fachbegriffe aus dem Angelsport (z.B. Montagen, Köderführung, Wetterbedingungen).
      
      Du hast Zugriff auf die echten Profildaten des Anglers aus der Datenbank:
      - REGISTRIERTE SPOTS: ${JSON.stringify(safeSpots)}
      - BISHERIGE FÄNGE: ${JSON.stringify(safeCatches)}
      
      Nutze diese Daten aktiv! Wenn der Nutzer nach seinen Gewässern, gefangenen Fischen oder Taktiken fragt, analysiere diese Listen und antworte bezogen auf seine echten Einträge.
    `;

    // 2. Den bisherigen Chatverlauf für das SDK in das richtige Format mappen
    // Verhindert Abstürze durch Überprüfung auf valide Textinhalte
    const formattedContents = history
      .filter((msg) => msg && msg.text && msg.text.trim() !== "")
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    // Die aktuelle Nachricht des Nutzers an das Ende des Verlaufs anhängen
    formattedContents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    // 3. API-Aufruf mit Verlauf und System-Anweisung ausführen
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Keine Antwort erhalten.";
  } catch (error: any) {
    console.error("Gemini API Fehler im Service:", error);
    // Detailierte Fehlermeldung für die Render-Logs beibehalten
    throw new Error(
      `Fehler bei der Kommunikation mit der KI-API: ${error.message || error}`,
    );
  }
};
