import { createHash } from "crypto";

// Featured dishes on the food home screen: their peak "ordered today" figure, the extras
// offered when they are added to the cart, and any time limit or description override.
// Dishes are matched against existing menu data; nothing here writes to the database.
export interface PinnedDish {
  provider: RegExp;
  // Tested against the English part of the menu name, lower-cased (see englishName).
  name: RegExp;
  // Figure the counter reaches by the end of the day.
  peak: number;
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
  { provider: /davangiri/i, name: /^loni masala spanje dosa$/, row: "breakfast", peak: 38 },
  { provider: ABHIRUCHI, name: /^pavbhaji$/, row: "breakfast", peak: 35, extras: "pav" },
  { provider: SADGURU, name: /^kanda bhaji khekda$/, row: "breakfast", peak: 32, extras: "pav" },
  { provider: /tumkur|turkum|tatt[ae]y/i, name: /^idli wada mix$/, row: "breakfast", peak: 28, untilMinute: 13 * 60 },
  { provider: /davangiri/i, name: /^sadha loni dosa$/, row: "breakfast", peak: 24 },
  { provider: SADGURU, name: /^vada pav$/, row: "breakfast", peak: 21 },
  { provider: ABHIRUCHI, name: /^schezwan dosa$/, row: "breakfast", peak: 9 },
  { provider: SADGURU, name: /^misal pav$/, row: "breakfast", peak: 9, extras: "pav" },
  { provider: ABHIRUCHI, name: /^butter misal$/, row: "breakfast", peak: 4, extras: "pav" },

  // Veg thalis
  { provider: /annapurna/i, name: /^veg thali$/, row: "thali", peak: 28 },
  { provider: GANGA, name: /^veg thali$/, row: "thali", peak: 24, description: "Paneer Masala, Shev Bhaji, Matki Suki Bhaji, Papad, 2 Roti, Salad, Dal, Rice, Gulab Jamun" },
  { provider: SWAD, name: /^special veg thali$/, row: "thali", peak: 9, description: "Paneer Masala, Mix Veg, Dal, Rice, 2 Roti and a Sweet" },
  { provider: SWAD, name: /^veg thali$/, row: "thali", peak: 7, description: "Bengan Masala, Mix Veg Bhaji, 2 Roti, Dal, Rice" },

  // Lunch and dinner bhajis
  { provider: RASSA, name: /^paneer masala$/, row: "meal", peak: 12, extras: "bread" },
  { provider: /radhika/i, name: /^shev bhaji$/, row: "meal", peak: 12, extras: "bread" },
  { provider: SADGURU, name: /^green peas curry$/, row: "meal", peak: 8, extras: "bread" },
  { provider: SADGURU, name: /^matki fry$/, row: "meal", peak: 12, extras: "bread" },
  { provider: GANGA, name: /^lasooni palak$/, row: "meal", peak: 18, extras: "bread" },
  { provider: GANGA, name: /^mix veg$/, row: "meal", peak: 12, extras: "bread" },
  { provider: GANGA, name: /^shevga masala$/, row: "meal", peak: 24, extras: "bread" },
  { provider: GANGA, name: /^veg kolhapuri$/, row: "meal", peak: 17, extras: "bread" },
  { provider: SADGURU, name: /^paneer masala - black curry$/, row: "meal", peak: 24, extras: "bread" },
  { provider: SADGURU, name: /^mushroom masala - black curry$/, row: "meal", peak: 18, extras: "bread" },
  { provider: SADGURU, name: /^akkha masoor$/, row: "meal", peak: 14, extras: "bread" },
  { provider: SWAD, name: /^mutter paneer$/, row: "meal", peak: 7, extras: "bread" },
  { provider: SWAD, name: /^kaju curry$/, row: "meal", peak: 4, extras: "bread" },
  { provider: SWAD, name: /^lasun methi$/, row: "meal", peak: 2, extras: "bread" },
  { provider: SUMAN, name: /^kashmiri dum aloo$/, row: "meal", peak: 14, extras: "bread" },
  { provider: SUMAN, name: /^paneer mumtaz$/, row: "meal", peak: 7, extras: "bread" },
  { provider: SUMAN, name: /^paneer lababdar$/, row: "meal", peak: 7, extras: "bread" },
  { provider: SUMAN, name: /^paneer chatpata$/, row: "meal", peak: 12, extras: "bread" },
  { provider: SUMAN, name: /^paneer khurchand$/, row: "meal", peak: 11, extras: "bread" },
  { provider: SUMAN, name: /^veg patiyala$/, row: "meal", peak: 4, extras: "bread" },
  { provider: RASSA, name: /^kaju paneer masala$/, row: "meal", peak: 12, extras: "bread" },
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

// Rows in which a pinned dish is moved to the front.
export const PINNED_ROW_SLUGS: Record<PinnedDish["row"], string[]> = {
  breakfast: ["breakfast"],
  meal: ["lunch", "dinner"],
  thali: ["veg-thali"],
};

export function isExtraFor(kind: "pav" | "bread", itemName: string): boolean {
  const name = englishName(itemName);
  return kind === "pav" ? isPlainPav(name) : isPlainBread(name);
}

// --- Order counters ---

const istDayKey = () => new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);

// Day's peak for a dish that is not pinned. Deterministic per dish and IST date, so the
// figures hold steady during the day and reshuffle at midnight. Biryani and thali lead (21-24).
export function seededPeak(item: { id: string; name: string; category?: string | null }): number {
  const digest = createHash("sha256").update(`${istDayKey()}:${item.id}`).digest();
  const roll = digest.readUInt32BE(0);
  const spread = digest.readUInt32BE(4);
  if (/biryani|thali/i.test(`${item.name} ${item.category || ""}`)) {
    return roll % 25 === 0 ? 24 : 21 + (spread % 3);
  }
  if (roll % 100 < 25) return 0;
  if (roll % 100 < 35) return 19 + (spread % 5);
  return 1 + (spread % 18);
}

// Share of the day's peak reached by a given IST minute: [minute, share] points, joined by lines.
type Curve = [number, number][];
const CURVES: Record<"general" | "breakfast" | "evening", Curve> = {
  // Low in the morning, steady through lunch, surging in the evening.
  general: [[0, 0.05], [360, 0.08], [690, 0.25], [960, 0.55], [1140, 0.7], [1350, 0.97], [1440, 1]],
  // Breakfast dishes sell out by early afternoon.
  breakfast: [[0, 0.03], [360, 0.1], [690, 0.85], [780, 1], [1440, 1]],
  // Street food stalls open in the evening.
  evening: [[0, 0.03], [960, 0.1], [1320, 0.97], [1440, 1]],
};

export function curveFor(slugs: string[]): keyof typeof CURVES {
  if (slugs.includes("breakfast")) return "breakfast";
  if (slugs.length > 0 && slugs.every((slug) => slug === "street-food")) return "evening";
  return "general";
}

export function countAtMinute(peak: number, curve: keyof typeof CURVES, istMinute: number): number {
  const points = CURVES[curve];
  let share = points[points.length - 1][1];
  for (let i = 1; i < points.length; i++) {
    const [m0, s0] = points[i - 1];
    const [m1, s1] = points[i];
    if (istMinute <= m1) {
      share = s0 + ((s1 - s0) * (istMinute - m0)) / (m1 - m0);
      break;
    }
  }
  return Math.round(peak * share);
}
