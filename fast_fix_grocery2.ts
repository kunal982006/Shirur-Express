import 'dotenv/config';
import { db } from "./server/db";
import { groceryProducts } from "./shared/schema";
import { eq } from "drizzle-orm";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkUrl(url: string) {
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
        return false;
    }
}

async function run() {
    try {
        console.log("Fetching grocery products from Neon DB...");
        const products = await db.select().from(groceryProducts);
        console.log(`Found ${products.length} grocery products. Checking URLs in batches of 20...`);

        let updatedCount = 0;
        const batchSize = 20;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (p) => {
                    const isOk = await checkUrl(p.imageUrl || "");
                    return { product: p, isOk };
                })
            );

            // Sequential DB update to not overload connection
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

        console.log(`\nFinished! Successfully marked ${updatedCount} items with broken images as out of stock.`);
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

run();
