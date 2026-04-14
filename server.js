import dotenv from "dotenv";
dotenv.config();
console.log("ENV CHECK:", process.env.MONGO_URI);
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import cryptoRoutes from "./routes/crypto.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../frontend");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.warn("MongoDB connection failed:", error.message));
} else {
  console.warn("MONGO_URI is not set. Auth routes will return setup errors.");
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "CryptoGuardian AI",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "offline",
    auth: mongoose.connection.readyState === 1 ? "database" : "in-memory",
    ai: process.env.OPENAI_API_KEY ? "configured" : "fallback",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/ai", aiRoutes);

app.use(express.static(frontendPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`CryptoGuardian running at http://localhost:${PORT}`);
});
