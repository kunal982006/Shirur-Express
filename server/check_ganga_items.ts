import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq } from "drizzle-orm";

async function check() {
    const items = await db.query.restaurantMenuItems.findMany({
        where: (menuItems, { ilike }) => ilike(menuItems.name, '%Veg Manchow%')
    });
    
    console.log(`Found ${items.length} items`);
    for (const item of items) {
        console.log(`Item: ${item.name}, ProviderID: ${item.providerId}`);
        const provider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.id, item.providerId)
        });
        console.log(`Provider: ${provider?.businessName || 'UNKNOWN'} (ID: ${item.providerId})`);
    }
}

check().then(() => process.exit(0)).catch(console.error);
