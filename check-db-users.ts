import { config } from "dotenv";
config();
import { db, pool } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const input = "9665342713";
    const phoneMatchedUsers = await db.query.users.findMany({ where: eq(users.phone, input) });
    console.log("Phone matches:", phoneMatchedUsers.length);
    for (const u of phoneMatchedUsers) {
      console.log(`ID: ${u.id}, Email: ${u.email}, Username: ${u.username}`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
