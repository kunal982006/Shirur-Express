
import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, serviceCategories } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function forceCreate() {
    console.log("Starting force create with category check...");

    // 1. Get Category ID
    const categories = await db.query.serviceCategories.findMany();

    // Find category ID for "restaurants" (or similar)
    // We can filter by slug more robustly
    const restaurantCategory = categories.find(c =>
        c.slug.includes("restaurant") || c.slug.includes("food") || c.slug.includes("cafe")
    );

    if (!restaurantCategory) {
        console.error("Could not find a 'restaurants' or 'cafe' category!");
        console.log("Available:", categories.map(c => c.slug));
        process.exit(1);
    }

    console.log(`Using Category: ${restaurantCategory.name} (ID: ${restaurantCategory.id})`);

    let userId;

    // 2. Get/Create User
    try {
        console.log("Checking user 'Elite cafe'...");
        const user = await db.query.users.findFirst({
            where: eq(users.username, "Elite cafe"),
        });

        if (user) {
            console.log(`User found: ${user.username} (ID: ${user.id})`);
            userId = user.id;
        } else {
            console.log("User not found. Creating...");
            const newUser = await db.insert(users).values({
                username: "Elite cafe",
                email: "elitecafe@example.com", // Added dummy email
                password: "elitecafe@987pass",
                role: "provider",
                displayName: "Elite Cafe"
            }).returning();
            userId = newUser[0].id;
            console.log(`Created user: ${newUser[0].username} (ID: ${userId})`);
        }
    } catch (e: any) {
        console.log("Error handling user:", e.message);
        // If unique constraint failed (username or email), try to fetch again
        const user = await db.query.users.findFirst({
            where: eq(users.username, "Elite cafe"),
        });
        if (user) {
            userId = user.id;
            console.log(`Recovered user: ${user.username}`);
        } else {
            console.log("Could not recover user.");
        }
    }

    if (!userId) {
        console.error("No User ID. Exiting.");
        process.exit(1);
    }

    // 3. Get/Create Provider
    try {
        console.log(`Checking provider for User ID: ${userId}...`);
        const provider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.userId, userId),
        });

        if (provider) {
            console.log(`Provider found: ${provider.businessName} (ID: ${provider.id})`);
        } else {
            console.log("Creating provider...");
            const newProvider = await db.insert(serviceProviders).values({
                userId: userId,
                categoryId: restaurantCategory.id,
                businessName: "Elite cafe",
                contactNumber: "1234567890",
                address: "Shirur",
                description: "Elite Juice & Snacks",
                isOpen: true,
                rating: "0.00"
            }).returning();
            console.log(`Created provider: ${newProvider[0].businessName} (ID: ${newProvider[0].id})`);
        }
    } catch (e: any) {
        console.log("Error handling provider:", e.message);
    }
}

forceCreate().catch(console.error);
