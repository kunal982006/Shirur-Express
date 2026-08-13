import { db } from "./server/db";
import { restaurantMenuItems, serviceProviders } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Fetching provider Hotel Rassa Bhakri...");
  const provider = await db.query.serviceProviders.findFirst({
    where: eq(serviceProviders.businessName, "Hotel Rassa Bhakri")
  });

  if (!provider) {
    console.error("Provider not found");
    process.exit(1);
  }

  console.log(`Found provider: ${provider.id} (${provider.businessName})`);

  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, provider.id)
  });

  console.log(`Found ${items.length} items. Updating prices by +15%...`);

  let updatedCount = 0;
  for (const item of items) {
    const oldPrice = parseFloat(item.price as string);
    const newPrice = Math.round(oldPrice * 1.15);
    
    await db.update(restaurantMenuItems)
      .set({ price: newPrice.toString() })
      .where(eq(restaurantMenuItems.id, item.id));
      
    console.log(`Updated ${item.name}: ${oldPrice} -> ${newPrice}`);
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} items.`);
  process.exit(0);
}

main().catch(console.error);
