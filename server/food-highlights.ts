import { createHash } from "crypto";

// Featured dishes on the food home screen: their "ordered in the last 24 hours" figure, the extras
// offered when they are added to the cart, and any time limit or description override.
// Dishes are matched against existing menu data; nothing here writes to the database.
export interface PinnedDish {
  provider: RegExp;
  // Tested against the English part of the menu name, lower-cased (see englishName).
  name: RegExp;
  // Orders in the last 24 hours as supplied by the business. Real orders placed through the
  // app in the last 24 hours are added on top.
  figure: number;
  // Row the dish leads: breakfast, the lunch/dinner rows ("meal"), or Veg Thalis.
  row: "breakfast" | "meal" | "thali";
  extras?: "pav" | "bread";
  // Minutes after midnight IST after which the dish is hidden and cannot be ordered.
  untilMinute?: number;
  description?: string;
}

const SADGURU = /sadguru/i;
const ABHIRUCHI = /abhiruchi/i;
const GANGA = /ganga grand/i;
const SWAD = /swad/i;
const SUMAN = /suman/i;
const RASSA = /rassa bhakri/i;

export const PINNED_DISHES: PinnedDish[] = [
  // Breakfast
  { provider: /davangiri/i, name: /^loni masala spanje dosa$/, row: "breakfast", figure: 38 },
  { provider: ABHIRUCHI, name: /^pavbhaji$/, row: "breakfast", figure: 35, extras: "pav" },
  { provider: SADGURU, name: /^kanda bhaji khekda$/, row: "breakfast", figure: 32, extras: "pav" },
  { provider: /tumkur|turkum|tatt[ae]y/i, name: /idli.*(wada|vada)|(wada|vada).*idli/, row: "breakfast", figure: 28, untilMinute: 13 * 60 },
  { provider: /davangiri/i, name: /^sadha loni dosa$/, row: "breakfast", figure: 24 },
  { provider: SADGURU, name: /^vada pav$/, row: "breakfast", figure: 21 },
  { provider: ABHIRUCHI, name: /^schezwan dosa$/, row: "breakfast", figure: 9 },
  { provider: SADGURU, name: /^misal pav$/, row: "breakfast", figure: 9, extras: "pav" },
  { provider: ABHIRUCHI, name: /^butter misal$/, row: "breakfast", figure: 4, extras: "pav" },

  // Veg thalis
  { provider: /annapurna/i, name: /^veg thali$/, row: "thali", figure: 28 },
  { provider: GANGA, name: /^veg thali$/, row: "thali", figure: 24, description: "Paneer Masala, Shev Bhaji, Matki Suki Bhaji, Papad, 2 Roti, Salad, Dal, Rice, Gulab Jamun" },
  { provider: SWAD, name: /^special veg thali$/, row: "thali", figure: 9, description: "Paneer Masala, Mix Veg, Dal, Rice, 2 Roti and a Sweet" },
  { provider: SWAD, name: /^veg thali$/, row: "thali", figure: 7, description: "Bengan Masala, Mix Veg Bhaji, 2 Roti, Dal, Rice" },

  // Lunch and dinner bhajis
  { provider: RASSA, name: /^paneer masala$/, row: "meal", figure: 12, extras: "bread" },
  { provider: /radhika/i, name: /^shev bhaji$/, row: "meal", figure: 12, extras: "bread" },
  { provider: SADGURU, name: /^green peas curry$/, row: "meal", figure: 8, extras: "bread" },
  { provider: SADGURU, name: /^matki fry$/, row: "meal", figure: 12, extras: "bread" },
  { provider: GANGA, name: /^lasooni palak$/, row: "meal", figure: 18, extras: "bread" },
  { provider: GANGA, name: /^mix veg$/, row: "meal", figure: 12, extras: "bread" },
  { provider: GANGA, name: /^shevga masala$/, row: "meal", figure: 24, extras: "bread" },
  { provider: GANGA, name: /^veg kolhapuri$/, row: "meal", figure: 17, extras: "bread" },
  { provider: SADGURU, name: /^paneer masala - black curry$/, row: "meal", figure: 24, extras: "bread" },
  { provider: SADGURU, name: /^mushroom masala - black curry$/, row: "meal", figure: 18, extras: "bread" },
  { provider: SADGURU, name: /^akkha masoor$/, row: "meal", figure: 14, extras: "bread" },
  { provider: SWAD, name: /^mutter paneer$/, row: "meal", figure: 7, extras: "bread" },
  { provider: SWAD, name: /^kaju curry$/, row: "meal", figure: 4, extras: "bread" },
  { provider: SWAD, name: /^lasun methi$/, row: "meal", figure: 2, extras: "bread" },
  { provider: SUMAN, name: /^kashmiri dum aloo$/, row: "meal", figure: 14, extras: "bread" },
  { provider: SUMAN, name: /^paneer mumtaz$/, row: "meal", figure: 7, extras: "bread" },
  { provider: SUMAN, name: /^paneer lababdar$/, row: "meal", figure: 7, extras: "bread" },
  { provider: SUMAN, name: /^paneer chatpata$/, row: "meal", figure: 12, extras: "bread" },
  { provider: SUMAN, name: /^paneer khurchand$/, row: "meal", figure: 11, extras: "bread" },
  { provider: SUMAN, name: /^veg patiyala$/, row: "meal", figure: 4, extras: "bread" },
  { provider: RASSA, name: /^kaju paneer masala$/, row: "meal", figure: 12, extras: "bread" },
];

