
import { db } from "./server/db";
import { serviceProviders, serviceOfferings, reviews, bookings, invoices, providerOffers, cakeProducts, groceryProducts, streetFoodItems, restaurantMenuItems, restaurantOrders, streetFoodOrders, groceryOrders } from "./shared/schema";
import { eq, and, ne } from "drizzle-orm";

async function deleteParlors() {
    const categoryId = "8f9a5743-b2f7-4e4f-ba89-06ac496de09c"; // Beauty Parlor
    const keepIds = [
        "ae0afs4sp07891gj3f8sujrr", // Raykar unisex salon
        "vvahx703oxsd24t0iyvbvjyw"  // Sneh hair& beauty 
    ];

    console.log(`Searching for parlors to delete in category ${categoryId}...`);

    // Find all parlors in this category NOT in the keep list
    const parlorsToDelete = await db.select().from(serviceProviders).where(
        and(
            eq(serviceProviders.categoryId, categoryId),
            ne(serviceProviders.id, keepIds[0]),
            ne(serviceProviders.id, keepIds[1])
        )
    );

    if (parlorsToDelete.length === 0) {
        console.log("No parlors found to delete.");
        process.exit(0);
    }

    console.log(`Found ${parlorsToDelete.length} parlors to delete:`);
    for (const p of parlorsToDelete) {
        console.log(`- Deleting: ${p.businessName} (ID: ${p.id})`);
        
        await db.transaction(async (tx) => {
            // Delete associated data
            await tx.delete(serviceOfferings).where(eq(serviceOfferings.providerId, p.id));
            await tx.delete(reviews).where(eq(reviews.providerId, p.id));
            await tx.delete(bookings).where(eq(bookings.providerId, p.id));
            await tx.delete(invoices).where(eq(invoices.providerId, p.id));
            await tx.delete(providerOffers).where(eq(providerOffers.providerId, p.id));
            await tx.delete(cakeProducts).where(eq(cakeProducts.providerId, p.id));
            await tx.delete(groceryProducts).where(eq(groceryProducts.providerId, p.id));
            await tx.delete(streetFoodItems).where(eq(streetFoodItems.providerId, p.id));
            await tx.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, p.id));
            await tx.delete(restaurantOrders).where(eq(restaurantOrders.providerId, p.id));
            await tx.delete(streetFoodOrders).where(eq(streetFoodOrders.providerId, p.id));
            await tx.delete(groceryOrders).where(eq(groceryOrders.providerId, p.id));
            
            // Delete the provider itself
            await tx.delete(serviceProviders).where(eq(serviceProviders.id, p.id));
        });
        console.log(`  Successfully deleted ${p.businessName}`);
    }

    console.log("Deletion complete.");
    process.exit(0);
}

deleteParlors().catch(err => {
    console.error(err);
    process.exit(1);
});
