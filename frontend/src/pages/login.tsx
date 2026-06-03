import { useState } from "react";

type Props = {
  onLoginSuccess: () => void;
};

const API = import.meta.env.VITE_API_URL;

console.log("API:", import.meta.env.VITE_API_URL);

export default function Login({ onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  async function handleSubmit() {
    const url = isLogin ? `${API}/api/auth/login` : `${API}/api/auth/register`;

    const body = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Fehler");
        return;
      }

      if (isLogin && data.token) {
        localStorage.setItem("token", data.token);
        onLoginSuccess();
      }

      if (!isLogin) {
        setMessage("Account erstellt – jetzt einloggen");
        setIsLogin(true);
      }
    } catch {
      setMessage("Server nicht erreichbar");
    }
  }

  return (
    <div style={styles.container}>
      <h2>{isLogin ? "Login" : "Register"}</h2>

      {!isLogin && (
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
      )}

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Passwort"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleSubmit} style={styles.button}>
        {isLogin ? "Login" : "Register"}
      </button>

      <p style={{ color: "red" }}>{message}</p>

      <button onClick={() => setIsLogin(!isLogin)} style={styles.switch}>
        {isLogin ? "Noch kein Account? Registrieren" : "Schon Account? Login"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 20,
    maxWidth: 320,
    margin: "0 auto",
  },

  input: {
    display: "block",
    width: "100%",
    marginBottom: 10,
    padding: 10,
  },

  button: {
    width: "100%",
    padding: 10,
    background: "#000",
    color: "#fff",
    border: "none",
    marginBottom: 10,
  },

  switch: {
    width: "100%",
    padding: 10,
    background: "transparent",
    border: "1px solid #ccc",
  },
};
