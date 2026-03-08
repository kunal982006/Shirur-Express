
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { ilike } from "drizzle-orm";

const menuItems = [
    // ===== MOMOS =====
    { name: "Veg Momos", category: "Momos", price: "60", isVeg: true },
    { name: "Non-Veg Momos", category: "Momos", price: "80", isVeg: false },
    { name: "Veg Fried Momos", category: "Momos", price: "80", isVeg: true },
    { name: "Non-Veg Fried Momos", category: "Momos", price: "100", isVeg: false },

    // ===== NOODLES =====
    { name: "Veg Hakka Noodles", category: "Noodles", price: "60", isVeg: true },
    { name: "Non-Veg Hakka Noodles", category: "Noodles", price: "110", isVeg: false },
    { name: "Veg Schezwan Noodles", category: "Noodles", price: "60", isVeg: true },
    { name: "Non-Veg Schezwan Noodles", category: "Noodles", price: "110", isVeg: false },
    { name: "Veg Manchow Noodles", category: "Noodles", price: "60", isVeg: true },
    { name: "Non-Veg Manchow Noodles", category: "Noodles", price: "110", isVeg: false },
    { name: "Veg Triple Noodles", category: "Noodles", price: "90", isVeg: true },
    { name: "Non-Veg Triple Noodles", category: "Noodles", price: "140", isVeg: false },

    // ===== SOUP =====
    { name: "Veg Manchow Soup", category: "Soup", price: "50", isVeg: true },
    { name: "Non-Veg Manchow Soup", category: "Soup", price: "50", isVeg: false },
    { name: "Veg Garlic Soup", category: "Soup", price: "60", isVeg: true },
    { name: "Mix Veg Soup", category: "Soup", price: "50", isVeg: true },
    { name: "Paneer Soup", category: "Soup", price: "60", isVeg: true },
    { name: "Mushroom Soup", category: "Soup", price: "60", isVeg: true },

    // ===== RICE =====
    { name: "Veg Fried Rice", category: "Rice", price: "50", isVeg: true },
    { name: "Non-Veg Fried Rice", category: "Rice", price: "110", isVeg: false },
    { name: "Veg Schezwan Rice", category: "Rice", price: "60", isVeg: true },
    { name: "Non-Veg Schezwan Rice", category: "Rice", price: "110", isVeg: false },
    { name: "Veg Triple Rice", category: "Rice", price: "90", isVeg: true },
    { name: "Non-Veg Triple Rice", category: "Rice", price: "140", isVeg: false },
    { name: "Veg Pulao", category: "Rice", price: "80", isVeg: true },

    // ===== LOLLIPOP =====
    { name: "Chicken Lollipop + Chutney (Half)", category: "Lollipop", price: "70", isVeg: false },
    { name: "Chicken Lollipop + Chutney (Full)", category: "Lollipop", price: "130", isVeg: false },
    { name: "Machhi Pakoda + Chutney", category: "Lollipop", price: "130", isVeg: false },

    // ===== DISHES =====
    { name: "Veg Manchurian (Half)", category: "Dishes", price: "60", isVeg: true },
    { name: "Veg Manchurian (Full)", category: "Dishes", price: "110", isVeg: true },
    { name: "Veg Paneer Chilli (Half)", category: "Dishes", price: "90", isVeg: true },
    { name: "Veg Paneer Chilli (Full)", category: "Dishes", price: "160", isVeg: true },
    { name: "Chicken Chilli (Half)", category: "Dishes", price: "80", isVeg: false },
    { name: "Chicken Chilli (Full)", category: "Dishes", price: "140", isVeg: false },
    { name: "Chicken Manchurian", category: "Dishes", price: "140", isVeg: false },

    // ===== SPECIAL BIRYANI =====
    { name: "Aditya Special Biryani (1 Egg, Kokam Sarbat, Chicken Soup, Raita)", category: "Special Biryani", price: "130", isVeg: false },
];

async function seedHotelAditya() {
    console.log("Looking for 'Hotel Aditya' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Aditya%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Aditya' provider not found!");
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
            isVeg: item.isVeg,
            isAvailable: true,
            description: item.category
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} items to ${provider.businessName}`);
    process.exit(0);
}

seedHotelAditya().catch((err) => {
    console.error("Error seeding Hotel Aditya:", err);
    process.exit(1);
});
