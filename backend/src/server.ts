import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import waterRoutes from "./routes/waters";
import weatherRoutes from "./routes/weather";

dotenv.config();

const app = express();

/* -----------------------------
   MIDDLEWARE (MUSS ZUERST KOMMEN)
------------------------------ */
// 1. CORS aktivieren, damit das Frontend überhaupt zugreifen darf
app.use(cors());

// 2. JSON Body Parser aktivieren, um Daten lesen zu können
app.use(express.json());

// 3. Request Logger
app.use((req, res, next) => {
  console.log("INCOMING:", req.method, req.url);
  next();
});

/* -----------------------------
   ROUTES (KORRIGIERT: Erst nach CORS registrieren!)
------------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/waters", waterRoutes);
app.use("/api/weather", weatherRoutes); // <-- Hierhin verschoben!

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
