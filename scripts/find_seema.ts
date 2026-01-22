
import { db } from "../server/db";
import { serviceProviders, users } from "@shared/schema";
import { ilike, eq } from "drizzle-orm";

async function main() {
    const searchTerm = "%Seema%Wagmare%";

    console.log(`Searching for provider or user matching: ${searchTerm}`);

    const foundProviders = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, searchTerm),
        with: {
            user: true,
            category: true,
        }
    });

    console.log("Found Service Providers:", JSON.stringify(foundProviders, null, 2));

    const foundUsers = await db.query.users.findMany({
        where: ilike(users.username, searchTerm),
        with: {
            providerProfile: {
                with: {
                    category: true
                }
            }
        }
    });

    console.log("Found Users:", JSON.stringify(foundUsers, null, 2));
}

main().catch(console.error).then(() => process.exit(0));
