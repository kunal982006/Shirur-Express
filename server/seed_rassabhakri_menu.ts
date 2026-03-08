import { db } from "./db";
import { restaurantMenuItems, serviceProviders, users } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

async function main() {
    console.log("Starting menu seed for Hotel Rassa Bhakri...");

    // Find user by username
    const userRes = await db.query.users.findFirst({
        where: eq(users.username, "Hotel rassabhakri")
    });

    if (!userRes) {
        console.error("User 'Hotel rassabhakri' not found!");
        process.exit(1);
    }

    // Find provider by userId
    const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, userRes.id)
    });

    if (!provider) {
        console.error("Provider profile not found for the user!");
        process.exit(1);
    }

    console.log(`Found provider: ${provider.businessName} (${provider.id})`);

    const menuItems = [
        // Chicken Menu (Non-Veg)
        { name: "Chicken Biryani", localName: "चिकन बिर्याणी", category: "Chicken", price: "150", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Lollipop", localName: "चिकन लॉलीपॉप", category: "Chicken", price: "180", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Chilli", localName: "चिकन चिल्ली", category: "Chicken", price: "200", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1626779815033-ec84bf729ed5?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Masala", localName: "चिकन मसाला", category: "Chicken", price: "180", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Ukkar", localName: "चिकन उख्खर", category: "Chicken", price: "140", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Fry", localName: "चिकन फ्राय", category: "Chicken", price: "140", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1626779815033-ec84bf729ed5?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Handi (Half)", localName: "चिकन हांडी (Half)", category: "Chicken", price: "250", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Handi (Full)", localName: "चिकन हांडी (Full)", category: "Chicken", price: "450", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Spl. Chicken Thali", localName: "स्पे. चिकन थाळी", category: "Chicken", price: "250", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Malvani (Half)", localName: "चिकन मालवणी (Half)", category: "Chicken", price: "350", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Chicken Malvani (Full)", localName: "चिकन मालवणी (Full)", category: "Chicken", price: "600", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },

        // Mutton Menu (Non-Veg)
        { name: "Mutton Biryani", localName: "मटण बिर्याणी", category: "Mutton", price: "250", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop" },
        { name: "Mutton Masala", localName: "मटण मसाला", category: "Mutton", price: "240", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Mutton Ukkar", localName: "मटण उख्खर", category: "Mutton", price: "240", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Mutton Handi", localName: "मटण हांडी", category: "Mutton", price: "350", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Spl. Mutton Thali", localName: "स्पे. मटण थाळी", category: "Mutton", price: "350", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=500&auto=format&fit=crop" },
        { name: "Mutton Malvani", localName: "मटण मालवणी", category: "Mutton", price: "400", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },

        // Egg Menu (Non-Veg)
        { name: "Egg Biryani", localName: "अंडा बिर्याणी", category: "Egg", price: "150", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop" },
        { name: "Egg Curry", localName: "अंडा करी", category: "Egg", price: "130", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Egg Masala", localName: "अंडा मसाला", category: "Egg", price: "130", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500&auto=format&fit=crop" },
        { name: "Egg Fry", localName: "अंडा फ्राय", category: "Egg", price: "40", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1494883907705-27a9ae93bbf9?q=80&w=500&auto=format&fit=crop" },
        { name: "Egg Thali", localName: "अंडा थाळी", category: "Egg", price: "190", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=500&auto=format&fit=crop" },
        { name: "Boiled Egg", localName: "बॉईल अंडा", category: "Egg", price: "30", isVeg: false, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1588168333986-50845fcea040?q=80&w=500&auto=format&fit=crop" },

        // Paneer Menu (Veg)
        { name: "Paneer Biryani", localName: "पनीर बिर्याणी", category: "Veg / Paneer", price: "150", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop" },
        { name: "Paneer Masala", localName: "पनीर मसाला", category: "Veg / Paneer", price: "150", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?q=80&w=500&auto=format&fit=crop" },
        { name: "Kaju Paneer Masala", localName: "काजू पनीर मसाला", category: "Veg / Paneer", price: "170", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?q=80&w=500&auto=format&fit=crop" },
        { name: "Kaju Masala", localName: "काजू मसाला", category: "Veg / Paneer", price: "170", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?q=80&w=500&auto=format&fit=crop" },
        { name: "Masala Papad", localName: "मसाला पापड", category: "Misc", price: "30", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1626779815033-ec84bf729ed5?q=80&w=500&auto=format&fit=crop" },
        { name: "Jeera Rice (Half)", localName: "जिरा राईस (Half)", category: "Rice", price: "50", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1602127271424-dc2f4164b1ea?q=80&w=500&auto=format&fit=crop" },
        { name: "Jeera Rice (Full)", localName: "जिरा राईस (Full)", category: "Rice", price: "90", isVeg: true, isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1602127271424-dc2f4164b1ea?q=80&w=500&auto=format&fit=crop" },
    ];

    let count = 0;
    for (const item of menuItems) {
        await db.insert(restaurantMenuItems).values({
            providerId: provider.id,
            name: `${item.name} / ${item.localName}`,
            description: item.name,
            category: item.category,
            cuisine: 'Maharashtrian',
            price: item.price,
            isVeg: item.isVeg,
            imageUrl: item.imageUrl,
            isAvailable: item.isAvailable,
        });
        count++;
    }

    console.log(`Successfully added ${count} items for ${provider.businessName}!`);
    process.exit(0);
}

main().catch(console.error);
