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
        return null;
      }
      const data = await res.json() as any;
      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        return item.image?.source?.url || item.image?.source?.medium?.url || item.image?.source?.small?.url || item.source?.url || (item.images && item.images.length > 0 ? item.images[0].url : null) || item.url || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function generateSearchQuery(name: string): string {
    if (name.includes("चिकन")) {
      if (name.includes("फ्राय")) return "chicken fry indian dry";
      if (name.includes("कुक्कडू")) return "chicken thali indian spicy";
      return "chicken curry thali maharashtrian nonveg platters";
    }
    if (name.includes("मटन")) {
      if (name.includes("फ्राय")) return "mutton fry indian dry";
      return "mutton sukka curry thali maharashtrian";
    }
    if (name.includes("मच्छी")) return "fish thali fried fish curry indian";
    if (name.includes("अंडा")) return "egg curry thali indian food";
    
    return "maharashtrian nonveg thali chicken mutton";
}

async function processSaniraje() {
  console.log("🔍 Looking for 'Hotel Saniraje' provider...\n");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%Saniraje%"),
  });

  if (!provider) {
    console.error("❌ 'Hotel Saniraje' provider not found!");
    process.exit(1);
  }

  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, provider.id),
  });

  console.log(`📋 Total menu items: ${items.length}\n`);

  let fetched = 0;
  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.imageUrl && item.imageUrl.includes("cloudinary.com")) {
        console.log(`[${i + 1}/${items.length}] "${item.name}" already has cloudinary image. Skipping.`);
        continue;
    }

    const query = generateSearchQuery(item.name);
    console.log(`[${i + 1}/${items.length}] "${item.name}" → Query: "${query}"`);

    let imageUrl = await searchFreepik(query);

    if (imageUrl) {
        fetched++;
        console.log(`  ✅ Found on Freepik: ${imageUrl.substring(0, 60)}...`);
        
        try {
            console.log(`  ⬆️ Uploading to Cloudinary...`);
            const result = await cloudinary.uploader.upload(imageUrl, {
                folder: 'shirur-express/saniraje-menu',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
                ]
            });

            await db.update(restaurantMenuItems)
              .set({ imageUrl: result.secure_url })
              .where(eq(restaurantMenuItems.id, item.id));
              
            migrated++;
            console.log(`  ✅ Migrated: ${result.secure_url}`);
        } catch (uploadErr) {
             console.error(`  ❌ Cloudinary Upload Failed`);
             await db.update(restaurantMenuItems).set({ imageUrl }).where(eq(restaurantMenuItems.id, item.id));
        }

    } else {
        failed++;
        console.log(`  ❌ No image found`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🎉 DONE! ✅ Fetched: ${fetched}, Migrated: ${migrated}, ❌ Failed: ${failed}`);
  process.exit(0);
}

processSaniraje().catch(console.error);
