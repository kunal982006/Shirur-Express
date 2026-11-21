import { englishName } from "./food-highlights";

// "What Shirur is Ordering": the hand-picked dishes of the Café, Biryani and Street Food tabs, with
// the "ordered today" figure supplied by the business (scaled through the day by liveFigure). Dishes
// are matched by restaurant and dish name against the live menus; an entry that matches nothing is
// left out and reported by /api/food-insights/check. Nothing here writes to the database.

export type OrderingTab = "cafe" | "biryani" | "street-food";
// Add opens a picker: Half / Full, 8" / 10" pizza, or Steam / Fried momos.
export type OrderingChoice = "half-full" | "size" | "style";

export interface OrderingEntry {
  tab: OrderingTab;
  provider: RegExp;
  // Tested against the normalised dish name with portion / size / style words removed (see baseName).
  name: RegExp;
  figure: number;
  choice?: OrderingChoice;
  // Only this portion of a Half / Full dish is listed.
  portion?: "half" | "full";
  // Popup of add-ons from the same restaurant when the dish is added: the first pattern that
  // matches any of its menu items wins.
  extras?: RegExp[];
  nonVegOnly?: boolean;
  badge?: string;
}

const JOY = /cafe of joy/i;
const AROMA = /aroma/i;
const POCKET = /pocket/i;
const AFFAIR = /chicken affair/i;
const ELITE = /elite/i;
const RUDRA = /rudra/i;
const SAMARTH = /samarth/i;
const DAVANGIRI = /davang[ie]r[ie]/i;
const SURBHI = /sur[a]?bhi/i;

// Extra cheese at Aroma: sandwiches have their own "cheese extra" line, pizzas "Extra Cheese".
const AROMA_SANDWICH_CHEESE = [/sandwich with cheese extra/, /^extra cheese$/];
const AROMA_PIZZA_CHEESE = [/^extra cheese$/];
const POCKET_CHEESE_SLICE = [/^extra cheese slice$/, /^cheese slice$/];

const cafe = (provider: RegExp, list: [RegExp, number, Partial<OrderingEntry>?][]): OrderingEntry[] =>
  list.map(([name, figure, extra]) => ({ tab: "cafe", provider, name, figure, ...extra }));
const biryani = (provider: RegExp, list: [RegExp, number, Partial<OrderingEntry>?][]): OrderingEntry[] =>
  list.map(([name, figure, extra]) => ({ tab: "biryani", provider, name, figure, ...extra }));
const street = (provider: RegExp, list: [RegExp, number, Partial<OrderingEntry>?][]): OrderingEntry[] =>
  list.map(([name, figure, extra]) => ({ tab: "street-food", provider, name, figure, ...extra }));

const HF = { choice: "half-full" } as const;
const SIZE = { choice: "size" } as const;
const STYLE = { choice: "style" } as const;
const NONVEG = { nonVegOnly: true } as const;

