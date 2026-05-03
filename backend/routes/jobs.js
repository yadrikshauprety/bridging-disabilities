import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const jobs = await db.all("SELECT * FROM jobs");
    
    // Parse questions JSON string back to array
    const formattedJobs = jobs.map(j => ({
      ...j,
      questions: JSON.parse(j.questions || "[]"),
      inclusionFlags: JSON.parse(j.inclusionFlags || "{}")
    }));
    
    res.json(formattedJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Create a new job (Employer Portal)
router.post("/", async (req, res) => {
  const { title, company, description, employerId, questions, hasBadge, inclusionFlags } = req.body;
  
  if (!title || !company) {
    return res.status(400).json({ error: "Title and company are required" });
  }

  const id = `job_${Date.now()}`;
  const empId = (employerId || "emp_1").toLowerCase();
  const qStr = JSON.stringify(questions || []);

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO jobs (id, title, company, description, employerId, questions, hasBadge, inclusionFlags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, company, description, empId, qStr, hasBadge || 0, inclusionFlags || "{}"]
    );

    res.status(201).json({ id, title, company, description, employerId: empId, questions, hasBadge, inclusionFlags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Get a specific job
router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const job = await db.get("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    job.questions = JSON.parse(job.questions || "[]");
    job.inclusionFlags = JSON.parse(job.inclusionFlags || "{}");
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

export default router;
