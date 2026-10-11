import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { db } from './server/db';
import { restaurantMenuItems } from './shared/schema';
import { eq, or } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const PIXABAY_KEY = '57987275-462ff3ca19b4131426110fbef';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const TIRANGA_ID = 'haz4toiex4r3sn6kn1za5c5f';
const RASSA_BHAKRI_ID = 'nmzj6q3rchsf1od3ef9i2bb4';

// Search term overrides for best visual matching on Pixabay
const EXACT_SEARCH_MAPPINGS: Record<string, string> = {
  // Starters
  'chicken lollipop': 'chicken lollipop fried',
  'lollipop oil fry': 'chicken lollipop fried',
  'lollipop masala dry': 'chicken lollipop masala',
  'chicken chilli': 'chilli chicken',
  'chicken chilli dry': 'chilli chicken dry',
  'chicken chilli gravy': 'chilli chicken gravy',
  'chicken crispy': 'crispy fried chicken',
  'chicken drumstick': 'chicken drumstick fried',
  'chicken samosa': 'chicken samosa',
  'chicken roll': 'chicken kathi roll',
  'chicken stick': 'chicken satay kebab',
  'chicken steak': 'grilled chicken breast steak',
  'chicken 65': 'chicken 65 spicy',
  'chicken wings': 'crispy chicken wings',
  'chicken kfc': 'crispy fried chicken',
  'chicken seek': 'chicken seekh kebab',
  'chicken seekh': 'chicken seekh kebab',
  'chicken kadi gosh': 'chicken tikka kebab',
  'chicken kadi gosht': 'chicken tikka kebab',
  'chicken tutti fruti': 'crispy fried chicken',
  'chicken tutti-fruti': 'crispy fried chicken',

  // Chicken Main Course
  'chicken masala': 'chicken masala curry',
  'chicken curry': 'chicken curry indian',
  'chicken fry': 'chicken fry indian',
  'chicken korma': 'chicken korma curry',
  'chicken shahi korma': 'shahi korma chicken',
  'chicken shahi-korma': 'shahi korma chicken',
  'chicken angara': 'chicken tikka masala curry',
  'chicken kolhapuri': 'spicy chicken curry',
  'chicken kadhai': 'kadai chicken curry',
  'chicken do pyaza': 'chicken do pyaza curry',
  'butter chicken': 'butter chicken curry',
  'chicken handi': 'chicken handi curry',
  'chicken adraki': 'chicken ginger curry',
  'chicken lasuni': 'garlic chicken curry',
  'chicken lahsuni': 'garlic chicken curry',
  'chicken patiyala': 'punjabi chicken curry',
  'chicken tiranga': 'chicken curry bowl',
  'chicken roast': 'roasted chicken indian',
  'chicken makhani': 'butter chicken makhani',
  'chicken kheema fry': 'chicken keema mince',
  'chicken garlic kheema': 'chicken keema mince',
  'chicken pepper masala': 'pepper chicken curry',
  'chicken kaleji petha fry': 'chicken liver fry',
  'gavran chicken kala masala': 'country chicken curry',
  'gavran chicken fry': 'chicken fry spicy',
  'chicken hyderabadi': 'hyderabadi chicken curry',
  'chicken moglai': 'mughlai chicken curry',
  'chicken moghlai': 'mughlai chicken curry',
  'chicken sukka': 'chicken sukka masala',
  'chicken sukha': 'chicken sukka masala',
  'chicken khajana': 'rich chicken curry',
  'chicken maharaja': 'royal chicken curry',
  'chicken murg mussallam': 'tandoori whole chicken',
  'chicken bhuna': 'chicken bhuna masala',
  'chicken pepper dry': 'pepper chicken fry',
  'chicken dalcha': 'chicken lentil curry',
  'chicken dal gost': 'chicken lentil curry',
  'chicken dal gosht': 'chicken lentil curry',
  'chicken achar gost': 'achari chicken curry',
  'chicken achar gosht': 'achari chicken curry',
  'kerala chicken curry': 'kerala chicken curry',
  'chicken malvan fry': 'malvani chicken fry',
  'chicken malwar fry': 'malvani chicken fry',
  'chicken malvani': 'malvani chicken curry',

  // Mutton Main Course
  'mutton masala': 'mutton masala curry',
  'mutton curry': 'mutton curry indian',
  'mutton fry': 'mutton fry meat',
  'mutton korma': 'mutton korma curry',
  'mutton shahi korma': 'shahi korma lamb',
  'mutton shahi-korma': 'shahi korma lamb',
  'mutton kolhapuri': 'spicy mutton curry',
  'mutton kadhai': 'kadai gosht lamb curry',
  'mutton pepper masala': 'pepper mutton curry',
  'mutton makhani': 'lamb curry creamy',
  'mutton hyderabadi': 'hyderabadi mutton curry',
  'mutton handi': 'mutton handi curry',
  'mutton roast': 'roast lamb mutton',
  'mutton kheema fry': 'mutton keema mince',
  'mutton kheema masala': 'mutton keema curry',
  'mutton adraki': 'ginger mutton curry',
  'vajadi masala': 'mutton masala spicy',
  'vajadi fry': 'mutton fry dry',
  'mutton lasuni': 'garlic mutton curry',
  'mutton lahsuni': 'garlic mutton curry',
  'mutton malbar fry': 'kerala mutton fry',
  'mutton malwar fry': 'kerala mutton fry',
  'mutton achar gost': 'achari gosht mutton',
  'mutton achar gosht': 'achari gosht mutton',
  'mutton dal gost': 'dal gosht lamb',
  'mutton dal gosht': 'dal gosht lamb',
  'mutton dalcha': 'dal gosht lamb',
  'mutton angara': 'mutton masala curry',
  'mutton do pyaza': 'mutton do pyaza',
  'mutton roast pepper': 'pepper lamb fry',
  'mutton sukka': 'mutton sukka fry',
  'mutton malvani': 'mutton curry spicy',

  // Eggs
  'anda masala': 'egg masala curry',
  'anda curry': 'egg curry boiled',
  'egg curry': 'egg curry boiled',
  'egg masala': 'egg masala curry',
  'egg biryani': 'egg biryani rice',
  'egg fry': 'fried egg boiled',
  'egg thali': 'indian egg thali',
  'boiled egg': 'boiled egg peeled',

  // Biryani & Rice
  'chicken dum biryani': 'chicken dum biryani',
  'chicken biryani': 'chicken biryani',
  'mutton dum biryani': 'mutton biryani lamb',
  'mutton biryani': 'mutton biryani',
  'paneer biryani': 'paneer biryani rice',
  'jeera rice': 'jeera rice cumin',
  'chicken zamzam pulao': 'chicken pulao rice',
  'chicken zamzam pulav': 'chicken pulao rice',
  'chicken kashmiri pulao': 'kashmiri pulao rice',
  'chicken kashmiri pulav': 'kashmiri pulao rice',

  // Thali
  'chicken thali': 'indian chicken thali',
  'special chicken thali': 'indian non veg thali',
  'mutton thali': 'indian mutton thali',
  'special mutton thali': 'indian non veg thali',
  'tiranga special mutton thali': 'royal indian thali',

  // Chinese
  'chicken fried rice': 'chicken fried rice',
  'chicken schezwan rice': 'schezwan fried rice',
  'chicken triple rice': 'schezwan chicken rice',
  'chicken noodles': 'chicken hakka noodles',
  'chicken schezwan noodles': 'schezwan noodles',
  'chicken triple noodles': 'chicken chow mein noodles',

  // Veg
  'shevbhaji': 'sev bhaji curry',
  'paneer butter masala': 'paneer butter masala',
  'matar paneer': 'matar paneer curry',
  'palak paneer': 'palak paneer spinach',
  'plain palak': 'palak spinach curry',
  'kaju masala': 'kaju curry cashew',
  'kaju paneer masala': 'kaju paneer masala',
  'paneer kadhai': 'kadai paneer curry',
  'paneer angara': 'paneer tikka masala',
  'paneer korma': 'paneer korma curry',
  'paneer kolhapuri': 'paneer curry spicy',
  'paneer chilli': 'chilli paneer dry',
  'paneer masala': 'paneer masala curry',
  'dal tadka': 'dal tadka yellow lentils',
  'dal fry': 'dal fry yellow lentils',
  'dal makhani': 'dal makhani black lentils',
  'dal khichdi': 'dal khichdi comfort',
  'dal khichadi': 'dal khichdi comfort',
  'masala papad': 'masala papad snack',

  // Roti
  'chapati': 'chapati indian bread',
  'butter chapati': 'chapati butter roti',
  'tandoor roti': 'tandoori roti flatbread',
  'butter roti': 'tandoori roti butter',
  'rumali roti': 'rumali roti flatbread',
  'plain naan': 'plain naan tandoor',
  'butter naan': 'butter naan flatbread',
  'laccha paratha': 'laccha paratha flatbread',

  // Drinks
  'water bottle': 'mineral water bottle',
  'jeera soda': 'jeera soda beverage',
  'maaza': 'mango juice drink glass',
  'thumbs up': 'cola soda drink glass',
  'thums up': 'cola soda drink glass',
  'sprite': 'lemon soda cold drink',
  'sting': 'energy drink can glass',
  'thumbs up / sprite / sting': 'cold drink soda glass',
};

