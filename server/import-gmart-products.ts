// server/import-gmart-products.ts
// Script to import GMart grocery products from CSV

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

export async function importGmartProducts(csvContent: string) {
    console.log('[GMart Import] Starting import...');

    // Parse CSV
    const records: CSVProduct[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`[GMart Import] Found ${records.length} products in CSV`);

    // Get GMart provider (grocery category)
    const groceryCategory = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, 'grocery'),
    });

    if (!groceryCategory) {
        throw new Error('Grocery category not found. Please seed the database first.');
    }

    // Get or create GMart provider
    let gmartProvider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.categoryId, groceryCategory.id),
    });

    if (!gmartProvider) {
        throw new Error('GMart provider not found. Please create a grocery store provider first.');
    }

    const providerId = gmartProvider.id;
    console.log(`[GMart Import] Using provider: ${gmartProvider.businessName} (ID: ${providerId})`);

    // Delete existing products for this provider
    console.log('[GMart Import] Clearing existing products...');
    await db.delete(groceryProducts).where(eq(groceryProducts.providerId, providerId));

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
    const categories = [...new Set(productsToInsert.map((p) => p.category))];

    return {
        success: true,
        totalInCSV: records.length,
        imported: productsToInsert.length,
        categories,
        providerId,
        providerName: gmartProvider.businessName,
    };
}

// If running directly (node import-gmart-products.ts path/to/csv)
if (require.main === module) {
    const csvPath = process.argv[2];
    if (!csvPath) {
        console.error('Usage: npx tsx server/import-gmart-products.ts <path-to-csv>');
        process.exit(1);
    }

    const fullPath = path.resolve(csvPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(fullPath, 'utf-8');

    importGmartProducts(csvContent)
        .then((result) => {
            console.log('Import Result:', result);
            process.exit(0);
        })
        .catch((err) => {
            console.error('Import Error:', err);
            process.exit(1);
        });
}
