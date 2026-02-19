
import "dotenv/config";
import { db } from "../server/db";
import { streetFoodItems, restaurantMenuItems } from "../shared/schema";
import { ilike, or } from "drizzle-orm";

async function verify() {
    console.log("Verifying Image Assignments...");

    // Check Paneer Pizza
    console.log("\n--- Checking 'Paneer Pizza' ---");
    const paneerPizzas = await db.select().from(restaurantMenuItems).where(ilike(restaurantMenuItems.name, '%Paneer Pizza%'));
    paneerPizzas.forEach(p => console.log(`${p.name} -> ${p.imageUrl}`));

    // Check Mango Mastani
    console.log("\n--- Checking 'Mango Mastani' ---");
    const mangoMastanis = await db.select().from(restaurantMenuItems).where(ilike(restaurantMenuItems.name, '%Mango Mastani%'));
    mangoMastanis.forEach(p => console.log(`${p.name} -> ${p.imageUrl}`));

    // Check Cold Coffee
    console.log("\n--- Checking 'Cold Coffee' ---");
    const coldCoffees = await db.select().from(restaurantMenuItems).where(ilike(restaurantMenuItems.name, '%Cold Coffee%'));
    coldCoffees.forEach(p => console.log(`${p.name} -> ${p.imageUrl}`));

    // Check Fried Rice
    console.log("\n--- Checking 'Fried Rice' ---");
    const friedRices = await db.select().from(restaurantMenuItems).where(ilike(restaurantMenuItems.name, '%Fried Rice%'));
    friedRices.slice(0, 5).forEach(p => console.log(`${p.name} -> ${p.imageUrl}`));

    process.exit(0);
}

verify().catch(console.error);