function normalizeName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\b(Half|Full|Plate|1 KG|M\/s\.)\b/gi, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getSearchQuery(name: string, category: string | null): string {
  const norm = normalizeName(name);
  if (EXACT_SEARCH_MAPPINGS[norm]) {
    return EXACT_SEARCH_MAPPINGS[norm];
  }
  for (const [key, q] of Object.entries(EXACT_SEARCH_MAPPINGS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return q;
    }
  }

  // Category based smart queries
  const cat = (category || '').toLowerCase();
  if (cat.includes('chicken starter')) return `${norm} chicken starter`;
  if (cat.includes('chicken')) return `${norm} chicken curry`;
  if (cat.includes('mutton')) return `${norm} mutton curry`;
  if (cat.includes('egg')) return `${norm} egg curry`;
  if (cat.includes('paneer')) return `${norm} paneer curry`;
  if (cat.includes('rice') || cat.includes('biryani')) return `${norm} biryani rice`;
  if (cat.includes('noodle')) return `${norm} noodles`;
  if (cat.includes('roti')) return `${norm} indian bread`;
  if (cat.includes('veg')) return `${norm} indian food`;
  if (cat.includes('drink')) return `${norm} cold drink`;

  return `${norm} indian food`;
}

// Pixabay cache to save queries across dishes
const imageCache = new Map<string, string>();