export const SHIRUR_ORDERING: OrderingEntry[] = [
  // ---------------- Café ----------------
  ...cafe(JOY, [
    [/^white sauce cheese pasta$/, 16],
    [/^red sauce cheese pasta$/, 11],
    [/^thick bournvita$/, 6],
    [/^normal cold coffee$/, 17],
    [/^cold coffee with crus[ht]$/, 7],
    [/^masala maggi$/, 18],
    [/^schezwan cheese maggi$/, 21],
    [/^corn (and )?paneer maggi$/, 13],
    [/^peri peri masala cheese maggi$/, 15],
    [/^veg burger$/, 4],
    [/^double decker cheese burger$/, 9],
    [/of joy (sp|spl|special) cheese burger$/, 27],
    [/^peri peri fries$/, 16],
  ]),
  ...cafe(AROMA, [
    [/^cold chocolate$/, 12],
    [/^cold coffee$/, 15],
    [/^hot chocolate$/, 11],
    [/^mocha cold coffee$/, 5],
    [/^(french fries salted|salted french fries)$/, 19],
    [/^peri peri fries$/, 13],
    [/^french fries cheese overloa?ded$/, 8],
    [/^peri peri fries cheese overloa?ded$/, 2],
    [/^veg burger$/, 21],
    [/^herb chil+[iy] burger$/, 7],
    [/^schezwan (cheese )?burger$/, 9],
    [/^paneer burger$/, 19],
    [/^double tikki burger$/, 13],
    [/^tadka sandwich$/, 4, { extras: AROMA_SANDWICH_CHEESE }],
    [/^veg sandwich$/, 2, { extras: AROMA_SANDWICH_CHEESE }],
    [/^paneer sandwich$/, 5, { extras: AROMA_SANDWICH_CHEESE }],
    [/^chocolate sandwich$/, 3, { extras: AROMA_SANDWICH_CHEESE }],
    [/^ghotala sandwich$/, 11, { extras: AROMA_SANDWICH_CHEESE }],
    [/^pizza sandwich/, 8, { extras: AROMA_SANDWICH_CHEESE }],
    [/^plain cheese pizza$/, 6, { extras: AROMA_PIZZA_CHEESE }],
    [/^veg schezwan pizza$/, 7, { extras: AROMA_PIZZA_CHEESE }],
    [/^veg tand(oo|u)ri pizza$/, 3, { extras: AROMA_PIZZA_CHEESE }],
    [/^paneer tand(oo|u)ri pizza$/, 8, { extras: AROMA_PIZZA_CHEESE }],
    [/^garlic toast$/, 2],
    [/^mango mastani$/, 7],
    [/^pista mastani$/, 3],
    [/^chocolate mastani$/, 6],
    [/^mix veg momos$/, 3],
    [/^schezwan momos$/, 6],
    [/^paneer momos$/, 4],
  ]),
  ...cafe(POCKET, [
    [/^aloo tikki burger$/, 7, { extras: POCKET_CHEESE_SLICE }],
    [/^veg crispy burger$/, 11, { extras: POCKET_CHEESE_SLICE }],
    [/^kimch[iy] burger$/, 21, { extras: POCKET_CHEESE_SLICE }],
    [/^veg tand(oo|u)ri burger$/, 17, { extras: POCKET_CHEESE_SLICE }],
    [/^chees[ey] lava burger$/, 16, { extras: POCKET_CHEESE_SLICE }],
    [/^spicy paneer tand(oo|u)ri burger$/, 13, { extras: POCKET_CHEESE_SLICE }],
    [/^fresh lime soda$/, 2],
    [/^cawa( special thick cold coffee)?$/, 25],
    [/^cawa crush$/, 17],
    [/^swiss coffee$/, 8],
    [/^cold coffee( italian iced coffee)?$/, 9],
    // On the menu as one dish, "Veg Masala Maggi / Peri Peri Maggi": the two figures add up.
    [/^veg masala maggi/, 5],
    [/peri peri maggi$/, 7],
    [/^cheese loaded maggi$/, 3],
    [/^bombay sandwich/, 9],
    [/^chocolate sandwich$/, 11],
    [/^veg cheese grill(ed)?( sandwich)?$/, 12],
    [/^paneer tand(oo|u)ri (grill(ed)? )?sandwich$/, 4],
    [/^la[wv]a cake$/, 21],
    [/^chocolaty b$/, 14],
    [/^strawberry shake$/, 12],
    [/^mango shake$/, 8],
    [/^belgium chocolate shake$/, 4],
    [/^classic salted fries$/, 8],
    [/^masala fries$/, 6],
    [/^peri peri fries/, 15],
    [/^creamy cheesy fries loaded$/, 7],
    [/^cheese loaded peri peri fries$/, 11],
    [/^potato pops/, 4],
    [/^classic italian garlic bread$/, 4],
    [/^spicy paneer wrap$/, 14],
    [/^italian margherita( pizza)?$/, 17, SIZE],
    [/^paneer makhanwala pizza$/, 21, SIZE],
    [/^tand(oo|u)ri paneer pizza$/, 24, SIZE],
    [/^pesto cheese pizza$/, 8, SIZE],
    [/^cheese burst tand(oo|u)ri paneer( pizza)?$/, 14, SIZE],
    [/^american corn pizza$/, 7, SIZE],
    [/^alfredo white sauce( pasta)?$/, 9],
    [/^mac (and )?cheese( pasta)?$/, 7],
    [/^arr?abb?iata red sauce( pasta)?$/, 6],
  ]),
  ...cafe(AFFAIR, [
    [/^chicken wrap$/, 17, NONVEG],
    [/^cruncho pop wrap/, 13, NONVEG],
    [/tand(oo|u)ri (chicken )?wrap$/, 19, NONVEG],
    [/^(chicken )?kh?eema( regular)?$/, 7, NONVEG],
    [/^chees[ey] ?kh?eema/, 13, NONVEG],
    [/^irish cold coffee$/, 8],
    [/^choc(o|olate) cold coffee$/, 11],
    [/^classic non veg burger$/, 17, NONVEG],
    [/^cruncho pop burger$/, 9, NONVEG],
    [/^bbq chicken burger$/, 19],
    [/^peri peri chicken burger$/, 15],
    [/^zinger special burger$/, 12],
    [/^tand(oo|u)ri fries( reg| regular)?$/, 16],
    [/^zesty fries( reg| regular)?$/, 4],
    [/^sriracha fries( reg| regular)?$/, 8],
    [/^simply chicken pizza$/, 19],
    [/^smoky bbq chicken pizza$/, 14],
    [/^chettinad chicken pizza$/, 8],
    [/^chicken loaded pizza$/, 26],
    [/^small bucket$/, 8],
    [/^medium bucket$/, 9],
    [/^large bucket$/, 13],
    [/^singles? meal$/, 19],
    [/^chh?ott?a meal$/, 14],
    [/^burger buddy( combo)?$/, 11],
  ]),
  ...cafe(ELITE, [
    [/^special lassi$/, 7],
    [/^mango dolly$/, 8],
    [/^jamun shots?$/, 15],
    [/^chutney sandwich$/, 6],
    [/^cheese sandwich$/, 14],
    [/^veg club sandwich$/, 18],
    [/^cold coffee$/, 21],
    [/^chocolate milk ?shake$/, 17],
    [/^cold brew/, 17],
    [/^papaya milk ?shake$/, 18],
    [/^mix fruit milk ?shake$/, 24],
    [/^chi(c)?k(k)?(u|oo) milk ?shake$/, 11],
    [/^pine ?apple milk ?shake$/, 22],
    [/^apple milk ?shake$/, 7],
    [/^mango milk ?shake$/, 6],
    [/^orange juice$/, 16],
    [/^ganga jamuna juice$/, 18],
    [/^jamun juice$/, 8],
    [/^chi(c)?k(k)?(u|oo) chocolate$/, 25],
    [/^salted fries$/, 12],
    [/^peri peri french fries$/, 16],
    [/^special loaded fries$/, 19],
  ]),

  // ---------------- Biryani (regular plates; 1 kg packs are never listed) ----------------
  ...biryani(/yash biryani/i, [
    [/^chicken biryani$/, 27, { portion: "half" }],
  ]),
  ...biryani(/radhika/i, [
    [/^veg biryani$/, 32],
    [/^egg biryani$/, 12],
    [/^chicken biryani$/, 24],
  ]),
  ...biryani(/swad/i, [
    [/^veg biryani$/, 19, { portion: "half" }],
    [/^chicken hyderabadi biryani$/, 13, { portion: "half" }],
    [/^veg fry pan biryani$/, 17],
  ]),
  ...biryani(/rassa bhakri/i, [
    [/^paneer biryani$/, 121],
    [/^mutton biryani$/, 17],
    [/^chicken biryani$/, 29],
  ]),
  ...biryani(/tiranga/i, [
    [/^chicken dum biryani$/, 18],
    [/^chicken kashmiri pula[ov]$/, 8],
    [/^mutton dum biryani$/, 4],
  ]),
  ...biryani(/annapurna/i, [
    [/^veg dum biryani$/, 11],
    [/^chicken dum biryani$/, 12],
  ]),
  ...biryani(/nikhara/i, [
    [/^chicken lucknowi dum biryani( mild)?$/, 19],
    [/^chicken dum biryani$/, 12],
    [/^special hyderabadi mutton dum biryani$/, 23],
  ]),

  // ---------------- Street food ----------------
  ...street(RUDRA, [
    [/^masala manchurian$/, 28],
    [/^soya?bea?n chil+[iy]$/, 17],
    [/^paneer chil+[iy]$/, 12],
    [/^peri peri mayo( potato spring ?rolls?)?$/, 29],
    [/^special potato spring ?rolls?$/, 19],
    [/^hakka noodles$/, 16, HF],
    [/^manchurian schezwan noodles$/, 19, HF],
    [/^fried rice$/, 26, HF],
    [/^paneer fried rice$/, 25, HF],
    [/^manchurian fried rice$/, 24, HF],
    [/^special triple rice$/, 21, HF],
  ]),
  ...street(SAMARTH, [
    [/^veg hot ?pan$/, 17],
    [/^(veg )?manchow soup$/, 12],
    [/^paneer manchow soup$/, 18],
    [/^fried rice$/, 17, HF],
    [/^combination rice$/, 27, HF],
    [/^paneer fried rice$/, 23, HF],
    [/^special combo rice$/, 12, HF],
    [/^paneer hong ?kong rice$/, 26, HF],
    [/^paneer chil+[iy]( dry)?$/, 37, { badge: "Most Special" }],
    [/^(veg )?manchurian dry$/, 21],
    [/^(veg )?manchurian gravy$/, 23],
    [/^paneer manchurian( dry)?$/, 31],
    [/^garlic noodles$/, 17, HF],
    [/^paneer noodles$/, 23, HF],
    [/^manchurian (fried )?noodles$/, 18, HF],
  ]),
  ...street(DAVANGIRI, [
    [/^sadha loni dosa$/, 28],
    [/^loni masala spanje dosa$/, 12],
  ]),
  ...street(SURBHI, [
    [/^tand(oo|o|u)ri soya cha+p$/, 32],
    [/moti soya cha+p$/, 8],
    [/^paneer tand(oo|o|u)ri tikka$/, 11],
    [/^paneer mala[iy] tikka$/, 28],
    // Mix veg is "Mix Veg Momos (Steam)" and "Veg Momos (Fried)" on the menu.
    [/^(mix )?veg momos$/, 31, STYLE],
    [/^paneer momos$/, 24, STYLE],
    [/^(veg|corn) cheese momos$/, 12, STYLE],
    [/^paneer kurkure momos$/, 26, STYLE],
  ]),
];

