
import 'dotenv/config';
import { db } from "./server/db";
import { restaurantMenuItems, streetFoodItems } from "./shared/schema";
import { eq, ilike } from "drizzle-orm";

// Comprehensive mapping based on keyword analysis
const imageMapping: Record<string, string> = {
    // Specific items (High priority)
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

    // Categories (Medium priority - longer keywords first)
    "milk shake": "/images/menu-items/milkshake.jpg",
    "milkshake": "/images/menu-items/milkshake.jpg",
    "mastani": "/images/menu-items/milkshake.jpg",
    "cold coffee": "/images/menu-items/coffee.jpg",
    "fried rice": "/images/menu-items/rice_dish.jpg",
    "noodles": "/images/menu-items/noodles.jpg",
    "manchurian": "/images/menu-items/chinese_starter.jpg",
    "chinese": "/images/menu-items/chinese_starter.jpg",
    "thali": "/images/menu-items/indian_thali.jpg",
    "paratha": "/images/menu-items/paratha.jpg",
    "roti": "/images/menu-items/paratha.jpg",
    "naan": "/images/menu-items/paratha.jpg",
    "bhakri": "/images/menu-items/paratha.jpg",

    // Broad Keywords (Lower priority)
    "chicken": "/images/menu-items/chicken_curry.jpg",
    "mutton": "/images/menu-items/mutton_curry.jpg",
    "kheema": "/images/menu-items/mutton_curry.jpg",
    "paneer": "/images/menu-items/paneer_dish.jpg",
    "veg": "/images/menu-items/veg_curry.jpg",
    "pizza": "/images/menu-items/pizza.jpg",
    "burger": "/images/menu-items/burger.jpg",
    "sandwich": "/images/menu-items/sandwich.jpg",
    "toast": "/images/menu-items/sandwich.jpg",
    "fries": "/images/menu-items/fries.jpg",
    "shake": "/images/menu-items/milkshake.jpg",
    "coffee": "/images/menu-items/coffee.jpg",
    "soup": "/images/menu-items/soup.jpg",
    "salad": "/images/menu-items/salad.jpg",
    "pasta": "/images/menu-items/pasta.jpg",
    "egg": "/images/menu-items/egg_curry.jpg",
    "anda": "/images/menu-items/egg_curry.jpg",
    "rice": "/images/menu-items/rice_dish.jpg",
    "pulao": "/images/menu-items/rice_dish.jpg",
    "cake": "/images/menu-items/dessert.jpg",
    "pastry": "/images/menu-items/dessert.jpg",
    "dessert": "/images/menu-items/dessert.jpg",
    "chocolate": "/images/menu-items/dessert.jpg",
};

async function main() {
    console.log("Starting batched menu image update...");

    const menuItems = await db.select().from(restaurantMenuItems);
    console.log(`Found ${menuItems.length} restaurant menu items. Processing...`);

    let updatedCount = 0;
    const batchSize = 10;

    // Create batches
    for (let i = 0; i < menuItems.length; i += batchSize) {
        const batch = menuItems.slice(i, i + batchSize);
        const updates = batch.map(async (item) => {
            const name = item.name.toLowerCase();
            const category = (item.category || "").toLowerCase();
            let matchedImage = null;

            for (const [key, path] of Object.entries(imageMapping)) {
                if (name.includes(key) || category.includes(key)) {
                    matchedImage = path;
                    break;
                }
            }

            if (matchedImage) {
                await db.update(restaurantMenuItems)
                    .set({ imageUrl: matchedImage })
                    .where(eq(restaurantMenuItems.id, item.id));
                return 1;
            }
            return 0;
        });

        const results = await Promise.all(updates);
        updatedCount += results.reduce((a, b) => a + b, 0);
        console.log(`Processed ${Math.min(i + batchSize, menuItems.length)}/${menuItems.length} items...`);
    }

    console.log(`Updated ${updatedCount} restaurant menu items.`);

    // Quick pass for street food
    const streetFoods = await db.select().from(streetFoodItems);
    console.log(`Processing ${streetFoods.length} street food items...`);
    let sfUpdated = 0;

    for (const item of streetFoods) {
        // Just sequential for small list
        const name = item.name.toLowerCase();
        let matchedImage = null;
        for (const [key, path] of Object.entries(imageMapping)) {
            if (name.includes(key)) {
                matchedImage = path;
                break;
            }
        }
        if (matchedImage) {
            await db.update(streetFoodItems)
                .set({ image: matchedImage })
                .where(eq(streetFoodItems.id, item.id));
            sfUpdated++;
        }
    }
    console.log(`Updated ${sfUpdated} street food items.`);

    console.log("Done.");
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
