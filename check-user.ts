import { config } from "dotenv";
config();
import { db, pool } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq, or } from "drizzle-orm";

async function main() {
  try {
    const user = await db.query.users.findMany({
      where: or(
        eq(users.phone, "9665342713"),
        eq(users.username, "9665342713")
      )
    });
    console.log("User:", user);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
