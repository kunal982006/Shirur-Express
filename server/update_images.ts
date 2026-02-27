import { db } from "./db";
import { streetFoodItems, restaurantMenuItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fetchMealImages(category: string): Promise<string[]> {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${category}`);
        const data = await res.json();
        if (data && data.meals) {
            return data.meals.map((m: any) => m.strMealThumb);
        }
    } catch (e) {
        console.error(`Failed to fetch ${category} meals`, e);
    }
    return [];
}

export async function updateStreetFoodImagesDirectly() {
    try {
        let updatedCount = 0;

        // Fetch reliable, beautiful images
        const indianImages = await fetchMealImages('Indian');
        const chineseImages = await fetchMealImages('Chinese');
        const americanImages = await fetchMealImages('American');
        const mexicanImages = await fetchMealImages('Mexican');

        const allImages = [...indianImages, ...chineseImages, ...americanImages, ...mexicanImages];

        if (allImages.length === 0) {
            return { success: false, message: "Could not fetch images from TheMealDB" };
        }

        // 1. Update Street Food Items
        const streetFoods = await db.select().from(streetFoodItems);
        for (let i = 0; i < streetFoods.length; i++) {
            const item = streetFoods[i];
            const newImage = allImages[i % allImages.length];
            await db.update(streetFoodItems).set({ imageUrl: newImage }).where(eq(streetFoodItems.id, item.id));
            updatedCount++;
        }

        // 2. Update Restaurant Menu Items (shift the array start so it stays unique)
        const menuItems = await db.select().from(restaurantMenuItems);
        for (let i = 0; i < menuItems.length; i++) {
            const item = menuItems[i];
            // Offset the index by streetFoods.length to avoid duplicate patterns
            const imgIndex = (i + streetFoods.length) % allImages.length;
            const newImage = allImages[imgIndex];
            await db.update(restaurantMenuItems).set({ imageUrl: newImage }).where(eq(restaurantMenuItems.id, item.id));
            updatedCount++;
        }

        console.log(`Finished updating ${updatedCount} items with unique images!`);
        return { success: true, count: updatedCount };
    } catch (err) {
        console.error(err);
        return { success: false, error: err };
    }
}
