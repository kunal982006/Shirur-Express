// Dry run by default. Pass --apply to write coordinates for confident (name-matched) results.
import { pool } from "../server/db";
const APPLY = process.argv.includes("--apply");
const KEY = process.env.VITE_GOOGLE_MAPS_API_KEY!;
const SHIRUR = { lat: 18.8285, lng: 74.3734 };
const STOP = new Set(["hotel","cafe","shirur","pure","veg","non","and","the","restaurant","center","centre","foods","food","house","snacks","menu","special","shree","shri","sri"]);
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(t => t.length > 2 && !STOP.has(t));
const nameMatches = (a: string, b: string) => { const tb = tokens(b); return tokens(a).some(t => tb.some(u => u.startsWith(t.slice(0, 4)) || t.startsWith(u.slice(0, 4)))); };
const km = (a: any, b: any) => { const R = 6371, t = Math.PI / 180; const dLat = (b.lat - a.lat) * t, dLng = (b.lng - a.lng) * t; const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
async function search(textQuery: string) {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "places.displayName,places.location,places.formattedAddress" }, body: JSON.stringify({ textQuery, locationBias: { circle: { center: { latitude: SHIRUR.lat, longitude: SHIRUR.lng }, radius: 8000 } } }) }).then(r => r.json());
  return (r.places || []) as any[];
}
const { rows } = await pool.query(`select sp.id, sp.business_name, sp.address, sc.slug from service_providers sp join service_categories sc on sc.id = sp.category_id where sc.slug in ('restaurants','cake-shop') and (sp.latitude is null or sp.longitude is null) order by sc.slug, sp.business_name`);
const missing: string[] = [];
// Verified by eye from an unfiltered search (name filter rejects them: 'RK' too short, 'Pokket' spelling).
const OVERRIDES: Record<string, [number, number]> = { 'Hotel RK': [18.81478, 74.35001], 'Pocket Cafe': [18.82717, 74.3635] };
for (const p of rows) {
  const name = p.business_name.replace(/\|.*$/, "").trim();
  const addr = /added via admin/i.test(p.address) ? "" : p.address;
  const o = OVERRIDES[name];
  if (o) {
    console.log(`OK | ${p.slug} | ${p.business_name} (override) | ${o[0]},${o[1]}`);
    if (APPLY) await pool.query(`update service_providers set latitude=$1, longitude=$2 where id=$3 and latitude is null`, [o[0], o[1], p.id]);
    continue;
  }
  let match: any = null;
  for (const q of [`${name} ${addr} Shirur`, `${name} Shirur`]) {
    match = (await search(q)).find(pl => nameMatches(name, pl.displayName?.text || "") && km(SHIRUR, { lat: pl.location.latitude, lng: pl.location.longitude }) < 8);
    if (match) break;
  }
  if (!match) { missing.push(`${p.slug} | ${p.business_name}`); continue; }
  const loc = { lat: match.location.latitude, lng: match.location.longitude };
  console.log(`OK | ${p.slug} | ${p.business_name} -> ${match.displayName?.text} | ${match.formattedAddress} | ${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`);
  if (APPLY) await pool.query(`update service_providers set latitude=$1, longitude=$2 where id=$3 and latitude is null`, [loc.lat, loc.lng, p.id]);
}
console.log(`\nNeeds manual pin (${missing.length}):\n` + missing.join("\n"));
process.exit(0);
