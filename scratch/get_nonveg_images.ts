import { config } from "dotenv";
import fs from "fs";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query("SELECT name, image_url, category FROM restaurant_menu_items WHERE image_url IS NOT NULL AND is_veg = false");
  console.log(`Found ${res.rows.length} non-veg items with images in DB.`);
  fs.writeFileSync("scratch/non_veg_images_pool.json", JSON.stringify(res.rows, null, 2), "utf8");
  await pool.end();
}

main().catch(console.error);
