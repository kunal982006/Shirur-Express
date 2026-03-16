import { db } from "./db";
import { serviceProviders, streetFoodItems } from "@shared/schema";
import { eq } from "drizzle-orm";

async function cleanupOldStreetFoodVendors() {
  console.log("Starting cleanup of old street food vendors...");
  try {
    // Street food category ID is typically 'street_food'
    // Let's get them from DB
    const oldVendors = await db.select().from(serviceProviders).where(eq(serviceProviders.categoryId, "street_food"));
    
    console.log(`Found ${oldVendors.length} old street food vendors to delete.`);

    for (const vendor of oldVendors) {
      console.log(`Deleting vendor: ${vendor.businessName} (${vendor.id})`);
      
      // Delete their menu items first
      await db.delete(streetFoodItems).where(eq(streetFoodItems.providerId, vendor.id));
      
      // Delete the vendor
      await db.delete(serviceProviders).where(eq(serviceProviders.id, vendor.id));
    }

    console.log("Cleanup completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupOldStreetFoodVendors();
