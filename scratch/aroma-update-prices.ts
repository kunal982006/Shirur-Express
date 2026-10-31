import "dotenv/config";
import { db } from "../server/db";
import { restaurantMenuItems } from "../shared/schema";
import { and, eq } from "drizzle-orm";
const PID = "vzqcfcvxgi7hg1y38q4r78c6";
const menuItems = [
    // Pizza
    { name: "Plain Cheese Pizza", category: "Pizza", price: "130", isVeg: true },
    { name: "Veg. Cheese Pizza", category: "Pizza", price: "150", isVeg: true },
    { name: "Chocolate Pizza", category: "Pizza", price: "150", isVeg: true },
    { name: "Veg. Schezwan Pizza", category: "Pizza", price: "150", isVeg: true },
    { name: "Veg. Corn Pizza", category: "Pizza", price: "160", isVeg: true },
    { name: "Veg. Tandoori Pizza", category: "Pizza", price: "160", isVeg: true },
    { name: "Veg. Paneer Pizza", category: "Pizza", price: "170", isVeg: true },
    { name: "Paneer Tandoori Pizza", category: "Pizza", price: "180", isVeg: true },
    { name: "Spl. Ex .Pizza", category: "Pizza", price: "180", isVeg: true },
    { name: "Garlic Jelepeno Pizza", category: "Pizza", price: "180", isVeg: true },
    { name: "Extra Cheese", category: "Pizza", price: "20", isVeg: true },

    // Fries
    { name: "French Fries (Salted)", category: "Fries", price: "70", isVeg: true },
    { name: "French Fries Cheese Overloded", category: "Fries", price: "90", isVeg: true },
    { name: "Peri Peri Fries", category: "Fries", price: "80", isVeg: true },
    { name: "Peri Peri Fries Cheese Overloded", category: "Fries", price: "100", isVeg: true },
    { name: "Veggie Fingers", category: "Fries", price: "90", isVeg: true },
    { name: "Cheese Triangles", category: "Fries", price: "90", isVeg: true },
    { name: "Extra Mayonnaise", category: "Fries", price: "10", isVeg: true },
    { name: "Extra Masala", category: "Fries", price: "10", isVeg: true },

    // Beverages
    { name: "Lemon Tea", category: "Beverages", price: "20", isVeg: true },
    { name: "Hot Coffee", category: "Beverages", price: "30", isVeg: true },
    { name: "Hot Chocolate", category: "Beverages", price: "50", isVeg: true },
    { name: "Ice Tea", category: "Beverages", price: "40", isVeg: true },
    { name: "Cold Coffee", category: "Beverages", price: "50", isVeg: true },
    { name: "Cold Coffee with ch.Crush", category: "Beverages", price: "60", isVeg: true },
    { name: "Cold Coffee with Ice cream", category: "Beverages", price: "60", isVeg: true },
    { name: "Cold Chocolate", category: "Beverages", price: "50", isVeg: true },
    { name: "Cold Chocolate with ch.Crush", category: "Beverages", price: "60", isVeg: true },
    { name: "Cold Chocolate with Ice Cream", category: "Beverages", price: "60", isVeg: true },
    { name: "Mocha Cold Coffee", category: "Beverages", price: "60", isVeg: true },
    { name: "Irish Cold Coffee", category: "Beverages", price: "60", isVeg: true },
    { name: "Caramel Cold Coffee", category: "Beverages", price: "60", isVeg: true },
    { name: "Cad M", category: "Beverages", price: "90", isVeg: true },
    { name: "Cad B", category: "Beverages", price: "90", isVeg: true },
    { name: "Extra Ice Cream / Crush", category: "Beverages", price: "10", isVeg: true },

    // Milk Shakes
    { name: "Mango Milk Shake", category: "Milk Shakes", price: "50", isVeg: true },
    { name: "Strawberry Milk Shake", category: "Milk Shakes", price: "50", isVeg: true },
    { name: "Pista Milk Shake", category: "Milk Shakes", price: "50", isVeg: true },
    { name: "Oreo Milk Shake", category: "Milk Shakes", price: "50", isVeg: true },
    { name: "Chocolate Milk Shake", category: "Milk Shakes", price: "50", isVeg: true },
    { name: "Gulkand Milk Shake", category: "Milk Shakes", price: "60", isVeg: true },
    { name: "Butter Scotch Milk Shake", category: "Milk Shakes", price: "60", isVeg: true },
    { name: "Anjeer Milk Shake", category: "Milk Shakes", price: "60", isVeg: true },
    { name: "Fruit Overload (Mix Fruit) Milk Shake", category: "Milk Shakes", price: "60", isVeg: true },

    // Mastani
    { name: "Mango Mastani", category: "Mastani", price: "80", isVeg: true },
    { name: "Strawberry Mastani", category: "Mastani", price: "80", isVeg: true },
    { name: "Pista Mastani", category: "Mastani", price: "80", isVeg: true },
    { name: "Chocolate Mastani", category: "Mastani", price: "80", isVeg: true },
    { name: "Gulkand Mastani", category: "Mastani", price: "90", isVeg: true },
    { name: "Butter Scotch Mastani", category: "Mastani", price: "90", isVeg: true },
    { name: "Anjeer Mastani", category: "Mastani", price: "90", isVeg: true },

    // Sandwich (Grilled)
    { name: "Veg. Sandwich", category: "Sandwich (Grilled)", price: "70", isVeg: true },
    { name: "Schezwan Sandwich", category: "Sandwich (Grilled)", price: "70", isVeg: true },
    { name: "Tadka Sandwich", category: "Sandwich (Grilled)", price: "70", isVeg: true },
    { name: "Corn Sandwich", category: "Sandwich (Grilled)", price: "70", isVeg: true },
    { name: "Paneer Sandwich", category: "Sandwich (Grilled)", price: "80", isVeg: true },
    { name: "Cutlet Sandwich", category: "Sandwich (Grilled)", price: "80", isVeg: true },
    { name: "Chocolate Sandwich", category: "Sandwich (Grilled)", price: "80", isVeg: true },
    { name: "Ghotala Sandwich", category: "Sandwich (Grilled)", price: "90", isVeg: true },
    { name: "Veg Sub", category: "Sandwich (Grilled)", price: "90", isVeg: true },
    { name: "Paneer Sub", category: "Sandwich (Grilled)", price: "90", isVeg: true },
    { name: "Pizza Sandwich (Triple Layer)", category: "Sandwich (Grilled)", price: "100", isVeg: true },
    { name: "Any Sandwich With Cheese Extra", category: "Sandwich (Grilled)", price: "20", isVeg: true },

    // DIPS
    { name: "Cheese Dip", category: "DIPS", price: "20", isVeg: true },
    { name: "Jelepeno Dip", category: "DIPS", price: "20", isVeg: true },
    { name: "Tandoori Dip", category: "DIPS", price: "20", isVeg: true },
    { name: "Chipotle Dip", category: "DIPS", price: "20", isVeg: true },
    { name: "Salsa Dip", category: "DIPS", price: "20", isVeg: true },

    // Burger
    { name: "Veg.Burger", category: "Burger", price: "70", isVeg: true },
    { name: "Veg.Cheese Burger", category: "Burger", price: "80", isVeg: true },
    { name: "Herb Chilly Burger", category: "Burger", price: "80", isVeg: true },
    { name: "Schezwan Burger", category: "Burger", price: "90", isVeg: true },
    { name: "Paneer Burger", category: "Burger", price: "90", isVeg: true },
    { name: "Double Tikki Burger", category: "Burger", price: "100", isVeg: true },
    { name: "Extra Cheese Slice", category: "Burger", price: "10", isVeg: true },

    // MOMOS (Fried)
    { name: "Mix Veg Momos", category: "MOMOS (Fried)", price: "80", isVeg: true },
    { name: "Schezwan Momos", category: "MOMOS (Fried)", price: "80", isVeg: true },
    { name: "Paneer Momos", category: "MOMOS (Fried)", price: "100", isVeg: true },
    { name: "Cheese Corn Momos", category: "MOMOS (Fried)", price: "100", isVeg: true },

    // Toast
    { name: "Cheesy Toast", category: "Toast", price: "40", isVeg: true },
    { name: "Garlic Toast", category: "Toast", price: "40", isVeg: true },
    { name: "Cheese Chilly Garlic", category: "Toast", price: "50", isVeg: true },
    { name: "Veg. Cheese Toast", category: "Toast", price: "60", isVeg: true }
];
(async () => {
  const rows = await db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, PID));
  const seen = new Set<string>(); let changed = 0;
  for (const m of menuItems) {
    const r = rows.find(r => r.name === m.name && r.category === m.category);
    if (!r) { console.log("NOT IN DB:", m.name); continue; }
    seen.add(r.id);
    if (Number(r.price) !== Number(m.price)) {
      await db.update(restaurantMenuItems).set({ price: m.price }).where(and(eq(restaurantMenuItems.id, r.id), eq(restaurantMenuItems.providerId, PID)));
      changed++;
    }
  }
  for (const r of rows) if (!seen.has(r.id)) console.log("IN DB, NOT ON CARD:", r.name);
  console.log(`card items ${menuItems.length}, db items ${rows.length}, updated ${changed}`);
  process.exit(0);
})();
