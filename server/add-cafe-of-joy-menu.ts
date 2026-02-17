
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // Burger
    { name: "Veg Burger", category: "Burger", price: "70" },
    { name: "Veg Cheese Burger", category: "Burger", price: "80" },
    { name: "Double Decker Cheese Burger", category: "Burger", price: "90" },
    { name: "Café of Joy Sp. Cheese Burger", category: "Burger", price: "100" },
    { name: "Paneer Tiki Cheese Burger", category: "Burger", price: "130" },

    // Pasta
    { name: "White Sauce Cheese Pasta", category: "Pasta", price: "160" },
    { name: "Red Sauce Cheese Pasta", category: "Pasta", price: "160" },
    { name: "Pink Sauce Cheese Pasta", category: "Pasta", price: "170" },

    // Pizza
    { name: "Margherita Pizza", category: "Pizza", price: "130" },
    { name: "Fresh Veg Pizza", category: "Pizza", price: "150" },
    { name: "Corn Cheese Pizza", category: "Pizza", price: "150" },
    { name: "Paneer Cheese Pizza", category: "Pizza", price: "170" },
    { name: "Paneer Schezwan Pizza", category: "Pizza", price: "180" },
    { name: "Corn & Paneer Pizza", category: "Pizza", price: "180" },
    { name: "Café of Sp. Pizza", category: "Pizza", price: "200" },
    { name: "Chocolate Pizza", category: "Pizza", price: "200" },
    { name: "Oreo Chocolate Pizza", category: "Pizza", price: "200" },

    // Brownie
    { name: "Sizzling Brownie", category: "Brownie", price: "200" }, // Typo Sizzking -> Sizzling fixed
    { name: "Sizzling Brownie with Ice Cream", category: "Brownie", price: "220" },

    // Momos
    { name: "Mix Veg Momos", category: "Momos", price: "90" },
    { name: "Paneer Momos", category: "Momos", price: "100" },
    { name: "Corn Momos Fry", category: "Momos", price: "110" },
    { name: "Schezwan Momos Fry", category: "Momos", price: "100" },
    { name: "Kurkure Momos Fry", category: "Momos", price: "100" },

    // Café of Joy Sp. Pav Bhaji
    { name: "Butter Pav Bhaji", category: "Pav Bhaji", price: "100" }, // Pab -> Pav
    { name: "Cheese Pav Bhaji", category: "Pav Bhaji", price: "110" },
    { name: "Paneer Cheese Pav Bhaji", category: "Pav Bhaji", price: "120" },
    { name: "Extra Pav Jodi", category: "Pav Bhaji", price: "10" },

    // Bhel
    { name: "Simple Bhel", category: "Bhel", price: "40" },
    { name: "Oli Bhel", category: "Bhel", price: "50" },
    { name: "Cheese Bhel", category: "Bhel", price: "60" },

    // Hots
    { name: "Tea", category: "Hots", price: "10" },
    { name: "Black Tea", category: "Hots", price: "20" },
    { name: "Hot Coffee", category: "Hots", price: "20" },
    { name: "Haldi Milk", category: "Hots", price: "20" },

    // Cold Beverges
    { name: "Normal Cold Coffee", category: "Cold Beverges", price: "50" },
    { name: "Thick Cold Coffee", category: "Cold Beverges", price: "60" },
    { name: "Cold Coffee with Crush", category: "Cold Beverges", price: "70" },
    { name: "Cold Coffee with Ice Cream", category: "Cold Beverges", price: "80" },
    { name: "Thick Bournvita", category: "Cold Beverges", price: "50" },
    { name: "Ice Tea", category: "Cold Beverges", price: "50" },

    // Shake
    { name: "Kit Kat Shake", category: "Shake", price: "80" },
    { name: "Oreo Shake", category: "Shake", price: "80" },
    { name: "Chocolate Shake", category: "Shake", price: "80" },

    // Mocktails (Monito -> Mojito likely, but menu says Monito, sticking to menu for authenticity unless user complained? Let's assume Monito is their name or typo. I'll correct to Mojito for searchability/professionalism as it's a common typo)
    { name: "Blue Lagoon Mojito", category: "Mocktails", price: "70" },
    { name: "Green Apple Mojito", category: "Mocktails", price: "70" },
    { name: "Blue Berry Mojito", category: "Mocktails", price: "70" },
    { name: "Pineapple Mojito", category: "Mocktails", price: "70" },
    { name: "Kala Khatta Mojito", category: "Mocktails", price: "100" },
    { name: "Mint Mojito", category: "Mocktails", price: "90" },
    { name: "Lime Mojito", category: "Mocktails", price: "90" },
    { name: "Strawberry Mojito", category: "Mocktails", price: "90" },
    { name: "Litchi Mojito", category: "Mocktails", price: "90" },

    // Maggie
    { name: "Plain Maggie", category: "Maggie", price: "50" },
    { name: "Masala Maggie", category: "Maggie", price: "60" },
    { name: "Masala Cheese Maggie", category: "Maggie", price: "70" },
    { name: "Peri Peri Masala Cheese Maggie", category: "Maggie", price: "80" },
    { name: "Corn Cheese Maggie", category: "Maggie", price: "70" },
    { name: "Corn & Paneer Maggie", category: "Maggie", price: "80" },
    { name: "Schezwan Cheese Maggie", category: "Maggie", price: "70" },

    // Sandwich
    { name: "Veg Cheese Sandwich", category: "Sandwich", price: "80" },
    { name: "Corn Cheese Sandwich", category: "Sandwich", price: "90" },
    { name: "Chocolate Garlic Sandwich", category: "Sandwich", price: "80" }, // Gralic -> Garlic
    { name: "Paneer Cheese Sandwich", category: "Sandwich", price: "90" },
    { name: "Café of Joy Sandwich", category: "Sandwich", price: "100" },

    // Fries (Frise -> Fries)
    { name: "Salted Fries", category: "Fries", price: "80" },
    { name: "Peri Peri Fries", category: "Fries", price: "90" },
    { name: "Salted Cheese Fries", category: "Fries", price: "90" },
    { name: "Peri Peri Cheese Fries", category: "Fries", price: "100" },
    { name: "Overloaded Cheese Fries", category: "Fries", price: "120" }
];

async function seedCafeOfJoy() {
    console.log("Looking for 'Cafe of Joy' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Cafe of Joy%"),
    });

    if (!provider) {
        console.error("❌ 'Cafe of Joy' provider not found!");
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

seedCafeOfJoy().catch((err) => {
    console.error("Error seeding Cafe of Joy:", err);
    process.exit(1);
});
