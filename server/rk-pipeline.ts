import 'dotenv/config';
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import { v2 as cloudinary } from 'cloudinary';

// ===== CLOUDINARY INIT =====
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
});

// ===== 4 Freepik API Keys with rotation =====
const API_KEYS = [
  "FPSXb268d27481311606044f86e0151332e8",
  "FPSX9c158ba66cc15391497140bb50d1ad83",
  "FPSXb0d5d3d0b2ea09ed7841d9df7c711e72",
  "FPSX7f3c5539dff2f5502a8f77590e30b374"
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
  console.log(`  ⚠️ Key #${index + 1} rate-limited.`);
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
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (data.data?.[0]) {
        const item = data.data[0];
        return item.image?.source?.url || item.image?.source?.medium?.url || item.source?.url || item.images?.[0]?.url || item.url || null;
      }
      return null;
    } catch (e) { return null; }
  }
  return null;
}

function generateSearchQuery(name: string, category: string): string {
  let query = name.replace(/\(.*?\)/g, '').replace(/\d+ ?Pcs?/gi, '').replace(/Half|Full|Limited/gi, '').trim();

  const mappings: Record<string, string> = {
    'Akkha Masoor': 'whole masoor dal indian',
    'Shevbhaji': 'shev bhaji maharashtrian curry',
    'Shev Tomato': 'shev tamatar curry',
    'Matki Masala': 'matki usal moth bean curry',
    'Baingan Masala': 'baingan masala eggplant curry',
    'Bhendi': 'bhindi okra indian',
    'Besan (Pithla)': 'pitla besan curry maharashtrian',
    'Besan': 'pitla besan curry maharashtrian',
    'Shevga': 'drumstick curry morsing indian',
    'Lasun Palak': 'lehsuni palak garlic spinach',
    'Alu Palak': 'aloo palak spinach potato',
    'Veg Kolhapuri': 'veg kolhapuri spicy curry',
    'Veg Maratha': 'veg maratha spicy curry',
    'Veg Handi': 'veg handi clay pot curry',
    'Bajarichi Bhakri': 'bajra bhakri millet flatbread',
    'Naan (Sadha)': 'plain naan indian bread',
    'Macchi': 'fish fry fish curry indian seafood',
    'Sukat Fry': 'dried fish sukati fry bombay duck maharashtrian',
    'Bombil Fry': 'bombil bombay duck fish fry maharashtrian',
    'Kaleji Fry': 'mutton liver kaleji fry',
    'Anda Half Fry': 'half fry egg sunny side up',
    'Anda Bhurji': 'egg bhurji scrambled indian',
    'Mutton Ukhar': 'mutton alni broth clear soup maharashtrian',
    'Chicken Ukhar': 'chicken alni broth clear soup maharashtrian',
    'Boiler': 'chicken curry',
    'Gavran': 'country chicken curry desi murgh',
    'Rassa Plate': 'spicy gravy rassa plate maharashtrian',
    'Rassa Vati': 'spicy gravy rassa bowl maharashtrian',
    'Malvani': 'malvani chicken curry coastal',
    'Dal Bati': 'dal bati rajasthani',
  };
  for (const [key, value] of Object.entries(mappings)) { if (name.includes(key)) return value; }

  if (category === 'Veg Main Course') return `${query} vegetarian indian curry`;
  if (category === 'Special Veg') return `${query} vegetarian indian curry special`;
  if (category === 'Veg Snacks') return `${query} dry vegetable starter indian`;
  if (category === 'Papad') return `${query} papadum fry roasted`;
  if (category === 'Roti / Bhakri / Naan') return `${query} indian flatbread`;
  if (category === 'Non-Veg Thali') return `${query} non veg thali platter maharashtrian`;
  if (category === 'Non-Veg Snacks') return `${query} non veg starter fry indian`;
  if (category === 'Non-Veg Dishes') return `${query} spicy non veg curry indian`;
  if (category === 'Non-Veg Handi' || category === 'Malvani Handi') return `${query} handi meat curry indian`;
  if (category === 'Kitchen Service') return `${query} raw meat preparation indian curry`;
  if (category === 'Rice') return `${query} rice dish indian`;

  return `${query} indian food`;
}

async function runRkPipeline() {
  console.log("== Starting Hotel RK Pipeline ==");
  const provider = await db.query.serviceProviders.findFirst({ where: ilike(serviceProviders.businessName, "%Hotel RK%") });
  if (!provider) { console.error("❌ Not found!"); process.exit(1); }
  console.log(`✅ Found: ${provider.businessName} (ID: ${provider.id})`);

  const items = await db.query.restaurantMenuItems.findMany({ where: eq(restaurantMenuItems.providerId, provider.id) });
  console.log(`📋 Total: ${items.length}\n`);

  let fetched = 0, migrated = 0, failed = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.imageUrl && item.imageUrl.includes("cloudinary.com")) {
        console.log(`[${i + 1}/${items.length}] "${item.name}" already has cloudinary. Skipping.`);
        continue;
    }

    let imageUrl = item.imageUrl;

    if (!imageUrl || !imageUrl.startsWith("http")) {
        const query = generateSearchQuery(item.name, item.category || '');
        console.log(`[${i + 1}/${items.length}] "${item.name}" → Searching Freepik: "${query}"`);
        imageUrl = await searchFreepik(query);
        
        if (!imageUrl) {
             const fallback = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/Half|Full/gi, '').trim() + ' indian food';
             console.log(`  ↻ Retry: "${fallback}"`);
             imageUrl = await searchFreepik(fallback);
        }
        if (imageUrl) {
             fetched++;
             console.log(`  ✅ Found on Freepik.`);
        }
    } else {
        console.log(`[${i + 1}/${items.length}] "${item.name}" has external URL: ${imageUrl.substring(0, 50)}...`);
    }

    if (imageUrl && !imageUrl.includes("cloudinary.com")) {
        try {
            console.log(`  ⬆️ Uploading to Cloudinary...`);
            const res = await cloudinary.uploader.upload(imageUrl, {
                folder: 'shirur-express/rk-menu',
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
            });
            await db.update(restaurantMenuItems).set({ imageUrl: res.secure_url }).where(eq(restaurantMenuItems.id, item.id));
            migrated++;
            console.log(`  ✅ Migrated: ${res.secure_url}`);
        } catch (err) {
            console.error("  ❌ Cloudinary fail:", err);
            // backup save original url
            await db.update(restaurantMenuItems).set({ imageUrl }).where(eq(restaurantMenuItems.id, item.id));
        }
    } else if (!imageUrl) {
        failed++;
        console.log(`  ❌ No image found / failed.`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🎉 DONE RK PIPELINE ✅ Fetched: ${fetched}, Migrated: ${migrated}, ❌ Failed: ${failed}`);
  process.exit(0);
}

runRkPipeline().catch(console.error);
