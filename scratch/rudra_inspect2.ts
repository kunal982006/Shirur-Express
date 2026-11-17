import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
const ids = ['ry4jm74iwie7tocuv1pjaspq','vz5t8xosrh3qfi0pp9t74vgb','ja4ec18df2ig0zypl6t1bedy'];
const cols: any = await db.execute(sql`select table_name, column_name from information_schema.columns where table_schema='public' and (column_name like '%provider%' or column_name like '%vendor%')`);
for (const r of (cols.rows ?? cols)) {
  const q: any = await db.execute(sql.raw(`select "${r.column_name}" as p, count(*)::int as n from "${r.table_name}" where "${r.column_name}"::text in ('${ids.join("','")}') group by 1`));
  const rows = q.rows ?? q; if (rows.length) console.log(r.table_name, r.column_name, JSON.stringify(rows));
}
const it: any = await db.execute(sql.raw(`select provider_id, name, category, price, is_popular, popular_order from street_food_items where provider_id in ('${ids.join("','")}') order by provider_id, category, name`));
for (const r of (it.rows ?? it)) console.log(r.provider_id.slice(0,4), '|', r.category, '|', r.name, '|', r.price, '|', r.is_popular, r.popular_order);
process.exit(0);
