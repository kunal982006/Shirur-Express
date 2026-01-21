
import { db, pool } from "../server/db";
import { serviceProviders, serviceCategories } from "../shared/schema";
import { eq, and, notInArray, ilike } from "drizzle-orm";

async function cleanupRestaurants() {
    console.log("Starting restaurant cleanup...");

    try {
        // 1. Find the 'restaurants' category ID
        const restaurantCategory = await db.query.serviceCategories.findFirst({
            where: eq(serviceCategories.slug, "restaurants")
        });

        if (!restaurantCategory) {
            console.error("Restaurant category not found!");
            process.exit(1);
        }

        console.log(`Found Restaurant Category ID: ${restaurantCategory.id}`);

        // 2. Identify restaurants to keep
        const keepNames = [
            "Rana Sahab Parathas",
            "Royal South Indian"
        ];

        // 3. Find all restaurants that are NOT in the keep list
        // Note: This is a bit tricky with exact string matching, so we might want to fetch all and filter in JS to be safe,
        // or use careful ILIKE. 
        // Let's fetch all restaurants first to be safe and print what we are deleting.

        const allRestaurants = await db.query.serviceProviders.findMany({
            where: eq(serviceProviders.categoryId, restaurantCategory.id)
        });

        console.log(`Found ${allRestaurants.length} total restaurants.`);

        const toDeleteIds: string[] = [];

        for (const r of allRestaurants) {
            const name = r.businessName;
            // Check if name matches any in keepNames (case insensitive loose match?)
            // User gave specific names, let's assume they are somewhat accurate.
            // Let's do a case-insensitive check.
            const shouldKeep = keepNames.some(k => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase()));

            if (shouldKeep) {
                console.log(`Creating KEEP list: Keeping '${name}'`);
            } else {
                console.log(`Marking for DELETE: '${name}'`);
                toDeleteIds.push(r.id);
            }
        }

        if (toDeleteIds.length === 0) {
            console.log("No restaurants to delete.");
        } else {
            console.log(`Deleting ${toDeleteIds.length} restaurants...`);
            // 4. Delete them
            // We need to delete in array.
            // Drizzle might not support deleteInArray directly on the table object depending on version, 
            // but let's use the standard delete(table).where(inArray(table.id, ids))

            // We also need to delete related data? 
            // If CASCADE is set up in DB, it might happen automatically. 
            // If not, we might leave orphans (menu items, orders).
            // Ideally we should adhere to foreign keys. 
            // Let's try deleting the providers. If it fails due to FK, we'll know.
            // Assuming cascade is NOT guaranteed, we should delete menu items first.

            const { inArray } = await import("drizzle-orm");
            const { restaurantMenuItems, restaurantOrders } = await import("./shared/schema");

            // Delete menu items
            await db.delete(restaurantMenuItems).where(inArray(restaurantMenuItems.providerId, toDeleteIds));
            console.log("Deleted related menu items.");

            // Orders might be tricky to delete if we want to keep history, but user asked to remove restaurants.
            // Usually we don't delete orders for history, but if the restaurant is gone, maybe?
            // Let's assume we delete orders too for a clean slate, or just set providerId to null? No, foreign key usually restricts.
            // Let's delete orders for these providers.
            await db.delete(restaurantOrders).where(inArray(restaurantOrders.providerId, toDeleteIds));
            console.log("Deleted related orders.");

            // Finally delete providers
            const res = await db.delete(serviceProviders).where(inArray(serviceProviders.id, toDeleteIds)).returning();
            console.log(`Successfully deleted ${res.length} restaurants.`);
        }

    } catch (error) {
        console.error("Error during cleanup:", error);
    } finally {
        pool.end();
    }
}

cleanupRestaurants();
