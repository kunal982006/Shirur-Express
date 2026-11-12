// server/add-elite-menu-card-2.ts
// Elite Juice & Snacks — 2nd menu card (fries, sandwiches, grills, ice-cream, novelties, cones,
// coffee, seasonal specials) with +15% pricing. Also fixes the "Elite Kuice" spelling.
// Safe to re-run: items that already exist (same name) get their price/category refreshed instead of duplicated.

import "dotenv/config";
import { pool } from "./db";
import { createId } from "@paralleldrive/cuid2";

const PROVIDER_ID = "oig6pewj42lgbrh65va882ht";
const NEW_NAME = "Elite Juice & Snacks";
const MARKUP = 1.15;
const IMG = (f: string) => `/images/menu-items/${f}`;

type Row = [string, number, string?];
interface Section { category: string; cuisine: string; image: string; description: string; items: Row[] }

const sections: Section[] = [
  {
    category: "Fries", cuisine: "Fast Food", image: "fries.jpg", description: "Golden crispy fries.",
    items: [["Salted Fries", 100], ["Peri Peri French Fries", 110, "peri_peri_fries.jpg"],
      ["Special Loaded Fries", 150, "cheese_fries.jpg"], ["Crunchy Finger", 130]],
  },
  {
    category: "Sandwiches", cuisine: "Fast Food", image: "sandwich.jpg", description: "Freshly made sandwich.",
    items: [["Cheese Sandwich", 80], ["Chutney Sandwich", 60], ["Veg Club Sandwich", 100], ["Bread Butter", 40]],
  },
  {
    category: "Grills", cuisine: "Fast Food", image: "grilled_sandwich.jpg", description: "Grilled golden and crisp.",
    items: [["Cheese Grill", 100], ["Veg Cheese Grill Sandwich", 120], ["Cheese Chilly Grill", 120],
      ["Veg Mayo Grill (Mayonnaise)", 120], ["Paneer Makhani Grill", 130, "paneer_sandwich.jpg"],
      ["Chocolate Grill Sandwich", 90, "chocolate_sandwich.jpg"],
      ["Chocolate Cheese Grill Sandwich", 120, "chocolate_sandwich.jpg"],
      ["Nutella Chocolate Grill", 150, "chocolate_sandwich.jpg"], ["Elite Special Loaded Grill Sandwich", 160]],
  },
  {
    category: "Ice-Cream (Scoop)", cuisine: "Desserts", image: "dessert.jpg", description: "Single scoop of ice-cream.",
    items: [["Vanilla Ice-Cream", 30], ["Strawberry Ice-Cream", 30], ["Pista Ice-Cream", 30],
      ["Kesar Pista Ice-Cream", 60], ["Butter Scotch Ice-Cream", 50], ["Anjeer Ice-Cream", 60],
      ["Black Current Ice-Cream", 50], ["Sitafal Ice-Cream (Seasonal)", 60], ["Rajbhog Ice-Cream", 60],
      ["American Nuts Ice-Cream", 50], ["Chocolate Ice-Cream", 50]],
  },
  {
    category: "Novelties", cuisine: "Desserts", image: "dessert.jpg", description: "Ice-cream novelty.",
    items: [["Cassatta", 60], ["Matka Kulfi", 60], ["Malai Kulfi", 40], ["Chocobar", 30],
      ["Raspberry Dolly", 20], ["Mango Dolly", 20], ["Zulu Bar", 50], ["Block Buster Candy", 70]],
  },
  {
    category: "Cone", cuisine: "Desserts", image: "dessert.jpg", description: "Ice-cream cone.",
    items: [["Butter Scotch Cone", 35], ["Chocolate Cone", 40], ["Raspberry Cone", 40],
      ["Dark Chocolate Cone", 50], ["Block Buster Cone", 100], ["World Cone", 100]],
  },
  {
    category: "Espresso", cuisine: "Beverages", image: "coffee.jpg", description: "Hot coffee & chocolate.",
    items: [["Espresso Coffee", 80], ["Hot Chocolate", 90]],
  },
  {
    category: "Seasonal Special", cuisine: "Desserts", image: "dessert.jpg", description: "Seasonal fresh fruit special.",
    items: [["Fresh Mango Sundae", 220, "mango_mastani.jpg"], ["Mango Blast", 200, "mango_mastani.jpg"],
      ["Fresh Strawberry Blast", 150, "milkshake.jpg"], ["Fresh Strawberry Sundae", 180]],
  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ren = await client.query(
      `UPDATE service_providers SET business_name = $1 WHERE id = $2 RETURNING business_name`, [NEW_NAME, PROVIDER_ID]);
    if (!ren.rowCount) throw new Error("Elite restaurant not found");
    console.log(`Provider name -> ${ren.rows[0].business_name}`);

    const existing = await client.query(
      `SELECT id, LOWER(name) AS lname FROM restaurant_menu_items WHERE provider_id = $1`, [PROVIDER_ID]);
    const byName = new Map<string, string>(existing.rows.map((r: any) => [r.lname, r.id]));

    let inserted = 0, updated = 0;
    for (const s of sections) {
      for (const [name, base, img] of s.items) {
        const price = Math.round(base * MARKUP).toFixed(2);
        const id = byName.get(name.toLowerCase());
        if (id) {
          await client.query(`UPDATE restaurant_menu_items SET price=$1, category=$2 WHERE id=$3`, [price, s.category, id]);
          console.log(`  ~ updated "${name}" -> ₹${price}`);
          updated++;
        } else {
          await client.query(
            `INSERT INTO restaurant_menu_items
             (id, provider_id, name, description, category, image_url, price, is_veg, is_available, cuisine, is_popular, popular_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,true,true,$8,false,0)`,
            [createId(), PROVIDER_ID, name, s.description, s.category, IMG(img ?? s.image), price, s.cuisine]);
          byName.set(name.toLowerCase(), "new");
          inserted++;
        }
      }
    }

    await client.query("COMMIT");
    const total = await client.query(`SELECT count(*)::int n FROM restaurant_menu_items WHERE provider_id=$1`, [PROVIDER_ID]);
    console.log(`\n✅ Inserted ${inserted}, updated ${updated}. Elite now has ${total.rows[0].n} menu items.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
