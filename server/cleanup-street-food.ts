import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, streetFoodItems } from "@shared/schema";
import { eq } from "drizzle-orm";

async function cleanupStreetFood() {
    try {
        console.log("Starting street food cleanup...");

        // 1. Find all street food vendors
        const vendors = await db.query.serviceProviders.findMany({
            where: eq(serviceProviders.categoryId, "street_food")
        });

        if (vendors.length === 0) {
            console.log("No street food vendors found. Cleanup complete.");
            process.exit(0);
        }

        console.log(`Found ${vendors.length} street food vendors. Deleting...`);

        // 2. Delete menu items for these vendors first (foreign key constraint)
        const vendorIds = vendors.map(v => v.id);
        for (const vendorId of vendorIds) {
            const deletedItems = await db.delete(streetFoodItems)
                .where(eq(streetFoodItems.providerId, vendorId))
                .returning({ id: streetFoodItems.id });
            console.log(`Deleted ${deletedItems.length} menu items for vendor ID ${vendorId}`);
        }

        // 3. Delete the vendors
        const deletedVendors = await db.delete(serviceProviders)
            .where(eq(serviceProviders.categoryId, "street_food"))
            .returning({ id: serviceProviders.id, name: serviceProviders.businessName });

        console.log(`Successfully deleted ${deletedVendors.length} street food vendors.`);
        console.log("Cleanup complete!");

        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
}

cleanupStreetFood();
