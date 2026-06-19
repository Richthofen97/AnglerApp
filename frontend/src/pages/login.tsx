import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  onLoginSuccess: () => void;
};

const API = import.meta.env.VITE_API_URL;

export default function Login({ onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);

  // NEU: Steuert, ob der User gerade den 6-stelligen OTP-Code eingeben muss
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const mountRef = useRef<HTMLDivElement | null>(null);

  // ==========================================================================
  // 3D HIGH-TECH PARTIKEL-GLOBUS (Three.js) - Unverändert!
  // ==========================================================================
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.domElement.style.width = "100vw";
    renderer.domElement.style.height = "100vh";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";

    mountRef.current.appendChild(renderer.domElement);

    const particleCount = 2800;
    const radius = 5.0;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x2dd4bf,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
    });

    const globe = new THREE.Points(geometry, material);
    scene.add(globe);

    const wireGeometry = new THREE.SphereGeometry(4.9, 15, 15);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x16222f,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const core = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(core);

    if (window.innerWidth > 768) {
      globe.position.x = 3.2;
      core.position.x = 3.2;
    } else {
      globe.position.x = 0;
      core.position.x = 0;
      globe.position.y = 1.0;
      core.position.y = 1.0;
    }

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      globe.rotation.y += 0.0015;
      globe.rotation.x += 0.0003;
      core.rotation.y -= 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      if (width < 768) {
        globe.position.x = 0;
        core.position.x = 0;
        globe.position.y = 1.0;
        core.position.y = 1.0;
      } else {
        globe.position.x = 3.2;
        core.position.x = 3.2;
        globe.position.y = 0;
        core.position.y = 0;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
    };
  }, []);

  // ==========================================================================
  // FORMULAR ABSENDEN (Login und Register mit OTP-Weichen)
  // ==========================================================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const url = isLogin ? `${API}/api/auth/login` : `${API}/api/auth/register`;
    const body = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // NEU: Fängt den 401-Status ab, falls der Account noch unbestätigt ist
      if (res.status === 401 && data.isVerified === false) {
        setEmail(data.email || email);
        setIsVerifying(true);
        setMessage(data.message);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setMessage(data.message || "Fehler beim Login.");
        setLoading(false);
        return;
      }

      if (isLogin && data.token) {
        localStorage.setItem("token", data.token);
        onLoginSuccess();
      }

      // NEU: Schaltet nach der Registrierung direkt zum OTP-Verify um statt zum Login!
      if (!isLogin) {
        setEmail(email.toLowerCase().trim());
        setIsVerifying(true);
        setMessage(data.message || "Bitte gib den Verifizierungscode ein.");
        setUsername("");
        setPassword("");
      }
    } catch {
      setMessage("Server nicht erreichbar");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================================
  // NEU: CODE VERIFIZIEREN (Sendet den OTP-Code ans Backend)
  // ==========================================================================
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!verificationCode.trim()) {
      setMessage("Bitte gib den Code ein.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Ungültiger oder abgelaufener Code.");
        setLoading(false);
        return;
      }

      // Verifizierung erfolgreich -> Sofort einloggen mit dem erzeugten Token!
      if (data.token) {
        localStorage.setItem("token", data.token);
        onLoginSuccess();
      }
    } catch {
      setMessage("Fehler bei der Verbindung zum Server.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b131f",
      }}
    >
      {/* Das 3D-Szenen-Element im Hintergrund */}
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Die edle Kachel im Glassmorphism-Design */}
      <div className="login-card" style={{ position: "relative", zIndex: 10 }}>
        <div className="login-card-header">
          <h2>
            {isVerifying
              ? "E-Mail bestätigen"
              : isLogin
                ? "Petri Heil!"
                : "Registrieren"}
          </h2>
          <p>
            {isVerifying
              ? `Code gesendet an: ${email}`
              : isLogin
                ? "Logge dich ein, um deine Spots zu sehen"
                : "Erstelle ein Konto für dein Angelabenteuer"}
          </p>
        </div>

        {message && (
          <div
            style={{
              backgroundColor:
                message.includes("erstellt") ||
                message.includes("erfolgreich") ||
                message.includes("Bitte prüfe")
                  ? "rgba(45, 212, 191, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              border:
                message.includes("erstellt") ||
                message.includes("erfolgreich") ||
                message.includes("Bitte prüfe")
                  ? "1px solid var(--accent-cyan)"
                  : "1px solid var(--accent-red)",
              color:
                message.includes("erstellt") ||
                message.includes("erfolgreich") ||
                message.includes("Bitte prüfe")
                  ? "var(--accent-cyan)"
                  : "var(--accent-red)",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        {/* WEICHE: ENTWEDER CODE VERIFIZIEREN ODER NORMALER LOGIN/REGISTER */}
        {isVerifying ? (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="input-group">
              <label>6-stelliger Bestätigungscode</label>
              <input
                placeholder="000000"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ""))
                } // Nur Zahlen erlauben
                autoFocus
                style={{
                  textAlign: "center",
                  fontSize: "20px",
                  letterSpacing: "4px",
                  fontWeight: "bold",
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading ? "Prüfe Code..." : "Code bestätigen"}
            </button>

            <button
              type="button"
              className="login-toggle-text"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                marginTop: "10px",
                textDecoration: "underline",
              }}
              onClick={() => {
                setIsVerifying(false);
                setVerificationCode("");
                setMessage("");
              }}
            >
              Zurück zum Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="input-group">
                <label>Benutzername</label>
                <input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="input-group">
              <label>E-Mail Adresse</label>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Passwort</label>
              <input
                placeholder="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading
                ? "Bitte warten..."
                : isLogin
                  ? "Einloggen"
                  : "Registrieren"}
            </button>
          </form>
        )}

        {!isVerifying && (
          <p className="login-toggle-text">
            {isLogin ? "Noch kein Account?" : "Schon registriert?"}
            <span
              className="login-toggle-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
            >
              {isLogin ? "Registrieren" : "Login"}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
