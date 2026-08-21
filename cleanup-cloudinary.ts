import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from './server/db'; // adjust path to db
import { sql } from 'drizzle-orm';
import fs from 'fs';

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

function extractPublicId(url: string) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  let path = parts[1];
  if (path.match(/^v\d+\//)) {
    path = path.replace(/^v\d+\//, '');
  }
  const lastDotIdx = path.lastIndexOf('.');
  if (lastDotIdx !== -1) {
    path = path.substring(0, lastDotIdx);
  }
  return decodeURIComponent(path);
}

async function cleanupCloudinary() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting Cloudinary Cleanup (Dry Run: ${isDryRun})...`);

  const usedPublicIds = new Set<string>();

  // 1. Gather all URLs from the database
  const textTables = [
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

  for (const table of textTables) {
    const res = await db.execute(sql.raw(`SELECT ${table.col} FROM ${table.name} WHERE ${table.col} IS NOT NULL`)) as any;
    const rows = res.rows || res;
    for (const row of rows) {
      const id = extractPublicId(row[table.col]);
      if (id) usedPublicIds.add(id);
    }
  }

  const jsonbTables = [
    { name: 'service_providers', col: 'gallery_images' },
    { name: 'rental_properties', col: 'images' },
    { name: 'phone_listings', col: 'images' },
  ];

  for (const table of jsonbTables) {
    const res = await db.execute(sql.raw(`SELECT ${table.col} FROM ${table.name} WHERE ${table.col} IS NOT NULL`)) as any;
    const rows = res.rows || res;
    for (const row of rows) {
      const arr = row[table.col];
      if (Array.isArray(arr)) {
        for (const url of arr) {
          const id = extractPublicId(url);
          if (id) usedPublicIds.add(id);
        }
      }
    }
  }

  // 2. Gather from hardcoded files
  const files = ['client/src/pages/electrician.tsx', 'client/src/pages/plumber.tsx'];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /https:\/\/res\.cloudinary\.com\/[^"'\s]+/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const id = extractPublicId(match[0]);
      if (id) usedPublicIds.add(id);
    }
  }

  console.log(`Found ${usedPublicIds.size} unique used public_ids across DB and frontend.`);

  // 3. Fetch all assets from old and new accounts
  const getAllAssets = async (config: any) => {
    const assets = new Set<string>();
    let nextCursor = undefined;
    do {
      const result = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: nextCursor,
        type: 'upload',
        ...config
      }) as any;
      for (const res of result.resources) {
        assets.add(res.public_id);
      }
      nextCursor = result.next_cursor;
    } while (nextCursor);
    return assets;
  };

  console.log('Fetching assets from old account...');
  const oldAssets = await getAllAssets(oldConfig);
  console.log(`Old account has ${oldAssets.size} total assets.`);

  console.log('Fetching assets from new account...');
  const newAssets = await getAllAssets(newConfig);
  console.log(`New account has ${newAssets.size} total assets.`);

  // 4. Compute unused
  const unusedOld = Array.from(oldAssets).filter(id => !usedPublicIds.has(id));
  const unusedNew = Array.from(newAssets).filter(id => !usedPublicIds.has(id));

  console.log(`\nUnused in OLD account: ${unusedOld.length}`);
  console.log(`Unused in NEW account: ${unusedNew.length}`);

  if (isDryRun) {
    console.log('\n--- DRY RUN COMPLETED ---');
    console.log('Run without --dry-run to permanently delete these images.');
    process.exit(0);
  }

  // 5. Delete
  console.log('\n--- EXECUTING DELETIONS ---');

  // Batch delete logic for Cloudinary (up to 100 at a time)
  const batchDelete = async (publicIds: string[], config: any, accountName: string) => {
    for (let i = 0; i < publicIds.length; i += 100) {
      const batch = publicIds.slice(i, i + 100);
      try {
        console.log(`Deleting ${batch.length} unused assets from ${accountName} (batch ${i/100 + 1})...`);
        await cloudinary.api.delete_resources(batch, { type: 'upload', ...config });
      } catch (err) {
        console.error(`Error deleting batch from ${accountName}:`, err);
      }
    }
  };

  if (unusedOld.length > 0) {
    await batchDelete(unusedOld, oldConfig, 'OLD account');
  }
  
  if (unusedNew.length > 0) {
    await batchDelete(unusedNew, newConfig, 'NEW account');
  }

  console.log('Cleanup Finished Successfully.');
  process.exit(0);
}

cleanupCloudinary();
