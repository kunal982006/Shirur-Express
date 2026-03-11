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

async function searchFreepik(query: string): Promise<string | null> {
  let attempts = 0;
  while (attempts < API_KEYS.length + 1) {
    const apiKey = getNextKey();
    if (!apiKey) {
      console.log("  ⏳ All 3 API keys rate-limited. Waiting 60 seconds...");
      await new Promise(r => setTimeout(r, 60000));
      exhaustedKeys.clear();
      continue;
    }
    const keyIndex = currentKeyIndex;
    const url = `https://api.freepik.com/v1/resources?locale=en-US&term=${encodeURIComponent(query)}&page=1&limit=1&order=relevance`;
    try {
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-US', 'Accept': 'application/json', 'x-freepik-api-key': apiKey }
      });
      if (res.status === 429) { markKeyExhausted(keyIndex); attempts++; continue; }
      if (!res.ok) { console.error(`  Freepik API Error: ${res.status}`); return null; }
      const data = await res.json() as any;
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        return item.image?.source?.url || item.image?.source?.medium?.url || item.image?.source?.small?.url || item.source?.url || (item.images?.[0]?.url) || item.url || null;
      }
      return null;
    } catch (e) { console.error(`  Freepik search failed:`, e); return null; }
  }
  return null;
}

function generateSearchQuery(name: string, category: string): string {
  let query = name.replace(/\(.*?\)/g, '').replace(/Half|Full/gi, '').trim();

  const mappings: Record<string, string> = {
    'Peri-Peri Fries': 'peri peri french fries spicy',
    'Double Deacker': 'double decker burger',
    'Cholocate Grill Sandwich': 'chocolate grilled sandwich',
    'Red Sause Pasta': 'red sauce pasta arrabiata',
    'White Sause Pasta': 'white sauce pasta alfredo',
    'Cheesee Pasta': 'cheesy pasta creamy',
    'Blue Laggon': 'blue lagoon mocktail drink',
    'Virgine Mojito': 'virgin mojito mocktail',
    'Orea Shake': 'oreo milkshake',
    'Strawbery Shake': 'strawberry milkshake',
    'Spl Mango Mastani': 'mango mastani pune milkshake',
    'Manchaw Soup': 'manchow soup indian',
    'Vegitable Momo': 'vegetable momos steamed',
    'Schezwan Momo': 'schezwan fried momos',
    'Singapuri Noodles': 'singapore noodles',
    'Tripple Noodles': 'triple schezwan noodles',
    'Singapuri Fried Rice': 'singapore fried rice',
    'Brocoby Onion Pizza': 'broccoli onion pizza',
    'Khada Pav Bhaji': 'khada pav bhaji chunky',
    'Jain Pav Bhaji': 'jain pav bhaji no onion garlic',
    'Woodspecial Masala Tea': 'masala chai indian tea',
    'Golden Tea': 'golden milk turmeric tea',
    'Sizzling Brownie': 'sizzling brownie with ice cream',
    'Choclate Ice-Cream': 'chocolate ice cream scoop',
    'Vanila Ice-Cream': 'vanilla ice cream scoop',
    'Cheese Corn Bowl': 'cheese corn bowl snack',
    'Chilly Potato': 'chilli potato indian starter',
    'Sweet Corn Chilly': 'sweet corn chilli dry starter',
    'With Cheese': 'cheese topping extra',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key)) return value;
  }

  if (category === 'French Fries') return `${query} french fries`;
  if (category === "Burger'Z") return `${query} burger`;
  if (category === 'Sandwich') return `${query} grilled sandwich`;
  if (category === 'Pasta') return `${query} pasta`;
  if (category === 'Toast') return `${query} toast`;
  if (category === "Mocktail's") return `${query} mocktail drink`;
  if (category === "Cold Coffee's") return `${query} cold coffee`;
  if (category === "Shake's") return `${query} milkshake`;
  if (category === 'Tea') return `${query} tea`;
  if (category === 'Coffee') return `${query} coffee`;
  if (category === 'Dessert') return `${query} dessert`;
  if (category === 'Pav Bhaji') return `${query} pav bhaji mumbai street food`;
  if (category === "Soup's") return `${query} soup`;
  if (category === "Momo's" || category === "Fried Momo's") return `${query} momos dumpling`;
  if (category === 'Chinese Noodles') return `${query} noodles`;
  if (category === 'Chinese Rice') return `${query} fried rice`;
  if (category === "Pizza's") return `${query} pizza`;
  if (category === "Woodland Special Starter's") return `${query} cafe starter snack`;

  return `${query} cafe food`;
}

async function fetchWoodlandImages() {
  console.log("🔍 Looking for 'Woodland Cafe' provider...\n");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%Woodland%"),
  });

  if (!provider) {
    console.error("❌ 'Woodland Cafe' provider not found in database!");
    process.exit(1);
  }

  console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, provider.id),
  });

  console.log(`📋 Total menu items: ${items.length}\n`);

  let updated = 0, failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const query = generateSearchQuery(item.name, item.category || '');
    console.log(`[${i + 1}/${items.length}] "${item.name}" (${item.category}) → "${query}"`);

    let imageUrl = await searchFreepik(query);

    if (!imageUrl) {
      const simpleQuery = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' food';
      console.log(`  ↻ Retrying: "${simpleQuery}"`);
      imageUrl = await searchFreepik(simpleQuery);
    }

    if (imageUrl) {
      await db.update(restaurantMenuItems).set({ imageUrl }).where(eq(restaurantMenuItems.id, item.id));
      updated++;
      console.log(`  ✅ ${imageUrl.substring(0, 80)}...`);
    } else {
      failed++;
      console.log(`  ❌ No image found`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 DONE! ✅ ${updated}/${items.length} updated, ❌ ${failed} failed`);
  console.log(`${"=".repeat(50)}`);
  process.exit(0);
}

fetchWoodlandImages().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
