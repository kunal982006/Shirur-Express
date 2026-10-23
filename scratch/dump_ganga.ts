import { config } from "dotenv";
import fs from "fs";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query("SELECT id, name, category, price, is_veg, image_url, description FROM restaurant_menu_items WHERE provider_id = 's7f2xhvq5tdzcpoi89stmdjq' ORDER BY is_veg, category, name");
  fs.writeFileSync("scratch/ganga_current_db.json", JSON.stringify(res.rows, null, 2), "utf8");
  console.log(`Saved ${res.rows.length} items for Ganga Grand.`);
  const vegCount = res.rows.filter(r => r.is_veg).length;
  const nonVegCount = res.rows.filter(r => !r.is_veg).length;
  console.log(`Veg: ${vegCount}, Non-Veg: ${nonVegCount}`);
  const cats = Array.from(new Set(res.rows.map(r => `${r.category} (${r.is_veg ? 'Veg' : 'Non-Veg'})`)));
  console.log("Categories:", cats);
  await pool.end();
}

main().catch(console.error);
