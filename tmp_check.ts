import { db } from "./server/db";
import { bookings, serviceProviders } from "./shared/schema";
import { desc, eq } from "drizzle-orm";

async function run() {
  const recentBookings = await db.query.bookings.findMany({
    orderBy: [desc(bookings.createdAt)],
    limit: 10,
  });
  console.log("Recent Bookings:", JSON.stringify(recentBookings, null, 2));

  const plumberProviders = await db.query.serviceProviders.findMany({
    with: { category: true },
  });
  const plumbers = plumberProviders.filter(p => p.category?.slug === "plumber");
  console.log("Plumbers in DB:", JSON.stringify(plumbers, null, 2));

  process.exit();
}

run().catch(console.error);
