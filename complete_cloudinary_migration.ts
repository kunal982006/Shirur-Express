import 'dotenv/config';
import { pool } from "./server/db";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
import * as schema from "./shared/schema";
import { v2 as cloudinary } from "cloudinary";

const db = drizzle({ client: pool, schema });

cloudinary.config({
  cloud_name: "bjpfhxj7",
  api_key: "978397582689753",
  api_secret: "wN7y5Q5z__IjyQMjEIrV34zZdog",
  secure: true,
});

const LEGACY_CLOUDS = ["mlijtrrb", "dtxtql7zd"];

function isLegacyUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return LEGACY_CLOUDS.some(c => url.includes(`res.cloudinary.com/${c}`));
}

// In-memory cache so duplicated image URLs across multiple items are only uploaded once
const uploadCache = new Map<string, Promise<string | null>>();

async function uploadSingleImage(url: string): Promise<string | null> {
  try {
    const res = await cloudinary.uploader.upload(url, {
      resource_type: "auto",
    });
    return res.secure_url;
  } catch (err: any) {
    console.error(`  [Upload Error] ${url} -> ${err.message}`);
    return null;
  }
}

function migrateUrl(url: string | null | undefined): Promise<string | null> {
  if (!url || !isLegacyUrl(url)) return Promise.resolve(url || null);

  if (uploadCache.has(url)) {
    return uploadCache.get(url)!;
  }

  const promise = uploadSingleImage(url);
  uploadCache.set(url, promise);
  return promise;
}

