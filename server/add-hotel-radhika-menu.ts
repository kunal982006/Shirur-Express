// server/add-hotel-radhika-menu.ts
// Hotel Radhika — Veg / Non-Veg menu board (Marathi, translated to English) with +15% pricing.
// Every item gets a default food image picked from its name. Safe to re-run (existing names are updated).

import "dotenv/config";
import { pool } from "./db";
import { createId } from "@paralleldrive/cuid2";
import { defaultFoodImage } from "./default-food-image";

const PROVIDER_ID = "eznrtj66giyn23i05wkermf1"; // Hotel Radhika
const MARKUP = 1.15;

// [name, board price, isVeg, popular?]
type Row = [string, number, boolean, boolean?];
const sections: { category: string; cuisine: string; items: Row[] }[] = [
  {
    category: "Chicken", cuisine: "Non-Veg",
    items: [
      ["Chicken Dum Biryani", 150, false, true], ["Spl. Chicken Dum Biryani", 200, false],
      ["Chicken Masala", 150, false, true], ["Chicken Fry", 150, false],
      ["Chicken Handi (Full)", 480, false], ["Chicken Handi (Half)", 270, false],
      ["Chicken Ukhar", 120, false], ["Chicken Chilli", 200, false], ["Chicken Lollipop", 180, false, true],
      ["Spl. Chicken Thali", 300, false, true], ["Chicken Soup", 70, false],
    ],
  },
  {
    category: "Mutton", cuisine: "Non-Veg",
    items: [
      ["Mutton Dum Biryani", 250, false, true], ["Spl. Mutton Dum Biryani", 300, false],
      ["Mutton Masala", 250, false], ["Mutton Fry", 250, false],
      ["Mutton Handi (Full)", 750, false], ["Mutton Handi (Half)", 400, false],
      ["Mutton Ukhar", 250, false], ["Spl. Mutton Thali", 400, false, true],
    ],
  },
  {
    category: "Egg", cuisine: "Non-Veg",
    items: [
      ["Egg Biryani", 150, false], ["Egg Curry", 100, false], ["Egg Masala", 120, false],
      ["Boiled Egg", 40, false], ["Omelette", 50, false], ["Egg Bhurji", 80, false],
    ],
  },
  {
    category: "Veg", cuisine: "Veg",
    items: [
      ["Veg Biryani", 150, true], ["Paneer Biryani", 150, true], ["Mushroom Biryani", 150, true],
      ["Kaju Masala", 180, true], ["Kaju Paneer Masala", 170, true], ["Matar Paneer", 120, true],
      ["Paneer Masala", 150, true], ["Mushroom Masala", 150, true], ["Shev Bhaji", 100, true],
      ["Veg Soup", 60, true],
    ],
  },
  {
    category: "Rice & Roti", cuisine: "Indian",
    items: [
      ["Rassa Plate", 70, false], ["Jeera Rice", 70, true], ["Steam Rice", 60, true],
      ["Chapati", 10, true], ["Bajra Bhakri", 15, true],
    ],
  },
  {
    category: "1 Kg Biryani", cuisine: "Biryani",
    items: [
      ["Chicken Dum Biryani (1 Kg)", 1200, false], ["Mutton Dum Biryani (1 Kg)", 1700, false],
      ["Veg Dum Biryani (1 Kg)", 1100, true],
    ],
  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const prov = await client.query(`SELECT business_name FROM service_providers WHERE id=$1`, [PROVIDER_ID]);
    if (!prov.rows.length) throw new Error("Hotel Radhika not found");
    console.log(`Provider: ${prov.rows[0].business_name}`);

    const existing = await client.query(
      `SELECT id, LOWER(name) lname FROM restaurant_menu_items WHERE provider_id=$1`, [PROVIDER_ID]);
    const byName = new Map<string, string>(existing.rows.map((r: any) => [r.lname, r.id]));

    let inserted = 0, updated = 0;
    for (const s of sections) {
      for (const [name, base, isVeg, popular] of s.items) {
        const price = Math.round(base * MARKUP).toFixed(2);
        const id = byName.get(name.toLowerCase());
        if (id) {
          await client.query(`UPDATE restaurant_menu_items SET price=$1, category=$2 WHERE id=$3`, [price, s.category, id]);
          updated++;
        } else {
          await client.query(
            `INSERT INTO restaurant_menu_items
             (id, provider_id, name, description, category, image_url, price, is_veg, is_available, cuisine, is_popular, popular_order)
             VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,true,$8,$9,0)`,
            [createId(), PROVIDER_ID, name, s.category, defaultFoodImage(name, s.category), price, isVeg, s.cuisine, !!popular]);
          inserted++;
        }
        console.log(`  ${s.category.padEnd(13)} ${name.padEnd(30)} ₹${base} -> ₹${price}  ${defaultFoodImage(name, s.category).split("/").pop()}`);
      }
    }
    await client.query("COMMIT");
    console.log(`\n✅ Inserted ${inserted}, updated ${updated}.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
