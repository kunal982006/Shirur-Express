require("dotenv").config();
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`INSERT INTO service_categories (id, name, slug, icon, description) VALUES (gen_random_uuid(), 'Phone Repair & Hub', 'phone-hub', 'smartphone', 'Expert phone repairs and accessories') ON CONFLICT (slug) DO NOTHING;`);
    console.log("Category added successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
