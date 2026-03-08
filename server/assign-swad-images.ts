import "dotenv/config";
import { db } from "./db";
import { serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const rules = [
    // --- Priority 1: Specific Thalis ---
    { keywords: ['thali'], image: 'thali.jpg' },

    // --- Priority 2: Specific Chinese ---
    { keywords: ['manchurian'], image: 'manchurian.jpg' },
    { keywords: ['noodle'], image: 'hakka_noodles.jpg' },
    { keywords: ['fried', 'rice'], image: 'fried_rice.jpg' },
    { keywords: ['schezwan', 'rice'], image: 'fried_rice.jpg' },
    { keywords: ['soup'], image: 'soup.jpg' },
    { keywords: ['lollipop'], image: 'chicken_drumstick.jpg' },

    // --- Priority 3: Biryani & Rice ---
    { keywords: ['chicken', 'biryani'], image: 'chicken_biryani.jpg' },
    { keywords: ['mutton', 'biryani'], image: 'biryani.jpg' }, // Generic biryani
    { keywords: ['biryani'], image: 'biryani.jpg' },
    { keywords: ['pulav'], image: 'pulao.jpg' },
    { keywords: ['rice'], image: 'rice_dish.jpg' },

    // --- Priority 4: Breads ---
    { keywords: ['paratha'], image: 'paratha.jpg' },
    { keywords: ['roti'], image: 'paratha.jpg' }, // rough fallback
    { keywords: ['naan'], image: 'paratha.jpg' }, // rough fallback
    { keywords: ['bhakari'], image: 'paratha.jpg' }, // rough fallback
    { keywords: ['chapati'], image: 'paratha.jpg' }, // rough fallback

    // --- Priority 5: Specific Curries & Dishes ---
    { keywords: ['butter', 'chicken'], image: 'butter_chicken.jpg' },
    { keywords: ['chicken'], image: 'chicken_curry.jpg' },
    { keywords: ['mutton'], image: 'mutton_curry.jpg' },
    { keywords: ['egg'], image: 'egg_curry.jpg' },
    { keywords: ['paneer', 'tikka'], image: 'paneer_tikka.jpg' },
    { keywords: ['paneer'], image: 'paneer_dish.jpg' },
    { keywords: ['dal'], image: 'dal.jpg' },

    // --- Priority 6: Generic Fallbacks ---
    { keywords: ['veg'], image: 'veg_curry.jpg' }
];

function matchImage(itemName: string, category: string): string | null {
    const lowerName = itemName.toLowerCase();
    const lowerCat = (category || '').toLowerCase();
    const text = `${lowerName} ${lowerCat}`;

    for (const rule of rules) {
        const match = rule.keywords.every(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            // Check substrings if word boundaries fail for some like "nuddles" vs "noodles"
            return text.includes(kw) || regex.test(text);
        });

        if (match) {
            return rule.image;
        }
    }
    return null;
}

async function assignSwadImages() {
    console.log("Starting Image Assignment for Swad...");

    const providerList = await db.query.serviceProviders.findMany({
        where: ilike(serviceProviders.businessName, "%Swad Chinese & Biryani%"),
    });

    if (providerList.length === 0) {
        console.error("Could not find Swad provider");
        process.exit(1);
    }
    const provider = providerList[0];

    const items = await db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, provider.id)
    });

    let count = 0;
    for (const item of items) {
        const image = matchImage(item.name, item.category || '');
        if (image) {
            await db.update(restaurantMenuItems)
                .set({ imageUrl: `/images/menu-items/${image}` })
                .where(eq(restaurantMenuItems.id, item.id));
            count++;
            console.log(`Matched: ${item.name} -> ${image}`);
        } else {
            console.log(`No Match: ${item.name}`);
        }
    }

    console.log(`\nUpdated ${count} items out of ${items.length} for Swad Chinese & Biryani.`);
    process.exit(0);
}

assignSwadImages().catch(console.error);
