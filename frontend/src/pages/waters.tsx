import BottomNav from "../components/BottomNav";
import Map from "../components/Map";

export default function Waters() {
  return (
    <div style={{ padding: 20, paddingBottom: 80 }}>
      <h1>🗺️ Gewässer</h1>

      <p>Dein aktueller Standort:</p>

      <Map />

      <BottomNav />
    </div>
  );
}
