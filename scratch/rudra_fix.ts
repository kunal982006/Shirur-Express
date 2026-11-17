import 'dotenv/config';
import { db } from '../server/db';
import { streetFoodItems } from '../shared/schema';
import { and, eq } from 'drizzle-orm';
const P = 'ja4ec18df2ig0zypl6t1bedy';
const renames: [string, string][] = [
  ['Shejwan  rice', 'Shejwan rice'],
  ['Perry Perry Cheese', 'Peri Peri Cheese'],
  ['Perry Perry Mayo', 'Peri Peri Mayo'],
  ['Tandoori Sause', 'Tandoori Sauce'],
  ['Soyabin Chilly', 'Soyabean Chilli'],
  ['Special potato springrole', 'Special potato spring roll'],
  ['Manchaw soup', 'Manchow soup'],
];
await db.transaction(async (tx) => {
  const r = await tx.update(streetFoodItems).set({ price: '179' })
    .where(and(eq(streetFoodItems.providerId, P), eq(streetFoodItems.name, 'Rudra special pav bhaji'), eq(streetFoodItems.price, '1179'))).returning({ id: streetFoodItems.id });
  console.log('price fixed:', r.length);
  for (const [from, to] of renames) {
    const u = await tx.update(streetFoodItems).set({ name: to })
      .where(and(eq(streetFoodItems.providerId, P), eq(streetFoodItems.name, from))).returning({ id: streetFoodItems.id });
    console.log(`${from} -> ${to}: ${u.length}`);
  }
});
const all = await db.select({ n: streetFoodItems.name, p: streetFoodItems.price, c: streetFoodItems.category }).from(streetFoodItems).where(eq(streetFoodItems.providerId, P));
all.sort((a, b) => (a.c! + a.n).localeCompare(b.c! + b.n)).forEach(i => console.log(i.c, '|', i.n, '|', i.p));
process.exit(0);
