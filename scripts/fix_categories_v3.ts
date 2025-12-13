
import { db } from "../server/db";
import { groceryProducts } from "@shared/schema";
import { eq } from "drizzle-orm";

const mappings: Record<string, string> = {
    "BUSCIT": "BISCUITS",
    "DOOR DAL": "PULSES",
    "DETAL CARE": "DENTAL CARE",
    "HELTH CARE": "HEALTH CARE",
    "KKHOBRA KISSS": "DRY FRUITS",
    "KHOBRA KISS": "DRY FRUITS",
    "KHOB KISS JAD": "DRY FRUITS",
    "KHOBRA KISS JAD": "DRY FRUITS",
    "MATAKI": "PULSES",
    "MATAKI GAVRAN": "PULSES",
    "MUGDAL": "PULSES",
    "SHABUDANA": "SABUDANA",
    "BAJARI": "STAPLES", // Grain
    "GAHU": "STAPLES", // Wheat
    "JAWARI SUPER": "STAPLES",
    "JWARI BOLD": "STAPLES",
    "RAGI": "STAPLES",
    "RAWA": "STAPLES", // or Flours. 'RAWA' (16) exists. 'FLOURS' (53). Let's keep RAWA or merge? RAWA is semolina. STAPLES is fine.
    "SOOJI": "STAPLES",
};

async function fixCategoriesV3() {
    console.log("Starting Round 3 normalization...");
    for (const [bad, good] of Object.entries(mappings)) {
        await db.update(groceryProducts)
            .set({ category: good })
            .where(eq(groceryProducts.category, bad));
    }
    console.log("Round 3 Done.");
    process.exit(0);
}

fixCategoriesV3().catch(console.error);
