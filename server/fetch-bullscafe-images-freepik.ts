import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const API_KEYS = [
  "FPSXb268d27481311606044f86e0151332e8",
  "FPSX9c158ba66cc15391497140bb50d1ad83",
  "FPSXb0d5d3d0b2ea09ed7841d9df7c711e72",
];
let currentKeyIndex = 0;
let exhaustedKeys = new Set<number>();

function getNextKey(): string | null {
  if (exhaustedKeys.size >= API_KEYS.length) return null;
  while (exhaustedKeys.has(currentKeyIndex)) { currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length; }
  return API_KEYS[currentKeyIndex];
}
function markKeyExhausted(index: number) {
  exhaustedKeys.add(index);
  console.log(`  ⚠️ Key #${index + 1} rate-limited. ${API_KEYS.length - exhaustedKeys.size} remaining.`);
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

async function searchFreepik(query: string): Promise<string | null> {
  let attempts = 0;
  while (attempts < API_KEYS.length + 1) {
    const apiKey = getNextKey();
    if (!apiKey) { console.log("  ⏳ All keys exhausted. Waiting 60s..."); await new Promise(r => setTimeout(r, 60000)); exhaustedKeys.clear(); continue; }
    const keyIndex = currentKeyIndex;
    try {
      const res = await fetch(`https://api.freepik.com/v1/resources?locale=en-US&term=${encodeURIComponent(query)}&page=1&limit=1&order=relevance`, {
        headers: { 'Accept-Language': 'en-US', 'Accept': 'application/json', 'x-freepik-api-key': apiKey }
      });
      if (res.status === 429) { markKeyExhausted(keyIndex); attempts++; continue; }
      if (!res.ok) { console.error(`  API Error: ${res.status}`); return null; }
      const data = await res.json() as any;
      if (data.data?.[0]) {
        const item = data.data[0];
        return item.image?.source?.url || item.image?.source?.medium?.url || item.source?.url || item.images?.[0]?.url || item.url || null;
      }
      return null;
    } catch (e) { console.error(`  Failed:`, e); return null; }
  }
  return null;
}

function generateSearchQuery(name: string, category: string): string {
  let query = name.replace(/\(7"\)/g, '').replace(/\(.*?\)/g, '').trim();

  const mappings: Record<string, string> = {
    'Choco Lava Cake': 'chocolate lava cake molten',
    'Margherita Pizza': 'margherita pizza tomato basil',
    'Makhani Cheesy Pizza': 'paneer makhani pizza',
    'Farm Choice Pizza': 'farmhouse veg pizza',
    'Lovers Choice Pizza': 'mushroom capsicum pizza',
    'Pepe Paneer Pizza': 'paneer capsicum pizza',
    'Cheesy Mushroom Pizza': 'mushroom cheese pizza',
    'Double Burst Pizza': 'cheese burst pizza',
    'Chutney Cheese Sandwich': 'green chutney cheese sandwich',
    'Veg Cheese Grilled Sandwich': 'veg grilled cheese sandwich',
    'Masala Cheese Grilled Sandwich': 'masala cheese sandwich',
    'Cheese Chilli Grilled Sandwich': 'chilli cheese sandwich',
    'Garlic Cheese Grilled Sandwich': 'garlic cheese sandwich',
    'Hot Coffee': 'hot cappuccino coffee',
    'Thick Cold Coffee': 'thick cold coffee chocolate',
    'Blue Ocen Mojito': 'blue curacao mojito',
    'Blueberry Mojito': 'blueberry mojito drink',
    'Kala Khata Mojito': 'kala khatta drink',
    'Mint Mojito': 'virgin mint mojito',
    'Leman Ice Tea': 'lemon iced tea',
    'Green Apple Mojito': 'green apple mojito',
    'Peach Ice Tea Mojito': 'peach iced tea',
    'Watermelon Mojito': 'watermelon mojito',
    'Harabhara Kawab': 'hara bhara kabab',
    'Aloo Tikki Cheese Burger': 'aloo tikki burger cheese',
    'Shezwan Cheese Burger': 'schezwan burger',
  };

  for (const [key, value] of Object.entries(mappings)) { if (name.includes(key)) return value; }

  if (category.toLowerCase().includes('pizza')) return `${query} pizza gourmet`;
  if (category.toLowerCase().includes('burger')) return `${query} burger`;
  if (category.toLowerCase().includes('sandwich')) return `${query} sandwich`;
  if (category.toLowerCase().includes('momos')) return `${query} momos dumplings`;
  if (category.toLowerCase().includes('fries')) return `${query} french fries`;
  if (category.toLowerCase().includes('cocktail') || category.toLowerCase().includes('mocktail')) return `${query} cocktail drink`;
  
  return `${query} cafe food`;
}

async function fetchBullsCafeImages() {
  console.log("🔍 Looking for 'Bulls & Trader cafe' provider...\n");
  const provider = await db.query.serviceProviders.findFirst({ where: ilike(serviceProviders.businessName, "%Bulls%") });
  if (!provider) { console.error("❌ Not found!"); process.exit(1); }
  console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

  const items = await db.query.restaurantMenuItems.findMany({ where: eq(restaurantMenuItems.providerId, provider.id) });
  console.log(`📋 Total: ${items.length}\n`);

  let updated = 0, failed = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.imageUrl && item.imageUrl.includes('freepik.com')) {
        console.log(`[${i + 1}/${items.length}] "${item.name}" SKIPPED (Already has Freepik image)`);
        continue;
    }

    const query = generateSearchQuery(item.name, item.category || '');
    console.log(`[${i + 1}/${items.length}] "${item.name}" → "${query}"`);

    let imageUrl = await searchFreepik(query);
    if (!imageUrl) {
      const fallback = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' food';
      console.log(`  ↻ Retry: "${fallback}"`);
      imageUrl = await searchFreepik(fallback);
    }
    if (imageUrl) {
      await db.update(restaurantMenuItems).set({ imageUrl }).where(eq(restaurantMenuItems.id, item.id));
      updated++;
      console.log(`  ✅ ${imageUrl.substring(0, 80)}...`);
    } else { failed++; console.log(`  ❌ No image`); }
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${"=".repeat(50)}\n🎉 DONE! ✅ ${updated}/${items.length} updated, ❌ ${failed} failed\n${"=".repeat(50)}`);
  process.exit(0);
}

fetchBullsCafeImages().catch((err) => { console.error("Fatal:", err); process.exit(1); });
