import 'dotenv/config';
import { db } from "./db";
import { streetFoodItems } from "../shared/schema";
import { eq } from "drizzle-orm";
import { uploadToCloudinary } from "./cloudinary";

async function migrateImages() {
    console.log("-----------------------------------------");
    console.log("🚀 MIGRATION SCRIPT STARTED");
    console.log(`📂 Current Dir: ${process.cwd()}`);
    console.log(`🔗 DB URL Length: ${process.env.DATABASE_URL?.length || 0}`);
    console.log("-----------------------------------------");

    console.log("⌛ Fetching all street food items...");
    const allItems = await db.select().from(streetFoodItems);
    console.log(`📊 RAW DB COUNT: ${allItems.length}`);
    
    if (allItems.length > 0) {
        console.log("🔍 Sample 1st Item Data:");
        console.log(JSON.stringify(allItems[0], null, 2));
    } else {
        console.log("⚠️ WARNING: DB returned 0 items!");
    }

    // Filter items that have an external URL and not already on Cloudinary
    const items = allItems.filter(item => {
        const url = item.imageUrl || "";
        const isExternal = url.startsWith("http");
        const isCloudinary = url.includes("res.cloudinary.com");
        return isExternal && !isCloudinary;
    });

    if (items.length === 0) {
        console.log("✅ No items found with Freepik URLs. Migration might already be complete.");
        process.exit(0);
    }

    console.log(`📋 Found ${items.length} items to migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`[${i + 1}/${items.length}] Processing: "${item.name}"`);
        console.log(`   Source: ${item.imageUrl}`);

        try {
            // 1. Download image
            const response = await fetch(item.imageUrl!);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Upload to Cloudinary
            console.log(`   Uploading to Cloudinary...`);
            const cloudinaryUrl = await uploadToCloudinary(buffer);
            console.log(`   ✅ Success: ${cloudinaryUrl}`);

            // 3. Update Database
            await db.update(streetFoodItems)
                .set({ imageUrl: cloudinaryUrl })
                .where(eq(streetFoodItems.id, item.id));
            
            successCount++;
        } catch (error) {
            console.error(`   ❌ Failed to migrate "${item.name}":`, error);
            failCount++;
        }

        // Small delay to avoid hitting rate limits or overwhelming the server/Cloudinary
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("\n" + "=".repeat(30));
    console.log("🏁 Migration Finished!");
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log("=".repeat(30));

    // Wait for logs to flush
    await new Promise(r => setTimeout(r, 2000));
}

migrateImages().catch(err => {
    console.error("💥 Fatal error during migration:", err);
});
