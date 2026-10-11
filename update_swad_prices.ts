import { db } from "./server/db";
import { restaurantMenuItems } from "./shared/schema";
import { eq } from "drizzle-orm";

const newMenuMap: Record<string, number> = {
  "Veg Biryani Half": 80,
  "Veg Biryani Full": 130,
  "Veg Fry Pan Biryani": 130,
  "Chicken Hyderabadi Biryani Half": 100,
  "Chicken Hyderabadi Biryani Full": 150,
  "Chicken Tandoor Biryani Half": 110,
  "Chicken Tandoor Biryani Full": 160,
  "Chicken Fry Pan Biryani": 150,
  "Mutton Fry Pan Biryani": 300,
  "Veg Biryani (1 KG)": 800,
  "Hyderabadi Biryani (1 KG)": 1000,
  "Tandoor Biryani (1 KG)": 1100,
  "Lucknow Biryani (1 KG)": 1200,
  "Mutton Biryani (1 KG)": 2000,
  
  "Masala Papad": 40,
  "Roasted Papad": 25,
  "Fry Papad": 30,
  "Soyabin Chilly": 120,
  "Soyabin Fry (Kadak)": 130,
  "Paneer Chilly": 160,
  "Veg Manchurian": 130,
  "Paneer Dragon Chilly": 170,
  "Paneer Tikka": 150,
  "Paneer Pahadi Tikka": 150,

  "Mutton Fry": 330,
  "Chicken Fry": 190,
  "Mutton Kharda": 300,
  "Chicken Kharda": 180,
  "Chicken Khare (Sajuk Tupatle)": 200,
  "Mutton Khare (Sajuk Tupatle)": 320,
  "Macchi Fry": 170,
  "Macchi Roast": 150,
  "Anda Boil": 40,
  "Anda Boil Fry": 60,
  "Anda Omelette": 40,
  "Chicken Tandoor Half": 200,
  "Chicken Tandoor Full": 360,
  "Chicken Lollipop Half": 100,
  "Chicken Lollipop Full": 180,
  "Chicken Chilly": 170,
  "Chicken 65": 150,
  "Chicken Dragon Chilly": 170,
  "Chilly Lollipop": 200,
  "Chicken Manchurian": 150,
  "Chicken Tikka": 150,
  "Chicken Pahadi Tikka": 160,
  "Chicken Malai Tikka": 170,

  "Chicken Aalani Ukkad": 170,
  "Mutton Aalani Ukkad": 320,

  "Chicken Masala": 190,
  "Chicken Curry": 180,
  "Chicken Kolhapuri": 190,
  "Butter Chicken (Sweet)": 220,
  "Anda Curry": 130,
  "Anda Masala": 150,
  "Anda Bhurji": 100,
  "Chicken Handi Half": 330,
  "Chicken Handi Full": 530,
  "Chicken Malwani Half": 370,
  "Chicken Malwani Full": 600,

  "Mutton Masala": 300,
  "Mutton Curry": 280,
  "Mutton Handi Half": 500,
  "Mutton Handi Full": 900,

  "Chicken Aalani Rice": 200,
  "Mutton Aalani Rice": 250,
  "Indrayani Rice Half": 70,
  "Indrayani Rice Full": 120,
  "Jeera Rice Half": 70,
  "Jeera Rice Full": 120,
  "Plain Rice Half": 60,
  "Plain Rice Full": 100,

  "Paneer Masala": 150,
  "Butter Paneer Masala": 170,
  "Kaju Paneer Masala": 180,
  "Kaju Masala": 170,
  "Kaju Curry": 150,
  "Mutter Paneer": 140,
  "Paneer Bhurji": 160,
  "Veg Kolhapuri": 150,
  "Shev Bhaji": 110,
  "Green Peas Masala": 130,
  "Veg Maratha": 180,
  "Mix Veg": 140,
  "Baingan Masala": 130,
  "Dal Fry": 100,
  "Dal Tadka": 120,
  "Dal Khichdi": 140,
  "Dal Khichdi Tadka": 150,
  "Akkha Masoor": 130,
  "Soyabean Masala": 130,
  "Aloo Mutter Masala": 120,

  "Veg Handi Half": 350,
  "Veg Handi Full": 550,
  "Paneer Handi Half": 370,
  "Paneer Handi Full": 550,
  "Green Peas Handi Half": 350,
  "Green Peas Handi Full": 500,

  "Chicken Fried Rice Half": 80,
  "Chicken Fried Rice Full": 130,
  "Chicken Schezwan Rice Half": 90,
  "Chicken Schezwan Rice Full": 140,
  "Chicken Triple Rice Half": 130,
  "Chicken Triple Rice Full": 180,
  "Anda Fried Rice Half": 80,
  "Anda Fried Rice Full": 130,
  "Anda Schezwan Fried Rice Half": 80,
  "Anda Schezwan Fried Rice Full": 130,

  "Chicken Noodles Half": 80,
  "Chicken Noodles Full": 130,
  "Schezwan Chicken Noodles Half": 90,
  "Schezwan Chicken Noodles Full": 140,
  "Anda Noodles Half": 80,
  "Anda Noodles Full": 130,
  "Schezwan Anda Noodles Half": 90,
  "Schezwan Anda Noodles Full": 140,
  "Chicken Hakka Noodles Half": 100,
  "Chicken Hakka Noodles Full": 150,
  "Anda Hakka Noodles Half": 90,
  "Anda Hakka Noodles Full": 140,
  "Chicken Triple Noodles Half": 130,
  "Chicken Triple Noodles Full": 180,

  "Prawns 65": 250,
  "Prawns Chilly": 270,

  "Manchurian Fried Rice Half": 80,
  "Manchurian Fried Rice Full": 130,
  "Schezwan Fried Rice Half": 90,
  "Schezwan Fried Rice Full": 140,
  "Hakka Rice Half": 100,
  "Hakka Rice Full": 150,
  "Veg Triple Rice Half": 100,
  "Veg Triple Rice Full": 150,

  "Veg Noodles Half": 80,
  "Veg Noodles Full": 130,
  "Schezwan Veg Noodles Half": 90,
  "Schezwan Veg Noodles Full": 140,
  "Hakka Noodles Half": 90,
  "Hakka Noodles Full": 140,
  "Veg Triple Noodles Half": 100,
  "Veg Triple Noodles Full": 140,

  "Veg Soup": 60
};

