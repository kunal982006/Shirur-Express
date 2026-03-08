import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, streetFoodItems } from "@shared/schema";
import { like } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';

const IMAGE_DIR = path.resolve('client/public/images/menu-items');

async function removePexelsData() {
    console.log("Removing Pexels images and clearing DB fields...");

    // 1. Clear db entries with swad_exact and swad_fallback
    console.log("Resetting imageUrl in database...");
    await db.update(restaurantMenuItems)
        .set({ imageUrl: null })
        .where(like(restaurantMenuItems.imageUrl, "%swad_exact_%"));

    await db.update(restaurantMenuItems)
        .set({ imageUrl: null })
        .where(like(restaurantMenuItems.imageUrl, "%swad_fallback_%"));

    // 2. Delete the physical files
    if (fs.existsSync(IMAGE_DIR)) {
        const files = fs.readdirSync(IMAGE_DIR);
        let deleted = 0;
        for (const file of files) {
            if (file.includes('swad_exact_') || file.includes('swad_fallback_')) {
                fs.unlinkSync(path.join(IMAGE_DIR, file));
                deleted++;
            }
        }
        console.log(`Deleted ${deleted} Pexels image files.`);
    }

    console.log("Cleanup complete!");
    process.exit(0);
}

removePexelsData().catch(console.error);
