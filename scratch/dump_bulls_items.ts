import { config } from "dotenv";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query("SELECT id, name, category, price, is_veg, image_url, description FROM restaurant_menu_items WHERE provider_id = 'fg11p6mi37d50tm4sfa13o13'");
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

main();
