// Cross-restaurant food collections shown on the food home screen.
// Restaurants name their menu sections freely ("Main Corse", "Tandur", "Cold Beverges"...),
// so each item is sorted into one collection by keyword rules on its menu category,
// falling back to the dish name when the category says nothing useful.

export interface FoodCollection {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
}

export const FOOD_COLLECTIONS: FoodCollection[] = [
  { slug: "biryani-rice", title: "Biryani & Rice Bowls", subtitle: "Biryani, mandi, pulao & fried rice", image: "/images/menu-items/biryani.jpg" },
  { slug: "starters-tandoor", title: "Starters & Tandoor", subtitle: "Tikkas, kebabs, soups & Chinese starters", image: "/images/menu-items/chicken_wings.jpg" },
  { slug: "fast-food", title: "Fast Food & Street Style", subtitle: "Momos, sandwiches, dosa, noodles & more", image: "/images/menu-items/dabeli.jpg" },
  { slug: "pizzas-burgers", title: "Pizzas & Burgers", subtitle: "Pizzas, burgers & garlic bread", image: "/images/menu-items/burger.jpg" },
  { slug: "main-course", title: "Main Course (North Indian/Meals)", subtitle: "Curries, handi, thalis, dal & breads", image: "/images/menu-items/butter_chicken.jpg" },
  { slug: "desserts-sweets", title: "Desserts & Sweets", subtitle: "Ice creams, cakes, brownies & sweets", image: "/images/menu-items/dessert.jpg" },
  { slug: "beverages", title: "Beverages", subtitle: "Shakes, juices, mocktails, tea & coffee", image: "/images/menu-items/cold_coffee.jpg" },
];

// Side items that should not appear in any collection.
const EXCLUDED = /\b(papad|raita|rayta|salad|dips?|extras?|add-?ons?|kitchen service|premium products|khari|mixtures?)\b/i;

// Checked in order; the first match wins (e.g. "Chinese Fried Rice" is a rice bowl, not fast food).
const RULES: { slug: string; pattern: RegExp }[] = [
  { slug: "desserts-sweets", pattern: /\b(desserts?|sweets?|ice[- ]?creams?|cakes?|pastr(y|ies)|brownies?|sundaes?|softy|falooda|kulfi|cookies?|chocolate|cream rolls?|gulab jamun|rasmalai|halwa|kheer|basundi|shrikhand|waffles?)\b/i },
  { slug: "beverages", pattern: /\b(beverages?|beverges|drinks?|shakes?|milk ?shakes?|lassi|juices?|coffee'?s?|tea|chai|mocktails?|mocktail's|soda|mastani|coolers?|cooling|lemon|pulp|shots?|buttermilk|chaas|signature blend)\b/i },
  { slug: "pizzas-burgers", pattern: /\b(pizzas?|burgers?|garlic bread)\b/i },
  { slug: "biryani-rice", pattern: /\b(biry?ani|pulao|pulav|mandi|kepsa|kabsa|khichdi|rice)\b/i },
  { slug: "starters-tandoor", pattern: /\b(starters?|appetizers?|tandoor|tandur|tandoori|tikka|kebabs?|kababs?|lollipop|soups?|soup's|manchurian|chilli|crispy)\b/i },
  { slug: "fast-food", pattern: /\b(snacks?|sandwich(es)?|fries|momos?|maggi|maggie|pav ?bhaji|pavbhaji|misal|vada ?pav|bhel|dabeli|frankie|rolls?|wraps?|noodles|hakka|chinese|pasta|toast|popcorn|chaat|samosa|dosa|idli|uttapam|breakfast|fried chicken|bucket|nuggets|strips|wings)\b/i },
  { slug: "main-course", pattern: /\b(main ?cou?rse|main corse|thali|meals?|handi|curry|masala|kolhapuri|malvani|rassa|dal|paneer|kadhai|roti|naan|bhakri|paratha|kulcha|breads?|dishes|specials?|speciality|veg|non-veg|chicken|mutton|egg|fish|prawns?|kheema|maharasht\w*)\b/i },
];

function matchRules(text: string): string | null {
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.slug;
  }
  return null;
}

export function classifyMenuItem(item: { name: string; category?: string | null }): string | null {
  const category = (item.category || "").replace(/_/g, " ").trim();
  if (category && EXCLUDED.test(category)) return null;
  if (EXCLUDED.test(item.name)) return null;
  // Cafes list hot drinks under a bare "Hot"/"Hots" section.
  if (/^hots?$/i.test(category)) return "beverages";
  return (category && matchRules(category)) || matchRules(item.name);
}

export function getFoodCollection(slug: string): FoodCollection | undefined {
  return FOOD_COLLECTIONS.find((collection) => collection.slug === slug);
}
