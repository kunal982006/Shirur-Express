/**
 * Migrate all local images to Cloudinary and update DB + code references.
 * 
 * This script will:
 * 1. Upload all images from client/public/images/ to Cloudinary
 * 2. Update database records (streetFoodItems, restaurantMenuItems, serviceTemplates, serviceOfferings)
 * 3. Generate a JSON mapping file for hardcoded references (electrician/plumber pages)
 * 
 * Usage: npx tsx scripts/migrate_images_to_cloudinary.ts
 */
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../server/db';
import { streetFoodItems, restaurantMenuItems, serviceTemplates, serviceOfferings } from '../shared/schema';
import { like } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// --- Config ---
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    console.error('❌ Missing Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
    process.exit(1);
}

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

const IMAGE_ROOT = path.resolve('client/public/images');
const MAPPING_FILE = path.resolve('scripts/cloudinary_url_mapping.json');

// Subdirectories to process
const SUBDIRS = ['menu-items', 'beauty', 'electrician', 'plumber'];

interface UploadResult {
    localPath: string;    // e.g. /images/menu-items/chicken_fried_momos.jpg
    cloudinaryUrl: string;
}

// Rate-limit helper
function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function uploadFile(filePath: string, folder: string): Promise<string> {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: `shirur-express/${folder}`,
        resource_type: 'image',
        overwrite: false,       // Don't re-upload if already exists
        unique_filename: false, // Keep original filename
        use_filename: true,
        transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
        ],
    });
    return result.secure_url;
}

async function uploadAllImages(): Promise<Map<string, string>> {
    // Map: local web path -> cloudinary URL
    const mapping = new Map<string, string>();

    // Try to load existing mapping to resume from
    if (fs.existsSync(MAPPING_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
            for (const [k, v] of Object.entries(existing)) {
                mapping.set(k, v as string);
            }
            console.log(`📂 Loaded ${mapping.size} existing mappings from previous run.\n`);
        } catch { /* ignore */ }
    }

    for (const subdir of SUBDIRS) {
        const dirPath = path.join(IMAGE_ROOT, subdir);
        if (!fs.existsSync(dirPath)) {
            console.log(`⏭️  Skipping ${subdir}/ (directory not found)`);
            continue;
        }

        const files = fs.readdirSync(dirPath).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        console.log(`\n📁 Processing ${subdir}/ (${files.length} images)...`);
        let uploaded = 0;
        let skipped = 0;

        for (const file of files) {
            const localWebPath = `/images/${subdir}/${file}`;
            const absolutePath = path.join(dirPath, file);

            // Skip if already uploaded
            if (mapping.has(localWebPath)) {
                skipped++;
                continue;
            }

            try {
                const cloudinaryUrl = await uploadFile(absolutePath, subdir);
                mapping.set(localWebPath, cloudinaryUrl);
                uploaded++;
                console.log(`  ✅ [${uploaded}] ${file} → uploaded`);

                // Save progress after each upload (in case of interruption)
                const obj: Record<string, string> = {};
                mapping.forEach((v, k) => { obj[k] = v; });
                fs.writeFileSync(MAPPING_FILE, JSON.stringify(obj, null, 2));

                // Rate limit: ~2 uploads/second
                await sleep(500);
            } catch (err: any) {
                console.error(`  ❌ Failed to upload ${file}:`, err.message || err);
            }
        }

        console.log(`  📊 ${subdir}: ${uploaded} uploaded, ${skipped} skipped (already done)`);
    }

    return mapping;
}

