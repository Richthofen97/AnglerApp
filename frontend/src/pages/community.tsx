import { useEffect, useState } from "react";
import {
  getCommunityFeed,
  toggleLikeCatch,
  toggleDislikeCatch,
  addCommentToCatch,
  deleteCommentFromCatch, // NEU: Importiert zum Löschen von Kommentaren
} from "../api/catches";
import { FISCH_LEXIKON } from "./fishData";
import {
  Heart,
  MessageSquare,
  Send,
  Scale,
  Ruler,
  MapPin,
  User,
  Trash2, // NEU: Icon für das Löschen
  ThumbsDown,
} from "lucide-react";

import "../App.css";

type CommunityCatch = {
  _id: string;
  species: string;
  weight?: number;
  length?: number;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  likes: string[];
  dislikes: string[];
  comments: {
    _id: string; // WICHTIG: Die ID des Kommentars für die API
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
  userId?: { _id: string; username: string };
  spotId?: { _id: string; name: string; location: string };
};

export default function Community() {
  const [feed, setFeed] = useState<CommunityCatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentCatchId, setActiveCommentCatchId] = useState<
    string | null
  >(null);
  const [newCommentText, setNewCommentText] = useState("");
  const token = localStorage.getItem("token");
  let currentUserId = "";

  if (token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const decoded = JSON.parse(jsonPayload);
      currentUserId = decoded.id || decoded._id || "";
    } catch (e) {
      console.error("Fehler beim Dekodieren des Tokens:", e);
    }
  }

  useEffect(() => {
    async function loadFeed() {
      try {
        const data = await getCommunityFeed();
        setFeed(data);
      } catch (err) {
        console.error("Fehler beim Laden des Feeds:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const getFishFallbackImage = (speciesName: string): string | undefined => {
    if (!speciesName) return undefined;
    const fishMatch = FISCH_LEXIKON.find(
      (f) => f.name.toLowerCase() === speciesName.toLowerCase(),
    );
    return fishMatch?.image;
  };

  const handleLike = async (catchId: string) => {
    try {
      const updatedCatch = await toggleLikeCatch(catchId);
      setFeed((prev) =>
        prev.map((item) => (item._id === catchId ? updatedCatch : item)),
      );
    } catch (err) {
      console.error("Like fehlgeschlagen:", err);
    }
  };

  const handleDislike = async (catchId: string) => {
    try {
      const updatedCatch = await toggleDislikeCatch(catchId);
      setFeed((prev) =>
        prev.map((item) => (item._id === catchId ? updatedCatch : item)),
      );
    } catch (err) {
      console.error("Dislike fehlgeschlagen:", err);
    }
  };

  const handleSendComment = async (catchId: string) => {
    if (!newCommentText.trim()) return;
    try {
      const updatedCatch = await addCommentToCatch(
        catchId,
        newCommentText.trim(),
      );
      setFeed((prev) =>
        prev.map((item) => (item._id === catchId ? updatedCatch : item)),
      );
      setNewCommentText("");
    } catch (err) {
      console.error("Kommentar senden fehlgeschlagen:", err);
    }
  };

  // NEU: Funktion zum Löschen eines Kommentars
  const handleDeleteComment = async (catchId: string, commentId: string) => {
    if (!window.confirm("Möchtest du diesen Kommentar wirklich löschen?"))
      return;
    try {
      const updatedCatch = await deleteCommentFromCatch(catchId, commentId);
      setFeed((prev) =>
        prev.map((item) => (item._id === catchId ? updatedCatch : item)),
      );
    } catch (err) {
      console.error("Kommentar löschen fehlgeschlagen:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ color: "var(--text-muted)", padding: 20 }}>
        Lade den Community-Feed...
      </div>
    );
  }
  return (
    <div
      className="dashboard-container"
      style={{
        paddingBottom: "80px",
        paddingInline: "16px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <div style={{ margin: "16px 0" }}>
        <h2
          style={{
            color: "#fff",
            fontSize: "22px",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          🌐 Angler Community
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            margin: "4px 0 0 0",
          }}
        >
          Schau dir die Fänge anderer Angler an und teile deine Erfolge!
        </p>
      </div>

      {feed.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Aktuell wurden noch keine Fänge geteilt. Sei der Erste und schalte
          einen deiner Fänge auf "Veröffentlicht"!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {feed.map((item) => {
            const displayImg =
              item.imageUrl || getFishFallbackImage(item.species);
            const userHasLiked = item.likes?.includes(currentUserId);
            const userHasDisliked = item.dislikes?.includes(currentUserId);

            return (
              <div
                key={item._id}
                style={{
                  background:
                    "linear-gradient(135deg, #1e293b 0%, #16222f 100%)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {/* CARD HEADER (Wieder komplett Original ohne Klick-Funktion) */}
                <div
                  style={{
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={18} color="var(--accent-cyan)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {item.userId?.username || "Unbekannter Angler"}
                    </h4>
                    <p
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MapPin size={10} color="var(--accent-cyan)" />
                      {item.spotId?.name || "Geheimer Spot"}
                    </p>
                  </div>
                  <span
                    style={{ fontSize: "11px", color: "var(--text-muted)" }}
                  >
                    {new Date(item.createdAt).toLocaleDateString("de-DE")}
                  </span>
                </div>

                {/* CARD VISUAL */}
                <div
                  style={{
                    height: "240px",
                    background: "var(--bg-dark)",
                    position: "relative",
                  }}
                >
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={item.species}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={48} color="var(--text-muted)" />
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(15, 23, 42, 0.75)",
                      backdropFilter: "blur(4px)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    🐟 {item.species}
                  </div>
                </div>

                {/* CATCH DETAILS */}
                <div
                  style={{
                    padding: "14px 14px 10px 14px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  {item.weight && (
                    <div
                      style={{
                        background: "rgba(11, 19, 31, 0.3)",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Scale size={14} color="var(--accent-orange)" />
                      <span style={{ fontSize: "13px", color: "#fff" }}>
                        {item.weight >= 1000
                          ? (item.weight / 1000).toFixed(2) + " kg"
                          : item.weight + " g"}
                      </span>
                    </div>
                  )}
                  {item.length && (
                    <div
                      style={{
                        background: "rgba(11, 19, 31, 0.3)",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Ruler size={14} color="var(--accent-cyan)" />
                      <span style={{ fontSize: "13px", color: "#fff" }}>
                        {item.length} cm
                      </span>
                    </div>
                  )}
                </div>

                {/* NOTES */}
                {item.notes && (
                  <p
                    style={{
                      margin: "0 14px 10px 14px",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.8)",
                      fontStyle: "italic",
                    }}
                  >
                    "{item.notes}"
                  </p>
                )}

                {/* SOCIAL INTERACTION BUTTONS */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderTop: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                  }}
                >
                  {/* LIKE */}
                  <button
                    onClick={() => handleLike(item._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)", // Farbe bleibt immer gleich
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      padding: 0,
                    }}
                  >
                    {/* Füllt das Icon aus, wenn geliked, nutzt aber die Textfarbe */}
                    <Heart
                      size={18}
                      fill={userHasLiked ? "var(--text-muted)" : "transparent"}
                    />
                    <span>{item.likes?.length || 0}</span>
                  </button>

                  {/* DISLIKE */}
                  <button
                    onClick={() => handleDislike(item._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)", // Farbe bleibt immer gleich
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      padding: 0,
                    }}
                  >
                    {/* Füllt das Icon aus, wenn gedisliked, nutzt die gleiche Textfarbe */}
                    <ThumbsDown
                      size={18}
                      fill={
                        userHasDisliked ? "var(--text-muted)" : "transparent"
                      }
                    />
                    <span>{item.dislikes?.length || 0}</span>
                  </button>

                  {/* COMMENTS TOGGLE */}
                  <button
                    onClick={() =>
                      setActiveCommentCatchId(
                        activeCommentCatchId === item._id ? null : item._id,
                      )
                    }
                    style={{
                      background: "transparent",
                      border: "none",
                      color:
                        activeCommentCatchId === item._id
                          ? "var(--accent-cyan)"
                          : "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      padding: 0,
                      marginLeft: "auto",
                    }}
                  >
                    <MessageSquare size={18} />
                    <span>{item.comments?.length || 0} Kommentare</span>
                  </button>
                </div>

                {/* COMMENTS SECTION */}
                {activeCommentCatchId === item._id && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.15)",
                      borderTop: "1px solid var(--border-color)",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {/* LIST OF COMMENTS */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        maxHeight: "150px",
                        overflowY: "auto",
                      }}
                    >
                      {item.comments?.length === 0 ? (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Noch keine Kommentare. Schreibe den ersten!
                        </p>
                      ) : (
                        item.comments?.map((comment, idx) => (
                          <div
                            key={comment._id || idx}
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.05)",
                              position: "relative", // Für die Positionierung des Lösch-Buttons
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "2px",
                                paddingRight:
                                  comment.userId === currentUserId
                                    ? "24px"
                                    : "0",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--accent-cyan)",
                                  fontWeight: "bold",
                                }}
                              >
                                {comment.userName}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {new Date(comment.createdAt).toLocaleDateString(
                                  "de-DE",
                                )}
                              </span>
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.9)",
                                paddingRight:
                                  comment.userId === currentUserId
                                    ? "24px"
                                    : "0",
                              }}
                            >
                              {comment.text}
                            </p>

                            {/* NEU: Lösch-Button für eigene Kommentare */}
                            {comment.userId === currentUserId && (
                              <button
                                onClick={() =>
                                  handleDeleteComment(item._id, comment._id)
                                }
                                style={{
                                  position: "absolute",
                                  right: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  padding: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "color 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = "#ef4444")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color =
                                    "var(--text-muted)")
                                }
                                title="Kommentar löschen"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* ADD COMMENT INPUT */}
                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "4px" }}
                    >
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Kommentar schreiben..."
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "var(--bg-dark)",
                          border: "1px solid var(--border-color)",
                          color: "#fff",
                          fontSize: "13px",
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendComment(item._id)
                        }
                      />
                      <button
                        onClick={() => handleSendComment(item._id)}
                        style={{
                          background: "var(--accent-cyan)",
                          border: "none",
                          color: "#000",
                          borderRadius: "10px",
                          width: "34px",
                          height: "34px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
