import 'dotenv/config';
import { db } from "./server/db";
import { streetFoodItems, restaurantMenuItems } from "./shared/schema";

async function checkUrls() {
    try {
        const streetFood = await db.select().from(streetFoodItems);
        const restaurants = await db.select().from(restaurantMenuItems);
        
        const nonCloudinaryStreetFood = streetFood.filter(item => 
          item.imageUrl && item.imageUrl.startsWith("http") && !item.imageUrl.includes("res.cloudinary.com")
        );
        const nonCloudinaryRestaurants = restaurants.filter(item => 
          item.imageUrl && item.imageUrl.startsWith("http") && !item.imageUrl.includes("res.cloudinary.com")
        );
        
        const output = [
          `Non-Cloudinary External Street Food Items: ${nonCloudinaryStreetFood.length}`,
          ...nonCloudinaryStreetFood.map(item => `- ${item.name}: ${item.imageUrl}`),
          "",
          `Non-Cloudinary External Restaurant Items: ${nonCloudinaryRestaurants.length}`,
          ...nonCloudinaryRestaurants.map(item => `- ${item.name}: ${item.imageUrl}`)
        ].join("\n");
        
        const fs = await import('fs');
        fs.writeFileSync('non_cloudinary_urls.txt', output);
        console.log("Results written to non_cloudinary_urls.txt");
    } catch (e) {
        console.error("Database query failed:", e);
    }
}

checkUrls().catch(console.error);
