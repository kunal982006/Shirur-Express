import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // Chicken Main Course
    { name: "Chicken Masala", category: "Chicken Main Course", price: "150", isVeg: false },
    { name: "Chicken Curry", category: "Chicken Main Course", price: "150", isVeg: false },
    { name: "Chicken Fry", category: "Chicken Main Course", price: "170", isVeg: false },
    { name: "Chicken Korma", category: "Chicken Main Course", price: "200", isVeg: false },
    { name: "Chicken Shahi-Korma", category: "Chicken Main Course", price: "220", isVeg: false },
    { name: "Chicken Angara", category: "Chicken Main Course", price: "250", isVeg: false },
    { name: "Chicken Kolhapuri", category: "Chicken Main Course", price: "180", isVeg: false },
    { name: "Chicken Kadhai", category: "Chicken Main Course", price: "260", isVeg: false },
    { name: "Chicken Do Pyaza", category: "Chicken Main Course", price: "230", isVeg: false },
    { name: "Butter Chicken", category: "Chicken Main Course", price: "300", isVeg: false },
    { name: "Chicken Handi (Full)", category: "Chicken Main Course", price: "480", isVeg: false },
    { name: "Chicken Handi (Half)", category: "Chicken Main Course", price: "330", isVeg: false },
    { name: "Chicken Adraki", category: "Chicken Main Course", price: "210", isVeg: false },
    { name: "Chicken Lasuni", category: "Chicken Main Course", price: "230", isVeg: false },
    { name: "Chicken Patiyala", category: "Chicken Main Course", price: "340", isVeg: false },
    { name: "Chicken Tiranga", category: "Chicken Main Course", price: "650", isVeg: false },
    { name: "Chicken Roast", category: "Chicken Main Course", price: "180", isVeg: false },
    { name: "Chicken Makhani", category: "Chicken Main Course", price: "200", isVeg: false },
    { name: "Chicken Kheema Fry", category: "Chicken Main Course", price: "180", isVeg: false },
    { name: "Chicken Paper Masala", category: "Chicken Main Course", price: "190", isVeg: false },
    { name: "Chicken Kaleji Petha Fry", category: "Chicken Main Course", price: "140", isVeg: false },
    { name: "Gavran Chicken Kala Masala", category: "Chicken Main Course", price: "180", isVeg: false },
    { name: "Gavran Chicken Fry", category: "Chicken Main Course", price: "200", isVeg: false },
    { name: "Chicken Moglai", category: "Chicken Main Course", price: "250", isVeg: false },
    { name: "Chicken Hyderabadi", category: "Chicken Main Course", price: "260", isVeg: false },
    { name: "Chicken Sukka", category: "Chicken Main Course", price: "160", isVeg: false },
    { name: "Chicken Garlic Kheema", category: "Chicken Main Course", price: "330", isVeg: false },
    { name: "Chicken Khajana", category: "Chicken Main Course", price: "350", isVeg: false },
    { name: "Chicken Maharaja Full", category: "Chicken Main Course", price: "650", isVeg: false },
    { name: "Chicken Maharaja Half", category: "Chicken Main Course", price: "450", isVeg: false },
    { name: "Chicken Murg Mussallam Full", category: "Chicken Main Course", price: "750", isVeg: false },
    { name: "Chicken Murg Mussallam Half", category: "Chicken Main Course", price: "500", isVeg: false },
    { name: "Chicken Bhuna", category: "Chicken Main Course", price: "210", isVeg: false },
    { name: "Chicken Paper Dry", category: "Chicken Main Course", price: "180", isVeg: false },
    { name: "Chicken Chilli Gravy", category: "Chicken Main Course", price: "200", isVeg: false },
    { name: "Chicken Dal Gost", category: "Chicken Main Course", price: "200", isVeg: false },
    { name: "Chicken Achar Gost", category: "Chicken Main Course", price: "210", isVeg: false },
    { name: "Chicken Dalcha", category: "Chicken Main Course", price: "350", isVeg: false },
    { name: "Anda Curry", category: "Chicken Main Course", price: "110", isVeg: false },
    { name: "Anda Masala", category: "Chicken Main Course", price: "130", isVeg: false },
    { name: "Chicken Malvan Fry", category: "Chicken Main Course", price: "190", isVeg: false },
    { name: "Kerala Chicken Curry", category: "Chicken Main Course", price: "240", isVeg: false },
    { name: "Chicken Tutti-Fruti", category: "Chicken Main Course", price: "170", isVeg: false },

    // Mutton Main Course
    { name: "Mutton Dalcha", category: "Mutton Main Course", price: "400", isVeg: false },
    { name: "Mutton Masala", category: "Mutton Main Course", price: "240", isVeg: false },
    { name: "Mutton Curry", category: "Mutton Main Course", price: "220", isVeg: false },
    { name: "Mutton Fry", category: "Mutton Main Course", price: "280", isVeg: false },
    { name: "Mutton Korma", category: "Mutton Main Course", price: "270", isVeg: false },
    { name: "Mutton Shahi-Korma", category: "Mutton Main Course", price: "310", isVeg: false },
    { name: "Mutton Angara", category: "Mutton Main Course", price: "330", isVeg: false },
    { name: "Mutton Kolhapuri", category: "Mutton Main Course", price: "320", isVeg: false },
    { name: "Mutton Do Pyaza", category: "Mutton Main Course", price: "320", isVeg: false },
    { name: "Mutton Kadhai", category: "Mutton Main Course", price: "370", isVeg: false },
    { name: "Mutton Paper Masala", category: "Mutton Main Course", price: "280", isVeg: false },
    { name: "Mutton Makhani", category: "Mutton Main Course", price: "290", isVeg: false },
    { name: "Mutton Hyderabadi", category: "Mutton Main Course", price: "360", isVeg: false },
    { name: "Mutton Handi Full", category: "Mutton Main Course", price: "700", isVeg: false },
    { name: "Mutton Handi Half", category: "Mutton Main Course", price: "500", isVeg: false },
    { name: "Mutton Roast Paper", category: "Mutton Main Course", price: "280", isVeg: false },
    { name: "Mutton Roast", category: "Mutton Main Course", price: "250", isVeg: false },
    { name: "Mutton Kheema Fry", category: "Mutton Main Course", price: "220", isVeg: false },
    { name: "Mutton Kheema Masala", category: "Mutton Main Course", price: "230", isVeg: false },
    { name: "Mutton Adraki", category: "Mutton Main Course", price: "270", isVeg: false },
    { name: "Mutton Lasuni", category: "Mutton Main Course", price: "300", isVeg: false },
    { name: "Mutton Malbar Fry", category: "Mutton Main Course", price: "230", isVeg: false },
    { name: "Mutton Achar Gost", category: "Mutton Main Course", price: "300", isVeg: false },
    { name: "Mutton Dal Gost", category: "Mutton Main Course", price: "300", isVeg: false },
    { name: "Vajadi Masala", category: "Mutton Main Course", price: "150", isVeg: false },
    { name: "Vajadi Fry", category: "Mutton Main Course", price: "150", isVeg: false },

    // Biryani & Rice
    { name: "Chicken Dum Biryani", category: "Biryani & Rice", price: "150", isVeg: false },
    { name: "Mutton Dum Biryani", category: "Biryani & Rice", price: "350", isVeg: false },
    { name: "Chicken Zamzam Pulao", category: "Biryani & Rice", price: "220", isVeg: false },
    { name: "Chicken Kashmiri Pulao", category: "Biryani & Rice", price: "200", isVeg: false },
    { name: "Jeera Rice (Full)", category: "Biryani & Rice", price: "80", isVeg: true },
    { name: "Jeera Rice (Half)", category: "Biryani & Rice", price: "50", isVeg: true },

    // Thali
    { name: "Chicken Thali", category: "Thali", price: "250", isVeg: false },
    { name: "Mutton Thali", category: "Thali", price: "350", isVeg: false },
    { name: "Tiranga Special Mutton Thali", category: "Thali", price: "500", isVeg: false },

    // Chinese Rice
    { name: "Chicken Fried Rice (Full)", category: "Chinese Rice", price: "130", isVeg: false },
    { name: "Chicken Fried Rice (Half)", category: "Chinese Rice", price: "80", isVeg: false },
    { name: "Chicken Schezwan Rice (Full)", category: "Chinese Rice", price: "130", isVeg: false },
    { name: "Chicken Schezwan Rice (Half)", category: "Chinese Rice", price: "80", isVeg: false },
    { name: "Chicken Triple Rice (Full)", category: "Chinese Rice", price: "180", isVeg: false },
    { name: "Chicken Triple Rice (Half)", category: "Chinese Rice", price: "120", isVeg: false },

    // Chinese Noodles
    { name: "Chicken Noodles (Full)", category: "Chinese Noodles", price: "130", isVeg: false },
    { name: "Chicken Noodles (Half)", category: "Chinese Noodles", price: "80", isVeg: false },
    { name: "Chicken Schezwan Noodles (Full)", category: "Chinese Noodles", price: "130", isVeg: false },
    { name: "Chicken Schezwan Noodles (Half)", category: "Chinese Noodles", price: "80", isVeg: false },
    { name: "Chicken Triple Noodles (Full)", category: "Chinese Noodles", price: "180", isVeg: false },
    { name: "Chicken Triple Noodles (Half)", category: "Chinese Noodles", price: "120", isVeg: false },

    // Chicken Starter
    { name: "Lollipop Oil Fry (Full)", category: "Chicken Starter", price: "150", isVeg: false },
    { name: "Lollipop Oil Fry (Half)", category: "Chicken Starter", price: "80", isVeg: false },
    { name: "Lollipop Masala Dry (Full)", category: "Chicken Starter", price: "180", isVeg: false },
    { name: "Lollipop Masala Dry (Half)", category: "Chicken Starter", price: "120", isVeg: false },
    { name: "Chicken Chilli Dry (Full)", category: "Chicken Starter", price: "170", isVeg: false },
    { name: "Chicken Chilli Dry (Half)", category: "Chicken Starter", price: "120", isVeg: false },
    { name: "Chicken Tandoori (Full)", category: "Chicken Starter", price: "400", isVeg: false },
    { name: "Chicken Tandoori (Half)", category: "Chicken Starter", price: "250", isVeg: false },
    { name: "Chicken Crispy", category: "Chicken Starter", price: "250", isVeg: false },
    { name: "Chicken Drumstick (Full)", category: "Chicken Starter", price: "280", isVeg: false },
    { name: "Chicken Drumstick (Half)", category: "Chicken Starter", price: "140", isVeg: false },
    { name: "Chicken Samosa", category: "Chicken Starter", price: "100", isVeg: false },
    { name: "Chicken Roll (Plate)", category: "Chicken Starter", price: "60", isVeg: false },
    { name: "Chicken Stick (Plate)", category: "Chicken Starter", price: "60", isVeg: false },
    { name: "Chicken Seek", category: "Chicken Starter", price: "170", isVeg: false },
    { name: "Chicken 65", category: "Chicken Starter", price: "170", isVeg: false },
    { name: "Chicken Wings", category: "Chicken Starter", price: "160", isVeg: false },
    { name: "Chicken Kadi Gosh", category: "Chicken Starter", price: "120", isVeg: false },
    { name: "Chicken KFC", category: "Chicken Starter", price: "170", isVeg: false },

    // Veg Main Course
    { name: "Paneer Masala", category: "Veg Main Course", price: "130", isVeg: true },
    { name: "Shevbhaji", category: "Veg Main Course", price: "120", isVeg: true },
    { name: "Paneer Butter Masala", category: "Veg Main Course", price: "170", isVeg: true },
    { name: "Matar Paneer", category: "Veg Main Course", price: "160", isVeg: true },
    { name: "Palak Paneer", category: "Veg Main Course", price: "180", isVeg: true },
    { name: "Plain Palak", category: "Veg Main Course", price: "130", isVeg: true },
    { name: "Kaju Masala", category: "Veg Main Course", price: "180", isVeg: true },
    { name: "Paneer Kadhai", category: "Veg Main Course", price: "180", isVeg: true },
    { name: "Paneer Angara", category: "Veg Main Course", price: "190", isVeg: true },
    { name: "Paneer Korma", category: "Veg Main Course", price: "150", isVeg: true },
    { name: "Paneer Kolhapuri", category: "Veg Main Course", price: "160", isVeg: true },
    { name: "Paneer Chilli", category: "Veg Main Course", price: "160", isVeg: true },
    { name: "Dal Tadka", category: "Veg Main Course", price: "150", isVeg: true },
    { name: "Dal Fry", category: "Veg Main Course", price: "130", isVeg: true },
    { name: "Dal Makhani", category: "Veg Main Course", price: "170", isVeg: true },
    { name: "Dal Khichdi", category: "Veg Main Course", price: "160", isVeg: true },

    // Roti
    { name: "Chapati", category: "Roti", price: "15", isVeg: true },
    { name: "Butter Chapati", category: "Roti", price: "20", isVeg: true },
    { name: "Tandoor Roti", category: "Roti", price: "15", isVeg: true },
    { name: "Butter Roti", category: "Roti", price: "25", isVeg: true },
    { name: "Rumali Roti", category: "Roti", price: "35", isVeg: true },
    { name: "Sadha Naan", category: "Roti", price: "25", isVeg: true },
    { name: "Butter Naan", category: "Roti", price: "35", isVeg: true },
    { name: "Laccha Paratha", category: "Roti", price: "35", isVeg: true },

    // Cold Drinks
    { name: "Thumbs Up / Sprite / Sting", category: "Cold Drinks", price: "20", isVeg: true },
    { name: "Water Bottle", category: "Cold Drinks", price: "20", isVeg: true },
    { name: "Jeera Soda", category: "Cold Drinks", price: "20", isVeg: true },
    { name: "Maaza", category: "Cold Drinks", price: "20", isVeg: true }
];

async function seedHotelTiranga() {
    console.log("Looking for 'Hotel Tiranga' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Hotel Tiranga%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Tiranga' provider not found!");
        process.exit(1);
    }

    console.log(`✅ Found provider: ${provider.businessName} (ID: ${provider.id})`);
    
    console.log("Deleting existing menu items...");
    await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, provider.id));

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

seedHotelTiranga().catch((err) => {
    console.error("Error seeding Hotel Tiranga:", err);
    process.exit(1);
});
