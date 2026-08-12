import { config } from "dotenv";
config();
import { db, pool } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq, or, sql } from "drizzle-orm";

async function main() {
  try {
    const input = "9665342713";
    console.log("Input:", input);
    
    // Testing phone query
    const phoneMatchedUsers = await db.query.users.findMany({ where: eq(users.phone, input) });
    console.log("Phone matches:", phoneMatchedUsers.length);
    if (phoneMatchedUsers.length > 0) {
      console.log("Phone Match 0:", phoneMatchedUsers[0].username);
    }
    
    // Testing email query
    const baseEmail = "sairefrigeration@gmail.com".replace(/\+\d+@/, '@');
    const emailMatchedUsers = await db.select().from(users).where(
      or(
        eq(users.email, baseEmail),
        sql`${users.email} LIKE ${baseEmail.replace('@', '+%@')}`
      )
    );
    console.log("Email matches:", emailMatchedUsers.length);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
