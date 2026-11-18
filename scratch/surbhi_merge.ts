import 'dotenv/config';
import { db } from '../server/db';
import { serviceProviders, streetFoodItems, streetFoodOrders } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs';
const MAIN = 'pcbo6y9piqx717fj4vugvd4p'; // Snack Hub
const CHAP = 'x92myl7c297kx0qqctzkwdil', MOMOS = 'x9508ti560oxjsep7kolerwh', DOSA = 'fikqps18h3tcqisbouo8mud1';
const others = [CHAP, MOMOS, DOSA], ids = [MAIN, ...others];
const backup = {
  providers: await db.select().from(serviceProviders).where(inArray(serviceProviders.id, ids)),
  items: await db.select().from(streetFoodItems).where(inArray(streetFoodItems.providerId, ids)),
  orders: await db.select({ id: streetFoodOrders.id, providerId: streetFoodOrders.providerId }).from(streetFoodOrders).where(inArray(streetFoodOrders.providerId, ids)),
};
fs.writeFileSync('scratch/surbhi_merge_backup.json', JSON.stringify(backup, null, 2));
console.log('backup:', backup.providers.length, 'stalls,', backup.items.length, 'items,', backup.orders.length, 'orders');
const sectionFor = (i: typeof backup.items[number]) => {
  if (i.providerId === CHAP) return 'Soya Chap & Paneer Tikka';
  if (i.providerId === MOMOS) return 'Momos';
  if (i.providerId === DOSA) return 'Paper Dosa';
  const n = i.name.toLowerCase();
  if (n.includes('pizza')) return 'Pizza';
  if (n.includes('sandwich')) return 'Sandwiches';
  return 'Burgers & Fries';
};
await db.transaction(async (tx) => {
  await tx.update(serviceProviders).set({
    businessName: 'Surbhi- momos, loaded chaps, pav bhajis, pizza, burgers, sandwiches, paper dosa & pulao',
    description: 'Crispy paper dosas, buttery pav bhaji, sizzling chaps, loaded momos & cheesy pizza-burgers—all your street-food cravings sorted in one place!',
  }).where(eq(serviceProviders.id, MAIN));
  for (const i of backup.items) {
    await tx.update(streetFoodItems).set({ providerId: MAIN, category: sectionFor(i), name: i.name.trim() }).where(eq(streetFoodItems.id, i.id));
  }
  await tx.update(streetFoodOrders).set({ providerId: MAIN }).where(inArray(streetFoodOrders.providerId, others));
  await tx.delete(serviceProviders).where(inArray(serviceProviders.id, others));
});
const res = await db.select({ c: streetFoodItems.category }).from(streetFoodItems).where(eq(streetFoodItems.providerId, MAIN));
const counts: Record<string, number> = {}; res.forEach(r => counts[r.c!] = (counts[r.c!] ?? 0) + 1);
console.log('merged items by section:', counts);
console.log('orders now on main:', (await db.select({ id: streetFoodOrders.id }).from(streetFoodOrders).where(eq(streetFoodOrders.providerId, MAIN))).length);
console.log('leftover stalls:', (await db.select({ id: serviceProviders.id }).from(serviceProviders).where(inArray(serviceProviders.id, others))).length);
process.exit(0);
