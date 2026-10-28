import { pool } from "../server/db";
const q = await pool.query(`select table_name, column_name from information_schema.columns where table_schema='public' and (column_name ilike '%image%' or column_name ilike '%photo%')`);
let total = 0;
for (const { table_name, column_name } of q.rows) {
  const r = await pool.query(`select count(*)::int c from "${table_name}" where "${column_name}"::text like '%res.cloudinary.com%'`);
  if (r.rows[0].c) { console.log(table_name, column_name, r.rows[0].c); total += r.rows[0].c; }
}
console.log("rows referencing cloudinary:", total);
process.exit(0);
