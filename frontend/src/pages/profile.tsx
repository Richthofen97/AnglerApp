import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";
// Importiert die ausgelagerte Fischdatenbank
import { FISCH_LEXIKON, type FishInfo } from "./fishData";
import {
  User,
  LogOut,
  Search,
  BookOpen,
  Scale,
  ShieldAlert,
  Award,
  Lock, // IMPORT ERGÄNZT für das Passwort-Icon
} from "lucide-react";
import "../App.css";

type UserProfile = {
  username: string;
  email: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFish, setSelectedFish] = useState<FishInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Alle");

  // NEUE STATES FÜR DIE PASSWORT-ÄNDERUNG
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    getMe(token)
      .then((res) => {
        if (res.ok && res.data) setUser(res.data);
      })
      .catch((err) => console.error("Fehler beim Laden des Profils:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // LOGIK FÜR DIE PASSWORT-ÄNDERUNG (Integriertes Fetch analog zur App-Struktur)
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPwdMessage({ text: "Bitte alle Felder ausfüllen.", isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMessage({
        text: "Das neue Passwort muss mindestens 6 Zeichen lang sein.",
        isError: true,
      });
      return;
    }

    setPwdLoading(true);
    try {
      const token = localStorage.getItem("token") || "";

      // Nutzt dieselbe IP/Port-Basis deines Backends
      const response = await fetch("http://10.10.1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPwdMessage({
          text: "Passwort erfolgreich aktualisiert! ✅",
          isError: false,
        });
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPwdMessage({
          text: data.message || "Fehler beim Ändern des Passworts.",
          isError: true,
        });
      }
    } catch (err) {
      setPwdMessage({
        text: "Verbindung zum Server fehlgeschlagen.",
        isError: true,
      });
    } finally {
      setPwdLoading(false);
    }
  };

  // Filtert live nach Suchbegriff UND ausgewählter Kategorie
  const filteredLexikon = FISCH_LEXIKON.filter((fish) => {
    const matchesSearch = fish.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "Alle" || fish.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "Alle",
    "Raubfisch",
    "Friedfisch",
    "Salmonide",
    "Meeresfisch",
  ];

  return (
    <div
      className="dashboard-container"
      style={{ paddingBottom: "80px", paddingInline: "16px" }}
    >
      {/* 1. COMPACT PROFIL REGION */}
      <h2
        style={{
          color: "#fff",
          fontSize: "22px",
          margin: "16px 0 12px 0",
          fontWeight: "bold",
        }}
      >
        👤 Mein Profil
      </h2>

      {user && (
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--bg-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-color)",
              }}
            >
              <User size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                {user.username}
              </h3>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {user.email}
              </p>
            </div>
          </div>

          {/* BUTTON-GRUPPE: Ändern links neben Abmelden platziert */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                setPwdMessage(null);
                setShowPasswordModal(true);
              }}
              style={{
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                color: "var(--accent-cyan)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              <Lock size={14} /> Ändern
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#ef4444",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              <LogOut size={14} /> Abmelden
            </button>
          </div>
        </div>
      )}

      {/* MODAL / POPUP OVERLAY FÜR DIE PASSWORT-ÄNDERUNG */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            <h3
              style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "18px" }}
            >
              🔒 Passwort ändern
            </h3>

            <form
              onSubmit={handleChangePasswordSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Aktuelles Passwort
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Dein altes Passwort"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "#0b131f",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Neues Passwort
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "#0b131f",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                />
              </div>

              {pwdMessage && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "13px",
                    color: pwdMessage.isError
                      ? "var(--accent-orange)"
                      : "#22c55e",
                  }}
                >
                  {pwdMessage.text}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--accent-cyan)",
                    color: "#0f172a",
                    cursor: pwdLoading ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    opacity: pwdLoading ? 0.7 : 1,
                  }}
                >
                  {pwdLoading ? "Prüfen..." : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SCHONZEITEN & FISCH-LEXIKON REGION */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <BookOpen size={18} color="var(--accent-cyan)" />
        <h2
          style={{
            color: "#fff",
            fontSize: "18px",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          Deutsches Fischlexikon
        </h2>
      </div>

      {/* Suchleiste */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <Search
          size={16}
          color="var(--text-muted)"
          style={{ position: "absolute", top: "12px", left: "12px" }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Fischart suchen..."
          style={{
            width: "100%",
            padding: "10px 10px 10px 36px",
            borderRadius: "12px",
            background: "var(--bg-dark)",
            border: "1px solid var(--border-color)",
            color: "#fff",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* KATEGORIE FILTER-TABS */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "16px",
          scrollbarWidth: "none",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background:
                activeCategory === cat
                  ? "var(--accent-cyan)"
                  : "rgba(30, 41, 59, 0.5)",
              border: "1px solid var(--border-color)",
              color: activeCategory === cat ? "#000" : "var(--text-muted)",
              borderRadius: "20px",
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: "bold",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Kachelliste der Fische */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
        {filteredLexikon.map((fish, index) => (
          <div
            key={index}
            onClick={() => setSelectedFish(fish)}
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={fish.image}
                alt={fish.name}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://unsplash.com";
                }}
              />
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {fish.name}
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginTop: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {fish.category}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Maß: {fish.minLength}
                  </p>
                </div>
              </div>
            </div>
            <span
              style={{
                color: "var(--accent-cyan)",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              Details →
            </span>
          </div>
        ))}
        {filteredLexikon.length === 0 && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            Kein Fisch unter dieser Auswahl gefunden.
          </p>
        )}
      </div>
      {/* ==========================================================================
         OVERLAY MODAL: DIE DETAILLIERTE LEXIKONKARTE BEIM ANKLICKEN
         ========================================================================== */}
      {selectedFish && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(11, 19, 31, 0.9)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
              border: "1px solid var(--border-color)",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "380px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
            }}
          >
            {/* Großes Fischbild oben im Pop-up */}
            <div
              style={{
                position: "relative",
                height: "180px",
                background: "var(--bg-dark)",
              }}
            >
              <img
                src={selectedFish.image}
                alt={selectedFish.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => setSelectedFish(null)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(11, 19, 31, 0.7)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {selectedFish.name}
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "var(--bg-dark)",
                    color: "var(--accent-cyan)",
                    border: "1px solid var(--border-color)",
                    marginTop: "4px",
                    display: "inline-block",
                  }}
                >
                  {selectedFish.category}
                </span>
              </div>

              {/* Mindestmaß & Schonzeit Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "rgba(11, 19, 31, 0.4)",
                    border: "1px solid var(--border-color)",
                    padding: "10px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Scale size={16} color="var(--accent-cyan)" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "block",
                      }}
                    >
                      Mindestmaß
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedFish.minLength}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(11, 19, 31, 0.4)",
                    border: "1px solid var(--border-color)",
                    padding: "10px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ShieldAlert size={16} color="var(--accent-orange)" />
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "block",
                      }}
                    >
                      Schonzeit
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedFish.closedSeason}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beste Köder */}
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                  }}
                >
                  <Award size={13} color="var(--accent-cyan)" /> Beste Köder
                </span>
                <p style={{ margin: 0, fontSize: "13px", color: "#fff" }}>
                  {selectedFish.bestBaits}
                </p>
              </div>

              {/* Angeltaktik */}
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                  }}
                >
                  <BookOpen size={13} color="var(--accent-cyan)" /> Angeltaktik
                  & Tipps
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.85)",
                    fontStyle: "italic",
                  }}
                >
                  "{selectedFish.tips}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