// Concurrency helper
async function pMap<T, R>(items: T[], fn: (item: T, idx: number) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function run() {
  console.log("=== STARTING COMPLETE CLOUDINARY MIGRATION TO bjpfhxj7 ===");
  const startTime = Date.now();
  let totalMigrated = 0;

  // 1. serviceCategories
  console.log("\n1. Checking service_categories.icon...");
  const categories = await db.select().from(schema.serviceCategories);
  for (const c of categories) {
    if (isLegacyUrl(c.icon)) {
      const newUrl = await migrateUrl(c.icon);
      if (newUrl && newUrl !== c.icon) {
        await db.update(schema.serviceCategories).set({ icon: newUrl }).where(eq(schema.serviceCategories.id, c.id));
        totalMigrated++;
        console.log(`  Updated category: ${c.name}`);
      }
    }
  }

  // 2. serviceTemplates
  console.log("\n2. Checking service_templates.image_url...");
  const templates = await db.select().from(schema.serviceTemplates);
  for (const t of templates) {
    if (isLegacyUrl(t.imageUrl)) {
      const newUrl = await migrateUrl(t.imageUrl);
      if (newUrl && newUrl !== t.imageUrl) {
        await db.update(schema.serviceTemplates).set({ imageUrl: newUrl }).where(eq(schema.serviceTemplates.id, t.id));
        totalMigrated++;
        console.log(`  Updated template: ${t.name}`);
      }
    }
  }

  // 3. serviceProviders (profile_image_url & gallery_images)
  console.log("\n3. Checking service_providers...");
  const providers = await db.select().from(schema.serviceProviders);
  for (const p of providers) {
    const updates: any = {};
    if (isLegacyUrl(p.profileImageUrl)) {
      const newUrl = await migrateUrl(p.profileImageUrl);
      if (newUrl && newUrl !== p.profileImageUrl) updates.profileImageUrl = newUrl;
    }
    if (Array.isArray(p.galleryImages) && p.galleryImages.some(isLegacyUrl)) {
      const newGallery: string[] = [];
      for (const img of p.galleryImages) {
        if (isLegacyUrl(img)) {
          const newImg = await migrateUrl(img);
          newGallery.push(newImg || img);
        } else {
          newGallery.push(img);
        }
      }
      updates.galleryImages = newGallery;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(schema.serviceProviders).set(updates).where(eq(schema.serviceProviders.id, p.id));
      totalMigrated++;
      console.log(`  Updated provider: ${p.businessName}`);
    }
  }

  // 4. serviceOfferings
  console.log("\n4. Checking service_offerings.image_url...");
  const offerings = await db.select().from(schema.serviceOfferings);
  for (const o of offerings) {
    if (isLegacyUrl(o.imageUrl)) {
      const newUrl = await migrateUrl(o.imageUrl);
      if (newUrl && newUrl !== o.imageUrl) {
        await db.update(schema.serviceOfferings).set({ imageUrl: newUrl }).where(eq(schema.serviceOfferings.id, o.id));
        totalMigrated++;
      }
    }
  }

  // 5. serviceProblems
  console.log("\n5. Checking service_problems.image_url...");
  const problems = await db.select().from(schema.serviceProblems);
  for (const pr of problems) {
    if (isLegacyUrl(pr.imageUrl)) {
      const newUrl = await migrateUrl(pr.imageUrl);
      if (newUrl && newUrl !== pr.imageUrl) {
        await db.update(schema.serviceProblems).set({ imageUrl: newUrl }).where(eq(schema.serviceProblems.id, pr.id));
        totalMigrated++;
      }
    }
  }

  // 6. cakeProducts
  console.log("\n6. Checking cake_products.image_url...");
  const cakes = await db.select().from(schema.cakeProducts);
  const legacyCakes = cakes.filter(c => isLegacyUrl(c.imageUrl));
  console.log(`  Found ${legacyCakes.length} legacy cake products to migrate.`);
  await pMap(legacyCakes, async (c) => {
    const newUrl = await migrateUrl(c.imageUrl);
    if (newUrl && newUrl !== c.imageUrl) {
      await db.update(schema.cakeProducts).set({ imageUrl: newUrl }).where(eq(schema.cakeProducts.id, c.id));
      totalMigrated++;
      console.log(`  Migrated cake: ${c.name}`);
    }
  }, 5);

  // 7. groceryProducts
  console.log("\n7. Checking grocery_products.image_url...");
  const groceries = await db.select().from(schema.groceryProducts);
  const legacyGroceries = groceries.filter(g => isLegacyUrl(g.imageUrl));
  console.log(`  Found ${legacyGroceries.length} legacy grocery products.`);
  if (legacyGroceries.length > 0) {
    await pMap(legacyGroceries, async (g) => {
      const newUrl = await migrateUrl(g.imageUrl);
      if (newUrl && newUrl !== g.imageUrl) {
        await db.update(schema.groceryProducts).set({ imageUrl: newUrl }).where(eq(schema.groceryProducts.id, g.id));
        totalMigrated++;
      }
    }, 5);
  }

  // 8. streetFoodItems
  console.log("\n8. Checking street_food_items.image_url...");
  const streetFoods = await db.select().from(schema.streetFoodItems);
  const legacyStreetFoods = streetFoods.filter(s => isLegacyUrl(s.imageUrl));
  console.log(`  Found ${legacyStreetFoods.length} legacy street food items.`);
  await pMap(legacyStreetFoods, async (sf) => {
    const newUrl = await migrateUrl(sf.imageUrl);
    if (newUrl && newUrl !== sf.imageUrl) {
      await db.update(schema.streetFoodItems).set({ imageUrl: newUrl }).where(eq(schema.streetFoodItems.id, sf.id));
      totalMigrated++;
      console.log(`  Migrated street food: ${sf.name}`);
    }
  }, 5);

  // 9. restaurantMenuItems
  console.log("\n9. Checking restaurant_menu_items.image_url...");
  const menus = await db.select().from(schema.restaurantMenuItems);
  const legacyMenus = menus.filter(m => isLegacyUrl(m.imageUrl));
  console.log(`  Found ${legacyMenus.length} legacy restaurant menu items.`);
  let menuCount = 0;
  await pMap(legacyMenus, async (m) => {
    const newUrl = await migrateUrl(m.imageUrl);
    if (newUrl && newUrl !== m.imageUrl) {
      await db.update(schema.restaurantMenuItems).set({ imageUrl: newUrl }).where(eq(schema.restaurantMenuItems.id, m.id));
      totalMigrated++;
      menuCount++;
      if (menuCount % 25 === 0 || menuCount === legacyMenus.length) {
        console.log(`  Migrated ${menuCount}/${legacyMenus.length} menu items...`);
      }
    }
  }, 6);

  // 10. providerOffers
  console.log("\n10. Checking provider_offers.image_url...");
  const offers = await db.select().from(schema.providerOffers);
  const legacyOffers = offers.filter(o => isLegacyUrl(o.imageUrl));
  console.log(`  Found ${legacyOffers.length} legacy provider offers.`);
  await pMap(legacyOffers, async (o) => {
    const newUrl = await migrateUrl(o.imageUrl);
    if (newUrl && newUrl !== o.imageUrl) {
      await db.update(schema.providerOffers).set({ imageUrl: newUrl }).where(eq(schema.providerOffers.id, o.id));
      totalMigrated++;
      console.log(`  Migrated offer: ${o.title}`);
    }
  }, 5);

  // 11. adminPromotionalOffers
  console.log("\n11. Checking admin_promotional_offers...");
  const adminOffers = await db.select().from(schema.adminPromotionalOffers);
  for (const ao of adminOffers) {
    const updates: any = {};
    if (isLegacyUrl(ao.thumbnailImageUrl)) {
      const newUrl = await migrateUrl(ao.thumbnailImageUrl);
      if (newUrl && newUrl !== ao.thumbnailImageUrl) updates.thumbnailImageUrl = newUrl;
    }
    if (isLegacyUrl(ao.popupImageUrl)) {
      const newUrl = await migrateUrl(ao.popupImageUrl);
      if (newUrl && newUrl !== ao.popupImageUrl) updates.popupImageUrl = newUrl;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(schema.adminPromotionalOffers).set(updates).where(eq(schema.adminPromotionalOffers.id, ao.id));
      totalMigrated++;
      console.log(`  Updated admin promo offer: ${ao.title}`);
    }
  }

  // 12. deliveryPartners
  console.log("\n12. Checking delivery_partners.profile_image_url...");
  const riders = await db.select().from(schema.deliveryPartners);
  for (const r of riders) {
    if (isLegacyUrl(r.profileImageUrl)) {
      const newUrl = await migrateUrl(r.profileImageUrl);
      if (newUrl && newUrl !== r.profileImageUrl) {
        await db.update(schema.deliveryPartners).set({ profileImageUrl: newUrl }).where(eq(schema.deliveryPartners.id, r.id));
        totalMigrated++;
      }
    }
  }

  // 13. rentalProperties (JSONB images)
  console.log("\n13. Checking rental_properties.images...");
  const rentals = await db.select().from(schema.rentalProperties);
  for (const rp of rentals) {
    if (Array.isArray(rp.images) && rp.images.some(isLegacyUrl)) {
      const newImages: string[] = [];
      for (const img of rp.images) {
        if (isLegacyUrl(img)) {
          const newImg = await migrateUrl(img);
          newImages.push(newImg || img);
        } else {
          newImages.push(img);
        }
      }
      await db.update(schema.rentalProperties).set({ images: newImages }).where(eq(schema.rentalProperties.id, rp.id));
      totalMigrated++;
      console.log(`  Migrated rental property: ${rp.title}`);
    }
  }

  // 14. phoneListings (JSONB images)
  console.log("\n14. Checking phone_listings.images...");
  const phones = await db.select().from(schema.phoneListings);
  for (const ph of phones) {
    if (Array.isArray(ph.images) && ph.images.some(isLegacyUrl)) {
      const newImages: string[] = [];
      for (const img of ph.images) {
        if (isLegacyUrl(img)) {
          const newImg = await migrateUrl(img);
          newImages.push(newImg || img);
        } else {
          newImages.push(img);
        }
      }
      await db.update(schema.phoneListings).set({ images: newImages }).where(eq(schema.phoneListings.id, ph.id));
      totalMigrated++;
      console.log(`  Migrated phone listing: ${ph.brand} ${ph.model}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Migration Complete in ${elapsed}s!`);
  console.log(`Total database updates executed: ${totalMigrated}`);
  console.log(`Unique images uploaded: ${uploadCache.size}`);
  console.log(`========================================`);

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal Migration Error:", err);
  process.exit(1);
});
