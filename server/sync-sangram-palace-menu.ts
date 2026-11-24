/**
 * Sync Hotel Sangram Palace menu with the printed menu card (Nov 2026).
 *
 *  - Card prices are marked up by MARKUP (12%) and rounded DOWN to the rupee,
 *    so no item ever goes above +12%.
 *  - Items already in the app are matched by name (typo-tolerant) and updated
 *    in place, so their IDs and images are kept.
 *  - Card items missing from the app are added.
 *  - App items not on the card are deleted.
 *
 * Dry run (prints the plan, changes nothing):
 *   npx tsx server/sync-sangram-palace-menu.ts
 * Apply to the database:
 *   npx tsx server/sync-sangram-palace-menu.ts --apply
 */
import "dotenv/config";
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike, inArray } from "drizzle-orm";

const MARKUP = 0.12;
const APPLY = process.argv.includes("--apply");

type CardItem = {
  name: string;
  category: string;
  /** Price printed on the card; null = card shows no price (keep app price). */
  cardPrice: number | null;
  /** Price to use only if a no-price item is new to the app. */
  fallbackPrice?: number;
  aliases?: string[];
};

const c = (category: string, rows: [string, number | null, string[]?][]): CardItem[] =>
  rows.map(([name, cardPrice, aliases]) => ({ name, category, cardPrice, aliases }));

