require("dotenv").config();
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // 1. Get Electrician Category ID
    const catRes = await pool.query(`SELECT id FROM service_categories WHERE slug = 'electrician'`);
    if (catRes.rows.length === 0) throw new Error("Electrician category not found");
    const categoryId = catRes.rows[0].id;

    // 2. Insert parent problem "Welding & Fabrication"
    const parentRes = await pool.query(`
      INSERT INTO service_problems (id, category_id, name, parent_id, image_url) 
      VALUES (gen_random_uuid(), $1, 'Welding & Fabrication', null, '/images/electrician/welding.png') 
      RETURNING id
    `, [categoryId]);
    const parentId = parentRes.rows[0].id;

    // 3. Insert child problems
    const issues = [
      "Doors, Windows & Grills",
      "Gates & Railings",
      "Shed & Roofing Fabrication",
      "Custom Metalwork & Welding Repairs"
    ];

    for (const issue of issues) {
      await pool.query(`
        INSERT INTO service_problems (id, category_id, name, parent_id)
        VALUES (gen_random_uuid(), $1, $2, $3)
      `, [categoryId, issue, parentId]);
    }

    console.log("Welding & Fabrication added successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
