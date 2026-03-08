import { db } from '../server/db';
import { serviceProviders, streetFoodItems } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function run() {
    const vendors = await db.select().from(serviceProviders).where(eq(serviceProviders.categoryId, 'street_food'));
    console.log('Vendors:', vendors.map(v => v.businessName));
    for (const v of vendors) {
        const items = await db.select().from(streetFoodItems).where(eq(streetFoodItems.providerId, v.id));
        console.log(v.businessName, 'items:', items.map(i => i.name));
    }
    process.exit(0);
}
run();
