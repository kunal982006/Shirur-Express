import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const providerId = "yunc75wh20fnegyiqpod126g";
  const restaurantItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });
  console.log(JSON.stringify(restaurantItems, null, 2));
  process.exit(0);
}
main().catch(console.error);
