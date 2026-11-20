import { createHash } from "crypto";

// "Local favourites" row on the home screen: a hand-picked list per diet, with the "ordered in the
// last 24 hours" figure supplied by the business. Dishes are referenced by menu item id (checked
// against the live menus); an id that no longer exists or is unavailable is simply left out.
export interface LocalFavourite {
  // One id, or [half, full] for dishes where Add opens a Half / Full picker.
  ids: string[];
  figure: number;
  // One short line shown on the card (most menus have no description of their own).
  description?: string;
  // Minutes after midnight IST between which the dish is shown.
  fromMinute?: number;
  untilMinute?: number;
}

const HALF_FULL = (half: string, full: string) => [half, full];

export const LOCAL_FAVOURITES: Record<"veg" | "non-veg", LocalFavourite[]> = {
  veg: [
    { ids: ["x0b824pwdkjku4y8soa2sdys"], figure: 23, description: "Momos in a crunchy kurkure coating, fried golden" }, // Kurkure Momos Fry · Cafe of joy
    { ids: ["jivtai1p09jjrf47sujuhq1k"], figure: 32, description: "Smoky soya chaap in spicy tandoori masala", fromMinute: 15 * 60, untilMinute: 22 * 60 }, // Tandoori Soya Chap · Surbhi (3 PM – 10 PM)
    { ids: ["j3z6h44segxzisabfao3smzc"], figure: 18, description: "Penne in creamy white sauce, loaded with cheese" }, // White Sauce Cheese Pasta · Cafe of joy
    { ids: ["horyxgs565npsbvx4mealwhk"], figure: 19, description: "Thick, chilled chocolate shake" }, // Cold Chocolate · Aroma cafe
    { ids: ["k7s38swhgx6q5z18svth43j6"], figure: 21, description: "Crispy veg patty with a melted cheese slice" }, // Veg Cheese Burger · Aroma cafe
    { ids: ["xmk08s9bfhyo8mx77z0zvi8u"], figure: 27, description: "Buttery bhaji with soft, toasted pav" }, // Pavbhaji · Abhiruchi Dosa
    { ids: ["gtgnryeft8tfau607qwt9bej"], figure: 17, description: "Rich, warm chocolate drink" }, // Hot Chocolate · Pocket Cafe
    { ids: ["pnu11xlmrmnawgtc9k2dp215"], figure: 17, description: "Cheesy pizza topped with fresh veggies" }, // Veg Cheese Pizza · Suman pure veg
    { ids: ["l3e6a52m13djl4goq4jsnu6o"], figure: 18, description: "Soya chaap in a mild, creamy Afghani marinade" }, // Afghani Soya Chaap · Suman pure veg
    { ids: ["y90euo5590j5ehxr69bljvo4"], figure: 24, description: "Hot, spicy Indo-Chinese soup with crispy noodles" }, // Veg Manchow Soup · Sadguru
    { ids: ["ifw57yewszto6zn0t07wse6t"], figure: 12, description: "Crispy, spicy fried paneer cubes" }, // Paneer 65 · Sadguru
    { ids: ["m4ylofep39i2yysyc9lp76jb"], figure: 20, description: "Long sub roll stuffed with paneer and veggies" }, // Paneer Sub · Aroma cafe
    // From "What Shirur is Ordering" (no bhajis)
    { ids: ["yravcau3vhum9fou2sd0klsi"], figure: 38, description: "Soft, buttery Davangere dosa with potato masala" }, // Loni Masala Spanje Dosa · Davangiri
    { ids: ["belf4hlcqgjayec1mhrynzrb"], figure: 28, description: "Soft idli and crispy wada with sambar & chutney", untilMinute: 13 * 60 }, // Idli Wada Mix · Tumkur (until 1 PM)
    { ids: ["qt5tdkx73mfb4e2wa9plyds0"], figure: 28, description: "Complete meal: sabzi, dal, rice, chapati & more" }, // Veg Thali · Annapurna
    { ids: ["ppkb339cfj7guao65ef44t6r"], figure: 24, description: "Plain, soft Davangere dosa with loni butter" }, // Sadha Loni Dosa · Davangiri
    { ids: ["z5l2rfu8v2n0jemrwzo0dwwj"], figure: 24, description: "Complete meal: sabzi, dal, rice, chapati & more" }, // Veg Thali · Ganga Grand
    { ids: ["bfag2evgyd9ubepturj6hiuk"], figure: 21, description: "Spicy potato wada in pav with chutney" }, // Vada Pav · Sadguru
    { ids: ["cua47cvyl86c7608i7bzfauz"], figure: 9, description: "Full thali with special sabzis, dal, rice & sweet" }, // Special Veg Thali · Swad
    { ids: ["j07zp4h5znyzglkv4kxc12qn"], figure: 9, description: "Crispy dosa with fiery schezwan filling" }, // Schezwan Dosa · Abhiruchi
    { ids: ["gnb3k8vby0tzqllyf0vobc6q"], figure: 14, description: "Veg momos, fried or steamed, with red chutney" }, // Momos (Fried / Steam) · Pocket Cafe
    { ids: ["cnto9x42vsjsczjg9odnj1dw"], figure: 11, description: "Sweet corn and lots of cheese on a crisp base" }, // Corn with Cheese Pizza · Bulls & Trader
    { ids: ["jdx4z3bhzsf9rqx61yad9ano"], figure: 10, description: "Grilled sandwich with veggies and creamy mayo" }, // Veg Mayo Grill · Elite
    // Veg biryanis
    { ids: HALF_FULL("mieokvp1xuolizs7i7l17bh9", "ht1e62gyxp5sn625sw5dnyrf"), figure: 22, description: "Fragrant rice and veggies slow-cooked on dum" }, // Veg Dum Biryani · Annapurna
    { ids: HALF_FULL("nrtzs07a44dive5estyy3azh", "fzjin754rbfx3oyucry7t0wq"), figure: 19, description: "Spiced basmati rice cooked with mixed veggies" }, // Veg Biryani · Swad
    { ids: ["ssvjpg8ukzd96z84tomyl6tv"], figure: 16, description: "Veg biryani slow-cooked in a clay pot" }, // Veg Matka Biryani · Suman
    { ids: ["wzz3ip3ifrok1bz8wpzxsq62"], figure: 15, description: "Hyderabadi-style spicy veg biryani" }, // Veg Hyderabadi Biryani · Sadguru
    { ids: ["a07506jzb4jnkinvlthgchwk"], figure: 13, description: "Biryani with smoky paneer tikka pieces" }, // Paneer Tikka Biryani · Sadguru
    { ids: ["tyl0jhv00t9l062gbhnzlbxn"], figure: 12, description: "Spiced basmati rice cooked with mixed veggies" }, // Veg Biryani · Ganga Grand
    { ids: ["rek27xy3tp2i4k6xjwm5j1fh"], figure: 11, description: "Spiced rice layered with soft paneer" }, // Paneer Biryani · Rassa Bhakri
    { ids: ["jbluttmwlojki6sr3tdkmpbx"], figure: 9, description: "Spiced rice layered with soft paneer" }, // Paneer Biryani · Radhika
    { ids: ["oyjctymdveonazelllkp763v"], figure: 8, description: "Spiced basmati rice cooked with mixed veggies" }, // Veg Biryani · Hotel RK
  ],
  "non-veg": [
    { ids: ["jvciksk9b2i3tmbkxhygwk8f"], figure: 17, description: "Mutton cooked with chana dal, Hyderabadi style" }, // Dalcha Half · Swad
    { ids: ["kj6lbtirkx9u0xyu2yxibird"], figure: 23, description: "Crispy, spicy chicken lollipops" }, // Chicken Lollipop Half · Swad
    { ids: ["uidi5cjoqtnc0vlmvvkk3g9w"], figure: 10, description: "Chicken balls tossed in Manchurian sauce" }, // Chicken Manchurian · Swad
    { ids: ["d5i1se61pzvf2nt6o7i36oyh"], figure: 19, description: "Fish roasted in a spicy masala" }, // Macchi Roast · Swad
    { ids: ["p3bnsi3jdogg8biydj7qritj"], figure: 12, description: "Juicy leg piece in a creamy Afghani marinade" }, // Afghani Leg Piece · Nikhara
    { ids: HALF_FULL("c3k1bnlk3vf5b1nnnesvaqc2", "b3aoesubxtjo2nsoo9vf1eq8"), figure: 15, description: "Chicken in bold, spicy barra masala, from the tandoor" }, // Chicken Barra Tandoori · Nikhara
    { ids: HALF_FULL("cl8qhskcef721hx4dbgaeed2", "hiusxjwqusurz9e9gt6a9wqd"), figure: 28, description: "Tandoori chicken in a rich Mumtaz-style marinade" }, // Chicken Mumtaz Tandoori · Nikhara
    { ids: ["jwihvzbdkls0kj8e0gj33s48"], figure: 16, description: "Spicy chicken filling rolled in a soft paratha" }, // Chicken Roll · Tiranga
    { ids: ["orfbshn1qr6tygcqjx40mdh6"], figure: 12, description: "Crispy samosa with spiced chicken filling" }, // Chicken Samosa · Tiranga
    { ids: HALF_FULL("lyjraprpfgzpy1sqgc5isv8i", "sfonlir2f4bt5w40caupaka9"), figure: 9, description: "Crispy fried chicken drumsticks" }, // Chicken Drumstick · Tiranga
    { ids: ["es0c53nm9bk74mgeaqztrb8l"], figure: 12, description: "Crunchy fried chicken wings, classic seasoning" }, // Crispy Wings Classic · Chicken Affair
    { ids: ["l5lzus631mz7sb2qxi6lpepo"], figure: 8, description: "Crispy fried chicken, KFC style" }, // Chicken KFC · Tiranga (one size on the menu)
    { ids: ["oerlq7dy6tv44ll1yawxl68g"], figure: 21, description: "Rohu fish, tawa or rava fried, crisp and spicy" }, // Rohu Fish Tawa / Rava Fry · Ganga Grand
    { ids: ["kkcbbkz5cva4i3eiho5nn09w"], figure: 12, description: "Spicy, smoky chicken kabab, Banjara style" }, // Chicken Banjara Kabab · Ganga Grand
    // Biryanis, one per biryani house
    { ids: HALF_FULL("udcxhiuh49oamu9wcjebk3p4", "p3yvdxjksnje3oh75z779q82"), figure: 26, description: "Spiced rice layered with tender chicken" }, // Chicken Biryani · Yash Biryani
    { ids: HALF_FULL("m3semfvao3145svuucyv7hol", "purn2ipt89zjbdgmuvy7u8o7"), figure: 24, description: "Hyderabadi-style spicy chicken biryani" }, // Chicken Hyderabadi Biryani · Swad
    { ids: ["rgawr17v2vbhwm9mnk9pxti5"], figure: 22, description: "Hyderabadi chicken biryani slow-cooked on dum" }, // Chicken Hyderabadi Dum Biryani · Nikhara
    { ids: ["v8875pgomcycgb0yj7ijgb82"], figure: 20, description: "Spiced rice layered with tender chicken" }, // Chicken Biryani · Rassa Bhakri
    { ids: HALF_FULL("gnzr2ho00dsuf93gonl1qpg3", "sdm5il4yuybli4ayt4b5ory1"), figure: 18, description: "Spiced rice layered with tender chicken" }, // Chicken Biryani · Annapurna
    { ids: ["ij3hustgw5myyk52ffn6rgx1"], figure: 17, description: "Chicken and rice slow-cooked on dum" }, // Chicken Dum Biryani · Tiranga
    { ids: ["xkwjced4g42ipl4tthe8hbus"], figure: 15, description: "Chicken and rice slow-cooked on dum" }, // Chicken Dum Biryani · Ganga Grand
    { ids: ["sciy49ioob1asepalj2lst1s"], figure: 14, description: "House special chicken dum biryani" }, // Spl. Chicken Dum Biryani · Radhika
    { ids: ["z6i4ktk85rjwiw83fiqixzgb"], figure: 11, description: "Biryani made with country (gavran) chicken" }, // Chicken Biryani (Gavran) · Hotel RK
  ],
};

