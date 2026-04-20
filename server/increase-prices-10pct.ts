import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, cakeProducts } from "@shared/schema";
import { eq } from "drizzle-orm";

async function increasePrices() {
  console.log("== Increasing prices by 10% for Restaurants & Cake Shops ==\n");

  // 1. Restaurant Menu Items
  const allMenuItems = await db.select().from(restaurantMenuItems);
  console.log(`📋 Restaurant menu items found: ${allMenuItems.length}`);

  let restaurantUpdated = 0;
  for (const item of allMenuItems) {
    const oldPrice = parseFloat(item.price);
    const newPrice = Math.ceil(oldPrice * 1.10); // 10% increase, rounded up
    await db.update(restaurantMenuItems)
      .set({ price: newPrice.toFixed(2) })
      .where(eq(restaurantMenuItems.id, item.id));
    restaurantUpdated++;
  }
  console.log(`✅ Updated ${restaurantUpdated} restaurant menu items\n`);

  // 2. Cake Products
  const allCakes = await db.select().from(cakeProducts);
  console.log(`📋 Cake products found: ${allCakes.length}`);

  let cakeUpdated = 0;
  for (const cake of allCakes) {
    const oldPrice = parseFloat(cake.price);
    const newPrice = Math.ceil(oldPrice * 1.10);

    // Also update weightOptions if they exist
    let updatedWeightOptions = cake.weightOptions;
    if (updatedWeightOptions && Array.isArray(updatedWeightOptions)) {
      updatedWeightOptions = updatedWeightOptions.map((opt: any) => ({
        ...opt,
        price: Math.ceil(opt.price * 1.10),
      }));
    }

    await db.update(cakeProducts)
      .set({
        price: newPrice.toFixed(2),
        ...(updatedWeightOptions ? { weightOptions: updatedWeightOptions } : {}),
      })
      .where(eq(cakeProducts.id, cake.id));
    cakeUpdated++;
  }
  console.log(`✅ Updated ${cakeUpdated} cake products\n`);

  console.log(`🎉 DONE! Total updated: ${restaurantUpdated} restaurant items + ${cakeUpdated} cake items`);
  console.log(`⚠️  Street food items were NOT touched.`);
  process.exit(0);
}

increasePrices().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
