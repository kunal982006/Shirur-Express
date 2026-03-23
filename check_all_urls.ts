import 'dotenv/config';
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { sql } from "drizzle-orm";

async function checkAllTables() {
    const tableNames = [
        'streetFoodItems',
        'restaurantMenuItems',
        'cakeProducts',
        'groceryProducts',
        'serviceProviders',
        'serviceOfferings',
        'serviceTemplates',
        'serviceProblems',
        'deliveryPartners',
        'providerOffers',
        'rentalProperties'
    ];

    const results: any[] = [];

    for (const tableName of tableNames) {
        const table = (schema as any)[tableName];
        if (!table) continue;

        const allData = await db.select().from(table);
        
        for (const item of allData) {
            // Check all text fields for http URLs
            for (const [key, value] of Object.entries(item)) {
                if (typeof value === 'string' && value.startsWith('http') && !value.includes('res.cloudinary.com')) {
                    results.push({
                        table: tableName,
                        id: item.id,
                        field: key,
                        url: value
                    });
                } else if (Array.isArray(value)) {
                    // Check gallery_images or similar
                    for (const url of value) {
                        if (typeof url === 'string' && url.startsWith('http') && !url.includes('res.cloudinary.com')) {
                            results.push({
                                table: tableName,
                                id: item.id,
                                field: key,
                                url: url
                            });
                        }
                    }
                }
            }
        }
    }

    const fs = await import('fs');
    fs.writeFileSync('non_cloudinary_report.json', JSON.stringify(results, null, 2));
    console.log(`Found ${results.length} non-cloudinary URLs. Report written to non_cloudinary_report.json`);
}

checkAllTables().catch(console.error);
