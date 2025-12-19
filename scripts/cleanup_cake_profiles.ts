
import { db } from "../server/db";
import { users, serviceProviders, serviceCategories, cakeProducts, serviceOfferings, reviews } from "@shared/schema";
import { eq, and, ne, inArray } from "drizzle-orm";

async function cleanupCakeProfiles() {
    console.log("Starting cleanup of Cake Shop profiles...");

    // 1. Find the Cake Shop category
    const [cakeCategory] = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.slug, "cake-shop"));

    if (!cakeCategory) {
        console.error("Cake Shop category not found!");
        process.exit(1);
    }
    console.log(`Found 'cake-shop' category: ${cakeCategory.id}`);

    // 2. Find all providers in this category
    const providers = await db
        .select({
            providerId: serviceProviders.id,
            userId: serviceProviders.userId,
            username: users.username,
            businessName: serviceProviders.businessName
        })
        .from(serviceProviders)
        .innerJoin(users, eq(serviceProviders.userId, users.id))
        .where(eq(serviceProviders.categoryId, cakeCategory.id));

    console.log(`Found ${providers.length} providers in Cake Shop category.`);

    // 3. Identify providers to delete (Everything EXCEPT 'cake1')
    const providersToDelete = providers.filter(p => p.username !== 'cake1');
    const providerIdsToDelete = providersToDelete.map(p => p.providerId);
    const userIdsToDelete = providersToDelete.map(p => p.userId);

    if (providersToDelete.length === 0) {
        console.log("No profiles to delete. 'cake1' might be the only one, or no providers exist.");
    } else {
        console.log(`Deleting ${providersToDelete.length} profiles...`);
        providersToDelete.forEach(p => console.log(` - Will delete: ${p.username} (${p.businessName})`));

        // 4. Perform Deletions

        // A. Delete Cake Products
        if (providerIdsToDelete.length > 0) {
            await db.delete(cakeProducts).where(inArray(cakeProducts.providerId, providerIdsToDelete));
            console.log("Deleted associated cake products.");

            // B. Delete Service Offerings (if any generic ones attached)
            await db.delete(serviceOfferings).where(inArray(serviceOfferings.providerId, providerIdsToDelete));
            console.log("Deleted associated service offerings.");

            // C. Delete Reviews
            await db.delete(reviews).where(inArray(reviews.providerId, providerIdsToDelete));
            console.log("Deleted associated reviews.");

            // D. Delete Service Provider Profiles
            await db.delete(serviceProviders).where(inArray(serviceProviders.id, providerIdsToDelete));
            console.log("Deleted service provider profiles.");

            // E. Delete Users
            await db.delete(users).where(inArray(users.id, userIdsToDelete));
            console.log("Deleted user accounts.");
        }
    }

    console.log("Cleanup complete!");
    process.exit(0);
}

cleanupCakeProfiles().catch((err) => {
    console.error("Error cleaning up cake profiles:", err);
    process.exit(1);
});
