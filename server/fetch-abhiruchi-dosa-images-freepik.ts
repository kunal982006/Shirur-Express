import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
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

// ===== Freepik search with key rotation =====
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
            return null;
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
    query = query.replace(/\(.*?\)/g, '').trim();
    query = query.replace(/M\/s\./g, '').trim();
    query = query.replace(/Half|Full|Quarter|Pcs|pieces/gi, '').trim();

    const mappings: Record<string, string> = {
        'Dosa': 'south indian dosa',
        'Paper Dosa': 'jumbo crispy paper dosa',
        'Masala Dosa': 'masala dosa south indian',
        'Uttapam': 'south indian uttapam vegetable',
        'Pavbhaji': 'pav bhaji indian street food',
        'Misal': 'misal pav maharashtrian spicy',
        'Idli': 'idli sambar south indian',
        'Medu Wada': 'medu vada south indian breakfast',
        'Shake': 'milkshake glass with straw',
        'Coffee': 'south indian filter coffee',
        'Tea': 'indian tea cup masala chai',
        'Lassi': 'indian lassi yogurt drink',
        'Curd': 'plain yogurt curd bowl',
        'Milk': 'glass of milk white',
        'Tak': 'indian buttermilk chaas',
    };

    for (const [key, value] of Object.entries(mappings)) {
        if (name.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    if (category.toLowerCase().includes('dosa')) return `${query} south indian dosa`;
    if (category.toLowerCase().includes('uttapam')) return `${query} uttapam south indian`;
    if (category.toLowerCase().includes('pavbhaji')) return `${query} pav bhaji indian`;
    if (category.toLowerCase().includes('misal')) return `${query} misal pav indian`;
    if (category.toLowerCase().includes('idli')) return `${query} idli south indian`;
    if (category.toLowerCase().includes('shake')) return `${query} milkshake`;
    if (category.toLowerCase().includes('hot')) return `${query} hot indian beverage`;
    if (category.toLowerCase().includes('cold')) return `${query} cold refreshing drink`;

    return `${query} south indian food`;
}

// ===== Main execution =====
async function fetchAbhiruchiDosaImages() {
    console.log("🔍 Looking for 'Hotel Abhiruchi Dosa' provider...\n");

    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.businessName, "Hotel Abhiruchi Dosa"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Abhiruchi Dosa' provider not found in database!");
        process.exit(1);
    }

    console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

    const items = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, provider.id),
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
            const simpleQuery = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' south indian food';
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

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 DONE!`);
    console.log(`   ✅ Updated: ${updated}/${items.length}`);
    console.log(`   ❌ Failed:  ${failed}/${items.length}`);
    console.log(`${"=".repeat(50)}`);

    process.exit(0);
}

fetchAbhiruchiDosaImages().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
