
import { db } from "./db";
import { serviceProviders } from "@shared/schema";

async function listProviders() {
    console.log("Listing all Service Providers...");
    try {
        const providers = await db.select().from(serviceProviders);

        if (providers.length === 0) {
            console.log("No providers found.");
        } else {
            providers.forEach(p => {
                console.log(`ID: ${p.id} | Name: ${p.businessName} | Verified: ${p.isVerified}`);
            });
        }
    } catch (error) {
        console.error("Error listing providers:", error);
    }
    process.exit(0);
}

listProviders();
