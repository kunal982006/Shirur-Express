import 'dotenv/config';
import { db } from "../server/db";
import { restaurantMenuItems, serviceProviders } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";
(async () => {
  const ps = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, "%Aroma%"));
  for (const p of ps) {
    console.log("PROVIDER", p.id, p.businessName);
    const items = await db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, p.id));
    for (const i of items) console.log(JSON.stringify([i.id, i.category, i.name, i.price, !!i.imageUrl]));
  }
  process.exit(0);
})();
