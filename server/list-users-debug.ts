
import 'dotenv/config';
import { db } from "./db";
import { users } from "@shared/schema";

async function listUsers() {
    console.log("Listing all users...");
    const allUsers = await db.query.users.findMany();
    allUsers.forEach(u => {
        console.log(`ID: ${u.id}, Username: '${u.username}', Role: ${u.role}`);
    });
}

listUsers().catch(console.error);
