// Verify all orders/bookings are cleared
const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

async function verify() {
  const [{ count: inv }]   = await sql`SELECT COUNT(*) FROM invoices`;
  const [{ count: g }]     = await sql`SELECT COUNT(*) FROM grocery_orders`;
  const [{ count: sf }]    = await sql`SELECT COUNT(*) FROM street_food_orders`;
  const [{ count: r }]     = await sql`SELECT COUNT(*) FROM restaurant_orders`;
  const [{ count: b }]     = await sql`SELECT COUNT(*) FROM bookings`;

  console.log("=== Verification ===");
  console.log(`invoices:           ${inv}`);
  console.log(`grocery_orders:     ${g}`);
  console.log(`street_food_orders: ${sf}`);
  console.log(`restaurant_orders:  ${r}`);
  console.log(`bookings:           ${b}`);
}

verify().catch(err => { console.error(err.message); process.exit(1); });
