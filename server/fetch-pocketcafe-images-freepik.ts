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
  // Clean up size markers
  let query = name.replace(/\(\d+"\)/g, '').replace(/\(\d+ ?PC\)/gi, '').replace(/\(.*?\)/g, '').trim();

  const mappings: Record<string, string> = {
    'CAWA': 'thick cold coffee special',
    'Swiss Coffee': 'swiss mocha coffee',
    'Affogato': 'affogato espresso ice cream',
    'Kala Khatta': 'kala khatta black plum drink',
    'Chilli Gauva': 'chilli guava drink spicy',
    'Kimchy Burger': 'kimchi burger spicy',
    'Lawa Cake': 'lava cake chocolate molten',
    'Chocolaty B': 'chocolate brownie dessert',
    'Smiley': 'smiley potato snack fried',
    'Potato Pops': 'potato bites fried snack',
    'Bombay Sandwich': 'bombay sandwich mumbai street food',
    'Veg Cheese Grilled': 'veg cheese grilled sandwich',
    'Garlic Corn Cheese': 'garlic corn cheese sandwich grilled',
    'Extra Cheese Slice': 'cheese slice topping',
    'Cheese Slice': 'cheese slice',
    'Cheese Dip': 'cheese dip sauce',
    'Water Bottle': 'mineral water bottle',
    'Mayonnaise': 'mayonnaise dip sauce',
    'Peri Peri Fries / Kimchi Fries': 'peri peri french fries spicy',
    'Veg Masala Maggi / Peri Peri Maggi': 'masala maggi noodles',
    'Momos (Fried / Steam)': 'steamed fried momos dumplings',
  };
  for (const [key, value] of Object.entries(mappings)) { if (name.includes(key)) return value; }

  if (category === 'Signature Blend') return `${query} cold coffee cafe`;
  if (category === 'Thick Shake') return `${query} thick milkshake`;
  if (category === 'Cooling Cooler') return `${query} cooler drink`;
  if (category === 'Mystic Mocktails') return `${query} mocktail`;
  if (category === 'Lemon Twist') return `${query} lemon drink`;
  if (category === 'On The Rock Ice Tea') return `${query} iced tea`;
  if (category === 'Hot Beverages') return `${query} hot coffee`;
  if (category === 'Tea') return `${query} tea`;
  if (category === 'Pizza On Fire') return `${query} pizza`;
  if (category === 'Garlic Bread') return `${query} garlic bread`;
  if (category === 'Chocolate Magic') return `${query} chocolate dessert`;
  if (category === 'Extras') return `${query}`;
  if (category === 'Soulmate Sandwich') return `${query} grilled sandwich`;
  if (category === 'Born For Burgers') return `${query} burger`;
  if (category === 'Creamy Pasta') return `${query} pasta`;
  if (category === 'Wrap') return `${query} wrap tortilla`;
  if (category === 'Forever French Fries') return `${query} french fries`;
  if (category === 'Appetizer') return `${query} appetizer snack`;
  if (category === 'Maggi') return `${query} maggi noodles`;
  if (category === 'Melting Momos') return `${query} momos dumplings`;
  return `${query} cafe food`;
}

async function fetchPocketCafeImages() {
  console.log("🔍 Looking for 'Pocket Cafe' provider...\n");
  const provider = await db.query.serviceProviders.findFirst({ where: ilike(serviceProviders.businessName, "%Pocket%") });
  if (!provider) { console.error("❌ Not found!"); process.exit(1); }
  console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

  const items = await db.query.restaurantMenuItems.findMany({ where: eq(restaurantMenuItems.providerId, provider.id) });
  console.log(`📋 Total: ${items.length}\n`);

  let updated = 0, failed = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
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

fetchPocketCafeImages().catch((err) => { console.error("Fatal:", err); process.exit(1); });
