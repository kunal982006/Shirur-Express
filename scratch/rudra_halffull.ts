import 'dotenv/config';
import { db } from '../server/db';
import { streetFoodItems } from '../shared/schema';
import { eq } from 'drizzle-orm';
const P = 'ja4ec18df2ig0zypl6t1bedy';
const items = await db.select().from(streetFoodItems).where(eq(streetFoodItems.providerId, P));
const groups = new Map<string, typeof items>();
for (const i of items) { const k = i.name.trim().toLowerCase(); groups.set(k, [...(groups.get(k) ?? []), i]); }
await db.transaction(async (tx) => {
  for (const g of groups.values()) {
    if (g.length !== 2) { if (g.length > 2) console.log('SKIP >2:', g[0].name); continue; }
    g.sort((a, b) => Number(a.price) - Number(b.price));
    const base = g[0].name.trim();
    for (const [it, label] of [[g[0], 'Half'], [g[1], 'Full']] as const) {
      await tx.update(streetFoodItems).set({ name: `${base} (${label})` }).where(eq(streetFoodItems.id, it.id));
      console.log(`${base} (${label}) | ${it.price}`);
    }
  }
});
process.exit(0);
