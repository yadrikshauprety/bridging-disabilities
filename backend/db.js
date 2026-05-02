import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getDb() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT NOT NULL,
      employerId TEXT NOT NULL,
      hasBadge INTEGER DEFAULT 0, -- 1 if employer has the inclusion badge
      inclusionFlags TEXT, -- JSON string of feature flags
      questions TEXT NOT NULL -- stored as JSON
    );
    
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      jobId TEXT NOT NULL,
      candidateId TEXT NOT NULL,
      employerId TEXT NOT NULL,
      transcript TEXT NOT NULL, -- stored as JSON
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobId) REFERENCES jobs (id)
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      disability TEXT,
      preferences TEXT, -- JSON string
      aadhar TEXT,
      pan TEXT,
      trustedContact TEXT,
      location TEXT,
      onboarded INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS udid_applications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      disabilityType TEXT NOT NULL,
      aadhar TEXT,
      status TEXT DEFAULT 'Submitted',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY, -- OSM ID
      name TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      type TEXT,
      totalReviews INTEGER DEFAULT 0,
      rampYesVotes INTEGER DEFAULT 0,
      rampTotalVotes INTEGER DEFAULT 0,
      toiletYesVotes INTEGER DEFAULT 0,
      toiletTotalVotes INTEGER DEFAULT 0,
      brailleYesVotes INTEGER DEFAULT 0,
      brailleTotalVotes INTEGER DEFAULT 0,
      audioYesVotes INTEGER DEFAULT 0,
      audioTotalVotes INTEGER DEFAULT 0,
      parkingYesVotes INTEGER DEFAULT 0,
      parkingTotalVotes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS accessibility_reviews (
      id TEXT PRIMARY KEY,
      placeId TEXT NOT NULL,
      userId TEXT NOT NULL,
      rampLift INTEGER, -- 1 for Yes, 0 for No, NULL for Unsure
      accessibleToilet INTEGER,
      brailleSignage INTEGER,
      audioAnnouncements INTEGER,
      parking INTEGER,
      comments TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (placeId) REFERENCES places (id)
    );

    CREATE TABLE IF NOT EXISTS employer_audits (
      id TEXT PRIMARY KEY,
      employerId TEXT NOT NULL,
      answers TEXT NOT NULL, -- JSON string
      yesCount INTEGER NOT NULL,
      totalQuestions INTEGER NOT NULL DEFAULT 20,
      score INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employer_info (
      employerId TEXT PRIMARY KEY,
      totalEmployees INTEGER DEFAULT 0,
      pwdEmployees INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_reviews (
      interviewId TEXT PRIMARY KEY,
      employerId TEXT NOT NULL,
      status TEXT DEFAULT 'applied',
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interviewId) REFERENCES interviews (id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      text TEXT NOT NULL,
      tag TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      isMod INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_flags (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      reason TEXT NOT NULL,
      userId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postId) REFERENCES community_posts (id)
    );
  `);

  // Migrations for existing columns
  try { await db.run("ALTER TABLE udid_applications ADD COLUMN aadhar TEXT"); } catch (e) {}
  try { await db.run("ALTER TABLE employer_info ADD COLUMN totalEmployees INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.run("ALTER TABLE employer_info ADD COLUMN pwdEmployees INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.run("ALTER TABLE employer_info ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch (e) {}
  try { await db.run("ALTER TABLE employer_audits ADD COLUMN totalQuestions INTEGER DEFAULT 20"); } catch (e) {}
  try { await db.run("ALTER TABLE employer_audits ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch (e) {}

  // Migrate candidate_reviews to remove status constraint if it exists
  try {
    const tableInfo = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='candidate_reviews'");
    if (tableInfo && tableInfo.sql.includes("CHECK")) {
      console.log("Migrating candidate_reviews to remove CHECK constraint...");
      await db.exec(`
        CREATE TABLE candidate_reviews_new (
          interviewId TEXT PRIMARY KEY,
          employerId TEXT NOT NULL,
          status TEXT DEFAULT 'applied',
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (interviewId) REFERENCES interviews (id)
        );
        INSERT INTO candidate_reviews_new SELECT * FROM candidate_reviews;
        DROP TABLE candidate_reviews;
        ALTER TABLE candidate_reviews_new RENAME TO candidate_reviews;
      `);
    }
  } catch (e) {
    console.error("Migration failed:", e);
  }

  // Seed community posts if empty
  try {
    const count = await db.get("SELECT COUNT(*) as count FROM community_posts");
    if (count.count === 0) {
      console.log("Seeding dummy community posts...");
      const seedPosts = [
        { id: "p1", userId: "user_1", userName: "Ravi S.", text: "The new ramp at Bangalore Majestic metro station is finally open! Much easier for wheelchair access now.", tag: "navigation", isMod: 0, likes: 45 },
        { id: "p2", userId: "mod_1", userName: "Anjali Gupta", text: "TCS is hiring PwD candidates for remote software engineering roles. Last date to apply is Friday.", tag: "jobs", isMod: 1, likes: 120 },
        { id: "p3", userId: "user_2", userName: "Kiran Kumar", text: "Can someone help me understand the documents required for the Niramaya Health Insurance scheme?", tag: "schemes", isMod: 0, likes: 14 },
        { id: "p4", userId: "mod_1", userName: "System Alert", text: "Heavy rains reported in Chennai. Several lower access ramps in T. Nagar might be flooded. Please plan travel accordingly.", tag: "alert", isMod: 1, likes: 89 },
        { id: "p5", userId: "user_3", userName: "Meera K.", text: "Attended the inclusive design meetup today. So great to see so many allies working towards accessible tech!", tag: "general", isMod: 0, likes: 32 },
      ];

      for (const p of seedPosts) {
        await db.run(
          `INSERT INTO community_posts (id, userId, userName, text, tag, isMod, likes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.userId, p.userName, p.text, p.tag, p.isMod, p.likes]
        );
      }
    }
  } catch (e) {
    console.error("Community seeding failed:", e);
  }

  return db;
}
