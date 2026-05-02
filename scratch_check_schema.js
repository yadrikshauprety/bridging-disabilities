import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function check() {
  const db = await open({
    filename: './backend/database.sqlite',
    driver: sqlite3.Database
  });
  const schema = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='candidate_reviews'");
  console.log(schema.sql);
  await db.close();
}
check();
