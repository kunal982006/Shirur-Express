
import { db } from "../server/db";
import { serviceCategories, serviceProviders, groceryProducts, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from 'fs';

// Simple CSV Splitter
function splitCsvLine(line: string) {
    const matches = [];
    let currentMatch = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            matches.push(currentMatch.trim());
            currentMatch = '';
        } else {
            currentMatch += char;
        }
    }
    matches.push(currentMatch.trim());
    return matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

async function run() {
    console.log("Starting grocery import...");

    // 1. Ensure Grocery Category
    let groceryCat = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, "grocery")
    });

    if (!groceryCat) {
        console.log("Creating Grocery category...");
        const res = await db.insert(serviceCategories).values({
            name: "Grocery",
            slug: "grocery",
            icon: "shopping-bag",
            description: "Daily essentials and groceries"
        }).returning();
        groceryCat = res[0];
    } else {
        console.log("Grocery category exists:", groceryCat.id);
    }

    // 2. Ensure Provider
    let provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.categoryId, groceryCat.id)
    });

    if (!provider) {
        console.log("Creating default Grocery Provider...");
        // Use first user as owner if needed
        let user = await db.query.users.findFirst();
        if (!user) {
            // Create a dummy user if absolutely no users
            console.log("No users found, creating admin user for provider...");
            const userRes = await db.insert(users).values({
                username: "admin_provider",
                email: "admin@shirureen.com",
                password: "hashed_password_placeholder", // strictly for dev
                role: "admin",
                phone: "9999999999"
            }).returning();
            user = userRes[0];
        }

        const res = await db.insert(serviceProviders).values({
            userId: user.id,
            categoryId: groceryCat.id,
            businessName: "Shirur Grocery Mart",
            description: "Your daily needs store",
            address: "Main Market, Shirur",
            isVerified: true
        }).returning();
        provider = res[0];
    }
    console.log("Using Provider:", provider.businessName, provider.id);

    // 3. Read and Parse CSV
    const csvPath = 'c:\\Users\\Sai\\Desktop\\grocery product list.csv';
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found at " + csvPath);
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

    // Header: Sr.no,ProductID,Name,SaleRate,MRP,Description,CATEGORY,BRAND
    // Indices: 0, 1, 2, 3, 4, 5, 6, 7

    console.log(`Found ${lines.length} lines (including header).`);
    let count = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const cols = splitCsvLine(lines[i]);
        if (cols.length < 5) continue;

        const name = cols[2];
        const saleRate = cols[3];
        const mrp = cols[4];
        const description = cols[5];
        const category = cols[6];
        const brand = cols[7];

        if (!name || !saleRate) {
            console.warn(`Skipping line ${i}: Missing name or sale rate`);
            continue;
        }

        try {
            await db.insert(groceryProducts).values({
                providerId: provider.id,
                name: name,
                price: saleRate,
                mrp: mrp || null,
                description: description || "",
                category: category || "General",
                brand: brand || null,
                inStock: true,
                stockQuantity: 100
            });
            count++;
            if (count % 50 === 0) console.log(`Imported ${count}...`);
        } catch (e) {
            console.error(`Failed to insert ${name}:`, e);
        }
    }

    console.log(`Successfully imported ${count} products.`);
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
