import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Map,
  BookOpen,
  User,
  MessageSquareCode,
  Users, // Icon für Community
  BookMarked, // Icon für Lexikon
} from "lucide-react";
import FishingAI from "./FishingAi";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // State für das KI-Fenster
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Style für die normalen Tabs mit Text
  const getTabStyle = (path: string) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px", // Etwas kleiner für 7 Tabs nebeneinander
    cursor: "pointer",
    transition: "color 0.2s ease",
    height: "100%",
    color:
      location.pathname === path ? "var(--accent-cyan)" : "var(--text-muted)",
  });

  return (
    <>
      {/* Wrapper zentriert die Leiste am PC analog zum Content-Bereich */}
      <div style={styles.navWrapper}>
        <div style={styles.nav}>
          {/* TAB 1: Home */}
          <div style={getTabStyle("/")} onClick={() => navigate("/")}>
            <Home size={20} style={{ marginBottom: "2px" }} />
            <span>Home</span>
          </div>

          {/* TAB 2: Karte */}
          <div
            style={getTabStyle("/gewaesser")}
            onClick={() => navigate("/gewaesser")}
          >
            <Map size={20} style={{ marginBottom: "2px" }} />
            <span>Karte</span>
          </div>

          {/* TAB 3: Community */}
          <div
            style={getTabStyle("/community")}
            onClick={() => navigate("/community")}
          >
            <Users size={20} style={{ marginBottom: "2px" }} />
            <span>Community</span>
          </div>

          {/* TAB 4: ZENTRALER KI-BUTTON */}
          <div style={styles.centerTabContainer}>
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              style={styles.aiButton}
            >
              <MessageSquareCode size={28} color="#000" />
            </button>
            <span style={styles.aiLabel}>Angel-KI</span>
          </div>

          {/* TAB 5: Lexikon */}
          <div
            style={getTabStyle("/lexikon")}
            onClick={() => navigate("/lexikon")}
          >
            <BookMarked size={20} style={{ marginBottom: "2px" }} />
            <span>Lexikon</span>
          </div>

          {/* TAB 6: Tagebuch */}
          <div
            style={getTabStyle("/faenge")}
            onClick={() => navigate("/faenge")}
          >
            <BookOpen size={20} style={{ marginBottom: "2px" }} />
            <span>Tagebuch</span>
          </div>

          {/* TAB 7: Profil */}
          <div
            style={getTabStyle("/profil")}
            onClick={() => navigate("/profil")}
          >
            <User size={20} style={{ marginBottom: "2px" }} />
            <span>Profil</span>
          </div>
        </div>
      </div>

      {/* RENDER DER SEPARATEN KI-KOMPONENTE */}
      <FishingAI isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // Der Wrapper sorgt dafür, dass die Bar am PC nicht über den Bildschirm hinausgeht
  navWrapper: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 9999,
    pointerEvents: "none", // Erlaubt Klicks außerhalb der eigentlichen Leiste
  },
  nav: {
    width: "100%",
    maxWidth: "var(--content-max-width, 1200px)", // Nutzt deine App-Breite (Fallback: 1200px)
    height: 68, // Leicht erhöht, damit Text und der große Button gut Platz haben
    display: "flex",
    alignItems: "center",
    backgroundColor: "var(--bg-card)",
    borderTop: "1px solid var(--border-color)",
    padding: "0 8px",
    boxSizing: "border-box",
    pointerEvents: "auto", // Reaktiviert die Klicks für die Buttons
    // Falls deine App am PC abgerundet ist, kannst du hier optionale optische Anpassungen aktivieren:
    // borderTopLeftRadius: '16px',
    // borderTopRightRadius: '16px',
  },
  centerTabContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
    height: "100%",
    paddingBottom: "6px", // Setzt die Beschriftung bündig nach unten
    boxSizing: "border-box",
  },
  aiButton: {
    position: "absolute",
    top: "-18px", // Schiebt den vergrößerten Button perfekt nach oben raus
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "var(--accent-cyan)",
    border: "4px solid var(--bg-dark)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow:
      "0 -3px 12px rgba(34, 211, 238, 0.4), 0 4px 10px rgba(0,0,0,0.5)",
    outline: "none",
  },
  aiLabel: {
    fontSize: "10px",
    color: "var(--accent-cyan)",
    fontWeight: "bold",
  },
};
