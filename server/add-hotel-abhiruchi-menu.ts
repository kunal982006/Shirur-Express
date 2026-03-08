import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

const MENU_ITEMS = [
    // Page 1: Drinks
    { name: "Spe. Tea", category: "Drinks", price: 20 },
    { name: "Nes Coffee", category: "Drinks", price: 30 },
    { name: "Milk Glass", category: "Drinks", price: 40 },
    { name: "Cold Drink", category: "Drinks", price: 45 }, // Handling 20/45 as max

    // Page 1: Zatpat Nasta
    { name: "Misal", category: "Snacks", price: 90 },
    { name: "Dahi Misal", category: "Snacks", price: 100 },
    { name: "Vada Sample Pav (Single)", category: "Snacks", price: 50 },
    { name: "Vada Sample Pav (Double)", category: "Snacks", price: 70 },
    { name: "Wada Pav", category: "Snacks", price: 20 },
    { name: "Sabudana Wada/Khichadi", category: "Snacks", price: 60 },

    // Page 1: Paratha
    { name: "Alu Paratha", category: "Paratha", price: 70 },
    { name: "Gobi Paratha", category: "Paratha", price: 60 },
    { name: "Paneer Paratha", category: "Paratha", price: 110 },
    { name: "Methi Paratha", category: "Paratha", price: 60 },

    // Page 1: Sweet
    { name: "Jilebi", category: "Desserts", price: 40 },
    { name: "Gulabjamun", category: "Desserts", price: 60 },
    { name: "Shevai Khir", category: "Desserts", price: 50 },
    { name: "Basundi", category: "Desserts", price: 90 },

    // Page 1: Sandwitch
    { name: "Bred Butter", category: "Sandwich", price: 40 },
    { name: "Veg Sandwitch", category: "Sandwich", price: 60 },
    { name: "Chees Sandwitch", category: "Sandwich", price: 90 },
    { name: "Chees Veg Sandwitch", category: "Sandwich", price: 120 },
    { name: "Veg. Tost Sandwitch", category: "Sandwich", price: 130 },

    // Page 2: Lassi
    { name: "Lassi", category: "Lassi & Juice", price: 50 },
    { name: "Mango Lassi", category: "Lassi & Juice", price: 60 },
    { name: "Icecream Lassi", category: "Lassi & Juice", price: 80 },
    { name: "Butter Milk", category: "Lassi & Juice", price: 25 },
    { name: "Dryfruit Lassi", category: "Lassi & Juice", price: 90 },
    { name: "Icecream Single", category: "Desserts", price: 30 },
    { name: "Icecream Double", category: "Desserts", price: 50 },

    // Page 2: Juice
    { name: "Sweetlemon Juice", category: "Lassi & Juice", price: 70 },
    { name: "Orange Juice", category: "Lassi & Juice", price: 70 },
    { name: "Painaple Juice", category: "Lassi & Juice", price: 70 },
    { name: "Apple Juice", category: "Lassi & Juice", price: 70 },
    { name: "Mix Juice", category: "Lassi & Juice", price: 99 },
    { name: "Chikku Juice", category: "Lassi & Juice", price: 70 },
    { name: "Water Milon (Sizable)", category: "Lassi & Juice", price: 60 },

    // Page 2: Milk Shake
    { name: "Choklet Milk Shake", category: "Milkshakes", price: 90 },
    { name: "Vanilla Milk Shake", category: "Milkshakes", price: 70 },
    { name: "Strawberry Milk Shake", category: "Milkshakes", price: 70 },
    { name: "Keshar Milk Shake", category: "Milkshakes", price: 80 },
    { name: "Pista Milk Shake", category: "Milkshakes", price: 70 },
    { name: "Apple Milk Shake", category: "Milkshakes", price: 80 },
    { name: "Painaple Milk Shake", category: "Milkshakes", price: 80 },
    { name: "Cold Coffy", category: "Milkshakes", price: 70 },
    { name: "Special Dry Fruite", category: "Milkshakes", price: 160 },
    { name: "Badam Pista", category: "Milkshakes", price: 120 },
    { name: "Special Dryfruite Salad", category: "Desserts", price: 110 },

    // Page 2: Mastani / Faluda
    { name: "Keshar Mastani", category: "Desserts", price: 90 },
    { name: "Mango Mastani", category: "Desserts", price: 80 },
    { name: "Dry Fruite Mastani", category: "Desserts", price: 110 },
    { name: "Keshar Faluda", category: "Desserts", price: 110 },
    { name: "Dry Fruite Faluda", category: "Desserts", price: 130 },

    // Page 3: Maharishthrian Chatpata
    { name: "Aluwadi", category: "Maharashtrian", price: 60 },
    { name: "Kothimbir Wadi", category: "Maharashtrian", price: 60 },

    // Page 3: Roti
    { name: "Chapati", category: "Breads", price: 15 },
    { name: "Roti", category: "Breads", price: 15 },
    { name: "Butter Roti", category: "Breads", price: 25 },
    { name: "Bhakari Jwari / Bajari", category: "Breads", price: 30 },
    { name: "Wheat Tandoor Roti", category: "Breads", price: 20 },
    { name: "Kulcha", category: "Breads", price: 50 },
    { name: "Butter Kulcha", category: "Breads", price: 60 },
    { name: "Parotha (Plain)", category: "Breads", price: 30 },
    { name: "Tandoor Butter Paratha", category: "Breads", price: 40 },
    { name: "Plain Nan", category: "Breads", price: 30 },
    { name: "Butter Nan", category: "Breads", price: 40 },
    { name: "Garlik Nan", category: "Breads", price: 90 },
    { name: "Garlik Nan Butter", category: "Breads", price: 99 },

    // Page 3: Basmati Khajana
    { name: "Plain Rice", category: "Rice", price: 90 },
    { name: "Half Plain Rice", category: "Rice", price: 60 },
    { name: "Jeera Rice", category: "Rice", price: 99 },
    { name: "Half Jeera Rice", category: "Rice", price: 65 },
    { name: "Curd Rice", category: "Rice", price: 140 },
    { name: "Peas Pulav", category: "Rice", price: 140 },
    { name: "Veg. Pulav", category: "Rice", price: 150 },
    { name: "Veg. Dam Biryani", category: "Rice & Biryani", price: 180 },
    { name: "Dal Khichadi", category: "Rice", price: 140 },

    // Page 3: Kaju
    { name: "Kaju Curry", category: "Main Course", price: 199 },
    { name: "Kaju Masala", category: "Main Course", price: 199 },
    { name: "Chees Kajukari", category: "Main Course", price: 220 },
    { name: "Chees Peas Curry", category: "Main Course", price: 209 },

    // Page 4: Soup
    { name: "Veg. Clear Soup", category: "Soup", price: 80 },
    { name: "Tomato Soup", category: "Soup", price: 80 },
    { name: "Palak Soup", category: "Soup", price: 80 },
    { name: "Veg. Manchav Soup", category: "Soup", price: 90 },
    { name: "Hot & Sour Soup", category: "Soup", price: 90 },
    { name: "Sweet Corn Soup", category: "Soup", price: 99 },

    // Page 4: Chinies
    { name: "Veg. Manchurian", category: "Chinese", price: 140 },
    { name: "Mushroom Manchurian", category: "Chinese", price: 180 },
    { name: "Paneer Chilli", category: "Chinese", price: 179 },
    { name: "Babicorn Chilli", category: "Chinese", price: 179 },
    { name: "Soyabean Chilli", category: "Chinese", price: 179 },
    { name: "Veg. Akkha Nuddles", category: "Chinese", price: 160 },
    { name: "Veg. Fried Rice", category: "Chinese", price: 160 },
    { name: "Mashroom Chilli", category: "Chinese", price: 189 },
    { name: "Shejwan Fry Rice", category: "Chinese", price: 180 },
    { name: "Shejwan Nuddles", category: "Chinese", price: 160 },
    { name: "Triple Shejwan Rice", category: "Chinese", price: 220 },
    { name: "Veg. Spring Roll", category: "Chinese", price: 230 },

    // Page 4: Punjabi Starter
    { name: "Paneer Tikka", category: "Starters", price: 180 },
    { name: "Gobi Tikka", category: "Starters", price: 160 },
    { name: "Veg. Harabhara Kabab", category: "Starters", price: 189 },
    { name: "Paneer Malai Kabab", category: "Starters", price: 210 },
    { name: "Paneer Pahadi Kabab", category: "Starters", price: 189 },
    { name: "Paneer Banjara kabab", category: "Starters", price: 190 },
    { name: "Mushroom Tikka", category: "Starters", price: 189 },
    { name: "Tandoori Alu", category: "Starters", price: 179 },
    { name: "Veg. Sik Kabab", category: "Starters", price: 179 },

    // Page 5: Kofta
    { name: "Veg Kofta", category: "Main Course", price: 179 },
    { name: "Paneer Kofta", category: "Main Course", price: 199 },
    { name: "Malai Kofta", category: "Main Course", price: 209 },
    { name: "Nurgis Kofta", category: "Main Course", price: 229 },

    // Page 5: Veg Punjabi Dishes
    { name: "Dal Fry", category: "Dal", price: 109 },
    { name: "Butter Dal Fry", category: "Dal", price: 129 },
    { name: "Dal Fry Kolhapuri", category: "Dal", price: 119 },
    { name: "Dal Tadka", category: "Dal", price: 125 },
    { name: "Dal Tadka Kolhapuri", category: "Dal", price: 129 },
    { name: "Mix Veg", category: "Main Course", price: 140 },
    { name: "Bhendi Fry", category: "Main Course", price: 140 },
    { name: "Chana Masala", category: "Main Course", price: 150 },
    { name: "Bhendi Masala", category: "Main Course", price: 140 },
    { name: "Green Peas Masala", category: "Main Course", price: 140 },
    { name: "Alu Mutter", category: "Main Course", price: 150 },
    { name: "Baingan Masala", category: "Main Course", price: 140 },
    { name: "Baingan Bharata", category: "Main Course", price: 150 },
    { name: "Plain Palak", category: "Main Course", price: 140 },
    { name: "Alu Jeera", category: "Main Course", price: 140 },
    { name: "Alu Palak", category: "Main Course", price: 140 },
    { name: "Palak Paneer", category: "Main Course", price: 170 },
    { name: "Rani Palak", category: "Main Course", price: 180 },
    { name: "Alu Kobi Masala", category: "Main Course", price: 140 },
    { name: "Veg. Kolhapuri", category: "Main Course", price: 160 },
    { name: "Veg. Khima", category: "Main Course", price: 180 },
    { name: "Veg. Kurma", category: "Main Course", price: 190 },
    { name: "Veg. Bhuna", category: "Main Course", price: 170 },
    { name: "Shev Bhaji", category: "Main Course", price: 140 },
    { name: "Kabuli Chana Masala", category: "Main Course", price: 160 },
];

