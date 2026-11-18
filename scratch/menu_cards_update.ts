import 'dotenv/config';
import { db } from '../server/db';
import { streetFoodItems } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs';

// Updates the Surbhi (momos + soya chap) and Samarth (Chinese) street food menus
// from their printed menu cards, with every card price raised 15%.
// Dry run by default; pass --apply to write.
const APPLY = process.argv.includes('--apply');
const SURBHI = 'pcbo6y9piqx717fj4vugvd4p', SAMARTH = 'fe7z3re1n1tpp9lp0k7cnczb';
const up = (p: number) => Math.round((p * 115) / 100); // +15%, integer math so .5 rounds up

type Variant = [string | null, number];
type Card = { cat: string; name: string; variants: Variant[] };
const hf = (h: number | null, f: number): Variant[] => (h == null ? [['Full', f]] : [['Half', h], ['Full', f]]);
const one = (p: number): Variant[] => [[null, p]];
const sf = (s: number | null, f: number | null): Variant[] => {
  const v: Variant[] = [];
  if (s != null) v.push(['Steam', s]);
  if (f != null) v.push(['Fried', f]);
  return v;
};

const surbhiCard: Card[] = [
  ...([
    ['Mix Veg Momos', 80, 100], ['Paneer Momos', 90, 120], ['Corn Cheese Momos', 100, 110], ['Veg Schezwan Momos', 90, 130],
    ['Paneer Tikka Momos', 100, 140], ['Chocolate Momos', 100, 140], ['Mix Veg Kurkure Momos', null, 150], ['Paneer Kurkure Momos', null, 160],
  ] as [string, number | null, number | null][]).map(([n, s, f]) => ({ cat: 'Momos', name: n, variants: sf(s, f) })),
  ...([
    ['Tandoori Soya Chap', 140], ['Malai Soya Chap', 170], ['Hariyali Soya Chap', 150], ['Afghani Soya Chap', 150], ['Achari Soya Chap', 150],
    ['Veg Moti Soya Chap', 160], ['Stuffed Tandoori Soya Chap', 180], ['Stuffed Malai Soya Chap', 200], ['Paneer Tandoori Tikka', 180],
    ['Hariyali Paneer Tikka', 190], ['Veg Moti Paneer Tikka', 200], ['Paneer Malai Tikka', 220],
  ] as [string, number][]).map(([n, p]) => ({ cat: 'Soya Chap & Paneer Tikka', name: n, variants: one(p) })),
];

const samarthCard: Card[] = [
  ...([['Manchow Soup', 60], ['Paneer Manchow Soup', 80], ['Manchurian Soup', 80]] as [string, number][])
    .map(([n, p]) => ({ cat: 'Soups', name: n, variants: one(p) })),
  ...([['Spring Roll', 200], ['Paneer Hotpan', 200], ['Veg Hotpan', 150], ['Special Veg Sizzler', 250]] as [string, number][])
    .map(([n, p]) => ({ cat: 'Samarth Special Starters', name: n, variants: one(p) })),
  ...([
    ['Manchurian Dry', 120], ['Manchurian Gravy', 140], ['Paneer Chilli Dry', 160], ['Paneer Chilli Gravy', 180], ['Paneer Crispy', 180],
    ['Paneer Manchurian Dry', 160], ['Paneer Manchurian Gravy', 180], ['Paneer 65', 180], ['Veg 65', 100], ['Veg Crispy', 120],
    ['Special Chinese Bhel', 120],
  ] as [string, number][]).map(([n, p]) => ({ cat: 'Starters', name: n, variants: one(p) })),
  ...([
    ['Fried Rice', 70, 120], ['Green Peas Rice', 80, 140], ['Schezwan Rice', 100, 160], ['Manchurian Rice', 120, 180],
    ['Manchurian Schezwan Rice', 140, 200], ['Paneer Fried Rice', 120, 180], ['Paneer Schezwan Rice', 140, 200],
    ['Garlic Fried Rice', 100, 160], ['Special Combo Rice', 140, 200], ['Capsicum Rice', 100, 160], ['Combination Rice', 100, 160],
    ['Paneer Hong Kong Rice', 160, 220], ['Paneer Singapore Rice', 160, 220], ['Soya Chap Fried Rice', 120, 180],
    ['Soya Chap Schezwan Rice', 140, 200], ['Triple Rice', null, 200],
  ] as [string, number | null, number][]).map(([n, h, f]) => ({ cat: 'Rice', name: n, variants: hf(h, f) })),
  ...([
    ['Hakka Noodles', 70, 120], ['Schezwan Noodles', 100, 160], ['Manchurian Noodles', 120, 180], ['Manchurian Schezwan Noodles', 140, 200],
    ['Paneer Noodles', 120, 180], ['Paneer Schezwan Noodles', 140, 200], ['Paneer Hong Kong Noodles', 160, 220],
    ['Paneer Singapore Noodles', 160, 220], ['Garlic Noodles', 100, 160], ['Soya Chap Fried Noodles', 120, 180],
    ['Soya Chap Schezwan Noodles', 140, 200], ['Triple Noodles', null, 200],
  ] as [string, number | null, number][]).map(([n, h, f]) => ({ cat: 'Noodles', name: n, variants: hf(h, f) })),
];

