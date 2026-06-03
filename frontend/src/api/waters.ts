const API_URL = import.meta.env.VITE_API_URL;

export async function getWaters() {
  const res = await fetch(`${API_URL}/api/waters`);
  if (!res.ok) throw new Error("Fehler beim Laden der Gewässer");
  return await res.json();
}

export async function createWater(
  name: string,
  location: string, // Nutze hier "location" passend zum Backend-Model
  lat: number,
  lng: number,
) {
  const res = await fetch(`${API_URL}/api/waters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      location, // KORRIGIERT: Vorher stand hier 'description'
      lat,
      lng,
    }),
  });

  if (!res.ok) throw new Error("Fehler beim Erstellen des Gewässers");
  return await res.json();
}

export async function deleteWater(id: string) {
  const res = await fetch(`${API_URL}/api/waters/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Fehler beim Löschen des Gewässers");
  return await res.json();
}
