import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, BookOpen, User } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

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
    <div style={styles.nav}>
      <div style={getTabStyle("/")} onClick={() => navigate("/")}>
        <Home size={22} style={{ marginBottom: "2.5px" }} />
        <span>Home</span>
      </div>

      <div
        style={getTabStyle("/gewaesser")}
        onClick={() => navigate("/gewaesser")}
      >
        <Map size={22} style={{ marginBottom: "2.5px" }} />
        <span>Karte</span>
      </div>

      <div style={getTabStyle("/faenge")} onClick={() => navigate("/faenge")}>
        <BookOpen size={22} style={{ marginBottom: "2.5px" }} />
        <span>Tagebuch</span>
      </div>

      <div style={getTabStyle("/profil")} onClick={() => navigate("/profil")}>
        <User size={22} style={{ marginBottom: "2.5px" }} />
        <span>Profil</span>
      </div>
    </div>
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
};
