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
      // Match the current item by its card name first (a menu already updated), else by its old name.
      const existing = byName.get(item.name.toLowerCase()) ?? (item.from ? byName.get(item.from.toLowerCase()) : undefined);
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
// Café of Joy: undo the Nov 2026 menu-card changes (card prices +15%, Black Coffee added, items not
// on the card hidden). The owner asked for the menu to stay as it was. Each part is undone only if
// that change was applied on this database; a price the vendor has changed since is left alone.
// ---------------------------------------------------------------------------
const CAFE_OF_JOY_PRICE_CHANGES: { name: string; was: number; changedTo: number }[] = [
  { name: "Hot Coffee", was: 20, changedTo: 23 },
  { name: "Haldi Milk", was: 20, changedTo: 29 },
  { name: "Normal Cold Coffee", was: 50, changedTo: 58 },
  { name: "Thick Cold Coffee", was: 60, changedTo: 69 },
  { name: "Cold Coffee with Crush", was: 70, changedTo: 81 },
  { name: "Cold Coffee with Ice Cream", was: 80, changedTo: 92 },
];
const CAFE_OF_JOY_KEPT = /^(hot coffee|black coffee|haldi milk|normal cold coffee|thick cold coffee|cold coffee with crush|cold coffee with ice cream|salted fries|french fries|iced? tea|lemon tea|orange juice|coffee|espresso|americano|cappuccino|latte|mocha|caramel latte|milk ?shake|.+ shake)$/;

const wasApplied = async (name: string) =>
  Boolean((await pool.query(`SELECT 1 FROM app_data_migrations WHERE name = $1`, [name])).rowCount);

async function undoCafeOfJoyCardChanges() {
  const [cafe] = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, "%of joy%"));
  if (!cafe) return;
  const pricesChanged = await wasApplied("2026-11-cafe-of-joy-menu-card-plus-15pct");
  const itemsHidden = await wasApplied("2026-11-cafe-of-joy-hide-off-card-items");
  if (!pricesChanged && !itemsHidden) {
    console.log("[data-migration] Café of Joy card changes were never applied here, nothing to undo");
    return;
  }
  await db.transaction(async (tx) => {
    const items = await tx.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, cafe.id));
    let restored = 0;
    let shown = 0;
    if (pricesChanged) {
      for (const change of CAFE_OF_JOY_PRICE_CHANGES) {
        const item = items.find((i) => i.name.trim().toLowerCase() === change.name.toLowerCase());
        if (item && Number(item.price) === change.changedTo) {
          await tx.update(restaurantMenuItems).set({ price: String(change.was) }).where(eq(restaurantMenuItems.id, item.id));
          restored++;
        }
      }
      // Black Coffee was added by that change; past orders keep their own copy of the item.
      for (const item of items.filter((i) => i.name.trim().toLowerCase() === "black coffee")) {
        await tx.delete(restaurantMenuItems).where(eq(restaurantMenuItems.id, item.id));
      }
    }
    if (itemsHidden) {
      for (const item of items) {
        if (item.isAvailable === false && !CAFE_OF_JOY_KEPT.test(item.name.trim().toLowerCase())) {
          await tx.update(restaurantMenuItems).set({ isAvailable: true }).where(eq(restaurantMenuItems.id, item.id));
          shown++;
        }
      }
    }
    console.log(`[data-migration] Café of Joy card changes undone: ${restored} prices restored, ${shown} items shown again`);
  });
}

const MIGRATIONS: Migration[] = [
  { name: "2026-11-rudra-new-menu-card-plus-15pct", run: updateRudraMenu },
  // Applied again (Nov 21): the live menu didn't match the card. Makes it exactly the card +15%.
  { name: "2026-11-21-rudra-menu-card-reapply", run: updateRudraMenu },
  { name: "2026-11-cafe-of-joy-undo-card-changes", run: undoCafeOfJoyCardChanges },
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
