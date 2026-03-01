import { db } from "./server/db";
import { groceryProducts } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkUrl(url: string): Promise<boolean> {
    if (!url || url.trim() === "" || url === "null" || url === "undefined") {
        return false;
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url.trim(), { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        return false; // Broken or timeout
    }
}

async function run() {
    try {
        console.log("Fetching grocery products...");
        const products = await db.select().from(groceryProducts);
        console.log(`Found ${products.length} grocery products. Checking URLs in batches...`);

        let updatedCount = 0;
        const batchSize = 10; // Check 10 URLs at a time

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            // Check URLs concurrently
            const results = await Promise.all(
                batch.map(async (p) => {
                    const isOk = await checkUrl(p.imageUrl || "");
                    return { product: p, isOk };
                })
            );

            // Update broken ones
            for (const { product, isOk } of results) {
                if (!isOk) {
                    await db.update(groceryProducts)
                        .set({ inStock: false })
                        .where(eq(groceryProducts.id, product.id));
                    updatedCount++;
                }
            }
            console.log(`Processed ${Math.min(i + batchSize, products.length)}/${products.length}`);
        }

        console.log(`\nFinished! Marked ${updatedCount} items with broken/missing images as out of stock.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
