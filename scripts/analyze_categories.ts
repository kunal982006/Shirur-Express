
import { db } from "../server/db";
import { groceryProducts } from "@shared/schema";
import { sql } from "drizzle-orm";

async function analyzeCategories() {
    const results = await db.select({
        category: groceryProducts.category,
        count: sql<number>`count(*)`
    })
        .from(groceryProducts)
        .groupBy(groceryProducts.category)
        .orderBy(groceryProducts.category);

    console.log("Current Categories:");
    results.forEach(r => console.log(`${r.category} (${r.count})`));
    process.exit(0);
}

analyzeCategories().catch(console.error);