async function updateDatabase(mapping: Map<string, string>) {
    console.log('\n\n=== Updating Database Records ===\n');

    // 1. Street Food Items
    console.log('🍔 Updating street_food_items...');
    const streetFood = await db.select().from(streetFoodItems).where(like(streetFoodItems.imageUrl, '/images/%'));
    let sfCount = 0;
    for (const item of streetFood) {
        if (item.imageUrl && mapping.has(item.imageUrl)) {
            await db.update(streetFoodItems)
                .set({ imageUrl: mapping.get(item.imageUrl)! })
                .where(like(streetFoodItems.id, item.id));
            sfCount++;
        }
    }
    console.log(`   Updated ${sfCount}/${streetFood.length} street food items.`);

    // 2. Restaurant Menu Items
    console.log('🍽️  Updating restaurant_menu_items...');
    const menuItems = await db.select().from(restaurantMenuItems).where(like(restaurantMenuItems.imageUrl, '/images/%'));
    let rmCount = 0;
    for (const item of menuItems) {
        if (item.imageUrl && mapping.has(item.imageUrl)) {
            await db.update(restaurantMenuItems)
                .set({ imageUrl: mapping.get(item.imageUrl)! })
                .where(like(restaurantMenuItems.id, item.id));
            rmCount++;
        }
    }
    console.log(`   Updated ${rmCount}/${menuItems.length} restaurant menu items.`);

    // 3. Service Templates (beauty)
    console.log('💅 Updating service_templates...');
    const templates = await db.select().from(serviceTemplates).where(like(serviceTemplates.imageUrl, '/images/%'));
    let tCount = 0;
    for (const t of templates) {
        if (t.imageUrl && mapping.has(t.imageUrl)) {
            await db.update(serviceTemplates)
                .set({ imageUrl: mapping.get(t.imageUrl)! })
                .where(like(serviceTemplates.id, t.id));
            tCount++;
        }
    }
    console.log(`   Updated ${tCount}/${templates.length} service templates.`);

    // 4. Service Offerings (beauty)
    console.log('✨ Updating service_offerings...');
    const offerings = await db.select().from(serviceOfferings).where(like(serviceOfferings.imageUrl, '/images/%'));
    let oCount = 0;
    for (const o of offerings) {
        if (o.imageUrl && mapping.has(o.imageUrl)) {
            await db.update(serviceOfferings)
                .set({ imageUrl: mapping.get(o.imageUrl)! })
                .where(like(serviceOfferings.id, o.id));
            oCount++;
        }
    }
    console.log(`   Updated ${oCount}/${offerings.length} service offerings.`);

    console.log(`\n✅ Total DB updates: ${sfCount + rmCount + tCount + oCount} records`);
}

function printHardcodedMappings(mapping: Map<string, string>) {
    console.log('\n\n=== Hardcoded Image Mappings (for electrician.tsx & plumber.tsx) ===\n');

    // Electrician
    const electricianFiles = [
        '/images/electrician/ac.png',
        '/images/electrician/refrigerator.png',
        '/images/electrician/tv.png',
        '/images/electrician/water-heater.png',
        '/images/electrician/washing-machine.png',
        '/images/electrician/microwave.png',
        '/images/electrician/others.png',
    ];

    console.log('📌 electrician.tsx IMAGE_MAPPING updates:');
    for (const localPath of electricianFiles) {
        const cloudUrl = mapping.get(localPath);
        if (cloudUrl) {
            console.log(`  "${localPath}" → "${cloudUrl}"`);
        }
    }

    // Plumber
    const plumberFiles = [
        '/images/plumber/tap.jpeg',
        '/images/plumber/toilet.jpeg',
        '/images/plumber/water-tank.jpeg',
        '/images/plumber/basin-sink.jpeg',
        '/images/plumber/leakage.jpeg',
        '/images/plumber/geyser.jpeg',
        '/images/plumber/motor.jpeg',
    ];

    console.log('\n📌 plumber.tsx IMAGE_MAPPING updates:');
    for (const localPath of plumberFiles) {
        const cloudUrl = mapping.get(localPath);
        if (cloudUrl) {
            console.log(`  "${localPath}" → "${cloudUrl}"`);
        }
    }
}

async function main() {
    console.log('🚀 === Cloudinary Image Migration ===\n');
    console.log(`Cloud: ${CLOUD_NAME}`);
    console.log(`Image root: ${IMAGE_ROOT}\n`);

    // Step 1: Upload all images
    const mapping = await uploadAllImages();
    console.log(`\n📊 Total mappings: ${mapping.size}`);

    // Step 2: Update database
    await updateDatabase(mapping);

    // Step 3: Print hardcoded mappings for manual TSX updates
    printHardcodedMappings(mapping);

    // Save final mapping
    const obj: Record<string, string> = {};
    mapping.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(obj, null, 2));
    console.log(`\n💾 Full mapping saved to: ${MAPPING_FILE}`);

    console.log('\n🎉 === Migration Complete ===');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
