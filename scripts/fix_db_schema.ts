
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixSchema() {
    try {
        console.log("Attempting to add 'address' column to 'users' table...");
        await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
    `);
        console.log("Success! Added 'address' column.");
    } catch (error) {
        console.error("Error adding column:", error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