// Prices exactly as printed on the menu card (before markup).
// "Soda" and "Soft Drink" are sold "on MRP", so they are not listed in the app.
const CARD: CardItem[] = [
  ...c("Drinks", [
    ["Tea", 25],
    ["Coffee", 35],
    ["Cold Coffee", 65],
    ["Milk Glass", 60],
    ["Bournvita Glass", 65],
  ]),
  ...c("Soda", [
    ["Fresh Lime Water", 35],
    ["Fresh Lime Soda", 40],
    ["Butter Milk", 50],
    ["Butter Milk M/s.", 60, ["Butter Milk Masala"]],
    ["Lassi", 65],
  ]),
  ...c("Breakfast", [
    ["Poha", 65],
    ["Upma", 65],
    ["Sheera", 70],
    ["Plain Dosa", 80],
    ["Masala Dosa", 90],
    ["Paper Plain Dosa", 95],
    ["Paper Masala Dosa", 100],
    ["Cheese Dosa", 125],
    ["Cut Dosa", 110],
    ["Plain Uttappa", 90],
    ["Onion Uttappa", 95],
    ["Tomato Uttappa", 95],
    ["Idli Samber", 75, ["Idli Sambar"]],
    ["Medu Wada", 115, ["Medu Vada"]],
    ["Puri Bhaji", 130],
    ["Finger Chips", 75],
    ["Aloo Paratha", 100],
    ["Paneer Paratha", 120],
    ["Pakoda Mix/Onion/Aloo", 100, ["Pakoda"]],
    ["Bread Butter", 55],
    ["Toast Butter", 70],
    ["Veg Sandwich", 80],
    ["Toast Sandwich", 85, ["Tosat Sandwich"]],
    ["Veg Cheese Grilled Sandwich", 120],
  ]),
  ...c("Soup", [
    ["Veg Sweet Corn Soup", 90],
    ["Veg Manchow Soup", 95, ["Veg Manchaow Soup", "Veg Manchaow", "Veg Manchow"]],
    ["Cream of Tomato", 95, ["Cream of Tomato Soup", "Tomato Soup"]],
    ["Lemon Coriander Soup", 110],
    ["Veg Shorba", 110],
    ["Cream of Veg Soup", 115],
    ["Cream of Mushroom", 140, ["Cream of Mushroom Soup"]],
  ]),
  ...c("Starter", [
    ["Rosted Papad", 25, ["Roasted Papad"]],
    ["Fry Papad", 35],
    ["Masala Papad", 40, ["Rosted MS Papad", "Roasted Masala Papad"]],
    ["Nachani Fry Papad", 45, ["Nachani Rosted Papad"]],
    ["Nachani Masala Papad", 55],
    ["Veg Harabhara Kebab", 210, ["Veg Hara Bhara Kebab", "Veg Harabhara Kabab"]],
    ["Dragon Roll", 210],
    ["Cheese Potato Roll", 210],
    ["Kaju Methi Roll", 220],
    ["Cheese Corn Roll", 220],
    ["Paneer in Lemon Sauce", 220, ["Paneer in Lamon Sauce"]],
    ["Cheese Tokari Dry", 235],
    ["Paneer Unik Sauce", 230],
    ["Cheese Cigar Roll", 240],
    ["Veg Febica Roll", 240],
    ["Paneer in Honey Sauce", 240, ["Paneer in Hony Sauce"]],
  ]),
  ...c("Tandoor Starter", [
    ["Mushroom Tikka Dry", 200],
    ["Paneer Tikka Dry", 200],
    ["Veg Sikh Kebab", 210, ["Veg Sikh Kabab", "Veg Seekh Kebab"]],
    ["Paneer Pahadi Kebab", 240, ["Paneer Pahadi Kabab"]],
    ["Paneer Banjara Kebab", 240, ["Paneer Banjara Kabab"]],
    ["Paneer Hara Mutter Tikka Dry", 240],
    ["Mushroom Paneer Tikka Dry", 250],
    ["Paneer Akhabari Tikka Dry", 260],
    ["Paneer Multani Kebab Dry", 260],
    ["Chandani Tikka Dry", 260],
    ["Paneer Tiranga Tikka Dry", 300],
  ]),
  ...c("Starter (Chinese)", [
    ["Veg Fried Rice", 155, ["Veg Fride Rice"]],
    ["Veg Hakka Noodles", 155, ["Veg Hakka Noodls"]],
    ["Veg Manchurian Dry", 165],
    ["Veg 65", 175],
    ["Veg Schezwan Noodles", 170],
    ["Baby Corn Chilly", 180],
    ["Mushroom Chilly", 180],
    ["Veg Crispy", 180],
    ["Veg Schezwan Fried Rice", 175, ["Veg SCH Fride Rice", "Veg SCH Fried Rice"]],
    ["Paneer Chilly", 185],
    ["Paneer Hot Pan", 200],
    ["Paneer Saute", 200],
    ["Paneer Crispy", 220],
    ["Veg Crunchi", 250],
    ["Veg Triple Schezwan Noodles", 220, ["Veg Tripale Schezwan Noodles"]],
    ["Veg Triple Schezwan Rice", 220, ["Veg Tripale Schezwan Rice"]],
    ["Veg Sizzler", 360],
  ]),
  ...c("Salad & Raita", [
    ["Dahi Wati Plain", 30],
    ["Dahi Bowl Plain", 60],
    ["Mix Veg Raita", 75, ["Mix Raita"]],
    ["Boondi Raita", 85],
    ["Green Salad", 80],
  ]),
  ...c("Maharashtrian Menu", [
    ["Thecha", 60],
    ["Aamti", 115],
    ["Pithala", 145],
    ["Tomato Chutney", 145, ["Tomato Chuteny"]],
    ["Shev Bhaji", 145],
    ["Methi Fry", 145],
    ["Lasuni Methi", 160],
    ["Methi Masala", 150],
    ["Bhendi Fry", 155],
    ["Bhendi Masala", 145],
    ["Bharaleli Vangi", 140],
    ["Baigan Masala", 145],
    ["Baigan Bharata", 180],
    ["Matki Dry", 145],
    ["Matki Usal", 140],
    ["Batata Bhaji (Yellow Dry)", 145, ["Batata Bhaji"]],
    ["Plain Palak", 140],
    ["Lasuni Palak", 150],
  ]),
  ...c("Specials Veg", [
    ["Aloo Jeera", 140],
    ["Green Peas Masala", 140],
    ["Mix Veg", 145],
    ["Veg Kolhapuri", 150, ["Veg Kholapuri"]],
    ["Veg Bhuna (Medium Sweet)", 180, ["Veg Bhuna"]],
    ["Mix Veg Tawa (Dry)", 180, ["Mix Veg Tawa"]],
    ["Veg Makhanwala (Medium Sweet)", 175, ["Veg Makhanwala"]],
    ["Kaju Masala", 220],
    ["Veg Kadai (Medium Sweet)", 190, ["Veg Kadai"]],
    ["Veg Maratha", 190],
    ["Veg Kofta", 210],
    ["Mushroom Masala", 200],
    ["Mushroom Kadai (Medium Sweet)", 200, ["Mushroom Kadai"]],
    ["Kaju Curry (White Gravy Medium Sweet)", 235, ["Kaju Curry"]],
    ["Veg Angara", 210],
    ["Veg Patiyala", 230],
    ["Veg Chingari", 230],
    ["Dum Aloo Punjabi", 220],
    ["Veg Tarkari", 220],
    ["Veg Majedar", 220],
    ["Veg Malavani", 220],
    ["Veg Hydrabadi", 220],
    ["Creamy Corn Masala", 230],
    ["Veg Zarena", 220],
    ["Veg Chandgad", 250],
    ["Cheese Tokari Masala", 260],
    ["Veg Nawabi", 275],
    ["Shev Bhaji Handi Half", 220],
    ["Shev Bhaji Handi Full", 410],
    ["Veg Handi Half", 280],
    ["Veg Handi Full", 530],
    ["Veg Maratha Handi Half", 300],
    ["Veg Maratha Handi Full", 560],
  ]),
  ...c("Paneer", [
    ["Paneer Masala", 200, ["Paneer MS"]],
    ["Paneer Butter Masala", 210],
    ["Paneer Tikka Masala", 210, ["Paneer Tikka MS"]],
    ["Paneer Bhatinda", 230],
    ["Paneer Rajwadi", 230],
    ["Paneer Peshawari", 225],
    ["Paneer Lajawab", 225],
    ["Paneer Maharaja", 230],
    ["Paneer Chatpata", 225],
    ["Paneer Malvani", 240],
    ["Paneer Lasuni", 240],
    ["Paneer Kadmbari", 250],
    ["Paneer Angara", 250],
    ["Paneer Lababdar", 245],
    ["Paneer Ra Ra", 245],
    ["Paneer Kalyani", 260],
    ["Paneer Pasanda", 260],
    ["Paneer Hill Top", 290],
    ["Paneer Handi Half", 320],
    ["Paneer Handi Full", 580],
  ]),
  ...c("Dal", [
    ["Plain Dal", 100],
    ["Dal Fry", 120],
    ["Dal Tadaka", 130, ["Dal Tadka"]],
    ["Dal Kolhapuri", 140],
    ["Dal Wati", 50],
  ]),
  ...c("Rice", [
    ["Steam Rice Full", 95, ["Steem Rice Full"]],
    ["Steam Rice Half", 55, ["Steem Rice Half"]],
    ["Jeera Rice Full", 110],
    ["Jeera Rice Half", 65],
    ["Curd Rice", 140],
    ["Veg Pulao", 150, ["Veg Pulav"]],
    ["Veg Biryani", 180],
    ["Ghee Rice", 160],
    ["Dal Khichadi", 150, ["Dal Khichdi"]],
    ["Veg Dum Biryani", 220],
  ]),
  ...c("Roti", [
    ["Roti", 15],
    ["Butter Roti", 20],
    ["Wheat Roti", 20],
    ["Butter Wheat Roti", 25],
    ["Missi Roti", 45],
    ["Naan", 40],
    ["Butter Naan", 45],
    ["Garlic Naan", 70],
    ["Butter Garlic Naan", 75],
    ["Paratha", 40],
    ["Butter Paratha", 50],
    ["Kulcha", 45],
    ["Butter Kulcha", 55],
    ["Masala Kulcha", 60, ["MS Kulcha"]],
    ["Chapati", 20],
    ["Butter Chapati", 25],
    ["Jewari Bhakari", 30, ["Jowari Bhakari"]],
    ["Bajari Bhakari", 25],
    ["Butter Bhakari", 35],
    ["Cheese Garlic Naan", 110],
    ["Butter Cheese Garlic Naan", 110],
  ]),
  // Juice and ice-cream have no printed price: keep whatever the app has.
  { name: "Seasonal Fresh Fruits Juice", category: "Juice", cardPrice: null, fallbackPrice: 80,
    aliases: ["Seasonal Fresh Fruit Juice"] },
  { name: "Butter Scotch Ice Cream", category: "Ice-Cream", cardPrice: null, fallbackPrice: 60,
    aliases: ["Butter Scoth", "Butterscotch Ice Cream"] },
  { name: "Vanilla Ice Cream", category: "Ice-Cream", cardPrice: null, fallbackPrice: 60, aliases: ["Vanila"] },
  { name: "Mango Ice Cream", category: "Ice-Cream", cardPrice: null, fallbackPrice: 60 },
  { name: "Strawberry Ice Cream", category: "Ice-Cream", cardPrice: null, fallbackPrice: 60, aliases: ["Stwoberry"] },
  { name: "Kulfi", category: "Ice-Cream", cardPrice: null, fallbackPrice: 60 },
];

