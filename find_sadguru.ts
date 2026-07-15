import { db } from "./server/db";
import { serviceProviders, streetFoodItems, restaurantMenuItems, cakeProducts, groceryProducts, serviceOfferings } from "./shared/schema";
import { ilike } from "drizzle-orm";

async function main() {
  console.log("Searching for providers matching 'Sadguru'...");
  const providers = await db.query.serviceProviders.findMany({
    where: ilike(serviceProviders.businessName, "%Sadguru%")
  });

  if (providers.length === 0) {
    console.log("No Sadguru providers found.");
    process.exit(0);
  }

  for (const p of providers) {
    console.log(`\nFound provider: ${p.businessName} (ID: ${p.id})`);
    
    // Check all tables for this provider
    const streetFood = await db.query.streetFoodItems.findMany({ where: (t, { eq }) => eq(t.providerId, p.id) });
    console.log(`- streetFoodItems: ${streetFood.length}`);
    
    const restaurant = await db.query.restaurantMenuItems.findMany({ where: (t, { eq }) => eq(t.providerId, p.id) });
    console.log(`- restaurantMenuItems: ${restaurant.length}`);
    
    const cakes = await db.query.cakeProducts.findMany({ where: (t, { eq }) => eq(t.providerId, p.id) });
    console.log(`- cakeProducts: ${cakes.length}`);
    
    const groceries = await db.query.groceryProducts.findMany({ where: (t, { eq }) => eq(t.providerId, p.id) });
    console.log(`- groceryProducts: ${groceries.length}`);
    
    const offerings = await db.query.serviceOfferings.findMany({ where: (t, { eq }) => eq(t.providerId, p.id) });
    console.log(`- serviceOfferings: ${offerings.length}`);
  }
  
  process.exit(0);
}

main().catch(console.error);
