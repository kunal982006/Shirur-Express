
import { db } from "./server/db";
import { serviceProviders } from "./shared/schema";
import { ilike } from "drizzle-orm";

async function findAbhiruchi() {
    try {
        const providers = await db.query.serviceProviders.findMany({
            where: ilike(serviceProviders.businessName, "%Abhiruchi%")
        });

        console.log(JSON.stringify(providers, null, 2));
    } catch (error: any) {
        console.error("Error: " + error.toString());
    } finally {
        process.exit(0);
    }
}

findAbhiruchi();
