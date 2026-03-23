// Script to delete all orders and bookings from the database
import { db } from "../server/db.ts";
import { groceryOrders, streetFoodOrders, restaurantOrders, bookings, invoices } from "../shared/schema.ts";

async function clearAll() {
  console.log("🗑️  Starting cleanup...");

  const [inv] = await db.delete(invoices).returning({ id: invoices.id });
  console.log(`✅ Deleted ${Array.isArray(inv) ? inv.length : (inv ? 1 : 0)} invoices`);

  const gResult = await db.delete(groceryOrders).returning({ id: groceryOrders.id });
  console.log(`✅ Deleted ${gResult.length} grocery orders`);

  const sfResult = await db.delete(streetFoodOrders).returning({ id: streetFoodOrders.id });
  console.log(`✅ Deleted ${sfResult.length} street food orders`);

  const rResult = await db.delete(restaurantOrders).returning({ id: restaurantOrders.id });
  console.log(`✅ Deleted ${rResult.length} restaurant orders`);

  const bResult = await db.delete(bookings).returning({ id: bookings.id });
  console.log(`✅ Deleted ${bResult.length} bookings`);

  console.log("\n🎉 Done! All orders and bookings have been cleared.");
  process.exit(0);
}

clearAll().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
