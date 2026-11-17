import 'dotenv/config';
import { db } from '../server/db';
import { serviceProviders, streetFoodItems, streetFoodOrders } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs';
const MAIN = 'ja4ec18df2ig0zypl6t1bedy', ROLLS = 'ry4jm74iwie7tocuv1pjaspq', PAV = 'vz5t8xosrh3qfi0pp9t74vgb';
const ids = [MAIN, ROLLS, PAV];
const backup = {
  providers: await db.select().from(serviceProviders).where(inArray(serviceProviders.id, ids)),
  items: await db.select().from(streetFoodItems).where(inArray(streetFoodItems.providerId, ids)),
  orders: await db.select({ id: streetFoodOrders.id, providerId: streetFoodOrders.providerId }).from(streetFoodOrders).where(inArray(streetFoodOrders.providerId, ids)),
};
fs.writeFileSync('scratch/rudra_merge_backup.json', JSON.stringify(backup, null, 2));
console.log('backup written');
await db.transaction(async (tx) => {
  await tx.update(serviceProviders).set({
    businessName: 'RUDRA PURE VEG CHINESE CENTER',
    description: 'From fiery Manchurian and noodles to loaded potato spring rolls—taste the best veg street-style Chinese right here!',
  }).where(eq(serviceProviders.id, MAIN));
  await tx.update(streetFoodItems).set({ category: 'Chinese' }).where(eq(streetFoodItems.providerId, MAIN));
  await tx.update(streetFoodItems).set({ category: 'Potato Spring Rolls', providerId: MAIN }).where(eq(streetFoodItems.providerId, ROLLS));
  await tx.update(streetFoodItems).set({ category: 'Pav Bhaji & Pulav', providerId: MAIN }).where(eq(streetFoodItems.providerId, PAV));
  await tx.update(streetFoodOrders).set({ providerId: MAIN }).where(inArray(streetFoodOrders.providerId, [ROLLS, PAV]));
  await tx.delete(serviceProviders).where(inArray(serviceProviders.id, [ROLLS, PAV]));
});
console.log('merged');
process.exit(0);