/** Typo-tolerant key: lower case, common misspellings fixed, punctuation dropped. */
function key(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\bpanner\b/g, "paneer")
    .replace(/\bkabab\b/g, "kebab")
    .replace(/\bfride\b/g, "fried")
    .replace(/\bnoodls\b/g, "noodles")
    .replace(/\bsch\b|\bshezwan\b|\bschezwan\b/g, "schezwan")
    .replace(/\btripale\b/g, "triple")
    .replace(/\bsteem\b/g, "steam")
    .replace(/\bms\b/g, "masala")
    .replace(/\bice\s*cream\b/g, "")
    .replace(/\bsoup\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const markup = (p: number) => Math.floor(p * (1 + MARKUP));

async function main() {
  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%Sangram%"),
  });
  if (!provider) throw new Error("Hotel Sangram Palace provider not found");
  console.log(`Provider: ${provider.businessName} (${provider.id})`);
  console.log(APPLY ? "MODE: APPLY (writing to database)\n" : "MODE: DRY RUN (add --apply to write)\n");

  const existing = await db
    .select()
    .from(restaurantMenuItems)
    .where(eq(restaurantMenuItems.providerId, provider.id));

  const byKey = new Map<string, (typeof existing)[number]>();
  for (const row of existing) if (!byKey.has(key(row.name))) byKey.set(key(row.name), row);

  const matchedIds = new Set<string>();
  const updates: { id: string; from: typeof existing[number]; set: Record<string, unknown> }[] = [];
  const inserts: (typeof restaurantMenuItems.$inferInsert)[] = [];

  for (const item of CARD) {
    const keys = [item.name, ...(item.aliases ?? [])].map(key);
    const row = keys.map((k) => byKey.get(k)).find((r) => r && !matchedIds.has(r.id));

    const price =
      item.cardPrice != null
        ? markup(item.cardPrice)
        : row
          ? Number(row.price)
          : item.fallbackPrice!;

    const values = {
      name: item.name,
      category: item.category,
      price: String(price),
      description: item.category,
      isVeg: true,
      isAvailable: true,
    };

    if (row) {
      matchedIds.add(row.id);
      updates.push({ id: row.id, from: row, set: values });
    } else {
      inserts.push({ providerId: provider.id, ...values });
    }
  }

  const deletes = existing.filter((r) => !matchedIds.has(r.id));

  console.log(`UPDATE ${updates.length} items:`);
  for (const u of updates) {
    const oldP = Number(u.from.price);
    const newP = Number(u.set.price);
    const rename = u.from.name !== u.set.name ? `  (was "${u.from.name}")` : "";
    console.log(`  ${String(u.set.name).padEnd(40)} ₹${oldP} → ₹${newP}${rename}`);
  }
  console.log(`\nADD ${inserts.length} new items:`);
  for (const i of inserts) console.log(`  ${i.name.padEnd(40)} ₹${i.price}  [${i.category}]`);
  console.log(`\nREMOVE ${deletes.length} items not on the card:`);
  for (const d of deletes) console.log(`  ${d.name.padEnd(40)} ₹${Number(d.price)}`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to save these changes.");
    return;
  }

  await db.transaction(async (tx) => {
    for (const u of updates) {
      await tx.update(restaurantMenuItems).set(u.set).where(eq(restaurantMenuItems.id, u.id));
    }
    if (inserts.length) await tx.insert(restaurantMenuItems).values(inserts);
    if (deletes.length) {
      await tx.delete(restaurantMenuItems).where(inArray(restaurantMenuItems.id, deletes.map((d) => d.id)));
    }
  });
  console.log(`\nDone: ${updates.length} updated, ${inserts.length} added, ${deletes.length} removed.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
