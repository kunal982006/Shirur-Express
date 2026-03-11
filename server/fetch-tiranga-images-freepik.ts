import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

// ===== 3 Freepik API Keys with rotation =====
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

function generateSearchQuery(name: string, category: string): string {
  let query = name.replace(/\(.*?\)/g, '').replace(/M\/s\./g, '').replace(/Half|Full/gi, '').trim();

  const mappings: Record<string, string> = {
    'Gavran Chicken': 'country chicken desi murgh indian',
    'Chicken Kaleji Petha': 'chicken liver gizzard fry indian',
    'Chicken Kheema': 'chicken keema mince indian',
    'Mutton Kheema': 'mutton keema mince indian',
    'Anda Curry': 'egg curry indian',
    'Anda Masala': 'egg masala indian spicy',
    'Chicken Murg Mussallam': 'murgh musallam whole chicken indian',
    'Vajadi Masala': 'vajadi tripe masala non veg indian',
    'Vajadi Fry': 'vajadi tripe fry non veg indian',
    'Shevbhaji': 'shev bhaji maharashtrian curry',
    'Plain Palak': 'palak spinach curry indian',
    'Chicken Seek': 'chicken seekh kebab indian',
    'Chicken KFC': 'fried chicken crispy',
    'Chicken Kadi Gosh': 'chicken curry bone piece',
    'Chicken Tutti-Fruti': 'chicken sweet sour dry indian',
    'Lollipop Oil Fry': 'chicken lollipop fried indian',
    'Lollipop Masala Dry': 'chicken lollipop masala dry indian',
    'Chicken Dal Gost': 'chicken dal gosht lentil meat',
    'Mutton Dal Gost': 'mutton dal gosht lentil meat',
    'Chicken Achar Gost': 'chicken pickle achar gosht indian',
    'Mutton Achar Gost': 'mutton pickle achar gosht indian',
    'Laccha Paratha': 'laccha paratha layered indian bread',
    'Rumali Roti': 'rumali roti thin indian bread',
    'Sadha Naan': 'plain naan indian bread',
    'Thumbs Up': 'cold drink soda bottle indian',
    'Maaza': 'mango drink juice indian',
    'Jeera Soda': 'jeera soda cumin drink indian',
    'Water Bottle': 'mineral water bottle',
    'Dal Khichdi': 'dal khichdi indian comfort food',
    'Matar Paneer': 'matar paneer peas curry indian',
    'Chicken Dalcha': 'chicken dalcha lentil hyderabadi',
    'Mutton Dalcha': 'mutton dalcha lentil hyderabadi',
    'Chicken Garlic Kheema': 'garlic chicken keema mince',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key)) return value;
  }

  if (category === 'Chicken Main Course') return `${query} chicken curry indian`;
  if (category === 'Mutton Main Course') return `${query} mutton curry indian`;
  if (category === 'Chicken Starter') return `${query} chicken starter appetizer indian`;
  if (category === 'Biryani & Rice') return `${query} biryani rice indian`;
  if (category === 'Chinese Rice') return `${query} chicken fried rice indo chinese`;
  if (category === 'Chinese Noodles') return `${query} chicken noodles indo chinese`;
  if (category === 'Roti') return `${query} indian bread`;
  if (category === 'Thali') return `${query} indian thali platter non veg`;
  if (category === 'Veg Main Course') return `${query} vegetarian indian curry`;
  if (category === 'Cold Drinks') return `${query} cold drink beverage`;

  return `${query} indian food dish`;
}

async function fetchTirangaImages() {
  console.log("🔍 Looking for 'Hotel Tiranga' provider...\n");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%Tiranga%"),
  });

  if (!provider) {
    console.error("❌ 'Hotel Tiranga' provider not found in database!");
    process.exit(1);
  }

  console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, provider.id),
  });

  console.log(`📋 Total menu items: ${items.length}\n`);

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

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 DONE!`);
  console.log(`   ✅ Updated: ${updated}/${items.length}`);
  console.log(`   ❌ Failed:  ${failed}/${items.length}`);
  console.log(`${"=".repeat(50)}`);

  process.exit(0);
}

fetchTirangaImages().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
