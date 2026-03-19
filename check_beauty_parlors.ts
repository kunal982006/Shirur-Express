
import { db } from "./server/db";
import { serviceProviders, serviceCategories } from "./shared/schema";
import { eq } from "drizzle-orm";

async function check() {
    console.log("Checking categories...");
    const categories = await db.select().from(serviceCategories);
    console.log("All Categories:", categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));

    const beautyCategory = categories.find(c => c.slug === "beauty" || c.name.toLowerCase().includes("beauty") || c.name.toLowerCase().includes("parlor"));
    
    if (!beautyCategory) {
        console.log("Beauty category not found by slug 'beauty'.");
        process.exit(0);
    }

    console.log(`Found Beauty Category: ${beautyCategory.name} (ID: ${beautyCategory.id})`);

    const providers = await db.select().from(serviceProviders).where(eq(serviceProviders.categoryId, beautyCategory.id));
    console.log("Providers in Beauty Category:");
    providers.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.businessName}`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
