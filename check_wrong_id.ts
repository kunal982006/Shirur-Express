
import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function check() {
    const wrongId = "ppxu4lbqeheqycjepjcfm7uz";
    const items = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, wrongId)
    });

    console.log(`Total items in Hotel Abhiruchi: ${items.length}`);
    const categories = [...new Set(items.map(i => i.category))];
    console.log("Categories:", categories.join(", "));
    
    // Check for items like "Jumbo Ghee Paper Dosa"
    const dosaItems = items.filter(i => i.name.includes("Dosa") || i.category?.includes("Dosa"));
    console.log(`Potential Dosa items to move: ${dosaItems.length}`);
    
    process.exit(0);
}

check();
