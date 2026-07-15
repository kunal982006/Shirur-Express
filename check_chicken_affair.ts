import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const providerId = "v9yhvrln70w0cjcv2b4wh23b";

  console.log("Checking tables for Chicken Affair:", providerId);

  const restaurantItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });
  
  console.log(`Found ${restaurantItems.length} restaurant menu items.`);
  for (const item of restaurantItems) {
    console.log(`- [${item.id}] ${item.name}: ${item.price}`);
  }

  process.exit(0);
}

main().catch(console.error);
