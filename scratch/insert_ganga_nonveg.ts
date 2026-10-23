import { config } from "dotenv";
import fs from "fs";
import pg from "pg";
import { createId } from "@paralleldrive/cuid2";
import { gangaNonVegItems } from "./ganga_nonveg_menu_data";

config();
const { Pool } = pg;

const GANGA_PROVIDER_ID = "s7f2xhvq5tdzcpoi89stmdjq";

// Load non-veg images pool from DB
const imagePool: Array<{ name: string; image_url: string; category: string }> = 
  JSON.parse(fs.readFileSync("scratch/non_veg_images_pool.json", "utf8"));

function findImageForDish(englishName: string, category: string): string | null {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const nameClean = clean(englishName);

  // 1. Direct includes
  for (const row of imagePool) {
    const rowClean = clean(row.name);
    if (rowClean === nameClean) return row.image_url;
  }

  // 2. Exact keyword matches
  const keywords: Array<{ check: RegExp; target: RegExp }> = [
    { check: /biryani/i, target: /chicken.*biryani|dum.*biryani|biryani/i },
    { check: /tandoori.*full|tandoori.*half|tandoori/i, target: /tandoori.*chicken|chicken.*tandoori/i },
    { check: /lollipop/i, target: /lollipop/i },
    { check: /angara/i, target: /angara/i },
    { check: /banjara/i, target: /banjara/i },
    { check: /hariyali/i, target: /hariyali/i },
    { check: /seekh/i, target: /seekh/i },
    { check: /boti/i, target: /boti/i },
    { check: /koliwada/i, target: /koliwada|fish.*fry/i },
    { check: /surmai/i, target: /surmai|fish.*fry/i },
    { check: /paplet|pomfret/i, target: /pomfret|paplet|fish.*fry/i },
    { check: /rohu|fish.*fry|fish.*tawa/i, target: /fish.*fry|fish/i },
    { check: /fish.*thali/i, target: /fish.*thali|surmai.*thali|thali/i },
    { check: /mutton.*thali/i, target: /mutton.*thali|thali/i },
    { check: /chicken.*thali/i, target: /chicken.*thali|thali/i },
    { check: /egg.*thali/i, target: /egg.*thali|thali/i },
    { check: /soup/i, target: /soup/i },
    { check: /kadhai/i, target: /kadhai|kadai/i },
    { check: /handi/i, target: /handi/i },
    { check: /mussallam|musallam/i, target: /mussallam|musallam|murg/i },
    { check: /lababdar/i, target: /lababdar|butter.*chicken/i },
    { check: /curry/i, target: /chicken.*curry|curry/i },
    { check: /masala/i, target: /chicken.*masala|masala/i },
    { check: /platter/i, target: /platter|kebab/i },
    { check: /raan/i, target: /raan|tandoori/i }
  ];

  for (const kw of keywords) {
    if (kw.check.test(englishName)) {
      const match = imagePool.find(r => kw.target.test(r.name));
      if (match) return match.image_url;
    }
  }

  // 3. Fallback by category
  if (category.includes("Soup")) {
    const soupMatch = imagePool.find(r => /soup/i.test(r.name));
    if (soupMatch) return soupMatch.image_url;
  }
  if (category.includes("Starter")) {
    const starterMatch = imagePool.find(r => /tikka|kabab|tandoori/i.test(r.name));
    if (starterMatch) return starterMatch.image_url;
  }
  if (category.includes("Handi") || category.includes("Main Course")) {
    const curryMatch = imagePool.find(r => /chicken.*curry|handi|masala/i.test(r.name));
    if (curryMatch) return curryMatch.image_url;
  }
  if (category.includes("Thali")) {
    const thaliMatch = imagePool.find(r => /thali/i.test(r.name));
    if (thaliMatch) return thaliMatch.image_url;
  }
  if (category.includes("Biryani")) {
    const biryaniMatch = imagePool.find(r => /biryani/i.test(r.name));
    if (biryaniMatch) return biryaniMatch.image_url;
  }

  return null;
}

async function insertGangaNonVeg() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("🚀 Starting insertion of Ganga Grand Non-Veg menu items...");
    await client.query("BEGIN");

    // First, remove any previous non-veg items for this provider to prevent duplicate items if re-run
    const delRes = await client.query(
      "DELETE FROM restaurant_menu_items WHERE provider_id = $1 AND is_veg = false",
      [GANGA_PROVIDER_ID]
    );
    console.log(`Cleared ${delRes.rowCount} previous non-veg items.`);

    let inserted = 0;
    let imagesAssigned = 0;

    for (const item of gangaNonVegItems) {
      const id = createId();
      const combinedName = `${item.marathiName} (${item.englishName})`;
      const imageUrl = findImageForDish(item.englishName, item.category);
      if (imageUrl) imagesAssigned++;

      await client.query(
        `INSERT INTO restaurant_menu_items (
          id, provider_id, name, category, price, is_veg, is_available, description, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          GANGA_PROVIDER_ID,
          combinedName,
          item.category,
          item.finalPrice.toFixed(2),
          false, // is_veg = false
          true,
          item.description,
          imageUrl
        ]
      );
      inserted++;
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully added ${inserted} Non-Veg items to Ganga Grand!`);
    console.log(`🖼️ Images assigned: ${imagesAssigned}/${inserted}`);

    // Verification
    const countRes = await pool.query(
      "SELECT is_veg, count(*) as count FROM restaurant_menu_items WHERE provider_id = $1 GROUP BY is_veg",
      [GANGA_PROVIDER_ID]
    );
    console.log("\nUpdated Provider Item Totals:");
    console.table(countRes.rows);

    const catRes = await pool.query(
      "SELECT category, is_veg, count(*) as count FROM restaurant_menu_items WHERE provider_id = $1 AND is_veg = false GROUP BY category, is_veg ORDER BY category",
      [GANGA_PROVIDER_ID]
    );
    console.log("\nNon-Veg Category Breakdown:");
    console.table(catRes.rows);

    const sampleRes = await pool.query(
      "SELECT name, category, price, is_veg, image_url IS NOT NULL as has_image FROM restaurant_menu_items WHERE provider_id = $1 AND is_veg = false ORDER BY category, price LIMIT 15",
      [GANGA_PROVIDER_ID]
    );
    console.log("\nSample Non-Veg Items:");
    console.table(sampleRes.rows);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to add non-veg items:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

insertGangaNonVeg().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
