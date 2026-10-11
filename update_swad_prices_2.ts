import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

const newMenuMap: Record<string, number> = {
  "Veg Thali": 150,
  "Special Veg Thali": 220,
  "Bajari Bhakri": 25,
  "Tandoor Roti": 15,
  "Butter Tandoor Roti": 25,
  "Naan": 35,
  "Butter Naan": 40,
  "Butter Garlic Naan": 40, // May not exist, we'll check
  "Sadhi Mutton Thali": 300,
  "Special Mutton Thali": 450,
  "Sadhi Chicken Thali": 200,
  "Special Chicken Thali": 300,
  "Macchi Thali": 190,
  "Special Macchi Thali": 250,
  "Anda Thali": 160,
  "Special Anda Thali": 200
};

async function main() {
  const providerId = "chcs2768s4dq7hrr9l1sev3l";
  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  console.log(`Found ${items.length} items. Processing updates...`);

  for (const item of items) {
    let newPrice = 0;
    
    if (newMenuMap[item.name]) {
      // 1. If it's explicitly in the updated menucard
      const basePrice = newMenuMap[item.name];
      newPrice = Math.round(basePrice * 1.15); // Increase by 15%
      
      const newPriceStr = newPrice.toFixed(2);
      
      if (item.price !== newPriceStr) {
        await db.update(restaurantMenuItems)
          .set({ price: newPriceStr })
          .where(eq(restaurantMenuItems.id, item.id));
        console.log(`Updated [${item.name}]: ${item.price} -> ${newPriceStr}`);
      }
    }
  }

  console.log("Thali and Roti update complete!");
  process.exit(0);
}

main().catch(console.error);
