import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../server/db';
import { streetFoodItems } from '../shared/schema';
import { eq } from 'drizzle-orm';

// --- Config ---
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error('❌ Missing Cloudinary env vars!');
    process.exit(1);
}

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

async function main() {
    console.log("🔍 Finding street food images hosted on external servers (like Freepik)...");

    const items = await db.query.streetFoodItems.findMany();
    
    // Filter items that have an http URL but NOT cloudinary
    const itemsToMigrate = items.filter(item => 
        item.imageUrl && 
        item.imageUrl.startsWith('http') && 
        !item.imageUrl.includes('res.cloudinary.com')
    );

    console.log(`📋 Found ${itemsToMigrate.length} items to migrate to Cloudinary.\n`);

    if (itemsToMigrate.length === 0) {
        console.log("🎉 All images are already on Cloudinary!");
        process.exit(0);
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < itemsToMigrate.length; i++) {
        const item = itemsToMigrate[i];
        console.log(`[${i+1}/${itemsToMigrate.length}] Migrating: "${item.name}"`);

        try {
            // Cloudinary supports direct uploading from external HTTP URLs
            const result = await cloudinary.uploader.upload(item.imageUrl!, {
                folder: 'shirur-express/street-food',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
                ],
            });

            // Update DB with the new Cloudinary URL
            await db.update(streetFoodItems)
                .set({ imageUrl: result.secure_url })
                .where(eq(streetFoodItems.id, item.id));

            success++;
            console.log(`  ✅ Success: ${result.secure_url}`);
        } catch (error: any) {
            failed++;
            console.error(`  ❌ Failed: ${error.message || error}`);
        }

        // Avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 Migration Complete!`);
    console.log(`   ✅ Success: ${success}/${itemsToMigrate.length}`);
    console.log(`   ❌ Failed:  ${failed}/${itemsToMigrate.length}`);
    console.log(`${"=".repeat(50)}`);

    process.exit(0);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
