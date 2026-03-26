import 'dotenv/config';
import fs from 'fs';
import { parse } from 'csv-parse';
import { db } from '../server/db';
import { groceryProducts } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const csvFilePath = './updated_stock_1.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found at ${csvFilePath}`);
    return;
  }

  console.log(`Starting CSV parsing... (Dry Run: ${isDryRun})`);

  const products = await db.select().from(groceryProducts);
  console.log(`Found ${products.length} products in the database.`);

  const parser = fs.createReadStream(csvFilePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true
    }));

  let matchCount = 0;
  let mismatchCount = 0;
  let errors = 0;
  let duplicateCount = 0;
  
  const matchedProductIds = new Set<string>();
  const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();

  const productMap = new Map<string, typeof products[0]>();
  for (const p of products) {
    productMap.set(normalizeName(p.name), p);
  }

  for await (const row of parser) {
    const csvName = row['Name'];
    if (!csvName) continue;

    const sellingPrice = row['Selling Price'];
    const mrp = row['MRP'];

    if (!sellingPrice || !mrp) {
      continue;
    }

    const normCsvName = normalizeName(csvName);
    
    let match = productMap.get(normCsvName);

    if (!match) {
        match = products.find(p => {
           const normDbName = normalizeName(p.name);
           return normDbName === normCsvName || normDbName.includes(normCsvName) || normCsvName.includes(normDbName);
        });
    }

    if (match) {
      if (matchedProductIds.has(match.id)) {
        duplicateCount++;
        continue;
      }
      matchedProductIds.add(match.id);

      matchCount++;
      if (!isDryRun) {
        try {
          await db.update(groceryProducts)
            .set({ price: sellingPrice.toString(), mrp: mrp.toString(), updatedAt: new Date() })
            .where(eq(groceryProducts.id, match.id));
        } catch (e) {
          console.error(`Error updating product ${csvName}:`, e);
          errors++;
        }
      }
    } else {
      mismatchCount++;
    }
  }

  console.log('--- Summary ---');
  console.log(`Total Database Products: ${products.length}`);
  console.log(`Matched uniquely and ${isDryRun ? 'would update' : 'updated'}: ${matchCount}`);
  console.log(`Duplicate matches skipped: ${duplicateCount}`);
  console.log(`No match found in DB for CSV row: ${mismatchCount}`);
  console.log(`Errors: ${errors}`);
  console.log('----------------');

  process.exit(0);
}

main().catch(console.error);
