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
  `);

  // Ensure udid_applications has aadhar column (for existing databases)
  try {
    await db.run("ALTER TABLE udid_applications ADD COLUMN aadhar TEXT");
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      // Column already exists
    } else {
      console.warn("Migration error:", e.message);
    }
  }

  return db;
}
