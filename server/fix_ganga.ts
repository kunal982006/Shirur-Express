import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders, users } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

async function check() {
    // We want to force all "Ganga" items to the user's correct provider ID.
    const goodProviderId = "s7f2xhvq5tdzcpoi89stmdjq"; 
    
    // Find all items created by our script (they had unique names like "टोमॅटो सूप (Tomato Soup)")
    const badItems = [
        "टोमॅटो सूप (Tomato Soup)",
        "व्हेज मंचाऊ सूप (Veg Manchow Soup)",
        "व्हेज मनचोरीयन सूप (Veg Manchurian Soup)"
    ];
    
    const items = await db.query.restaurantMenuItems.findMany({
        where: inArray(restaurantMenuItems.name, badItems)
    });
    
    if (items.length > 0) {
        const itemProviderId = items[0].providerId;
        console.log(`The items are under provider ID: ${itemProviderId}`);
        
        // Let's migrate them right now! 
        // We know what the names are, basically all items that have " (English Name)" in the name.
        const allItems = await db.query.restaurantMenuItems.findMany({
            where: eq(restaurantMenuItems.providerId, itemProviderId)
        });
        
        console.log(`Found ${allItems.length} total items under the bad provider ID.`);
        
        const result = await db.update(restaurantMenuItems)
            .set({ providerId: goodProviderId })
            .where(eq(restaurantMenuItems.providerId, itemProviderId))
            .returning();
            
        console.log(`Successfully migrated ${result.length} items to the correct Ganga Grand provider ${goodProviderId}`);
        
        // Also let's try to delete the bad provider if it does exist
        const bad = await db.query.serviceProviders.findFirst({
             where: eq(serviceProviders.id, itemProviderId)
        });
        if (bad) {
             console.log(`Found bad provider: Name: ${bad.businessName}`);
             await db.delete(serviceProviders).where(eq(serviceProviders.id, bad.id));
             console.log("Deleted bad provider.");
        } else {
             console.log("Bad provider did not exist in db.");
        }
    } else {
        console.log("Could not find the items.");
    }
}

check().then(() => process.exit(0)).catch(console.error);
