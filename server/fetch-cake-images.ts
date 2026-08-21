import 'dotenv/config';
import { db } from "./db";
import { cakeProducts } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

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
    console.log(`Key #${index + 1} rate-limited. ${API_KEYS.length - exhaustedKeys.size} keys remaining.`);
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchImageForItem(itemName: string, category: string): Promise<string | null> {
    const searchQuery = `${itemName} high quality food photography`;
    
    while (true) {
        const apiKey = getNextKey();
        if (!apiKey) {
            console.error("All Freepik API keys are exhausted!");
            return null;
        }

        try {
            const url = `https://api.freepik.com/v1/resources?locale=en-US&page=1&limit=1&term=${encodeURIComponent(searchQuery)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'en-US',
                    'Accept': 'application/json',
                    'x-freepik-api-key': apiKey
                }
            });

            if (response.status === 429) {
                markKeyExhausted(currentKeyIndex);
                continue;
            }

            if (!response.ok) {
                console.warn(`API Error (${response.status}) for ${itemName}`);
                return null;
            }

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return data.data[0].image.source.url;
            } else {
                console.log(`No images found for: ${itemName}`);
                return null;
            }

        } catch (error) {
            console.error(`Fetch failed for ${itemName}:`, error);
            return null;
        }
    }
}

async function run() {
    console.log("Fetching cakes that need images...");
    const items = await db.query.cakeProducts.findMany({
        where: isNull(cakeProducts.imageUrl)
    });

    console.log(`Found ${items.length} items to update.`);
    let updatedCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`[${i+1}/${items.length}] Fetching image for: ${item.name} (${item.category})`);
        
        const imageUrl = await fetchImageForItem(item.name, item.category || "");
        
        if (imageUrl) {
            await db.update(cakeProducts)
                .set({ imageUrl })
                .where(eq(cakeProducts.id, item.id));
            console.log(`Updated ${item.name} with image: ${imageUrl}`);
            updatedCount++;
        }
        
        await sleep(500); 
    }

    console.log(`\nFinished! Updated ${updatedCount}/${items.length} items.`);
    process.exit(0);
}

run();