// Normalise spelling variants so old DB names match the card names.
const key = (s: string) => s.toLowerCase()
  .replace(/\((steam|fried|half|full)\)/g, '')
  .replace(/panner/g, 'paneer').replace(/haryali/g, 'hariyali').replace(/malay/g, 'malai').replace(/tandori/g, 'tandoori')
  .replace(/schezwam|shezwan|shejwan/g, 'schezwan').replace(/haka/g, 'hakka').replace(/noddle/g, 'noodle').replace(/noodles/g, 'noodle')
  .replace(/singapur/g, 'singapore').replace(/hongkong/g, 'hong kong').replace(/sizler/g, 'sizzler').replace(/\bspl\b/g, 'special')
  .replace(/^\s*veg momos/, 'mix veg momos').replace(/rice schezwan/, 'schezwan rice')
  .replace(/soybean/g, 'soyabean').replace(/[^a-z0-9]/g, '');

type Row = typeof streetFoodItems.$inferSelect;
const variantOf = (i: Row) => {
  const m = i.name.match(/\((steam|fried|half|full)\)/i);
  if (m) return m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  const d = (i.description ?? '').trim().toLowerCase();
  if (d === 'half' || d === 'hslf') return 'Half';
  if (d === 'full') return 'Full';
  return null;
};
const isSizeOnlyDesc = (d: string | null) => ['half', 'full', 'hslf'].includes((d ?? '').trim().toLowerCase());

async function plan(providerId: string, card: Card[], onlyCats?: string[]) {
  let rows = await db.select().from(streetFoodItems).where(eq(streetFoodItems.providerId, providerId));
  if (onlyCats) rows = rows.filter(r => onlyCats.includes(r.category ?? ''));
  const pool = [...rows];
  const updates: { id: string; from: string; name: string; price: string; category: string; description: string | null }[] = [];
  const inserts: { providerId: string; name: string; price: string; category: string; isVeg: boolean; isAvailable: boolean }[] = [];
  for (const c of card) for (const [v, price] of c.variants) {
    const name = v ? `${c.name} (${v})` : c.name;
    const newPrice = String(up(price));
    // A single-price card item may be stored with a stray "Full" tag.
    const idx = pool.findIndex(r => key(r.name) === key(c.name) &&
      (variantOf(r) === v || (v === null && c.variants.length === 1 && variantOf(r) === 'Full')));
    if (idx >= 0) {
      const r = pool.splice(idx, 1)[0];
      updates.push({ id: r.id, from: `${r.name.trim()} ₹${r.price}`, name, price: newPrice, category: c.cat,
        description: isSizeOnlyDesc(r.description) ? null : r.description });
    } else {
      inserts.push({ providerId, name, price: newPrice, category: c.cat, isVeg: true, isAvailable: true });
    }
  }
  return { rows, updates, inserts, deletes: pool };
}

const s = await plan(SURBHI, surbhiCard, ['Momos', 'Soya Chap & Paneer Tikka']);
const m = await plan(SAMARTH, samarthCard);
for (const [label, p] of [['SURBHI', s], ['SAMARTH', m]] as const) {
  console.log(`\n== ${label}: ${p.updates.length} update, ${p.inserts.length} new, ${p.deletes.length} remove`);
  p.updates.forEach(u => console.log(`  ~ ${u.from}  ->  [${u.category}] ${u.name} ₹${u.price}`));
  p.inserts.forEach(i => console.log(`  + [${i.category}] ${i.name} ₹${i.price}`));
  p.deletes.forEach(d => console.log(`  - ${d.name.trim()} ₹${d.price} (${d.description ?? ''})`));
}

if (APPLY) {
  fs.writeFileSync('scratch/menu_cards_backup.json', JSON.stringify({ surbhi: s.rows, samarth: m.rows }, null, 2));
  await db.transaction(async (tx) => {
    for (const p of [s, m]) {
      for (const u of p.updates) {
        await tx.update(streetFoodItems)
          .set({ name: u.name, price: u.price, category: u.category, description: u.description })
          .where(eq(streetFoodItems.id, u.id));
      }
      if (p.inserts.length) await tx.insert(streetFoodItems).values(p.inserts);
      if (p.deletes.length) await tx.delete(streetFoodItems).where(inArray(streetFoodItems.id, p.deletes.map(d => d.id)));
    }
  });
  console.log('\nAPPLIED (backup: scratch/menu_cards_backup.json)');
}
process.exit(0);
