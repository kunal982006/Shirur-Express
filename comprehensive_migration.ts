import 'dotenv/config';
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";
import { uploadToCloudinary } from "./server/cloudinary";

async function comprehensiveMigration() {
    console.log("-----------------------------------------");
    console.log("🚀 COMPREHENSIVE MIGRATION STARTED");
    console.log("-----------------------------------------");

    const tableConfig = [
        { name: 'streetFoodItems', table: schema.streetFoodItems },
        { name: 'restaurantMenuItems', table: schema.restaurantMenuItems },
        { name: 'cakeProducts', table: schema.cakeProducts },
        { name: 'groceryProducts', table: schema.groceryProducts },
        { name: 'serviceProviders', table: schema.serviceProviders },
        { name: 'serviceOfferings', table: schema.serviceOfferings },
        { name: 'serviceTemplates', table: schema.serviceTemplates },
        { name: 'serviceProblems', table: schema.serviceProblems },
        { name: 'deliveryPartners', table: schema.deliveryPartners },
        { name: 'providerOffers', table: schema.providerOffers }
    ];

    for (const { name, table } of tableConfig) {
        console.log(`\nProcessing table: ${name}`);
        const allItems = await db.select().from(table as any);
        
        for (const item of allItems) {
            const updates: any = {};
            let hasUpdate = false;

            // Handle potential image fields
            const fieldsToCheck = [
                'imageUrl',
                'profileImageUrl',
                'image_url', // sometimes snake_case in data although camelCase in schema
                'profile_image_url'
            ];

            for (const field of fieldsToCheck) {
                const url = (item as any)[field];
                if (typeof url === 'string' && url.startsWith('http') && !url.includes('res.cloudinary.com')) {
                    console.log(`   [${name}:${item.id}] Migrating ${field}: ${url}`);
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            const buffer = Buffer.from(await response.arrayBuffer());
                            const newUrl = await uploadToCloudinary(buffer);
                            updates[field] = newUrl;
                            hasUpdate = true;
                            console.log(`      ✅ Success -> ${newUrl}`);
                        } else {
                            console.error(`      ❌ Failed to fetch: ${response.statusText}`);
                        }
                    } catch (e) {
                        console.error(`      ❌ Error migrating ${field}:`, e);
                    }
                }
            }

            // Handle galleryImages (array)
            if (Array.isArray((item as any).galleryImages)) {
                const gallery = (item as any).galleryImages as string[];
                const newGallery: string[] = [];
                let galleryChanged = false;

                for (const url of gallery) {
                    if (typeof url === 'string' && url.startsWith('http') && !url.includes('res.cloudinary.com')) {
                        console.log(`   [${name}:${item.id}] Migrating gallery image: ${url}`);
                        try {
                            const response = await fetch(url);
                            if (response.ok) {
                                const buffer = Buffer.from(await response.arrayBuffer());
                                const newUrl = await uploadToCloudinary(buffer);
                                newGallery.push(newUrl);
                                galleryChanged = true;
                                console.log(`      ✅ Success -> ${newUrl}`);
                            } else {
                                newGallery.push(url);
                                console.error(`      ❌ Failed to fetch gallery item: ${response.statusText}`);
                            }
                        } catch (e) {
                            newGallery.push(url);
                            console.error(`      ❌ Error migrating gallery item:`, e);
                        }
                    } else {
                        newGallery.push(url);
                    }
                }

                if (galleryChanged) {
                    updates.galleryImages = newGallery;
                    hasUpdate = true;
                }
            }

            if (hasUpdate) {
                await db.update(table as any)
                    .set(updates)
                    .where(eq((table as any).id, item.id));
            }
            
            // Artificial delay to prevent rate limits
            if (hasUpdate) {
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }

    console.log("\n🏁 Comprehensive Migration Finished!");
}

comprehensiveMigration().catch(console.error);
