
import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function verifyEliteCafe() {
    console.log("Verifying 'Elite cafe'...");

    // Check User
    const user = await db.query.users.findFirst({
        where: eq(users.username, "Elite cafe"),
    });

    if (user) {
        console.log(`User found: ${user.username} (ID: ${user.id})`);

        // Check Provider linked to this user
        const providerByUser = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.userId, user.id),
        });

        if (providerByUser) {
            console.log(`Provider found for user: ${providerByUser.businessName} (ID: ${providerByUser.id})`);
        } else {
            console.log("User exists but NO provider record found for this user.");
            // Create provider if missing
            const newProvider = await db.insert(serviceProviders).values({
                userId: user.id,
                businessName: "Elite cafe",
                serviceCategory: "cafe",
                contactNumber: "1234567890", // Placeholder
                address: "Shirur", // Placeholder
                description: "Elite Juice & Snacks",
                isOpen: true
            }).returning();
            console.log(`Created provider: ${newProvider[0].businessName} (ID: ${newProvider[0].id})`);
        }

    } else {
        console.log("User 'Elite cafe' NOT found. Creating user...");
        // Create user
        const newUser = await db.insert(users).values({
            username: "Elite cafe",
            password: "elitecafe@987pass",
            role: "provider",
            displayName: "Elite Cafe"
        }).returning();
        console.log(`Created user: ${newUser[0].username} (ID: ${newUser[0].id})`);

        // Create provider
        const newProvider = await db.insert(serviceProviders).values({
            userId: newUser[0].id,
            businessName: "Elite cafe",
            serviceCategory: "cafe",
            contactNumber: "1234567890",
            address: "Shirur",
            description: "Elite Juice & Snacks",
            isOpen: true
        }).returning();
        console.log(`Created provider: ${newProvider[0].businessName} (ID: ${newProvider[0].id})`);
    }
}

verifyEliteCafe().catch(console.error);
