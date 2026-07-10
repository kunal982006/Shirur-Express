import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // === CHICKEN THALI ===
    { name: "Sadhi Chicken Thali", category: "Thali", price: "180", isVeg: false },
    { name: "Chicken Thali", category: "Thali", price: "220", isVeg: false },
    { name: "Special Chicken Thali", category: "Thali", price: "290", isVeg: false },

    // === MUTTON THALI ===
    { name: "Sadhi Mutton Thali", category: "Thali", price: "280", isVeg: false },
    { name: "Mutton Thali", category: "Thali", price: "350", isVeg: false },
    { name: "Special Mutton Thali", category: "Thali", price: "420", isVeg: false },

    // === FISH & EGG THALI ===
    { name: "Macchi Thali", category: "Thali", price: "190", isVeg: false },
    { name: "Special Macchi Thali", category: "Thali", price: "250", isVeg: false },
    { name: "Anda Thali", category: "Thali", price: "160", isVeg: false },
    { name: "Special Anda Thali", category: "Thali", price: "200", isVeg: false },

    // === VEG THALI ===
    { name: "Veg Thali", category: "Thali", price: "120", isVeg: true },
    { name: "Special Veg Thali", category: "Thali", price: "220", isVeg: true },

    // === ROTI / BHAKRI ===
    { name: "Bajari Bhakri", category: "Roti", price: "30", isVeg: true },
    { name: "Jwari Bhakri", category: "Roti", price: "35", isVeg: true },
    { name: "Tandoor Roti", category: "Roti", price: "15", isVeg: true },
    { name: "Butter Tandoor Roti", category: "Roti", price: "25", isVeg: true },
    { name: "Naan", category: "Roti", price: "35", isVeg: true },
    { name: "Butter Naan", category: "Roti", price: "40", isVeg: true },

    // === VEG STARTER ===
    { name: "Masala Papad", category: "Veg Starter", price: "30", isVeg: true },
    { name: "Roasted Papad", category: "Veg Starter", price: "20", isVeg: true },
    { name: "Fry Papad", category: "Veg Starter", price: "25", isVeg: true },
    { name: "Soyabin Chilly", category: "Veg Starter", price: "120", isVeg: true },
    { name: "Soyabin Fry (Kadak)", category: "Veg Starter", price: "130", isVeg: true },
    { name: "Paneer Chilly", category: "Veg Starter", price: "160", isVeg: true },
    { name: "Veg Manchurian", category: "Veg Starter", price: "130", isVeg: true },
    { name: "Paneer Dragon Chilly", category: "Veg Starter", price: "170", isVeg: true },
    { name: "Paneer Tikka", category: "Veg Starter", price: "150", isVeg: true },
    { name: "Paneer Pahadi Tikka", category: "Veg Starter", price: "150", isVeg: true },

    // === NON-VEG STARTER ===
    { name: "Mutton Fry", category: "Non-Veg Starter", price: "230", isVeg: false },
    { name: "Chicken Fry", category: "Non-Veg Starter", price: "190", isVeg: false },
    { name: "Mutton Kharda", category: "Non-Veg Starter", price: "230", isVeg: false },
    { name: "Chicken Kharda", category: "Non-Veg Starter", price: "180", isVeg: false },
    { name: "Chicken Khare (Sajuk Tupatle)", category: "Non-Veg Starter", price: "200", isVeg: false },
    { name: "Mutton Khare (Sajuk Tupatle)", category: "Non-Veg Starter", price: "270", isVeg: false },
    { name: "Kaleja Fry", category: "Non-Veg Starter", price: "160", isVeg: false },
    { name: "Macchi Fry", category: "Non-Veg Starter", price: "170", isVeg: false },
    { name: "Macchi Roast", category: "Non-Veg Starter", price: "150", isVeg: false },
    { name: "Anda Boil", category: "Non-Veg Starter", price: "40", isVeg: false },
    { name: "Anda Boil Fry", category: "Non-Veg Starter", price: "60", isVeg: false },
    { name: "Anda Omelette", category: "Non-Veg Starter", price: "40", isVeg: false },
    { name: "Chicken Tandoor Half", category: "Non-Veg Starter", price: "200", isVeg: false },
    { name: "Chicken Tandoor Full", category: "Non-Veg Starter", price: "360", isVeg: false },
    { name: "Chicken Lollipop Half", category: "Non-Veg Starter", price: "80", isVeg: false },
    { name: "Chicken Lollipop Full", category: "Non-Veg Starter", price: "120", isVeg: false },
    { name: "Chicken Chilly", category: "Non-Veg Starter", price: "170", isVeg: false },
    { name: "Chicken 65", category: "Non-Veg Starter", price: "150", isVeg: false },
    { name: "Chicken Dragon Chilly", category: "Non-Veg Starter", price: "170", isVeg: false },
    { name: "Chilly Lollipop", category: "Non-Veg Starter", price: "190", isVeg: false },
    { name: "Chicken Manchurian", category: "Non-Veg Starter", price: "120", isVeg: false },
    { name: "Chicken Tikka", category: "Non-Veg Starter", price: "140", isVeg: false },
    { name: "Chicken Pahadi Tikka", category: "Non-Veg Starter", price: "140", isVeg: false },
    { name: "Chicken Malai Tikka", category: "Non-Veg Starter", price: "150", isVeg: false },
    { name: "Dalcha Half", category: "Non-Veg Starter", price: "80", isVeg: false },
    { name: "Dalcha Full", category: "Non-Veg Starter", price: "130", isVeg: false },

    // === AALANI UKKAD ===
    { name: "Chicken Aalani Ukkad", category: "Non-Veg Starter", price: "170", isVeg: false },
    { name: "Mutton Aalani Ukkad", category: "Non-Veg Starter", price: "220", isVeg: false },
];

