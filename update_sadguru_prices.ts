import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const providerId = "pdz6mm81kz55n7731u7o4ks7";

  console.log("Checking tables for Sadguru Hotel:", providerId);

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

  console.log("Prices successfully increased by 10%.");
  process.exit(0);
}

main().catch(console.error);
