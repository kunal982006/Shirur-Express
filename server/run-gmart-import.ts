// server/run-gmart-import.ts
// Standalone script to import GMart products from CSV

import { parse } from 'csv-parse/sync';
import { db } from './db';
import { groceryProducts, serviceProviders, serviceCategories } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface CSVProduct {
    Name: string;
    'Variant name': string;
    UOM: string;
    MRP: string;
    'Selling Price': string;
    Category: string;
    EAN: string;
    Brand: string;
    'Image Url': string;
}

// Map CSV categories to cleaner versions
function cleanCategory(category: string): string {
    const categoryMap: Record<string, string> = {
        'Manual Product': 'Other',
        'BABY CARE': 'Baby Care',
        'BAKERY| CAKES & DAIRY': 'Bakery & Dairy',
        'BEAUTY & HYGIENE': 'Beauty & Hygiene',
        'BEVERAGES': 'Beverages',
        'CLEANING & HOUSEHOLD': 'Cleaning & Household',
        'EGGS| MEAT & FISH': 'Eggs, Meat & Fish',
        'FOODGRAINS| OIL & MASALA': 'Foodgrains, Oil & Masala',
    };
    return categoryMap[category] || category;
}

async function main() {
    console.log('[GMart Import] Starting import...');

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'gmart-products.csv');
    console.log(`[GMart Import] Reading CSV from: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
        console.error(`File not found: ${csvPath}`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records: CSVProduct[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
    });

    console.log(`[GMart Import] Found ${records.length} products in CSV`);

    // Get GMart provider (grocery category)
    const groceryCategory = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, 'grocery'),
    });

    if (!groceryCategory) {
        console.error('Grocery category not found. Creating it...');
        // The category should exist from seeding
        process.exit(1);
    }

    console.log(`[GMart Import] Found grocery category: ${groceryCategory.id}`);

    // Get GMart provider
    let gmartProvider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.categoryId, groceryCategory.id),
    });

    if (!gmartProvider) {
        console.error('GMart provider not found. Please create a grocery provider first via the web app.');
        console.log('Tip: Register as a provider with category "grocery" first.');
        process.exit(1);
    }

    const providerId = gmartProvider.id;
    console.log(`[GMart Import] Using provider: ${gmartProvider.businessName} (ID: ${providerId})`);

    // Delete existing products for this provider
    console.log('[GMart Import] Clearing existing products...');
    const deleteResult = await db.delete(groceryProducts).where(eq(groceryProducts.providerId, providerId));
    console.log('[GMart Import] Cleared existing products');

    // Filter and transform products
    const productsToInsert = records
        .filter((row) => {
            // Skip empty rows or rows with no name
            if (!row.Name || row.Name.trim() === '') return false;
            // Skip rows with 0 price
            const price = parseFloat(row['Selling Price'] || row.MRP || '0');
            if (price <= 0) return false;
            return true;
        })
        .map((row) => {
            const mrp = row.MRP ? parseFloat(row.MRP).toString() : null;
            const sellingPrice = row['Selling Price'] ? parseFloat(row['Selling Price']).toString() : mrp || '0';

            // Combine name with variant if variant exists and is not just "-"
            let productName = row.Name.trim();
            if (row['Variant name'] && row['Variant name'] !== '-' && row['Variant name'].trim() !== '') {
                productName = `${productName} - ${row['Variant name'].trim()}`;
            }

            return {
                providerId,
                name: productName,
                description: null,
                category: cleanCategory(row.Category || 'Other'),
                brand: row.Brand && row.Brand !== '-' ? row.Brand.trim() : null,
                price: sellingPrice,
                mrp: mrp,
                weight: row.UOM && row.UOM !== '-' ? row.UOM.trim() : null,
                unit: null,
                inStock: true,
                stockQuantity: 100, // Default stock
                imageUrl: row['Image Url'] || null,
            };
        });

    console.log(`[GMart Import] Inserting ${productsToInsert.length} valid products...`);

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize);
        await db.insert(groceryProducts).values(batch);
        inserted += batch.length;
        console.log(`[GMart Import] Inserted ${inserted}/${productsToInsert.length} products`);
    }

    console.log('[GMart Import] ✅ Import complete!');

    // Get unique categories for summary
    const categories = Array.from(new Set(productsToInsert.map((p) => p.category)));

    console.log('\n=== Import Summary ===');
    console.log(`Total in CSV: ${records.length}`);
    console.log(`Imported: ${productsToInsert.length}`);
    console.log(`Categories: ${categories.join(', ')}`);
    console.log(`Provider: ${gmartProvider.businessName}`);

    process.exit(0);
}

main().catch((err) => {
    console.error('Import Error:', err);
    process.exit(1);
});
