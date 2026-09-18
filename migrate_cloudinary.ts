import { config } from "dotenv";
config();

import { pool } from "./server/db";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import * as schema from "./shared/schema";
import { v2 as cloudinary } from "cloudinary";

// Initialize DB
const db = drizzle({ client: pool, schema });

// Initialize NEW Cloudinary credentials
cloudinary.config({
  cloud_name: "bjpfhxj7",
  api_key: "978397582689753",
  api_secret: "wN7y5Q5z__IjyQMjEIrV34zZdog",
});

const OLD_CLOUD_NAME = "mlijtrrb";

async function migrateUrl(oldUrl: string | null | undefined): Promise<string | null> {
  if (!oldUrl) return null;
  if (!oldUrl.includes(`res.cloudinary.com/${OLD_CLOUD_NAME}`)) return oldUrl;

  try {
    console.log(`Migrating image: ${oldUrl}`);
    const result = await cloudinary.uploader.upload(oldUrl, {
      resource_type: "auto",
    });
    console.log(`  -> New URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (err: any) {
    console.error(`Failed to migrate ${oldUrl}:`, err.message);
    return oldUrl; // Fallback to old URL on failure
  }
}

async function migrateStringArray(oldArray: string[] | null | undefined): Promise<string[] | null> {
  if (!oldArray || !Array.isArray(oldArray)) return oldArray || null;
  
  const newArray: string[] = [];
  let changed = false;
  
  for (const url of oldArray) {
    if (url.includes(`res.cloudinary.com/${OLD_CLOUD_NAME}`)) {
      const newUrl = await migrateUrl(url);
      if (newUrl && newUrl !== url) {
        newArray.push(newUrl);
        changed = true;
      } else {
        newArray.push(url);
      }
    } else {
      newArray.push(url);
    }
  }
  
  return changed ? newArray : null; // Return null if no change
}

async function runMigration() {
  console.log("Starting Cloudinary Migration...");
  let migratedCount = 0;

  // 1. serviceTemplates
  const templates = await db.select().from(schema.serviceTemplates);
  for (const t of templates) {
    const newUrl = await migrateUrl(t.imageUrl);
    if (newUrl && newUrl !== t.imageUrl) {
      await db.update(schema.serviceTemplates).set({ imageUrl: newUrl }).where(eq(schema.serviceTemplates.id, t.id));
      migratedCount++;
    }
  }

  // 2. serviceProviders
  const providers = await db.select().from(schema.serviceProviders);
  for (const p of providers) {
    const newProfile = await migrateUrl(p.profileImageUrl);
    const newGallery = await migrateStringArray(p.galleryImages);
    
    const updates: any = {};
    if (newProfile && newProfile !== p.profileImageUrl) updates.profileImageUrl = newProfile;
    if (newGallery) updates.galleryImages = newGallery;
    
    if (Object.keys(updates).length > 0) {
      await db.update(schema.serviceProviders).set(updates).where(eq(schema.serviceProviders.id, p.id));
      migratedCount++;
    }
  }

  // 3. serviceOfferings
  const offerings = await db.select().from(schema.serviceOfferings);
  for (const o of offerings) {
    const newUrl = await migrateUrl(o.imageUrl);
    if (newUrl && newUrl !== o.imageUrl) {
      await db.update(schema.serviceOfferings).set({ imageUrl: newUrl }).where(eq(schema.serviceOfferings.id, o.id));
      migratedCount++;
    }
  }

  // 4. serviceProblems
  const problems = await db.select().from(schema.serviceProblems);
  for (const p of problems) {
    const newUrl = await migrateUrl(p.imageUrl);
    if (newUrl && newUrl !== p.imageUrl) {
      await db.update(schema.serviceProblems).set({ imageUrl: newUrl }).where(eq(schema.serviceProblems.id, p.id));
      migratedCount++;
    }
  }

  // 5. cakeProducts
  const cakes = await db.select().from(schema.cakeProducts);
  for (const c of cakes) {
    const newUrl = await migrateUrl(c.imageUrl);
    if (newUrl && newUrl !== c.imageUrl) {
      await db.update(schema.cakeProducts).set({ imageUrl: newUrl }).where(eq(schema.cakeProducts.id, c.id));
      migratedCount++;
    }
  }

  // 6. groceryProducts
  const groceries = await db.select().from(schema.groceryProducts);
  for (const g of groceries) {
    const newUrl = await migrateUrl(g.imageUrl);
    if (newUrl && newUrl !== g.imageUrl) {
      await db.update(schema.groceryProducts).set({ imageUrl: newUrl }).where(eq(schema.groceryProducts.id, g.id));
      migratedCount++;
    }
  }

  // 7. streetFoodItems
  const streetFoods = await db.select().from(schema.streetFoodItems);
  for (const sf of streetFoods) {
    const newUrl = await migrateUrl(sf.imageUrl);
    if (newUrl && newUrl !== sf.imageUrl) {
      await db.update(schema.streetFoodItems).set({ imageUrl: newUrl }).where(eq(schema.streetFoodItems.id, sf.id));
      migratedCount++;
    }
  }

  // 8. restaurantMenuItems
  const menus = await db.select().from(schema.restaurantMenuItems);
  for (const m of menus) {
    const newUrl = await migrateUrl(m.imageUrl);
    if (newUrl && newUrl !== m.imageUrl) {
      await db.update(schema.restaurantMenuItems).set({ imageUrl: newUrl }).where(eq(schema.restaurantMenuItems.id, m.id));
      migratedCount++;
    }
  }

  // 9. providerOffers
  const offers = await db.select().from(schema.providerOffers);
  for (const o of offers) {
    const newUrl = await migrateUrl(o.imageUrl);
    if (newUrl && newUrl !== o.imageUrl) {
      await db.update(schema.providerOffers).set({ imageUrl: newUrl }).where(eq(schema.providerOffers.id, o.id));
      migratedCount++;
    }
  }

  // 10. adminPromotionalOffers
  const adminOffers = await db.select().from(schema.adminPromotionalOffers);
  for (const ao of adminOffers) {
    const newThumb = await migrateUrl(ao.thumbnailImageUrl);
    const newPopup = await migrateUrl(ao.popupImageUrl);
    
    const updates: any = {};
    if (newThumb && newThumb !== ao.thumbnailImageUrl) updates.thumbnailImageUrl = newThumb;
    if (newPopup && newPopup !== ao.popupImageUrl) updates.popupImageUrl = newPopup;
    
    if (Object.keys(updates).length > 0) {
      await db.update(schema.adminPromotionalOffers).set(updates).where(eq(schema.adminPromotionalOffers.id, ao.id));
      migratedCount++;
    }
  }

  // 11. deliveryPartners
  const riders = await db.select().from(schema.deliveryPartners);
  for (const r of riders) {
    const newUrl = await migrateUrl(r.profileImageUrl);
    if (newUrl && newUrl !== r.profileImageUrl) {
      await db.update(schema.deliveryPartners).set({ profileImageUrl: newUrl }).where(eq(schema.deliveryPartners.id, r.id));
      migratedCount++;
    }
  }

  // 12. phoneListings
  const phones = await db.select().from(schema.phoneListings);
  for (const ph of phones) {
    const newImages = await migrateStringArray(ph.images);
    if (newImages) {
      await db.update(schema.phoneListings).set({ images: newImages }).where(eq(schema.phoneListings.id, ph.id));
      migratedCount++;
    }
  }

  // 13. rentalProperties
  const rentals = await db.select().from(schema.rentalProperties);
  for (const rp of rentals) {
    const newImages = await migrateStringArray(rp.images);
    if (newImages) {
      await db.update(schema.rentalProperties).set({ images: newImages }).where(eq(schema.rentalProperties.id, rp.id));
      migratedCount++;
    }
  }

  console.log(`Migration completed successfully! Total records updated: ${migratedCount}`);
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
