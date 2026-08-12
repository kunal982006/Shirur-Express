import { config } from "dotenv";
config();
import { db, pool } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

async function main() {
  try {
    const input = "sairefrigeration@gmail.com";
    const baseEmail = input.toLowerCase().replace(/\+\d+@/, '@');
    
    // Select
    const matchedUsersSelect = await db.select().from(users).where(
      or(
        eq(users.email, baseEmail),
        sql`${users.email} LIKE ${baseEmail.replace('@', '+%@')}`
      )
    );
    console.log("Select count:", matchedUsersSelect.length);
    if (matchedUsersSelect.length > 0) console.log(matchedUsersSelect[0].id);

    // Query
    const matchedUsersQuery = await db.query.users.findMany({
      where: or(
        eq(users.email, baseEmail),
        sql`${users.email} LIKE ${baseEmail.replace('@', '+%@')}`
      )
    });
    console.log("Query count:", matchedUsersQuery.length);
    if (matchedUsersQuery.length > 0) console.log(matchedUsersQuery[0].id);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
