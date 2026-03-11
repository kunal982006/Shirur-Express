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
  const mappings: Record<string, string> = {
    'Oli Bhel': 'wet bhel puri indian street food',
    'Simple Bhel': 'bhel puri indian street food',
    'Cheese Bhel': 'cheese bhel puri chaat',
    'Haldi Milk': 'haldi doodh turmeric milk golden',
    'Thick Bournvita': 'bournvita chocolate milk cold',
    'Kurkure Momos': 'kurkure momos crispy fried',
    'Kala Khatta Mojito': 'kala khatta black plum mocktail',
    'Café of Joy Sp. Cheese Burger': 'special cheese burger cafe',
    'Café of Joy Sandwich': 'special grilled sandwich cafe',
    'Café of Sp. Pizza': 'special loaded pizza',
    'Paneer Tiki Cheese Burger': 'paneer tikki burger cheese',
    'Extra Pav Jodi': 'pav bread buns indian',
    'Plain Maggie': 'plain maggi noodles',
    'Masala Maggie': 'masala maggi noodles indian',
    'Peri Peri Masala Cheese Maggie': 'peri peri cheese maggi noodles',
  };
  for (const [key, value] of Object.entries(mappings)) { if (name.includes(key)) return value; }

  if (category === 'Burger') return `${name} burger`;
  if (category === 'Pasta') return `${name} pasta`;
  if (category === 'Pizza') return `${name} pizza`;
  if (category === 'Brownie') return `${name} chocolate dessert`;
  if (category === 'Momos') return `${name} momos dumpling`;
  if (category === 'Pav Bhaji') return `${name} pav bhaji street food`;
  if (category === 'Bhel') return `${name} bhel chaat`;
  if (category === 'Hots') return `${name} hot beverage`;
  if (category === 'Cold Beverges') return `${name} cold drink`;
  if (category === 'Shake') return `${name} milkshake`;
  if (category === 'Mocktails') return `${name} mocktail`;
  if (category === 'Maggie') return `${name} maggi noodles`;
  if (category === 'Sandwich') return `${name} grilled sandwich`;
  if (category === 'Fries') return `${name} french fries`;
  return `${name} cafe food`;
}

async function fetchCafeOfJoyImages() {
  console.log("🔍 Looking for 'Cafe of Joy' provider...\n");
  const provider = await db.query.serviceProviders.findFirst({ where: ilike(serviceProviders.businessName, "%Cafe of Joy%") });
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

fetchCafeOfJoyImages().catch((err) => { console.error("Fatal:", err); process.exit(1); });
