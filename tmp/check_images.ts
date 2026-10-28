import { pool } from "../server/db";
const { rows } = await pool.query(`(select profile_image_url u from service_providers where profile_image_url like '%cloudinary%' limit 3) union all (select image_url from restaurant_menu_items where image_url like '%cloudinary%' limit 3)`);
for (const r of rows) { const res = await fetch(r.u, { method: "GET" }); console.log(res.status, res.headers.get("x-cld-error") || "", r.u); }
process.exit(0);
