
import { db } from "./server/db";
import { serviceCategories, restaurantMenuItems, serviceProviders } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("--- Categories ---");
    const categories = await db.query.serviceCategories.findMany();
    categories.forEach(c => console.log(`${c.slug}: ${c.name}`));

    console.log("\n--- Providers with 'restaurant' or 'restaurants' in slug/category ---");
    const providers = await db.query.serviceProviders.findMany({
        with: { category: true }
    });

    const restProviders = providers.filter(p => p.category.slug.includes("restaurant"));
    restProviders.forEach(p => console.log(`Provider: ${p.businessName} (${p.id}), Slug: ${p.category.slug}`));

    if (restProviders.length > 0) {
        console.log("\n--- Menu Items for these providers ---");
        for (const p of restProviders) {
            const items = await db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, p.id));
            console.log(`Provider ${p.businessName} has ${items.length} items`);
            items.forEach(i => console.log(` - ${i.name} (Category: ${i.category}, Visible: ${i.isAvailable})`));
        }
    } else {
        console.log("No restaurant providers found.");
    }
}

main().catch(console.error).finally(() => process.exit(0));
