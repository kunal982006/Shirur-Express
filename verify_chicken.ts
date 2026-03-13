import 'dotenv/config';
import { db } from './server/db';
import { serviceProviders, restaurantMenuItems } from '@shared/schema';
import { eq, isNotNull, isNull, and } from 'drizzle-orm';
import * as fs from 'fs';

async function run() {
    const p = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.businessName, 'Chicken Affair')
    });
    
    if (!p) {
        console.log("Not found");
        process.exit(1);
    }
    
    const itemsWithImages = await db.query.restaurantMenuItems.findMany({
        where: and(eq(restaurantMenuItems.providerId, p.id), isNotNull(restaurantMenuItems.imageUrl))
    });
    
    const itemsWithoutImages = await db.query.restaurantMenuItems.findMany({
        where: and(eq(restaurantMenuItems.providerId, p.id), isNull(restaurantMenuItems.imageUrl))
    });

    const report = {
        total: itemsWithImages.length + itemsWithoutImages.length,
        withImages: itemsWithImages.length,
        withoutImages: itemsWithoutImages.length,
        sampleImageUrls: itemsWithImages.slice(0, 5).map(i => ({ name: i.name, url: i.imageUrl }))
    };
    
    fs.writeFileSync('chicken_affair_report.json', JSON.stringify(report, null, 2), 'utf-8');
    process.exit(0);
}
run();
