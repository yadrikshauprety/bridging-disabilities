import { getDb } from './db.js';

async function migrate() {
  try {
    const db = await getDb();
    await db.run("ALTER TABLE jobs ADD COLUMN hasBadge INTEGER DEFAULT 0").catch(() => {
      console.log("Column hasBadge already exists or table doesn't exist yet.");
    });
    console.log("Migration complete.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

migrate();
