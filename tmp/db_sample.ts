import { pool } from "../server/db";
const r = await pool.query(`select 'menu' t, name, image_url from restaurant_menu_items where image_url like '%bjpfhxj7%' order by random() limit 6`);
const g = await pool.query(`select 'grocery' t, name, image_url from grocery_products where image_url like '%bjpfhxj7%' order by random() limit 4`);
console.log([...r.rows, ...g.rows].map(x => `${x.t} | ${x.name} | ${x.image_url}`).join("\n"));
const d = await pool.query(`select count(distinct image_url)::int c from (select image_url from restaurant_menu_items union all select image_url from grocery_products union all select image_url from street_food_items union all select profile_image_url from service_providers union all select image_url from cake_products union all select image_url from service_offerings union all select image_url from service_templates union all select image_url from provider_offers) s where image_url like '%bjpfhxj7%'`);
console.log("distinct bjpfhxj7 urls (single-url columns):", d.rows[0].c);
process.exit(0);