async function seedAbhiruchiMenu() {
    console.log("Starting menu seed for Hotel Abhiruchi...");

    try {
        // 1. Ensure User exists or create
        let user = await db.query.users.findFirst({
            where: eq(users.username, "Hotel Abhiruchi"),
        });

        if (!user) {
            console.log("Creating user 'Hotel Abhiruchi'...");
            const hashedPassword = await hashPassword("abhiruchix1098");
            const [newUser] = await db.insert(users).values({
                username: "Hotel Abhiruchi",
                password: hashedPassword,
                email: "abhiruchi@shirurexpress.com",
                role: "provider",
            }).returning();
            user = newUser;
            console.log("User created:", user.id);
        } else {
            console.log("Found existing user:", user.id);
        }

        // 2. Ensure Provider profile exists or create
        let provider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.userId, user.id),
        });

        if (!provider) {
            console.log("Creating provider profile for 'Hotel Abhiruchi'...");
            const [newProvider] = await db.insert(serviceProviders).values({
                userId: user.id,
                categoryId: "3", // Assuming category 3 is Restaurants and requires string based on schema
                businessName: "Hotel Abhiruchi",
                description: "Authentic Maharashtrian & North Indian Cuisine",
                address: "Shirur",
                isVerified: true,
                isAvailable: true,
                rating: "4.5",
                reviewCount: 42,
                serviceArea: 10, // Assuming 10km radius as it takes an integer
            }).returning();
            provider = newProvider;
            console.log("Provider created:", provider.id);
        } else {
            console.log("Found existing provider:", provider.id);
        }

        // 3. Clear existing menu items to avoid duplicates
        console.log("Clearing old menu items for provider ID:", provider.id);
        await db.delete(restaurantMenuItems)
            .where(eq(restaurantMenuItems.providerId, provider.id));

        // 4. Insert new menu items
        console.log(`Inserting ${MENU_ITEMS.length} menu items...`);
        const valuesToInsert = MENU_ITEMS.map((item) => ({
            providerId: provider.id,
            name: item.name,
            category: item.category,
            price: item.price.toString(),
            description: item.category,
            isVegetarian: true, // Assuming all these are veg based on the menu
            isAvailable: true,
            popular: false,
        }));

        const inserted = await db.insert(restaurantMenuItems)
            .values(valuesToInsert)
            .returning();

        console.log(`✅ Successfully added ${inserted.length} menu items for Hotel Abhiruchi.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding menu:", error);
        process.exit(1);
    }
}

seedAbhiruchiMenu();
