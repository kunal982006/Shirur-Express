import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems } from "@shared/schema";

const providerId = 'fg11p6mi37d50tm4sfa13o13';

const menuItems = [
    // === NON-VEG ===
    // NON VEG PIZZA
    { name: "Cheesy Chicken Pizza", category: "Non Veg Pizza", price: "129", isVeg: false, description: "Sauce, Plain Chicken & Mozzarella Cheese & Mozzarella Cheese" },
    { name: "Simple Chicken Pizza", category: "Non Veg Pizza", price: "139", isVeg: false, description: "Pizza Sauce, Onion, Chicken & Mozzarella Cheese" },
    { name: "Zesty Chicken Pizza", category: "Non Veg Pizza", price: "149", isVeg: false, description: "Pizza Sauce, Onion, Green Chilly, Plain Chicken & Mozzarella Cheese" },

    // CLASSIC CHICKEN
    { name: "Choice Chicken Pizza", category: "Classic Chicken Pizza", price: "179", isVeg: false, description: "Onion, Capsicum, Tomato, Plain Chicken, Corn & Mozzarella" },
    { name: "Chicken Lover Pizza", category: "Classic Chicken Pizza", price: "179", isVeg: false, description: "Onion, Capsicum, Tomato, Mushroom & Mozzarella Cheese" },
    { name: "Chicken Pepe Pizza", category: "Classic Chicken Pizza", price: "179", isVeg: false, description: "Onion, Capsicum, Tomato, Plain Chicken, Green Chilly, Mozzarella Cheese" },

    // SIGNATURE CHICKEN
    { name: "Chicken Cheese Burst Pizza", category: "Signature Chicken Pizza", price: "279", isVeg: false, description: "Double Layered Cheese, Plain Chicken, Onion & Mozzarella Cheese" },
    { name: "B.B.Q Chicken Pizza", category: "Signature Chicken Pizza", price: "239", isVeg: false, description: "B.B.Q Sauce, Marinated Chicken, Onion, Olive, Red Paprika & Mozzarella Cheese" },
    { name: "Tandoori Chicken Pizza", category: "Signature Chicken Pizza", price: "239", isVeg: false, description: "Tandoori Sauce, Marinated Chi., Onion, Capsicum, Tomato, Red Paprika & Mozzarella Cheese" },
    { name: "Makhani Chicken Pizza", category: "Signature Chicken Pizza", price: "239", isVeg: false, description: "Makhani Sauce, Onion, Capsicum, Jalapeno, Makhani Chicken & Mozzarella Cheese" },
    { name: "Peri Peri Chicken Pizza", category: "Signature Chicken Pizza", price: "239", isVeg: false, description: "Peri Peri Sauce, Marinated Chicken, Onion, Capsicum, Tomato, Green Chilly, Jalapeno & Mozzarella Cheese" },

    // EXOTIC CHICKEN
    { name: "Spicy Chicken Pizza", category: "Exotic Chicken Pizza", price: "279", isVeg: false, description: "Spicy Sauce, Onion, Capsicum Jalapeno, Red Paprika, Green Chilly, Spicy Chicken & Mozzarella Cheese" },
    { name: "Chicken Supremo Pizza", category: "Exotic Chicken Pizza", price: "279", isVeg: false, description: "Onion, Capsicum, Tomato, Sweet Corn, Olive, Red Paprika, Mushroom & Mozzarella Cheese" },
    { name: "Chicken Extravaganza Pizza", category: "Exotic Chicken Pizza", price: "279", isVeg: false, description: "Onion, Olive, Capsicum, Jalapeno, Red Paprika, Green Chilly, Sp" },

    // NON-VEG PIZZA COMBO
    { name: "Cheesy Chicken (7\") Pizza Combo", category: "Non-Veg Pizza Combo", price: "239", isVeg: false, description: "Cheesy Chicken (7\") Pizza, Chicken Popcorn, Coke" },
    { name: "Any Classic Chicken (7\") Pizza Combo", category: "Non-Veg Pizza Combo", price: "289", isVeg: false, description: "Any Classic Chicken (7\") Pizza, Chicken Fries, Coke" },
    { name: "Any Signature Chicken (7\") Pizza Combo", category: "Non-Veg Pizza Combo", price: "319", isVeg: false, description: "Any Signature Chicken (7\") Pizza, Chicken Fries, Any Mocktel" },
    { name: "Any Exotic Chicken (7\") Pizza Combo", category: "Non-Veg Pizza Combo", price: "369", isVeg: false, description: "Any Exotic Chicken (7\") Pizza, Chicken Fries, Any Mocktel" },

    // NON VEG BURGER
    { name: "Chicken Burger", category: "Non Veg Burger", price: "99", isVeg: false },
    { name: "Cheesy Chicken Burger", category: "Non Veg Burger", price: "109", isVeg: false },
    { name: "Makhani Chicken Burger", category: "Non Veg Burger", price: "109", isVeg: false },
    { name: "Tandoori Chicken Burger", category: "Non Veg Burger", price: "119", isVeg: false },
    { name: "Spicy Chicken Burger", category: "Non Veg Burger", price: "119", isVeg: false },

    // NON VEG STARTERS
    { name: "Chicken Popcorn", category: "Non Veg Starters", price: "79", isVeg: false },
    { name: "Chicken Fries", category: "Non Veg Starters", price: "89", isVeg: false },
    { name: "Chicken Nuggets", category: "Non Veg Starters", price: "89", isVeg: false },
    { name: "Chicken Stuff Garlic Bread", category: "Non Veg Starters", price: "139", isVeg: false },

    // MOMOS NONVEG
    { name: "Chicken Momos", category: "Momos Nonveg", price: "99", isVeg: false },
    { name: "Chicken Peri Peri Momos", category: "Momos Nonveg", price: "109", isVeg: false },

    // SPECIAL CHICKEN WINGS
    { name: "Chicken Wings", category: "Special Chicken Wings", price: "159", isVeg: false },
    { name: "Peri Peri Chicken Wings", category: "Special Chicken Wings", price: "169", isVeg: false },

    // DESSERTS & EXTRAS
    { name: "Choco Lava Cake", category: "Desserts", price: "79", isVeg: true },

    // DELICIOUS VEG MENU
    // VEG PIZZA
    { name: "Margherita Pizza", category: "Veg Pizza", price: "109", isVeg: true, description: "Tomato Sauce, Fresh & Mozzarella Cheese" },
    { name: "Makhani Cheesy Pizza", category: "Veg Pizza", price: "129", isVeg: true, description: "Pure Makhani Sauce, Tomato's & Mozzarella Cheese" },
    { name: "Cheesy Corn Pizza", category: "Veg Pizza", price: "129", isVeg: true, description: "Tomato Sauce, Sweet Corn Mozzarella Cheese" },

    // CLASSIC VEG
    { name: "Farm Choice Pizza", category: "Classic Veg Pizza", price: "169", isVeg: true, description: "Onion, Capsicum, Tomato, Sweet Corn & Mozzarella Cheese" },
    { name: "Lovers Choice Pizza", category: "Classic Veg Pizza", price: "169", isVeg: true, description: "Onion, Capsicum, Tomato, Mushroom & Mozzarella Cheese" },
    { name: "Pepe Paneer Pizza", category: "Classic Veg Pizza", price: "169", isVeg: true, description: "Paneer, Onion, Tomato, Sweet Corn & Mozzarella Cheese" },
    { name: "Cheesy Mushroom Pizza", category: "Classic Veg Pizza", price: "169", isVeg: true, description: "Mushroom, Onion, Capsicum, Red Paprika & Mozzarella Cheese" },

    // SIGNATURE VEG
    { name: "Double Burst Pizza", category: "Signature Veg Pizza", price: "209", isVeg: true, description: "Double Layered Cheese & Mozzarella Cheese" },
    { name: "B.B.Q Paneer Pizza", category: "Signature Veg Pizza", price: "209", isVeg: true, description: "B.B.Q Sauce, Marinated Paneer, Onion, Capsicum" },
    { name: "Tandoori Paneer Pizza", category: "Signature Veg Pizza", price: "209", isVeg: true, description: "Tandoori Sauce, Marinated Paneer, Onion, Capsicum, Tomato, Red Paprika, Mozzarella Cheese" },
    { name: "Makhani Paneer Pizza", category: "Signature Veg Pizza", price: "209", isVeg: true, description: "Makhani Sauce, Marinated Paneer, Onion, Capsicum, Olive, Sweet Corn, Mozzarella Cheese" },
    { name: "Peri Peri Paneer Pizza", category: "Signature Veg Pizza", price: "209", isVeg: true, description: "Peri Peri Sauce, Marinated Paneer, Onion, Capsicum, Tomato, Green Chilly, Jalapeno, Mozzarella Cheese" },

    // EXOTIC VEG
    { name: "Spicy Paneer Pizza", category: "Exotic Veg Pizza", price: "239", isVeg: true, description: "Spicy Sauce, Marinated Paneer, Onion, Capsicum, Jalapeno, Red Paprika, Green Chilly, Mozzarella Cheese" },
    { name: "Veg Supremo Pizza", category: "Exotic Veg Pizza", price: "239", isVeg: true, description: "Onion, Capsicum, Tomato, Sweet Corn, Olive, Red Paprika, Mushroom & Mozzarella Cheese" },
    { name: "Veg Extravaganza Pizza", category: "Exotic Veg Pizza", price: "239", isVeg: true, description: "Onion, Capsicum, Tomato, Sweet Corn, Paneer, Jalapeno, Olive, Mushroom, Mozzarella Cheese" },

    // VEG PIZZA COMBO
    { name: "Margarita Pizza (7\") Combo", category: "Veg Pizza Combo", price: "239", isVeg: true, description: "Margarita Pizza (7\"), Peri Peri Fries / Tandoori Fries, Coke" },
    { name: "Any Classic Pizza (7\") Combo", category: "Veg Pizza Combo", price: "289", isVeg: true, description: "Any Classic Pizza (7\"), Peri Peri Fries / Tandoori Fries, Any Mocktel" },
    { name: "Any Signature Pizza (7\") Combo", category: "Veg Pizza Combo", price: "319", isVeg: true, description: "Any Signature Pizza (7\"), Peri Peri Fries / Tandoori Fries, Any Mocktel" },
    { name: "Any Exotic Pizza (7\") Combo", category: "Veg Pizza Combo", price: "369", isVeg: true, description: "Any Exotic Pizza (7\"), Peri Peri Fries / Tandoori Fries, Any Mocktel" },

    // VEG SANDWICH (NON GRILLED)
    { name: "Chutney Cheese Sandwich", category: "Veg Sandwich", price: "69", isVeg: true },
    { name: "Veg Cheese Sandwich", category: "Veg Sandwich", price: "89", isVeg: true },

    // GRILLED SANDWICH 2 SLICE
    { name: "Veg Cheese Grilled Sandwich", category: "Grilled Sandwich 2 Slice", price: "95", isVeg: true },
    { name: "Masala Cheese Grilled Sandwich", category: "Grilled Sandwich 2 Slice", price: "95", isVeg: true },
    { name: "Cheese Chilli Grilled Sandwich", category: "Grilled Sandwich 2 Slice", price: "95", isVeg: true },
    { name: "Garlic Cheese Grilled Sandwich", category: "Grilled Sandwich 2 Slice", price: "95", isVeg: true },
    { name: "Chocolate Grilled Sandwich", category: "Grilled Sandwich 2 Slice", price: "95", isVeg: true },
    { name: "Chee Chilli Garlic Grilled Sandwich", category: "Grilled Sandwich 2 Slice", price: "109", isVeg: true },

    // 3 SLICE SANDWICH
    { name: "Paneer Cheese Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Corn Cheese Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Kolhapuri Paneer Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Paneer Schezwan Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Tandoori Paneer Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Peri Peri Paneer Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Peri Peri Corn Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Makhani Paneer Grilled Sandwich", category: "3 Slice Sandwich", price: "109", isVeg: true },
    { name: "Mix Veg Grill Sandwich", category: "3 Slice Sandwich", price: "119", isVeg: true },

    // ADD ON
    { name: "Veg Topping", category: "Add On", price: "15", isVeg: true },
    { name: "Non Veg Topping", category: "Add On", price: "20", isVeg: false },
    { name: "Extra Cheese", category: "Add On", price: "49", isVeg: true },
    { name: "Cheese Burst", category: "Add On", price: "59", isVeg: true },
    { name: "Extra Cheese Slice", category: "Add On", price: "15", isVeg: true },

    // VEG STARTERS
    { name: "Chilly Garlic Shots", category: "Veg Starters", price: "79", isVeg: true },
    { name: "Salted Fries", category: "Veg Starters", price: "89", isVeg: true },
    { name: "Peri Peri Fries", category: "Veg Starters", price: "99", isVeg: true },
    { name: "Tandoori Fries", category: "Veg Starters", price: "99", isVeg: true },
    { name: "Cheesy Fries", category: "Veg Starters", price: "109", isVeg: true },
    { name: "Peri Peri Cheesy Fries", category: "Veg Starters", price: "109", isVeg: true },
    { name: "Tandoori Cheesy Fries", category: "Veg Starters", price: "109", isVeg: true },
    { name: "Harabhara Kawab", category: "Veg Starters", price: "99", isVeg: true },
    { name: "Onion Ring", category: "Veg Starters", price: "89", isVeg: true },
    { name: "Cheese Corn Pop", category: "Veg Starters", price: "89", isVeg: true },
    { name: "Chocolate Stuff Bread", category: "Veg Starters", price: "149", isVeg: true },
    { name: "Cheese Stuff Garlic Bread", category: "Veg Starters", price: "149", isVeg: true },
    { name: "Exotic Stuff Garlic Bread", category: "Veg Starters", price: "149", isVeg: true },

    // VEG PLATTER
    { name: "Veg Platter: Fries Chilly", category: "Veg Platter", price: "139", isVeg: true, description: "Garlic Shots, Onion Ring, Harabhara Kawab, Cheese Corn Pop" },

    // VEG BURGER
    { name: "Aloo Tikki Cheese Burger", category: "Veg Burger", price: "89", isVeg: true },
    { name: "Shezwan Cheese Burger", category: "Veg Burger", price: "119", isVeg: true },
    { name: "Cheese Chilli Burger", category: "Veg Burger", price: "119", isVeg: true },
    { name: "Italiyan Paneer Cheese Burger", category: "Veg Burger", price: "129", isVeg: true },
    { name: "Makhani Cheesy Burger", category: "Veg Burger", price: "129", isVeg: true },

    // MOMOS VEG
    { name: "Mix Veg Fried Momo", category: "Momos Veg", price: "99", isVeg: true },
    { name: "Peri Peri Momos", category: "Momos Veg", price: "99", isVeg: true },
    { name: "Paneer Momos", category: "Momos Veg", price: "99", isVeg: true },
    { name: "Paneer Peri Peri Momos", category: "Momos Veg", price: "109", isVeg: true },

    // COFFEE
    { name: "Hot Coffee", category: "Coffee", price: "25", isVeg: true },
    { name: "Thick Cold Coffee", category: "Coffee", price: "50", isVeg: true },
    { name: "Crush Thick Cold Coffee", category: "Coffee", price: "60", isVeg: true },

    // MOCKTAILS
    { name: "Blue Ocen Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Blueberry Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Kala Khata Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Mint Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Leman Ice Tea", category: "Mocktails", price: "69", isVeg: true },
    { name: "Green Apple Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Peach Ice Tea Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Watermelon Mojito", category: "Mocktails", price: "69", isVeg: true },
    { name: "Cold Drink", category: "Mocktails", price: "20", isVeg: true },
    { name: "Water Bottle", category: "Mocktails", price: "20", isVeg: true },

    // SINGLE TOPING DAILY OFFER
    { name: "Corn with Cheese Pizza (Daily Offer)", category: "Offers", price: "69", isVeg: true },
    { name: "Herb Chicken Pizza (Daily Offer)", category: "Offers", price: "89", isVeg: false }
];

async function seedBullsCafe() {
    console.log(`Adding ${menuItems.length} menu items to provider ${providerId}...`);
    let count = 0;
    for (const item of menuItems) {
        // use price as string since drizzle might use decimal -> string
        // actually price is decimal in restaurantMenuItems, so we should convert it. But passing string is fine for drizzle decimal
        await db.insert(restaurantMenuItems).values({
            providerId: providerId,
            name: item.name,
            category: item.category,
            price: item.price as any,
            isVeg: item.isVeg,
            isAvailable: true,
            description: item.description || `${item.category} item`,
            imageUrl: null
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} items to Bulls & Trader cafe`);
    process.exit(0);
}

seedBullsCafe().catch(console.error);
