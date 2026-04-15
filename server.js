import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import cryptoRoutes from "./routes/crypto.js";

// ✅ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ✅ MongoDB Connection
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) =>
      console.error("❌ MongoDB connection failed:", err.message)
    );
} else {
  console.warn("⚠️ MONGO_URI not set");
}

// ✅ Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "CryptoGuardian AI",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "offline",
  });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/ai", aiRoutes);

// ✅ ROOT ROUTE (IMPORTANT FOR RENDER)
app.get("/", (req, res) => {
  res.send("🚀 CryptoGuardian API is running");
});

// ❌ (REMOVED BROKEN sendFile)
// If you want frontend later, we will add properly

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});