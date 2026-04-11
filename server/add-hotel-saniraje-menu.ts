import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems } from "@shared/schema";

const PROVIDER_ID = "tpeh81yp4afwv2vewrib28oy"; // Hotel Saniraje

const menuItems = [
    // Chicken Special
    { name: "चिकन साधी थाळी (Chicken Sadhi Thali)", price: "200.00", category: "Chicken Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "चिकन फ्राय थाळी (Chicken Fry Thali)", price: "230.00", category: "Chicken Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "चिकन स्पे. थाळी (Chicken Special Thali)", price: "270.00", category: "Chicken Special", cuisine: "Maharashtrian", isVeg: false, isPopular: true, popularOrder: 1 },
    { name: "चिकन जंबो थाळी - ४ व्यक्तींसाठी (Chicken Jumbo Thali - For 4)", price: "955.00", category: "Chicken Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "चिकन जंबो थाळी - ६ व्यक्तींसाठी (Chicken Jumbo Thali - For 6)", price: "1430.00", category: "Chicken Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "चिकन कुक्कडू-कु थाळी - ४ व्यक्तींसाठी (Chicken Kukkadu-Koo Thali - For 4)", price: "1055.00", category: "Chicken Special", cuisine: "Maharashtrian", isVeg: false },

    // Mutton Special
    { name: "मटन साधी थाळी / बरबाट थाळी (Mutton Sadhi Thali)", price: "280.00", category: "Mutton Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "मटन स्पे. थाळी (Mutton Special Thali)", price: "420.00", category: "Mutton Special", cuisine: "Maharashtrian", isVeg: false, isPopular: true, popularOrder: 2 },
    { name: "मटन फ्राय थाळी (Mutton Fry Thali)", price: "390.00", category: "Mutton Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "मटन जंबो थाळी - ४ व्यक्तींसाठी (Mutton Jumbo Thali - For 4)", price: "1355.00", category: "Mutton Special", cuisine: "Maharashtrian", isVeg: false },
    { name: "मटन जंबो थाळी - ६ व्यक्तींसाठी (Mutton Jumbo Thali - For 6)", price: "2030.00", category: "Mutton Special", cuisine: "Maharashtrian", isVeg: false },

    // Macchi & Egg
    { name: "स्पे. मच्छी थाळी (Special Fish Thali)", price: "250.00", category: "Fish & Egg", cuisine: "Maharashtrian", isVeg: false, isPopular: true, popularOrder: 3 },
    { name: "अंडा थाळी (Egg Thali)", price: "150.00", category: "Fish & Egg", cuisine: "Maharashtrian", isVeg: false },
];

async function seed() {
    console.log("Seeding Hotel Saniraje menu...");
    try {
        const itemsToInsert = menuItems.map(item => ({
            providerId: PROVIDER_ID,
            ...item
        }));

        await db.insert(restaurantMenuItems).values(itemsToInsert);
        console.log(`Successfully added ${itemsToInsert.length} menu items for Hotel Saniraje.`);
    } catch (error) {
        console.error("Error seeding menu:", error);
    }
}

seed().then(() => process.exit(0));
