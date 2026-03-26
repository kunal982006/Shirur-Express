import 'dotenv/config';
import { db } from "./db";
import { streetFoodItems } from "@shared/schema";
import { eq } from "drizzle-orm";

// ===== 4 Freepik API Keys with rotation =====
const API_KEYS = [
    process.env.FREE_PEEK_1 || "FPSXb268d27481311606044f86e0151332e8",
    process.env.FREE_PEEK_2 || "FPSX9c158ba66cc15391497140bb50d1ad83",
    process.env.FREE_PEEK_3 || "FPSXb0d5d3d0b2ea09ed7841d9df7c711e72",
    process.env.FREE_PEEK_4 || "FPSX7f3c5539dff2f5502a8f77590e30b374",
];

let currentKeyIndex = 0;
let exhaustedKeys = new Set<number>();

function getNextKey(): string | null {
    if (exhaustedKeys.size >= API_KEYS.length) return null;
    while (exhaustedKeys.has(currentKeyIndex)) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    }
    return API_KEYS[currentKeyIndex];
}

function markKeyExhausted(index: number) {
    exhaustedKeys.add(index);
    console.log(`  ⚠️ API Key #${index + 1} rate-limited. ${API_KEYS.length - exhaustedKeys.size} keys remaining.`);
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

const usedImageUrls = new Set<string>();

async function searchFreepik(query: string): Promise<string | null> {
    let attempts = 0;
    while (attempts < API_KEYS.length) {
        const apiKey = getNextKey();
        if (!apiKey) {
            console.log("  ⏳ All 4 API keys rate-limited. Waiting 60 seconds...");
            await new Promise(r => setTimeout(r, 60000));
            exhaustedKeys.clear();
            continue;
        }
        const keyIndex = currentKeyIndex;
        const url = `https://api.freepik.com/v1/resources?locale=en-US&term=${encodeURIComponent(query)}&page=1&limit=15&format=photo&premium=0`;
        try {
            const res = await fetch(url, {
                headers: {
                    'Accept-Language': 'en-US',
                    'Accept': 'application/json',
                    'x-freepik-api-key': apiKey
                }
            });
            if (res.status === 429) {
                markKeyExhausted(keyIndex);
                attempts++;
                continue;
            }
            if (!res.ok) {
                console.error(`  Freepik API Error: ${res.status} ${res.statusText}`);
                return null;
            }
            const data = await res.json() as any;
            if (data.data && data.data.length > 0) {
                // Loop to find an unused image
                for (const item of data.data) {
                    const imgUrl = item.image?.source?.url || 
                                   item.image?.source?.medium?.url ||
                                   item.image?.source?.small?.url ||
                                   item.source?.url || 
                                   (item.images?.[0]?.url) ||
                                   item.url ||
                                   null;
                                   
                    if (imgUrl && !usedImageUrls.has(imgUrl)) {
                        usedImageUrls.add(imgUrl);
                        return imgUrl;
                    }
                }
                
                // If somehow all 15 are used (very rare), just return the first one
                const fallbackItem = data.data[0];
                return fallbackItem.image?.source?.url || 
                       fallbackItem.image?.source?.medium?.url ||
                       fallbackItem.image?.source?.small?.url ||
                       fallbackItem.source?.url || 
                       (fallbackItem.images?.[0]?.url) ||
                       fallbackItem.url ||
                       null;
            }
            return null;
        } catch (e) {
            console.error(`  Freepik search failed for "${query}":`, e);
            return null;
        }
    }
    return null;
}

function generateSearchQuery(name: string, category: string): string {
    let query = name.replace(/\(.*?\)/g, '').trim();
    query = query.replace(/M\/s\./g, '').trim();
    query = query.replace(/Half|Full|Quarter|Pcs|pieces|Extra/gi, '').trim();

    const lowerName = query.toLowerCase();
    
    // Explicit mappings for very specific items
    if (lowerName.includes('pavbhaji') || lowerName.includes('pav bhaji')) return 'pav bhaji indian street food meal';
    if (lowerName.includes('tava pulav') || lowerName.includes('tawa pulav')) return 'tawa pulao indian street food rice';
    if (lowerName.includes('soya chap') || lowerName.includes('soya chaap')) return 'soya chaap tikka indian food';
    if (lowerName.includes('momos') || lowerName.includes('momo')) return 'momos dumpling steamed';
    if (lowerName.includes('dosa')) return 'dosa crepe south indian food';
    if (lowerName.includes('dabeli')) return 'dabeli indian street food snack';
    if (lowerName.includes('chocolate bowl')) return 'chocolate dessert bowl ice cream';
    if (lowerName.includes('pizza')) return 'pizza slice cheese';
    if (lowerName.includes('burger')) return 'burger hamburger sandwich';
    if (lowerName.includes('sandwich')) return 'club sandwich toast';
    if (lowerName.includes('french fries')) return 'french fries potato';
    if (lowerName.includes('springrole') || lowerName.includes('spring roll')) return 'spring rolls starter';
    if (lowerName.includes('paneer tikka')) return 'paneer tikka skewer starter indian';
    if (lowerName.includes('noodles')) return 'hakka noodles indo chinese bowl';
    if (lowerName.includes('fried rice') || lowerName.includes('shejwan rice')) return 'fried rice bowl indo chinese';
    if (lowerName.includes('soup')) return 'hot soup bowl';

    return `${query} indian street food photo`;
}

async function fetchStreetFoodImages() {
    console.log("🗑️ Deleting all existing street food images...");
    await db.update(streetFoodItems).set({ imageUrl: null });

    console.log("🔍 Fetching all street food items...\n");

    const items = await db.query.streetFoodItems.findMany();

    if (items.length === 0) {
        console.error("❌ No street food items found in database!");
        process.exit(1);
    }

    console.log(`📋 Total street food items to process: ${items.length}\n`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const query = generateSearchQuery(item.name, item.category || '');

        console.log(`[${i + 1}/${items.length}] "${item.name}" (${item.category}) → Query: "${query}"`);

        const imageUrl = await searchFreepik(query);

        if (imageUrl) {
            await db.update(streetFoodItems)
                .set({ imageUrl })
                .where(eq(streetFoodItems.id, item.id));
            updated++;
            console.log(`  ✅ Image assigned: ${imageUrl.substring(0, 80)}...`);
        } else {
            const simpleQuery = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' street food';
            console.log(`  ↻ Retrying with simpler query: "${simpleQuery}"`);

            const fallbackUrl = await searchFreepik(simpleQuery);
            if (fallbackUrl) {
                await db.update(streetFoodItems)
                    .set({ imageUrl: fallbackUrl })
                    .where(eq(streetFoodItems.id, item.id));
                updated++;
                console.log(`  ✅ Fallback image assigned: ${fallbackUrl.substring(0, 80)}...`);
            } else {
                failed++;
                console.log(`  ❌ No image found`);
            }
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 DONE!`);
    console.log(`   ✅ Updated: ${updated}/${items.length}`);
    console.log(`   ❌ Failed:  ${failed}/${items.length}`);
    console.log(`${"=".repeat(50)}`);

    process.exit(0);
}

fetchStreetFoodImages().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
