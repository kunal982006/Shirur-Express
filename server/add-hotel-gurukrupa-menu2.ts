
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { ilike } from "drizzle-orm";

const menuItems = [
    // ===== VEG (Sides / Extras) =====
    { name: "Tamatar Chatani", category: "Veg", price: "120", isVeg: true },
    { name: "Mirchi Thecha", category: "Veg", price: "30", isVeg: true },
    { name: "Rassa Plate", category: "Veg", price: "80", isVeg: true },
    { name: "Green Salad", category: "Veg", price: "40", isVeg: true },
    { name: "Dal Wati", category: "Veg", price: "35", isVeg: true },

    // ===== SPECIAL KALA MASALA =====
    { name: "Mutter Paneer Kala Masala", category: "Special Kala Masala", price: "160", isVeg: true },
    { name: "Baingain Kala Masala", category: "Special Kala Masala", price: "130", isVeg: true },
    { name: "Greenpeace Kala Masala", category: "Special Kala Masala", price: "140", isVeg: true },
    { name: "Mataki Kala Masala", category: "Special Kala Masala", price: "130", isVeg: true },
    { name: "Chana Kala Masala", category: "Special Kala Masala", price: "130", isVeg: true },
    { name: "Shevbhaji Kala Masala", category: "Special Kala Masala", price: "130", isVeg: true },
    { name: "Soyabean Kala Masala", category: "Special Kala Masala", price: "130", isVeg: true },
    { name: "Mixveg Kala Masala", category: "Special Kala Masala", price: "150", isVeg: true },
    { name: "Shevbhaji Kala Masala Handi (Full)", category: "Special Kala Masala", price: "300", isVeg: true },
    { name: "Veg Kala Masala Handi (Full)", category: "Special Kala Masala", price: "320", isVeg: true },
    { name: "Mutter Paneer Kala Masala Handi", category: "Special Kala Masala", price: "340", isVeg: true },

    // ===== RICE =====
    { name: "Plain Rice", category: "Rice", price: "90", isVeg: true },
    { name: "Plain Rice (Half)", category: "Rice", price: "50", isVeg: true },
    { name: "Jira Rice", category: "Rice", price: "100", isVeg: true },
    { name: "Jira Rice (Half)", category: "Rice", price: "50", isVeg: true },
    { name: "Dal Khichadi", category: "Rice", price: "130", isVeg: true },
    { name: "Dal Palak Khichadi", category: "Rice", price: "140", isVeg: true },
    { name: "Kurd Rice", category: "Rice", price: "130", isVeg: true },
    { name: "Lemon Rice", category: "Rice", price: "130", isVeg: true },
    { name: "Veg Pulav", category: "Rice", price: "140", isVeg: true },
    { name: "Veg Biryani", category: "Rice", price: "170", isVeg: true },
    { name: "Masala Rice", category: "Rice", price: "130", isVeg: true },
    { name: "Green Pice Pulav", category: "Rice", price: "130", isVeg: true },
    { name: "Steam Rice", category: "Rice", price: "90", isVeg: true },
    { name: "Steam Rice (Half)", category: "Rice", price: "50", isVeg: true },
    { name: "Paneer Pulav", category: "Rice", price: "150", isVeg: true },

    // ===== TANDUR =====
    { name: "Tanduri Roti", category: "Tandur", price: "10", isVeg: true },
    { name: "Butter Roti", category: "Tandur", price: "15", isVeg: true },
    { name: "Wheat Roti", category: "Tandur", price: "15", isVeg: true },
    { name: "Chapati", category: "Tandur", price: "20", isVeg: true },
    { name: "Bajari Bhakari", category: "Tandur", price: "20", isVeg: true },
    { name: "Wheat Butter Roti", category: "Tandur", price: "20", isVeg: true },
    { name: "Plain Parotha", category: "Tandur", price: "40", isVeg: true },
    { name: "Alu Butter Parotha", category: "Tandur", price: "70", isVeg: true },
    { name: "Butter Parotha", category: "Tandur", price: "50", isVeg: true },
    { name: "Paneer Parotha", category: "Tandur", price: "80", isVeg: true },
    { name: "Plain Kulcha", category: "Tandur", price: "45", isVeg: true },
    { name: "Butter Kulcha", category: "Tandur", price: "50", isVeg: true },
    { name: "Plain Nan", category: "Tandur", price: "40", isVeg: true },
    { name: "Butter Nan", category: "Tandur", price: "45", isVeg: true },
    { name: "Garlic Nan", category: "Tandur", price: "60", isVeg: true },
    { name: "Butter Bhakari", category: "Tandur", price: "25", isVeg: true },
    { name: "Butter Chapati", category: "Tandur", price: "25", isVeg: true },

    // ===== PAPAD =====
    { name: "Rosted Papad", category: "Papad", price: "20", isVeg: true },
    { name: "Fry Papad", category: "Papad", price: "20", isVeg: true },
    { name: "Masala Papad", category: "Papad", price: "25", isVeg: true },
];

async function seedHotelGurukrupaExtra() {
    console.log("Looking for 'Hotel Gurukrupa' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Gurukrupa%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Gurukrupa' provider not found!");
        process.exit(1);
    }

    console.log(`✅ Found provider: ${provider.businessName} (ID: ${provider.id})`);
    console.log(`Adding ${menuItems.length} additional menu items...`);

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

    console.log(`🎉 Successfully added ${count} additional items to ${provider.businessName}`);
    process.exit(0);
}

seedHotelGurukrupaExtra().catch((err) => {
    console.error("Error seeding Hotel Gurukrupa (extra):", err);
    process.exit(1);
});
