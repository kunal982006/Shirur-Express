import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { serviceProviders, restaurantMenuItems } from '@shared/schema';
import { eq, ilike } from 'drizzle-orm';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Missing Cloudinary configuration in .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

const PIXABAY_KEY = '57987275-462ff3ca19b4131426110fbef';

// Explicit source mapping: either a local curated file or a tailored Pixabay query
const ITEM_IMAGE_SOURCES: Record<string, { localFile?: string; pixabayQuery?: string[] }> = {
  // Combos & Platter
  'Veg Platter: Fries Chilly': { pixabayQuery: ['french fries platter snack', 'french fries dipping sauce'] },
  'Any Classic Pizza (7") Combo': { pixabayQuery: ['pizza meal combo', 'pizza and fries'] },
  'Any Signature Pizza (7") Combo': { pixabayQuery: ['pizza and fries', 'pizza meal combo'] },
  'Any Exotic Pizza (7") Combo': { pixabayQuery: ['supreme pizza combo', 'pizza meal combo'] },

  // Sandwiches
  'Chutney Cheese Sandwich': { localFile: 'sandwich.jpg' },
  'Veg Cheese Sandwich': { localFile: 'sandwich.jpg' },
  'Veg Cheese Grilled Sandwich': { localFile: 'grilled_sandwich.jpg' },
  'Masala Cheese Grilled Sandwich': { pixabayQuery: ['grilled cheese sandwich spicy', 'grilled cheese sandwich'] },
  'Cheese Chilli Grilled Sandwich': { pixabayQuery: ['chilli cheese toast', 'grilled cheese sandwich'] },
  'Garlic Cheese Grilled Sandwich': { pixabayQuery: ['garlic toast cheese', 'garlic bread cheese'] },
  'Chocolate Grilled Sandwich': { localFile: 'chocolate_sandwich.jpg' },
  'Chee Chilli Garlic Grilled Sandwich': { pixabayQuery: ['chilli cheese toast', 'garlic toast cheese'] },
  'Paneer Cheese Grilled Sandwich': { localFile: 'paneer_sandwich.jpg' },
  'Corn Cheese Grilled Sandwich': { pixabayQuery: ['sweet corn sandwich cheese', 'grilled cheese sandwich'] },
  'Kolhapuri Paneer Grilled Sandwich': { localFile: 'paneer_sandwich.jpg' },
  'Paneer Schezwan Grilled Sandwich': { pixabayQuery: ['spicy grilled sandwich', 'paneer sandwich'] },
  'Tandoori Paneer Grilled Sandwich': { pixabayQuery: ['tandoori paneer sandwich', 'grilled sandwich'] },
  'Peri Peri Paneer Grilled Sandwich': { pixabayQuery: ['spicy paneer sandwich', 'grilled cheese sandwich'] },
  'Peri Peri Corn Grilled Sandwich': { pixabayQuery: ['sweet corn sandwich', 'grilled cheese sandwich'] },
  'Makhani Paneer Grilled Sandwich': { pixabayQuery: ['paneer sandwich', 'grilled cheese sandwich'] },
  'Mix Veg Grill Sandwich': { localFile: 'grilled_sandwich.jpg' },

  // Add-ons
  'Veg Topping': { pixabayQuery: ['bell peppers olives vegetables pizza', 'vegetables pizza'] },
  'Non Veg Topping': { pixabayQuery: ['grilled chicken meat pizza', 'sausage chicken pizza'] },
  'Extra Cheese': { pixabayQuery: ['grated mozzarella cheese', 'shredded cheese bowl'] },
  'Cheese Burst': { pixabayQuery: ['melted mozzarella cheese pizza', 'cheese melt pizza'] },
  'Extra Cheese Slice': { pixabayQuery: ['cheddar cheese slice', 'cheese slice'] },

  // Veg Starters
  'Chilly Garlic Shots': { pixabayQuery: ['crispy potato bites fried', 'tater tots fried', 'potato croquettes'] },
  'Salted Fries': { localFile: 'fries.jpg' },
  'Peri Peri Fries': { localFile: 'peri_peri_fries.jpg' },
  'Tandoori Fries': { pixabayQuery: ['seasoned french fries spicy', 'french fries'] },
  'Cheesy Fries': { localFile: 'cheese_fries.jpg' },
  'Peri Peri Cheesy Fries': { pixabayQuery: ['cheese french fries', 'cheesy fries'] },
  'Tandoori Cheesy Fries': { pixabayQuery: ['cheese french fries', 'cheesy fries'] },
  'Harabhara Kawab': { pixabayQuery: ['green vegetable cutlet', 'falafel patties vegetarian', 'veg cutlet patties'] },
  'Onion Ring': { pixabayQuery: ['onion rings crispy fried', 'onion rings'] },
  'Cheese Corn Pop': { pixabayQuery: ['cheese balls fried snack', 'corn cheese balls'] },
  'Chocolate Stuff Bread': { pixabayQuery: ['chocolate brioche bread', 'chocolate babka bread'] },
  'Cheese Stuff Garlic Bread': { pixabayQuery: ['garlic bread cheese', 'cheesy garlic bread'] },
  'Exotic Stuff Garlic Bread': { pixabayQuery: ['cheesy garlic bread herbs', 'garlic bread'] },

  // Veg Burgers
  'Aloo Tikki Cheese Burger': { localFile: 'burger.jpg' },
  'Shezwan Cheese Burger': { pixabayQuery: ['spicy veggie burger cheese', 'veggie burger'] },
  'Cheese Chilli Burger': { pixabayQuery: ['spicy cheese burger', 'cheeseburger'] },
  'Italiyan Paneer Cheese Burger': { pixabayQuery: ['paneer burger veggie', 'veggie burger cheese'] },
  'Makhani Cheesy Burger': { localFile: 'grilled_burger.jpg' },

  // Veg Momos
  'Mix Veg Fried Momo': { localFile: 'veg_fried_momos.jpg' },
  'Peri Peri Momos': { pixabayQuery: ['spicy fried dumplings', 'fried dumplings'] },
  'Paneer Momos': { localFile: 'paneer_momos.jpg' },
  'Paneer Peri Peri Momos': { pixabayQuery: ['fried dumplings spicy', 'fried dumplings'] },

  // Coffee
  'Hot Coffee': { localFile: 'coffee.jpg' },
  'Thick Cold Coffee': { localFile: 'thick_cold_coffee.jpg' },
  'Crush Thick Cold Coffee': { pixabayQuery: ['chocolate frappe iced coffee', 'iced coffee chocolate'] },

  // Mocktails
  'Blue Ocen Mojito': { pixabayQuery: ['blue lagoon cocktail glass', 'blue drink glass ice'] },
  'Blueberry Mojito': { pixabayQuery: ['blueberry mojito drink glass', 'blueberry mocktail glass'] },
  'Kala Khata Mojito': { pixabayQuery: ['blackberry cocktail drink glass', 'blackcurrant mocktail glass'] },
  'Mint Mojito': { localFile: 'mojito.jpg' },
  'Leman Ice Tea': { pixabayQuery: ['lemon iced tea glass mint', 'iced tea lemon slice'] },
  'Green Apple Mojito': { pixabayQuery: ['green apple cocktail glass', 'green apple drink ice'] },
  'Peach Ice Tea Mojito': { pixabayQuery: ['peach iced tea glass', 'iced tea peach glass'] },
  'Watermelon Mojito': { pixabayQuery: ['watermelon mojito drink glass', 'watermelon juice glass mint'] },
  'Cold Drink': { pixabayQuery: ['cola drink ice glass', 'glass of cola ice'] },
  'Water Bottle': { pixabayQuery: ['mineral water bottle splash', 'bottle of water fresh'] },

  // Offers
  'Corn with Cheese Pizza (Daily Offer)': { pixabayQuery: ['sweet corn pizza cheese', 'cheese pizza corn'] },
  'Herb Chicken Pizza (Daily Offer)': { pixabayQuery: ['chicken pizza basil herbs', 'chicken pizza grilled'] }
};