// Menus are often bilingual ("मिसळ पाव (Misal Pav)"); keep the English part only.
export const englishName = (name: string) =>
  name.replace(/[^\x00-\x7F]/g, " ").replace(/[()]/g, " ").replace(/\s+/g, " ").replace(/^[^a-z0-9]+/i, "").trim().toLowerCase();

// Index into PINNED_DISHES, or -1.
export function findPinnedIndex(item: { name: string; provider: { businessName: string } }): number {
  const name = englishName(item.name);
  return PINNED_DISHES.findIndex((pinned) => pinned.provider.test(item.provider.businessName) && pinned.name.test(name));
}

const isPlainPav = (name: string) => /\bpav\b/.test(name) && !/misal|vada|bhaji|masala|bhurji|cheese/.test(name);
const isPlainBread = (name: string) =>
  /\b(roti|naan|chapati|chapatti|bhakri|kulcha|paratha|parotha)\b/.test(name) && !/aloo|paneer|cheese|methi|thecha|stuff|thali/.test(name);
// Some restaurants list no breads at all; plain rice is what goes with a bhaji there.
const isPlainRice = (name: string) => /\b(jeera|steam|steamed|plain) rice\b/.test(name);

// Rows in which a pinned dish is moved to the front.
export const PINNED_ROW_SLUGS: Record<PinnedDish["row"], string[]> = {
  breakfast: ["breakfast"],
  meal: ["lunch", "dinner"],
  thali: ["veg-thali"],
};

export function isExtraFor(kind: "pav" | "bread", itemName: string): boolean {
  const name = englishName(itemName);
  return kind === "pav" ? isPlainPav(name) : isPlainBread(name) || isPlainRice(name);
}

// --- Speciality tags ---
// What each partner is known for. A matching dish carries the tag as its badge and leads the
// Non-Veg Special, Biryani and cafe rows. `dish` is tested against "menu section + name".

interface Specialty {
  provider: RegExp;
  dish: RegExp;
  tag: string;
  diet?: "veg" | "non-veg";
}

const NIKHARA = /nikhara/i;
const AFFAIR = /chicken affair/i;
const BULLS = /bulls/i;
const JOY = /cafe of joy/i;
const AROMA = /aroma/i;
const POCKET = /pocket/i;
const ELITE = /elite/i;

