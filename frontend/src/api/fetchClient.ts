const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function customFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  // Bereite die Header vor und füge das Token automatisch hinzu
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Fehler: ${response.status}`);
  }

  return response.json();
}