async function getBufferFromPixabay(queries: string[]): Promise<Buffer | null> {
  for (const q of queries) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=3&safesearch=true`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json() as any;
      if (data.hits && data.hits.length > 0) {
        const imgUrl = data.hits[0].webformatURL;
        const imgRes = await fetch(imgUrl);
        if (imgRes.ok) {
          const ab = await imgRes.arrayBuffer();
          return Buffer.from(ab);
        }
      }
    } catch (e) {
      // try next query
    }
  }
  return null;
}

async function uploadBufferToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'shirur-express/bulls-cafe',
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function populateBullsCafeImages() {
  console.log("==================================================");
  console.log("🚀 Starting Bulls & Trader cafe Image Population");
  console.log("==================================================\n");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, '%Bulls%')
  });

  if (!provider) {
    console.error("❌ Provider 'Bulls & Trader cafe' not found in database!");
    process.exit(1);
  }

  console.log(`✅ Found Provider: ${provider.businessName} (ID: ${provider.id})`);

  const allItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, provider.id)
  });

  console.log(`📋 Total items found for provider: ${allItems.length}`);

  // Only target items that have placeholder / default / null images.
  // Crucial: Do NOT touch items whose images are already present!
  const itemsToUpdate = allItems.filter(item => {
    if (!item.imageUrl) return true;
    const url = item.imageUrl.trim().toLowerCase();
    if (url === '') return true;
    if (url.includes('placeholder')) return true;
    if (url.startsWith('/images/menu-items/default')) return true;
    return false;
  });

  const existingCount = allItems.length - itemsToUpdate.length;
  console.log(`🔒 Preserved items with existing images: ${existingCount} (WON'T TOUCH)`);
  console.log(`🎯 Items to update with correct images: ${itemsToUpdate.length}\n`);

  if (itemsToUpdate.length === 0) {
    console.log("✨ All items already have valid images! Nothing to do.");
    process.exit(0);
  }

  const localDir = path.resolve('client/public/images/menu-items');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < itemsToUpdate.length; i++) {
    const item = itemsToUpdate[i];
    const source = ITEM_IMAGE_SOURCES[item.name];

    console.log(`[${i + 1}/${itemsToUpdate.length}] Processing: "${item.name}" (Cat: "${item.category}")`);

    let buffer: Buffer | null = null;

    // 1. Try local curated image if configured
    if (source?.localFile) {
      const localFilePath = path.join(localDir, source.localFile);
      if (fs.existsSync(localFilePath)) {
        buffer = fs.readFileSync(localFilePath);
        console.log(`  📁 Using curated local image: ${source.localFile}`);
      }
    }

    // 2. If no local buffer, fetch from Pixabay
    if (!buffer && source?.pixabayQuery) {
      console.log(`  🌐 Fetching from Pixabay: "${source.pixabayQuery[0]}"...`);
      buffer = await getBufferFromPixabay(source.pixabayQuery);
    }

    // 3. Fallback generic query if still no buffer
    if (!buffer) {
      const fallbackQuery = [`${item.name} food`, `${item.category} dish`];
      console.log(`  ↻ Trying fallback query: "${fallbackQuery[0]}"...`);
      buffer = await getBufferFromPixabay(fallbackQuery);
    }

    if (!buffer) {
      console.error(`  ❌ Failed to obtain image buffer for "${item.name}"`);
      failCount++;
      continue;
    }

    // 4. Save local copy to client/public/images/menu-items/menu_${item.id}.jpg
    const safeFilename = `menu_${item.id}.jpg`;
    const localBackupPath = path.join(localDir, safeFilename);
    try {
      fs.writeFileSync(localBackupPath, buffer);
    } catch (e) {
      console.warn(`  ⚠️ Could not write local backup:`, e);
    }

    // 5. Upload to Cloudinary
    let finalImageUrl = `/images/menu-items/${safeFilename}`;
    try {
      console.log(`  ⬆️ Uploading to Cloudinary (folder: shirur-express/bulls-cafe)...`);
      const cloudUrl = await uploadBufferToCloudinary(buffer);
      finalImageUrl = cloudUrl;
      console.log(`  ✅ Cloudinary Uploaded: ${cloudUrl}`);
    } catch (cloudErr) {
      console.warn(`  ⚠️ Cloudinary upload failed, using local URL: ${finalImageUrl}`, cloudErr);
    }

    // 6. Update Database
    try {
      await db.update(restaurantMenuItems)
        .set({ imageUrl: finalImageUrl })
        .where(eq(restaurantMenuItems.id, item.id));

      console.log(`  💾 Updated DB for "${item.name}" -> ${finalImageUrl}\n`);
      successCount++;
    } catch (dbErr) {
      console.error(`  ❌ Failed to update DB for item ${item.id}:`, dbErr);
      failCount++;
    }

    // Throttle to respect network / Cloudinary rate limits
    await new Promise(r => setTimeout(r, 400));
  }

  console.log("==================================================");
  console.log(`🎉 COMPLETED!`);
  console.log(`✅ Successfully updated: ${successCount} items`);
  console.log(`🔒 Untouched existing: ${existingCount} items`);
  console.log(`❌ Failed: ${failCount} items`);
  console.log("==================================================");

  process.exit(failCount > 0 ? 1 : 0);
}

populateBullsCafeImages().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
