
import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function listProviders() {
    console.log("Listing all providers...");
    const providers = await db.query.serviceProviders.findMany();
    providers.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.businessName}, UserID: ${p.userId}`);
    });

    console.log("\nListing users matching 'Elite'...");
    const eliteUsers = await db.query.users.findMany({
        where: ilike(users.username, "%Elite%"),
    });
    eliteUsers.forEach(u => {
        console.log(`ID: ${u.id}, Username: ${u.username}, Role: ${u.role}`);
    });
}

listProviders().catch(console.error);
