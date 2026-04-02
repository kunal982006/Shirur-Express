
import 'dotenv/config';
import { db } from "../server/db";
import { users, bookings, groceryOrders, streetFoodOrders, restaurantOrders, invoices, reviews } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function findUserDetails(userId: string) {
    console.log(`Searching for details for User ID: ${userId}...`);
    
    const b = await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(sql`${bookings.createdAt} DESC`).limit(1);
    if (b.length > 0) {
        console.log(`Found Booking: Phone ${b[0].userPhone}, Address ${b[0].userAddress}`);
    }

    const g = await db.select().from(groceryOrders).where(eq(groceryOrders.userId, userId)).orderBy(sql`${groceryOrders.createdAt} DESC`).limit(1);
    if (g.length > 0) {
        console.log(`Found Grocery Order: Address ${g[0].deliveryAddress}`);
    }

    const inv = await db.select().from(invoices).where(eq(invoices.userId, userId)).limit(1);
    if (inv.length > 0) {
        console.log(`Found Invoice: ID ${inv[0].id}`);
    }

    const rev = await db.select().from(reviews).where(eq(reviews.userId, userId)).limit(1);
    if (rev.length > 0) {
        console.log(`Found Review: Rating ${rev[0].rating}, Comment ${rev[0].comment}`);
    }
}

const targetId = process.argv[2] || 'uzddozxi2etclnv0px';
findUserDetails(targetId).catch(console.error).finally(() => process.exit());
