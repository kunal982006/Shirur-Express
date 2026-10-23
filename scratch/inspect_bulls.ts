import { config } from "dotenv";
import pg from "pg";
config();
const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT id, business_name FROM service_providers WHERE business_name ILIKE '%bulls%'");
    console.log("Provider:", res.rows);
    if (res.rows.length > 0) {
      const items = await pool.query("SELECT id, name, category, price, is_veg, image_url, description FROM restaurant_menu_items WHERE provider_id = $1 ORDER BY category, name", [res.rows[0].id]);
      console.log("Count:", items.rows.length);
      const cats = Array.from(new Set(items.rows.map(r => r.category)));
      console.log("Categories:", cats);
      console.log("Sample items:", items.rows.slice(0, 10));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
