import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders, users } from "@shared/schema";
import { ilike } from "drizzle-orm";

async function check() {
    const providers = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%Ganga%")
    });
    
    for (const p of providers) {
        console.log(`ID: ${p.id}, Name: ${p.businessName}`);
        const items = await db.query.restaurantMenuItems.findMany({
            where: (menuItems, { eq }) => eq(menuItems.providerId, p.id)
        });
        console.log(`   Items count: ${items.length}`);
    }
}

check().then(() => process.exit(0)).catch(console.error);
