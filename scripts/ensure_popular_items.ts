
import 'dotenv/config';
import { db } from "../server/db";
import { restaurantMenuItems } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
    console.log("Checking for popular restaurant menu items...");

    const popularItems = await db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.isPopular, true));

    console.log(`Found ${popularItems.length} popular items.`);

    if (popularItems.length < 5) {
        console.log("Seeding popular items...");

        // Get all items
        const allItems = await db.select().from(restaurantMenuItems);

        if (allItems.length === 0) {
            console.log("No menu items found to promote!");
            return;
        }

        // Shuffle and pick 10
        const shuffled = allItems.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);

        for (const item of selected) {
            await db.update(restaurantMenuItems)
                .set({ isPopular: true })
                .where(eq(restaurantMenuItems.id, item.id));
            console.log(`Marked ${item.name} as popular.`);
        }
        console.log("Seeding complete.");
    } else {
        console.log("Sufficient popular items exist.");
    }
}

main().catch(console.error).finally(() => process.exit());