async function seedSwadHotel() {
    console.log("Starting Hotel Swad seeding...");

    // 1. Get Category ID
    const categories = await db.query.serviceCategories.findMany();
    const restaurantCategory = categories.find(c =>
        c.slug.includes("restaurant") || c.slug.includes("food") || c.slug.includes("cafe")
    );

    if (!restaurantCategory) {
        console.error("Could not find a 'restaurants' or 'cafe' category!");
        process.exit(1);
    }

    let userId;
    const username = "Hotel Swad";
    const password = "Swad@4645";

    // 2. Get/Create User
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.username, username),
        });

        if (user) {
            console.log(`User found: ${user.username} (ID: ${user.id})`);
            userId = user.id;

            // Optionally update password if necessary
            await db.update(users).set({ password }).where(eq(users.id, userId));
            console.log(`Updated user password to ${password}`);
        } else {
            console.log(`User not found. Creating user ${username}...`);
            const newUser = await db.insert(users).values({
                username: username,
                email: "hotelswad@example.com",
                password: password,
                role: "provider",
                // displayName: "Hotel Swad"
            }).returning();
            userId = newUser[0].id;
            console.log(`Created user: ${newUser[0].username} (ID: ${userId})`);
        }
    } catch (e: any) {
        console.log("Error handling user:", e.message);
        process.exit(1);
    }

    // 3. Get/Create Provider
    let providerId;
    try {
        const provider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.userId, userId),
        });

        if (provider) {
            console.log(`Provider found: ${provider.businessName} (ID: ${provider.id})`);
            providerId = provider.id;
        } else {
            console.log("Creating provider...");
            const newProvider = await db.insert(serviceProviders).values({
                userId: userId,
                categoryId: restaurantCategory.id,
                businessName: "Hotel Swad",
                // contactNumber: "1234567890",
                address: "Shirur",
                description: "Authentic Veg and Non-Veg Thali & Starters",
                isAvailable: true,
                rating: "0.00"
            }).returning();
            providerId = newProvider[0].id;
            console.log(`Created provider: ${newProvider[0].businessName} (ID: ${providerId})`);
        }
    } catch (e: any) {
        console.log("Error handling provider:", e.message);
        process.exit(1);
    }

    // 4. Clean existing menu mostly
    console.log("Cleaning existing menu items to prevent duplicates...");
    await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, providerId));

    // 5. Add new menu items
    console.log(`Adding ${menuItems.length} menu items...`);
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

    console.log(`🎉 Successfully added ${count} items to Hotel Swad`);
    process.exit(0);
}

seedSwadHotel().catch(console.error);
