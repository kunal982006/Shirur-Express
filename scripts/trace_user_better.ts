
import 'dotenv/config';
import { db } from "../server/db";
import { users, bookings, groceryOrders, streetFoodOrders, restaurantOrders, invoices, reviews } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function traceUser(userId: string) {
    console.log(`--- [TRACE USER: ${userId}] ---`);
    
    // Check Bookings
    const b = await db.select().from(bookings).where(eq(bookings.userId, userId));
    console.log(`Found ${b.length} bookings.`);
    b.forEach(x => console.log(`  - Booking ID: ${x.id}, Phone: ${x.userPhone}, Address: ${x.userAddress}`));

    // Check Grocery
    const g = await db.select().from(groceryOrders).where(eq(groceryOrders.userId, userId));
    console.log(`Found ${g.length} grocery orders.`);
    g.forEach(x => console.log(`  - Grocery Order ID: ${x.id}, Status: ${x.status}, Address: ${x.deliveryAddress}`));

    // Check Invoices
    const inv = await db.select().from(invoices).where(eq(invoices.userId, userId));
    console.log(`Found ${inv.length} invoices.`);
    
    // Check Reviews
    const rev = await db.select().from(reviews).where(eq(reviews.userId, userId));
    console.log(`Found ${rev.length} reviews.`);

    console.log("--- [END TRACE] ---");
}

const targetId = process.argv[2];
if (!targetId) {
    console.log("Please provide a user ID");
} else {
    traceUser(targetId).catch(console.error).finally(() => process.exit());
}
