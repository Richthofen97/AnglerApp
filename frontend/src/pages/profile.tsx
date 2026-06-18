// TEIL 1 VON 3: IMPORTS UND STATES
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../api/auth";
import { getAllCatches } from "../api/catches"; // Importiert die Fänge aus dem Tagebuch
import { FISCH_LEXIKON } from "./fishData"; // Passe den Pfad bei Bedarf an
import { User, LogOut, Lock, Fish } from "lucide-react";
import "../App.css";

type UserProfile = {
  username: string;
  email: string;
};

type GlobalCatch = {
  _id: string;
  species: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [catches, setCatches] = useState<GlobalCatch[]>([]);
  const [loading, setLoading] = useState(true);

  // STATES FÜR DIE PASSWORT-ÄNDERUNG
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  // TEIL 2 VON 3: LOGIK, USEEFFECT UND SUBMIT-FUNKTIONEN
  // Lädt Benutzerdaten und Fänge parallel
  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    async function loadProfileData() {
      try {
        const [userRes, catchesData] = await Promise.all([
          getMe(token),
          getAllCatches(),
        ]);

        if (userRes.ok && userRes.data) {
          setUser(userRes.data);
        }
        if (catchesData) {
          setCatches(catchesData);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Profildaten:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Hilfsfunktion: Zählt, wie oft eine bestimmte Fischart gefangen wurde
  const getCatchCount = (fishName: string) => {
    return catches.filter(
      (c) => c.species.toLowerCase() === fishName.toLowerCase(),
    ).length;
  };

  // LOGIK FÜR DIE PASSWORT-ÄNDERUNG
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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiUrl}/api/auth/change-password`, {
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

  // TEIL 3.1 VON 3: PROFIL-LAYOUT UND SORTIERTE FANGSTATISTIK
  if (loading) {
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Lade Profil...
      </div>
    );
  }

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

          {/* BUTTON-GRUPPE */}
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

      {/* 2. DYNAMISCHE FANGSTATISTIK */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <Fish size={20} color="var(--accent-cyan)" />
        <h3
          style={{
            color: "#fff",
            fontSize: "18px",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          📊 Meine Fangstatistik
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        {/* Sortiert das Lexikon live nach der Anzahl der Fänge (absteigend) */}
        {[...FISCH_LEXIKON]
          .sort((a, b) => getCatchCount(b.name) - getCatchCount(a.name))
          .map((fish, index) => {
            const count = getCatchCount(fish.name);
            return (
              <div
                key={index}
                style={{
                  background: "rgba(30, 41, 59, 0.4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <img
                    src={fish.image}
                    alt={fish.name}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://unsplash.com";
                    }}
                  />
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {fish.name}
                    </h4>
                    <span
                      style={{ fontSize: "10px", color: "var(--text-muted)" }}
                    >
                      {fish.category}
                    </span>
                  </div>
                </div>

                {/* Zähler für die Fänge */}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background:
                      count > 0
                        ? "rgba(6, 182, 212, 0.2)"
                        : "rgba(255,255,255,0.05)",
                    color:
                      count > 0 ? "var(--accent-cyan)" : "var(--text-muted)",
                    border:
                      count > 0
                        ? "1px solid rgba(6, 182, 212, 0.3)"
                        : "1px solid transparent",
                  }}
                >
                  {count} x gefangen
                </span>
              </div>
            );
          })}
      </div>

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
    </div>
  );
}
