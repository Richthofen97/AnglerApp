import anglerBackground from "../assets/angler-sunset.jpg";

export default function HeroImage() {
  return (
    <img
      src={anglerBackground}
      alt="Ruhiger Abend am See"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" /* Verhindert Verzerrungen des Fotos */,
        objectPosition:
          "center 60%" /* Fokussiert perfekt auf den Steg des Pexels-Bildes */,
        zIndex: 1,
      }}
    />
  );
}
