
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // Fresh Fruit Pulp
    { name: "Jamun Thick Shake", category: "Fresh Fruit Pulp", price: "180", isVeg: true },
    { name: "Sitafal Thick Shake", category: "Fresh Fruit Pulp", price: "140", isVeg: true },

    // Elite Special
    { name: "Good Night Dry Fruit Milk Shake", category: "Elite Special", price: "200", isVeg: true },

    // Shots
    { name: "Jamun Shots", category: "Shots", price: "40", isVeg: true },

    // Fresh Fruit Milk Shakes
    { name: "Mix Fruit Milk Shake", category: "Fresh Fruit Milk Shakes", price: "70", isVeg: true },
    { name: "Chiku Milk Shake", category: "Fresh Fruit Milk Shakes", price: "70", isVeg: true },
    { name: "Mango Milk Shake", category: "Fresh Fruit Milk Shakes", price: "80", isVeg: true },
    { name: "Apple Milk Shake", category: "Fresh Fruit Milk Shakes", price: "80", isVeg: true },
    { name: "Pineapple Milk Shake", category: "Fresh Fruit Milk Shakes", price: "70", isVeg: true },
    { name: "Banana Milk Shake", category: "Fresh Fruit Milk Shakes", price: "60", isVeg: true },
    { name: "Papaya Milk Shake", category: "Fresh Fruit Milk Shakes", price: "60", isVeg: true },

    // Milk Shakes
    { name: "Rose Milk Shake", category: "Milk Shakes", price: "70", isVeg: true },
    { name: "Strawberry Milk Shake", category: "Milk Shakes", price: "70", isVeg: true },
    { name: "Pista Milk Shake", category: "Milk Shakes", price: "80", isVeg: true },
    { name: "Vanilla Milk Shake", category: "Milk Shakes", price: "80", isVeg: true },
    { name: "Kesar Milk Shake", category: "Milk Shakes", price: "80", isVeg: true },
    { name: "Thandai Milk Shake", category: "Milk Shakes", price: "80", isVeg: true },
    { name: "Butter Scotch Milk Shake", category: "Milk Shakes", price: "80", isVeg: true },
    { name: "Black Current Milk Shake", category: "Milk Shakes", price: "80", isVeg: true },

    // Chocolate
    { name: "Chocolate Milk Shake", category: "Chocolate", price: "80", isVeg: true },
    { name: "Cold Coffee", category: "Chocolate", price: "50", isVeg: true },
    { name: "Oreo Shake", category: "Chocolate", price: "90", isVeg: true },
    { name: "Oreo Overload Shake", category: "Chocolate", price: "140", isVeg: true },
    { name: "Cold Brew (frappe)", category: "Chocolate", price: "120", isVeg: true },

    // Mastani
    { name: "Mango Mastani", category: "Mastani", price: "130", isVeg: true },
    { name: "Mix Fruit Mastani", category: "Mastani", price: "120", isVeg: true },
    { name: "Chickoo Mastani", category: "Mastani", price: "110", isVeg: true },
    { name: "Rose Mastani", category: "Mastani", price: "110", isVeg: true },
    { name: "Pista Mastani", category: "Mastani", price: "130", isVeg: true },
    { name: "Strawberry Mastani", category: "Mastani", price: "110", isVeg: true },
    { name: "Vanilla Mastani", category: "Mastani", price: "110", isVeg: true },
    { name: "Sitafal Mastani", category: "Mastani", price: "170", isVeg: true },
    { name: "Butter Scotch Mastani", category: "Mastani", price: "100", isVeg: true },
    { name: "Chocolate Mastani", category: "Mastani", price: "100", isVeg: true },
    { name: "Special Cold Coffee", category: "Mastani", price: "100", isVeg: true },
    { name: "Dry Fruit Mastani", category: "Mastani", price: "240", isVeg: true },

    // Mixtures
    { name: "Choco Cafe", category: "Mixtures", price: "70", isVeg: true },
    { name: "Chiku Chocolate", category: "Mixtures", price: "80", isVeg: true },
    { name: "Mango Rose", category: "Mixtures", price: "90", isVeg: true },

    // Sundaes
    { name: "Single Sundae", category: "Sundaes", price: "80", isVeg: true },
    { name: "Double Sundae", category: "Sundaes", price: "110", isVeg: true },
    { name: "Triple Sundae", category: "Sundaes", price: "140", isVeg: true },

    // Drinks
    { name: "Cold Drinks", category: "Drinks", price: "20", isVeg: true },
    { name: "Lassi", category: "Drinks", price: "50", isVeg: true },
    { name: "Special Lassi", category: "Drinks", price: "60", isVeg: true },

    // Fresh Juice
    { name: "Sweet Lime (Mosambi) Juice", category: "Fresh Juice", price: "70", isVeg: true },
    { name: "Orange Juice", category: "Fresh Juice", price: "70", isVeg: true },
    { name: "Ganga-Jamuna Juice", category: "Fresh Juice", price: "70", isVeg: true },
    { name: "Pomegranate Juice", category: "Fresh Juice", price: "100", isVeg: true },
    { name: "Water Melon Juice", category: "Fresh Juice", price: "70", isVeg: true },
    { name: "Pineapple Juice", category: "Fresh Juice", price: "70", isVeg: true },
    { name: "Jamun Juice", category: "Fresh Juice", price: "160", isVeg: true }
];

async function seedEliteCafe() {
    console.log("Looking for 'Elite cafe' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Elite Kuice%"),
    });

    if (!provider) {
        console.error("❌ 'Elite cafe' provider not found!");
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

seedEliteCafe().catch((err) => {
    console.error("Error seeding Elite cafe:", err);
    process.exit(1);
});
