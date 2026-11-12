// Picks a default food photo (from client/public/images/menu-items) for a menu item that has no image,
// based on keywords in its name/category. Used when vendors add items from the app and by menu scripts.

const IMG = (f: string) => `/images/menu-items/${f}`;

// First match wins; patterns run against "name category" lowercased.
const RULES: [RegExp, string][] = [
  [/soup/, "soup.jpg"],
  [/chicken.*biry|biry.*chicken/, "chicken_biryani.jpg"],
  [/biry|pulao|pulav/, "biryani.jpg"],
  [/thali/, "thali.jpg"],
  [/lollipop/, "chicken_drumstick.jpg"],
  [/chicken.*(chilli|chilly|65|crispy)/, "chicken_strips.jpg"],
  [/wings/, "chicken_wings.jpg"],
  [/popcorn/, "chicken_popcorn.jpg"],
  [/mutton|kheema|keema/, "mutton_curry.jpg"],
  [/rassa|tambda|pandhra/, "chicken_curry.jpg"],
  [/egg|anda|omlet|omelette|omlette/, "egg_curry.jpg"],
  [/chicken/, "chicken_curry.jpg"],
  [/paneer.*(tikka|tandoori)/, "paneer_tikka.jpg"],
  [/paneer/, "paneer_dish.jpg"],
  [/momo/, "veg_steam_momos.jpg"],
  [/manchurian/, "manchurian.jpg"],
  [/noodle|chowmein/, "hakka_noodles.jpg"],
  [/fried rice|schezwan rice/, "fried_rice.jpg"],
  [/rice/, "rice_dish.jpg"],
  [/dal|daal/, "dal.jpg"],
  [/roti|chapati|naan|paratha|kulcha|bhakri/, "paratha.jpg"],
  [/pav ?bhaji/, "pav_bhaji.jpg"],
  [/vada ?pav/, "vada_pav.jpg"],
  [/misal/, "misal_pav.jpg"],
  [/dabeli/, "dabeli.jpg"],
  [/samosa/, "samosa.jpg"],
  [/pani ?puri|bhel|chaat|chat\b|sev puri|dahi puri/, "pani_puri.jpg"],
  [/dosa|uttapa|idli/, "dosa.jpg"],
  [/pizza/, "pizza.jpg"],
  [/burger/, "burger.jpg"],
  [/fries/, "fries.jpg"],
  [/pasta/, "pasta.jpg"],
  [/sandwich|grill|toast/, "sandwich.jpg"],
  [/wrap|roll|frankie/, "wrap.jpg"],
  [/mastani/, "mango_mastani.jpg"],
  [/cold coffee/, "cold_coffee.jpg"],
  [/coffee|espresso|cappuccino|latte|tea|chai/, "coffee.jpg"],
  [/shake|lassi|falooda/, "milkshake.jpg"],
  [/mojito/, "mojito.jpg"],
  [/mocktail|soda|cold drink/, "mocktail.jpg"],
  [/juice/, "fruit_juice.jpg"],
  [/gulab ?jamun/, "gulab_jamun.jpg"],
  [/cake|pastry|brownie/, "cake_slice.jpg"],
  [/ice.?cream|sundae|kulfi|cone|dessert|sweet/, "dessert.jpg"],
  [/salad|papad|raita/, "salad.jpg"],
  [/chole/, "chole_bhature.jpg"],
  [/masala|curry|kadhai|handi|kolhapuri|bhaji|sabji|sabzi|kofta|korma|kaju|mushroom|veg/, "veg_curry.jpg"],
];

const GENERIC = "thali.jpg"; // neutral Indian meal photo when nothing matches

export function defaultFoodImage(name: string, category?: string | null): string {
  // Match on the dish name first; fall back to the category only if the name says nothing.
  const find = (t: string) => RULES.find(([re]) => re.test(t.toLowerCase()));
  const hit = find(name) ?? (category ? find(category) : undefined);
  return IMG(hit ? hit[1] : GENERIC);
}
