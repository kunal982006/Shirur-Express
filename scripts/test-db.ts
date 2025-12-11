
import "dotenv/config";
import { db } from "../server/db";
import { users } from "@shared/schema";

async function testDb() {
    console.log("Testing DB Connection...");
    try {
        const result = await db.select().from(users).limit(1);
        console.log("DB Connection Successful. Users found:", result.length);
    } catch (error) {
        console.error("DB Connection Failed:", error);
        process.exit(1);
    }
}

testDb();
