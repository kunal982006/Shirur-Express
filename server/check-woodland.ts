
import { db } from "./db";
import { users, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function checkWoodland() {
    console.log("Checking for Woodland Cafe...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Woodland%"),
        with: {
            user: true
        }
    });

    if (provider) {
        console.log("Found provider:", provider.businessName);
        console.log("User:", provider.user.username);
        console.log("Provider ID:", provider.id);
    } else {
        console.log("Provider not found.");
    }
}

checkWoodland().catch(console.error).then(() => process.exit(0));
