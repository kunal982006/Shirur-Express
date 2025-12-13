
import { db } from "../server/db";
import { serviceCategories, serviceProviders, users } from "@shared/schema";
import { eq, and, ne } from "drizzle-orm";

async function cleanupElectricians() {
    console.log("Starting electrician cleanup...");

    // 1. Find Electrician Category ID
    const electricianCategory = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, "electrician"),
    });

    if (!electricianCategory) {
        console.error("Electrician category not found!");
        process.exit(1);
    }

    console.log(`Found Electrician Category: ${electricianCategory.name} (ID: ${electricianCategory.id})`);

    // 2. Find all providers in this category
    const providers = await db.query.serviceProviders.findMany({
        where: eq(serviceProviders.categoryId, electricianCategory.id),
        with: {
            user: true, // Join to check username
        },
    });

    console.log(`Found ${providers.length} electrician providers.`);

    // 3. Identify providers to delete
    const providersToDelete = [];
    let keptProvider = null;

    for (const p of providers) {
        const isKeeper = p.user.username === "electrician1" || p.businessName === "electrician1";

        if (isKeeper) {
            if (keptProvider) {
                console.warn(`Warning: Found multiple candidates for 'electrician1'. Keeping the first one found: ${keptProvider.businessName} (${keptProvider.user.username})`);
                providersToDelete.push(p);
            } else {
                keptProvider = p;
                console.log(`Keeping provider: ${p.businessName} (Username: ${p.user.username}, ID: ${p.id})`);
            }
        } else {
            providersToDelete.push(p);
        }
    }

    if (!keptProvider) {
        console.warn("WARNING: 'electrician1' profile NOT FOUND. Aborting deletion to avoid losing all data.");
        // Optional: List what was found to help debugging
        providers.forEach(p => console.log(`- ${p.businessName} (User: ${p.user.username})`));
        process.exit(1);
    }

    // 4. Delete unneeded providers
    if (providersToDelete.length > 0) {
        console.log(`Deleting ${providersToDelete.length} providers...`);

        for (const p of providersToDelete) {
            await db.delete(serviceProviders).where(eq(serviceProviders.id, p.id));
            console.log(`Deleted: ${p.businessName} (ID: ${p.id})`);
        }
        console.log("Cleanup complete.");
    } else {
        console.log("No extra profiles to delete.");
    }

    process.exit(0);
}

cleanupElectricians().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
