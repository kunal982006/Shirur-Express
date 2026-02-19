
import { db } from "./db";
import { streetFoodItems, restaurantMenuItems, cakeProducts } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";

// Map keyword to local image path
const imageMapping: Record<string, string> = {
    "vada pav": "/images/menu-items/vada_pav.jpg",
    "misal": "/images/menu-items/misal_pav.jpg", // Matches Misal Pav
    "samosa": "/images/menu-items/samosa.jpg",
    "pani puri": "/images/menu-items/pani_puri.jpg",
    "biryani": "/images/menu-items/chicken_biryani.jpg", // Default biryani image
    "butter chicken": "/images/menu-items/butter_chicken.jpg",
    "paneer tikka": "/images/menu-items/paneer_tikka.jpg",
    "chole bhature": "/images/menu-items/chole_bhature.jpg",
    "momo": "/images/menu-items/momos.jpg",
    "gulab jamun": "/images/menu-items/gulab_jamun.jpg",
};

async function assignImages() {
    console.log("Assigning popular images to database items...");

    // 1. Update Street Food Items
    const streetFoods = await db.select().from(streetFoodItems);
    for (const item of streetFoods) {
        let matchedImage = null;
        const lowerName = item.name.toLowerCase();

        for (const [key, path] of Object.entries(imageMapping)) {
            if (lowerName.includes(key)) {
                matchedImage = path;
                break;
            }
        }

        if (matchedImage) {
            console.log(`[Street Food] Updating '${item.name}' -> ${matchedImage}`);
            await db.update(streetFoodItems)
                .set({ image: matchedImage, isPopular: true }) // Also mark as popular!
                .where(eq(streetFoodItems.id, item.id));
        }
    }

    // 2. Update Restaurant Menu Items
    // We only want to update items if they match high confidence? 
    // Or just update any matching item. Let's update any matching item for now.
    const menuItems = await db.select().from(restaurantMenuItems);
    for (const item of menuItems) {
        let matchedImage = null;
        const lowerName = item.name.toLowerCase();

        for (const [key, path] of Object.entries(imageMapping)) {
            if (lowerName.includes(key)) {
                matchedImage = path;
                break;
            }
        }

        if (matchedImage) {
            console.log(`[Restaurant Item] Updating '${item.name}' -> ${matchedImage}`);
            // Only update if it doesn't have an image or if we want to force override?
            // Let's force override to ensure quality, but only if it's a generic image or none.
            // Actually, the user wants these "popular" items to have THESE images. 
            await db.update(restaurantMenuItems)
                .set({ imageUrl: matchedImage, isPopular: true }) // Mark popular
                .where(eq(restaurantMenuItems.id, item.id));
        }
    }

    // 3. Cakes - We don't have cake images downloaded yet, skipping cakes for this specific batch 
    // unless 'gulab jamun' is a cake? No. 

    console.log("Database update complete.");
    process.exit(0);
}

assignImages().catch(console.error);
