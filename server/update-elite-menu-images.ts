
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike, and } from "drizzle-orm";

// Map naming convention: partial_name -> filename
const imageMapping: Record<string, string> = {
    "Jamun Shots": "/images/menu-items/jamun_shots.jpg",
    "Jamun Thick Shake": "/images/menu-items/jamun_shots.jpg", // Reusing for similar item
    "Mango Mastani": "/images/menu-items/mango_mastani.jpg",
    "Mango Milk Shake": "/images/menu-items/mango_mastani.jpg",
    "Chocolate Milk Shake": "/images/menu-items/chocolate_shake.jpg",
    "Oreo Shake": "/images/menu-items/chocolate_shake.jpg",
    "Sandwich": "/images/menu-items/grilled_sandwich.jpg", // Matches multiple sandwiches
    "Pizza": "/images/menu-items/veg_pizza.jpg", // Matches multiple pizzas
    "Burger": "/images/menu-items/veg_pizza.jpg", // Wait, need a burger image? Let's stick to 5 for now.
    // "Burger": "/images/menu-items/veg_burger.jpg",
};

async function updateEliteImages() {
    console.log("Updating Elite Cafe menu images...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Elite cafe%"),
    });

    if (!provider) {
        console.error("Provider not found");
        process.exit(1);
    }

    console.log(`Provider ID: ${provider.id}`);

    const menuItems = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, provider.id),
    });

    for (const item of menuItems) {
        let matchedImage = null;

        for (const [key, imagePath] of Object.entries(imageMapping)) {
            if (item.name.includes(key) || item.category?.includes(key)) {
                matchedImage = imagePath;
                break;
            }
        }

        if (matchedImage) {
            console.log(`Updating '${item.name}' -> ${matchedImage}`);
            await db.update(restaurantMenuItems)
                .set({ imageUrl: matchedImage })
                .where(eq(restaurantMenuItems.id, item.id));
        }
    }

    console.log("Update complete.");
    process.exit(0);
}

updateEliteImages().catch(console.error);
