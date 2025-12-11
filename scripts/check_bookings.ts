import { db } from "../server/db";
import { serviceProviders, bookings, groceryOrders } from "../shared/schema";
import { eq, count } from "drizzle-orm";

async function checkData() {
    console.log("Checking Service Providers and their Bookings/Orders...");

    const providers = await db.query.serviceProviders.findMany({
        with: {
            user: true,
            category: true,
        }
    });

    console.log(`Found ${providers.length} providers.`);

    for (const provider of providers) {
        const bookingCount = await db
            .select({ count: count() })
            .from(bookings)
            .where(eq(bookings.providerId, provider.id));

        const orderCount = await db
            .select({ count: count() })
            .from(groceryOrders)
            .where(eq(groceryOrders.providerId, provider.id));

        console.log(`Provider: ${provider.businessName} (ID: ${provider.id})`);
        console.log(`  - Category: ${provider.category.name}`);
        console.log(`  - Bookings: ${bookingCount[0].count}`);
        console.log(`  - Grocery Orders: ${orderCount[0].count}`);
    }

    process.exit(0);
}

checkData().catch((err) => {
    console.error("Error checking data:", err);
    process.exit(1);
});
