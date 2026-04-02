
import 'dotenv/config';
import { db } from "../server/db";
import { users, bookings, groceryOrders, streetFoodOrders, restaurantOrders } from "../shared/schema";
import { eq, notInArray, sql } from "drizzle-orm";

async function findOrphanedData() {
    console.log("Searching for orphaned records (data with no associated user)...");
    
    const allUsers = await db.select({ id: users.id }).from(users);
    const userIds = allUsers.map(u => u.id);
    
    if (userIds.length === 0) {
        console.log("No users found in database!");
        return;
    }

    // Find bookings with no user
    const orphanedBookings = await db.select().from(bookings).where(sql`${bookings.userId} NOT IN (${sql.join(userIds.map(id => sql`${id}`), sql`,`)})`);
    console.log(`Found ${orphanedBookings.length} orphaned bookings.`);
    orphanedBookings.forEach(b => console.log(`Booking ID: ${b.id}, Orphaned User ID: ${b.userId}, Phone: ${b.userPhone}`));

    // Find grocery orders
    const orphanedGrocery = await db.select().from(groceryOrders).where(sql`${groceryOrders.userId} NOT IN (${sql.join(userIds.map(id => sql`${id}`), sql`,`)})`);
    console.log(`Found ${orphanedGrocery.length} orphaned grocery orders.`);
    orphanedGrocery.forEach(o => console.log(`Grocery Order ID: ${o.id}, Orphaned User ID: ${o.userId}`));

    // Find street food orders
    const orphanedStreet = await db.select().from(streetFoodOrders).where(sql`${streetFoodOrders.userId} NOT IN (${sql.join(userIds.map(id => sql`${id}`), sql`,`)})`);
    console.log(`Found ${orphanedStreet.length} orphaned street food orders.`);
    orphanedStreet.forEach(o => console.log(`Street Food Order ID: ${o.id}, Orphaned User ID: ${o.userId}`));

    // Find restaurant orders
    const orphanedRest = await db.select().from(restaurantOrders).where(sql`${restaurantOrders.userId} NOT IN (${sql.join(userIds.map(id => sql`${id}`), sql`,`)})`);
    console.log(`Found ${orphanedRest.length} orphaned restaurant orders.`);
    orphanedRest.forEach(o => console.log(`Restaurant Order ID: ${o.id}, Orphaned User ID: ${o.userId}`));
}

findOrphanedData().catch(console.error).finally(() => process.exit());
