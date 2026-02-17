
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // Milk Shakes
    { name: "Mango Milk Shake", category: "Milk Shakes", price: "50" },
    { name: "Strawberry Milk Shake", category: "Milk Shakes", price: "50" },
    { name: "Pista Milk Shake", category: "Milk Shakes", price: "50" },
    { name: "Oreo Milk Shake", category: "Milk Shakes", price: "50" },
    { name: "Chocolate Milk Shake", category: "Milk Shakes", price: "50" },
    { name: "Pineapple Milk Shake", category: "Milk Shakes", price: "50" },
    { name: "Gulkand Milk Shake", category: "Milk Shakes", price: "60" },
    { name: "Butter Scotch Milk Shake", category: "Milk Shakes", price: "60" },
    { name: "Anjeer Milk Shake", category: "Milk Shakes", price: "60" },
    { name: "Fruit Overload (Mix Fruit) Shake", category: "Milk Shakes", price: "60" },

    // Mastani
    { name: "Mango Mastani", category: "Mastani", price: "70" },
    { name: "Strawberry Mastani", category: "Mastani", price: "70" },
    { name: "Pista Mastani", category: "Mastani", price: "70" },
    { name: "Pineapple Mastani", category: "Mastani", price: "70" },
    { name: "Chocolate Mastani", category: "Mastani", price: "70" },
    { name: "Butter Scotch Mastani", category: "Mastani", price: "80" },
    { name: "Anjeer Mastani", category: "Mastani", price: "80" },

    // Beverages
    { name: "Cold Coffee", category: "Beverages", price: "50" },
    { name: "Cold Coffee with ch.Crush", category: "Beverages", price: "60" },
    { name: "Cold Coffee with ice cream", category: "Beverages", price: "60" },

    { name: "Cold Chocolate", category: "Beverages", price: "50" },
    { name: "Cold Chocolate with ch.Crush", category: "Beverages", price: "60" },
    { name: "Cold Chocolate with Ice Cream", category: "Beverages", price: "60" },

    { name: "Mocha Cold Coffee", category: "Beverages", price: "60" },
    { name: "Irish Cold Coffee", category: "Beverages", price: "60" },
    { name: "Caramel Cold Coffee", category: "Beverages", price: "60" },

    { name: "Cad M", category: "Beverages", price: "80" }, // Famous in Pune/Maharashtra (Cad B/Cad M)
    { name: "Cad B", category: "Beverages", price: "80" },

    { name: "Extra Ice Cream / Crush", category: "Beverages", price: "10" },

    // Burger
    { name: "Veg.Burger", category: "Burger", price: "60" },
    { name: "Veg.Cheese Burger", category: "Burger", price: "70" },
    { name: "Herb Chilly Burger", category: "Burger", price: "70" },
    { name: "Schezwan Burger", category: "Burger", price: "80" },
    { name: "Paneer Burger", category: "Burger", price: "80" },
    { name: "Double Tikki Burger", category: "Burger", price: "90" },
    { name: "Extra Cheese Slice", category: "Burger", price: "10" },

    // Chocolate Brownie
    { name: "Chocolate Brownie with icecream", category: "Chocolate Brownie", price: "120" },
    { name: "Extra Ice Cream", category: "Chocolate Brownie", price: "30" },

    // Sandwich (Grilled)
    { name: "Bread Jam (Non-Grilled)", category: "Sandwich (Grilled)", price: "50" },
    { name: "Veg. Sandwich", category: "Sandwich (Grilled)", price: "60" },
    { name: "Schezwan Sandwich", category: "Sandwich (Grilled)", price: "60" },
    { name: "Tadka Sandwich", category: "Sandwich (Grilled)", price: "60" },
    { name: "Corn Sandwich", category: "Sandwich (Grilled)", price: "60" },
    { name: "Paneer Sandwich", category: "Sandwich (Grilled)", price: "70" },
    { name: "Cutlet Sandwich", category: "Sandwich (Grilled)", price: "70" },
    { name: "Chocolate Sandwich", category: "Sandwich (Grilled)", price: "70" },
    { name: "Peanut Butter Sandwich", category: "Sandwich (Grilled)", price: "70" },
    { name: "Ghotala Sandwich", category: "Sandwich (Grilled)", price: "80" },
    { name: "Pizza Sandwich (Triple Layer)", category: "Sandwich (Grilled)", price: "100" },
    { name: "Any Sandwich With Cheese Extra", category: "Sandwich (Grilled)", price: "20" },

    // Toast
    { name: "Cheesy Toast", category: "Toast", price: "40" },
    { name: "Garlic Toast", category: "Toast", price: "40" },
    { name: "Cheese Chilly Garlic Toast", category: "Toast", price: "50" },
    { name: "Veg. Cheese Toast", category: "Toast", price: "60" },

    // Pizza
    { name: "Plain Cheese Pizza", category: "Pizza", price: "120" },
    { name: "Pineapple Cheese Pizza", category: "Pizza", price: "130" },
    { name: "Veg. Cheese Pizza", category: "Pizza", price: "140" },
    { name: "Chocolate Pizza", category: "Pizza", price: "140" },
    { name: "Veg. Schezwan Pizza", category: "Pizza", price: "140" },
    { name: "Veg. Corn Pizza", category: "Pizza", price: "150" },
    { name: "Veg. Tandoori Pizza", category: "Pizza", price: "150" },
    { name: "Veg. Pineapple Pizza", category: "Pizza", price: "150" },
    { name: "Veg. Paneer Pizza", category: "Pizza", price: "160" },
    { name: "Paneer Tandoori Pizza", category: "Pizza", price: "170" },
    { name: "Spl. Ex .Pizza", category: "Pizza", price: "170" }, // Special Exotic/Extra? Kept as per menu
    { name: "Garlic Jelepeno Pizza", category: "Pizza", price: "170" },
    { name: "Extra Cheese", category: "Pizza", price: "20" },

    // Fries
    { name: "French Fries (Salted)", category: "Fries", price: "60" },
    { name: "Peri Peri Fries", category: "Fries", price: "70" },
    { name: "Masala Fries", category: "Fries", price: "70" },
    { name: "Extra Mayonnaise", category: "Fries", price: "10" },
    { name: "Extra Masala", category: "Fries", price: "10" }
];

async function seedAromaCafe() {
    console.log("Looking for 'Aroma Cafe' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Aroma%"),
    });

    if (!provider) {
        console.error("❌ 'Aroma Cafe' provider not found!");
        process.exit(1);
    }

    console.log(`✅ Found provider: ${provider.businessName} (ID: ${provider.id})`);
    console.log(`Adding ${menuItems.length} menu items...`);

    let count = 0;
    for (const item of menuItems) {
        await db.insert(restaurantMenuItems).values({
            providerId: provider.id,
            name: item.name,
            category: item.category,
            price: item.price,
            isVeg: true,
            isAvailable: true,
            description: item.category
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} items to ${provider.businessName}`);
    process.exit(0);
}

seedAromaCafe().catch((err) => {
    console.error("Error seeding Aroma Cafe:", err);
    process.exit(1);
});
