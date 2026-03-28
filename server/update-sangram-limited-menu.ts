import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const temporaryMenuItems = [
    // BREAKFAST
    { name: "Tea", category: "Breakfast", price: "25", isVeg: true },
    { name: "Coffee", category: "Breakfast", price: "40", isVeg: true },
    { name: "Poha", category: "Breakfast", price: "70", isVeg: true },
    { name: "Upma", category: "Breakfast", price: "70", isVeg: true },
    { name: "Sheera", category: "Breakfast", price: "75", isVeg: true },
    { name: "Bread Butter", category: "Breakfast", price: "60", isVeg: true },
    { name: "Toast Butter", category: "Breakfast", price: "70", isVeg: true },
    { name: "Veg Sandwich", category: "Breakfast", price: "85", isVeg: true },
    { name: "Veg Cheese Grilled Sandwich", category: "Breakfast", price: "130", isVeg: true },

    // SOUP
    { name: "Veg Manchaow", category: "Soup", price: "120", isVeg: true },

    // STARTER
    { name: "Rosted Papad", category: "Starter", price: "35", isVeg: true },
    { name: "Rosted MS Papad", category: "Starter", price: "40", isVeg: true },
    { name: "Nachani Rosted Papad", category: "Starter", price: "65", isVeg: true },
    { name: "Paneer Tikka Dry", category: "Starter", price: "240", isVeg: true },
    { name: "Mushroom Tikka Dry", category: "Starter", price: "230", isVeg: true },
    { name: "Paneer Pahadi Kabab", category: "Starter", price: "255", isVeg: true },
    { name: "Paneer Banjara Kabab", category: "Starter", price: "255", isVeg: true },
    { name: "Veg Sikh Kabab", category: "Starter", price: "230", isVeg: true },
    { name: "Veg Fride Rice", category: "Starter", price: "175", isVeg: true },
    { name: "Veg SCH Fride Rice", category: "Starter", price: "190", isVeg: true },
    { name: "Veg Hakka Noodls", category: "Starter", price: "175", isVeg: true },

    // SALAD & RAITA
    { name: "Green Salad", category: "Salad & Raita", price: "85", isVeg: true },
    { name: "Mix Raita", category: "Salad & Raita", price: "75", isVeg: true },

    // MAIN CORSE
    { name: "Paneer Tikka MS", category: "Main Corse", price: "230", isVeg: true },
    { name: "Paneer Lasuni", category: "Main Corse", price: "250", isVeg: true },
    { name: "Paneer Chatpata", category: "Main Corse", price: "240", isVeg: true },
    { name: "Paneer MS", category: "Main Corse", price: "200", isVeg: true },
    { name: "Veg Kholapuri", category: "Main Corse", price: "175", isVeg: true },
    { name: "Mix Veg", category: "Main Corse", price: "165", isVeg: true },
    { name: "Veg Handi Full", category: "Main Corse", price: "590", isVeg: true },
    { name: "Veg Handi Half", category: "Main Corse", price: "300", isVeg: true },

    // DAL & RICE
    { name: "Dal Fry", category: "Dal & Rice", price: "135", isVeg: true },
    { name: "Dal Tadka", category: "Dal & Rice", price: "145", isVeg: true },
    { name: "Jeera Rice Full", category: "Dal & Rice", price: "130", isVeg: true },
    { name: "Jeera Rice Half", category: "Dal & Rice", price: "75", isVeg: true },
    { name: "Steam Rice Full", category: "Dal & Rice", price: "115", isVeg: true },
    { name: "Steam Rice Half", category: "Dal & Rice", price: "65", isVeg: true },
    { name: "Dal Khichadi", category: "Dal & Rice", price: "175", isVeg: true },

    // ROTI
    { name: "Roti", category: "Roti", price: "20", isVeg: true },
    { name: "Butter Roti", category: "Roti", price: "30", isVeg: true },
    { name: "Wheat Roti", category: "Roti", price: "25", isVeg: true },
    { name: "Butter Wheat Roti", category: "Roti", price: "35", isVeg: true },
    { name: "Naan", category: "Roti", price: "50", isVeg: true },
    { name: "Butter Naan", category: "Roti", price: "60", isVeg: true },
    { name: "Kulcha", category: "Roti", price: "55", isVeg: true },
    { name: "MS Kulcha", category: "Roti", price: "75", isVeg: true },
    { name: "Cheese Garlic Naan", category: "Roti", price: "120", isVeg: true },
];

async function updateHotelSangramLimitedMenu() {
    console.log("🔍 Looking for 'Hotel Sangram' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Sangram%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Sangram' provider not found!");
        process.exit(1);
    }

    console.log(`✅ Found provider: ${provider.businessName} (ID: ${provider.id})`);
    
    // Deleting existing menu items to replace with temporary limited menu
    console.log("🗑️  Removing existing menu items to update with the Limited Menu...");
    await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, provider.id));

    console.log(`📋 Adding ${temporaryMenuItems.length} Limited Menu items...`);

    let count = 0;
    for (const item of temporaryMenuItems) {
        await db.insert(restaurantMenuItems).values({
            providerId: provider.id,
            name: item.name,
            category: item.category,
            price: item.price as any,
            isVeg: item.isVeg,
            isAvailable: true,
            description: "Limited Menu due to Gas Shortage"
        });
        count++;
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🎉 Successfully updated to LIMITED MENU!`);
    console.log(`✅ Added ${count} items to ${provider.businessName}`);
    console.log(`${"=".repeat(50)}`);
    process.exit(0);
}

updateHotelSangramLimitedMenu().catch((err) => {
    console.error("Error updating Hotel Sangram:", err);
    process.exit(1);
});
