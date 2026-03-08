import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, restaurantMenuItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const MENU_ITEMS_PART_2 = [
    // Page 6: VEG SPECIAL
    { name: "Veg. Maratha", category: "Main Course", price: 170 },
    { name: "Stuff Simla", category: "Main Course", price: 180 },
    { name: "Stuff Tomato", category: "Main Course", price: 180 },
    { name: "Veg. Makhanwala", category: "Main Course", price: 180 },
    { name: "Veg. Hariyali", category: "Main Course", price: 180 },
    { name: "Veg. Singapuri", category: "Main Course", price: 189 },
    { name: "Veg. Hydrabadi", category: "Main Course", price: 170 },
    { name: "Veg. Jaypuri", category: "Main Course", price: 199 },
    { name: "Baby Corn Masala", category: "Main Course", price: 189 },
    { name: "Mashroom Peas Masala", category: "Main Course", price: 199 },
    { name: "Mashroom Masala", category: "Main Course", price: 199 },
    { name: "Mutter Methi Malai", category: "Main Course", price: 189 },
    { name: "Veg. Kadhai", category: "Main Course", price: 179 },
    { name: "Veg. Handi", category: "Main Course", price: 189 },
    { name: "Veg. Diwani Handi", category: "Main Course", price: 199 },
    { name: "Veg. Rahuri", category: "Main Course", price: 179 },
    { name: "Veg. Chillimilli", category: "Main Course", price: 189 },
    { name: "Sham Savera", category: "Main Course", price: 199 },
    { name: "Veg. Banjara", category: "Main Course", price: 199 },
    { name: "Veg. Lajabab", category: "Main Course", price: 199 },
    { name: "Veg. Chatpata", category: "Main Course", price: 199 },
    { name: "Veg. Kothimbiri", category: "Main Course", price: 159 },
    { name: "Veg. Tufani", category: "Main Course", price: 199 },
    { name: "Veg. Amira", category: "Main Course", price: 199 },
    { name: "Veg. Asmani", category: "Main Course", price: 219 },
    { name: "Mashroom Fry", category: "Main Course", price: 209 },
    { name: "Veg. Tawa", category: "Main Course", price: 219 },
    { name: "Veg. Three in One", category: "Main Course", price: 259 },
    { name: "Veg. Tiranga", category: "Main Course", price: 269 },
    { name: "Abhiruchi Special", category: "Main Course", price: 249 },
    { name: "Chandgad Kaju Cheese", category: "Main Course", price: 249 },
    { name: "Veg. Chingari", category: "Main Course", price: 209 },
    { name: "Veg. Thartharat", category: "Main Course", price: 219 },
    { name: "Kokan Kinara", category: "Main Course", price: 289 },

    // Page 7: PANEER SPECIAL
    { name: "Paneer Masala", category: "Paneer", price: 189 },
    { name: "Paneer Tomato", category: "Paneer", price: 179 },
    { name: "Paneer Simala", category: "Paneer", price: 169 },
    { name: "Paneer Bhurji", category: "Paneer", price: 189 },
    { name: "Paneer Handi", category: "Paneer", price: 189 },
    { name: "Paneer Mutter Masala", category: "Paneer", price: 189 },
    { name: "Paneer Babycorn Masala", category: "Paneer", price: 189 },
    { name: "Paneer Tikka Masala", category: "Paneer", price: 199 },
    { name: "Paneer Kadhai", category: "Paneer", price: 189 },
    { name: "Paneer Rashinda", category: "Paneer", price: 199 },
    { name: "Paneer Butter Masala", category: "Paneer", price: 199 },
    { name: "Paneer Adarki", category: "Paneer", price: 189 },
    { name: "Paneer Pasanda", category: "Paneer", price: 209 },
    { name: "Paneer Cheese Anguri", category: "Paneer", price: 289 },
    { name: "Paneer Kaju", category: "Paneer", price: 209 },
    { name: "Paneer Kurma", category: "Paneer", price: 209 },
    { name: "Paneer Malwani", category: "Paneer", price: 209 },
    { name: "Paneer Patiyala", category: "Paneer", price: 230 },
    { name: "Paneer Mushroom", category: "Paneer", price: 219 },
    { name: "Paneer Maharani", category: "Paneer", price: 239 },
    { name: "Paneer Shahi Kurma", category: "Paneer", price: 219 },
    { name: "Paneer Khajana", category: "Paneer", price: 239 },
    { name: "Paneer Chingari", category: "Paneer", price: 219 },
    { name: "Paneer Lababdar", category: "Paneer", price: 229 },
    { name: "Paneer Tufani", category: "Paneer", price: 249 },
    { name: "Paneer Rajwadi", category: "Paneer", price: 219 },

    // Page 7: Thali
    { name: "Maharashtrian Thali", category: "Thali", price: 150 },
];

async function seedAbhiruchiMenuPart2() {
    console.log("Starting menu seed part 2 for Hotel Abhiruchi...");

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.username, "Hotel Abhiruchi"),
        });

        if (!user) {
            console.error("❌ User 'Hotel Abhiruchi' not found! Run the first script first.");
            process.exit(1);
        }

        const provider = await db.query.serviceProviders.findFirst({
            where: eq(serviceProviders.userId, user.id),
        });

        if (!provider) {
            console.error("❌ Provider profile for 'Hotel Abhiruchi' not found! Run the first script first.");
            process.exit(1);
        }

        console.log(`Inserting ${MENU_ITEMS_PART_2.length} new menu items...`);
        const valuesToInsert = MENU_ITEMS_PART_2.map((item) => ({
            providerId: provider.id,
            name: item.name,
            category: item.category,
            price: item.price.toString(),
            description: item.category,
            isVegetarian: true,
            isAvailable: true,
            popular: false,
        }));

        const inserted = await db.insert(restaurantMenuItems)
            .values(valuesToInsert)
            .returning();

        console.log(`✅ Successfully added ${inserted.length} MORE menu items for Hotel Abhiruchi.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding menu:", error);
        process.exit(1);
    }
}

seedAbhiruchiMenuPart2();
