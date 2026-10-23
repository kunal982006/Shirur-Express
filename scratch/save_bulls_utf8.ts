import { config } from "dotenv";
import fs from "fs";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query("SELECT id, name, category, price, is_veg, image_url, description FROM restaurant_menu_items WHERE provider_id = 'fg11p6mi37d50tm4sfa13o13'");
  fs.writeFileSync("scratch/bulls_current_db_utf8.json", JSON.stringify(res.rows, null, 2), "utf8");
  console.log("Successfully dumped", res.rows.length, "items.");
  await pool.end();
}

main();
