import { getDb } from '../backend/db.js';

async function check() {
  const db = await getDb();
  console.log("--- JOBS ---");
  const jobs = await db.all("SELECT id, title, employerId FROM jobs");
  console.log(JSON.stringify(jobs, null, 2));

  console.log("\n--- INTERVIEWS ---");
  const interviews = await db.all("SELECT id, jobId, candidateId, employerId FROM interviews");
  console.log(JSON.stringify(interviews, null, 2));

  console.log("\n--- CANDIDATE REVIEWS ---");
  const reviews = await db.all("SELECT * FROM candidate_reviews");
  console.log(JSON.stringify(reviews, null, 2));
}

check();
