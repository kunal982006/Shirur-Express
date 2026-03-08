import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const FREEPIK_API_KEY = "FPSXb268d27481311606044f86e0151332e8";
const IMAGE_DIR = path.resolve('client/public/images/menu-items');

async function downloadImage(url: string, filepath: string): Promise<void> {
    if (url.startsWith('//')) {
        url = 'https:' + url;
    }

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);
}

async function searchFreepik(query: string): Promise<string | null> {
    const url = `https://api.freepik.com/v1/resources?locale=en-US&term=${encodeURIComponent(query)}&page=1&limit=1&format=photo&premium=0`;

    try {
        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'en-US',
                'Accept': 'application/json',
                'x-freepik-api-key': FREEPIK_API_KEY
            }
        });

        if (res.status === 429) {
            console.log("  [RATE LIMIT REACHED] Freepik exhausted. Falling back to Unsplash Source API.");
            return `https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60`;
        }

        if (!res.ok) {
            console.error(`Freepik API Error: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json() as any;
        if (data.data && data.data.length > 0) {
            const itemObj = data.data[0];
            return itemObj.image?.source?.url ||
                itemObj.source?.url ||
                (itemObj.images && itemObj.images.length > 0 ? itemObj.images[0].url : null) ||
                null;
        }
    } catch (e) {
        console.error(`Freepik search failed for "${query}":`, e);
    }
    return null;
}

function generateSearchQuery(name: string): string {
    let query = name;

    // Spelling fixes
    query = query.replace(/macchi/gi, 'fish');
    query = query.replace(/machi/gi, 'fish');
    query = query.replace(/surmai/gi, 'kingfish');
    query = query.replace(/bombil/gi, 'bombay duck');
    query = query.replace(/anda/gi, 'egg');

    return query;
}

async function assignSwadFreepikImages() {
    console.log("Starting Freepik Image Assignment for Swad...");

    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const providerList = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%Swad Chinese & Biryani%"),
    });

    if (providerList.length === 0) {
        console.error("Could not find Swad provider");
        process.exit(1);
    }
    const provider = providerList[0];

    const items = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, provider.id)
    });

    let count = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const query = generateSearchQuery(item.name);
        const filename = `swad_freepik_${item.id}.jpg`;
        const filepath = path.join(IMAGE_DIR, filename);

        console.log(`[${i + 1}/${items.length}] Item: "${item.name}" -> Query: "${query}"`);

        let imageUrl = null;

        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
            console.log(`  ✓ Image already exists: ${filename}`);
            imageUrl = `/images/menu-items/${filename}`;
        } else {
            // Include 'food' to get relevant pictures
            const freepikUrl = await searchFreepik(query + " food dish");
            if (freepikUrl) {
                if (freepikUrl.includes('unsplash.com')) {
                    imageUrl = freepikUrl; // Just use unsplash URL directly, don't download it
                    console.log(`  ✓ Assigned Unsplash fallback`);
                } else {
                    try {
                        await downloadImage(freepikUrl, filepath);
                        imageUrl = `/images/menu-items/${filename}`;
                        console.log(`  ✓ Downloaded new Freepik image`);
                    } catch (err) {
                        console.error(`  ✗ Failed to download image from Freepik URL`, err);
                    }
                }
            } else {
                console.log(`  ✗ No Freepik image found for query. Trying simpler fallback...`);
                // Fallback attempt removing special characters
                const simpleQuery = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ') + ' food';
                const fallbackUrl = await searchFreepik(simpleQuery);
                if (fallbackUrl) {
                    if (fallbackUrl.includes('unsplash.com')) {
                        imageUrl = fallbackUrl;
                        console.log(`  ✓ Assigned Unsplash fallback`);
                    } else {
                        try {
                            await downloadImage(fallbackUrl, filepath);
                            imageUrl = `/images/menu-items/${filename}`;
                            console.log(`  ✓ Downloaded fallback Freepik image`);
                        } catch (err) {
                            console.error(`  ✗ Failed fallback download`, err);
                        }
                    }
                }
            }
        }

        if (imageUrl) {
            await db.update(restaurantMenuItems)
                .set({ imageUrl: imageUrl })
                .where(eq(restaurantMenuItems.id, item.id));
            count++;
        }

        // Wait briefly to avoid aggressive rate limits 
        // Freepik allows up to 200 requests/minute (in paid tiers) but free limits are lower
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`\nDONE. Updated ${count}/${items.length} items with Freepik images.`);
    process.exit(0);
}

assignSwadFreepikImages().catch(console.error);
