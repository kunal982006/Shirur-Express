
import "dotenv/config";
import { db } from "../server/db";
import { users, serviceProviders, restaurantMenuItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkAssociation() {
    console.log("=== Checking Menu Item Association ===\n");

    const username = "chicken affair";

    // 1. Find User
    const user = await db.query.users.findFirst({
        where: eq(users.username, username)
    });

    if (!user) {
        console.error(`User '${username}' not found.`);
        process.exit(1);
    }
    console.log(`User Found: ${user.username} (ID: ${user.id})`);

    // 2. Find Service Provider
    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, user.id)
    });

    if (!provider) {
        console.error(`Service Provider for user ${user.id} not found.`);
        process.exit(1);
    }
    console.log(`Provider Found: ${provider.businessName} (ID: ${provider.id})`);

    // 3. Check Items with Provider ID
    const itemsByProviderId = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, provider.id)
    });
    console.log(`Items associated with provider.id (${provider.id}): ${itemsByProviderId.length}`);

    // 4. Check Items with User ID
    const itemsByUserId = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, user.id)
    });
    console.log(`Items associated with user.id (${user.id}): ${itemsByUserId.length}`);

    if (itemsByUserId.length > 0) {
        console.warn("\n⚠️ WARNING: Found items associated with User ID instead of Provider ID!");
    } else if (itemsByProviderId.length === 0) {
        console.warn("\n⚠️ WARNING: No items found for either ID!");
    } else {
        console.log("\n✅ Items seem correctly associated with Provider ID.");
    }

    process.exit(0);
}

checkAssociation();
