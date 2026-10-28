import { pool } from "../server/db";
const r = await pool.query(`select substring(image_url from '/v([0-9]{10})/') v from restaurant_menu_items where image_url like '%bjpfhxj7%' union all select substring(image_url from '/v([0-9]{10})/') from grocery_products where image_url like '%bjpfhxj7%'`);
const months: Record<string, number> = {};
for (const { v } of r.rows) { if (!v) continue; const m = new Date(Number(v) * 1000).toISOString().slice(0, 7); months[m] = (months[m] || 0) + 1; }
console.log(months);
process.exit(0);
