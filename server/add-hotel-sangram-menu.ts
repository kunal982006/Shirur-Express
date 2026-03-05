
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { ilike } from "drizzle-orm";

const menuItems = [
    // ===== DRINKS =====
    { name: "Tea", category: "Drinks", price: "20", isVeg: true },
    { name: "Coffee", category: "Drinks", price: "35", isVeg: true },
    { name: "Cold Coffee", category: "Drinks", price: "60", isVeg: true },
    { name: "Milk Glass", category: "Drinks", price: "55", isVeg: true },
    { name: "Bournvita Glass", category: "Drinks", price: "60", isVeg: true },

    // ===== SODA =====
    { name: "Fresh Lime Water", category: "Soda", price: "35", isVeg: true },
    { name: "Fresh Lime Soda", category: "Soda", price: "40", isVeg: true },
    { name: "Butter Milk", category: "Soda", price: "50", isVeg: true },
    { name: "Butter Milk M/s.", category: "Soda", price: "60", isVeg: true },
    { name: "Lassi", category: "Soda", price: "65", isVeg: true },

    // ===== BREAKFAST =====
    { name: "Poha", category: "Breakfast", price: "60", isVeg: true },
    { name: "Upma", category: "Breakfast", price: "60", isVeg: true },
    { name: "Sheera", category: "Breakfast", price: "65", isVeg: true },
    { name: "Plain Dosa", category: "Breakfast", price: "75", isVeg: true },
    { name: "Masala Dosa", category: "Breakfast", price: "85", isVeg: true },
    { name: "Paper Plain Dosa", category: "Breakfast", price: "90", isVeg: true },
    { name: "Paper Masala Dosa", category: "Breakfast", price: "95", isVeg: true },
    { name: "Cheese Dosa", category: "Breakfast", price: "120", isVeg: true },
    { name: "Cut Dosa", category: "Breakfast", price: "100", isVeg: true },
    { name: "Plain Uttappa", category: "Breakfast", price: "85", isVeg: true },
    { name: "Onion Uttappa", category: "Breakfast", price: "90", isVeg: true },
    { name: "Tomato Uttappa", category: "Breakfast", price: "90", isVeg: true },
    { name: "Idli Samber", category: "Breakfast", price: "70", isVeg: true },
    { name: "Medu Wada", category: "Breakfast", price: "110", isVeg: true },
    { name: "Puri Bhaji", category: "Breakfast", price: "120", isVeg: true },
    { name: "Finger Chips", category: "Breakfast", price: "75", isVeg: true },
    { name: "Aloo Paratha", category: "Breakfast", price: "95", isVeg: true },
    { name: "Paneer Paratha", category: "Breakfast", price: "110", isVeg: true },
    { name: "Pakoda Mix/Onion/Aloo", category: "Breakfast", price: "90", isVeg: true },
    { name: "Bread Butter", category: "Breakfast", price: "55", isVeg: true },
    { name: "Toast Butter", category: "Breakfast", price: "70", isVeg: true },
    { name: "Veg Sandwich", category: "Breakfast", price: "80", isVeg: true },
    { name: "Toast Sandwich", category: "Breakfast", price: "85", isVeg: true },
    { name: "Veg Cheese Grilled Sandwich", category: "Breakfast", price: "120", isVeg: true },

    // ===== SOUP =====
    { name: "Veg Sweet Corn Soup", category: "Soup", price: "85", isVeg: true },
    { name: "Veg Manchow Soup", category: "Soup", price: "90", isVeg: true },
    { name: "Cream of Tomato", category: "Soup", price: "95", isVeg: true },
    { name: "Lemon Coriander Soup", category: "Soup", price: "100", isVeg: true },
    { name: "Veg Shorba", category: "Soup", price: "110", isVeg: true },
    { name: "Cream of Veg Soup", category: "Soup", price: "110", isVeg: true },
    { name: "Cream of Mushroom", category: "Soup", price: "130", isVeg: true },

    // ===== STARTER =====
    { name: "Rosted Papad", category: "Starter", price: "25", isVeg: true },
    { name: "Fry Papad", category: "Starter", price: "30", isVeg: true },
    { name: "Masala Papad", category: "Starter", price: "35", isVeg: true },
    { name: "Nachani Fry Papad", category: "Starter", price: "40", isVeg: true },
    { name: "Nachani Masala Papad", category: "Starter", price: "50", isVeg: true },
    { name: "Veg Harabhara Kebab", category: "Starter", price: "200", isVeg: true },
    { name: "Dragon Roll", category: "Starter", price: "200", isVeg: true },
    { name: "Cheese Potato Roll", category: "Starter", price: "200", isVeg: true },
    { name: "Kaju Methi Roll", category: "Starter", price: "210", isVeg: true },
    { name: "Cheese Corn Roll", category: "Starter", price: "210", isVeg: true },
    { name: "Paneer in Lemon Sauce", category: "Starter", price: "210", isVeg: true },
    { name: "Cheese Tokari Dry", category: "Starter", price: "225", isVeg: true },
    { name: "Paneer Unik Sauce", category: "Starter", price: "225", isVeg: true },
    { name: "Cheese Cigar Roll", category: "Starter", price: "235", isVeg: true },
    { name: "Veg Febica Roll", category: "Starter", price: "230", isVeg: true },
    { name: "Paneer in Honey Sauce", category: "Starter", price: "235", isVeg: true },

    // ===== TANDOOR STARTER =====
    { name: "Mushroom Tikka Dry", category: "Tandoor Starter", price: "200", isVeg: true },
    { name: "Paneer Tikka Dry", category: "Tandoor Starter", price: "200", isVeg: true },
    { name: "Veg Sikh Kebab", category: "Tandoor Starter", price: "210", isVeg: true },
    { name: "Paneer Pahadi Kebab", category: "Tandoor Starter", price: "240", isVeg: true },
    { name: "Paneer Banjara Kebab", category: "Tandoor Starter", price: "240", isVeg: true },
    { name: "Paneer Hara Mutter Tikka Dry", category: "Tandoor Starter", price: "240", isVeg: true },
    { name: "Mushroom Paneer Tikka Dry", category: "Tandoor Starter", price: "250", isVeg: true },
    { name: "Paneer Akhabari Tikka Dry", category: "Tandoor Starter", price: "260", isVeg: true },
    { name: "Paneer Multani Kebab Dry", category: "Tandoor Starter", price: "260", isVeg: true },
    { name: "Chandani Tikka Dry", category: "Tandoor Starter", price: "260", isVeg: true },
    { name: "Paneer Tiranga Tikka Dry", category: "Tandoor Starter", price: "300", isVeg: true },

    // ===== STARTER (CHINESE) =====
    { name: "Veg Manchurian Dry", category: "Starter (Chinese)", price: "160", isVeg: true },
    { name: "Veg 65", category: "Starter (Chinese)", price: "170", isVeg: true },
    { name: "Baby Corn Chilly", category: "Starter (Chinese)", price: "170", isVeg: true },
    { name: "Mushroom Chilly", category: "Starter (Chinese)", price: "170", isVeg: true },
    { name: "Veg Crispy", category: "Starter (Chinese)", price: "170", isVeg: true },
    { name: "Paneer Chilly", category: "Starter (Chinese)", price: "175", isVeg: true },
    { name: "Paneer Hot Pan", category: "Starter (Chinese)", price: "190", isVeg: true },
    { name: "Paneer Saute", category: "Starter (Chinese)", price: "190", isVeg: true },
    { name: "Paneer Crispy", category: "Starter (Chinese)", price: "210", isVeg: true },
    { name: "Veg Crunchi", category: "Starter (Chinese)", price: "240", isVeg: true },
    { name: "Veg Triple Schezwan Noodles", category: "Starter (Chinese)", price: "210", isVeg: true },
    { name: "Veg Triple Schezwan Rice", category: "Starter (Chinese)", price: "210", isVeg: true },
    { name: "Veg Fried Rice", category: "Starter (Chinese)", price: "150", isVeg: true },
    { name: "Veg Schezwan Fried Rice", category: "Starter (Chinese)", price: "170", isVeg: true },
    { name: "Veg Hakka Noodles", category: "Starter (Chinese)", price: "150", isVeg: true },
    { name: "Veg Schezwan Noodles", category: "Starter (Chinese)", price: "160", isVeg: true },
    { name: "Veg Sizzler", category: "Starter (Chinese)", price: "350", isVeg: true },

    // ===== SALAD & RAITA =====
    { name: "Dahi Wati Plain", category: "Salad & Raita", price: "30", isVeg: true },
    { name: "Dahi Bowl Plain", category: "Salad & Raita", price: "60", isVeg: true },
    { name: "Mix Veg Raita", category: "Salad & Raita", price: "75", isVeg: true },
    { name: "Boondi Raita", category: "Salad & Raita", price: "80", isVeg: true },
    { name: "Green Salad", category: "Salad & Raita", price: "80", isVeg: true },

    // ===== MAHARASHTRAN MENU =====
    { name: "Thecha", category: "Maharashtran Menu", price: "50", isVeg: true },
    { name: "Aamti", category: "Maharashtran Menu", price: "110", isVeg: true },
    { name: "Pithala", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Tomato Chutney", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Shev Bhaji", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Methi Fry", category: "Maharashtran Menu", price: "150", isVeg: true },
    { name: "Lasuni Methi", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Methi Masala", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Bhendi Fry", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Bhendi Masala", category: "Maharashtran Menu", price: "135", isVeg: true },
    { name: "Bharaleli Vangi", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Baigan Masala", category: "Maharashtran Menu", price: "170", isVeg: true },
    { name: "Baigan Bharata", category: "Maharashtran Menu", price: "140", isVeg: true },
    { name: "Matki Dry", category: "Maharashtran Menu", price: "135", isVeg: true },
    { name: "Matki Usal", category: "Maharashtran Menu", price: "135", isVeg: true },
    { name: "Batata Bhaji (Yellow Dry)", category: "Maharashtran Menu", price: "135", isVeg: true },
    { name: "Plain Palak", category: "Maharashtran Menu", price: "145", isVeg: true },
    { name: "Lasuni Palak", category: "Maharashtran Menu", price: "145", isVeg: true },

    // ===== SPECIALS VEG =====
    { name: "Aloo Jeera", category: "Specials Veg", price: "135", isVeg: true },
    { name: "Green Peas Masala", category: "Specials Veg", price: "135", isVeg: true },
    { name: "Mix Veg", category: "Specials Veg", price: "140", isVeg: true },
    { name: "Veg Kolhapuri", category: "Specials Veg", price: "145", isVeg: true },
    { name: "Veg Bhuna (Medium Sweet)", category: "Specials Veg", price: "170", isVeg: true },
    { name: "Mix Veg Tawa (Dry)", category: "Specials Veg", price: "175", isVeg: true },
    { name: "Veg Makhanwala (Medium Sweet)", category: "Specials Veg", price: "170", isVeg: true },
    { name: "Kaju Masala", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Veg Kadai (Medium Sweet)", category: "Specials Veg", price: "180", isVeg: true },
    { name: "Veg Maratha", category: "Specials Veg", price: "185", isVeg: true },
    { name: "Veg Kofta", category: "Specials Veg", price: "200", isVeg: true },
    { name: "Mushroom Masala", category: "Specials Veg", price: "195", isVeg: true },
    { name: "Mushroom Kadai (Medium Sweet)", category: "Specials Veg", price: "190", isVeg: true },
    { name: "Kaju Curry (White Gravy Medium Sweet)", category: "Specials Veg", price: "225", isVeg: true },
    { name: "Veg Angara", category: "Specials Veg", price: "200", isVeg: true },
    { name: "Veg Patiyala", category: "Specials Veg", price: "220", isVeg: true },
    { name: "Veg Chingari", category: "Specials Veg", price: "220", isVeg: true },
    { name: "Dum Aloo Punjabi", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Veg Tarkari", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Veg Majedar", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Veg Malavani", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Veg Hydrabadi", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Creamy Corn Masala", category: "Specials Veg", price: "220", isVeg: true },
    { name: "Veg Zarena", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Veg Chandgad", category: "Specials Veg", price: "240", isVeg: true },
    { name: "Cheese Tokari Masala", category: "Specials Veg", price: "250", isVeg: true },
    { name: "Veg Nawabi", category: "Specials Veg", price: "260", isVeg: true },
    { name: "Shev Bhaji Handi Half", category: "Specials Veg", price: "210", isVeg: true },
    { name: "Shev Bhaji Handi Full", category: "Specials Veg", price: "400", isVeg: true },
    { name: "Veg Handi Half", category: "Specials Veg", price: "270", isVeg: true },
    { name: "Veg Handi Full", category: "Specials Veg", price: "520", isVeg: true },
    { name: "Veg Maratha Handi Half", category: "Specials Veg", price: "290", isVeg: true },
    { name: "Veg Maratha Handi Full", category: "Specials Veg", price: "550", isVeg: true },

    // ===== PANEER =====
    { name: "Paneer Butter Masala", category: "Paneer", price: "180", isVeg: true },
    { name: "Paneer Tikka Masala", category: "Paneer", price: "180", isVeg: true },
    { name: "Paneer Bhatinda", category: "Paneer", price: "195", isVeg: true },
    { name: "Paneer Rajwadi", category: "Paneer", price: "200", isVeg: true },
    { name: "Paneer Peshawari", category: "Paneer", price: "200", isVeg: true },
    { name: "Paneer Lajawab", category: "Paneer", price: "200", isVeg: true },
    { name: "Paneer Maharaja", category: "Paneer", price: "220", isVeg: true },
    { name: "Paneer Chatpata", category: "Paneer", price: "210", isVeg: true },
    { name: "Paneer Malvani", category: "Paneer", price: "230", isVeg: true },
    { name: "Paneer Lasuni", category: "Paneer", price: "240", isVeg: true },
    { name: "Paneer Kadmbari", category: "Paneer", price: "240", isVeg: true },
    { name: "Paneer Angara", category: "Paneer", price: "240", isVeg: true },
    { name: "Paneer Lababdar", category: "Paneer", price: "235", isVeg: true },
    { name: "Paneer Ra Ra", category: "Paneer", price: "235", isVeg: true },
    { name: "Paneer Kalyani", category: "Paneer", price: "250", isVeg: true },
    { name: "Paneer Pasanda", category: "Paneer", price: "280", isVeg: true },
    { name: "Paneer Hill Top", category: "Paneer", price: "280", isVeg: true },
    { name: "Paneer Handi Half", category: "Paneer", price: "300", isVeg: true },
    { name: "Paneer Handi Full", category: "Paneer", price: "560", isVeg: true },

    // ===== DAL =====
    { name: "Plain Dal", category: "Dal", price: "100", isVeg: true },
    { name: "Dal Fry", category: "Dal", price: "120", isVeg: true },
    { name: "Dal Tadaka", category: "Dal", price: "130", isVeg: true },
    { name: "Dal Kolhapuri", category: "Dal", price: "140", isVeg: true },
    { name: "Dal Wati", category: "Dal", price: "50", isVeg: true },

    // ===== RICE =====
    { name: "Steam Rice Full", category: "Rice", price: "95", isVeg: true },
    { name: "Steam Rice Half", category: "Rice", price: "55", isVeg: true },
    { name: "Jeera Rice Full", category: "Rice", price: "110", isVeg: true },
    { name: "Jeera Rice Half", category: "Rice", price: "65", isVeg: true },
    { name: "Curd Rice", category: "Rice", price: "140", isVeg: true },
    { name: "Veg Pulao", category: "Rice", price: "150", isVeg: true },
    { name: "Veg Biryani", category: "Rice", price: "180", isVeg: true },
    { name: "Ghee Rice", category: "Rice", price: "160", isVeg: true },
    { name: "Dal Khichadi", category: "Rice", price: "150", isVeg: true },

    // ===== ROTI =====
    { name: "Roti", category: "Roti", price: "15", isVeg: true },
    { name: "Butter Roti", category: "Roti", price: "20", isVeg: true },
    { name: "Wheat Roti", category: "Roti", price: "20", isVeg: true },
    { name: "Butter Wheat Roti", category: "Roti", price: "25", isVeg: true },
    { name: "Missi Roti", category: "Roti", price: "45", isVeg: true },
    { name: "Naan", category: "Roti", price: "40", isVeg: true },
    { name: "Butter Naan", category: "Roti", price: "45", isVeg: true },
    { name: "Garlic Naan", category: "Roti", price: "70", isVeg: true },
    { name: "Butter Garlic Naan", category: "Roti", price: "75", isVeg: true },
    { name: "Paratha", category: "Roti", price: "40", isVeg: true },
    { name: "Butter Paratha", category: "Roti", price: "45", isVeg: true },
    { name: "Kulcha", category: "Roti", price: "45", isVeg: true },
    { name: "Butter Kulcha", category: "Roti", price: "55", isVeg: true },
    { name: "Masala Kulcha", category: "Roti", price: "60", isVeg: true },
    { name: "Chapati", category: "Roti", price: "20", isVeg: true },
    { name: "Butter Chapati", category: "Roti", price: "25", isVeg: true },
    { name: "Jewari Bhakari", category: "Roti", price: "30", isVeg: true },
    { name: "Bajari Bhakari", category: "Roti", price: "25", isVeg: true },
    { name: "Butter Bhakari", category: "Roti", price: "35", isVeg: true },
    { name: "Cheese Garlic Naan", category: "Roti", price: "100", isVeg: true },
    { name: "Butter Cheese Garlic Naan", category: "Roti", price: "110", isVeg: true },

    // ===== JUICE =====
    { name: "Seasonal Fresh Fruits Juice", category: "Juice", price: "80", isVeg: true },

    // ===== ICE-CREAM =====
    { name: "Butter Scotch Ice Cream", category: "Ice-Cream", price: "60", isVeg: true },
    { name: "Vanilla Ice Cream", category: "Ice-Cream", price: "60", isVeg: true },
    { name: "Mango Ice Cream", category: "Ice-Cream", price: "60", isVeg: true },
    { name: "Strawberry Ice Cream", category: "Ice-Cream", price: "60", isVeg: true },
    { name: "Kulfi", category: "Ice-Cream", price: "60", isVeg: true },
];

async function seedHotelSangram() {
    console.log("Looking for 'Hotel Sangram' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Sangram%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel Sangram' provider not found!");
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

seedHotelSangram().catch((err) => {
    console.error("Error seeding Hotel Sangram:", err);
    process.exit(1);
});
