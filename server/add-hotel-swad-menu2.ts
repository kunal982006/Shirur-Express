import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const menuItems = [
    // === VEG MAIN COURSE ===
    { name: "Paneer Masala", category: "Veg", price: "140", isVeg: true },
    { name: "Butter Paneer Masala", category: "Veg", price: "160", isVeg: true },
    { name: "Palak Paneer", category: "Veg", price: "160", isVeg: true },
    { name: "Kaju Paneer Masala", category: "Veg", price: "180", isVeg: true },
    { name: "Kaju Masala", category: "Veg", price: "160", isVeg: true },
    { name: "Kaju Curry", category: "Veg", price: "140", isVeg: true },
    { name: "Mutter Paneer", category: "Veg", price: "140", isVeg: true },
    { name: "Paneer Bhurji", category: "Veg", price: "160", isVeg: true },
    { name: "Veg Kolhapuri", category: "Veg", price: "140", isVeg: true },
    { name: "Shev Bhaji", category: "Veg", price: "110", isVeg: true },
    { name: "Green Peas Masala", category: "Veg", price: "130", isVeg: true },
    { name: "Veg Maratha", category: "Veg", price: "180", isVeg: true },
    { name: "Mushroom Masala", category: "Veg", price: "200", isVeg: true },
    { name: "Mix Veg", category: "Veg", price: "140", isVeg: true },
    { name: "Baingan Masala", category: "Veg", price: "130", isVeg: true },
    { name: "Matki Fry", category: "Veg", price: "150", isVeg: true },
    { name: "Dal Fry", category: "Veg", price: "100", isVeg: true },
    { name: "Dal Tadka", category: "Veg", price: "120", isVeg: true },
    { name: "Dal Khichdi", category: "Veg", price: "140", isVeg: true },
    { name: "Dal Khichdi Tadka", category: "Veg", price: "150", isVeg: true },
    { name: "Akkha Masoor", category: "Veg", price: "130", isVeg: true },
    { name: "Methi Masala", category: "Veg", price: "130", isVeg: true },
    { name: "Soyabean Masala", category: "Veg", price: "130", isVeg: true },
    { name: "Lasun Methi", category: "Veg", price: "150", isVeg: true },
    { name: "Aloo Mutter Masala", category: "Veg", price: "110", isVeg: true },

    // === VEG HANDI ===
    { name: "Veg Handi Half", category: "Handi Special", price: "330", isVeg: true },
    { name: "Veg Handi Full", category: "Handi Special", price: "530", isVeg: true },
    { name: "Paneer Handi Half", category: "Handi Special", price: "370", isVeg: true },
    { name: "Paneer Handi Full", category: "Handi Special", price: "550", isVeg: true },
    { name: "Green Peas Handi Half", category: "Handi Special", price: "350", isVeg: true },
    { name: "Green Peas Handi Full", category: "Handi Special", price: "490", isVeg: true },

    // === CHICKEN (NON-VEG) ===
    { name: "Chicken Masala", category: "Chicken", price: "190", isVeg: false },
    { name: "Chicken Curry", category: "Chicken", price: "180", isVeg: false },
    { name: "Chicken Kolhapuri", category: "Chicken", price: "190", isVeg: false },
    { name: "Butter Chicken (Sweet)", category: "Chicken", price: "210", isVeg: false },
    { name: "Anda Curry", category: "Egg", price: "130", isVeg: false },
    { name: "Anda Masala", category: "Egg", price: "150", isVeg: false },
    { name: "Anda Bhurji", category: "Egg", price: "100", isVeg: false },
    { name: "Chicken Handi Half", category: "Handi Special", price: "330", isVeg: false },
    { name: "Chicken Handi Full", category: "Handi Special", price: "530", isVeg: false },
    { name: "Chicken Malwani Half", category: "Handi Special", price: "370", isVeg: false },
    { name: "Chicken Malwani Full", category: "Handi Special", price: "600", isVeg: false },

    // === MUTTON (NON-VEG) ===
    { name: "Mutton Masala", category: "Mutton", price: "240", isVeg: false },
    { name: "Mutton Curry", category: "Mutton", price: "230", isVeg: false },
    { name: "Mutton Handi Half", category: "Handi Special", price: "500", isVeg: false },
    { name: "Mutton Handi Full", category: "Handi Special", price: "880", isVeg: false },

    // === RICE ===
    { name: "Chicken Aalani Rice", category: "Rice", price: "200", isVeg: false },
    { name: "Mutton Aalani Rice", category: "Rice", price: "230", isVeg: false },
    { name: "Indrayani Rice Half", category: "Rice", price: "70", isVeg: true },
    { name: "Indrayani Rice Full", category: "Rice", price: "120", isVeg: true },
    { name: "Jeera Rice Half", category: "Rice", price: "70", isVeg: true },
    { name: "Jeera Rice Full", category: "Rice", price: "120", isVeg: true },
    { name: "Plain Rice Half", category: "Rice", price: "60", isVeg: true },
    { name: "Plain Rice Full", category: "Rice", price: "100", isVeg: true },

    // === SPECIAL BIRYANI ===
    { name: "Chicken Hyderabadi Biryani Half", category: "Biryani", price: "90", isVeg: false },
    { name: "Chicken Hyderabadi Biryani Full", category: "Biryani", price: "130", isVeg: false },
    { name: "Chicken Tandoor Biryani Half", category: "Biryani", price: "100", isVeg: false },
    { name: "Chicken Tandoor Biryani Full", category: "Biryani", price: "140", isVeg: false },
    { name: "Veg Biryani Half", category: "Biryani", price: "70", isVeg: true },
    { name: "Veg Biryani Full", category: "Biryani", price: "110", isVeg: true },
    { name: "Special Mutton Biryani Half", category: "Biryani", price: "180", isVeg: false },
    { name: "Special Mutton Biryani Full", category: "Biryani", price: "250", isVeg: false },
    { name: "Chicken Fry Pan Biryani", category: "Biryani", price: "150", isVeg: false },
    { name: "Mutton Fry Pan Biryani", category: "Biryani", price: "300", isVeg: false },
    { name: "Veg Fry Pan Biryani", category: "Biryani", price: "120", isVeg: true },

    // === 1 KG BIRYANI ===
    { name: "Hyderabadi Biryani (1 KG)", category: "Biryani 1 KG", price: "950", isVeg: false },
    { name: "Tandoor Biryani (1 KG)", category: "Biryani 1 KG", price: "1050", isVeg: false },
    { name: "Veg Biryani (1 KG)", category: "Biryani 1 KG", price: "750", isVeg: true },
    { name: "Mutton Biryani (1 KG)", category: "Biryani 1 KG", price: "1800", isVeg: false },
    { name: "Lucknow Biryani (1 KG)", category: "Biryani 1 KG", price: "1100", isVeg: false },
];

async function seedSwadHotelMore() {
    console.log("Adding more items to Hotel Swad...");

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

    console.log(`🎉 Successfully added ${count} additional items to Hotel Swad`);
    process.exit(0);
}

seedSwadHotelMore().catch(console.error);
