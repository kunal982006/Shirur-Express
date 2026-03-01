import 'dotenv/config';
import { db } from "./server/db";
import { groceryProducts } from "./shared/schema";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
    try {
        const products = await db.select().from(groceryProducts);

        // Count frequencies of image URLs
        const urlCounts = new Map<string, number>();

        for (const p of products) {
            if (p.imageUrl) {
                const url = p.imageUrl;
                urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
            }
        }

        // Sort by frequency descending
        const sorted = Array.from(urlCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        console.log("Top 20 most frequent image URLs in groceryProducts:");
        console.log("These are likely placeholders or generic images:");
        console.log("---------------------------------------------------");

        for (let i = 0; i < Math.min(20, sorted.length); i++) {
            console.log(`[Count: ${sorted[i][1]}] URL: ${sorted[i][0]}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

run();
