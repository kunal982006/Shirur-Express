
import { db } from "../server/db";
import { serviceProviders } from "../shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "../server/storage";

async function debugProvider() {
    const providerId = "vyw7422xa6j3hmxbu5ujjb8r";
    console.log(`Fetching provider ${providerId}...`);

    // We need to use the same query as the route
    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.id, providerId),
        with: {
            beautyServices: { with: { template: true } },
            user: true,
            category: true,
        }
    });

    if (!provider) {
        console.log("Provider not found");
        return;
    }

    console.log("Provider found:", provider.businessName);
    console.log("Beauty Services Count:", provider.beautyServices.length);

    provider.beautyServices.forEach((s: any) => {
        console.log(`Service ID: ${s.id}, Active: ${s.isActive}`);
        if (s.template) {
            console.log(`  Template: ${s.template.name}, SubCat: ${s.template.subCategory}`);
        } else {
            console.log(`  NO TEMPLATE FOUND`);
        }
    });

    process.exit(0);
}

debugProvider().catch(console.error);
