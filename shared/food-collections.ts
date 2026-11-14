// Time-of-day food categories shown on the food home screen.
// Each category is one mixed feed of dishes from every partner restaurant; the client shows
// only the categories whose IST window is currently open.

export interface FoodCollection {
  slug: string;
  title: string;
  subtitle: string;
  // Window in minutes after midnight IST: startMinute inclusive, endMinute exclusive.
  startMinute: number;
  endMinute: number;
}

export const FOOD_COLLECTIONS: FoodCollection[] = [
  { slug: "breakfast", title: "Breakfast", subtitle: "6:00 AM – 11:30 AM", startMinute: 6 * 60, endMinute: 11 * 60 + 30 },
  { slug: "lunch", title: "Lunch", subtitle: "11:30 AM – 4:00 PM", startMinute: 11 * 60 + 30, endMinute: 16 * 60 },
  { slug: "dinner", title: "Dinner", subtitle: "7:00 PM – 12:00 AM", startMinute: 19 * 60, endMinute: 24 * 60 },
  { slug: "street-food", title: "Street Food", subtitle: "4:00 PM – 10:00 PM", startMinute: 16 * 60, endMinute: 22 * 60 },
  { slug: "cafe", title: "Cafe Items", subtitle: "10:00 AM – 10:00 PM", startMinute: 10 * 60, endMinute: 22 * 60 },
];

export function getFoodCollection(slug: string): FoodCollection | undefined {
  return FOOD_COLLECTIONS.find((collection) => collection.slug === slug);
}

// Minutes after midnight in IST (UTC+5:30), whatever the device or server timezone is.
export function getIstMinutes(date: Date = new Date()): number {
  return (date.getUTCHours() * 60 + date.getUTCMinutes() + 330) % 1440;
}

// Categories open right now. Between midnight and 6 AM nothing is open, so all are shown
// rather than leaving the screen empty.
export function getActiveFoodCollections(date: Date = new Date()): FoodCollection[] {
  const minutes = getIstMinutes(date);
  const active = FOOD_COLLECTIONS.filter((c) => minutes >= c.startMinute && minutes < c.endMinute);
  return active.length ? active : FOOD_COLLECTIONS;
}

// --- Sorting dishes into categories ---
// Restaurants name their menu sections freely ("Main Corse", "Tandur", "Cold Beverges"...),
// so each dish gets a dish type by keyword rules on its menu section, falling back to its name.

// Side items that should not appear in any category.
const EXCLUDED = /\b(papad|raita|rayta|salad|dips?|extras?|add-?ons?|kitchen service|premium products|khari|mixtures?)\b/i;

type DishType = "desserts" | "beverages" | "pizzas-burgers" | "rice" | "starters" | "snacks" | "main-course";

