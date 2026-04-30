import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  const db = await getDb();
  try {
    await db.run(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, password, name]
    );
    res.json({ success: true, user: { email, name } });
  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  
  if (user && user.password === password) {
    res.json({ success: true, user: { email: user.email, name: user.name, onboarded: user.onboarded, disability: user.disability, location: user.location } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

export default router;
