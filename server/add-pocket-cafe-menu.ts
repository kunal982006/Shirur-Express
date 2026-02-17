import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // Signature Blend
    { name: "CAWA (Special Thick Cold Coffee)", category: "Signature Blend", price: "50" },
    { name: "CAWA Crush", category: "Signature Blend", price: "80" },
    { name: "Swiss Coffee", category: "Signature Blend", price: "90" },
    { name: "CAWA Hazulnut", category: "Signature Blend", price: "100" },
    { name: "CAWA With Ice Cream", category: "Signature Blend", price: "100" },
    { name: "Affogato Coffee", category: "Signature Blend", price: "100" },
    { name: "Cold Coffee (Italian Iced Coffee)", category: "Signature Blend", price: "100" },

    // Thick Shake
    { name: "Strawberry Shake", category: "Thick Shake", price: "90" },
    { name: "Oreo Shake", category: "Thick Shake", price: "100" },
    { name: "Mango Shake", category: "Thick Shake", price: "100" },
    { name: "Kit-kat shake", category: "Thick Shake", price: "100" },
    { name: "Belgium Chocolate Shake", category: "Thick Shake", price: "120" },

    // Cooling Cooler
    { name: "Kala Khatta", category: "Cooling Cooler", price: "90" },
    { name: "Chilli Gauva", category: "Cooling Cooler", price: "100" },

    // Mystic Mocktails
    { name: "Virgin Mojito", category: "Mystic Mocktails", price: "100" },
    { name: "Orange Blast", category: "Mystic Mocktails", price: "100" },
    { name: "Green Apple Mocktail", category: "Mystic Mocktails", price: "120" },
    { name: "Blue Lagoon Mocktail", category: "Mystic Mocktails", price: "120" },
    { name: "Blue Berry Mocktail", category: "Mystic Mocktails", price: "120" },

    // Lemon Twist
    { name: "Fresh Lime Water (Lemonade)", category: "Lemon Twist", price: "50" },
    { name: "Fresh Lime Soda", category: "Lemon Twist", price: "70" },

    // On The Rock Ice Tea
    { name: "Lemon Ice Tea", category: "On The Rock Ice Tea", price: "90" },
    { name: "Soda Ice Tea", category: "On The Rock Ice Tea", price: "90" },
    { name: "Peach Ice Tea", category: "On The Rock Ice Tea", price: "100" },
    { name: "Lemon Mint Ice Tea", category: "On The Rock Ice Tea", price: "100" },

    // Hot Beverages
    { name: "Black Coffee", category: "Hot Beverages", price: "40" },
    { name: "Classic Hot Coffee", category: "Hot Beverages", price: "40" },
    { name: "Hot Chocolate", category: "Hot Beverages", price: "100" },
    { name: "Hot mocha", category: "Hot Beverages", price: "100" },

    // Tea
    { name: "Lemon Black Tea", category: "Tea", price: "30" },
    { name: "Masala Tea", category: "Tea", price: "40" },
    { name: "Ginger Lemon Grass Tea", category: "Tea", price: "40" },

    // Pizza On Fire
    { name: "Italian Margherita (8\")", category: "Pizza On Fire", price: "140" },
    { name: "Italian Margherita (10\")", category: "Pizza On Fire", price: "300" },
    { name: "Italian Margherita (12\")", category: "Pizza On Fire", price: "400" },

    { name: "Farm Fresh Pizza (8\")", category: "Pizza On Fire", price: "180" },
    { name: "Farm Fresh Pizza (10\")", category: "Pizza On Fire", price: "340" },
    { name: "Farm Fresh Pizza (12\")", category: "Pizza On Fire", price: "440" },

    { name: "American Corn Pizza (8\")", category: "Pizza On Fire", price: "180" },
    { name: "American Corn Pizza (10\")", category: "Pizza On Fire", price: "340" },
    { name: "American Corn Pizza (12\")", category: "Pizza On Fire", price: "440" },

    { name: "Paneer Makhanwala Pizza (8\")", category: "Pizza On Fire", price: "200" },
    { name: "Paneer Makhanwala Pizza (10\")", category: "Pizza On Fire", price: "350" },
    { name: "Paneer Makhanwala Pizza (12\")", category: "Pizza On Fire", price: "450" },

    { name: "Tandoori Paneer Pizza (8\")", category: "Pizza On Fire", price: "200" },
    { name: "Tandoori Paneer Pizza (10\")", category: "Pizza On Fire", price: "350" },
    { name: "Tandoori Paneer Pizza (12\")", category: "Pizza On Fire", price: "450" },

    { name: "Spicy Mushrooms & Onion Pizza (8\")", category: "Pizza On Fire", price: "250" },
    { name: "Spicy Mushrooms & Onion Pizza (10\")", category: "Pizza On Fire", price: "350" },
    { name: "Spicy Mushrooms & Onion Pizza (12\")", category: "Pizza On Fire", price: "450" },

    { name: "Pesto Cheese Pizza (8\")", category: "Pizza On Fire", price: "250" },
    { name: "Pesto Cheese Pizza (10\")", category: "Pizza On Fire", price: "380" },
    { name: "Pesto Cheese Pizza (12\")", category: "Pizza On Fire", price: "500" },

    { name: "Cheese Burst - Tandoori Paneer (8\")", category: "Pizza On Fire", price: "280" },
    { name: "Cheese Burst - Tandoori Paneer (10\")", category: "Pizza On Fire", price: "400" },
    { name: "Cheese Burst - Tandoori Paneer (12\")", category: "Pizza On Fire", price: "500" },

    { name: "Exotic Italian Pizza (8\")", category: "Pizza On Fire", price: "240" },
    { name: "Exotic Italian Pizza (10\")", category: "Pizza On Fire", price: "400" },
    { name: "Exotic Italian Pizza (12\")", category: "Pizza On Fire", price: "500" },

    // Garlic Bread
    { name: "Classic Italian Garlic Bread", category: "Garlic Bread", price: "120" },
    { name: "Chilli Garlic Bread", category: "Garlic Bread", price: "130" },
    { name: "Classic with Olives", category: "Garlic Bread", price: "140" },
    { name: "Classic with Jalapeños", category: "Garlic Bread", price: "140" },

    // Chocolate Magic
    { name: "Lawa Cake", category: "Chocolate Magic", price: "80" },
    { name: "Chocolaty B", category: "Chocolate Magic", price: "120" },
    { name: "Sizzling Brownie with Ice Cream", category: "Chocolate Magic", price: "180" },

    // Extras
    { name: "Mayonnaise", category: "Extras", price: "20" },
    { name: "Cheese Slice", category: "Extras", price: "20" },
    { name: "Cheese Dip", category: "Extras", price: "20" },
    { name: "Water Bottle", category: "Extras", price: "25" }, // Using MRP/common price if not clear

    // Soulmate Sandwich
    { name: "Veg Sandwich (Without Grilled)", category: "Soulmate Sandwich", price: "70" },
    { name: "Bombay Sandwich (Without Cheese)", category: "Soulmate Sandwich", price: "80" },
    { name: "Veg Cheese Grilled", category: "Soulmate Sandwich", price: "100" },
    { name: "Chocolate Sandwich", category: "Soulmate Sandwich", price: "100" },
    { name: "Garlic Corn Cheese", category: "Soulmate Sandwich", price: "120" },
    { name: "Paneer Tandoori Sandwich", category: "Soulmate Sandwich", price: "140" },
    { name: "Corn Cheese Grilled Sandwich", category: "Soulmate Sandwich", price: "150" },
    { name: "Cheese Chilli Toast Sandwich", category: "Soulmate Sandwich", price: "160" },

    // Born For Burgers
    { name: "Aloo Tikki Burger", category: "Born For Burgers", price: "50" },
    { name: "Veg Crispy Burger", category: "Born For Burgers", price: "80" },
    { name: "Kimchy Burger", category: "Born For Burgers", price: "100" },
    { name: "Veg Tandoori Burger", category: "Born For Burgers", price: "100" },
    { name: "Cheesy Lava Burger", category: "Born For Burgers", price: "140" },
    { name: "Veg Maharaja Burger", category: "Born For Burgers", price: "150" },
    { name: "Spicy Paneer Tandoori Burger", category: "Born For Burgers", price: "150" },
    { name: "American Veg Burger", category: "Born For Burgers", price: "150" },
    { name: "Peri Peri Paneer Burger", category: "Born For Burgers", price: "150" },
    { name: "Extra Cheese Slice", category: "Born For Burgers", price: "20" },

    // Creamy Pasta
    { name: "Arrabiata Red Sauce", category: "Creamy Pasta", price: "210" },
    { name: "Alfredo White Sauce", category: "Creamy Pasta", price: "220" },
    { name: "Mac & Cheese Pasta", category: "Creamy Pasta", price: "250" },

    // Wrap
    { name: "Aloo Wrap", category: "Wrap", price: "120" },
    { name: "Creamy Veggie Wrap", category: "Wrap", price: "140" },
    { name: "Spicy Paneer Wrap", category: "Wrap", price: "160" },

    // Forever French Fries
    { name: "Classic Salted Fries", category: "Forever French Fries", price: "90" },
    { name: "Masala Fries", category: "Forever French Fries", price: "100" },
    { name: "Peri Peri Fries / Kimchi Fries", category: "Forever French Fries", price: "120" },
    { name: "Creamy Cheesy Fries Loaded", category: "Forever French Fries", price: "140" },
    { name: "Cheese Loaded Peri Peri Fries", category: "Forever French Fries", price: "160" },

    // Appetizer
    { name: "Potato Pops (10 PC)", category: "Appetizer", price: "110" },
    { name: "Smiley", category: "Appetizer", price: "140" },

    // Maggi
    { name: "Plain Maggi", category: "Maggi", price: "50" },
    { name: "Veg Masala Maggi / Peri Peri Maggi", category: "Maggi", price: "80" },
    { name: "Cheese Loaded Maggi", category: "Maggi", price: "100" },

    // Melting Momos
    { name: "Momos (Fried / Steam) (6PC)", category: "Melting Momos", price: "120" },
    { name: "Tandoori Momos (6PC)", category: "Melting Momos", price: "160" }
];

async function seedPocketCafe() {
    console.log("Looking for 'Pocket Cafe' provider...");

    // Search by business name OR username if typical pattern fails
    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Pocket%"),
    });

    if (!provider) {
        console.error("❌ 'Pocket Cafe' provider not found!");
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
            isVeg: true, // Assuming mostly veg or not specified as non-veg
            isAvailable: true,
            description: item.category
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} items to ${provider.businessName}`);
    process.exit(0);
}

seedPocketCafe().catch((err) => {
    console.error("Error seeding Pocket Cafe:", err);
    process.exit(1);
});
