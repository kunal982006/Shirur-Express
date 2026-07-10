import { db } from "../server/db";
import { users, serviceProviders, bookings, invoices, reviews } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Fetching users...");
  const electricianUser = await db.query.users.findFirst({
    where: eq(users.username, "electrician1")
  });
  const plumberUser = await db.query.users.findFirst({
    where: eq(users.username, "plumber2")
  });

  if (!electricianUser) {
    console.error("User 'electrician1' not found.");
    process.exit(1);
  }
  
  if (!plumberUser) {
    console.warn("User 'plumber2' not found. It might have been deleted already or never existed.");
    // Wait, if it doesn't exist, we might need to search by businessName
  }

  const electricianProvider = await db.query.serviceProviders.findFirst({
    where: eq(serviceProviders.userId, electricianUser.id)
  });

  if (!electricianProvider) {
    console.error("Electrician provider profile not found for user.");
    process.exit(1);
  }

  let plumberProvider = null;
  if (plumberUser) {
    plumberProvider = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, plumberUser.id)
    });
  }

  if (!plumberProvider) {
    console.warn("Looking for plumber provider by businessName 'plumber2'...");
    plumberProvider = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.businessName, "plumber2")
    });
  }

  if (!plumberProvider) {
    console.error("Plumber provider not found at all.");
    // Wait, what if there's a different provider name? Let's just update all bookings where serviceType = 'plumber' to the electricianProvider!
    console.log("Will attempt to migrate all plumber serviceType bookings directly.");
  }

  const targetProviderId = electricianProvider.id;
  const sourceProviderId = plumberProvider?.id;

  if (sourceProviderId) {
    console.log(`Migrating data from Plumber Provider ID (${sourceProviderId}) to Electrician Provider ID (${targetProviderId})`);
    
    // Update Bookings
    const updatedBookings = await db.update(bookings)
      .set({ providerId: targetProviderId })
      .where(eq(bookings.providerId, sourceProviderId))
      .returning({ id: bookings.id });
    console.log(`Updated ${updatedBookings.length} bookings.`);

    // Update Invoices
    const updatedInvoices = await db.update(invoices)
      .set({ providerId: targetProviderId })
      .where(eq(invoices.providerId, sourceProviderId))
      .returning({ id: invoices.id });
    console.log(`Updated ${updatedInvoices.length} invoices.`);

    // Update Reviews
    const updatedReviews = await db.update(reviews)
      .set({ providerId: targetProviderId })
      .where(eq(reviews.providerId, sourceProviderId))
      .returning({ id: reviews.id });
    console.log(`Updated ${updatedReviews.length} reviews.`);

    console.log("Migration complete!");
  } else {
    // If plumber provider is gone, just blindly update any bookings with serviceType plumber?
    // Let's do it safely just in case.
    const bookingsToUpdate = await db.query.bookings.findMany({
      where: eq(bookings.serviceType, "plumber")
    });

    if (bookingsToUpdate.length > 0) {
      for (const booking of bookingsToUpdate) {
        if (booking.providerId !== targetProviderId) {
           await db.update(bookings).set({ providerId: targetProviderId }).where(eq(bookings.id, booking.id));
        }
      }
      console.log(`Updated ${bookingsToUpdate.length} orphan plumber bookings to electrician provider.`);
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
