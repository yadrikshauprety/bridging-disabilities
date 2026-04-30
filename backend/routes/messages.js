import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

// Send a message or interview link
router.post("/send", async (req, res) => {
  const { senderId, receiverId, content, type } = req.body;
  const db = await getDb();
  try {
    await db.run(
      "INSERT INTO messages (senderId, receiverId, content, type) VALUES (?, ?, ?, ?)",
      [senderId, receiverId, content, type || "text"]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get messages for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDb();
  try {
    const messages = await db.all(
      "SELECT * FROM messages WHERE receiverId = ? OR senderId = ? ORDER BY timestamp DESC",
      [userId, userId]
    );
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
