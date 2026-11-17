import 'dotenv/config';
import { db } from '../server/db';
import { serviceProviders, streetFoodItems, streetFoodOrders, reviews, providerOffers } from '../shared/schema';
import { ilike, eq, inArray } from 'drizzle-orm';
const vs = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, '%rudra%'));
for (const v of vs) {
  const { id, businessName, description, categoryId, userId, isVerified, profileImageUrl } = v as any;
  console.log(JSON.stringify({ id, businessName, description, categoryId, userId, isVerified, profileImageUrl }));
}
const ids = vs.map(v => v.id);
if (ids.length) {
  const items = await db.select().from(streetFoodItems).where(inArray(streetFoodItems.providerId, ids));
  for (const id of ids) console.log(id, 'items', items.filter(i => i.providerId === id).length, 'names:', items.filter(i=>i.providerId===id).map(i=>i.name).join(' | '));
  console.log('orders', (await db.select({id: streetFoodOrders.id, p: streetFoodOrders.providerId}).from(streetFoodOrders).where(inArray(streetFoodOrders.providerId, ids))).length);
  console.log('reviews', (await db.select({id: reviews.id}).from(reviews).where(inArray(reviews.providerId, ids))).length);
  console.log('offers', (await db.select({id: providerOffers.id}).from(providerOffers).where(inArray(providerOffers.providerId, ids))).length);
}
process.exit(0);
