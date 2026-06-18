import { useState } from "react";
// Importiert die ausgelagerte Fischdatenbank (Pfad ggf. anpassen, falls fishData woanders liegt)
import { FISCH_LEXIKON, type FishInfo } from "./fishData";
import { Search, BookOpen, Scale, ShieldAlert, Award } from "lucide-react";
import "../App.css";

export default function Lexikon() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFish, setSelectedFish] = useState<FishInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Alle");

  const categories = [
    "Alle",
    "Raubfisch",
    "Friedfisch",
    "Salmonide",
    "Meeresfisch",
  ];

  // Filtert live nach Suchbegriff UND ausgewählter Kategorie
  const filteredLexikon = FISCH_LEXIKON.filter((fish) => {
    const matchesSearch = fish.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === "Alle" || fish.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  return (
    <div
      className="dashboard-container"
      style={{ paddingBottom: "100px", paddingInline: "16px" }}
    >
      {/* SCHONZEITEN & FISCH-LEXIKON REGION */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          margin: "16px 0 12px 0",
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
      {/* OVERLAY MODAL: DIE DETAILLIERTE LEXIKONKARTE BEIM ANKLICKEN */}
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
