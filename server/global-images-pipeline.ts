import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, or, isNull, sql } from "drizzle-orm";
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
  let query = name.replace(/\(.*?\)/g, '').replace(/\d+ ?Pcs?/gi, '').replace(/Half|Full|Limited/gi, '').trim().toLowerCase();

  const mappings: Record<string, string> = {
    'manchow soup': 'veg manchow soup indian bowl',
    'tomato soup': 'tomato soup indian bowl',
    'roasted papad': 'roasted papad indian starter',
    'masala papad': 'masala papad indian starter',
    'chilli dry': 'paneer chilli dry indo chinese',
    'chilli gravy': 'paneer chilli gravy indo chinese',
    'manchurian': 'veg manchurian indo chinese',
    'veg kolhapuri': 'veg kolhapuri spicy curry',
    'veg maratha': 'veg maratha spicy curry',
    'kaju curry': 'kaju curry masala indian veg white gravy',
    'palak paneer': 'palak paneer spinach indian curry',
    'malai kofta': 'malai kofta sweet indian curry',
    'dal fry': 'dal fry tadka indian bowl',
    'dal tadka': 'dal tadka indian bowl',
    'jeera rice': 'jeera rice indian',
    'veg pulao': 'veg pulao indian',
    'veg biryani': 'veg biryani indian',
    'chicken thali': 'chicken thali indian spicy maharashtrian',
    'mutton thali': 'mutton thali maharashtrian curry',
    'fish thali': 'fish thali maharashtrian seafood',
    'egg thali': 'egg thali curry indian',
    'veg thali': 'indian pure veg thali maharashtrian',
    'roti': 'indian roti flatbread plate',
    'naan': 'indian naan bread',
    'paratha': 'indian paratha plate',
    'bhakri': 'bajra bhakri millet flatbread',
  };
  
  for (const [key, value] of Object.entries(mappings)) { 
      if (query.includes(key)) return value; 
      // check original name un-lower-cased just in case
      if (name.toLowerCase().includes(key)) return value;
  }

  // Fallbacks by broad category keywords mapping
  const c = (category || "").toLowerCase();
  if (c.includes('veg main course') || c.includes('indian veg')) return `${query} vegetarian indian curry`;
  if (c.includes('soup')) return `${query} clear soup indian bowl`;
  if (c.includes('starter') || c.includes('snack')) return `${query} dry vegetable starter indian`;
  if (c.includes('bread') || c.includes('roti')) return `${query} indian flatbread`;
  if (c.includes('thali')) return `${query} thali platter maharashtrian`;
  if (c.includes('rice')) return `${query} rice dish indian`;
  if (c.includes('chicken') || c.includes('non-veg')) return `${query} spicy meat curry indian`;
  if (c.includes('paneer')) return `${query} paneer indian veg curry`;
  if (c.includes('handi')) return `${query} handi pot curry indian`;

  return `${query} delicious indian food`;
}

async function runGlobalPipeline() {
  console.log("== Starting Global Menu Images Pipeline ==");

  // Find all items that:
  // 1. Have null/empty imageUrl
  // 2. Have placeholder images 
  // 3. Or have external images (like freepik direct urls) that aren't on cloudinary

  const ALL_ITEMS = await db.query.restaurantMenuItems.findMany();
  
  const placeholders = [
    "https://via.placeholder.com", 
    "placeholder", 
    "default",
    "https://images.unsplash.com" // generic unsplash images might be placeholders
  ];

  const itemsToProcess = ALL_ITEMS.filter(item => {
      if (!item.imageUrl) return true;
      if (item.imageUrl.trim() === "") return true;
      
      const lowerUrl = item.imageUrl.toLowerCase();
      
      if (!lowerUrl.includes("cloudinary.com")) return true; // migrate to cloudinary 
      
      for (const p of placeholders) {
          if (lowerUrl.includes(p)) return true;
      }
      
      return false;
  });

  console.log(`📋 Total items lacking dedicated Cloudinary images: ${itemsToProcess.length}\n`);

  let fetched = 0, migrated = 0, failed = 0;
  
  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    
    // Fetch provider name for context mapping in folders
    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.id, item.providerId)
    });
    const folderName = provider?.businessName ? provider.businessName.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 30) : "misc";

    let imageUrl = item.imageUrl;

    // Search Freepik if no valid visual external URL exists
    if (!imageUrl || !imageUrl.startsWith("http") || imageUrl.includes("placeholder") || imageUrl.includes("default")) {
        const query = generateSearchQuery(item.name, item.category || '');
        console.log(`[${i + 1}/${itemsToProcess.length}] "${item.name}" (Provider: ${provider?.businessName}) → Query: "${query}"`);
        imageUrl = await searchFreepik(query);
        
        if (!imageUrl) {
             const fallback = item.name.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/Half|Full|Sp\.|Special/gi, '').trim() + ' indian food';
             console.log(`  ↻ Retry: "${fallback}"`);
             imageUrl = await searchFreepik(fallback);
        }
        
        if (imageUrl) {
             fetched++;
             console.log(`  ✅ Found on Freepik.`);
        }
    } else {
        console.log(`[${i + 1}/${itemsToProcess.length}] "${item.name}" has external URL needing migration: ${imageUrl.substring(0, 50)}...`);
    }

    if (imageUrl && !imageUrl.includes("cloudinary.com")) {
        try {
            console.log(`  ⬆️ Uploading to Cloudinary...`);
            const res = await cloudinary.uploader.upload(imageUrl, {
                folder: `shirur-express/${folderName}`,
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
            });
            await db.update(restaurantMenuItems).set({ imageUrl: res.secure_url }).where(eq(restaurantMenuItems.id, item.id));
            migrated++;
            console.log(`  ✅ Migrated: ${res.secure_url}`);
        } catch (err) {
            console.error("  ❌ Cloudinary fail:", (err as any)?.message || err);
            // backup save original url if it wasn't there
            await db.update(restaurantMenuItems).set({ imageUrl }).where(eq(restaurantMenuItems.id, item.id));
        }
    } else if (!imageUrl) {
        failed++;
        console.log(`  ❌ No image found / failed.`);
    }

    await new Promise(r => setTimeout(r, 1200)); // Respect Rate Limits safely
  }

  console.log(`\n🎉 DONE GLOBAL PIPELINE ✅ Fetched: ${fetched}, Migrated: ${migrated}, ❌ Failed: ${failed}`);
  process.exit(0);
}

runGlobalPipeline().catch(console.error);
