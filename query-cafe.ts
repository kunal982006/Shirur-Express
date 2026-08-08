import { config } from "dotenv";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id, name, category, price FROM restaurant_menu_items WHERE provider_id = (SELECT id FROM service_providers WHERE business_name ILIKE '%cafe of joy%') ORDER BY category, name`);
    const pastas = res.rows.filter(r => r.category.toLowerCase().includes('pasta'));
    console.log("Pastas:", pastas);
    console.log("Categories:", [...new Set(res.rows.map(r => r.category))]);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
