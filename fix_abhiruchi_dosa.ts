
import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq, and, inArray } from "drizzle-orm";

async function cleanupAndSeed() {
    const wrongId = "ppxu4lbqeheqycjepjcfm7uz";
    const correctId = "bqmtxfria70cy3eze4ls88qt";

    const menuItems = [
        // Cheese Ghee Special Dosa
        { name: "Jumbo Ghee Paper Dosa (4 Feet)", category: "Cheese Ghee Special Dosa", price: "250", isVeg: true },
        { name: "Cheese Roll Dosa", category: "Cheese Ghee Special Dosa", price: "170", isVeg: true },
        { name: "Schezwan Cheese Cut Dosa", category: "Cheese Ghee Special Dosa", price: "130", isVeg: true },
        { name: "Mysore Cheese Cut Dosa", category: "Cheese Ghee Special Dosa", price: "130", isVeg: true },
        { name: "Green Cheese Cut Dosa", category: "Cheese Ghee Special Dosa", price: "130", isVeg: true },
        { name: "Cheese Cut Dosa", category: "Cheese Ghee Special Dosa", price: "120", isVeg: true },
        { name: "Ghee Paper Dosa", category: "Cheese Ghee Special Dosa", price: "120", isVeg: true },
        { name: "Chatani Cheese Dosa", category: "Cheese Ghee Special Dosa", price: "100", isVeg: true },
        { name: "Set Cheese Dosa (3 Pes.)", category: "Cheese Ghee Special Dosa", price: "130", isVeg: true },
        { name: "Sponge Cheese Dosa (2 Pes.)", category: "Cheese Ghee Special Dosa", price: "100", isVeg: true },
        { name: "Schezwan Cheese Dosa", category: "Cheese Ghee Special Dosa", price: "100", isVeg: true },
        { name: "Mysore Cheese Dosa", category: "Cheese Ghee Special Dosa", price: "100", isVeg: true },
        { name: "Green Cheese Dosa", category: "Cheese Ghee Special Dosa", price: "100", isVeg: true },
        { name: "Cheese Masala Dosa", category: "Cheese Ghee Special Dosa", price: "100", isVeg: true },

        // Podi Cheese Dosa
        { name: "Podi Cheese Dosa", category: "Podi Cheese Dosa", price: "110", isVeg: true },
        { name: "Cheese Green Podi Dosa", category: "Podi Cheese Dosa", price: "130", isVeg: true },
        { name: "Cheese Schezwan Podi Dosa", category: "Podi Cheese Dosa", price: "130", isVeg: true },
        { name: "Cheese Mysore Podi Dosa", category: "Podi Cheese Dosa", price: "130", isVeg: true },

        // Podi Dosa
        { name: "Podi Dosa", category: "Podi Dosa", price: "80", isVeg: true },
        { name: "Green Podi Dosa", category: "Podi Dosa", price: "100", isVeg: true },
        { name: "Schezwan Podi Dosa", category: "Podi Dosa", price: "100", isVeg: true },
        { name: "Mysore Podi Dosa", category: "Podi Dosa", price: "100", isVeg: true },

        // Butter Dosa
        { name: "Butter Paper Dosa", category: "Butter Dosa", price: "100", isVeg: true },
        { name: "Butter Set Dosa (3 Pes.)", category: "Butter Dosa", price: "90", isVeg: true },
        { name: "Butter Sponge Dosa (2 Pes.)", category: "Butter Dosa", price: "80", isVeg: true },
        { name: "Butter Schezwan Dosa", category: "Butter Dosa", price: "80", isVeg: true },
        { name: "Butter Mysore Dosa", category: "Butter Dosa", price: "80", isVeg: true },
        { name: "Butter Green Dosa", category: "Butter Dosa", price: "80", isVeg: true },
        { name: "Butter Chatani Dosa", category: "Butter Dosa", price: "90", isVeg: true },
        { name: "Butter Topi Dosa", category: "Butter Dosa", price: "80", isVeg: true },
        { name: "Butter Cut Dosa", category: "Butter Dosa", price: "90", isVeg: true },
        { name: "Butter Masala Dosa", category: "Butter Dosa", price: "70", isVeg: true },

        // Plain Dosa
        { name: "Masala Dosa (Amboli)", category: "Plain Dosa", price: "60", isVeg: true },
        { name: "Loni Dosa", category: "Plain Dosa", price: "80", isVeg: true },
        { name: "Chatani Dosa", category: "Plain Dosa", price: "80", isVeg: true },
        { name: "Schezwan Dosa", category: "Plain Dosa", price: "70", isVeg: true },
        { name: "Mysore Dosa", category: "Plain Dosa", price: "70", isVeg: true },
        { name: "Green Dosa", category: "Plain Dosa", price: "70", isVeg: true },
        { name: "Set Masala Dosa (3 Pes.)", category: "Plain Dosa", price: "90", isVeg: true },
        { name: "Sponge Dosa (2 Pes.)", category: "Plain Dosa", price: "80", isVeg: true },
        { name: "Paper Dosa", category: "Plain Dosa", price: "90", isVeg: true },
        { name: "Topi Dosa", category: "Plain Dosa", price: "70", isVeg: true },
        { name: "Ghee Masala Dosa", category: "Plain Dosa", price: "80", isVeg: true },

        // Abhiruchi Special Uttapam
        { name: "Jain Special Uttapam", category: "Abhiruchi Special Uttapam", price: "110", isVeg: true },
        { name: "Masala Cheese Uttapam", category: "Abhiruchi Special Uttapam", price: "110", isVeg: true },
        { name: "Special Cheese Uttapam", category: "Abhiruchi Special Uttapam", price: "110", isVeg: true },
        { name: "Onion Tomato Cheese Uttapam", category: "Abhiruchi Special Uttapam", price: "100", isVeg: true },
        { name: "Tomato Cheese Uttapam", category: "Abhiruchi Special Uttapam", price: "90", isVeg: true },
        { name: "Onion Cheese Uttapam", category: "Abhiruchi Special Uttapam", price: "90", isVeg: true },

        // Abhiruchi Butter Uttapam
        { name: "Butter Masala Uttapam", category: "Abhiruchi Butter Uttapam", price: "100", isVeg: true },
        { name: "Butter Onion Tomato Uttapam", category: "Abhiruchi Butter Uttapam", price: "90", isVeg: true },
        { name: "Butter Tomato Uttapam", category: "Abhiruchi Butter Uttapam", price: "80", isVeg: true },
        { name: "Butter Onion Uttapam", category: "Abhiruchi Butter Uttapam", price: "80", isVeg: true },

        // Abhiruchi Uttapam
        { name: "Masala Uttapam", category: "Abhiruchi Uttapam", price: "90", isVeg: true },
        { name: "Onion Tomato Uttapam", category: "Abhiruchi Uttapam", price: "90", isVeg: true },
        { name: "Tomato Uttapam", category: "Abhiruchi Uttapam", price: "80", isVeg: true },
        { name: "Onion Uttapam", category: "Abhiruchi Uttapam", price: "70", isVeg: true },

        // Pavbhaji
        { name: "Cheese Pavbhaji", category: "Pavbhaji", price: "90", isVeg: true },
        { name: "Butter Pavbhaji", category: "Pavbhaji", price: "80", isVeg: true },
        { name: "Pavbhaji", category: "Pavbhaji", price: "60", isVeg: true },
        { name: "Extra Butter Pav 2 pis.", category: "Pavbhaji", price: "20", isVeg: true },

        // Idli
        { name: "Idli", category: "Idli", price: "50", isVeg: true },
        { name: "Idli Wada", category: "Idli", price: "60", isVeg: true },
        { name: "Medu Wada", category: "Idli", price: "70", isVeg: true },

        // Misal
        { name: "Mataka Misal", category: "Misal", price: "100", isVeg: true },
        { name: "Dahi Misal", category: "Misal", price: "60", isVeg: true },
        { name: "Butter Misal", category: "Misal", price: "60", isVeg: true },
        { name: "Misal", category: "Misal", price: "50", isVeg: true },
        { name: "Extra Pav 2 pis.", category: "Misal", price: "10", isVeg: true }, // Corrected to 10

        // Shake
        { name: "Mango Shake", category: "Shake", price: "60", isVeg: true },
        { name: "Strawberry Shake", category: "Shake", price: "60", isVeg: true },
        { name: "Vanilla Shake", category: "Shake", price: "60", isVeg: true },
        { name: "Chocolate Shake", category: "Shake", price: "60", isVeg: true },
        { name: "Cold Coffee", category: "Shake", price: "60", isVeg: true },

        // Hot
        { name: "Special Tea", category: "Hot", price: "25", isVeg: true },
        { name: "Coffee", category: "Hot", price: "25", isVeg: true },
        { name: "Black Tea", category: "Hot", price: "20", isVeg: true },
        { name: "Plain Milk", category: "Hot", price: "25", isVeg: true },
        { name: "Milk Glass", category: "Hot", price: "50", isVeg: true },
        { name: "Curd Bowl", category: "Hot", price: "20", isVeg: true },

        // Cold Drink
        { name: "Lassi", category: "Cold Drink", price: "30", isVeg: true },
        { name: "Tak", category: "Cold Drink", price: "25", isVeg: true },
    ];

    try {
        console.log(`Cleaning up wrongly added items from Hotel Abhiruchi (${wrongId})...`);
        const itemNames = menuItems.map(i => i.name);
        
        // Delete items from wrongId that match names and categories we added
        // To be safe, we only delete if name is in our list
        const deletedResult = await db.delete(restaurantMenuItems)
            .where(
                and(
                    eq(restaurantMenuItems.providerId, wrongId),
                    inArray(restaurantMenuItems.name, itemNames)
                )
            );
        console.log(`Cleanup completed.`);

        console.log(`Seeding correctly into Hotel Abhiruchi Dosa (${correctId})...`);
        for (const item of menuItems) {
            await db.insert(restaurantMenuItems).values({
                providerId: correctId,
                name: item.name,
                category: item.category,
                price: item.price,
                isVeg: item.isVeg,
                isAvailable: true,
            });
            console.log(`Inserted: ${item.name}`);
        }
        console.log("Seeding completed successfully!");

    } catch (error) {
        console.error("Error during migration:", error);
    } finally {
        process.exit(0);
    }
}

cleanupAndSeed();
