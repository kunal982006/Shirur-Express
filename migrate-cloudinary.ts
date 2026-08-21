import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from './server/db'; // adjust path to db
import { sql } from 'drizzle-orm';

// Old Account Config
const oldConfig = {
  cloud_name: 'dtxtql7zd',
  api_key: '332419926561332',
  api_secret: 'bEhTty7Ma9Sv5iC0tFmPiqPUGjs'
};

// New Account Config
const newConfig = {
  cloud_name: 'mlijtrrb',
  api_key: '622877827257842',
  api_secret: 'p2eizPiynyZRaOkbZcO5hRCPXtU'
};

async function migrateImages() {
  console.log('Starting Cloudinary Migration...');

  let nextCursor = undefined;
  let totalMigrated = 0;

  try {
    // 0. Fetch existing migrated images to skip them
    console.log('Fetching already migrated images...');
    const migratedIds = new Set<string>();
    let newNextCursor = undefined;
    do {
      const newResult = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: newNextCursor,
        type: 'upload',
        ...newConfig
      }) as any;
      for (const res of newResult.resources) {
        migratedIds.add(res.public_id);
      }
      newNextCursor = newResult.next_cursor;
    } while (newNextCursor);
    console.log(`Found ${migratedIds.size} already migrated images.`);

    // 1. Migrate Assets
    do {
      const result = await cloudinary.api.resources({
        max_results: 100,
        next_cursor: nextCursor,
        type: 'upload',
        ...oldConfig
      }) as any;

      const resources = result.resources;
      
      for (const res of resources) {
        if (migratedIds.has(res.public_id)) {
          console.log(`Skipping ${res.public_id} (already migrated)`);
          continue;
        }
        
        try {
          console.log(`Migrating ${res.public_id} (${res.resource_type})...`);
          // Upload to new account using the secure_url from the old account
          await cloudinary.uploader.upload(res.secure_url, {
            public_id: res.public_id,
            resource_type: res.resource_type,
            overwrite: true,
            invalidate: true,
            ...newConfig
          });
          totalMigrated++;
        } catch (uploadErr) {
          console.error(`Failed to migrate ${res.public_id}:`, uploadErr);
        }
      }

      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`Successfully migrated ${totalMigrated} assets to the new account.`);

    // 2. Update Database URLs
    console.log('Updating database URLs...');
    
    const tablesToUpdate = [
      { name: 'service_categories', col: 'icon' },
      { name: 'service_templates', col: 'image_url' },
      { name: 'service_providers', col: 'profile_image_url' },
      { name: 'service_offerings', col: 'image_url' },
      { name: 'service_problems', col: 'image_url' },
      { name: 'cake_products', col: 'image_url' },
      { name: 'grocery_products', col: 'image_url' },
      { name: 'street_food_items', col: 'image_url' },
      { name: 'restaurant_menu_items', col: 'image_url' },
      { name: 'delivery_partners', col: 'profile_image_url' },
      { name: 'provider_offers', col: 'image_url' },
      { name: 'admin_promotional_offers', col: 'thumbnail_image_url' },
      { name: 'admin_promotional_offers', col: 'popup_image_url' },
    ];

    for (const table of tablesToUpdate) {
      console.log(`Updating ${table.name}.${table.col}...`);
      await db.execute(sql.raw(`
        UPDATE ${table.name} 
        SET ${table.col} = REPLACE(${table.col}, 'dtxtql7zd', 'mlijtrrb') 
        WHERE ${table.col} LIKE '%dtxtql7zd%';
      `));
    }

    // JSONB array columns
    const jsonbTables = [
      { name: 'service_providers', col: 'gallery_images' },
      { name: 'rental_properties', col: 'images' },
      { name: 'phone_listings', col: 'images' },
    ];

    for (const table of jsonbTables) {
      console.log(`Updating JSONB array ${table.name}.${table.col}...`);
      // Since it's just a text replace inside JSON, we can cast to text, replace, and cast back to JSONB
      await db.execute(sql.raw(`
        UPDATE ${table.name}
        SET ${table.col} = REPLACE(${table.col}::text, 'dtxtql7zd', 'mlijtrrb')::jsonb
        WHERE ${table.col}::text LIKE '%dtxtql7zd%';
      `));
    }

    console.log('Database update complete!');
    console.log('Migration Finished Successfully.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrateImages();
