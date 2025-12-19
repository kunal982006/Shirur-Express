import "dotenv/config";
import { storage } from "../server/storage";
import * as fs from 'fs';


async function seedPizzaBurgerExpress() {
    const log = (msg: string) => fs.appendFileSync('seed_debug.txt', msg + '\n');
    log("Seeding Pizza Burger Express...");

    try {
        // 1. Get Category
        const categories = await storage.getServiceCategories();
        const restaurantCategory = categories.find(c => c.slug === "restaurants");
        if (!restaurantCategory) {
            throw new Error("Restaurant category not found");
        }
        log("Restaurant Category ID: " + restaurantCategory.id);

        // 2. Find or Create Provider
        let provider = null;
        let user = null;

        // Try to find by explicit username assumption or business name check
        // Since we don't have a direct search by business name, we'll try to create a specific user 
        // and if it fails (unique constraint), we'll fetch it.
        const username = "pizza_burger_express_owner";
        const email = "pizza_burger_express@shirur.com";

        user = await storage.getUserByUsername(username);

        if (!user) {
            log("Creating new user for Pizza Burger Express...");
            user = await storage.createUser({
                username: username,
                password: "password123", // Default password
                role: "provider",
                phone: "9876543210", // Placeholder
                email: email,
                address: "Shirur"
            });
        } else {
            log("User found: " + user.id);
        }

        // Check if provider exists for this user
        provider = await storage.getProviderByUserId(user.id);

        if (!provider) {
            log("Creating Service Provider profile...");
            provider = await storage.createServiceProvider({
                userId: user.id,
                categoryId: restaurantCategory.id,
                businessName: "Pizza Burger Express Shirur",
                description: "Delicious Pizza and Burgers in Shirur",
                address: "Shirur Main Road",
                experience: 5,
                specializations: ["Pizza", "Burger", "Fast Food"],

            });
        }
        log("Provider ID: " + provider.id);

        // 3. Add Menu Items
        const menuItems = [
            // Veg Pizza
            { name: "Marghrita Pizza (Reg)", price: 119, category: "Veg Pizza", isVeg: true },
            { name: "Marghrita Pizza (Medium)", price: 189, category: "Veg Pizza", isVeg: true },
            { name: "Chesse And Corn (Reg)", price: 139, category: "Veg Pizza", isVeg: true },
            { name: "Chesse And Corn (Medium)", price: 199, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Feast (Reg)", price: 139, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Feast (Medium)", price: 199, category: "Veg Pizza", isVeg: true },
            { name: "Spiced Panner (Reg)", price: 149, category: "Veg Pizza", isVeg: true },
            { name: "Spiced Panner (Medium)", price: 219, category: "Veg Pizza", isVeg: true },
            { name: "Garden Veggie (Reg)", price: 169, category: "Veg Pizza", isVeg: true },
            { name: "Garden Veggie (Medium)", price: 229, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Lover (Reg)", price: 179, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Lover (Medium)", price: 239, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Suprim (Reg)", price: 189, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Suprim (Medium)", price: 249, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Exotic (Reg)", price: 199, category: "Veg Pizza", isVeg: true },
            { name: "Veggie Exotic (Medium)", price: 259, category: "Veg Pizza", isVeg: true },
            { name: "Double Panner Sup (Reg)", price: 219, category: "Veg Pizza", isVeg: true },
            { name: "Double Panner Sup (Medium)", price: 279, category: "Veg Pizza", isVeg: true },

            // Moms
            { name: "Veg Fried Momos", price: 79, category: "Moms", isVeg: true },

            // Pizza Combo
            { name: "Box of Two (Spiced Panner + Corn & Chesse)", price: 249, category: "Pizza Combo", isVeg: true },

            // Box of For
            { name: "Box of Four (Marghrita, Corn & Chesse, Veggi Feast, Spiced Paneer)", price: 549, category: "Box of For", isVeg: true },

            // Burger S
            { name: "Clasic Burger", price: 89, category: "Burger S", isVeg: true },
            { name: "Crispy Veg", price: 99, category: "Burger S", isVeg: true },
            { name: "Mexican", price: 119, category: "Burger S", isVeg: true },
            { name: "Jumbo", price: 139, category: "Burger S", isVeg: true },
            { name: "Double Patty Mahi", price: 159, category: "Burger S", isVeg: true },

            // Burger Combo
            { name: "Clasic Burger + French Fries", price: 139, category: "Burger Combo", isVeg: true },
            { name: "Crispy Veg + Frech Fries + Pepsi", price: 189, category: "Burger Combo", isVeg: true },
            { name: "Jumbo Burger + Fries + Pepsi", price: 219, category: "Burger Combo", isVeg: true },

            // Extra S
            { name: "Chesse (Reg)", price: 29, category: "Extra S", isVeg: true },
            { name: "Chesse (Medium)", price: 49, category: "Extra S", isVeg: true },
            { name: "Chesse Slice", price: 20, category: "Extra S", isVeg: true },
            { name: "Mayonise Dip", price: 30, category: "Extra S", isVeg: true },
            { name: "Extra Veggi (Reg)", price: 19, category: "Extra S", isVeg: true },
            { name: "Extra Veggi (Medium)", price: 29, category: "Extra S", isVeg: true },
            { name: "Panner (Reg)", price: 19, category: "Extra S", isVeg: true },
            { name: "Panner (Medium)", price: 29, category: "Extra S", isVeg: true },
            { name: "Chesse Brust (Reg)", price: 39, category: "Extra S", isVeg: true },
            { name: "Chesse Brust (Medium)", price: 49, category: "Extra S", isVeg: true },

            // Fries
            { name: "Sated Fries", price: 59, category: "Fries", isVeg: true },
            { name: "Peri Peri Fries", price: 89, category: "Fries", isVeg: true },
            { name: "Nachos", price: 69, category: "Fries", isVeg: true },
            { name: "Masala Nachos", price: 89, category: "Fries", isVeg: true },
        ];

        // Clear existing items for this provider to avoid duplicates?
        // Actually, let's just add them. If I run it more than once, I might get duplicates.
        // For now, I will delete all items for this provider before adding.

        console.log("Clearing existing menu items...");
        const existingItems = await storage.getRestaurantMenuItems(provider.id);
        for (const item of existingItems) {
            await storage.deleteMenuItem(item.id, provider.id, "restaurants");
        }

        log("Adding new menu items...");
        for (const item of menuItems) {
            await storage.createMenuItem(item, provider.id, "restaurants");
            log(`Added: ${item.name}`);
        }

        log("Seed completed successfully!");
        process.exit(0);
    } catch (error) {
        log("Seeding failed: " + error);
        process.exit(1);
    }

}

seedPizzaBurgerExpress();
