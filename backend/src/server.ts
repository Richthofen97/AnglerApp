import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import waterRoutes from "./routes/waters"; // Beibehalten mit 's' wie in deiner Datei
import spotRoutes from "./routes/spot"; // Import für die persönlichen GPS-Spots
import weatherRoutes from "./routes/weather";

dotenv.config();

const app = express();

/* -----------------------------
   MIDDLEWARE (MUSS ZUERST KOMMEN)
------------------------------ */
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log("INCOMING:", req.method, req.url);
  next();
});

/* -----------------------------
   ROUTES (Reihenfolge ist perfekt abgestimmt)
------------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/waters", waterRoutes);
app.use("/api/spots", spotRoutes); // KORREKTUR: Jetzt registriert und erreichbar!
app.use("/api/weather", weatherRoutes);

/* -----------------------------
   HEALTH CHECK
------------------------------ */
app.get("/", (req, res) => {
  res.json({ message: "API läuft (TypeScript)" });
});

/* -----------------------------
   MONGOOSE CONNECT
------------------------------ */
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("MongoDB verbunden");
  })
  .catch((err) => {
    console.log("MongoDB Fehler:", err);
  });

/* -----------------------------
   START SERVER
------------------------------ */
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
