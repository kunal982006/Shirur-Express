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
  let query = name.replace(/\(.*?\)/g, '').replace(/M\/s\./g, '').replace(/Half|Full|Limited/gi, '').trim();

  const mappings: Record<string, string> = {
    'Shabudana Khichdi': 'sabudana khichdi indian fasting food',
    'Shevbhaji': 'shev bhaji maharashtrian curry',
    'Shevtamatar': 'shev tamatar maharashtrian tomato curry',
    'Pithala': 'pitla besan curry maharashtrian',
    'Besan': 'pitla besan curry maharashtrian',
    'Dumalu Punjabi': 'dum aloo punjabi potato curry',
    'Bhendi Fry': 'bhindi fry okra indian',
    'Bhendi Masala': 'bhindi masala okra curry',
    'Matki Masala': 'matki usal moth bean curry',
    'Matki Fry': 'matki dry moth bean',
    'Baingain Masala': 'baingan masala eggplant curry',
    'Lasuni Palak': 'garlic spinach indian',
    'Plain Palak': 'palak spinach curry indian',
    'Methi Masala': 'methi masala fenugreek curry',
    'Methi Fry': 'methi fry fenugreek indian',
    'Akkha Masoor': 'whole masoor dal indian lentil',
    'Soyabean Fry': 'soybean fry indian dry sabzi',
    'Soyabean Masala': 'soybean masala curry indian',
    'Soyabin Chilly': 'soybean chilli dry indian starter',
    'Gobi Sixtyfive': 'gobi 65 cauliflower crispy indian',
    'Paneer Sixtyfive': 'paneer 65 crispy indian starter',
    'Greenpeace Masala': 'green peas masala curry indian',
    'Greenpeace Fry': 'green peas fry indian',
    'Greenpeace Palak': 'green peas palak spinach curry',
    'Dahi Wati': 'dahi curd bowl indian',
    'Rayata': 'raita yogurt indian',
    'Veg Rayata': 'vegetable raita yogurt indian',
    'Onion Rayata': 'onion raita indian',
    'Alu Rayata': 'aloo raita potato yogurt',
    'Alu Jeera': 'aloo jeera cumin potato indian',
    'Alu Masala': 'aloo masala potato curry indian',
    'Alu Palak': 'aloo palak spinach potato',
    'Alu Mutter': 'aloo matar peas potato curry',
    'Paneer Bhurji': 'paneer bhurji scrambled indian',
    'Shyam Sabera': 'paneer kofta mixed veg indian special',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key)) return value;
  }

  if (category === 'Cold Drinks' || category === 'Soda') return `${query} indian beverage drink`;
  if (category === 'Soup') return `${query} indian soup bowl`;
  if (category === 'Starter') return `${query} indo chinese starter`;
  if (category === 'Chinese Rice') return `${query} indo chinese fried rice`;
  if (category === 'Thali') return `${query} indian thali platter`;
  if (category === 'Handi Special') return `${query} handi indian clay pot curry`;
  if (category === 'Special Dishes') return `${query} paneer indian special curry`;
  if (category === 'Rayta') return `${query} raita yogurt indian`;
  if (category === 'Upvass') return `${query} indian fasting food`;

  return `${query} indian food dish`;
}

async function fetchGurukrupaImages() {
  console.log("🔍 Looking for 'Hotel Gurukrupa' provider...\n");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%Gurukrupa%"),
  });

  if (!provider) {
    console.error("❌ 'Hotel Gurukrupa' provider not found in database!");
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

fetchGurukrupaImages().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
