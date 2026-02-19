import "dotenv/config";
import { db } from "../server/db";
import { streetFoodItems, restaurantMenuItems } from "../shared/schema";
import { eq, ilike, or } from "drizzle-orm";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Priority-based rules for image assignment
// Higher priority (lower number) matches are checked first.
const rules = [
    // --- PRIORITY 1: Specific Dish Types ---
    { priority: 1, keywords: ['paneer', 'pizza'], image: 'paneer_pizza.jpg' },
    { priority: 1, keywords: ['chicken', 'pizza'], image: 'chicken_pizza.jpg' }, // If missing, fallback to pizza.jpg in P2
    { priority: 1, keywords: ['veg', 'pizza'], image: 'veg_pizza.jpg' },
    { priority: 1, keywords: ['margherita'], image: 'pizza.jpg' },

    { priority: 1, keywords: ['mango', 'mastani'], image: 'mango_mastani.jpg' },
    { priority: 1, keywords: ['chocolate', 'shake'], image: 'chocolate_shake.jpg' },
    { priority: 1, keywords: ['cold', 'coffee'], image: 'cold_coffee.jpg' },
    { priority: 1, keywords: ['kitkat'], image: 'chocolate_shake.jpg' },
    { priority: 1, keywords: ['oreo'], image: 'chocolate_shake.jpg' },

    { priority: 1, keywords: ['fried', 'rice'], image: 'fried_rice.jpg' },
    { priority: 1, keywords: ['schezwan', 'rice'], image: 'fried_rice.jpg' },
    { priority: 1, keywords: ['manchurian'], image: 'manchurian.jpg' },
    { priority: 1, keywords: ['noodles'], image: 'hakka_noodles.jpg' },

    { priority: 1, keywords: ['pav', 'bhaji'], image: 'pav_bhaji.jpg' }, // If download failed, will be skipped by file check
    { priority: 1, keywords: ['vada', 'pav'], image: 'vada_pav.jpg' },
    { priority: 1, keywords: ['misal'], image: 'misal_pav.jpg' },
    { priority: 1, keywords: ['samosa'], image: 'samosa.jpg' },
    { priority: 1, keywords: ['pani', 'puri'], image: 'pani_puri.jpg' },

    // --- PRIORITY 2: Broad Dish Categories ---
    { priority: 2, keywords: ['pizza'], image: 'pizza.jpg' },
    { priority: 2, keywords: ['burger'], image: 'burger.jpg' },
    { priority: 2, keywords: ['sandwich'], image: 'sandwich.jpg' },
    { priority: 2, keywords: ['pasta'], image: 'pasta.jpg' },
    { priority: 2, keywords: ['shake'], image: 'milkshake.jpg' },
    { priority: 2, keywords: ['coffee'], image: 'coffee.jpg' },
    { priority: 2, keywords: ['juice'], image: 'fruit_juice.jpg' },
    { priority: 2, keywords: ['thali'], image: 'thali.jpg' },
    { priority: 2, keywords: ['paratha'], image: 'paratha.jpg' },
    { priority: 2, keywords: ['momos'], image: 'chinese_starter.jpg' }, // Fallback to starter-like image

    // --- PRIORITY 3: Generic Ingredients (Fallback) ---
    // Only use these if no specific dish type was found.
    // e.g., "Paneer Chilli" -> Paneer Dish (Acceptable fallback if no specific Chinese starter image)
    // But "Paneer Pizza" matches P1 rule first, so it won't hit this.
    { priority: 3, keywords: ['paneer'], image: 'paneer_dish.jpg' },
    { priority: 3, keywords: ['chicken'], image: 'chicken_curry.jpg' }, // CAREFUL: Only if not pizza/burger
    { priority: 3, keywords: ['mutton'], image: 'mutton_curry.jpg' },
    { priority: 3, keywords: ['egg'], image: 'egg_curry.jpg' },
    { priority: 3, keywords: ['veg'], image: 'veg_curry.jpg' },

    // --- PRIORITY 4: Extremely Generic ---
    { priority: 4, keywords: ['rice'], image: 'rice_dish.jpg' },
    { priority: 4, keywords: ['dal'], image: 'veg_curry.jpg' },
    { priority: 4, keywords: ['salad'], image: 'salad.jpg' },
    { priority: 4, keywords: ['soup'], image: 'soup.jpg' },
    { priority: 4, keywords: ['cake'], image: 'dessert.jpg' },
    { priority: 4, keywords: ['pastry'], image: 'dessert.jpg' },
];

const publicDir = 'client/public';
const imageDir = '/images/menu-items/';
const absImageDir = path.resolve('client/public' + imageDir);

async function checkFileExists(filename: string): Promise<boolean> {
    try {
        await fs.promises.access(path.join(absImageDir, filename));
        return true;
    } catch {
        return false;
    }
}

function matchImage(itemName: string, category: string): string | null {
    const lowerName = itemName.toLowerCase();
    const lowerCat = (category || '').toLowerCase();
    const text = `${lowerName} ${lowerCat}`;

    for (const rule of rules) {
        // Check if ALL keywords in the rule are present in the text
        const match = rule.keywords.every(kw => text.includes(kw));

        if (match) {
            return rule.image;
        }
    }
    return null;
}

async function main() {
    console.log("Starting Precise Image Assignment...");

    // 1. Process Street Food
    console.log("Processing Street Food Items...");
    const streetFood = await db.select().from(streetFoodItems);
    let sfCount = 0;

    for (const item of streetFood) {
        const matchedImage = matchImage(item.name, item.description || ''); // Description helps for street food

        if (matchedImage) {
            const exists = await checkFileExists(matchedImage);
            if (exists) {
                await db.update(streetFoodItems)
                    .set({ imageUrl: `${imageDir}${matchedImage}` })
                    .where(eq(streetFoodItems.id, item.id));
                sfCount++;
                // console.log(`[SF] ${item.name} -> ${matchedImage}`);
            }
        }
    }
    console.log(`Updated ${sfCount} Street Food items.`);

    // 2. Process Restaurant Menu Items
    console.log("Processing Restaurant Menu Items...");
    // Fetch in batches to be safe, or just all if < 1000
    const menuItems = await db.select().from(restaurantMenuItems);
    let rmCount = 0;

    const BATCH_SIZE = 50;
    const updates = [];

    for (const item of menuItems) {
        const matchedImage = matchImage(item.name, item.category || '');

        if (matchedImage) {
            const exists = await checkFileExists(matchedImage);
            if (exists) {
                // Determine if we should overwrite. 
                // Currently, we overwrite EVERYTHING to fix the bad assignments.
                // In future, maybe check if it's already "correct"? Hard to say.

                updates.push(
                    db.update(restaurantMenuItems)
                        .set({ imageUrl: `${imageDir}${matchedImage}` })
                        .where(eq(restaurantMenuItems.id, item.id))
                );
                rmCount++;
                // console.log(`[RM] ${item.name} -> ${matchedImage}`);
            }
        }
    }

    // Execute in batches
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        await Promise.all(updates.slice(i, i + BATCH_SIZE));
        process.stdout.write(`\rUpdated ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length}`);
    }

    console.log(`\nDONE. Updated ${rmCount} Restaurant Menu items.`);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