// --- Matching ---

// Lower-case English name with spelling variants folded together ("Shejwan" -> "schezwan").
export function normName(name: string): string {
  const plain = englishName(name.normalize("NFD").replace(/[̀-ͯ]/g, ""));
  return plain
    .replace(/&/g, " and ")
    .replace(/\bs(c)?he[jz]wa[nm]\b|\bsezwan\b/g, "schezwan")
    .replace(/\bmaggie\b/g, "maggi")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PORTION = /\b(half|full)\b/;
const SIZE_RE = /\b(8|10|12)\s*(inch|inches|in)?\b/;
const STYLE_RE = /\b(steam|steamed|fried|fry)\b/;
const BULK = /\b1\s*kg\b|\bkg\b/;

const strip = (name: string, re: RegExp) => name.replace(new RegExp(re.source, "g"), " ").replace(/\s+/g, " ").trim();

function baseName(name: string, choice?: OrderingChoice): string {
  let base = strip(name, PORTION);
  if (choice === "size") base = strip(base, SIZE_RE);
  if (choice === "style") base = strip(base, STYLE_RE);
  return base;
}

// "Hakka Noodles (Half)" -> "Hakka Noodles"; 'Italian Margherita (8")' -> "Italian Margherita";
// "Paneer Momos (FRIED)" -> "Paneer Momos".
export function displayName(name: string): string {
  return name
    .replace(/\s*\((half|full|steam|steamed|fried|fry|\d+\s*(?:"|”|''|inch|inches|in))\)\s*$/i, "")
    .replace(/\s+(half|full)$/i, "")
    .trim();
}

interface MenuItem {
  id: string;
  name: string;
  price: string | number;
  isVeg?: boolean | null;
  provider: { businessName: string };
}

export interface OrderingVariant { id: string; label: string }

export interface OrderingCard {
  tab: OrderingTab;
  entry: number;
  // Cheapest first; one id when Add needs no picker.
  variants: OrderingVariant[];
  choice?: OrderingChoice;
}

export interface OrderingMatch {
  cards: OrderingCard[];
  // Figure per dish id (the cheapest portion / size carries it).
  figures: Map<string, number>;
  extras: Map<string, RegExp[]>;
  badges: Map<string, string>;
  unmatched: OrderingEntry[];
}

function variantLabel(name: string, choice: OrderingChoice): string | null {
  if (choice === "half-full") {
    const m = name.match(PORTION);
    return m ? (m[1] === "half" ? "Half" : "Full") : null;
  }
  if (choice === "size") {
    const m = name.match(SIZE_RE);
    return m ? `${m[1]} inch` : null;
  }
  const m = name.match(STYLE_RE);
  return m ? (m[1].startsWith("steam") ? "Steam" : "Fried") : null;
}

const LABEL_ORDER = ["Half", "Full", "8 inch", "10 inch", "Steam", "Fried"];

export function matchShirurOrdering(
  items: MenuItem[],
  isNonVeg: (item: MenuItem) => boolean,
): OrderingMatch {
  const byProvider = new Map<string, { item: MenuItem; norm: string }[]>();
  for (const item of items) {
    const key = item.provider.businessName;
    if (!byProvider.has(key)) byProvider.set(key, []);
    byProvider.get(key)!.push({ item, norm: normName(item.name) });
  }
  const providers = Array.from(byProvider.entries());

  const cards: OrderingCard[] = [];
  const figures = new Map<string, number>();
  const extras = new Map<string, RegExp[]>();
  const badges = new Map<string, string>();
  const unmatched: OrderingEntry[] = [];
  const cardByFirstId = new Map<string, OrderingCard>();

  SHIRUR_ORDERING.forEach((entry, index) => {
    const menu = providers.filter(([name]) => entry.provider.test(name)).flatMap(([, list]) => list);
    let found = menu.filter(({ item, norm }) =>
      !BULK.test(norm) &&
      (!entry.nonVegOnly || isNonVeg(item)) &&
      entry.name.test(baseName(norm, entry.choice)));
    if (entry.portion) {
      const wanted = found.filter(({ norm }) => norm.match(PORTION)?.[1] === entry.portion);
      // A menu with one plain portion: keep it.
      if (wanted.length) found = wanted;
    }
    const cheapest = (list: typeof found) => [...list].sort((a, b) => Number(a.item.price) - Number(b.item.price));

    let variants: OrderingVariant[] = [];
    let choice: OrderingChoice | undefined;
    if (entry.choice) {
      const labelled = new Map<string, MenuItem>();
      for (const { item, norm } of cheapest(found)) {
        const label = variantLabel(norm, entry.choice);
        if (!label || label === "12 inch" || labelled.has(label)) continue;
        labelled.set(label, item);
      }
      // Two portions with no Half / Full in their names: the cheaper one is the half.
      if (entry.choice === "half-full" && labelled.size === 0 && found.length === 2) {
        const [a, b] = cheapest(found);
        labelled.set("Half", a.item);
        labelled.set("Full", b.item);
      }
      if (labelled.size >= 2) {
        choice = entry.choice;
        variants = Array.from(labelled.entries())
          .sort((a, b) => LABEL_ORDER.indexOf(a[0]) - LABEL_ORDER.indexOf(b[0]))
          .map(([label, item]) => ({ id: item.id, label }));
      }
    } else if (!entry.portion) {
      // A dish sold as Half and Full with no portion named in the list: offer both.
      const half = cheapest(found).find(({ norm }) => norm.match(PORTION)?.[1] === "half");
      const full = cheapest(found).find(({ norm }) => norm.match(PORTION)?.[1] === "full");
      if (half && full) {
        choice = "half-full";
        variants = [{ id: half.item.id, label: "Half" }, { id: full.item.id, label: "Full" }];
      }
    }
    if (!variants.length && found.length) {
      const pick = cheapest(found)[0].item;
      variants = [{ id: pick.id, label: "" }];
    }
    if (!variants.length) {
      unmatched.push(entry);
      return;
    }

    const first = variants[0].id;
    figures.set(first, (figures.get(first) || 0) + entry.figure);
    for (const variant of variants) {
      if (entry.extras) extras.set(variant.id, entry.extras);
      if (entry.badge) badges.set(variant.id, entry.badge);
    }
    // Two list lines that are one menu dish make one card.
    if (cardByFirstId.has(first)) return;
    const card: OrderingCard = { tab: entry.tab, entry: index, variants, choice };
    cardByFirstId.set(first, card);
    cards.push(card);
  });

  return { cards, figures, extras, badges, unmatched };
}

// Add-ons for a dish from the extras patterns of its list entry: the first pattern with a match wins.
export function pickExtras<T extends { name: string }>(patterns: RegExp[], menu: T[]): T[] {
  for (const pattern of patterns) {
    const hits = menu.filter((other) => pattern.test(normName(other.name)));
    if (hits.length) return hits;
  }
  return [];
}

export const CHOICE_TITLES: Record<OrderingChoice, string> = {
  "half-full": "Choose half or full",
  size: "Choose a size",
  style: "Choose steam or fried",
};
