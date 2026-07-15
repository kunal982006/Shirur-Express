import { db } from "./server/db";
import { streetFoodItems, restaurantMenuItems, cakeProducts, groceryProducts, serviceOfferings } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const providerId = "zh1r6u0y7vrk02t6vcn3cok8";

  console.log("Checking tables for provider:", providerId);

  // 1. Street Food Items
  const streetFood = await db.query.streetFoodItems.findMany({
    where: eq(streetFoodItems.providerId, providerId)
  });
  
  if (streetFood.length > 0) {
    console.log(`Found ${streetFood.length} street food items. Updating prices...`);
    for (const item of streetFood) {
      const oldPrice = parseFloat(item.price);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(streetFoodItems)
          .set({ price: newPrice.toString() })
          .where(eq(streetFoodItems.id, item.id));
        console.log(`Updated streetFoodItem ${item.name}: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  // 2. Restaurant Menu Items
  const restaurantItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  if (restaurantItems.length > 0) {
    console.log(`Found ${restaurantItems.length} restaurant menu items. Updating prices...`);
    for (const item of restaurantItems) {
      const oldPrice = parseFloat(item.price as string);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(restaurantMenuItems)
          .set({ price: newPrice })
          .where(eq(restaurantMenuItems.id, item.id));
        console.log(`Updated restaurantMenuItem ${item.name}: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  // 3. Cake Products
  const cakes = await db.query.cakeProducts.findMany({
    where: eq(cakeProducts.providerId, providerId)
  });

  if (cakes.length > 0) {
    console.log(`Found ${cakes.length} cake products. Updating prices...`);
    for (const item of cakes) {
      const oldPrice = parseFloat(item.price as string);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(cakeProducts)
          .set({ price: newPrice })
          .where(eq(cakeProducts.id, item.id));
        console.log(`Updated cakeProduct ${item.name}: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  // 4. Grocery Products
  const groceries = await db.query.groceryProducts.findMany({
    where: eq(groceryProducts.providerId, providerId)
  });

  if (groceries.length > 0) {
    console.log(`Found ${groceries.length} grocery products. Updating prices...`);
    for (const item of groceries) {
      const oldPrice = parseFloat(item.price);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(groceryProducts)
          .set({ price: newPrice.toString() })
          .where(eq(groceryProducts.id, item.id));
        console.log(`Updated groceryProduct ${item.name}: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  // 5. Service Offerings
  const offerings = await db.query.serviceOfferings.findMany({
    where: eq(serviceOfferings.providerId, providerId)
  });

  if (offerings.length > 0) {
    console.log(`Found ${offerings.length} service offerings. Updating prices...`);
    for (const item of offerings) {
      const oldPrice = parseFloat(item.price as string);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(serviceOfferings)
          .set({ price: newPrice })
          .where(eq(serviceOfferings.id, item.id));
        console.log(`Updated serviceOffering ${item.name}: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
