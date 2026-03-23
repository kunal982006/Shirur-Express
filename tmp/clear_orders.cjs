// Script to delete all orders and bookings from the database
const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function clearAll() {
  console.log("Starting cleanup...");

  // Delete in order (invoices first because they reference bookings)
  const inv = await sql`DELETE FROM invoices RETURNING id`;
  console.log(`Deleted ${inv.length} invoices`);

  const g = await sql`DELETE FROM grocery_orders RETURNING id`;
  console.log(`Deleted ${g.length} grocery orders`);

  const sf = await sql`DELETE FROM street_food_orders RETURNING id`;
  console.log(`Deleted ${sf.length} street food orders`);

  const r = await sql`DELETE FROM restaurant_orders RETURNING id`;
  console.log(`Deleted ${r.length} restaurant orders`);

  const b = await sql`DELETE FROM bookings RETURNING id`;
  console.log(`Deleted ${b.length} bookings`);

  console.log("Done! All orders and bookings cleared.");
}

clearAll().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
