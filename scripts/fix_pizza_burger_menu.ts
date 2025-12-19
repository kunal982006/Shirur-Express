
import "dotenv/config";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixPizzaBurgerMenu() {
    console.log("Fixing Pizza Burger Express Menu...");

    const createdProviderId = "e0kmuyuszqmc960am5d9gkl7"; // The one I created
    const existingProviderId = "rjawf1f4xpr8a7hht2v68mrt"; // The one likely used by the user ("Pizza burger Express")

    console.log(`Source Provider (Created): ${createdProviderId}`);
    console.log(`Target Provider (User's): ${existingProviderId}`);

    // Verify Target Exists
    const targetProvider = await storage.getServiceProvider(existingProviderId);
    if (!targetProvider) {
        console.error("Target provider not found!");
        process.exit(1);
    }
    console.log(`Target Provider Name: ${targetProvider.businessName}`);

    // Get items from Source
    const sourceItems = await storage.getRestaurantMenuItems(createdProviderId);
    console.log(`Found ${sourceItems.length} items to transfer.`);

    if (sourceItems.length === 0) {
        console.log("No items to transfer. Checking if target already has them...");
        const targetItems = await storage.getRestaurantMenuItems(existingProviderId);
        console.log(`Target has ${targetItems.length} items.`);
        process.exit(0);
    }

    // Transfer Items
    // We can directly update the providerId for these items in the database
    // validation not needed strictly for this cleanup
    for (const item of sourceItems) {
        await db.update(restaurantMenuItems)
            .set({ providerId: existingProviderId })
            .where(eq(restaurantMenuItems.id, item.id));
        console.log(`Transferred: ${item.name}`);
    }

    console.log("Transfer complete.");

    // Delete the duplicate provider I created to avoid confusion?
    // Better to ask or just check if it has any user data.
    // Since I just created it, it should be safe to delete or leave as is. 
    // I will leave it for now but maybe rename it to avoid confusion in logs.

    // Check final count
    const finalItems = await storage.getRestaurantMenuItems(existingProviderId);
    console.log(`Target now has ${finalItems.length} items.`);

    process.exit(0);
}

fixPizzaBurgerMenu().catch(e => {
    console.error(e);
    process.exit(1);
});
