
import { db } from "./server/db";
import { serviceProviders, serviceCategories } from "./shared/schema";
import { ilike, or } from "drizzle-orm";

async function check() {
    console.log("Searching for parlors by name...");
    const providers = await db.select().from(serviceProviders).where(
        or(
            ilike(serviceProviders.businessName, "%parlor%"),
            ilike(serviceProviders.businessName, "%salon%"),
            ilike(serviceProviders.businessName, "%saloon%"),
            ilike(serviceProviders.businessName, "%beauty%")
        )
    );

    console.log("Found Providers:");
    providers.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.businessName}, CategoryID: ${p.categoryId}`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
