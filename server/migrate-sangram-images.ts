import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { restaurantMenuItems } from '@shared/schema';
import { eq, like, and, not } from 'drizzle-orm';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error('❌ Missing Cloudinary env vars');
    process.exit(1);
}

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

async function migrateSangramImages() {
    console.log("🔍 Finding external image URLs for 'Hotel Sangram'...");
    
    // Find Hotel Sangram
    const providers = await db.query.serviceProviders.findMany({
        where: (sp, { ilike }) => ilike(sp.businessName, '%Sangram%')
    });
    
    if (providers.length === 0) {
        console.error("❌ Hotel Sangram not found!");
        process.exit(1);
    }
    
    const providerId = providers[0].id;
    console.log(`✅ Found: ${providers[0].businessName} (ID: ${providerId})`);

    // Find items with non-Cloudinary external URLs
    const items = await db.query.restaurantMenuItems.findMany({
        where: and(
            eq(restaurantMenuItems.providerId, providerId),
            like(restaurantMenuItems.imageUrl, 'http%'),
            not(like(restaurantMenuItems.imageUrl, '%cloudinary.com%'))
        )
    });

    console.log(`📋 Total external images to migrate: ${items.length}\n`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`[${i + 1}/${items.length}] Migrating: "${item.name}"`);
        
        try {
            // Upload from URL to Cloudinary
            const result = await cloudinary.uploader.upload(item.imageUrl!, {
                folder: 'shirur-express/sangram-limited-menu',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
                ]
            });

            // Update DB with Cloudinary URL
            await db.update(restaurantMenuItems)
                .set({ imageUrl: result.secure_url })
                .where(eq(restaurantMenuItems.id, item.id));

            console.log(`  ✅ Done: ${result.secure_url.substring(0, 60)}...`);
            updated++;
        } catch (err) {
            console.error(`  ❌ Failed:`, err);
            failed++;
        }

        // Small delay
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n🎉 DONE! ✅ ${updated} migrated, ❌ ${failed} failed`);
    process.exit(0);
}

migrateSangramImages().catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});
