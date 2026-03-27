import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems } from "@shared/schema";

const providerId = 'nmzj6q3rchsf1od3ef9i2bb4';

const menuItems = [
    // Chicken Menu
    { name: 'Chicken Biryani', price: '150', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Lollipop', price: '180', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Chilli', price: '200', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Masala', price: '180', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Sukka', price: '140', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Fry', price: '140', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Handi Half', price: '250', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Handi Full', price: '450', category: 'Chicken Menu', isVeg: false },
    { name: 'Special Chicken Thali', price: '250', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Malvani Half', price: '350', category: 'Chicken Menu', isVeg: false },
    { name: 'Chicken Malvani Full', price: '600', category: 'Chicken Menu', isVeg: false },

    // Egg Menu
    { name: 'Egg Biryani', price: '150', category: 'Egg Menu', isVeg: false },
    { name: 'Egg Curry', price: '130', category: 'Egg Menu', isVeg: false },
    { name: 'Egg Masala', price: '130', category: 'Egg Menu', isVeg: false },
    { name: 'Egg Fry', price: '40', category: 'Egg Menu', isVeg: false },
    { name: 'Egg Thali', price: '150', category: 'Egg Menu', isVeg: false },
    { name: 'Boiled Egg', price: '30', category: 'Egg Menu', isVeg: false },

    // Mutton Menu
    { name: 'Mutton Biryani', price: '250', category: 'Mutton Menu', isVeg: false },
    { name: 'Mutton Masala', price: '240', category: 'Mutton Menu', isVeg: false },
    { name: 'Mutton Sukka', price: '240', category: 'Mutton Menu', isVeg: false },
    { name: 'Mutton Handi', price: '350', category: 'Mutton Menu', isVeg: false },
    { name: 'Special Mutton Thali', price: '350', category: 'Mutton Menu', isVeg: false },
    { name: 'Mutton Malvani', price: '400', category: 'Mutton Menu', isVeg: false },

    // Paneer Menu & Rice/Extras
    { name: 'Paneer Biryani', price: '150', category: 'Paneer Menu', isVeg: true },
    { name: 'Paneer Masala', price: '150', category: 'Paneer Menu', isVeg: true },
    { name: 'Kaju Paneer Masala', price: '170', category: 'Paneer Menu', isVeg: true },
    { name: 'Kaju Masala', price: '170', category: 'Paneer Menu', isVeg: true },
    { name: 'Masala Papad', price: '30', category: 'Paneer Menu', isVeg: true },
    { name: 'Jeera Rice Half', price: '50', category: 'Paneer Menu', isVeg: true },
    { name: 'Jeera Rice Full', price: '90', category: 'Paneer Menu', isVeg: true },
];

async function seedRassaBhakri() {
    console.log(`Adding ${menuItems.length} menu items to provider ${providerId}...`);
    let count = 0;
    for (const item of menuItems) {
        await db.insert(restaurantMenuItems).values({
            providerId: providerId,
            name: item.name,
            category: item.category,
            price: item.price as any,
            isVeg: item.isVeg,
            isAvailable: true,
            description: `${item.category} item`,
            imageUrl: null
        });
        count++;
    }

    console.log(`🎉 Successfully added ${count} items to Hotel Rassa Bhakri`);
    process.exit(0);
}

seedRassaBhakri().catch(console.error);
