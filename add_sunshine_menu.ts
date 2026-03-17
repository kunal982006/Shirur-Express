import { db } from "./server/db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const SUNSHINE_CAFE_ID = "rcvtojgzqic7e4dhh6r55oa0";

const menuItems = [
  // COLD COFFEE
  { name: "Cold Coffee", price: "50", category: "Cold Coffee", isVeg: true },
  { name: "Cold Coffee with Crush", price: "60", category: "Cold Coffee", isVeg: true },
  { name: "Special with Chocolate", price: "90", category: "Cold Coffee", isVeg: true },

  // HOT COFFEE
  { name: "Espresso", price: "60", category: "Hot Coffee", isVeg: true },
  { name: "Cappuccino", price: "80", category: "Hot Coffee", isVeg: true },
  { name: "Latte", price: "80", category: "Hot Coffee", isVeg: true },
  { name: "Americano", price: "70", category: "Hot Coffee", isVeg: true },
  { name: "Cold Frappe", price: "80", category: "Hot Coffee", isVeg: true },
  { name: "Cappuccino + Hazelnut", price: "100", category: "Hot Coffee", isVeg: true },
  { name: "Cappuccino + Vanilla", price: "100", category: "Hot Coffee", isVeg: true },
  { name: "Cappuccino + Caramel", price: "100", category: "Hot Coffee", isVeg: true },
  { name: "Latte + Hazelnut", price: "100", category: "Hot Coffee", isVeg: true },
  { name: "Latte + Vanilla", price: "100", category: "Hot Coffee", isVeg: true },
  { name: "Latte + Caramel", price: "100", category: "Hot Coffee", isVeg: true },

  // MASTANI
  { name: "Dryfruit Mastani", price: "120", category: "Mastani", isVeg: true },
  { name: "Pineapple Mastani", price: "100", category: "Mastani", isVeg: true },
  { name: "Gulkand Mastani", price: "110", category: "Mastani", isVeg: true },
  { name: "Pista Mastani", price: "110", category: "Mastani", isVeg: true },
  { name: "Butter Scotch Mastani", price: "120", category: "Mastani", isVeg: true },
  { name: "Chocolate Mastani", price: "110", category: "Mastani", isVeg: true },
  { name: "Mango Mastani", price: "100", category: "Mastani", isVeg: true },

  // MILKSHAKE
  { name: "Pineapple Milkshake", price: "75", category: "Milkshake", isVeg: true },
  { name: "Gulkand Milkshake", price: "75", category: "Milkshake", isVeg: true },
  { name: "Pista Milkshake", price: "75", category: "Milkshake", isVeg: true },
  { name: "Butter Scotch Milkshake", price: "75", category: "Milkshake", isVeg: true },
  { name: "Chocolate Milkshake", price: "85", category: "Milkshake", isVeg: true },
  { name: "Mango Milkshake", price: "75", category: "Milkshake", isVeg: true },

  // SOFTY
  { name: "Vanilla Softy", price: "30", category: "Softy", isVeg: true },
  { name: "Chocolate Softy", price: "30", category: "Softy", isVeg: true },
  { name: "Mix (2 in 1) Softy", price: "40", category: "Softy", isVeg: true },

  // SANDWICH
  { name: "Veg Cheese Grilled Sandwich", price: "80", category: "Sandwich", isVeg: true },
  { name: "Paneer Tandoori Sandwich", price: "90", category: "Sandwich", isVeg: true },
  { name: "Peri Peri Grilled Sandwich", price: "80", category: "Sandwich", isVeg: true },
  { name: "Cheese Veg Club Sandwich", price: "100", category: "Sandwich", isVeg: true },
  { name: "Cheese Chilli Garlic Grilled Sandwich", price: "80", category: "Sandwich", isVeg: true },
  { name: "Choco / Burst Sandwich", price: "130", category: "Sandwich", isVeg: true },
  { name: "Veg Grilled Sandwich", price: "70", category: "Sandwich", isVeg: true },

  // PIZZA [7"]
  { name: "Veg delight Pizza", price: "180", category: "Pizza", isVeg: true },
  { name: "Margherita Pizza", price: "130", category: "Pizza", isVeg: true },
  { name: "Paneer Peri Peri Pizza", price: "210", category: "Pizza", isVeg: true },
  { name: "Veg Sunshine Pizza", price: "200", category: "Pizza", isVeg: true },
  { name: "Corn Magic Pizza", price: "170", category: "Pizza", isVeg: true },

  // JUICES
  { name: "Mosambi Juice", price: "70", category: "Juices", isVeg: true },
  { name: "Orange Juice", price: "70", category: "Juices", isVeg: true },
  { name: "Pineapple Juice", price: "60", category: "Juices", isVeg: true },
  { name: "Watermelon Juice", price: "60", category: "Juices", isVeg: true },

  // BURGER
  { name: "Veg Burger", price: "70", category: "Burger", isVeg: true },
  { name: "Veg Cheese Burger", price: "90", category: "Burger", isVeg: true },
  { name: "Paneer Patty Burger", price: "99", category: "Burger", isVeg: true },
  { name: "Schezwan Cheese Burger", price: "99", category: "Burger", isVeg: true },

  // HEALTHY JUICES
  { name: "Carrot Juice", price: "50", category: "Healthy Juices", isVeg: true },
  { name: "Beetroot Juice", price: "50", category: "Healthy Juices", isVeg: true },
  { name: "Bottle Gourd Juice", price: "50", category: "Healthy Juices", isVeg: true },

  // FRIES
  { name: "Salted Fries", price: "60", category: "Fries", isVeg: true },
  { name: "Peri Peri Fries", price: "70", category: "Fries", isVeg: true },
  { name: "Veg Nuggets", price: "60", category: "Fries", isVeg: true },

  // ICE CREAM
  { name: "Vanilla Ice Cream", price: "40", category: "Ice Cream", isVeg: true },
  { name: "Pista Ice Cream", price: "40", category: "Ice Cream", isVeg: true },
  { name: "Strawberry Ice Cream", price: "40", category: "Ice Cream", isVeg: true },
  { name: "Cotton Candy Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Butter Scotch Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Cappuccino Brownie Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Mango Gold Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Almond Nuts Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Red Velvet Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Pineapple Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Gulkand Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Roasted Nuts Ice Cream", price: "50", category: "Ice Cream", isVeg: true },
  { name: "Sugar Free Anjeer Ice Cream", price: "60", category: "Ice Cream", isVeg: true },

  // FALOODA
  { name: "Sunshine Falooda", price: "90", category: "Falooda", isVeg: true },
  { name: "Keshar Pista Falooda", price: "80", category: "Falooda", isVeg: true },
  { name: "Sizzling Brownie", price: "120", category: "Falooda", isVeg: true },

  // PASTA
  { name: "Alfredo white sauce Pasta", price: "210", category: "Pasta", isVeg: true },
  { name: "Pink Sauce Pasta", price: "220", category: "Pasta", isVeg: true },
  { name: "Arebita (Red sauce) Pasta", price: "180", category: "Pasta", isVeg: true },
  { name: "Three Sauce Pasta", price: "230", category: "Pasta", isVeg: true },

  // POPCORN
  { name: "Cheese Popcorn", price: "60", category: "Popcorn", isVeg: true },
  { name: "Salted Popcorn", price: "50", category: "Popcorn", isVeg: true },
  { name: "Masala Popcorn", price: "60", category: "Popcorn", isVeg: true },

  // PAV BHAJI
  { name: "Cheese Pav Bhaji", price: "100", category: "Pav Bhaji", isVeg: true },
  { name: "Amul Pav Bhaji", price: "80", category: "Pav Bhaji", isVeg: true },
  { name: "Jain Pav Bhaji", price: "90", category: "Pav Bhaji", isVeg: true },
  { name: "Plain Pav Bhaji", price: "70", category: "Pav Bhaji", isVeg: true },

  // PULAV
  { name: "Veg Pulav", price: "90", category: "Pulav", isVeg: true },
  { name: "Paneer Pulav", price: "120", category: "Pulav", isVeg: true },
  { name: "Masala Pav", price: "40", category: "Pulav", isVeg: true },
];

async function seedSunshineCafeMenu() {
  console.log("Starting to seed Sunshine Cafe menu...");
  let count = 0;

  try {
    // Delete existing items for safety
    await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, SUNSHINE_CAFE_ID));

    // Insert new items
    for (const item of menuItems) {
      await db.insert(restaurantMenuItems).values({
        id: uuidv4(),
        providerId: SUNSHINE_CAFE_ID,
        name: item.name,
        price: item.price,
        category: item.category,
        isVeg: item.isVeg,
        isAvailable: true,
      });
      count++;
    }

    console.log(`Successfully seeded ${count} menu items for Sunshine Cafe`);
  } catch (error) {
    console.error("Error seeding menu:", error);
  } finally {
    process.exit(0);
  }
}

seedSunshineCafeMenu();