// Figure of every listed dish by id (the half portion carries it for Half / Full dishes).
export const LOCAL_FAVOURITE_FIGURES = new Map<string, number>(
  [...LOCAL_FAVOURITES.veg, ...LOCAL_FAVOURITES["non-veg"]].map((fav) => [fav.ids[0], fav.figure]),
);

// Share of the listed figure shown at each time of day (IST): low in the morning, medium in the
// afternoon, the full listed figure in the evening. Straight lines between these points; after
// 9 PM it eases back down overnight so the next morning starts low again.
const DAY_CURVE: [minute: number, share: number][] = [
  [0, 0.85],
  [6 * 60, 0.3],   // 6 AM
  [9 * 60, 0.35],  // 9 AM
  [12 * 60, 0.5],  // noon
  [15 * 60, 0.65], // 3 PM
  [18 * 60, 0.85], // 6 PM
  [20 * 60, 1],    // 8 PM: the listed figure
  [21 * 60, 1],    // 9 PM
  [24 * 60, 0.85],
];

export function dayShare(now: Date = new Date()): number {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const minute = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  for (let i = 1; i < DAY_CURVE.length; i++) {
    const [m1, s1] = DAY_CURVE[i];
    if (minute <= m1) {
      const [m0, s0] = DAY_CURVE[i - 1];
      return s0 + ((s1 - s0) * (minute - m0)) / (m1 - m0);
    }
  }
  return DAY_CURVE[DAY_CURVE.length - 1][1];
}

// Order counters move all day: the listed figure is scaled by the time of day (see DAY_CURVE),
// and every 3 minutes each dish shifts by -1 … +2 around that, differently per dish, so the
// rows never look frozen. Never below 1, never above the listed figure.
export function liveFigure(id: string, figure: number, now: Date = new Date()): number {
  if (figure <= 0) return 0;
  const slot = Math.floor(now.getTime() / (3 * 60 * 1000));
  const shift = (createHash("sha256").update(`${slot}:${id}`).digest().readUInt32BE(0) % 4) - 1;
  return Math.min(figure, Math.max(1, Math.round(figure * dayShare(now)) + shift));
}

// "Chicken Barra Tandoori (Half)" -> "Chicken Barra Tandoori"; "Veg Biryani Half" -> "Veg Biryani".
export const withoutPortion = (name: string) =>
  name.replace(/\s*\(?\b(half|full)\b\)?\s*$/i, "").trim();
