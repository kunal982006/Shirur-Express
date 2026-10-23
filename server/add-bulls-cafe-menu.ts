import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems } from "@shared/schema";
import { updatedBullsMenu } from "../scratch/bulls_updated_menu_data";

const providerId = 'fg11p6mi37d50tm4sfa13o13';

async function seedBullsCafe() {
    console.log(`Adding ${updatedBullsMenu.length} menu items to provider ${providerId}...`);
    let count = 0;
    for (const item of updatedBullsMenu) {
        await db.insert(restaurantMenuItems).values({
            providerId: providerId,
            name: item.name,
            category: item.category,
            price: item.finalPrice.toFixed(2),
            isVeg: item.isVeg,
            isAvailable: true,
            description: item.description || `${item.category} item`,
            imageUrl: null
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} items to Bulls & Trader cafe`);
    process.exit(0);
}

seedBullsCafe().catch(console.error);