// Checked in order; the first match wins (e.g. "Chinese Fried Rice" is rice, not a snack).
const DISH_RULES: { type: DishType; pattern: RegExp }[] = [
  { type: "desserts", pattern: /\b(desserts?|sweets?|ice[- ]?creams?|cakes?|pastr(y|ies)|brownies?|sundaes?|softy|falooda|kulfi|cookies?|chocolate|cream rolls?|gulab jamun|rasmalai|halwa|kheer|basundi|shrikhand|waffles?)\b/i },
  { type: "beverages", pattern: /\b(beverages?|beverges|drinks?|shakes?|milk ?shakes?|lassi|juices?|coffee'?s?|tea|chai|mocktails?|mocktail's|soda|mastani|coolers?|cooling|lemon|pulp|shots?|buttermilk|chaas|signature blend)\b/i },
  { type: "pizzas-burgers", pattern: /\b(pizzas?|pizza's|burgers?|burger'z|garlic bread)\b/i },
  { type: "rice", pattern: /\b(biry?ani|pulao|pulav|mandi|kepsa|kabsa|khichdi|rice)\b/i },
  { type: "starters", pattern: /\b(starters?|starter's|appetizers?|tandoor|tandur|tandoori|tikka|kebabs?|kababs?|lollipop|soups?|soup's|manchurian|chilli|crispy)\b/i },
  { type: "snacks", pattern: /\b(snacks?|sandwich(es)?|fries|momos?|momo's|maggi|maggie|pav ?bhaji|pavbhaji|misal|vada ?pav|bhel|dabeli|frankie|rolls?|wraps?|noodles|hakka|chinese|pasta|toast|popcorn|chaat|samosa|dosa|idli|uttapam|breakfast|fried chicken|bucket|nuggets|strips|wings)\b/i },
  { type: "main-course", pattern: /\b(main ?cou?rse|main corse|thali|meals?|handi|curry|masala|kolhapuri|malvani|rassa|dal|paneer|kadhai|roti|naan|bhakri|paratha|kulcha|breads?|dishes|specials?|speciality|veg|non-veg|chicken|mutton|egg|fish|prawns?|kheema|maharasht\w*)\b/i },
];

interface DishInfo {
  name: string;
  category?: string | null;
}

const sectionOf = (item: DishInfo) => (item.category || "").replace(/_/g, " ").trim();

function matchDishRules(text: string): DishType | null {
  for (const rule of DISH_RULES) {
    if (rule.pattern.test(text)) return rule.type;
  }
  return null;
}

function getDishType(item: DishInfo): DishType | null {
  const section = sectionOf(item);
  if (section && EXCLUDED.test(section)) return null;
  if (EXCLUDED.test(item.name)) return null;
  // Cafes list hot drinks under a bare "Hot"/"Hots" section.
  if (/^hots?$/i.test(section)) return "beverages";
  return (section && matchDishRules(section)) || matchDishRules(item.name);
}

const BREAKFAST_SECTION = /\b(breakfast|dosa|uttapam|idli|misal)\b/i;
const BREAKFAST_DISH = /\b(dosa|uttapam|uttappa|idli|misal|poha|pohe|upma|medu ?vada|sabudana|thalipeeth|sheera|appe|puri bhaji)\b/i;
const NOODLES = /\b(noodles|hakka|chopsuey)\b/i;
// Street food vendors run in the evening, except this breakfast stall.
const BREAKFAST_STREET_VENDOR = /tumkur|turkum|tatt[ae]y/i;

export interface ClassifiableDish extends DishInfo {
  itemType: "restaurant" | "street_food";
  provider: { businessName: string };
}

// The categories a dish belongs to. Lunch and dinner share the same main-course catalog.
export function getFoodCollectionSlugs(item: ClassifiableDish): string[] {
  if (item.itemType === "street_food") {
    return BREAKFAST_STREET_VENDOR.test(item.provider.businessName) ? ["breakfast", "street-food"] : ["street-food"];
  }
  const type = getDishType(item);
  if (!type) return [];
  if (BREAKFAST_SECTION.test(sectionOf(item)) || BREAKFAST_DISH.test(item.name)) return ["breakfast"];
  const isMeal = type === "main-course" || type === "rice" || type === "starters" ||
    (type === "snacks" && NOODLES.test(`${sectionOf(item)} ${item.name}`));
  return isMeal ? ["lunch", "dinner"] : ["cafe"];
}

// --- Ordering a category feed ---

// Dishes pinned to the top of a category, in this order. `dish` narrows a spotlight to
// specific dishes (matched against menu section + name); without it the whole restaurant qualifies.
interface Spotlight {
  provider: RegExp;
  dish?: RegExp;
}

const MAIN_COURSE_SPOTLIGHTS: Spotlight[] = [
  { provider: /radhika/i },
  { provider: /sadguru/i },
  { provider: /swad/i },
  { provider: /suman/i },
  { provider: /rassa bhakri/i },
  { provider: /ganga grand/i },
];

const SPOTLIGHTS: Record<string, Spotlight[]> = {
  breakfast: [
    { provider: /abhiruchi/i },
    { provider: /sadguru/i },
    { provider: BREAKFAST_STREET_VENDOR },
  ],
  lunch: MAIN_COURSE_SPOTLIGHTS,
  dinner: MAIN_COURSE_SPOTLIGHTS,
  cafe: [
    { provider: /cafe of joy/i, dish: /white sauce.*pasta/i },
    { provider: /aroma/i, dish: /burger/i },
    { provider: /suman/i, dish: /pizza/i },
    { provider: /cafe of joy/i, dish: /kurkure.*momo/i },
    { provider: /pocket/i, dish: /sandwich/i },
  ],
};

const MEAL_SIDES = /\b(roti|naan|bhakri|chapati|kulcha|breads?|soups?|soup's)\b/i;

// Accompaniments sink below the dishes people actually come for: breads and soups at
// lunch/dinner, drinks and desserts among cafe items.
function isSide(slug: string, item: ClassifiableDish): boolean {
  if (item.itemType === "street_food") return false;
  if (slug === "lunch" || slug === "dinner") return MEAL_SIDES.test(sectionOf(item) || item.name);
  if (slug === "cafe") {
    const type = getDishType(item);
    return type === "beverages" || type === "desserts";
  }
  return false;
}

// Round-robin across queues, so neighbouring dishes come from different restaurants.
function interleave<T>(queues: T[][]): T[] {
  const result: T[] = [];
  const longest = Math.max(0, ...queues.map((queue) => queue.length));
  for (let i = 0; i < longest; i++) {
    for (const queue of queues) {
      if (i < queue.length) result.push(queue[i]);
    }
  }
  return result;
}

export interface FeedDish extends ClassifiableDish {
  providerId: string;
  provider: { businessName: string; isAvailable?: boolean | null };
}

// Final order of a category feed: spotlighted dishes first (taking turns in spotlight order),
// then every other dish mixed across restaurants, then sides. Closed restaurants go last.
// The incoming order is kept within each restaurant, so pass dishes in best-first.
export function orderFoodCollectionFeed<T extends FeedDish>(slug: string, items: T[]): T[] {
  const spotlights = SPOTLIGHTS[slug] || [];

  const arrange = (list: T[]): T[] => {
    const featured: { mains: T[]; sides: T[] }[] = spotlights.map(() => ({ mains: [], sides: [] }));
    const general = new Map<string, T[]>();
    const sides = new Map<string, T[]>();
    const pushTo = (pool: Map<string, T[]>, item: T) => {
      if (!pool.has(item.providerId)) pool.set(item.providerId, []);
      pool.get(item.providerId)!.push(item);
    };

    for (const item of list) {
      const side = isSide(slug, item);
      const index = spotlights.findIndex((spotlight) =>
        spotlight.provider.test(item.provider.businessName) &&
        (!spotlight.dish || spotlight.dish.test(`${sectionOf(item)} ${item.name}`)));
      if (index >= 0) featured[index][side ? "sides" : "mains"].push(item);
      else pushTo(side ? sides : general, item);
    }

    return [
      ...interleave(featured.map((queue) => [...queue.mains, ...queue.sides])),
      ...interleave(Array.from(general.values())),
      ...interleave(Array.from(sides.values())),
    ];
  };

  return [
    ...arrange(items.filter((item) => item.provider.isAvailable !== false)),
    ...arrange(items.filter((item) => item.provider.isAvailable === false)),
  ];
}
