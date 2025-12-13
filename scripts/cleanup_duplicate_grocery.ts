
import { db } from "../server/db";
import { groceryProducts } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

async function cleanupDuplicateGrocery() {
    console.log("Starting grocery duplicate cleanup...");

    const allProducts = await db.select().from(groceryProducts);
    console.log(`Total products scanned: ${allProducts.length}`);

    const seen = new Map<string, string>(); // Key -> ID to keep
    const idsToDelete: string[] = [];

    for (const p of allProducts) {
        // strict normalization
        const normalize = (s: string | null) => (s || "").trim().toLowerCase();

        // Key definition: Modify this if 'duplicate' means something else (e.g. ignoring price)
        // We assume duplicate means same product details for the same provider.
        const key = JSON.stringify({
            providerId: p.providerId,
            name: normalize(p.name),
            category: normalize(p.category),
            brand: normalize(p.brand),
            price: p.price, // assuming string match
            weight: normalize(p.weight),
            unit: normalize(p.unit)
        });

        if (seen.has(key)) {
            // We found a duplicate!
            idsToDelete.push(p.id);
            // We keep the one already in the map (usually the first one encountered, effectively the oldest or random depending on select order)
            // If we wanted to keep the NEWEST, we would swap here. But typically keeping the first ID is safer if it's referenced elsewhere (though unlikely for just-imported duplicates).
        } else {
            seen.set(key, p.id);
        }
    }

    console.log(`Found ${idsToDelete.length} duplicates to remove.`);

    if (idsToDelete.length > 0) {
        // Delete in chunks to be safe with SQL limits
        const chunkSize = 100;
        for (let i = 0; i < idsToDelete.length; i += chunkSize) {
            const chunk = idsToDelete.slice(i, i + chunkSize);
            await db.delete(groceryProducts).where(inArray(groceryProducts.id, chunk));
            console.log(`Deleted chunk ${i / chunkSize + 1} (${chunk.length} items)`);
        }
        console.log("Deletion complete.");
    } else {
        console.log("No duplicates found.");
    }

    process.exit(0);
}

cleanupDuplicateGrocery().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
