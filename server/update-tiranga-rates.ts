// server/update-tiranga-rates.ts
// Hotel Tiranga — set prices from the current printed menu card (+15%).
// Only prices change: names, images and categories are untouched, and no items are added.
// Keys are the exact item names already in the DB (some dishes exist twice under spelling variants).

import "dotenv/config";
import { pool } from "./db";

const PROVIDER_ID = "haz4toiex4r3sn6kn1za5c5f";
const MARKUP = 1.15;

// DB item name -> price printed on the menu card
const CARD: Record<string, number> = {
  // Egg
  "Anda Masala": 150, "Anda Curry": 130,
  // Chicken starters
  "Lollipop Oil Fry (Full)": 160, "Lollipop Oil Fry (Half)": 90,
  "Lollipop Masala Dry (Full)": 200, "Lollipop Masala Dry (Half)": 150,
  "Chicken Chilli Dry (Full)": 200, "Chicken Chilli Dry (Half)": 150,
  "Chicken Chilly Dry (Full)": 200, "Chicken Chilly Dry (Half)": 150,
  "Chicken KFC": 170, "Chicken Tandoori (Full)": 400, "Chicken Tandoori (Half)": 250,
  "Chicken Crispy": 250, "Chicken Drumstick (Full)": 280, "Chicken Drumstick (Half)": 140,
  "Chicken Samosa": 100, "Chicken Roll (Plate)": 60, "Chicken Stick (Plate)": 60, "Chicken Steak (Plate)": 60,
  "Chicken Seek": 170, "Chicken Seekh": 170, "Chicken 65": 170, "Chicken Wings": 160,
  // Chicken rice & noodles
  "Chicken Fried Rice (Full)": 140, "Chicken Fried Rice (Half)": 80,
  "Chicken Schezwan Rice (Full)": 150, "Chicken Schezwan Rice (Half)": 90,
  "Chicken Triple Rice (Full)": 200, "Chicken Triple Rice (Half)": 150,
  "Chicken Noodles (Full)": 140, "Chicken Noodles (Half)": 80,
  "Chicken Schezwan Noodles (Full)": 150, "Chicken Schezwan Noodles (Half)": 90,
  "Chicken Triple Noodles (Full)": 200, "Chicken Triple Noodles (Half)": 150,
  // Veg
  "Paneer Masala": 150, "Shevbhaji": 130, "Paneer Butter Masala": 190, "Matar Paneer": 180,
  "Palak Paneer": 190, "Plain Palak": 130, "Kaju Masala": 200, "Paneer Kadhai": 210,
  "Paneer Angara": 180, "Paneer Korma": 190, "Paneer Kolhapuri": 210,
  "Paneer Chilli": 170, "Paneer Chilly": 170,
  "Dal Tadka": 150, "Dal Fry": 170, "Dal Makhani": 180, "Dal Khichdi": 180, "Dal Khichadi": 180,
  // Roti
  "Chapati": 15, "Butter Chapati": 20, "Tandoor Roti": 15, "Butter Roti": 25, "Rumali Roti": 35,
  "Plain Naan": 25, "Butter Naan": 35, "Laccha Paratha": 35, // card: "Tawa Paratha"
  // Mutton
  "Mutton Dalcha": 400, "Mutton Masala": 240, "Mutton Curry": 220, "Mutton Fry": 280, "Mutton Korma": 270,
  "Mutton Shahi-Korma": 310, "Mutton Angara": 330, "Mutton Kolhapuri": 320, "Mutton Do Pyaza": 320,
  "Mutton Kadhai": 370, "Mutton Pepper Masala": 280, "Mutton Makhani": 290, "Mutton Hyderabadi": 360,
  "Mutton Handi (Full)": 700, "Mutton Handi (Half)": 500, "Mutton Roast Pepper": 280, "Mutton Roast": 250,
  "Mutton Kheema Fry": 220, "Mutton Kheema Masala": 230, "Mutton Adraki": 270,
  "Mutton Lasuni": 300, "Mutton Lahsuni": 300, "Mutton Malbar Fry": 230, "Mutton Malwar Fry": 230,
  "Mutton Achar Gost": 300, "Mutton Achar Gosht": 300, "Mutton Dal Gost": 300, "Mutton Dal Gosht": 300,
  "Vajadi Masala": 170, "Vajadi Fry": 160,
  // Special chicken
  "Chicken Tiranga": 380, // card: "Chicken Tiranga Special"
  "Chicken Maharaja (Full)": 750, "Chicken Maharaja (Half)": 500,
  "Chicken Murg Mussallam (Full)": 900, "Chicken Murg Mussallam (Half)": 600,
  "Chicken Khajana": 400, "Butter Chicken": 330, "Chicken Angara": 270,
  "Chicken Hyderabadi": 300, "Chicken Kadhai": 280,
  // Chicken bhaji
  "Chicken Masala": 170, "Chicken Curry": 160, "Chicken Fry": 180, "Chicken Korma": 210,
  "Chicken Shahi-Korma": 240, "Chicken Kolhapuri": 200, "Chicken Do Pyaza": 250,
  "Chicken Handi (Full)": 550, "Chicken Handi (Half)": 350, "Chicken Roast": 190, "Chicken Makhani": 210,
  "Chicken Kheema Fry": 200, "Chicken Pepper Masala": 200, "Chicken Kaleji Petha Fry": 150,
  "Gavran Chicken Kala Masala": 200, "Gavran Chicken Fry": 210,
  "Chicken Moglai": 270, "Chicken Moghlai": 270, "Chicken Sukka": 170, "Chicken Sukha": 170,
  "Chicken Garlic Kheema": 350, "Chicken Bhuna": 230,
  "Chicken Dal Gost": 220, "Chicken Dal Gosht": 220, "Chicken Dalcha": 300,
  "Chicken Malvan Fry": 180, "Chicken Malwar Fry": 180, "Kerala Chicken Curry": 270,
  // Biryani / rice
  "Chicken Dum Biryani": 160, "Mutton Dum Biryani": 350, // card: "Spl. Mutton Dum Biryani"
  "Chicken Zamzam Pulao": 220, "Chicken Zamzam Pulav": 220,
  "Chicken Kashmiri Pulao": 200, "Chicken Kashmiri Pulav": 200, // card: "Chicken White Kashmiri Pulao"
  "Jeera Rice (Full)": 80, "Jeera Rice (Half)": 50,
  // Thali
  "Chicken Thali": 250, "Mutton Thali": 350, "Tiranga Special Mutton Thali": 500,
  // Cold drinks
  "Thumbs Up / Sprite / Sting": 20, "Thums Up": 20, "Sprite": 20, "Sting": 20,
  "Water Bottle": 20, "Jeera Soda": 20, "Maaza": 20,
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, name, price FROM restaurant_menu_items WHERE provider_id=$1 ORDER BY name`, [PROVIDER_ID]);

    const seen = new Set<string>();
    let changed = 0;
    const notOnCard: string[] = [];
    for (const it of rows as any[]) {
      const card = CARD[it.name];
      if (card === undefined) { notOnCard.push(`${it.name} (₹${Number(it.price)})`); continue; }
      seen.add(it.name);
      const price = Math.round(card * MARKUP).toFixed(2);
      if (Number(it.price) !== Number(price)) {
        await client.query(`UPDATE restaurant_menu_items SET price=$1 WHERE id=$2`, [price, it.id]);
        console.log(`  ${it.name.padEnd(34)} ₹${Number(it.price)} -> ₹${Number(price)}  (card ₹${card})`);
        changed++;
      }
    }
    const missing = Object.keys(CARD).filter(n => !seen.has(n));
    if (missing.length) throw new Error(`Mapped names not found in DB: ${missing.join(", ")}`);

    await client.query("COMMIT");
    console.log(`\n✅ Updated ${changed} of ${rows.length} items.`);
    console.log(`\nNot on the card (left unchanged):\n  ${notOnCard.join("\n  ")}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
