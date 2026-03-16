
import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function verify() {
    const providerId = "ppxu4lbqeheqycjepjcfm7uz";
    
    try {
        const items = await db.query.restaurantMenuItems.findMany({
            where: eq(restaurantMenuItems.providerId, providerId)
        });

        console.log(`Found ${items.length} items for Hotel Abhiruchi.`);
        
        // Group by category for cleaner output
        const categorized: Record<string, string[]> = {};
        items.forEach(item => {
            if (!categorized[item.category!]) {
                categorized[item.category!] = [];
            }
            categorized[item.category!].push(`${item.name} (Rs. ${item.price})`);
        });

        console.log("\nCategorized Items:");
        for (const [category, names] of Object.entries(categorized)) {
            console.log(`\n--- ${category} ---`);
            names.forEach(name => console.log(`  - ${name}`));
        }

    } catch (error) {
        console.error("Error during verification:", error);
    } finally {
        process.exit(0);
    }
}

verify();
