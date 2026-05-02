import { getDb } from './db.js';

async function test() {
  const db = await getDb();
  const users = await db.all("SELECT email, name, trustedContact FROM users");
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

test();
