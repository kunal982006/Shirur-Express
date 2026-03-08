import { db } from './server/db';
import { restaurantMenuItems } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testQuery() {
    try {
        console.log("Fetching a restaurant provider id...");
        // Just pick a known provider id from the previous error logs: nmzj6q3rchsf1od3ef9i2bb4
        const providerId = 'nmzj6q3rchsf1od3ef9i2bb4';
        const items = await db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, providerId));
        console.log(`Successfully fetched ${items.length} items for ${providerId}`);
        process.exit(0);
    } catch (e: any) {
        console.error("Query failed:", e);
        process.exit(1);
    }
}
testQuery();
