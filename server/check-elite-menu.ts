import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { ilike, eq, sql } from "drizzle-orm";

async function check() {
    // Find all providers with "Elite" in name
    const providers = await db.select({
        id: serviceProviders.id,
        name: serviceProviders.businessName,
        userId: serviceProviders.userId
    }).from(serviceProviders).where(ilike(serviceProviders.businessName, "%Elite%"));

    console.log("Found providers:", providers.length);
    for (const p of providers) {
        console.log(`  Provider: "${p.name}" | ID: ${p.id} | userId: ${p.userId}`);
        const count = await db.select({ cnt: sql<number>`count(*)` }).from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, p.id));
        console.log(`  Menu items: ${count[0].cnt}`);
    }

    // Also check for the specific provider ID from URL
    const urlProviderId = "oig6pewj42lgbrh65va882ht";
    const urlProvider = await db.select({
        id: serviceProviders.id,
        name: serviceProviders.businessName
    }).from(serviceProviders).where(eq(serviceProviders.id, urlProviderId));
    console.log(`\nProvider from URL (${urlProviderId}):`, urlProvider);

    if (urlProvider.length > 0) {
        const count = await db.select({ cnt: sql<number>`count(*)` }).from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, urlProviderId));
        console.log(`  Menu items for URL provider: ${count[0].cnt}`);
    }

    process.exit(0);
}

check();
