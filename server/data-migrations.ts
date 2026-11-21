// One-time data changes that run when the server starts.
// Each migration runs once: its name is recorded in app_data_migrations after it succeeds,
// so later restarts skip it and any edits the vendor makes afterwards are left alone.

import { db, pool } from "./db";
import { restaurantMenuItems, serviceProviders, streetFoodItems } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";

type Migration = { name: string; run: () => Promise<void> };

// ---------------------------------------------------------------------------
// Rudra Pure Veg Chinese Center: new menu card (Nov 2026), prices +15%.
// Pav bhaji & pulav are no longer sold. Card prices are listed next to each
// item; the price used is card price x 1.15, rounded half up.
// ---------------------------------------------------------------------------
const RUDRA_ID = "ja4ec18df2ig0zypl6t1bedy";
const IMG = (id: string) => `https://res.cloudinary.com/mlijtrrb/image/upload/${id}`;

type RudraItem = {
  name: string;
  category: string;
  price: number;
  description?: string;
  from?: string; // current item name to update (keeps its photo and id)
  image?: string; // photo for a new item
};

const RUDRA_MENU: RudraItem[] = [
  // Starters
  { category: "Starters", name: "Masala Manchurian", price: 81, from: "Manchurian Gravy" }, // 70
  { category: "Starters", name: "Soyabean Chilli", price: 115, from: "Soyabean Chilli" }, // 100
  { category: "Starters", name: "Paneer Chilli", price: 173, from: "Paneer chilli" }, // 150
  // Soups
  { category: "Soups", name: "Manchow Soup", price: 58, from: "Manchow soup" }, // 50
  { category: "Soups", name: "Tomato Soup", price: 58, from: "Tomato soup" }, // 50
  { category: "Soups", name: "Manchurian Soup", price: 81, from: "Manchurian soup" }, // 70
  // Rice
  { category: "Rice", name: "Fried Rice (Half)", price: 81, description: "Half", from: "Fried rice (Half)" }, // 70
  { category: "Rice", name: "Fried Rice (Full)", price: 138, description: "Full", from: "Fried rice (Full)" }, // 120
  { category: "Rice", name: "Shejwan Rice (Half)", price: 104, description: "Half", from: "Shejwan rice (Half)" }, // 90
  { category: "Rice", name: "Shejwan Rice (Full)", price: 150, description: "Full", from: "Shejwan rice (Full)" }, // 130
  { category: "Rice", name: "Manchurian Fried Rice (Half)", price: 115, description: "Half", from: "Manchurian fried rice (Half)" }, // 100
  { category: "Rice", name: "Manchurian Fried Rice (Full)", price: 161, description: "Full", from: "Manchurian fried rice (Full)" }, // 140
  { category: "Rice", name: "Paneer Fried Rice (Half)", price: 115, description: "Half", image: IMG("v1789578582/tywzzz5rh") }, // 100
  { category: "Rice", name: "Paneer Fried Rice (Full)", price: 173, description: "Full", image: IMG("v1789578565/sw6dxgvou") }, // 150
  // Noodles
  { category: "Noodles", name: "Hakka Noodles (Half)", price: 81, description: "Half", from: "Hakka noodles (Half)" }, // 70
  { category: "Noodles", name: "Hakka Noodles (Full)", price: 138, description: "Full", from: "Hakka noodles (Full)" }, // 120
  { category: "Noodles", name: "Shejwan Noodles (Half)", price: 104, description: "Half", from: "Shejwan noodles (Half)" }, // 90
  { category: "Noodles", name: "Shejwan Noodles (Full)", price: 150, description: "Full", from: "Shejwan noodles (Full)" }, // 130
  { category: "Noodles", name: "Manchurian Shejwan Noodles (Half)", price: 115, description: "Half", from: "Manchurian Shejwan noodles (Half)" }, // 100
  { category: "Noodles", name: "Manchurian Shejwan Noodles (Full)", price: 161, description: "Full", from: "Manchurian Shejwan noodles (Full)" }, // 140
  { category: "Noodles", name: "Paneer Shejwan Noodles (Half)", price: 115, description: "Half", from: "Paneer Shejwan noodles (Half)" }, // 100
  { category: "Noodles", name: "Paneer Shejwan Noodles (Full)", price: 173, description: "Full", from: "Paneer Shejwan noodles (Full)" }, // 150
  // Specials
  { category: "Specials", name: "Special Chinese Bhel", price: 115, image: "/images/menu-items/chinese_bhel.jpg" }, // 100
  { category: "Specials", name: "Special Triple Rice (Half)", price: 115, description: "Half", image: IMG("v1789578634/irheo1nmo") }, // 100
  { category: "Specials", name: "Special Triple Rice (Full)", price: 173, description: "Full", image: IMG("v1789578553/dphphesu9") }, // 150
  { category: "Specials", name: "Special Triple Noodles (Half)", price: 115, description: "Half", image: IMG("v1789578581/t3aqfr9sy") }, // 100
  { category: "Specials", name: "Special Triple Noodles (Full)", price: 173, description: "Full", image: IMG("v1789578580/xdlfxycpf") }, // 150
  // Potato spring rolls
  { category: "Potato Spring Rolls", name: "Peri Peri Mayo", price: 81, from: "Peri Peri Mayo" }, // 70
  { category: "Potato Spring Rolls", name: "Peri Peri Cheese", price: 115, from: "Peri Peri Cheese" }, // 100
  { category: "Potato Spring Rolls", name: "Tandoori Sauce", price: 115, from: "Tandoori Sauce" }, // 100
  { category: "Potato Spring Rolls", name: "Special Potato Spring Roll", price: 173, from: "Special potato spring roll" }, // 150
];

