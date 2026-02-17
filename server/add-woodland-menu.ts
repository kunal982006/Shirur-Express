
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // French Fries
    { name: "Classic Salted Fries", category: "French Fries", price: "89" },
    { name: "Peri-Peri Fries", category: "French Fries", price: "99" },
    { name: "Cheezzy Salted Fries", category: "French Fries", price: "129" },
    { name: "Cheezzy Peri-Peri Fries", category: "French Fries", price: "139" },

    // Burger'Z
    { name: "Veg Burger", category: "Burger'Z", price: "69" },
    { name: "Veg Cheezy Burger", category: "Burger'Z", price: "89" },
    { name: "Mayo Vegi Burger", category: "Burger'Z", price: "109" },
    { name: "Crispy Paneer Burger", category: "Burger'Z", price: "119" },
    { name: "Tandoori Paneer Burger", category: "Burger'Z", price: "149" },
    { name: "Double Deacker Burger", category: "Burger'Z", price: "169" },

    // Sandwich
    { name: "Veg Sandwich", category: "Sandwich", price: "59" },
    { name: "Veg Grill Sandwich", category: "Sandwich", price: "89" },
    { name: "Veg Cheese Sandwich", category: "Sandwich", price: "89" },
    { name: "Veg Cheese Grill Sandwich", category: "Sandwich", price: "129" },
    { name: "Tomato Cheese Grill Sandwich", category: "Sandwich", price: "109" },
    { name: "Cholocate Grill Sandwich", category: "Sandwich", price: "149" },
    { name: "Potato Cheese Grill Sandwich", category: "Sandwich", price: "149" },
    { name: "Paneer Grill Sandwich", category: "Sandwich", price: "149" },
    { name: "Paneer Cheese Grill Sandwich", category: "Sandwich", price: "169" },
    { name: "Masala Cheese Grill Sandwich", category: "Sandwich", price: "139" },
    { name: "Cheese Chilly Grill Sandwich", category: "Sandwich", price: "149" },
    { name: "Veg Mayo Grill Sandwich", category: "Sandwich", price: "149" },
    { name: "Babycorn Cheese Grill Sandwich", category: "Sandwich", price: "149" },

    // Pasta
    { name: "Red Sause Pasta", category: "Pasta", price: "189" },
    { name: "White Sause Pasta", category: "Pasta", price: "199" },
    { name: "Cheesee Pasta", category: "Pasta", price: "239" },

    // Toast
    { name: "Bread Butter Toast", category: "Toast", price: "59" },
    { name: "Bread Cheese Toast", category: "Toast", price: "79" },
    { name: "Garlic Bread Toast", category: "Toast", price: "89" },
    { name: "Cheese Chilly Toast", category: "Toast", price: "99" },

    // Mocktail's
    { name: "Blue Laggon", category: "Mocktail's", price: "79" },
    { name: "Green Apple", category: "Mocktail's", price: "89" },
    { name: "Virgine Mojito", category: "Mocktail's", price: "99" }, // Image spelling: Virgine

    // Cold Coffee's
    { name: "Cold Coffee's", category: "Cold Coffee's", price: "59" },
    { name: "Thick Cold Coffee", category: "Cold Coffee's", price: "69" },
    { name: "Strong Cold Coffee", category: "Cold Coffee's", price: "89" },
    { name: "Thick Cold Coffee With Crush", category: "Cold Coffee's", price: "89" },
    { name: "Thick Cold Coffee With Ice-Cream", category: "Cold Coffee's", price: "109" },

    // Shake's
    { name: "Orea Shake", category: "Shake's", price: "79" }, // Image: Orea
    { name: "Kitkat Shake", category: "Shake's", price: "89" },
    { name: "Strawbery Shake", category: "Shake's", price: "89" }, // Image: Strawbery
    { name: "Butterscotch Shake", category: "Shake's", price: "89" },
    { name: "Cadbury Shake", category: "Shake's", price: "89" },
    { name: "Spl Mango Mastani", category: "Shake's", price: "119" },

    // Tea
    { name: "Tea", category: "Tea", price: "20" },
    { name: "Black Tea", category: "Tea", price: "20" },
    { name: "Golden Tea", category: "Tea", price: "30" },
    { name: "Woodspecial Masala Tea", category: "Tea", price: "30" },

    // Coffee
    { name: "Hot Coffee", category: "Coffee", price: "30" },
    { name: "Strong Coffee", category: "Coffee", price: "40" },
    { name: "Butterscotch Hot Coffee", category: "Coffee", price: "40" },

    // Dessert
    { name: "Vanila Ice-Cream", category: "Dessert", price: "49" },
    { name: "Choclate Ice-Cream", category: "Dessert", price: "49" }, // Image: Choclate
    { name: "Sizzling Brownie", category: "Dessert", price: "149" },

    // Pav Bhaji
    { name: "Jain Pav Bhaji", category: "Pav Bhaji", price: "119" },
    { name: "Pav Bhaji", category: "Pav Bhaji", price: "129" },
    { name: "Khada Pav Bhaji", category: "Pav Bhaji", price: "129" },
    { name: "Cheese Pav Bhaji", category: "Pav Bhaji", price: "149" },

    // Soup's
    { name: "Manchaw Soup", category: "Soup's", price: "79" }, // Image: Manchaw
    { name: "Tomato Soup", category: "Soup's", price: "89" },
    { name: "Hot And Sour Soup", category: "Soup's", price: "99" },

    // Momo's
    { name: "Vegitable Momo's", category: "Momo's", price: "89" }, // Image: Vegitable
    { name: "Paneer Momo's", category: "Momo's", price: "119" },

    // Fried Momo's
    { name: "Vegitable Momo's", category: "Fried Momo's", price: "99" }, // Image: Vegitable
    { name: "Paneer Momo's Fried", category: "Fried Momo's", price: "119" },
    { name: "Schezwan Momo's Fried", category: "Fried Momo's", price: "149" },

    // Chinese Noodles
    { name: "Hakka Noodles", category: "Chinese Noodles", price: "159" },
    { name: "Schezwan Noodles", category: "Chinese Noodles", price: "179" },
    { name: "Singapuri Noodles", category: "Chinese Noodles", price: "199" },
    { name: "Tripple Noodles With-", category: "Chinese Noodles", price: "219" },
    { name: "4 Manchurian Gravy", category: "Chinese Noodles", price: "0" }, // Part of Tripple? maybe ignore or add note? It says "Tripple Noodles With- ... 4 Manchurian Gravy". I will merge them.

    // Chinese Rice
    { name: "Fried Rice", category: "Chinese Rice", price: "169" },
    { name: "Schezwan Fried Rice", category: "Chinese Rice", price: "179" },
    { name: "Manchurian Fried Rice", category: "Chinese Rice", price: "189" },
    { name: "Singapuri Fried Rice", category: "Chinese Rice", price: "189" },
    { name: "Tripple Fried Rice With-", category: "Chinese Rice", price: "219" },
    // "4 Manchurian Gravy" listed below it again, merging manually into name for Tripple items

    // Pizza's
    { name: "Classic Cheese Pizza", category: "Pizza's", price: "149" }, // Mid
    { name: "Margherita Pizza", category: "Pizza's", price: "159" },
    { name: "Tomato Cheese Pizza", category: "Pizza's", price: "159" },
    { name: "Baby Corn Cheese Pizza", category: "Pizza's", price: "169" },
    { name: "Sweet Corn Pizza", category: "Pizza's", price: "169" },
    { name: "Brocoby Onion Pizza", category: "Pizza's", price: "169" }, // Image: Brocoby? Looks like Brocoly/Broccoli but typed Brocoly
    { name: "Mushroom Onion Pizza", category: "Pizza's", price: "189" },
    { name: "Paneer Cheese Pizza", category: "Pizza's", price: "249" },
    { name: "Paneer Chilly Pizza", category: "Pizza's", price: "249" },
    { name: "Italian Cottage Pizza", category: "Pizza's", price: "249" },
    { name: "Mayo Veggies Pizza", category: "Pizza's", price: "249" },
    { name: "Indian Regular Pizza", category: "Pizza's", price: "289" },
    { name: "Four Cheese Pizza Full Loaded-", category: "Pizza's", price: "399" }, // Only large price available? Assuming large is the price.
    { name: "With Cheese", category: "Pizza's", price: "0" }, // Part of above description likely
    { name: "Special Chocolate Pizza", category: "Pizza's", price: "199" },
    { name: "Paneer Tikka Pizza", category: "Pizza's", price: "249" },
    { name: "Tandoori Paneer Pizza", category: "Pizza's", price: "249" },

    // Woodland Special Starter's
    { name: "Cheese Corn Bowl", category: "Woodland Special Starter's", price: "99" },
    { name: "Sweet Corn Chilly", category: "Woodland Special Starter's", price: "199" },
    { name: "Cheese Bowl", category: "Woodland Special Starter's", price: "129" },
    { name: "Chilly Potato", category: "Woodland Special Starter's", price: "139" },
    { name: "Cheese Dry Bowl", category: "Woodland Special Starter's", price: "119" }
];

