import express from "express";
import { getDb } from "../db.js";

const router = express.Router();

function quarterLabel(dateValue) {
  const date = new Date(dateValue);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()} Q${quarter}`;
}

function quarterSortKey(label) {
  const [year, qPart] = label.split(" Q");
  return Number(year) * 10 + Number(qPart);
}

// Save company info (total employees, current PWD count)
router.post("/company-info/:employerId", async (req, res) => {
  const { employerId } = req.params;
  const { totalEmployees, pwdEmployees } = req.body;

  if (totalEmployees === undefined || pwdEmployees === undefined) {
    return res.status(400).json({ error: "totalEmployees and pwdEmployees are required" });
  }

  try {
    const db = await getDb();
    await db.run(
      `INSERT OR REPLACE INTO employer_info (employerId, totalEmployees, pwdEmployees, updatedAt)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [employerId, Number(totalEmployees), Number(pwdEmployees)]
    );

    res.status(200).json({ success: true, employerId, totalEmployees, pwdEmployees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save company info" });
  }
});

// Get company info
router.get("/company-info/:employerId", async (req, res) => {
  const { employerId } = req.params;

  try {
    const db = await getDb();
    const info = await db.get(
      `SELECT employerId, totalEmployees, pwdEmployees, updatedAt FROM employer_info WHERE LOWER(employerId) = LOWER(?)`,
      [employerId]
    );

    if (!info) {
      return res.json({ employerId, totalEmployees: 0, pwdEmployees: 0 });
    }

    res.json(info);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch company info" });
  }
});

