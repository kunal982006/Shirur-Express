
import { db, pool } from "./server/db";
import { serviceProviders, serviceCategories } from "./shared/schema";
import { eq, inArray } from "drizzle-orm"; // Import inArray directly

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
        const allRestaurants = await db.query.serviceProviders.findMany({
            where: eq(serviceProviders.categoryId, restaurantCategory.id)
        });

        console.log(`Found ${allRestaurants.length} total restaurants.`);

        const toDeleteIds: string[] = [];

        for (const r of allRestaurants) {
            const name = r.businessName;
            // Check if name matches any in keepNames (case insensitive)
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

            // Dynamic import not needed if we imported at top, but schema tables need to be imported
            const { restaurantMenuItems, restaurantOrders } = await import("./shared/schema");

            // Delete menu items
            await db.delete(restaurantMenuItems).where(inArray(restaurantMenuItems.providerId, toDeleteIds));
            console.log("Deleted related menu items.");

            // Delete orders
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