async function seedWoodland() {
    console.log("Looking for Woodland Cafe...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Woodland%")
    });

    if (!provider) {
        console.error("Woodland Cafe provider not found! Please check business name.");
        process.exit(1);
    }

    console.log(`Found provider: ${provider.businessName} (${provider.id})`);

    // Clear existing items? Maybe yes to avoid duplicates
    // await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, provider.id));

    console.log("Adding menu items...");

    for (const item of menuItems) {
        // Basic cleanup
        let finalName = item.name;
        if (finalName === "Tripple Noodles With-") finalName = "Tripple Noodles with Manchurian Gravy";
        if (finalName === "Tripple Fried Rice With-") finalName = "Tripple Fried Rice with Manchurian Gravy";
        if (finalName === "Four Cheese Pizza Full Loaded-") finalName = "Four Cheese Pizza Full Loaded";
        if (item.price === "0") continue; // Skip continuation lines

        await db.insert(restaurantMenuItems).values({
            providerId: provider.id,
            name: finalName,
            category: item.category,
            price: item.price, // Drizzle handles decimal conversion if string is passed
            isVeg: true, // Assuming mostly veg menu based on items? YES, all items look veg. "Paneer", "Veg", etc.
            isAvailable: true,
            description: item.category // Use category as description for now
        });
        console.log(`Added: ${finalName} - ${item.price}`);
    }

    console.log("✅ Menu items added successfully!");
    process.exit(0);
}

seedWoodland().catch(console.error);
