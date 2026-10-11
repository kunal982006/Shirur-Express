import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

async function main() {
  const providerId = "yunc75wh20fnegyiqpod126g";

  console.log("Updating prices for Annapurna Biryani House...");

  // Update Chicken Biryani (Half) -> 132
  await db.update(restaurantMenuItems)
    .set({ price: "132.00" })
    .where(and(
      eq(restaurantMenuItems.providerId, providerId),
      eq(restaurantMenuItems.name, "Chicken Biryani"),
      eq(restaurantMenuItems.description, "Half")
    ));
    
  // Update Chicken Biryani (Full) -> 192
  await db.update(restaurantMenuItems)
    .set({ price: "192.00" })
    .where(and(
      eq(restaurantMenuItems.providerId, providerId),
      eq(restaurantMenuItems.name, "Chicken Biryani"),
      eq(restaurantMenuItems.description, "Full")
    ));
    
  // Update Veg Thali -> 96
  await db.update(restaurantMenuItems)
    .set({ price: "96.00" })
    .where(and(
      eq(restaurantMenuItems.providerId, providerId),
      eq(restaurantMenuItems.name, "Veg Thali")
    ));

  console.log("Prices for existing items updated.");

  // Check if Veg Dum Biryani exists
  const vegDumHalf = await db.query.restaurantMenuItems.findFirst({
    where: and(
      eq(restaurantMenuItems.providerId, providerId),
      eq(restaurantMenuItems.name, "Veg Dum Biryani"),
      eq(restaurantMenuItems.description, "Half")
    )
  });

  if (!vegDumHalf) {
    console.log("Inserting Veg Dum Biryani (Half)");
    await db.insert(restaurantMenuItems).values({
      id: createId(),
      providerId,
      name: "Veg Dum Biryani",
      description: "Half",
      category: "Main_Course",
      price: "132.00",
      isVeg: true,
      isAvailable: true,
      imageUrl: null // No specific image provided
    });
  } else {
    console.log("Updating Veg Dum Biryani (Half)");
    await db.update(restaurantMenuItems)
      .set({ price: "132.00" })
      .where(eq(restaurantMenuItems.id, vegDumHalf.id));
  }

  const vegDumFull = await db.query.restaurantMenuItems.findFirst({
    where: and(
      eq(restaurantMenuItems.providerId, providerId),
      eq(restaurantMenuItems.name, "Veg Dum Biryani"),
      eq(restaurantMenuItems.description, "Full")
    )
  });

  if (!vegDumFull) {
    console.log("Inserting Veg Dum Biryani (Full)");
    await db.insert(restaurantMenuItems).values({
      id: createId(),
      providerId,
      name: "Veg Dum Biryani",
      description: "Full",
      category: "Main_Course",
      price: "192.00",
      isVeg: true,
      isAvailable: true,
      imageUrl: null // No specific image provided
    });
  } else {
    console.log("Updating Veg Dum Biryani (Full)");
    await db.update(restaurantMenuItems)
      .set({ price: "192.00" })
      .where(eq(restaurantMenuItems.id, vegDumFull.id));
  }

  console.log("Veg Dum Biryani processed.");
  
  // Show updated menu
  const updatedItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });
  console.log(JSON.stringify(updatedItems, null, 2));

  process.exit(0);
}

main().catch(console.error);
