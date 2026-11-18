import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
const ids = ['pcbo6y9piqx717fj4vugvd4p','x92myl7c297kx0qqctzkwdil','x9508ti560oxjsep7kolerwh','fikqps18h3tcqisbouo8mud1'];
const it: any = await db.execute(sql.raw(`select provider_id, category, name, price, is_popular from street_food_items where provider_id in ('${ids.join("','")}') order by provider_id, category, name, price::numeric`));
for (const r of (it.rows ?? it)) console.log(r.provider_id.slice(0,4), '|', r.category, '|', JSON.stringify(r.name), '|', r.price, r.is_popular ? 'POP':'');
const r2: any = await db.execute(sql`select name, price from street_food_items where provider_id='ja4ec18df2ig0zypl6t1bedy' order by name`);
console.log('RUDRA:', (r2.rows ?? r2).map((r:any)=>r.name+' '+r.price).join(' | '));
process.exit(0);