// Save audit answers
router.post("/audit/:employerId", async (req, res) => {
  const { employerId } = req.params;
  const { answers } = req.body;

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "answers object is required" });
  }

  const answerValues = Object.values(answers).map(Boolean);
  const yesCount = answerValues.filter(Boolean).length;
  const totalQuestions = answerValues.length || 0;
  const score = totalQuestions ? Math.round((yesCount / totalQuestions) * 100) : 0;
  const id = `audit_${Date.now()}`;

  try {
    const db = await getDb();
    await db.run(
      `INSERT INTO employer_audits (id, employerId, answers, yesCount, totalQuestions, score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, employerId, JSON.stringify(answers), yesCount, totalQuestions, score]
    );

    res.status(201).json({ success: true, id, score, yesCount, totalQuestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save audit" });
  }
});

// Get DEI analytics for individual company
router.get("/dei/:employerId", async (req, res) => {
  try {
    const db = await getDb();
    const employerId = req.params.employerId;
    console.log("Fetching DEI for:", employerId);

    // Fetch company info
    const companyInfo = await db.get(
      `SELECT totalEmployees, pwdEmployees FROM employer_info WHERE LOWER(employerId) = LOWER(?)`,
      [employerId]
    );
    const totalEmployees = companyInfo?.totalEmployees || 0;
    const currentPwdEmployees = companyInfo?.pwdEmployees || 0;

    // Fetch interviews and decisions
    const interviews = await db.all(
      `SELECT i.id, i.candidateId, i.jobId, i.employerId, i.timestamp, j.title as jobTitle, cr.status as decisionStatus
       FROM interviews i
       JOIN jobs j ON i.jobId = j.id
       LEFT JOIN candidate_reviews cr ON cr.interviewId = i.id
       WHERE LOWER(i.employerId) = LOWER(?)`,
      [employerId]
    );

    // Fetch audits
    const audits = await db.all(
      `SELECT id, employerId, answers, yesCount, score, createdAt FROM employer_audits WHERE LOWER(employerId) = LOWER(?) ORDER BY createdAt ASC`,
      [employerId]
    );
    console.log("Audits count:", audits?.length);

    // Calculate candidate metrics
    const uniqueCandidates = new Set(interviews.map((item) => item.candidateId));
    const selectedReviews = interviews.filter((item) => item.decisionStatus === "selected");
    const selectedCandidates = new Set(selectedReviews.map((item) => item.candidateId)).size;
    const totalInterviewedCandidates = uniqueCandidates.size;

    // The stored PwD total is already updated when a candidate is selected/rejected
    const projectedPwdEmployees = currentPwdEmployees;

    // Calculate compliance percentage for RPwD mandate (3%)
    const pwdCompliancePercentage = totalEmployees > 0 
      ? Math.round((projectedPwdEmployees / totalEmployees) * 100 * 10) / 10
      : 0;

    const mandatePercentage = 3; // RPwD mandate is 3%
    const complianceStatus = pwdCompliancePercentage >= mandatePercentage ? "On Track" : "Below Target";

    // Get latest audit score
    const latestAudit = audits.length > 0 ? audits[audits.length - 1] : null;
    const latestAuditScore = latestAudit ? Number(latestAudit.score) : 0;

    // Build quarterly trend
    const quarterMap = new Map();

    // Add audit scores to quarters
    for (const audit of audits) {
      if (!audit.createdAt) continue;
      const label = quarterLabel(audit.createdAt);
      const bucket = quarterMap.get(label) || { label, scores: [], improvements: [] };
      bucket.scores.push(Number(audit.score));
      bucket.improvements.push(Number(audit.yesCount));
      quarterMap.set(label, bucket);
    }

    // Add hiring decisions to quarters
    for (const interview of interviews) {
      if (!interview.decisionStatus || !interview.timestamp) continue;
      const label = quarterLabel(interview.timestamp);
      const bucket = quarterMap.get(label) || { label, decisions: [] };
      bucket.decisions = bucket.decisions || [];
      bucket.decisions.push(interview.decisionStatus === "selected" ? 1 : 0);
      quarterMap.set(label, bucket);
    }

    const quarterTrend = Array.from(quarterMap.values())
      .sort((a, b) => quarterSortKey(a.label) - quarterSortKey(b.label))
      .map((bucket) => {
        const compScore = bucket.scores?.length ? Math.round(bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length) : 0;
        const improvements = bucket.improvements?.length ? bucket.improvements.reduce((a, b) => a + b, 0) : 0;
        const hiringRate = bucket.decisions?.length ? Math.round((bucket.decisions.reduce((a, b) => a + b, 0) / bucket.decisions.length) * 1000) / 10 : 0;
        return {
          quarter: bucket.label,
          compliance: compScore,
          hiringRate,
          improvements,
        };
      });

    res.json({
      employerId,
      totalEmployees,
      currentPwdEmployees,
      selectedCandidatesThisQuarter: selectedCandidates,
      projectedPwdEmployees,
      pwdCompliancePercentage,
      mandatePercentage,
      complianceStatus,
      totalInterviewedCandidates,
      selectionRate: totalInterviewedCandidates > 0 ? Math.round((selectedCandidates / totalInterviewedCandidates) * 1000) / 10 : 0,
      latestAuditScore,
      quarterTrend,
      latestAuditAt: latestAudit?.createdAt || null,
    });
  } catch (error) {
    console.error("DEI ROUTE ERROR:", error);
    import('fs').then(fs => {
      fs.appendFileSync('error_log.txt', `\n[${new Date().toISOString()}] DEI ERROR: ${error.stack}\n`);
    });
    res.status(500).json({ error: "Failed to fetch DEI analytics", details: error.message });
  }
});

// Seed mock DEI data for testing
router.post("/seed-dei/:employerId", async (req, res) => {
  const { employerId } = req.params;
  try {
    const db = await getDb();
    
    // 1. Set company info
    await db.run(
      `INSERT OR REPLACE INTO employer_info (employerId, totalEmployees, pwdEmployees, updatedAt)
       VALUES (?, 400, 7, datetime('now', '-1 day'))`,
      [employerId]
    );

    // 2. Add some audits across quarters
    const quarters = [
      { date: "datetime('now', '-270 day')", score: 65, yes: 13 },
      { date: "datetime('now', '-180 day')", score: 70, yes: 14 },
      { date: "datetime('now', '-90 day')", score: 75, yes: 15 },
      { date: "datetime('now')", score: 85, yes: 17 },
    ];

    for (const q of quarters) {
      const id = `audit_mock_${Math.random().toString(36).substr(2, 9)}`;
      await db.run(
        `INSERT INTO employer_audits (id, employerId, answers, yesCount, totalQuestions, score, createdAt)
         VALUES (?, ?, '{}', ?, 20, ?, ${q.date})`,
        [id, employerId, q.yes, q.score]
      );
    }

    res.json({ success: true, message: "Mock DEI data seeded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to seed mock data" });
  }
});

export default router;
