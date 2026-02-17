import { db } from "./db";
import { users, serviceProviders } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";

async function verifyPocketCafe() {
    console.log("Verifying 'Pocket Cafe'...");

    // 1. Find User
    const user = await db.query.users.findFirst({
        where: ilike(users.username, "Pocket cafe")
    });

    if (!user) {
        console.error("❌ User 'Pocket cafe' not found!");
        process.exit(1);
    }
    console.log(`✅ User found: ID ${user.id} | Username: ${user.username} | Role: ${user.role}`);

    // 2. Find Provider
    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, user.id)
    });

    if (!provider) {
        console.error("❌ Service Provider profile not found for this user!");
        process.exit(1);
    }

    console.log(`✅ Provider found: ID ${provider.id} | Business: ${provider.businessName}`);
    process.exit(0);
}

verifyPocketCafe();
