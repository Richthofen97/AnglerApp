const API_URL = import.meta.env.VITE_API_URL;

export async function getLiveWeather(lat: number, lng: number) {
  const res = await fetch(`${API_URL}/api/weather?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error("Wetterdaten konnten nicht geladen werden.");
  return await res.json();
}
