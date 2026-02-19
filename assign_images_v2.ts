
import 'dotenv/config';
// Basic script to update DB without complex imports if possible
// We need to import the schema and db instance
// server/db.ts exports 'db'

import { db } from "./server/db";
import { streetFoodItems, restaurantMenuItems } from "./shared/schema";
import { eq, ilike } from "drizzle-orm";

const imageMapping = {
    "vada pav": "/images/menu-items/vada_pav.jpg",
    "misal": "/images/menu-items/misal_pav.jpg",
    "samosa": "/images/menu-items/samosa.jpg",
    "pani puri": "/images/menu-items/pani_puri.jpg",
    "biryani": "/images/menu-items/chicken_biryani.jpg",
    "butter chicken": "/images/menu-items/butter_chicken.jpg",
    "paneer tikka": "/images/menu-items/paneer_tikka.jpg",
    "chole": "/images/menu-items/chole_bhature.jpg",
    "momo": "/images/menu-items/momos.jpg",
    "gulab jamun": "/images/menu-items/gulab_jamun.jpg",
};

async function main() {
    console.log("Starting DB update...");

    // Process Street Food
    console.log("Checking Street Food...");
    const foods = await db.select().from(streetFoodItems);
    for (const item of foods) {
        const name = item.name.toLowerCase();
        for (const [key, path] of Object.entries(imageMapping)) {
            if (name.includes(key)) {
                console.log(`Updating Street Food: ${item.name}`);
                await db.update(streetFoodItems)
                    .set({ image: path, isPopular: true })
                    .where(eq(streetFoodItems.id, item.id));
            }
        }
    }

    // Process Restaurant Items
    console.log("Checking Restaurant Menus...");
    const menuItems = await db.select().from(restaurantMenuItems);
    for (const item of menuItems) {
        const name = item.name.toLowerCase();
        for (const [key, path] of Object.entries(imageMapping)) {
            if (name.includes(key)) {
                console.log(`Updating Menu Item: ${item.name}`);
                await db.update(restaurantMenuItems)
                    .set({ imageUrl: path, isPopular: true })
                    .where(eq(restaurantMenuItems.id, item.id));
            }
        }
    }

    console.log("Done.");
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
