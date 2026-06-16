// Nutzt Ihren bestehenden fetchClient (falls vorhanden) oder natives fetch
export const fetchGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch("http://localhost:5000/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error("Netzwerkantwort war nicht ok");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Fehler beim Laden der KI-Antwort:", error);
    throw error;
  }
};
