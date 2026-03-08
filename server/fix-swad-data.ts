import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function fixSwad() {
    console.log("Fixing Swad Data...");

    // Find the correct user (The one logged into the dashboard)
    // From screenshot we know the business name is "Swad Chinese & Biryani"
    const providersList = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%Swad%"),
    });

    const targetProvider = providersList.find(p => p.businessName.includes("Swad Chinese & Biryani") || p.businessName === "Swad chinese & biryani");
    const wrongProvider = providersList.find(p => p.businessName === "Hotel Swad");

    if (targetProvider && wrongProvider) {
        console.log(`Transferring items from Provider ID: ${wrongProvider.id} to Target Provider ID: ${targetProvider.id}`);

        // 1. Move the items
        await db.update(restaurantMenuItems)
            .set({ providerId: targetProvider.id })
            .where(eq(restaurantMenuItems.providerId, wrongProvider.id));

        console.log("Items transferred successfully.");

        // 2. We can optionally delete the wrong provider and its user, but just moving items is safer right now
    } else {
        console.log("Could not find both providers!");
        console.log("Target:", targetProvider?.id);
        console.log("Wrong:", wrongProvider?.id);
    }

    process.exit(0);
}

fixSwad().catch(console.error);
