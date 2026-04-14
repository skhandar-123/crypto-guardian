import express from "express";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const router = express.Router();
const memoryUsers = new Map();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "dev-only-secret",
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (mongoose.connection.readyState !== 1) {
      if (memoryUsers.has(normalizedEmail)) {
        return res.status(409).json({ error: "An account already exists for this email." });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = { id: `local-${Date.now()}`, email: normalizedEmail, password: hashed };
      memoryUsers.set(normalizedEmail, user);
      return res.status(201).json({ id: user.id, email: user.email, mode: "in-memory" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account already exists for this email." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashed,
    });

    res.status(201).json({ id: user._id, email: user.email, mode: "database" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed. Check database setup." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (mongoose.connection.readyState !== 1) {
      const user = memoryUsers.get(normalizedEmail);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = signToken(user);
      return res.json({ token, user: { id: user.id, email: user.email }, mode: "in-memory" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken({ id: user._id, email: user.email });

    res.json({ token, user: { id: user._id, email: user.email }, mode: "database" });
  } catch (error) {
    res.status(500).json({ error: "Login failed. Check database setup." });
  }
});

export default router;