const SPECIALTIES: Specialty[] = [
  // Non-veg restaurants
  { provider: /saniraje/i, dish: /thali/i, tag: "Famous for Thalis" },
  { provider: NIKHARA, dish: /murg|mus+al+am|speciality/i, tag: "Nikhara Special", diet: "non-veg" },
  { provider: NIKHARA, dish: /biry?ani|mandi|kepsa/i, tag: "Known for Biryani", diet: "non-veg" },
  { provider: NIKHARA, dish: /tandoor|kebab|kabab|tikka/i, tag: "Tandoor Special", diet: "non-veg" },
  { provider: /tiranga/i, dish: /main course|thali|biry?ani/i, tag: "Everyday Non-Veg", diet: "non-veg" },
  { provider: GANGA, dish: /fish|surmai|paplet|rohu|chilapi|bangda|prawn/i, tag: "Known for Fish", diet: "non-veg" },
  { provider: GANGA, dish: /tandoor|kebab|kabab|tikka/i, tag: "Tandoor Special", diet: "non-veg" },
  { provider: GANGA, dish: /chicken/i, tag: "Chicken Special", diet: "non-veg" },
  { provider: SWAD, dish: /biry?ani/i, tag: "Known for Biryani", diet: "non-veg" },
  { provider: SWAD, dish: /chinese|starter|noodles|manchurian|chilli|lollipop/i, tag: "Chinese Special", diet: "non-veg" },
  { provider: /yash biryani/i, dish: /biry?ani/i, tag: "Shirur's Favourite Biryani" },
  { provider: RASSA, dish: /chicken biry?ani/i, tag: "Special Chicken Biryani" },
  { provider: RASSA, dish: /lollipop|chilli/i, tag: "Chinese Starter", diet: "non-veg" },
  { provider: RASSA, dish: /masala|handi|malvani|sukka|thali/i, tag: "Rassa Special", diet: "non-veg" },
  { provider: /radhika/i, dish: /./, tag: "Home-Style Non-Veg", diet: "non-veg" },
  { provider: AFFAIR, dish: /fried chicken|bucket/i, tag: "Known for Fried Chicken", diet: "non-veg" },
  { provider: AFFAIR, dish: /burger/i, tag: "Known for Burgers", diet: "non-veg" },
  { provider: AFFAIR, dish: /wrap|roll/i, tag: "Known for Wraps", diet: "non-veg" },
  { provider: AFFAIR, dish: /pizza/i, tag: "Chicken Pizza", diet: "non-veg" },
  { provider: AFFAIR, dish: /fries/i, tag: "Loaded Fries", diet: "non-veg" },
  { provider: BULLS, dish: /pizza/i, tag: "Chicken Pizza", diet: "non-veg" },
  { provider: BULLS, dish: /burger/i, tag: "Chicken Burger", diet: "non-veg" },

  // Cafes
  { provider: JOY, dish: /pasta/i, tag: "Known for Pasta" },
  { provider: JOY, dish: /momo/i, tag: "Known for Momos" },
  { provider: JOY, dish: /magg/i, tag: "Special Maggi" },
  { provider: SUMAN, dish: /delhi chaat/i, tag: "Special Delhi Chaat" },
  { provider: SUMAN, dish: /pizza/i, tag: "Known for Pizza" },
  { provider: SUMAN, dish: /garlic bread/i, tag: "Known for Garlic Bread" },
  { provider: SUMAN, dish: /sandwich/i, tag: "Known for Sandwiches" },
  { provider: SUMAN, dish: /pasta/i, tag: "Known for Pasta" },
  { provider: SUMAN, dish: /soya cha+p/i, tag: "Known for Soya Chaap" },
  { provider: SUMAN, dish: /mojito|mocktail/i, tag: "Known for Mocktails" },
  { provider: SUMAN, dish: /dessert|sundae|falooda/i, tag: "Known for Desserts" },
  { provider: AROMA, dish: /burger/i, tag: "Known for Burgers" },
  { provider: AROMA, dish: /shake/i, tag: "Known for Shakes" },
  { provider: POCKET, dish: /pizza/i, tag: "Known for Pizza" },
  { provider: POCKET, dish: /burger/i, tag: "Known for Burgers" },
  { provider: POCKET, dish: /signature blend|thick shake|cold coffee|\b[ck]awa\b/i, tag: "Thick Cold Coffee" },
  { provider: POCKET, dish: /lava|chocolate magic/i, tag: "Known for Lava Cake" },
  { provider: POCKET, dish: /pasta|mac/i, tag: "Mac & Cheese Pasta" },
  { provider: POCKET, dish: /mocktail/i, tag: "Known for Mocktails" },
  { provider: BULLS, dish: /pizza/i, tag: "Known for Pizza" },
  { provider: BULLS, dish: /sandwich/i, tag: "Known for Sandwiches" },
  { provider: BULLS, dish: /cold coffee|hot coffee|latte|cappuccino|espresso|mocha|americano|frappe/i, tag: "Known for Coffee" },
  { provider: ELITE, dish: /fresh juice|pulp/i, tag: "Fresh Juice Favourite" },
  { provider: ELITE, dish: /shake|mastani/i, tag: "Known for Shakes" },
  { provider: ELITE, dish: /sandwich|grill/i, tag: "Known for Sandwiches" },
];

export function findSpecialtyTag(item: { name: string; category?: string | null; isVeg?: boolean | null; provider: { businessName: string } }): string | null {
  const text = `${(item.category || "").replace(/_/g, " ")} ${item.name}`;
  const diet = item.isVeg === false ? "non-veg" : "veg";
  const match = SPECIALTIES.find((specialty) =>
    specialty.provider.test(item.provider.businessName) &&
    (!specialty.diet || specialty.diet === diet) &&
    specialty.dish.test(text));
  return match ? match.tag : null;
}

// Position of a dish among its restaurant's speciality dishes. Reshuffles every three hours
// (IST), so the themed rows open with different dishes from morning to night and day to day.
export function rotationRank(id: string, now: Date = new Date()): number {
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  const slot = `${ist.toISOString().slice(0, 10)}:${Math.floor(ist.getUTCHours() / 3)}`;
  return createHash("sha256").update(`${slot}:${id}`).digest().readUInt32BE(0);
}
