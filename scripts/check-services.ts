
import { db } from "../server/db";
import { serviceOfferings, serviceProviders } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkServices() {
    console.log("Checking service offerings...");

    const providers = await db.select().from(serviceProviders);
    console.log(`Found ${providers.length} providers.`);

    for (const p of providers) {
        console.log(`Provider: ${p.businessName} (${p.id})`);
        const offerings = await db.select().from(serviceOfferings).where(eq(serviceOfferings.providerId, p.id));
        console.log(`  Offerings: ${offerings.length}`);
        offerings.forEach(o => {
            console.log(`    - TemplateID: ${o.templateId}, Price: ${o.price}, Active: ${o.isActive}`);
        });
    }
    process.exit(0);
}

checkServices().catch(console.error);
