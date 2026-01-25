// server/import-gmart-products.ts
// Script to import GMart grocery products from CSV
// SAFE: All operations are wrapped in try-catch to prevent server crashes

import { parse } from 'csv-parse/sync';
import { db } from './db';
import { groceryProducts, serviceProviders, serviceCategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

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

export async function importGmartProducts(csvContent: string): Promise<{
    success: boolean;
    totalInCSV: number;
    imported: number;
    categories: string[];
    providerId?: string;
    providerName?: string;
    error?: string;
}> {
    try {
        console.log('[GMart Import] Starting import...');

        // Parse CSV with error handling
        let records: CSVProduct[];
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true, // Handle malformed CSV rows gracefully
                relax_quotes: true, // Handle bad quotes
            });
        } catch (parseError: any) {
            console.error('[GMart Import] CSV Parse Error:', parseError.message);
            return {
                success: false,
                totalInCSV: 0,
                imported: 0,
                categories: [],
                error: `CSV parsing failed: ${parseError.message}`
            };
        }

        console.log(`[GMart Import] Found ${records.length} products in CSV`);

        // Get GMart provider (grocery category)
        const groceryCategory = await db.query.serviceCategories.findFirst({
            where: eq(serviceCategories.slug, 'grocery'),
        });

        if (!groceryCategory) {
            console.warn('[GMart Import] Grocery category not found.');
            return {
                success: false,
                totalInCSV: records.length,
                imported: 0,
                categories: [],
                error: 'Grocery category not found. Please seed the database first.'
            };
        }

        // Get GMart provider
        const gmartProvider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.categoryId, groceryCategory.id),
        });

        if (!gmartProvider) {
            console.warn('[GMart Import] GMart provider not found.');
            return {
                success: false,
                totalInCSV: records.length,
                imported: 0,
                categories: [],
                error: 'GMart provider not found. Please create a grocery store provider first.'
            };
        }

        const providerId = gmartProvider.id;
        console.log(`[GMart Import] Using provider: ${gmartProvider.businessName} (ID: ${providerId})`);

        // Delete existing products for this provider
        console.log('[GMart Import] Clearing existing products...');
        try {
            await db.delete(groceryProducts).where(eq(groceryProducts.providerId, providerId));
        } catch (deleteError: any) {
            console.error('[GMart Import] Delete Error:', deleteError.message);
            // Continue anyway, products might not exist yet
        }

        // Filter and transform products
        const productsToInsert = records
            .filter((row) => {
                // Skip empty rows or rows with no name
                if (!row || !row.Name || row.Name.trim() === '') return false;
                // Skip rows with 0 price
                const price = parseFloat(row['Selling Price'] || row.MRP || '0');
                if (isNaN(price) || price <= 0) return false;
                return true;
            })
            .map((row) => {
                const mrpValue = parseFloat(row.MRP || '0');
                const mrp = !isNaN(mrpValue) && mrpValue > 0 ? mrpValue.toString() : null;

                const sellingPriceValue = parseFloat(row['Selling Price'] || '0');
                const sellingPrice = !isNaN(sellingPriceValue) && sellingPriceValue > 0
                    ? sellingPriceValue.toString()
                    : (mrp || '0');

                // Combine name with variant if variant exists and is not just "-"
                let productName = (row.Name || 'Unknown Product').trim();
                if (row['Variant name'] && row['Variant name'] !== '-' && row['Variant name'].trim() !== '') {
                    productName = `${productName} - ${row['Variant name'].trim()}`;
                }

                return {
                    providerId,
                    name: productName.substring(0, 250), // Limit name length
                    description: null,
                    category: cleanCategory(row.Category || 'Other'),
                    brand: row.Brand && row.Brand !== '-' ? row.Brand.trim().substring(0, 250) : null,
                    price: sellingPrice,
                    mrp: mrp,
                    weight: row.UOM && row.UOM !== '-' ? row.UOM.trim().substring(0, 100) : null,
                    unit: null,
                    inStock: true,
                    stockQuantity: 100, // Default stock
                    imageUrl: row['Image Url'] ? row['Image Url'].trim().substring(0, 500) : null,
                };
            });

        console.log(`[GMart Import] Inserting ${productsToInsert.length} valid products...`);

        if (productsToInsert.length === 0) {
            return {
                success: true,
                totalInCSV: records.length,
                imported: 0,
                categories: [],
                providerId,
                providerName: gmartProvider.businessName,
            };
        }

        // Insert in batches of 50 with error handling per batch
        const batchSize = 50;
        let inserted = 0;
        let failedBatches = 0;

        for (let i = 0; i < productsToInsert.length; i += batchSize) {
            const batch = productsToInsert.slice(i, i + batchSize);
            try {
                await db.insert(groceryProducts).values(batch);
                inserted += batch.length;
                console.log(`[GMart Import] Inserted ${inserted}/${productsToInsert.length} products`);
            } catch (batchError: any) {
                failedBatches++;
                console.error(`[GMart Import] Batch ${Math.floor(i / batchSize) + 1} failed:`, batchError.message);
                // Continue with next batch instead of crashing
            }
        }

        console.log('[GMart Import] ✅ Import complete!');

        // Get unique categories for summary
        const categories = Array.from(new Set(productsToInsert.map((p) => p.category)));

        return {
            success: true,
            totalInCSV: records.length,
            imported: inserted,
            categories,
            providerId,
            providerName: gmartProvider.businessName,
        };

    } catch (error: any) {
        console.error('[GMart Import] Unexpected error:', error.message);
        return {
            success: false,
            totalInCSV: 0,
            imported: 0,
            categories: [],
            error: error.message || 'Unexpected error during import'
        };
    }
}
