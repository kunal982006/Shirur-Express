
import { db } from "../server/db";
import { groceryProducts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const mappings: Record<string, string> = {
    // Biscuits
    "biscuit": "BISCUITS",
    "BISCUIT": "BISCUITS",
    "biscuits": "BISCUITS",
    "BISCUT": "BISCUITS",
    "biscut": "BISCUITS",
    "britannia": "BISCUITS", // Assuming these are misplaced brands

    // Chocolate
    "CHOCKLATE": "CHOCOLATES",
    "CHOCOLATE": "CHOCOLATES",

    // Snacks
    "SNAKS": "SNACKS",
    "namkeen": "SNACKS",

    // Spices
    "SPIES": "SPICES",

    // Sauce/Ketchup
    "SOUCE": "SAUCES",
    "SAUCE": "SAUCES",
    "tomato kethup": "SAUCES",

    // Stationery
    "STATIONARY": "STATIONERY",

    // Sugar
    "SUGAAR": "SUGAR",

    // Tea/Coffee
    "TEA &COFFEE": "TEA & COFFEE",
    "TEA&COFFE": "TEA & COFFEE",
    "tea&coffee": "TEA & COFFEE",
    "TEA POEDER": "TEA POWDER",

    // Pulses
    "TOORDAL": "TOOR DAL",
    "UDAD": "UDAD DAL",
    "UDID DAL": "UDAD DAL",
    "watana": "WATANA", // fix casing if needed

    // Personal Care / Toiletries
    "SKINCARE": "SKIN CARE",
    "SKINCARE WIPES": "SKIN CARE",
    "teeth care": "ORAL CARE",
    "TEETH CARE": "ORAL CARE",
    "TOOTH PASTE": "ORAL CARE",
    "TOOTH BRUSH": "ORAL CARE",
    "talk powder": "TALC",
    "hair-oil": "HAIR CARE",

    // Cleaning
    "dishwash gel": "CLEANING",
    "CLEANING-EQUIPMENTS": "CLEANING", // normalize separators?

    // Fasting
    "UPVAS": "UPWAS",

    // Misc
    "VINEGER": "VINEGAR",
    "good-night": "REPELLENTS"
};

async function fixCategories() {
    console.log("Starting category normalization...");

    for (const [bad, good] of Object.entries(mappings)) {
        const result = await db.update(groceryProducts)
            .set({ category: good })
            .where(eq(groceryProducts.category, bad))
            .returning();

        if (result.length > 0) {
            console.log(`Fixed '${bad}' -> '${good}' (${result.length} items)`);
        }
    }

    // Also, let's normalize everything to UPPERCASE to avoid case duplicates
    // (We do this carefully, maybe just for the ones we missed)
    // Actually, SQL update for Upper is easier.

    await db.execute(sql`UPDATE grocery_products SET category = UPPER(category)`);
    console.log("Normalized all categories to UPPERCASE.");

    console.log("Done.");
    process.exit(0);
}

fixCategories().catch(console.error);