async function main() {
  const providerId = "chcs2768s4dq7hrr9l1sev3l";
  const items = await db.query.restaurantMenuItems.findMany({
    where: eq(restaurantMenuItems.providerId, providerId)
  });

  console.log(`Found ${items.length} items. Processing updates...`);

  for (const item of items) {
    let newPrice = 0;
    
    if (newMenuMap[item.name]) {
      // 1. If it's explicitly in the updated menucard
      const basePrice = newMenuMap[item.name];
      newPrice = Math.round(basePrice * 1.15); // Increase by 15%
    } else {
      // 2. Not in the updated menucard, fallback to calculating old base then applying 15%
      const currentPrice = parseFloat(item.price as string);
      // Revert previous 10% increase to get approximate base price
      // For instance 77 -> 77 / 1.10 = 70.
      let basePrice = Math.round(currentPrice / 1.10);
      newPrice = Math.round(basePrice * 1.15);
    }
    
    // Convert to 2 decimal string
    const newPriceStr = newPrice.toFixed(2);
    
    if (item.price !== newPriceStr) {
      await db.update(restaurantMenuItems)
        .set({ price: newPriceStr })
        .where(eq(restaurantMenuItems.id, item.id));
      console.log(`Updated [${item.name}]: ${item.price} -> ${newPriceStr}`);
    }
  }

  console.log("Update complete!");
  process.exit(0);
}

main().catch(console.error);
