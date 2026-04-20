/**
 * One-time script to mark all active orders as "delivered"
 * Run with: npx tsx server/mark-all-delivered.ts
 */
import 'dotenv/config';
import { db } from "./db";
import { restaurantOrders, groceryOrders, streetFoodOrders } from "@shared/schema";
import { sql } from "drizzle-orm";

async function markAllDelivered() {
  console.log("🚀 Marking all active orders as delivered...\n");

  // Restaurant orders
  const rResult = await db
    .update(restaurantOrders)
    .set({ status: "delivered", deliveredAt: new Date(), deliveryOtp: null })
    .where(
      sql`${restaurantOrders.status} NOT IN ('delivered', 'cancelled', 'declined')`
    )
    .returning({ id: restaurantOrders.id });
  console.log(`✅ Restaurant orders marked delivered: ${rResult.length}`);

  // Grocery orders
  const gResult = await db
    .update(groceryOrders)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(
      sql`${groceryOrders.status} NOT IN ('delivered', 'cancelled', 'declined')`
    )
    .returning({ id: groceryOrders.id });
  console.log(`✅ Grocery orders marked delivered: ${gResult.length}`);

  // Street food orders
  const sfResult = await db
    .update(streetFoodOrders)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(
      sql`${streetFoodOrders.status} NOT IN ('delivered', 'cancelled', 'declined')`
    )
    .returning({ id: streetFoodOrders.id });
  console.log(`✅ Street food orders marked delivered: ${sfResult.length}`);

  console.log(`\n🎉 Done! Total orders marked delivered: ${rResult.length + gResult.length + sfResult.length}`);
  process.exit(0);
}

markAllDelivered().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
