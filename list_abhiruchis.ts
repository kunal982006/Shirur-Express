
import { db } from "./server/db";
import { serviceProviders } from "./shared/schema";
import { ilike } from "drizzle-orm";

async function listAllAbhiruchis() {
    try {
        const providers = await db.query.serviceProviders.findMany({
            where: ilike(serviceProviders.businessName, "%Abhiruchi%")
        });

        providers.forEach(p => {
            console.log(`- ${p.businessName} (ID: ${p.id})`);
        });
    } catch (error: any) {
        console.error("Error: " + error.toString());
    } finally {
        process.exit(0);
    }
}

listAllAbhiruchis();