async function updateRudraMenu() {
  await db.transaction(async (tx) => {
    const current = await tx.select().from(streetFoodItems).where(eq(streetFoodItems.providerId, RUDRA_ID));
    if (current.length === 0) {
      console.log("[data-migration] Rudra stall has no items here, skipping menu update");
      return;
    }
    const byName = new Map(current.map((i) => [i.name.trim().toLowerCase(), i]));
    const kept = new Set<string>();

    for (const item of RUDRA_MENU) {
      const existing = item.from ? byName.get(item.from.toLowerCase()) : undefined;
      const values = {
        name: item.name,
        category: item.category,
        price: String(item.price),
        description: item.description ?? null,
        isVeg: true,
        isAvailable: true,
      };
      if (existing && !kept.has(existing.id)) {
        kept.add(existing.id);
        await tx.update(streetFoodItems).set(values).where(eq(streetFoodItems.id, existing.id));
      } else {
        await tx.insert(streetFoodItems).values({
          ...values,
          providerId: RUDRA_ID,
          imageUrl: item.image ?? (existing?.imageUrl || null),
        });
      }
    }

    // Everything not on the new card (pav bhaji, tava pulav, butter pav) is removed.
    // Past orders keep their own copy of item names and prices, so they are unaffected.
    for (const old of current) {
      if (!kept.has(old.id)) {
        await tx.delete(streetFoodItems).where(eq(streetFoodItems.id, old.id));
      }
    }
    console.log(`[data-migration] Rudra menu: ${RUDRA_MENU.length} items, ${kept.size} updated, ${current.length - kept.size} removed`);
  });
}

// ---------------------------------------------------------------------------
// Café of Joy: new menu card (Nov 2026), prices +15%, rounded half up.
// Only the items with ₹ prices on the card ("/-") are changed; nothing is removed.
// The card's coffee list with $2.50 everywhere and the "$" lines are template text, not prices.
// ---------------------------------------------------------------------------
const CAFE_OF_JOY_CARD: { name: string; category: string; card: number }[] = [
  { category: "Hots", name: "Hot Coffee", card: 20 },
  { category: "Hots", name: "Black Coffee", card: 20 },
  { category: "Hots", name: "Haldi Milk", card: 25 },
  { category: "Cold Beverges", name: "Normal Cold Coffee", card: 50 },
  { category: "Cold Beverges", name: "Thick Cold Coffee", card: 60 },
  { category: "Cold Beverges", name: "Cold Coffee with Crush", card: 70 },
  { category: "Cold Beverges", name: "Cold Coffee with Ice Cream", card: 80 },
];

async function updateCafeOfJoyMenu() {
  await db.transaction(async (tx) => {
    const [cafe] = await tx.select().from(serviceProviders).where(ilike(serviceProviders.businessName, "%of joy%"));
    if (!cafe) {
      console.log("[data-migration] Café of Joy not found here, skipping menu update");
      return;
    }
    const current = await tx.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, cafe.id));
    const byName = new Map(current.map((i) => [i.name.trim().toLowerCase(), i]));
    let updated = 0;
    let added = 0;
    for (const item of CAFE_OF_JOY_CARD) {
      const price = String(Math.floor((item.card * 115 + 50) / 100)); // +15%, half up, integer maths
      const existing = byName.get(item.name.toLowerCase());
      if (existing) {
        await tx.update(restaurantMenuItems).set({ price }).where(eq(restaurantMenuItems.id, existing.id));
        updated++;
      } else {
        await tx.insert(restaurantMenuItems).values({
          providerId: cafe.id,
          name: item.name,
          category: item.category,
          price,
          isVeg: true,
          isAvailable: true,
        });
        added++;
      }
    }
    console.log(`[data-migration] Café of Joy card: ${updated} updated, ${added} added`);
  });
}

const MIGRATIONS: Migration[] = [
  { name: "2026-11-rudra-new-menu-card-plus-15pct", run: updateRudraMenu },
  { name: "2026-11-cafe-of-joy-menu-card-plus-15pct", run: updateCafeOfJoyMenu },
];

export async function runDataMigrations() {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS app_data_migrations (name text PRIMARY KEY, applied_at timestamp DEFAULT now())`,
    );
    for (const m of MIGRATIONS) {
      const done = await pool.query(`SELECT 1 FROM app_data_migrations WHERE name = $1`, [m.name]);
      if (done.rowCount) continue;
      console.log(`[data-migration] running ${m.name}`);
      await m.run();
      await pool.query(`INSERT INTO app_data_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [m.name]);
    }
  } catch (err) {
    // Never block the server from starting because of a data change.
    console.error("[data-migration] failed:", err);
  }
}
