import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
const it: any = await db.execute(sql`select category, name, price, is_popular, (image_url is not null) img, description from street_food_items where provider_id='fe7z3re1n1tpp9lp0k7cnczb' order by category, name`);
for (const r of (it.rows ?? it)) console.log(r.category, '|', JSON.stringify(r.name), '|', r.price, r.is_popular?'POP':'', r.img?'img':'NOIMG', r.description??'');
const s: any = await db.execute(sql`select category, name, price, is_popular, (image_url is not null) img, description from street_food_items where provider_id='pcbo6y9piqx717fj4vugvd4p' and category in ('Momos','Soya Chap & Paneer Tikka') order by category, name`);
for (const r of (s.rows ?? s)) console.log('SURBHI', r.category, '|', r.name, '|', r.price, r.is_popular?'POP':'', r.img?'img':'NOIMG', r.description??'');
process.exit(0);
