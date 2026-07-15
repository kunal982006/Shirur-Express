import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const menuData = [
  // Fried Chicken - Cruncho Pop M/L
  { name: "Cruncho Pop Classic (M)", basePrice: 159, aliases: [] },
  { name: "Cruncho Pop Classic (L)", basePrice: 199, aliases: [] },
  { name: "Cruncho Pop Cheesy (M)", basePrice: 169, aliases: [] },
  { name: "Cruncho Pop Cheesy (L)", basePrice: 209, aliases: [] },
  { name: "Cruncho Pop Sriracha (M)", basePrice: 169, aliases: [] },
  { name: "Cruncho Pop Sriracha (L)", basePrice: 209, aliases: [] },
  { name: "Cruncho Pop CA Spcl (M)", basePrice: 189, aliases: [] },
  { name: "Cruncho Pop CA Spcl (L)", basePrice: 229, aliases: [] },
  // Crispy Wings R4PCSk
  { name: "Crispy Wings Classic (4 Pcs)", basePrice: 169, aliases: [] },
  { name: "Crispy Wings Cheesy (4 Pcs)", basePrice: 189, aliases: [] },
  { name: "Crispy Wings Sriracha (4 Pcs)", basePrice: 189, aliases: [] },
  { name: "Crispy Wings CA Spcl (4 Pcs)", basePrice: 199, aliases: [] },
  // Tender Strip
  { name: "Tender Strip Classic", basePrice: 169, aliases: [] },
  { name: "Tender Strip Cheesy", basePrice: 189, aliases: [] },
  { name: "Tender Strip Sriracha", basePrice: 189, aliases: [] },
  { name: "Tender Strip CA Spcl", basePrice: 199, aliases: [] },
  // Drumstick Classic
  { name: "Drumstick Classic (2 Pcs)", basePrice: 209, aliases: [] },
  { name: "Drumstick Classic (4 Pcs)", basePrice: 389, aliases: [] },
  { name: "Drumstick Classic (6 Pcs)", basePrice: 569, aliases: [] },
  // Veg Burgers
  { name: "Classic Veg Burger", basePrice: 69, aliases: ["Classic Veg"] },
  { name: "Veg Cheesy Burger", basePrice: 109, aliases: ["Veg Cheeesy"] },
  { name: "American Mustard Burger", basePrice: 149, aliases: ["American Mustard"] },
  { name: "Peri Peri Veg Burger", basePrice: 159, aliases: ["Peri Peri Veg"] },
  { name: "Butter Paneer Burger", basePrice: 179, aliases: ["Butter Paneer"] },
  { name: "Cruncho Paneer Burger", basePrice: 199, aliases: ["Cruncho Paneer"] },
  // Fried Non-Veg Burgers
  { name: "Classic Non-Veg Burger", basePrice: 89, aliases: ["Classic Non-Veg"] },
  { name: "Cruncho Pop Burger", basePrice: 149, aliases: ["Cruncho Pop"] },
  { name: "Peri Peri Chicken Burger", basePrice: 169, aliases: ["Peri Peri Non-Veg Burger", "Peri Peri Non-Veg", "Peri Peri"] },
  { name: "BBQ Chicken Burger", basePrice: 169, aliases: ["BBQ Burger", "BBQ"] },
  { name: "Sriracha Chicken Burger", basePrice: 179, aliases: ["Sriracha Burger", "Sriracha"] },
  { name: "Zinger Special Burger", basePrice: 209, aliases: ["Zinger Special"] },
  { name: "CA Special Burger", basePrice: 239, aliases: ["CA Special"] },
  // Grilled Non-Veg Burgers
  { name: "Chicken Grilled Burger", basePrice: 119, aliases: ["Chicken Grilled"] },
  { name: "BBQ Grilled Burger", basePrice: 179, aliases: [] },
  { name: "Peri Peri Grilled Burger", basePrice: 179, aliases: [] },
  { name: "Chettinad Grilled Burger", basePrice: 189, aliases: ["Chettinad"] },
  { name: "CA Spcl Grilled Burger", basePrice: 229, aliases: ["CA SPCL Grilled"] },
  // Fries
  { name: "Classic Fries (Reg)", basePrice: 99, aliases: [] },
  { name: "Classic Fries (Large)", basePrice: 159, aliases: [] },
  { name: "Zesty Fries (Reg)", basePrice: 99, aliases: [] },
  { name: "Zesty Fries (Large)", basePrice: 169, aliases: [] },
  { name: "Peri Peri Fries (Reg)", basePrice: 99, aliases: [] },
  { name: "Peri Peri Fries (Large)", basePrice: 169, aliases: [] },
  { name: "Tandoori Fries (Reg)", basePrice: 99, aliases: [] },
  { name: "Tandoori Fries (Large)", basePrice: 169, aliases: [] },
  { name: "Sriracha Fries (Reg)", basePrice: 109, aliases: [] },
  { name: "Sriracha Fries (Large)", basePrice: 179, aliases: [] },
  { name: "CA Spcl Fries (Reg)", basePrice: 109, aliases: [] },
  { name: "CA Spcl Fries (Large)", basePrice: 179, aliases: [] },
  // Fries & Fly
  { name: "Fries N Fly Classic", basePrice: 209, aliases: [] },
  { name: "Fries N Fly Zesty", basePrice: 239, aliases: [] },
  { name: "Fries N Fly Tandoori", basePrice: 239, aliases: [] },
  { name: "Fries N Fly Sriracha", basePrice: 239, aliases: [] },
  { name: "Fries N Fly CA Spcl", basePrice: 259, aliases: [] },
];

async function main() {
  const providerId = "v9yhvrln70w0cjcv2b4wh23b";

  console.log("Updating Chicken Affair Menu...");

  const existingItems = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  for (const item of menuData) {
    const newPrice = (item.basePrice * 1.10).toFixed(2);
    
    // Find matching item
    const match = existingItems.find(ex => 
      ex.name.toLowerCase() === item.name.toLowerCase() || 
      item.aliases.some(alias => alias.toLowerCase() === ex.name.toLowerCase())
    );

    if (match) {
      await db.update(restaurantMenuItems)
        .set({ price: newPrice, name: item.name }) // standardize name
        .where(eq(restaurantMenuItems.id, match.id));
      console.log(`Updated [${item.name}]: ${match.price} -> ${newPrice}`);
    } else {
      await db.insert(restaurantMenuItems).values({
        id: createId(),
        providerId: providerId,
        name: item.name,
        price: newPrice,
        isVeg: item.name.includes("Veg Burger") || item.name.includes("Paneer") || item.name.includes("Fries"),
        isAvailable: true,
      });
      console.log(`Inserted [${item.name}]: ${newPrice}`);
    }
  }

  // Increase any remaining existing items by 10%
  console.log("Applying 10% increase to remaining items not explicitly matched...");
  for (const ex of existingItems) {
    const isMatched = menuData.find(item => 
      ex.name.toLowerCase() === item.name.toLowerCase() || 
      item.aliases.some(alias => alias.toLowerCase() === ex.name.toLowerCase())
    );
    if (!isMatched) {
      const oldPrice = parseFloat(ex.price as string);
      if (!isNaN(oldPrice)) {
        const newPrice = (oldPrice * 1.10).toFixed(2);
        await db.update(restaurantMenuItems)
          .set({ price: newPrice })
          .where(eq(restaurantMenuItems.id, ex.id));
        console.log(`Auto-increased [${ex.name}]: ${oldPrice} -> ${newPrice}`);
      }
    }
  }

  console.log("Update completed.");
  process.exit(0);
}

main().catch(console.error);
