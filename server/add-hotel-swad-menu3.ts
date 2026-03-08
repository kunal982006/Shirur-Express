import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const menuItems = [
    // === NON-VEG CHINESE RICE ===
    { name: "Chicken Fried Rice Half", category: "Chinese Rice", price: "80", isVeg: false },
    { name: "Chicken Fried Rice Full", category: "Chinese Rice", price: "130", isVeg: false },
    { name: "Chicken Schezwan Rice Half", category: "Chinese Rice", price: "90", isVeg: false },
    { name: "Chicken Schezwan Rice Full", category: "Chinese Rice", price: "140", isVeg: false },
    { name: "Chicken Triple Rice Half", category: "Chinese Rice", price: "130", isVeg: false },
    { name: "Chicken Triple Rice Full", category: "Chinese Rice", price: "180", isVeg: false },
    { name: "Anda Fried Rice Half", category: "Chinese Rice", price: "80", isVeg: false },
    { name: "Anda Fried Rice Full", category: "Chinese Rice", price: "130", isVeg: false },
    { name: "Anda Schezwan Fried Rice Half", category: "Chinese Rice", price: "80", isVeg: false },
    { name: "Anda Schezwan Fried Rice Full", category: "Chinese Rice", price: "130", isVeg: false },

    // === VEG CHINESE RICE ===
    { name: "Manchurian Fried Rice Half", category: "Chinese Rice", price: "80", isVeg: true },
    { name: "Manchurian Fried Rice Full", category: "Chinese Rice", price: "130", isVeg: true },
    { name: "Schezwan Fried Rice Half", category: "Chinese Rice", price: "90", isVeg: true },
    { name: "Schezwan Fried Rice Full", category: "Chinese Rice", price: "140", isVeg: true },
    { name: "Hakka Rice Half", category: "Chinese Rice", price: "100", isVeg: true },
    { name: "Hakka Rice Full", category: "Chinese Rice", price: "150", isVeg: true },
    { name: "Veg Triple Rice Half", category: "Chinese Rice", price: "100", isVeg: true },
    { name: "Veg Triple Rice Full", category: "Chinese Rice", price: "150", isVeg: true },

    // === NON-VEG CHINESE NOODLES ===
    { name: "Chicken Noodles Half", category: "Chinese Noodles", price: "80", isVeg: false },
    { name: "Chicken Noodles Full", category: "Chinese Noodles", price: "130", isVeg: false },
    { name: "Schezwan Chicken Noodles Half", category: "Chinese Noodles", price: "90", isVeg: false },
    { name: "Schezwan Chicken Noodles Full", category: "Chinese Noodles", price: "140", isVeg: false },
    { name: "Anda Noodles Half", category: "Chinese Noodles", price: "80", isVeg: false },
    { name: "Anda Noodles Full", category: "Chinese Noodles", price: "130", isVeg: false },
    { name: "Schezwan Anda Noodles Half", category: "Chinese Noodles", price: "90", isVeg: false },
    { name: "Schezwan Anda Noodles Full", category: "Chinese Noodles", price: "140", isVeg: false },
    { name: "Chicken Hakka Noodles Half", category: "Chinese Noodles", price: "100", isVeg: false },
    { name: "Chicken Hakka Noodles Full", category: "Chinese Noodles", price: "150", isVeg: false },
    { name: "Anda Hakka Noodles Half", category: "Chinese Noodles", price: "90", isVeg: false },
    { name: "Anda Hakka Noodles Full", category: "Chinese Noodles", price: "140", isVeg: false },
    { name: "Chicken Triple Noodles Half", category: "Chinese Noodles", price: "130", isVeg: false },
    { name: "Chicken Triple Noodles Full", category: "Chinese Noodles", price: "180", isVeg: false },

    // === VEG CHINESE NOODLES ===
    { name: "Veg Noodles Half", category: "Chinese Noodles", price: "80", isVeg: true },
    { name: "Veg Noodles Full", category: "Chinese Noodles", price: "130", isVeg: true },
    { name: "Schezwan Veg Noodles Half", category: "Chinese Noodles", price: "90", isVeg: true },
    { name: "Schezwan Veg Noodles Full", category: "Chinese Noodles", price: "140", isVeg: true },
    { name: "Hakka Noodles Half", category: "Chinese Noodles", price: "90", isVeg: true },
    { name: "Hakka Noodles Full", category: "Chinese Noodles", price: "140", isVeg: true },
    { name: "Veg Triple Noodles Half", category: "Chinese Noodles", price: "100", isVeg: true },
    { name: "Veg Triple Noodles Full", category: "Chinese Noodles", price: "140", isVeg: true },

    // === NON-VEG SOUP ===
    { name: "Mutton Soup", category: "Soup", price: "80", isVeg: false },
    { name: "Chicken Soup", category: "Soup", price: "50", isVeg: false },
    { name: "Chicken Manchow Soup", category: "Soup", price: "70", isVeg: false },

    // === VEG SOUP ===
    { name: "Veg Soup", category: "Soup", price: "60", isVeg: true },

    // === PRAWNS ===
    { name: "Prawns 65", category: "Prawns", price: "250", isVeg: false },
    { name: "Prawns Chilly", category: "Prawns", price: "270", isVeg: false },
];

async function seedSwadHotelPart3() {
    console.log("Adding Chinese, Soups, and Prawns to Hotel Swad...");

    const username = "Hotel Swad";
    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    if (!user) {
        console.error("Hotel Swad user not found!");
        process.exit(1);
    }

    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, user.id),
    });

    if (!provider) {
        console.error("Hotel Swad provider not found!");
        process.exit(1);
    }

    const providerId = provider.id;

    console.log(`Adding ${menuItems.length} menu items to provider ${providerId}...`);
    let count = 0;
    for (const item of menuItems) {
        await db.insert(restaurantMenuItems).values({
            providerId: providerId,
            name: item.name,
            category: item.category,
            price: item.price,
            isVeg: item.isVeg,
            isAvailable: true,
            description: `${item.category} item`
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} additional items to Hotel Swad (Part 3)`);
    process.exit(0);
}

seedSwadHotelPart3().catch(console.error);
