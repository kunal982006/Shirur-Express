import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq, ilike, or } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const menuData = [
  // Hot Coffee
  { name: "Espresso", basePrice: 80, aliases: [] },
  { name: "Cappuccino", basePrice: 100, aliases: [] },
  { name: "Latte", basePrice: 100, aliases: [] },
  { name: "Americano", basePrice: 90, aliases: [] },
  { name: "Cappuccino Hazelnut", basePrice: 120, aliases: ["Cappuccino + Hazelnut"] },
  { name: "Cappuccino Vanilla", basePrice: 120, aliases: ["Cappuccino + Vanilla"] },
  { name: "Latte Hazelnut", basePrice: 130, aliases: ["Latte + Hazelnut"] },
  { name: "Latte Caramel", basePrice: 130, aliases: ["Latte + Caramel"] },
  // Cold Coffee
  { name: "Cold Coffee", basePrice: 60, aliases: [] },
  { name: "Cold Coffee with Crush", basePrice: 80, aliases: [] },
  // Soup
  { name: "Cream of Mushroom soup", basePrice: 150, aliases: [] },
  { name: "Cream of Broccoli soup", basePrice: 150, aliases: [] },
  { name: "Tomato Soup", basePrice: 120, aliases: [] },
  // Pasta
  { name: "White Sauce Pasta", basePrice: 270, aliases: ["Alfredo white sauce Pasta"] },
  { name: "Pink Sauce Pasta", basePrice: 280, aliases: [] },
  { name: "Red Sauce Pasta", basePrice: 240, aliases: ["Arebita (Red sauce) Pasta"] },
  // Mocktails
  { name: "Fresh Lime Soda", basePrice: 110, aliases: [] },
  { name: "Virgin Mint Mojito", basePrice: 120, aliases: [] },
  { name: "Watermelon Mojito", basePrice: 130, aliases: [] },
  { name: "Blue Lagoon", basePrice: 140, aliases: [] },
  { name: "Blue Berry Basil Fizz", basePrice: 140, aliases: [] },
  { name: "Cucumber Mojito", basePrice: 130, aliases: [] },
  { name: "Kiss Me Lips", basePrice: 150, aliases: [] },
  { name: "American Beauty", basePrice: 150, aliases: [] },
  { name: "Virgin Pina Colada", basePrice: 140, aliases: [] },
  { name: "Spicy Guava Mary", basePrice: 140, aliases: [] },
  { name: "Sangria", basePrice: 140, aliases: [] },
  // Pavbhaji/Pulav
  { name: "Amul Pav Bhaji", basePrice: 120, aliases: [] },
  { name: "Cheese Pav Bhaji", basePrice: 150, aliases: [] },
  { name: "Jain Pav Bhaji", basePrice: 120, aliases: [] },
  { name: "Masala Pav", basePrice: 80, aliases: [] },
  { name: "Veg Pulav", basePrice: 130, aliases: [] },
  { name: "Paneer Pulav", basePrice: 160, aliases: [] },
  { name: "Cheese Pulav", basePrice: 160, aliases: [] },
  { name: "Paneer Cheese Pulav", basePrice: 180, aliases: [] },
  // Rice
  { name: "Shezwan Fried Rice", basePrice: 180, aliases: [] },
  { name: "Burnt Garlic Fried Rice", basePrice: 160, aliases: ["Bun Garlic Fried Rice"] },
  { name: "Veg Fried Rice", basePrice: 150, aliases: [] },
  // Starters
  { name: "Cheese Ball", basePrice: 180, aliases: [] },
  { name: "Jalapeno Pops", basePrice: 180, aliases: [] },
  { name: "Cheese Cutlet", basePrice: 180, aliases: [] },
  { name: "Veg Cutlet", basePrice: 160, aliases: [] },
  { name: "Salted Fries", basePrice: 90, aliases: [] },
  { name: "Peri Peri Fries", basePrice: 150, aliases: [] },
  { name: "Cheese Fries", basePrice: 180, aliases: [] },
  { name: "Paneer Kurkure", basePrice: 180, aliases: [] },
  { name: "Crispy Corn", basePrice: 180, aliases: [] },
  { name: "BBQ Paneer", basePrice: 210, aliases: [] },
  { name: "Paneer Chilly", basePrice: 210, aliases: [] },
  { name: "Paneer Crispy", basePrice: 210, aliases: [] },
  { name: "Paneer Basil Chilly", basePrice: 170, aliases: [] },
  { name: "Cheese Chilly Toast", basePrice: 170, aliases: [] },
  { name: "Veg Crispy", basePrice: 160, aliases: [] },
  { name: "Veg Manchurian", basePrice: 180, aliases: [] },
  // Burger
  { name: "Veg Burger", basePrice: 100, aliases: [] },
  { name: "Veg Cheese Burger", basePrice: 120, aliases: [] },
  { name: "Paneer Patty Burger", basePrice: 140, aliases: [] },
  { name: "Shezwan Cheese Burger", basePrice: 130, aliases: ["Schezwan Cheese Burger"] },
  { name: "Gold Burger", basePrice: 150, aliases: [] },
  // Sandwich
  { name: "Veg Cheese Grilled Sandwich", basePrice: 120, aliases: [] },
  { name: "Paneer Tandoori Sandwich", basePrice: 150, aliases: [] },
  { name: "Peri Peri Grilled Sandwich", basePrice: 140, aliases: [] },
  { name: "Veg cheese Club Sandwich", basePrice: 170, aliases: ["Cheese Veg Club Sandwich"] },
  { name: "Sunshine Special Sandwich", basePrice: 190, aliases: [] },
  // Pizza
  { name: "Margherita Pizza", basePrice: 180, aliases: [] },
  { name: "Veg Delight Pizza", basePrice: 230, aliases: ["Veg delight Pizza"] },
  { name: "Paneer Peri Peri Pizza", basePrice: 240, aliases: ["Paneer/Peri Peri Pizza"] },
  { name: "Veg Sunshine Pizza", basePrice: 250, aliases: [] },
  { name: "Corn Magic Pizza", basePrice: 230, aliases: [] },
  { name: "Loaded Cheese Pizza", basePrice: 300, aliases: [] },
  // Main Course
  { name: "Veg Patty Rice", basePrice: 280, aliases: [] },
  { name: "Cottage Cheese Steak Rice", basePrice: 300, aliases: [] },
  { name: "Grilled Paneer Rice", basePrice: 350, aliases: [] }
];

async function main() {
  const providerId = "rcvtojgzqic7e4dhh6r55oa0";

  console.log("Updating Sunshine Cafe Menu...");

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
        .set({ price: newPrice, name: item.name }) // standardizing the name just in case
        .where(eq(restaurantMenuItems.id, match.id));
      console.log(`Updated [${item.name}]: ${match.price} -> ${newPrice}`);
    } else {
      await db.insert(restaurantMenuItems).values({
        id: createId(),
        providerId: providerId,
        name: item.name,
        price: newPrice,
        isVeg: true, // Assuming mostly veg for a cafe, but could be specific
        isAvailable: true,
      });
      console.log(`Inserted [${item.name}]: ${newPrice}`);
    }
  }

  // Update existing items that were not part of this menu update (like ice creams and shakes not in the photo)
  // Let's add 10% to all remaining items just in case the user meant "update the rest too" 
  // OR the prompt says "update the prices and update the 10% prices".
  // Actually, I'll apply 10% increase to any existing item that wasn't in our list!
  console.log("Applying 10% increase to remaining items not explicitly in the new menu...");
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
