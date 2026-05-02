import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

// Get all posts
router.get("/posts", async (req, res) => {
  try {
    const db = await getDb();
    const posts = await db.all("SELECT * FROM community_posts ORDER BY timestamp DESC");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Create a post
router.post("/posts", async (req, res) => {
  const { id, userId, userName, text, tag, isMod } = req.body;
  
  if (!text || !tag) {
    return res.status(400).json({ error: "Text and tag are required" });
  }

  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO community_posts (id, userId, userName, text, tag, isMod)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId || "anonymous", userName || "Anonymous", text, tag, isMod ? 1 : 0]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Like a post
router.post("/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  const { increment } = req.body; // true to like, false to unlike

  try {
    const db = await getDb();
    await db.run(
      "UPDATE community_posts SET likes = likes + ? WHERE id = ?",
      [increment ? 1 : -1, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update likes" });
  }
});

// Delete a post (Moderator only)
router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run("DELETE FROM community_posts WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Flag a post
router.post("/posts/:id/flag", async (req, res) => {
  const { id } = req.params;
  const { reason, userId } = req.body;
  const flagId = "f" + Date.now();

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO community_flags (id, postId, reason, userId) VALUES (?, ?, ?, ?)",
      [flagId, id, reason, userId || "anonymous"]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to flag post" });
  }
});

// Get all flags
router.get("/flags", async (req, res) => {
  try {
    const db = await getDb();
    const flags = await db.all("SELECT * FROM community_flags ORDER BY timestamp DESC");
    res.json(flags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch flags" });
  }
});

// Dismiss flags for a post
router.delete("/posts/:id/flags", async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run("DELETE FROM community_flags WHERE postId = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to dismiss flags" });
  }
});

export default router;
