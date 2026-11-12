// server/add-suman-full-menu.ts
// Adds the full "Suman Pure Veg" menu card (menucards/SUMAN.pdf) with +15% pricing.
// The pizza/pasta/burger items from add-hotel-suman-menu.ts are left untouched
// (they are already priced at +15%). Safe to re-run: existing names are updated, not duplicated.

import "dotenv/config";
import { pool } from "./db";
import { createId } from "@paralleldrive/cuid2";

const PROVIDER_ID = "fhryl5wnj8r135tknocm0vpw"; // Suman pure veg
const MARKUP = 1.15;
const IMG = (f: string) => `/images/menu-items/${f}`;

// [name, menu-card price, image override?, popular?]
type Row = [string, number, string?, boolean?];
interface Section {
  category: string;
  cuisine: string;
  image: string;
  description: string;
  items: Row[];
}

const sections: Section[] = [
  {
    category: "Pavbhaji Starters", cuisine: "Street Food", image: "butter_pav.jpg",
    description: "Mumbai style pav starter, made fresh to order.",
    items: [
      ["Masala Pav", 100], ["Masala Pav Gravy", 120], ["Cheese Masala Pav", 140],
      ["Cheese Melted Masala Pav", 160], ["Aloo Chaat", 120, "pani_puri.jpg"],
      ["Cheese Aloo Chaat", 150, "pani_puri.jpg"], ["Garlic Chutney", 100],
    ],
  },
  {
    category: "Mumbai Pavbhaji", cuisine: "Street Food", image: "pav_bhaji.jpg",
    description: "Buttery Mumbai pav bhaji served with soft pav.",
    items: [
      ["Amul Pavbhaji", 120, undefined, true], ["Cheese Pavbhaji", 160, undefined, true],
      ["Khada Pavbhaji", 150], ["Cheese Khada Pavbhaji", 180], ["Jain Pavbhaji", 150],
      ["Jain Cheese Pavbhaji", 180], ["Jain Khada Pavbhaji", 160], ["Jain Cheese Khada Pavbhaji", 190],
      ["Paneer Pavbhaji", 180], ["Paneer Cheese Pavbhaji", 220], ["Spl. Cheese Melted Pavbhaji", 250],
      ["Spl. Amul Tadka Pavbhaji", 220], ["Spl. Paneer Bhurji Pav", 200], ["Bhaji Plate", 100],
      ["Extra Pav", 20, "butter_pav.jpg"],
    ],
  },
  {
    category: "Tava Pulao", cuisine: "Street Food", image: "pulao.jpg",
    description: "Mumbai style tava pulao tossed with pav bhaji masala.",
    items: [
      ["Tava Pulao", 150, undefined, true], ["Tava Pulao Schezwan", 180], ["Cheese Tava Pulao", 180],
      ["Cheese Tava Pulao Schezwan", 210], ["Jain Tava Pulao", 160], ["Jain Tava Cheese Pulao", 190],
      ["Paneer Tava Pulao", 180], ["Paneer Tava Pulao Schezwan", 210], ["Paneer Cheese Tava Pulao", 240],
      ["Paneer Cheese Tava Pulao With Schezwan", 260], ["Extra Raita", 30, "salad.jpg"],
      ["Extra Schezwan Chutney", 30], ["Extra Cheese", 60],
    ],
  },
  {
    category: "Special Delhi Chaat", cuisine: "Chaat", image: "pani_puri.jpg",
    description: "Delhi style chaat with sweet & tangy chutneys.",
    items: [
      ["Cold Pani Puri", 40, undefined, true], ["Ragda Pani Puri", 40], ["Masala Puri", 50],
      ["Suki Bhel (Dry Bhel)", 50], ["Bhel Puri", 50], ["Dahi Bhel Puri", 80], ["Cheese Bhel Puri", 90],
      ["Sev Puri", 60], ["Cheese Sev Puri", 80], ["Dahi Puri", 80, undefined, true], ["Special Dahi Puri", 100],
      ["Ragda Puri", 70], ["Dahi Ragda Puri", 80], ["Ragda Patties", 70], ["Ragda Samosa", 90, "samosa.jpg"],
      ["Dahi Kachori", 70], ["Dahi Kachori Chat", 100], ["Dahi Ragda Patties", 90],
      ["Samosa Bhel", 90, "samosa.jpg"], ["Dahi Samosa", 90, "samosa.jpg"], ["Samosa Chat", 70, "samosa.jpg"],
      ["Papdi Chat", 80], ["Kachori Bhel", 100], ["Dil Khush Bhel", 100], ["Kurkure Bhel", 70],
      ["Cheese Kurkure Bhel", 100], ["Dahi Papdi", 90], ["Dahi Vada", 100], ["Dahi Tokri Chat", 120],
      ["Dahi Cheese Tokri Chat", 150], ["Paneer Cheese Tokri Chat", 200],
    ],
  },
  {
    category: "Veg Soya Chaap", cuisine: "Tandoor", image: "paneer_tikka.jpg",
    description: "Marinated soya chaap roasted in the tandoor.",
    items: [
      ["Tandoori Soya Chaap", 180], ["Malai Soya Chaap", 220], ["Hariyali Soya Chaap", 160],
      ["Afghani Soya Chaap", 180], ["Moti Soya Chaap Spicy", 200],
    ],
  },
  {
    category: "Soup", cuisine: "Chinese", image: "soup.jpg",
    description: "Hot freshly made soup.",
    items: [
      ["Tomato Soup", 80], ["Mix Veg Soup", 90], ["Manchow Soup", 100, "manchau_soup.jpg", true],
      ["Hot & Sour Soup", 100], ["Veg Noodle Soup", 100], ["Lemon Coriander Soup", 100],
      ["Manchurian Soup", 120], ["Paneer Soup", 120], ["Sweet Corn Soup", 130], ["Cream of Mushroom", 140],
    ],
  },
  {
    category: "Starters", cuisine: "Chinese", image: "manchurian_dry.jpg",
    description: "Indo-Chinese veg starter.",
    items: [
      ["Veg Lollipop", 150], ["Chinese Bhel", 150, "chinese_bhel.jpg"], ["Veg 65", 150],
      ["Spring Roll", 180], ["Paneer Chilli Dry", 200, "paneer_dish.jpg", true],
      ["Paneer Chilli Gravy", 220, "paneer_dish.jpg"], ["Veg Manchurian Dry", 150, undefined, true],
      ["Veg Manchurian Gravy", 170, "manchurian.jpg"], ["Paneer Manchurian Dry", 220],
      ["Paneer Manchurian Gravy", 240, "manchurian.jpg"], ["Mushroom Manchurian Dry", 200],
      ["Mushroom Manchurian Gravy", 220, "manchurian.jpg"], ["Veg Crispy", 160], ["Paneer Crispy", 240],
      ["Hara Bhara Kabab", 180], ["Veg Ball Schezwan Dry", 180], ["Cheese Corn Ball", 250],
      ["Cheese Corn Croquette", 300], ["Paneer Satay", 260, "paneer_tikka.jpg"],
      ["Cheese Ball Manchurian", 240],
    ],
  },
  {
    category: "Tandoori Starter", cuisine: "Tandoor", image: "paneer_tikka.jpg",
    description: "Paneer marinated in spices and roasted in the tandoor.",
    items: [
      ["Paneer Tikka", 280, undefined, true], ["Paneer Malai Tikka", 300], ["Angara Malai Tikka", 300],
      ["Hariyali Paneer Tikka", 250], ["Paneer Lasuni Tikka", 280], ["Paneer Reshmi Tikka", 280],
      ["Paneer Banjara Tikka", 280],
    ],
  },
  {
    category: "Punjabi Zaika", cuisine: "North Indian", image: "veg_curry.jpg",
    description: "Punjabi style vegetable main course.",
    items: [
      ["Veg Hyderabadi", 210], ["Methi Matar Malai", 220], ["Kaju Kari", 260], ["Kaju Masala", 260],
      ["Mix Vegetable", 180], ["Aloo Matar", 150], ["Aloo Palak", 170], ["Aloo Jeera", 140],
      ["Aloo Gobi", 170], ["Plain Palak", 120], ["Lasuni Palak", 200], ["Green Peas Masala", 170],
      ["Green Peas Fry", 120], ["Baingan Masala", 150], ["Baingan Bharta", 160], ["Dum Aloo Punjabi", 200],
      ["Bhendi Masala", 140], ["Bhendi Fry", 150], ["Veg Kolhapuri", 200, undefined, true],
      ["Methi Masala", 160], ["Shev Bhaji", 180], ["Veg Do Pyaza", 220], ["Veg Kofta", 240],
      ["Veg Lahori", 240], ["Veg Kadhai", 240], ["Veg Maharaja", 260], ["Veg Malvani", 280],
      ["Shevga Fry", 180], ["Shevga Hundi", 250], ["Veg Bhuna", 200], ["Veg Chilimili", 200],
      ["Cheese Kofta", 240], ["Navratan Korma", 240], ["Mushroom Masala", 220],
      ["Mushroom Butter Masala", 260], ["Veg Dilruba", 220], ["Veg Angara", 240],
    ],
  },
  {
    category: "Paneer-E-Khaas", cuisine: "North Indian", image: "paneer_dish.jpg",
    description: "Fresh buffalo-milk paneer in rich gravy.",
    items: [
      ["Paneer Masala", 200], ["Palak Paneer", 210], ["Paneer Butter Masala", 230, undefined, true],
      ["Paneer Cheese Butter Masala", 260], ["Paneer Tikka Masala", 280, undefined, true],
      ["Paneer Kadhai", 220], ["Paneer Hundi", 300], ["Paneer Saoji", 240], ["Paneer Kolhapuri", 240],
      ["Matar Paneer", 210], ["Paneer Lacchedar", 230], ["Paneer Do Pyaza", 220], ["Paneer Kofta", 250],
      ["Paneer Chingari", 240], ["Paneer Kaju Masala", 280], ["Paneer Mushroom Masala", 280],
      ["Paneer Cheese Masala", 250], ["Paneer Pasanda", 250], ["Paneer Maharaja", 250],
      ["Paneer Laziz", 230], ["Paneer Tadkawala", 260],
    ],
  },
  {
    category: "Suman Special", cuisine: "North Indian", image: "paneer_dish.jpg",
    description: "House special recipe from Suman's kitchen.",
    items: [
      ["Paneer Chatpata", 280], ["Veg Patiyala", 290, "veg_curry.jpg"], ["Paneer Mumtaz", 250],
      ["Paneer Lababdar", 260, undefined, true], ["Paneer Laung Lata", 280], ["Paneer Khurchand", 280],
      ["Paneer Rajwadi", 300], ["Veg Diwani Hundi", 320, "veg_curry.jpg"], ["Veg Jaipuri", 250, "veg_curry.jpg"],
      ["Paneer Patiyala", 330], ["Veg Hundi", 280, "veg_curry.jpg"], ["Kashmiri Dum Aloo", 220, "veg_curry.jpg"],
      ["Paneer Moghlai", 300],
    ],
  },
  {
    category: "Jain Special", cuisine: "Jain", image: "paneer_dish.jpg",
    description: "Prepared Jain style, without onion, garlic or root vegetables.",
    items: [
      ["Jain Shahi Paneer", 240], ["Jain Matar Paneer", 210], ["Jain Methi Fry", 150, "veg_curry.jpg"],
      ["Jain Palak Paneer", 260], ["Jain Navratan Korma", 240, "veg_curry.jpg"], ["Jain Paneer Bhurji", 200],
      ["Jain Bhindi Fry", 150, "veg_curry.jpg"], ["Jain Dal Fry", 140, "dal.jpg"],
    ],
  },
  {
    category: "Chinese Rice", cuisine: "Chinese", image: "fried_rice.jpg",
    description: "Wok tossed Indo-Chinese rice.",
    items: [
      ["Veg Fried Rice", 150, undefined, true], ["Veg Schezwan Fried Rice", 180], ["Singapore Rice", 220],
      ["Triple Schezwan Rice", 240], ["Manchurian Fried Rice", 190], ["Manchurian Schezwan Fried Rice", 210],
      ["Paneer Fried Rice", 220], ["Paneer Schezwan Rice", 230], ["Hongkong Rice", 240],
      ["Paneer Garlic Fried Rice", 200], ["Paneer Palak Fried Rice", 180], ["Palak Rice", 170],
      ["Garlic Fried Rice", 190], ["Green Chilli Pot Rice", 250], ["Suman Special Sizzler Rice", 300],
    ],
  },
  {
    category: "Chinese Noodles", cuisine: "Chinese", image: "hakka_noodles.jpg",
    description: "Wok tossed Indo-Chinese noodles.",
    items: [
      ["Veg Hakka Noodle", 150, undefined, true], ["Manchurian Noodles", 200, "noodles.jpg"],
      ["Manchurian Schezwan Noodles", 220, "noodles.jpg"], ["Schezwan Noodles", 200, "noodles.jpg"],
      ["Hongkong Noodles", 240], ["Singapore Noodles", 240], ["Garlic Noodles", 200],
      ["Paneer Noodles", 220], ["Paneer Schezwan Noodles", 240, "noodles.jpg"], ["Triple Noodles", 260],
    ],
  },
  {
    category: "Dal", cuisine: "North Indian", image: "dal.jpg",
    description: "Home style dal.",
    items: [["Plain Dal", 100], ["Dal Fry", 140, undefined, true], ["Dal Tadka", 150], ["Kolhapuri Dal", 180]],
  },
  {
    category: "Rice", cuisine: "North Indian", image: "rice_dish.jpg",
    description: "Rice, khichadi and matka biryani.",
    items: [
      ["Steam Rice (Half)", 60], ["Steam Rice (Full)", 100], ["Jeera Rice (Half)", 70],
      ["Jeera Rice (Full)", 120], ["Masala Rice", 180], ["Dal Khichadi Plain", 150], ["Dal Khichadi", 180],
      ["Dal Khichadi Tadka", 200], ["Veg Matka Biryani", 200, "biryani.jpg", true],
      ["Hyderabadi Matka Biryani", 250, "biryani.jpg"], ["Spl. Veg Matka Biryani", 280, "biryani.jpg"],
    ],
  },
  {
    category: "Tandoori Roti", cuisine: "North Indian", image: "paratha.jpg",
    description: "Freshly made in the tandoor.",
    items: [
      ["Tandoor Roti", 20], ["Tandoor Roti (Wheat)", 20], ["Butter Roti", 30], ["Butter Roti (Wheat)", 30],
      ["Naan", 40], ["Butter Naan", 60, undefined, true], ["Garlic Naan", 80], ["Plain Paratha", 50],
      ["Butter Paratha", 70], ["Aloo Paratha", 100], ["Paneer Paratha", 140], ["Plain Kulcha", 60],
      ["Butter Kulcha", 80], ["Stuff Kulcha", 120],
    ],
  },
  {
    category: "Papad", cuisine: "North Indian", image: "salad.jpg",
    description: "Crispy papad.",
    items: [["Roast Papad", 20], ["Fry Papad", 30], ["Masala Papad", 50]],
  },
  {
    category: "Thali", cuisine: "North Indian", image: "thali.jpg",
    description: "Paneer Tadkawala, Aloo Gobhi, Laccha Paratha - 2, Dal Tadka, Jeera Rice, Gulabjamun, Raita, Papad, Salad.",
    items: [["Suman Special Thali", 260, undefined, true]],
  },
  {
    category: "Sandwich", cuisine: "Fast Food", image: "sandwich.jpg",
    description: "Freshly made sandwich.",
    items: [
      ["Veg Sandwich", 60], ["Veg Cheese Sandwich", 80], ["Jain Veg Sandwich", 50],
      ["Jain Veg Cheese Sandwich", 70], ["Bread Butter Jam", 60],
    ],
  },
  {
    category: "Grilled Sandwich", cuisine: "Fast Food", image: "grilled_sandwich.jpg",
    description: "Grilled golden and crisp.",
    items: [
      ["Cheese Grill Sandwich", 100], ["Veg Cheese Grill Sandwich", 110], ["Cheese Corn Grill Sandwich", 120],
      ["Paneer Grill Cheese Sandwich", 150, "paneer_sandwich.jpg"], ["Spl. Napoleon Grilled Sandwich", 160],
      ["Chocolate Grill Sandwich", 100, "chocolate_sandwich.jpg"], ["Jam Grill Sandwich", 80],
    ],
  },
  {
    category: "Pizza", cuisine: "Fast Food", image: "veg_pizza.jpg",
    description: "Freshly baked cheese pizza.",
    items: [
      ["Veg Cheese Pizza", 160], ["Corn Cheese Pizza", 180], ["Paneer Cheese Pizza", 200, "paneer_pizza.jpg"],
      ["Special Pizza", 220, "pizza.jpg"],
    ],
  },
  {
    category: "Burger", cuisine: "Fast Food", image: "burger.jpg",
    description: "Crispy veg tikki burger.",
    items: [["Veg Tikki Burger", 80], ["Veg Cheese Tikki Burger", 110]],
  },
  {
    category: "French Fries", cuisine: "Fast Food", image: "fries.jpg",
    description: "Golden crispy french fries.",
    items: [["Salted French Fries", 100], ["Peri Peri French Fries", 120, "peri_peri_fries.jpg"]],
  },
  {
    category: "Dessert", cuisine: "Desserts", image: "dessert.jpg",
    description: "Something sweet to finish.",
    items: [
      ["Spl. Sizzling Brownie Ice-Cream", 160, undefined, true], ["Choco Lava Cake", 100, "cake_slice.jpg"],
      ["Ice-cream Scoop", 40],
    ],
  },
  {
    category: "Fresh Juice", cuisine: "Beverages", image: "fruit_juice.jpg",
    description: "Freshly squeezed juice.",
    items: [
      ["Mosambi Juice", 70], ["Orange Juice", 70], ["Pineapple Juice", 60], ["Pomegranate Juice", 80],
      ["Ganga Jamuna Juice", 100], ["Maramari Juice", 100],
    ],
  },
  {
    category: "Milkshake", cuisine: "Beverages", image: "milkshake.jpg",
    description: "Thick chilled milkshake.",
    items: [
      ["Rose Milkshake", 60], ["Kesar Milkshake", 70], ["Vanilla Milkshake", 60], ["Mango Milkshake", 70],
      ["Pineapple Milkshake", 70], ["Strawberry Milkshake", 70], ["Badam Milkshake", 80],
      ["Pista Milkshake", 80], ["Mixed Dry-fruit Milkshake", 100], ["Anjeer Milkshake", 100],
      ["Oreo Milkshake", 70, "chocolate_shake.jpg"], ["Chocolate Milkshake", 70, "chocolate_shake.jpg"],
      ["Extra Ice-Cream Scoop", 40, "dessert.jpg"], // also listed under Lassi on the card - added once
    ],
  },
  {
    category: "Mastani", cuisine: "Beverages", image: "mango_mastani.jpg",
    description: "Pune style mastani topped with ice-cream.",
    items: [
      ["Mango Mastani", 90, undefined, true], ["Bajirao Mastani", 100], ["Dry-Fruit Mastani", 120],
      ["Kesar Pista Mastani", 110], ["Special Mastani", 140],
    ],
  },
  {
    category: "Falooda", cuisine: "Beverages", image: "milkshake.jpg",
    description: "Chilled falooda with ice-cream.",
    items: [
      ["Rose Falooda", 100], ["Royal Falooda", 120], ["Kesar Falooda", 110], ["Mango Falooda", 100],
      ["Dilkhush Falooda", 130],
    ],
  },
  {
    category: "Fruit Salad", cuisine: "Desserts", image: "salad.jpg",
    description: "Fresh seasonal fruits.",
    items: [["Fruit Salad", 80], ["Fruit Salad with Ice-Cream", 120]],
  },
  {
    category: "Sundae", cuisine: "Desserts", image: "dessert.jpg",
    description: "Ice-cream sundae.",
    items: [["Single Sundae", 110], ["Double Sundae", 130], ["Triple Sundae", 150], ["Special Sundae", 170]],
  },
  {
    category: "Mocktail", cuisine: "Beverages", image: "mocktail.jpg",
    description: "Refreshing mocktail.",
    items: [
      ["Fruit Punch Mocktail", 120], ["Pink Lady Mocktail", 100], ["Pineapple Mocktail", 110],
      ["Cranberry Ginger Mocktail", 110],
    ],
  },
  {
    category: "Mojito", cuisine: "Beverages", image: "mojito.jpg",
    description: "Chilled mint mojito.",
    items: [["Virgin Mojito", 80], ["Pineapple Mojito", 100], ["Watermelon Mojito", 100]],
  },
  {
    category: "Lassi", cuisine: "Beverages", image: "milkshake.jpg",
    description: "Thick chilled lassi.",
    items: [
      ["Plain Lassi", 50], ["Mango Lassi With Ice-Cream", 80], ["Kesar Lassi With Ice-Cream", 80],
      ["Strawberry Lassi With Ice-Cream", 80],
    ],
  },
  {
    category: "Cold Coffee", cuisine: "Beverages", image: "thick_cold_coffee.jpg",
    description: "Thick chilled cold coffee.",
    items: [["Thick Cold Coffee", 60], ["Thick Cold Coffee with Crush", 90]],
  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const prov = await client.query(`SELECT business_name FROM service_providers WHERE id = $1`, [PROVIDER_ID]);
    if (!prov.rows.length) throw new Error("Suman pure veg not found");
    console.log(`Provider: ${prov.rows[0].business_name}`);

    const existing = await client.query(
      `SELECT id, LOWER(name) AS lname FROM restaurant_menu_items WHERE provider_id = $1`, [PROVIDER_ID]);
    const byName = new Map<string, string>(existing.rows.map((r: any) => [r.lname, r.id]));

    let inserted = 0, updated = 0;
    for (const s of sections) {
      for (const [name, base, img, popular] of s.items) {
        const price = Math.round(base * MARKUP).toFixed(2);
        const image = IMG(img ?? s.image);
        const existingId = byName.get(name.toLowerCase());
        if (existingId) {
          await client.query(
            `UPDATE restaurant_menu_items SET price=$1, category=$2, description=$3, cuisine=$4, is_available=true WHERE id=$5`,
            [price, s.category, s.description, s.cuisine, existingId]);
          console.log(`  ~ updated existing "${name}" -> ₹${price}`);
          updated++;
        } else {
          await client.query(
            `INSERT INTO restaurant_menu_items
             (id, provider_id, name, description, category, image_url, price, is_veg, is_available, cuisine, is_popular, popular_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,true,true,$8,$9,0)`,
            [createId(), PROVIDER_ID, name, s.description, s.category, image, price, s.cuisine, !!popular]);
          byName.set(name.toLowerCase(), "new");
          inserted++;
        }
      }
    }

    await client.query("COMMIT");
    const total = await client.query(`SELECT count(*)::int n FROM restaurant_menu_items WHERE provider_id=$1`, [PROVIDER_ID]);
    console.log(`\n✅ Inserted ${inserted}, updated ${updated}. Suman now has ${total.rows[0].n} menu items.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
