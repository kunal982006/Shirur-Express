import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const providerId = "rcvtojgzqic7e4dhh6r55oa0";

  console.log("Checking tables for Sunshine Cafe:", providerId);

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
