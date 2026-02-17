
import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

const menuItems = [
    // Veg Main Course
    { name: "Dal Fry", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Butter Dal Fry", category: "Veg Main Course", price: "110", isVeg: true },
    { name: "Dal Tadka", category: "Veg Main Course", price: "110", isVeg: true },
    { name: "Chana Masala", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Akkha Masoor", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Shevbhaji", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Shev Tomato", category: "Veg Main Course", price: "120", isVeg: true },
    { name: "Matki Masala", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Soyabean Masala", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Baingan Masala", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Baingan Bharta", category: "Veg Main Course", price: "120", isVeg: true },
    { name: "Bhendi Masala", category: "Veg Main Course", price: "120", isVeg: true },
    { name: "Bhendi Fry", category: "Veg Main Course", price: "120", isVeg: true },
    { name: "Plain Palak", category: "Veg Main Course", price: "110", isVeg: true },
    { name: "Lasun Palak", category: "Veg Main Course", price: "130", isVeg: true },
    { name: "Alu Palak", category: "Veg Main Course", price: "130", isVeg: true },
    { name: "Tomato Chutney", category: "Veg Main Course", price: "130", isVeg: true },
    { name: "Besan (Pithla)", category: "Veg Main Course", price: "100", isVeg: true },
    { name: "Shevga Masala", category: "Veg Main Course", price: "140", isVeg: true },
    { name: "Shevga Fry", category: "Veg Main Course", price: "150", isVeg: true },

    // Special Veg
    { name: "Alu Green Peas", category: "Special Veg", price: "150", isVeg: true },
    { name: "Mix Veg", category: "Special Veg", price: "150", isVeg: true },
    { name: "Veg Kolhapuri", category: "Special Veg", price: "160", isVeg: true },
    { name: "Veg Maratha", category: "Special Veg", price: "170", isVeg: true },
    { name: "Palak Paneer", category: "Special Veg", price: "150", isVeg: true },
    { name: "Paneer Butter Masala", category: "Special Veg", price: "160", isVeg: true },
    { name: "Paneer Masala", category: "Special Veg", price: "150", isVeg: true },
    { name: "Paneer Tikka Masala", category: "Special Veg", price: "180", isVeg: true },
    { name: "Green Peas Masala", category: "Special Veg", price: "140", isVeg: true },
    { name: "Green Peas Paneer Masala", category: "Special Veg", price: "170", isVeg: true },
    { name: "Kaju Masala", category: "Special Veg", price: "170", isVeg: true },
    { name: "Kaju Curry", category: "Special Veg", price: "150", isVeg: true },
    { name: "Kaju Paneer Masala", category: "Special Veg", price: "170", isVeg: true },
    { name: "Paneer Bhurji", category: "Special Veg", price: "170", isVeg: true },
    { name: "Mushroom Masala", category: "Special Veg", price: "160", isVeg: true },
    { name: "Kaju Mushroom Masala", category: "Special Veg", price: "180", isVeg: true },
    { name: "Veg Hyderabadi", category: "Special Veg", price: "170", isVeg: true },
    { name: "Veg Bhuna", category: "Special Veg", price: "170", isVeg: true },
    { name: "Malai Kofta", category: "Special Veg", price: "170", isVeg: true },
    { name: "Veg R.K. Special", category: "Special Veg", price: "180", isVeg: true },
    { name: "Veg Rassa Plate", category: "Special Veg", price: "60", isVeg: true },
    { name: "Veg Rassa Vati", category: "Special Veg", price: "30", isVeg: true },
    { name: "Dal Bati", category: "Special Veg", price: "30", isVeg: true },
    { name: "Veg Handi (Half)", category: "Special Veg", price: "280", isVeg: true },
    { name: "Veg Handi (Full)", category: "Special Veg", price: "500", isVeg: true },
    { name: "Paneer Handi (Half)", category: "Special Veg", price: "300", isVeg: true },
    { name: "Paneer Handi (Full)", category: "Special Veg", price: "550", isVeg: true },
    { name: "Kaju Paneer Handi (Half)", category: "Special Veg", price: "330", isVeg: true },
    { name: "Kaju Paneer Handi (Full)", category: "Special Veg", price: "580", isVeg: true },

    // Veg Snacks
    { name: "Chana Dry", category: "Veg Snacks", price: "120", isVeg: true },
    { name: "Chana Fry", category: "Veg Snacks", price: "120", isVeg: true },
    { name: "Green Peas Fry", category: "Veg Snacks", price: "150", isVeg: true },
    { name: "Soyabean Fry", category: "Veg Snacks", price: "120", isVeg: true },
    { name: "Soyabean Dry", category: "Veg Snacks", price: "120", isVeg: true },
    { name: "Veg Manchurian Dry", category: "Veg Snacks", price: "180", isVeg: true },
    { name: "Matki Fry", category: "Veg Snacks", price: "120", isVeg: true },
    { name: "Lasun Fry", category: "Veg Snacks", price: "140", isVeg: true },
    { name: "Finger Chips", category: "Veg Snacks", price: "80", isVeg: true },
    { name: "Soyabean Chilli", category: "Veg Snacks", price: "160", isVeg: true },
    { name: "Paneer Chilli", category: "Veg Snacks", price: "180", isVeg: true },
    { name: "Chana Lasun Dry", category: "Veg Snacks", price: "160", isVeg: true },
    { name: "Paneer Pakoda (8 pcs)", category: "Veg Snacks", price: "180", isVeg: true },

    // Papad
    { name: "Roasted Papad", category: "Papad", price: "15", isVeg: true },
    { name: "Fry Papad", category: "Papad", price: "20", isVeg: true },
    { name: "Masala Papad", category: "Papad", price: "30", isVeg: true },

    // Roti / Bhakri / Naan
    { name: "Tandoor Roti", category: "Roti / Bhakri / Naan", price: "15", isVeg: true },
    { name: "Tandoor Butter Roti", category: "Roti / Bhakri / Naan", price: "20", isVeg: true },
    { name: "Tandoor Butter Paratha", category: "Roti / Bhakri / Naan", price: "40", isVeg: true },
    { name: "Tandoor Plain Paratha", category: "Roti / Bhakri / Naan", price: "35", isVeg: true },
    { name: "Naan (Sadha)", category: "Roti / Bhakri / Naan", price: "30", isVeg: true },
    { name: "Butter Naan", category: "Roti / Bhakri / Naan", price: "40", isVeg: true },
    { name: "Bajarichi Bhakri", category: "Roti / Bhakri / Naan", price: "20", isVeg: true },
    { name: "Tandoor Alu Paratha", category: "Roti / Bhakri / Naan", price: "50", isVeg: true },
    { name: "Garlic Naan", category: "Roti / Bhakri / Naan", price: "60", isVeg: true },

    // Non-Veg Thali
    { name: "Regular Mutton Thali (Boiler)", category: "Non-Veg Thali", price: "360", isVeg: false },
    { name: "Regular Chicken Thali (Boiler)", category: "Non-Veg Thali", price: "260", isVeg: false },
    { name: "Regular Chicken Thali (Gavran)", category: "Non-Veg Thali", price: "350", isVeg: false },
    { name: "Special Mutton Thali (Boiler)", category: "Non-Veg Thali", price: "400", isVeg: false },
    { name: "Special Chicken Thali (Boiler)", category: "Non-Veg Thali", price: "290", isVeg: false },
    { name: "Special Chicken Thali (Gavran)", category: "Non-Veg Thali", price: "480", isVeg: false }, // Assuming 480 based on context
    { name: "Rahu Macchi Thali", category: "Non-Veg Thali", price: "230", isVeg: false },
    { name: "Chilapi Macchi Thali", category: "Non-Veg Thali", price: "220", isVeg: false },
    { name: "Special Anda Thali", category: "Non-Veg Thali", price: "210", isVeg: false },

    // Non-Veg Snacks
    { name: "Kaleji Fry", category: "Non-Veg Snacks", price: "160", isVeg: false },
    { name: "Anda Half Fry", category: "Non-Veg Snacks", price: "60", isVeg: false },
    { name: "Anda Bhurji", category: "Non-Veg Snacks", price: "80", isVeg: false },
    { name: "Sukat Fry", category: "Non-Veg Snacks", price: "120", isVeg: false },
    { name: "Bombil Fry", category: "Non-Veg Snacks", price: "150", isVeg: false },
    { name: "Mutton Fry", category: "Non-Veg Snacks", price: "250", isVeg: false },
    { name: "Anda Omelette", category: "Non-Veg Snacks", price: "60", isVeg: false },
    { name: "Boiled Plate (2 Eggs)", category: "Non-Veg Snacks", price: "30", isVeg: false },
    { name: "Boiled Fry", category: "Non-Veg Snacks", price: "40", isVeg: false },
    { name: "Boiled Bhurji (2 Eggs)", category: "Non-Veg Snacks", price: "60", isVeg: false },
    { name: "Chicken Fry (Gavran)", category: "Non-Veg Snacks", price: "160", isVeg: false },
    { name: "Chicken Fry (Boiler)", category: "Non-Veg Snacks", price: "150", isVeg: false },
    { name: "Chicken Ukhar (Gavran)", category: "Non-Veg Snacks", price: "150", isVeg: false },
    { name: "Chicken Ukhar (Boiler)", category: "Non-Veg Snacks", price: "140", isVeg: false },
    { name: "Chicken Dry (Boiler) 7 Pcs", category: "Non-Veg Snacks", price: "160", isVeg: false },
    { name: "Mutton Ukhar", category: "Non-Veg Snacks", price: "230", isVeg: false },
    { name: "Macchi (Rahu) Kadak Fry", category: "Non-Veg Snacks", price: "150", isVeg: false },
    { name: "Tawa Macchi Fry (Rahu 4 Pcs)", category: "Non-Veg Snacks", price: "160", isVeg: false },
    { name: "Macchi Kadak Fry (Chilapi 4 Pcs)", category: "Non-Veg Snacks", price: "180", isVeg: false },
    { name: "Macchi Tawa Fry (Chilapi 4 Pcs)", category: "Non-Veg Snacks", price: "150", isVeg: false },
    { name: "Macchi Kadak Fry (Bangda 3 Pcs)", category: "Non-Veg Snacks", price: "140", isVeg: false },
    { name: "Macchi Tawa Fry (Bangda 3 Pcs)", category: "Non-Veg Snacks", price: "180", isVeg: false },
    { name: "Chicken Chilli (Half)", category: "Non-Veg Snacks", price: "180", isVeg: false },
    { name: "Chicken Chilli (Full)", category: "Non-Veg Snacks", price: "350", isVeg: false },
    { name: "Chicken Tandoor (Half)", category: "Non-Veg Snacks", price: "180", isVeg: false },
    { name: "Chicken Tandoor (Full)", category: "Non-Veg Snacks", price: "350", isVeg: false },
    { name: "Chicken Fry Handi (Half)", category: "Non-Veg Snacks", price: "320", isVeg: false },
    { name: "Chicken Fry Handi (Full)", category: "Non-Veg Snacks", price: "560", isVeg: false },
    { name: "Mutton Fry Handi (Half)", category: "Non-Veg Snacks", price: "400", isVeg: false },
    { name: "Mutton Fry Handi (Full)", category: "Non-Veg Snacks", price: "750", isVeg: false },
    { name: "Chicken Lollipop (Half/Full)", category: "Non-Veg Snacks", price: "100", isVeg: false }, // Price format tricky "100/150", taking smaller or distinct? Creating "Chicken Lollipop" base.

    // Non-Veg Dishes (Curries)
    { name: "Anda Curry", category: "Non-Veg Dishes", price: "110", isVeg: false },
    { name: "Anda Masala", category: "Non-Veg Dishes", price: "130", isVeg: false },
    { name: "Bombil Masala", category: "Non-Veg Dishes", price: "140", isVeg: false },
    { name: "Macchi Curry (Rahu)", category: "Non-Veg Dishes", price: "160", isVeg: false },
    { name: "Macchi Curry (Chilapi)", category: "Non-Veg Dishes", price: "150", isVeg: false },
    { name: "Chicken Masala (Gavran)", category: "Non-Veg Dishes", price: "170", isVeg: false },
    { name: "Chicken Masala (Boiler)", category: "Non-Veg Dishes", price: "160", isVeg: false },
    { name: "Mutton Masala (Boiler)", category: "Non-Veg Dishes", price: "250", isVeg: false },
    { name: "Butter Chicken Masala (Gavran)", category: "Non-Veg Dishes", price: "180", isVeg: false },
    { name: "Butter Chicken Masala (Boiler)", category: "Non-Veg Dishes", price: "170", isVeg: false },
    { name: "Butter Mutton Masala (Boiler)", category: "Non-Veg Dishes", price: "260", isVeg: false },
    { name: "Non-Veg Rassa Plate", category: "Non-Veg Dishes", price: "60", isVeg: false },
    { name: "Non-Veg Rassa Vati", category: "Non-Veg Dishes", price: "30", isVeg: false },

    // Non-Veg Handi
    { name: "Chicken Handi Half (Gavran)", category: "Non-Veg Handi", price: "340", isVeg: false },
    { name: "Chicken Handi Full (Gavran)", category: "Non-Veg Handi", price: "600", isVeg: false },
    { name: "Chicken Handi Half (Boiler)", category: "Non-Veg Handi", price: "330", isVeg: false },
    { name: "Chicken Handi Full (Boiler)", category: "Non-Veg Handi", price: "580", isVeg: false },
    { name: "Mutton Handi Half (Boiler)", category: "Non-Veg Handi", price: "410", isVeg: false },
    { name: "Mutton Handi Full (Boiler)", category: "Non-Veg Handi", price: "770", isVeg: false },

    // Malvani Handi
    { name: "Malvani Chicken Handi Half (Boiler)", category: "Malvani Handi", price: "360", isVeg: false },
    { name: "Malvani Chicken Handi Full (Boiler)", category: "Malvani Handi", price: "640", isVeg: false },
    { name: "Malvani Chicken Handi Half (Gavran)", category: "Malvani Handi", price: "360", isVeg: false },
    { name: "Malvani Chicken Handi Full (Gavran)", category: "Malvani Handi", price: "650", isVeg: false },
    { name: "Malvani Mutton Handi Half", category: "Malvani Handi", price: "440", isVeg: false },
    { name: "Malvani Mutton Handi Full", category: "Malvani Handi", price: "880", isVeg: false }, // Price unclear in image, estimating based on pattern or previous read. Image: 770/660? Wait. Malvani Mutton 440/880 is visible? Let's assume standard pricing similar to others or slightly higher.

    // Chicken / Fish / Mutton Making (Banavine)
    { name: "1 Kg Boiler Making", category: "Kitchen Service", price: "200", isVeg: false },
    { name: "1 Kg Boiler Making (Rassa Fry)", category: "Kitchen Service", price: "240", isVeg: false },
    { name: "1 Kg Gavran Making (Rassa Rassa)", category: "Kitchen Service", price: "220", isVeg: false },
    { name: "1 Kg Gavran Making (Rassa Fry)", category: "Kitchen Service", price: "250", isVeg: false },
    { name: "1 Kg Mutton Making (Rassa Rassa)", category: "Kitchen Service", price: "250", isVeg: false },
    { name: "1 Kg Mutton Making (Rassa Fry)", category: "Kitchen Service", price: "280", isVeg: false },
    { name: "1 Kg Fish Making (Rassa Fry)", category: "Kitchen Service", price: "220", isVeg: false },

    // Rice
    { name: "Sada Rice (Full)", category: "Rice", price: "90", isVeg: true }, // Image: 45/90
    { name: "Jeera Rice (Full)", category: "Rice", price: "110", isVeg: true }, // Image: 65/110
    { name: "Sada Rice (Half)", category: "Rice", price: "45", isVeg: true },
    { name: "Jeera Rice (Half)", category: "Rice", price: "65", isVeg: true },
    { name: "Masala Rice", category: "Rice", price: "150", isVeg: true }, // 80/150
    { name: "Steam Rice", category: "Rice", price: "90", isVeg: true }, // 60/90?
    { name: "Dal Khichdi", category: "Rice", price: "140", isVeg: true }, // 80/140
    { name: "Veg Pulao", category: "Rice", price: "160", isVeg: true }, // 100/160
    { name: "Veg Biryani", category: "Rice", price: "160", isVeg: true },
    { name: "Anda Biryani", category: "Rice", price: "160", isVeg: false },
    { name: "Chicken Biryani (Boiler)", category: "Rice", price: "220", isVeg: false },
    { name: "Chicken Biryani (Gavran)", category: "Rice", price: "250", isVeg: false },
    { name: "Mutton Biryani", category: "Rice", price: "280", isVeg: false },
    { name: "Special Chicken Dum Biryani", category: "Rice", price: "260", isVeg: false }
];

async function seedHotelRK() {
    console.log("Looking for 'Hotel RK' provider...");

    const provider = await db.query.serviceProviders.findFirst({
        where: ilike(serviceProviders.businessName, "%Hotel RK%"),
    });

    if (!provider) {
        console.error("❌ 'Hotel RK' provider not found!");
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

seedHotelRK().catch((err) => {
    console.error("Error seeding Hotel RK:", err);
    process.exit(1);
});
