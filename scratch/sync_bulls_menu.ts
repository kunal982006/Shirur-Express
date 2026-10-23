import { config } from "dotenv";
import fs from "fs";
import pg from "pg";
import { createId } from "@paralleldrive/cuid2";
import { updatedBullsMenu } from "./bulls_updated_menu_data";

config();
const { Pool } = pg;

const PROVIDER_ID = "fg11p6mi37d50tm4sfa13o13";

// Map older/misspelled DB names or category items to their image_url
const NAME_IMAGE_ALIASES: Record<string, string[]> = {
  "Cheese Chilli Garlic Grilled Sandwich": ["Chee Chilli Garlic Grilled Sandwich"],
  "Italian Paneer Cheese Burger": ["Italiyan Paneer Cheese Burger"],
  "Blue Ocean Mojito": ["Blue Ocen Mojito"],
  "Lemon Ice Tea": ["Leman Ice Tea"],
  "Aloo Tikki Burger": ["Aloo Tikki Cheese Burger", "Vedge burger"],
  "Cold Coffee with Ice Cream": ["Thick Cold Coffee", "Crush Thick Cold Coffee"]
};

async function syncBullsMenu() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("🚀 Starting database update for 'Bulls & Trader cafe'...");

    await client.query("BEGIN");

    // 1. Fetch all current DB items for Bulls & Trader cafe
    const currentRes = await client.query(
      "SELECT id, name, category, price, is_veg, image_url, description FROM restaurant_menu_items WHERE provider_id = $1",
      [PROVIDER_ID]
    );
    const existingItems = currentRes.rows;
    console.log(`Found ${existingItems.length} existing items in DB.`);

    // Build an image lookup map
    const imageMap = new Map<string, string>();
    for (const row of existingItems) {
      if (row.image_url) {
        imageMap.set(row.name.toLowerCase().trim(), row.image_url);
      }
    }

    // Function to find best existing image for an item
    function resolveImage(itemName: string): string | null {
      const lower = itemName.toLowerCase().trim();
      if (imageMap.has(lower)) {
        return imageMap.get(lower)!;
      }
      const aliases = NAME_IMAGE_ALIASES[itemName];
      if (aliases) {
        for (const alias of aliases) {
          const aliasLower = alias.toLowerCase().trim();
          if (imageMap.has(aliasLower)) {
            return imageMap.get(aliasLower)!;
          }
        }
      }
      return null;
    }

    // 2. Delete old items for this provider so we have a completely clean, deduplicated, correctly categorized menu
    console.log("Cleaning up old menu records for Bulls & Trader cafe...");
    await client.query("DELETE FROM restaurant_menu_items WHERE provider_id = $1", [PROVIDER_ID]);

    // 3. Insert the updated 107 items
    let inserted = 0;
    let imagesPreserved = 0;

    for (const item of updatedBullsMenu) {
      const img = resolveImage(item.name);
      if (img) imagesPreserved++;
      const id = createId();

      await client.query(
        `INSERT INTO restaurant_menu_items (
          id, provider_id, name, category, price, is_veg, is_available, description, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          PROVIDER_ID,
          item.name,
          item.category,
          item.finalPrice.toFixed(2),
          item.isVeg,
          true,
          item.description || `${item.category} item`,
          img
        ]
      );
      inserted++;
    }

    await client.query("COMMIT");

    console.log(`\n✅ Finished successfully!`);
    console.log(`- Inserted items: ${inserted}`);
    console.log(`- Preserved images: ${imagesPreserved}`);

    // Verify categories in DB now
    const checkCats = await pool.query(
      "SELECT category, count(*) as count FROM restaurant_menu_items WHERE provider_id = $1 GROUP BY category ORDER BY category",
      [PROVIDER_ID]
    );
    console.log("\nNew Category Breakdown in DB:");
    console.table(checkCats.rows);

    const sample = await pool.query(
      "SELECT name, category, price, is_veg, image_url IS NOT NULL as has_image FROM restaurant_menu_items WHERE provider_id = $1 ORDER BY category, price LIMIT 15",
      [PROVIDER_ID]
    );
    console.log("\nSample Inserted Items:");
    console.table(sample.rows);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to update Bulls & Trader cafe menu:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

syncBullsMenu().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
