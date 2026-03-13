import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, or } from "drizzle-orm";

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
    // If all keys exhausted, return null
    if (exhaustedKeys.size >= API_KEYS.length) return null;

    // Find next non-exhausted key
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

// ===== Freepik search with key rotation =====
async function searchFreepik(query: string): Promise<string | null> {
    let attempts = 0;

    while (attempts < API_KEYS.length) {
        const apiKey = getNextKey();
        if (!apiKey) {
            // All keys exhausted — wait 60s and reset
            console.log("  ⏳ All 4 API keys rate-limited. Waiting 60 seconds...");
            await new Promise(r => setTimeout(r, 60000));
            exhaustedKeys.clear();
            continue;
        }

        const keyIndex = currentKeyIndex;
        const url = `https://api.freepik.com/v1/resources?locale=en-US&term=${encodeURIComponent(query)}&page=1&limit=1&order=relevance`;

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
                const item = data.data[0];
                // Try multiple paths for the image URL
                const imageUrl =
                    item.image?.source?.url ||
                    item.image?.source?.medium?.url ||
                    item.image?.source?.small?.url ||
                    item.source?.url ||
                    (item.images && item.images.length > 0 ? item.images[0].url : null) ||
                    item.url ||
                    null;
                return imageUrl;
            }
            return null; // No results for this query
        } catch (e) {
            console.error(`  Freepik search failed for "${query}":`, e);
            return null;
        }
    }

    return null;
}

// ===== Generate better search queries for Indian food =====
function generateSearchQuery(name: string, category: string): string {
    let query = name;

    // Remove parenthetical notes and common suffixes
    query = query.replace(/\(.*?\)/g, '').trim();
    query = query.replace(/M\/s\./g, '').trim();
    query = query.replace(/Half|Full|Quarter|Pcs|pieces/gi, '').trim();

    // Map regional names to English equivalents for better Freepik results
    const mappings: Record<string, string> = {
        'Tandoori Chicken': 'tandoori chicken indian roasting',
        'Chicken Tikka': 'chicken tikka skewer indian',
        'Chicken Kabab': 'chicken kebab indian appetizer',
        'Chicken Biryani': 'chicken biryani rice indian',
        'Mutton Biryani': 'mutton biryani rice indian',
        'Egg Biryani': 'egg biryani rice indian',
        'Butter Chicken': 'butter chicken curry indian',
        'Chicken Masala': 'chicken masala curry indian',
        'Chicken Handi': 'chicken handi curry indian',
        'Mutton Handi': 'mutton handi curry indian',
        'Chicken Lollipop': 'chicken lollipop starter',
        'Chicken Rassa': 'chicken rassa maharashtrian curry',
        'Mutton Rassa': 'mutton rassa maharashtrian curry',
        'Bhakri': 'jowar bhakri bread indian',
        'Chapati': 'chapati roti bread indian',
        'Roti': 'roti indian bread',
        'Naan': 'naan butter garlic indian bread',
        'Anda Curry': 'egg curry indian',
        'Anda Bhurji': 'egg bhurji scramble indian',
        'Jeera Rice': 'jeera rice cumin indian',
        'Dal Fry': 'dal fry lentil curry indian',
        'Dal Tadka': 'dal tadka lentil curry indian',
        'Paneer': 'paneer curry indian',
        'Manchurian': 'veg manchurian indo chinese',
        'Noodles': 'hakka noodles indo chinese',
        'Fried Rice': 'fried rice indo chinese',
        'Soup': 'hot and sour soup bowl',
        'Papad': 'papadum indian',
    };

    // Check for exact name match in mappings
    for (const [key, value] of Object.entries(mappings)) {
        if (name.includes(key)) {
            return value;
        }
    }

    // Category-based query enhancement
    if (category === 'Drinks' || category === 'Soda' || category === 'Beverage') {
        return `${query} indian beverage cold drink`;
    }
    if (category.toLowerCase().includes('chicken')) {
        return `${query} chicken curry indian dish`;
    }
    if (category.toLowerCase().includes('mutton')) {
        return `${query} mutton curry indian dish`;
    }
    if (category.toLowerCase().includes('starter') && category.toLowerCase().includes('veg')) {
        return `${query} indian veg starter appetizer`;
    }
    if (category.toLowerCase().includes('starter')) {
        return `${query} indian nonveg tandoor starter`;
    }
    if (category.toLowerCase().includes('biryani') || category.toLowerCase().includes('rice')) {
        return `${query} indian rice biryani dish`;
    }
    if (category.toLowerCase().includes('roti') || category.toLowerCase().includes('bread')) {
        return `${query} indian flatbread naaan`;
    }

    // Default: add "indian food" for relevance
    return `${query} indian food Maharashtrian`;
}

// ===== Main execution =====
async function fetchAbhiruchiImages() {
    console.log("🔍 Looking for 'Hotel Abhiruchi' provider...\n");

    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.businessName, "Hotel Abhiruchi"), 
    });

    if (!provider) {
        console.error("❌ 'Hotel Abhiruchi' provider not found in database!");
        process.exit(1);
    }

    console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

    // Fetch all menu items for this provider 
    const items = await db.query.restaurantMenuItems.findMany({
        where: or(
            eq(restaurantMenuItems.providerId, provider.id)
        ),
    });

    console.log(`📋 Total menu items to process: ${items.length}\n`);

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const query = generateSearchQuery(item.name, item.category || '');

        console.log(`[${i + 1}/${items.length}] "${item.name}" (${item.category}) → Query: "${query}"`);

        const imageUrl = await searchFreepik(query);

        if (imageUrl) {
            await db.update(restaurantMenuItems)
                .set({ imageUrl })
                .where(eq(restaurantMenuItems.id, item.id));
            updated++;
            console.log(`  ✅ Image assigned: ${imageUrl.substring(0, 80)}...`);
        } else {
            // Try a simpler fallback query
            const simpleQuery = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' indian restaurant food';
            console.log(`  ↻ Retrying with simpler query: "${simpleQuery}"`);

            const fallbackUrl = await searchFreepik(simpleQuery);
            if (fallbackUrl) {
                await db.update(restaurantMenuItems)
                    .set({ imageUrl: fallbackUrl })
                    .where(eq(restaurantMenuItems.id, item.id));
                updated++;
                console.log(`  ✅ Fallback image assigned: ${fallbackUrl.substring(0, 80)}...`);
            } else {
                failed++;
                console.log(`  ❌ No image found`);
            }
        }

        // Rate limit protection: 1.5s between requests
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 DONE!`);
    console.log(`   ✅ Updated: ${updated}/${items.length}`);
    console.log(`   ❌ Failed:  ${failed}/${items.length}`);
    console.log(`${"=".repeat(50)}`);

    process.exit(0);
}

fetchAbhiruchiImages().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
