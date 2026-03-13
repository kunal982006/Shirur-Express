import 'dotenv/config';
import { db } from './db';
import { users, serviceProviders, restaurantMenuItems } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function run() {
    console.log("Starting Abhiruchi fix...");

    // The account with 0 items (The correct one to keep according to username login matching)
    const targetUserId = "nyx3sg7eu8thrmky5zdurvyb";
    const targetProviderId = "ppxu4lbqeheqycjepjcfm7uz";
    
    // The account with 198 items (The duplicate to delete)
    const duplicateUserId = "e9i98wnmkwow45x2i824p9g8";
    const duplicateProviderId = "ljhwcx8nh5tc50nftc0ggryc";

    // 1. Move menu items from duplicate to target provider
    console.log(`Moving menu items from ${duplicateProviderId} to ${targetProviderId}...`);
    const updateResult = await db.update(restaurantMenuItems)
        .set({ providerId: targetProviderId })
        .where(eq(restaurantMenuItems.providerId, duplicateProviderId));
    
    // Check how many items were updated
    const updatedCount = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, targetProviderId)
    });
    console.log(`Moved complete. Target provider now has ${updatedCount.length} items.`);

    // 2. Rename the target provider business name to "Hotel Abhiruchi"
    console.log("Renaming target provider...");
    await db.update(serviceProviders)
        .set({ businessName: "Hotel Abhiruchi" })
        .where(eq(serviceProviders.id, targetProviderId));
    
    // 3. Delete the duplicate provider and user
    // In our schema, deleting a user doesn't strictly cascade to the provider unless explicitly set, 
    // so we delete provider first.
    console.log(`Deleting duplicate provider (${duplicateProviderId})...`);
    await db.delete(serviceProviders)
        .where(eq(serviceProviders.id, duplicateProviderId));
        
    console.log(`Deleting duplicate user (${duplicateUserId})...`);
    await db.delete(users)
        .where(eq(users.id, duplicateUserId));
        
    console.log("🎉 SUCCESS! Abhiruchi account fixed.");
    process.exit(0);
}
run();