async function searchPixabay(query: string): Promise<string | null> {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&category=food&safesearch=true&per_page=3`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.status === 429) {
        console.log('  ⚠️ Pixabay rate limit reached! Pausing 60s...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }
      const remaining = parseInt(res.headers.get('x-ratelimit-remaining') || '50', 10);
      if (remaining <= 2) {
        const resetSec = parseInt(res.headers.get('x-ratelimit-reset') || '60', 10);
        console.log(`  ⏳ Approaching rate limit (${remaining} left). Sleeping ${resetSec}s...`);
        await new Promise(r => setTimeout(r, resetSec * 1000));
      }
      const data = await res.json() as any;
      if (data.hits && data.hits.length > 0) {
        return data.hits[0].webformatURL;
      }
      return null;
    } catch (err) {
      console.warn(`  [Pixabay attempt ${attempt}/3] error for "${query}":`, err);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  return null;
}

async function uploadBufferToCloudinary(buffer: Buffer): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const uploadPromise = new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'shirur-express/restaurants',
            transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto:good' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        );
        stream.end(buffer);
      });
      return await uploadPromise;
    } catch (err) {
      console.warn(`  [Cloudinary attempt ${attempt}/3] error:`, err);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
      else throw err;
    }
  }
  throw new Error('Cloudinary upload failed after 3 attempts');
}

async function updateDbWithRetry(itemId: string, imageUrl: string) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await db.update(restaurantMenuItems)
        .set({ imageUrl })
        .where(eq(restaurantMenuItems.id, itemId));
      return;
    } catch (err) {
      console.warn(`  [DB update attempt ${attempt}/5] error:`, err);
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error(`Failed to update DB for item ${itemId} after 5 attempts`);
}

async function main() {
  console.log('========================================================');
  console.log('🚀 POPULATING MENU IMAGES FOR TIRANGA & RASSA BHAKRI');
  console.log('========================================================\n');

  const localDir = path.resolve('client', 'public', 'images', 'menu-items');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  // 1. Fetch menu items for both restaurants
  const items = await db.query.restaurantMenuItems.findMany({
    where: or(
      eq(restaurantMenuItems.providerId, TIRANGA_ID),
      eq(restaurantMenuItems.providerId, RASSA_BHAKRI_ID)
    )
  });

  console.log(`📋 Total items found in DB: ${items.length}\n`);

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const norm = normalizeName(item.name);
    const prefix = `[${i + 1}/${items.length}]`;

    // If item already has a Cloudinary image, populate cache and skip
    if (item.imageUrl && item.imageUrl.includes('res.cloudinary.com')) {
      console.log(`${prefix} "${item.name}" already has Cloudinary image. Skipping.`);
      imageCache.set(norm, item.imageUrl);
      skippedCount++;
      continue;
    }

    // Check if we already fetched and uploaded an image for this normalized dish
    if (imageCache.has(norm)) {
      const cachedUrl = imageCache.get(norm)!;
      console.log(`${prefix} "${item.name}" using cached image: ${cachedUrl.substring(0, 60)}...`);
      await updateDbWithRetry(item.id, cachedUrl);
      successCount++;
      continue;
    }

    const primaryQuery = getSearchQuery(item.name, item.category);
    console.log(`${prefix} Searching: "${item.name}" → Query: "${primaryQuery}"`);

    let imgWebUrl = await searchPixabay(primaryQuery);

    // Fallback query if no hits found
    if (!imgWebUrl) {
      const fallbackQuery = norm.replace(/[^a-zA-Z0-9 ]/g, ' ').trim() + ' indian food';
      console.log(`  ↻ Trying fallback: "${fallbackQuery}"`);
      imgWebUrl = await searchPixabay(fallbackQuery);
    }

    // Ultimate category fallback if still no hits
    if (!imgWebUrl) {
      const cat = (item.category || '').toLowerCase();
      let catQuery = 'indian food dish';
      if (cat.includes('chicken')) catQuery = 'chicken curry indian';
      else if (cat.includes('mutton')) catQuery = 'mutton curry indian';
      else if (cat.includes('biryani')) catQuery = 'biryani rice';
      else if (cat.includes('paneer')) catQuery = 'paneer butter masala';
      else if (cat.includes('chinese')) catQuery = 'fried rice noodles';
      else if (cat.includes('roti')) catQuery = 'naan bread indian';
      else if (cat.includes('drink')) catQuery = 'cold drink beverage';

      console.log(`  ↻ Trying category fallback: "${catQuery}"`);
      imgWebUrl = await searchPixabay(catQuery);
    }

    if (!imgWebUrl) {
      console.error(`  ❌ No image found on Pixabay for "${item.name}"`);
      failedCount++;
      continue;
    }

    try {
      // 1. Download image buffer
      let buffer: Buffer | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(imgWebUrl, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          break;
        } catch (downloadErr) {
          console.warn(`  [Download attempt ${attempt}/3] error:`, downloadErr);
          if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
        }
      }

      if (!buffer) {
        throw new Error(`Failed to download image after 3 attempts`);
      }

      // 2. Save local backup to client/public/images/menu-items
      const safeFilename = `menu_${item.id}.jpg`;
      const localFilePath = path.join(localDir, safeFilename);
      fs.writeFileSync(localFilePath, buffer);

      // 3. Upload to Cloudinary
      let finalUrl = '';
      try {
        finalUrl = await uploadBufferToCloudinary(buffer);
        console.log(`  ✅ Uploaded to Cloudinary: ${finalUrl}`);
      } catch (cloudErr) {
        console.warn(`  ⚠️ Cloudinary upload failed, falling back to local image:`, cloudErr);
        finalUrl = `/images/menu-items/menu_${item.id}.jpg`;
      }

      // 4. Update database
      await updateDbWithRetry(item.id, finalUrl);

      imageCache.set(norm, finalUrl);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Failed processing item "${item.name}":`, err);
      failedCount++;
    }

    // Rate-limit throttle (600ms between items)
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n========================================================');
  console.log('🎉 COMPLETED IMAGE ASSIGNMENT!');
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ⏩ Already had image:    ${skippedCount}`);
  console.log(`   ❌ Failed:               ${failedCount}`);
  console.log('========================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
