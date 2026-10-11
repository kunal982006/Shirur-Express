import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

const newMenuMap: Record<string, number> = {
  // Soups
  "Veg Manchurian Soup": 70,
  "Veg Manchow Soup": 85,
  "Tomato Soup": 70,

  // Starters
  "Paneer Chilli Dry": 180,
  "Mushroom Chilli Dry": 190,
  "Soyabean Chilli Dry": 130,
  "Veg Manchurian Dry": 190,
  "Veg Manchurian Gravy": 190,
  "Hara Bhara Kebab": 180,

  // Handi
  "Paneer Handi Full": 550,
  "Paneer Handi Half": 350,
  "Veg Handi Full": 450,
  "Veg Handi Half": 300,

  // Special Dish
  "Paneer Masala": 160,
  "Paneer Lapeta": 285,
  "Paneer Angara": 240,
  "Veg Kasturi": 240,
  "Akkha Masoor": 150,
  "Lasooni Palak": 140,
  "Baingan Masala": 130,
  "Mushroom Masala": 170,
  "Veg Maratha": 160,
  "Shev Bhaji": 120,

  // Thali
  "Maharashtrian Sp. Veg Thali": 210,
  "Sp. Pithal Bhakari": 180,

  // Roti
  "Roti": 15,
  "Butter Roti": 20,
  "Naan": 30,
  "Butter Naan": 35,
  "Sadhi Chapati": 15,
  "Bajari Bhakari": 25,

  // Rice
  "Jeera Rice Full": 90,
  "Jeera Rice Half": 50,
  "Steam Rice Full": 90,
  "Steam Rice Half": 50,
  "Indrayani Rice Full": 100,
  "Indrayani Rice Half": 60,
  "Dal Khichdi": 150,
  "Veg Pulao": 160,
  "Veg Biryani": 180,
};

async function main() {
  const providerId = "s7f2xhvq5tdzcpoi89stmdjq";
  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  console.log(`Found ${items.length} items. Processing updates...`);

  for (const item of items) {
    let newPrice = 0;
    
    if (newMenuMap[item.name]) {
      // If it's explicitly in the updated menucard
      const basePrice = newMenuMap[item.name];
      newPrice = Math.round(basePrice * 1.10); // Increase by 10%
      
      const newPriceStr = newPrice.toFixed(2);
      
      if (item.price !== newPriceStr) {
        await db.update(restaurantMenuItems)
          .set({ price: newPriceStr })
          .where(eq(restaurantMenuItems.id, item.id));
        console.log(`Updated [${item.name}]: ${item.price} -> ${newPriceStr}`);
      }
    }
  }

  console.log("Update complete!");
  process.exit(0);
}

main().catch(console.error);
