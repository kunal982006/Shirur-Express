import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike, isNull, or } from "drizzle-orm";

// ===== 3 Freepik API Keys with rotation =====
const API_KEYS = [
    "FPSXb268d27481311606044f86e0151332e8",
    "FPSX9c158ba66cc15391497140bb50d1ad83",
    "FPSXb0d5d3d0b2ea09ed7841d9df7c711e72",
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
            console.log("  ⏳ All 3 API keys rate-limited. Waiting 60 seconds...");
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
    query = query.replace(/Half|Full/gi, '').trim();

    // Map regional names to English equivalents for better Freepik results
    const mappings: Record<string, string> = {
        'Poha': 'poha flattened rice indian breakfast',
        'Upma': 'upma semolina indian breakfast',
        'Sheera': 'sheera suji halwa indian sweet',
        'Uttappa': 'uttapam south indian pancake',
        'Idli Samber': 'idli sambar south indian',
        'Medu Wada': 'medu vada south indian',
        'Puri Bhaji': 'puri bhaji indian',
        'Thecha': 'green chili thecha maharashtrian',
        'Aamti': 'aamti dal maharashtrian',
        'Pithala': 'pitla besan curry maharashtrian',
        'Shev Bhaji': 'shev bhaji maharashtrian curry',
        'Bharaleli Vangi': 'stuffed brinjal maharashtrian',
        'Baigan Bharata': 'baingan bharta roasted eggplant',
        'Matki Usal': 'matki usal moth bean curry',
        'Matki Dry': 'matki dry moth bean',
        'Bhendi Fry': 'bhindi fry okra indian',
        'Bhendi Masala': 'bhindi masala okra curry',
        'Lasuni Palak': 'garlic spinach indian',
        'Plain Palak': 'palak spinach curry indian',
        'Lasuni Methi': 'garlic fenugreek indian sabzi',
        'Methi Fry': 'methi fry fenugreek indian',
        'Methi Masala': 'methi masala fenugreek curry',
        'Jewari Bhakari': 'jowar bhakri indian flatbread',
        'Bajari Bhakari': 'bajra bhakri millet flatbread',
        'Chapati': 'chapati roti indian flatbread',
        'Dal Wati': 'dal bati rajasthani',
        'Dal Khichadi': 'dal khichdi indian comfort food',
        'Kulfi': 'kulfi indian ice cream',
        'Veg 65': 'veg 65 crispy indian starter',
        'Nachani Fry Papad': 'ragi papad fried indian',
        'Nachani Masala Papad': 'ragi masala papad indian',
        'Batata Bhaji': 'batata bhaji potato curry indian',
    };

    // Check for exact name match in mappings
    for (const [key, value] of Object.entries(mappings)) {
        if (name.includes(key)) {
            return value;
        }
    }

    // Category-based query enhancement
    if (category === 'Drinks' || category === 'Soda' || category === 'Juice') {
        return `${query} indian beverage drink`;
    }
    if (category === 'Soup') {
        return `${query} indian soup bowl`;
    }
    if (category === 'Roti') {
        return `${query} indian bread`;
    }
    if (category === 'Rice') {
        return `${query} indian rice dish`;
    }
    if (category === 'Dal') {
        return `${query} indian dal lentil`;
    }
    if (category === 'Paneer') {
        return `${query} paneer indian curry`;
    }
    if (category === 'Ice-Cream') {
        return `${query} ice cream dessert`;
    }
    if (category.includes('Chinese')) {
        return `${query} indo chinese food`;
    }
    if (category === 'Tandoor Starter') {
        return `${query} tandoori indian appetizer`;
    }
    if (category === 'Starter') {
        return `${query} indian starter appetizer`;
    }

    // Default: add "indian food" for relevance
    return `${query} indian food dish`;
}

// ===== Main execution =====
async function fetchSangramImages() {
    console.log("🔍 Looking for 'Hotel Sangram' provider...\n");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Sangram%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Sangram' provider not found in database!");
        process.exit(1);
    }

    console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

    // Fetch all menu items for this provider
    const items = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, provider.id),
    });

    console.log(`📋 Total menu items: ${items.length}\n`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

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
            const simpleQuery = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' indian food';
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

fetchSangramImages().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
