
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { ilike } from "drizzle-orm";

const menuItems = [
    // ===== COLD DRINKS =====
    { name: "Dahi Wati", category: "Cold Drinks", price: "25", isVeg: true },
    { name: "Butter Milk", category: "Cold Drinks", price: "40", isVeg: true },
    { name: "Lassi", category: "Cold Drinks", price: "50", isVeg: true },

    // ===== UPVASS =====
    { name: "Shabudana Khichdi", category: "Upvass", price: "70", isVeg: true },
    { name: "Finger Chips", category: "Upvass", price: "80", isVeg: true },

    // ===== RAYTA =====
    { name: "Veg Rayata", category: "Rayta", price: "80", isVeg: true },
    { name: "Onion Rayata", category: "Rayta", price: "80", isVeg: true },
    { name: "Alu Rayata", category: "Rayta", price: "80", isVeg: true },

    // ===== SOUP =====
    { name: "Cream of Tomato Soup", category: "Soup", price: "80", isVeg: true },
    { name: "Veg Manchow Soup", category: "Soup", price: "80", isVeg: true },
    { name: "Veg Hot & Sour Soup", category: "Soup", price: "90", isVeg: true },
    { name: "Veg Clear Soup", category: "Soup", price: "90", isVeg: true },
    { name: "Cream of Mushroom Soup", category: "Soup", price: "90", isVeg: true },
    { name: "Sweetcorn Soup", category: "Soup", price: "90", isVeg: true },

    // ===== STARTER =====
    { name: "Soyabin Chilly", category: "Starter", price: "130", isVeg: true },
    { name: "Veg Manchuriyan", category: "Starter", price: "150", isVeg: true },
    { name: "Paneer Chilly", category: "Starter", price: "160", isVeg: true },
    { name: "Paneer Manchuriyan", category: "Starter", price: "180", isVeg: true },
    { name: "Gobi Manchuriyan", category: "Starter", price: "170", isVeg: true },
    { name: "Gobi Chilly", category: "Starter", price: "170", isVeg: true },
    { name: "Mushroom Manchuriyan", category: "Starter", price: "180", isVeg: true },
    { name: "Mushroom Chilly", category: "Starter", price: "180", isVeg: true },
    { name: "Gobi Sixtyfive", category: "Starter", price: "170", isVeg: true },
    { name: "Mushroom Chilly Garlic", category: "Starter", price: "190", isVeg: true },
    { name: "Veg Crispy", category: "Starter", price: "180", isVeg: true },
    { name: "Paneer Crispy", category: "Starter", price: "190", isVeg: true },
    { name: "Paneer Sixtyfive", category: "Starter", price: "180", isVeg: true },
    { name: "Babycorn Crispy", category: "Starter", price: "180", isVeg: true },
    { name: "Babycorn Chilly", category: "Starter", price: "180", isVeg: true },

    // ===== VEG MAIN COURSE =====
    { name: "Plain Dal", category: "Veg", price: "100", isVeg: true },
    { name: "Dal Fry", category: "Veg", price: "100", isVeg: true },
    { name: "Dal Tadka", category: "Veg", price: "100", isVeg: true },
    { name: "Butter Dal Fry", category: "Veg", price: "110", isVeg: true },
    { name: "Dal Kolhapuri", category: "Veg", price: "110", isVeg: true },
    { name: "Dal Kolhapuri Tadka", category: "Veg", price: "110", isVeg: true },
    { name: "Alu Jeera", category: "Veg", price: "140", isVeg: true },
    { name: "Alu Masala", category: "Veg", price: "110", isVeg: true },
    { name: "Alu Palak", category: "Veg", price: "130", isVeg: true },
    { name: "Alu Mutter", category: "Veg", price: "120", isVeg: true },
    { name: "Chana Masala", category: "Veg", price: "110", isVeg: true },
    { name: "Chana Fry", category: "Veg", price: "110", isVeg: true },
    { name: "Greenpeace Masala", category: "Veg", price: "120", isVeg: true },
    { name: "Greenpeace Fry", category: "Veg", price: "130", isVeg: true },
    { name: "Bhendi Fry", category: "Veg", price: "130", isVeg: true },
    { name: "Bhendi Masala", category: "Veg", price: "120", isVeg: true },
    { name: "Matki Masala", category: "Veg", price: "120", isVeg: true },
    { name: "Matki Fry", category: "Veg", price: "140", isVeg: true },
    { name: "Baingain Masala", category: "Veg", price: "120", isVeg: true },
    { name: "Shevbhaji", category: "Veg", price: "100", isVeg: true },
    { name: "Milk Shevbhaji", category: "Veg", price: "120", isVeg: true },
    { name: "Shevtamatar", category: "Veg", price: "130", isVeg: true },
    { name: "Dumalu Punjabi", category: "Veg", price: "170", isVeg: true },
    { name: "Mutter Mushroom", category: "Veg", price: "170", isVeg: true },
    { name: "Mushroom Masala", category: "Veg", price: "150", isVeg: true },
    { name: "Mushroom Curry", category: "Veg", price: "150", isVeg: true },
    { name: "Veg Amrutsari", category: "Veg", price: "200", isVeg: true },
    { name: "Methi Paneer Chaman", category: "Veg", price: "200", isVeg: true },
    { name: "Greenpeace Palak", category: "Veg", price: "140", isVeg: true },
    { name: "Paneer Lahori", category: "Veg", price: "200", isVeg: true },
    { name: "Veg Kofta", category: "Veg", price: "180", isVeg: true },
    { name: "Paneer Kofta", category: "Veg", price: "200", isVeg: true },
    { name: "Malai Kofta", category: "Veg", price: "200", isVeg: true },
    { name: "Veg Maratha", category: "Veg", price: "160", isVeg: true },
    { name: "Veg Kadhai", category: "Veg", price: "170", isVeg: true },
    { name: "Methi Masala", category: "Veg", price: "120", isVeg: true },
    { name: "Methi Fry", category: "Veg", price: "140", isVeg: true },
    { name: "Veg Hydrabadi", category: "Veg", price: "180", isVeg: true },
    { name: "Paneer Tava", category: "Veg", price: "180", isVeg: true },
    { name: "Mutter Paneer", category: "Veg", price: "150", isVeg: true },
    { name: "Palak Paneer", category: "Veg", price: "150", isVeg: true },
    { name: "Paneer Masala", category: "Veg", price: "120", isVeg: true },
    { name: "Paneer Bhurji", category: "Veg", price: "170", isVeg: true },
    { name: "Paneer Butter Masala", category: "Veg", price: "170", isVeg: true },
    { name: "Paneer Pasinda", category: "Veg", price: "200", isVeg: true },
    { name: "Paneer Tikka Masala", category: "Veg", price: "180", isVeg: true },
    { name: "Paneer Chatapata", category: "Veg", price: "190", isVeg: true },
    { name: "Paneer Kadhai", category: "Veg", price: "160", isVeg: true },
    { name: "Paneer Mushroom", category: "Veg", price: "190", isVeg: true },
    { name: "Paneer Makkhanwala", category: "Veg", price: "190", isVeg: true },
    { name: "Paneer Hydrabadi", category: "Veg", price: "190", isVeg: true },
    { name: "Paneer Hariyali", category: "Veg", price: "190", isVeg: true },
    { name: "Kaju Paneer", category: "Veg", price: "180", isVeg: true },
    { name: "Shyam Sabera", category: "Veg", price: "250", isVeg: true },
    { name: "Veg Garden", category: "Veg", price: "250", isVeg: true },
    { name: "Kaju Mushroom", category: "Veg", price: "180", isVeg: true },
    { name: "Kaju Curry", category: "Veg", price: "160", isVeg: true },
    { name: "Kaju Masala", category: "Veg", price: "160", isVeg: true },
    { name: "Akkha Masoor", category: "Veg", price: "110", isVeg: true },
    { name: "Akkha Masoor Fry", category: "Veg", price: "110", isVeg: true },
    { name: "Besan (Pithala)", category: "Veg", price: "120", isVeg: true },
    { name: "Soyabean Fry", category: "Veg", price: "120", isVeg: true },
    { name: "Soyabean Masala", category: "Veg", price: "110", isVeg: true },
    { name: "Plain Palak", category: "Veg", price: "120", isVeg: true },
    { name: "Lasuni Palak", category: "Veg", price: "140", isVeg: true },
    { name: "Veg Chatapata", category: "Veg", price: "170", isVeg: true },
    { name: "Veg Malwani", category: "Veg", price: "180", isVeg: true },
    { name: "Mix Veg", category: "Veg", price: "120", isVeg: true },
    { name: "Veg Kolhapuri", category: "Veg", price: "130", isVeg: true },
    { name: "Veg Jaypuri", category: "Veg", price: "160", isVeg: true },
    { name: "Veg Bhuna", category: "Veg", price: "150", isVeg: true },
    { name: "Paneer Kolhapuri", category: "Veg", price: "150", isVeg: true },
    { name: "Veg Hariyali", category: "Veg", price: "180", isVeg: true },
    { name: "Veg Tava", category: "Veg", price: "170", isVeg: true },
    { name: "Veg Makkhanwala", category: "Veg", price: "180", isVeg: true },
    { name: "Veg Tiranga", category: "Veg", price: "230", isVeg: true },

    // ===== SPECIAL DISHES =====
    { name: "Paneer Chingari", category: "Special Dishes", price: "210", isVeg: true },
    { name: "Paneer Sultana", category: "Special Dishes", price: "220", isVeg: true },
    { name: "Paneer Jojo", category: "Special Dishes", price: "300", isVeg: true },
    { name: "Paneer Angara", category: "Special Dishes", price: "190", isVeg: true },
    { name: "Paneer Tufani", category: "Special Dishes", price: "200", isVeg: true },
    { name: "Paneer Patiyala", category: "Special Dishes", price: "200", isVeg: true },
    { name: "Veg Patiyala", category: "Special Dishes", price: "180", isVeg: true },
    { name: "Veg Angara", category: "Special Dishes", price: "180", isVeg: true },
    { name: "Veg Special", category: "Special Dishes", price: "210", isVeg: true },
    { name: "Veg Firangi", category: "Special Dishes", price: "230", isVeg: true },
    { name: "Kaju Paneer Tufani", category: "Special Dishes", price: "200", isVeg: true },
    { name: "Paneer Lababdar", category: "Special Dishes", price: "220", isVeg: true },

    // ===== HANDI SPECIAL =====
    { name: "Paneer Handi Full", category: "Handi Special", price: "330", isVeg: true },
    { name: "Paneer Handi Half", category: "Handi Special", price: "190", isVeg: true },
    { name: "Kaju Handi Full", category: "Handi Special", price: "360", isVeg: true },
    { name: "Kaju Handi Half", category: "Handi Special", price: "190", isVeg: true },
    { name: "Veg Handi Full", category: "Handi Special", price: "300", isVeg: true },
    { name: "Veg Handi Half", category: "Handi Special", price: "170", isVeg: true },
    { name: "Dal Tadka Handi Full", category: "Handi Special", price: "270", isVeg: true },
    { name: "Dal Tadka Handi Half", category: "Handi Special", price: "150", isVeg: true },
    { name: "Alu Mutter Handi Full", category: "Handi Special", price: "270", isVeg: true },
    { name: "Alu Mutter Handi Half", category: "Handi Special", price: "150", isVeg: true },
    { name: "Greenpeace Masala Handi Full", category: "Handi Special", price: "270", isVeg: true },
    { name: "Greenpeace Masala Handi Half", category: "Handi Special", price: "150", isVeg: true },
    { name: "Shevbhaji Handi Full", category: "Handi Special", price: "280", isVeg: true },
    { name: "Shevbhaji Handi Half", category: "Handi Special", price: "150", isVeg: true },
    { name: "Mutter Paneer Handi Full", category: "Handi Special", price: "330", isVeg: true },
    { name: "Mutter Paneer Handi Half", category: "Handi Special", price: "190", isVeg: true },
    { name: "Kaju Paneer Handi Full", category: "Handi Special", price: "360", isVeg: true },
    { name: "Kaju Paneer Handi Half", category: "Handi Special", price: "200", isVeg: true },
    { name: "Veg Kolhapuri Handi Full", category: "Handi Special", price: "320", isVeg: true },
    { name: "Veg Kolhapuri Handi Half", category: "Handi Special", price: "180", isVeg: true },
    { name: "Veg Maratha Handi Full", category: "Handi Special", price: "340", isVeg: true },
    { name: "Veg Maratha Handi Half", category: "Handi Special", price: "180", isVeg: true },
    { name: "Veg Divani Handi Full", category: "Handi Special", price: "380", isVeg: true },
    { name: "Veg Divani Handi Half", category: "Handi Special", price: "200", isVeg: true },
    { name: "Paneer Butter Handi Full", category: "Handi Special", price: "380", isVeg: true },
    { name: "Paneer Butter Handi Half", category: "Handi Special", price: "200", isVeg: true },
    { name: "Paneer Chingari Handi Full", category: "Handi Special", price: "360", isVeg: true },
    { name: "Paneer Chingari Handi Half", category: "Handi Special", price: "220", isVeg: true },

    // ===== CHINESE RICE =====
    { name: "Veg Fried Rice", category: "Chinese Rice", price: "140", isVeg: true },
    { name: "Veg Garlic Fried Rice", category: "Chinese Rice", price: "140", isVeg: true },
    { name: "Veg Mushroom Fried Rice", category: "Chinese Rice", price: "150", isVeg: true },
    { name: "Paneer Fried Rice", category: "Chinese Rice", price: "150", isVeg: true },
    { name: "Mushroom Fried Rice", category: "Chinese Rice", price: "150", isVeg: true },

    // ===== THALI =====
    { name: "Punjabi Thali (Limited)", category: "Thali", price: "180", isVeg: true },
    { name: "Maharashtrian Thali (Limited)", category: "Thali", price: "220", isVeg: true },
    { name: "Hotel Gurukrupa Special Thali (Limited)", category: "Thali", price: "260", isVeg: true },
    { name: "Semi Special Thali", category: "Thali", price: "200", isVeg: true },
    { name: "Special Thali", category: "Thali", price: "240", isVeg: true },
];

async function seedHotelGurukrupa() {
    console.log("Looking for 'Hotel Gurukrupa' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Gurukrupa%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Gurukrupa' provider not found!");
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

seedHotelGurukrupa().catch((err) => {
    console.error("Error seeding Hotel Gurukrupa:", err);
    process.exit(1);
});
