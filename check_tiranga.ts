import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const providerId = "haz4toiex4r3sn6kn1za5c5f";

  console.log("Checking tables for Hotel Tiranga:", providerId);

  const restaurantItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });
  
  console.log(`Found ${restaurantItems.length} restaurant menu items.`);
  for (const item of restaurantItems.slice(0, 20)) {
    console.log(`- [${item.id}] ${item.name}: ${item.price}`);
  }

  process.exit(0);
}

main().catch(console.error);
