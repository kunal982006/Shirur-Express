import { pool } from "../server/db";
const r = await pool.query(`select sp.business_name, sp.latitude, sp.longitude, sp.address, sc.name as cat from service_providers sp left join service_categories sc on sc.id = sp.category_id order by sc.name`);
const byCat: Record<string, {total:number, withCoords:number}> = {};
for (const row of r.rows) { const c = row.cat || '?'; byCat[c] ??= {total:0,withCoords:0}; byCat[c].total++; if (row.latitude && row.longitude) byCat[c].withCoords++; }
console.log(byCat);
console.log(r.rows.filter((x:any)=>/restaurant|street|cake/i.test(x.cat||'')).map((x:any)=>`${x.cat} | ${x.business_name} | ${x.latitude},${x.longitude} | ${x.address}`).join("\n"));
process.exit(0);
