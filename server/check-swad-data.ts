import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function checkSwad() {
    console.log("Checking Swad Hotel Data...");

    const usersList = await db.query.users.findMany({
        where: ilike(users.username, "%Swad%"),
    });
    console.log("Users found:", usersList.map(u => ({ id: u.id, username: u.username, displayName: u.displayName })));

    const providersList = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%Swad%"),
    });

    console.log("\nProviders found:", providersList.map(p => ({
        id: p.id,
        businessName: p.businessName,
        userId: p.userId
    })));

    for (const p of providersList) {
        const items = await db.query.restaurantMenuItems.findMany({
            where: eq(restaurantMenuItems.providerId, p.id)
        });
        console.log(`\nItems for Provider ${p.businessName} (ID: ${p.id}): ${items.length} items`);
    }

    process.exit(0);
}

checkSwad().catch(console.error);
