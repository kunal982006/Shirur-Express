import { pool } from "../server/db";
import fs from "fs";
const cols = (await pool.query(`select table_name t, column_name c, data_type d from information_schema.columns where table_schema='public' and (column_name ilike '%image%')`)).rows;
const urls = new Set<string>();
for (const { t, c, d } of cols) {
  const rows = (await pool.query(`select "${c}"::text v from "${t}" where "${c}"::text like '%bjpfhxj7%'`)).rows;
  for (const { v } of rows) for (const m of v.matchAll(/https:\/\/res\.cloudinary\.com\/bjpfhxj7\/[^"',}\s]+/g)) urls.add(m[0]);
}
const ext = (u: string) => (u.match(/\.(\w+)$/)?.[1] || "?").toLowerCase();
const neu = [...urls].map(u => ({ u, v: Number(u.match(/\/v(\d+)\//)?.[1] || 0), e: ext(u) })).sort((a, b) => a.v - b.v);
const old = JSON.parse(fs.readFileSync("tmp/old_cloud_assets.json", "utf8")).map((a: any) => ({ u: a.url, t: a.created, e: ext(a.url) })).sort((a: any, b: any) => a.t.localeCompare(b.t));
console.log("new urls:", neu.length, "old assets:", old.length);
const cnt = (arr: any[]) => arr.reduce((m, x) => (m[x.e] = (m[x.e] || 0) + 1, m), {});
console.log("new formats", cnt(neu), "old formats", cnt(old));
const s1 = neu.map(x => x.e[0]).join(""), s2 = old.map((x: any) => x.e[0]).join("");
console.log("new seq start:", s1.slice(0, 120)); console.log("old seq start:", s2.slice(0, 120));
const byMonth = (arr: any[], f: (x: any) => string) => arr.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});
console.log("new by day:", byMonth(neu, x => new Date(x.v * 1000).toISOString().slice(0, 10)));
console.log("old by hour:", byMonth(old, (x: any) => x.t.slice(0, 13)));
fs.writeFileSync("tmp/new_urls.json", JSON.stringify(neu));
process.exit(0);
