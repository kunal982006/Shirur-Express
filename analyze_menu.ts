
import 'dotenv/config';
import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { sql } from "drizzle-orm";

async function analyzeMenu() {
    const items = await db.select({
        name: restaurantMenuItems.name,
        category: restaurantMenuItems.category
    }).from(restaurantMenuItems);

    console.log(`Total items: ${items.length}`);

    // Group by keywords (simplistic)
    const keywords: Record<string, number> = {};
    items.forEach(item => {
        const words = item.name.toLowerCase().split(/\s+/);
        words.forEach(w => {
            if (w.length > 3) {
                keywords[w] = (keywords[w] || 0) + 1;
            }
        });
    });

    const sorted = Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 50);
    console.log("Top 50 Keywords:");
    sorted.forEach(([k, v]) => console.log(`${k}: ${v}`));

    process.exit(0);
}

analyzeMenu().catch(console.error);
