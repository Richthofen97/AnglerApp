import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WaterDetail from "./pages/WaterDetail";
import Login from "./pages/login";
import Home from "./pages/home";
import Profile from "./pages/profile";
import Catches from "./pages/catches";
import Waters from "./pages/waters";
import Community from "./pages/community";
import Lexikon from "./pages/lexikon";
import BottomNav from "./components/BottomNav";
import { getMe } from "./api/auth";

console.log("FRONTEND START");
console.log("API:", import.meta.env.VITE_API_URL);

type User = {
  username: string;
  email: string;
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(
    !!localStorage.getItem("token"),
  );

  const [user, setUser] = useState<User | null>(null);

  async function loadUser() {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoggedIn(false);
      return;
    }

    const res = await getMe(token);

    if (res.ok) {
      setUser(res.data);
      setLoggedIn(true);
    } else {
      localStorage.removeItem("token");
      setLoggedIn(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  function handleLoginSuccess() {
    loadUser();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setLoggedIn(false);
  }

  return (
    <BrowserRouter>
      {!loggedIn ? (
        <Routes>
          <Route
            path="*"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />
        </Routes>
      ) : (
        <>
          {/* Hauptinhalt erhält dank CSS automatisch Abstand nach unten */}
          <main>
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    username={user?.username ?? ""}
                    email={user?.email ?? ""}
                    onLogout={logout} 
                }
              />
              <Route path="/profil" element={<Profile onLogout={logout} />} />
              <Route path="/faenge" element={<Catches />} />
              <Route path="/gewaesser" element={<Waters />} />

              {/* NEUE ROUTEN */}
              <Route path="/community" element={<Community />} />
              <Route path="/lexikon" element={<Lexikon />} />

              <Route path="/gewaesser/:id" element={<WaterDetail />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Die globale Navigationsleiste */}
          <BottomNav />
        </>
      )}
    </BrowserRouter>
  );
}
