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
  const cId = (candidateId || "pwd_candidate_1").toLowerCase();
  const eId = (employerId || "emp_1").toLowerCase();
  const tStr = JSON.stringify(transcript || []);

  try {
    const db = await getDb();
    await db.run(
      "INSERT INTO interviews (id, jobId, candidateId, employerId, transcript) VALUES (?, ?, ?, ?, ?)",
      [id, jobId, cId, eId, tStr]
    );

    // Also create initial candidate review record
    await db.run(
      "INSERT OR IGNORE INTO candidate_reviews (interviewId, employerId, status) VALUES (?, ?, 'applied')",
      [id, eId]
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
    const empId = req.params.employerId;
    console.log(`[GET /interviews/employer/${empId}] Fetching for ${empId}`);
    
    // Join with jobs to get the job title (Fetching ALL for Global View)
    const interviews = await db.all(`
      SELECT i.*, COALESCE(j.title, 'Position: ' || i.jobId) as jobTitle, cr.status as decisionStatus
      FROM interviews i 
      LEFT JOIN jobs j ON i.jobId = j.id 
      LEFT JOIN candidate_reviews cr ON cr.interviewId = i.id
      ORDER BY i.timestamp DESC
    `);

    console.log(`[GET /interviews/employer/${empId}] Found ${interviews.length} interviews`);
    
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

// Update interview decision status
router.post("/:interviewId/decision", async (req, res) => {
  const { interviewId } = req.params;
  const { employerId, status } = req.body;

  if (!status || !['selected', 'rejected', 'applied', 'round2'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const db = await getDb();
    
    // 1. Get current status to see if we need to update counts
    const currentReview = await db.get(
      "SELECT status FROM candidate_reviews WHERE interviewId = ?",
      [interviewId]
    );
    const oldStatus = currentReview?.status || 'applied';

    if (oldStatus === status) {
      return res.json({ success: true, status, message: "Status unchanged" });
    }

    // 2. Update or Insert candidate review
    await db.run(
      `INSERT INTO candidate_reviews (interviewId, employerId, status, updatedAt)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(interviewId) DO UPDATE SET status = excluded.status, updatedAt = CURRENT_TIMESTAMP`,
      [interviewId, employerId, status]
    );

    // 3. Update employer_info counts
    // We increment if moving TO selected, decrement if moving FROM selected
    let increment = 0;
    if (status === 'selected' && oldStatus !== 'selected') increment = 1;
    else if (oldStatus === 'selected' && status !== 'selected') increment = -1;

    if (increment !== 0) {
      // Ensure employer_info exists
      const info = await db.get("SELECT employerId FROM employer_info WHERE employerId = ?", [employerId]);
      if (!info) {
        await db.run("INSERT INTO employer_info (employerId, totalEmployees, pwdEmployees) VALUES (?, 0, 0)", [employerId]);
      }
      await db.run(
        `UPDATE employer_info SET pwdEmployees = MAX(0, COALESCE(pwdEmployees, 0) + ?) WHERE employerId = ?`,
        [increment, employerId]
      );
    }

    res.json({ success: true, status, oldStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update decision" });
  }
});

export default router;
