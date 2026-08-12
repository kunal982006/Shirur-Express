import { config } from "dotenv";
config();
import { db, pool } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq, or, ilike } from "drizzle-orm";
import bcrypt from "bcrypt";

async function main() {
  try {
    const input = "sairefrigeration@gmail.com";
    const password = "dummy"; // I don't know the password, just want to see if it fetches users
    
    console.log("Input email:", input);
    const baseEmail = input.toLowerCase().replace(/\+\d+@/, '@');
    const matchedUsers = await db.query.users.findMany({
      where: or(
        eq(users.email, baseEmail),
        ilike(users.email, baseEmail.replace('@', '+%@'))
      )
    });
    
    console.log("Matched users count:", matchedUsers.length);
    for (const u of matchedUsers) {
      console.log("- User:", u.username, "| email:", u.email);
    }
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
