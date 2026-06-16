import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, BookOpen, User, MessageSquareCode } from "lucide-react";
// NEW: Importiert die ausgelagerte KI-Komponente
import FishingAI from "./FishingAi";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // NEW: State steuert, ob das ausgelagerte KI-Fenster aufploppt
  const [isAiOpen, setIsAiOpen] = useState(false);

  const getTabStyle = (path: string) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    cursor: "pointer",
    transition: "color 0.2s ease",
    color:
      location.pathname === path ? "var(--accent-cyan)" : "var(--text-muted)",
  });
  return (
    <>
      <div style={styles.nav}>
        {/* TAB 1: Home */}
        <div style={getTabStyle("/")} onClick={() => navigate("/")}>
          <Home size={22} style={{ marginBottom: "2.5px" }} />
          <span>Home</span>
        </div>

        {/* TAB 2: Karte */}
        <div
          style={getTabStyle("/gewaesser")}
          onClick={() => navigate("/gewaesser")}
        >
          <Map size={22} style={{ marginBottom: "2.5px" }} />
          <span>Karte</span>
        </div>

        {/* TAB 3: HERAUSSTEHENDER KI-BUTTON (Genau im Zentrum) */}
        <div style={styles.centerTabContainer}>
          <button
            type="button"
            onClick={() => setIsAiOpen(true)} // Öffnet die ausgelagerte FishingAI Komponente
            style={styles.aiButton}
          >
            <MessageSquareCode size={26} color="#000" />
          </button>
          <span
            style={{
              fontSize: "11px",
              color: "var(--accent-cyan)",
              fontWeight: "bold",
              marginTop: "4px",
            }}
          >
            Angel-KI
          </span>
        </div>

        {/* TAB 4: Tagebuch */}
        <div style={getTabStyle("/faenge")} onClick={() => navigate("/faenge")}>
          <BookOpen size={22} style={{ marginBottom: "2.5px" }} />
          <span>Tagebuch</span>
        </div>

        {/* TAB 5: Profil */}
        <div style={getTabStyle("/profil")} onClick={() => navigate("/profil")}>
          <User size={22} style={{ marginBottom: "2.5px" }} />
          <span>Profil</span>
        </div>
      </div>

      {/* RENDER DER SEPARATEN KI-KOMPONENTE */}
      <FishingAI isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    display: "flex",
    backgroundColor: "var(--bg-card)",
    borderTop: "1px solid var(--border-color)",
    zIndex: 9999,
  },
  centerTabContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    bottom: 12, // Schiebt das Konstrukt über die obere Kante hinaus
    height: "77px",
  },
  aiButton: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "var(--accent-cyan)",
    border: "4px solid var(--bg-dark)", // Der dunkle Ring trennt den Button scharf ab
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow:
      "0 -3px 10px rgba(34, 211, 238, 0.3), 0 4px 10px rgba(0,0,0,0.5)",
    outline: "none",
  },
};
