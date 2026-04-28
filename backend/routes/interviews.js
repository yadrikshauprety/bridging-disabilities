import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

// Submit a new interview transcript
router.post("/", async (req, res) => {
  const { jobId, candidateId, employerId, transcript } = req.body;
  
  if (!jobId || !transcript) {
    return res.status(400).json({ error: "Job ID and transcript are required" });
  }

  const id = `int_${Date.now()}`;
  const cId = candidateId || "pwd_candidate";
  const eId = employerId || "emp_1";
  const tStr = JSON.stringify(transcript);

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO interviews (id, jobId, candidateId, employerId, transcript) VALUES (?, ?, ?, ?, ?)",
      [id, jobId, cId, eId, tStr]
    );

    res.status(201).json({ id, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save interview" });
  }
});

// Get interviews for a specific employer
router.get("/employer/:employerId", async (req, res) => {
  try {
    const db = await getDb();
    // Join with jobs to get the job title
    const interviews = await db.all(`
      SELECT i.*, j.title as jobTitle 
      FROM interviews i 
      JOIN jobs j ON i.jobId = j.id 
      WHERE i.employerId = ?
      ORDER BY i.timestamp DESC
    `, [req.params.employerId]);
    
    const formatted = interviews.map(i => ({
      ...i,
      transcript: JSON.parse(i.transcript)
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

export default router;
