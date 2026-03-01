import { db } from "./server/db";
import { groceryProducts } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    try {
        const products = await db.select().from(groceryProducts);
        const imageUrls = new Set();

        products.forEach(p => {
            if (p.imageUrl) {
                imageUrls.add(p.imageUrl);
            }
        });

        console.log("Unique Image URLs in groceryProducts:");
        console.log(Array.from(imageUrls));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
