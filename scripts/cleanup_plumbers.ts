
import { db } from "../server/db";
import { serviceCategories, serviceProviders, users } from "@shared/schema";
import { eq, and, ne } from "drizzle-orm";

async function cleanupPlumbers() {
    console.log("Starting plumber cleanup...");

    // 1. Find Plumber Category ID
    const plumberCategory = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, "plumber"), // Assuming slug is 'plumber'
    });

    if (!plumberCategory) {
        console.error("Plumber category not found!");
        process.exit(1);
    }

    console.log(`Found Plumber Category: ${plumberCategory.name} (ID: ${plumberCategory.id})`);

    // 2. Find all providers in this category
    const providers = await db.query.serviceProviders.findMany({
        where: eq(serviceProviders.categoryId, plumberCategory.id),
        with: {
            user: true,
        },
    });

    console.log(`Found ${providers.length} plumber providers.`);

    // 3. Identify providers to delete
    const providersToDelete = [];
    let keptProvider = null;

    for (const p of providers) {
        // Check if this is the one to keep
        const isKeeper = p.user.username === "plumber2" || p.businessName === "plumber2"; // Checking both just in case

        if (isKeeper) {
            if (keptProvider) {
                console.warn(`Warning: Found multiple candidates for 'plumber2'. Keeping the first one found: ${keptProvider.businessName}`);
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
        // If plumber2 isn't found, we might need a fallback or just exit to be safe
        console.warn("WARNING: 'plumber2' profile NOT FOUND. Aborting deletion to avoid losing all data.");
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

cleanupPlumbers().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
