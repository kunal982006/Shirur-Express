import { db } from "./server/db";
import { streetFoodItems } from "./shared/schema";

async function run() {
    const items = await db.select().from(streetFoodItems);
    console.log("STREET FOOD ITEMS:");
    items.forEach(item => {
        console.log(`- ${item.name}: ${item.imageUrl}`);
    });
    process.exit(0);
}

run().catch(console.error);
