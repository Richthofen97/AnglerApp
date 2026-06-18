import { useEffect, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { getSpots } from "../api/spots";
import { getAllCatches } from "../api/catches";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
};

type FishingAIProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function FishingAI({ isOpen, onClose }: FishingAIProps) {
  if (!isOpen) return null;

  // States für den KI-Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Petri Heil! Ich bin dein KI-Angel-Assistent. Frag mich zu deinen Spots, Fängen oder nach Taktiken!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // States für die echten Benutzerdaten aus der MongoDB
  const [userDataContext, setUserDataContext] = useState<any>({
    spots: [],
    catches: [],
  });

  // Lädt deine Fänge und Spots als Kontext für das KI-Modell, sobald der Chat geöffnet wird
  useEffect(() => {
    async function loadContext() {
      try {
        const [spots, catches] = await Promise.all([
          getSpots(),
          getAllCatches(),
        ]);
        setUserDataContext({ spots, catches });
      } catch (err) {
        console.error("Fehler beim Laden des KI-Kontexts:", err);
      }
    }
    loadContext();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const newUserMessage: ChatMessage = { sender: "user", text: userText };

    // 1. Erstelle die aktualisierte History manuell vorab für den API-Call
    const updatedHistory = [...messages, newUserMessage];

    // 2. State für das UI aktualisieren
    setMessages(updatedHistory);
    setInput("");
    setIsTyping(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // 3. Sende die korrekte, aktuelle History an das Backend
      const response = await fetch(`${apiUrl}/api/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          prompt: userText,
          history: updatedHistory, // Nutzt die sofort aktualisierte History
          context: userDataContext,
        }),
      });

      if (!response.ok) throw new Error("Server antwortet nicht");
      const data = await response.json();

      setMessages((prev) => [...prev, { sender: "ai", text: data.text }]);
    } catch (err) {
      console.error("KI-Fehler:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Schade, ich habe gerade Verbindungsprobleme zum Server. Versuche es gleich noch mal!",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={styles.chatOverlay}>
      <div style={styles.chatContainer}>
        {/* Chat Kopfbereich */}
        <div style={styles.chatHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                Angel-KI
              </h3>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Synchronisiert mit deinen Fängen
              </span>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} type="button">
            ✕
          </button>
        </div>

        {/* Chat Nachrichtenbereich */}
        <div style={styles.chatBody}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageBubble,
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                background:
                  msg.sender === "user"
                    ? "var(--accent-cyan)"
                    : "rgba(30, 41, 59, 0.7)",
                color: msg.sender === "user" ? "#000" : "#fff",
                border:
                  msg.sender === "user"
                    ? "none"
                    : "1px solid var(--border-color)",
              }}
            >
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div
              style={{
                ...styles.messageBubble,
                alignSelf: "flex-start",
                background: "rgba(30, 41, 59, 0.4)",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              KI überlegt...
            </div>
          )}
        </div>

        {/* Chat Eingabebereich */}
        <form onSubmit={handleSendMessage} style={styles.chatFooter}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frag mich was..."
            style={styles.chatInput}
          />
          <button type="submit" style={styles.sendBtn}>
            <Send size={16} color="#000" />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  chatOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(11, 19, 31, 0.8)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "16px",
    boxSizing: "border-box",
  },
  chatContainer: {
    background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "400px",
    height: "80vh",
    maxHeight: "600px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
  },
  chatHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(11, 19, 31, 0.4)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "18px",
    cursor: "pointer",
  },
  chatBody: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "13px",
    lineHeight: "1.4",
    boxSizing: "border-box",
    wordBreak: "break-word",
  },
  chatFooter: {
    padding: "12px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    gap: "8px",
    background: "rgba(11, 19, 31, 0.2)",
  },
  chatInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "12px",
    background: "var(--bg-dark)",
    border: "1px solid var(--border-color)",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  },
  sendBtn: {
    background: "var(--accent-cyan)",
    border: "none",
    borderRadius: "12px",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};
