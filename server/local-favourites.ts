import { createHash } from "crypto";

// "Local favourites" row on the home screen: a hand-picked list per diet, with the "ordered in the
// last 24 hours" figure supplied by the business. Dishes are referenced by menu item id (checked
// against the live menus); an id that no longer exists or is unavailable is simply left out.
export interface LocalFavourite {
  // One id, or [half, full] for dishes where Add opens a Half / Full picker.
  ids: string[];
  figure: number;
  // Minutes after midnight IST between which the dish is shown.
  fromMinute?: number;
  untilMinute?: number;
}

const HALF_FULL = (half: string, full: string) => [half, full];

export const LOCAL_FAVOURITES: Record<"veg" | "non-veg", LocalFavourite[]> = {
  veg: [
    { ids: ["x0b824pwdkjku4y8soa2sdys"], figure: 23 }, // Kurkure Momos Fry · Cafe of joy
    { ids: ["jivtai1p09jjrf47sujuhq1k"], figure: 32, fromMinute: 15 * 60, untilMinute: 22 * 60 }, // Tandoori Soya Chap · Surbhi (3 PM – 10 PM)
    { ids: ["j3z6h44segxzisabfao3smzc"], figure: 18 }, // White Sauce Cheese Pasta · Cafe of joy
    { ids: ["horyxgs565npsbvx4mealwhk"], figure: 19 }, // Cold Chocolate · Aroma cafe
    { ids: ["k7s38swhgx6q5z18svth43j6"], figure: 21 }, // Veg Cheese Burger · Aroma cafe
    { ids: ["xmk08s9bfhyo8mx77z0zvi8u"], figure: 27 }, // Pavbhaji · Abhiruchi Dosa
    { ids: ["gtgnryeft8tfau607qwt9bej"], figure: 17 }, // Hot Chocolate · Pocket Cafe
    { ids: ["pnu11xlmrmnawgtc9k2dp215"], figure: 17 }, // Veg Cheese Pizza · Suman pure veg
    { ids: ["l3e6a52m13djl4goq4jsnu6o"], figure: 18 }, // Afghani Soya Chaap · Suman pure veg
    { ids: ["y90euo5590j5ehxr69bljvo4"], figure: 24 }, // Veg Manchow Soup · Sadguru
    { ids: ["ifw57yewszto6zn0t07wse6t"], figure: 12 }, // Paneer 65 · Sadguru
    { ids: ["m4ylofep39i2yysyc9lp76jb"], figure: 20 }, // Paneer Sub · Aroma cafe
    // From "What Shirur is Ordering" (no bhajis)
    { ids: ["yravcau3vhum9fou2sd0klsi"], figure: 38 }, // Loni Masala Spanje Dosa · Davangiri
    { ids: ["belf4hlcqgjayec1mhrynzrb"], figure: 28, untilMinute: 13 * 60 }, // Idli Wada Mix · Tumkur (until 1 PM)
    { ids: ["qt5tdkx73mfb4e2wa9plyds0"], figure: 28 }, // Veg Thali · Annapurna
    { ids: ["ppkb339cfj7guao65ef44t6r"], figure: 24 }, // Sadha Loni Dosa · Davangiri
    { ids: ["z5l2rfu8v2n0jemrwzo0dwwj"], figure: 24 }, // Veg Thali · Ganga Grand
    { ids: ["bfag2evgyd9ubepturj6hiuk"], figure: 21 }, // Vada Pav · Sadguru
    { ids: ["cua47cvyl86c7608i7bzfauz"], figure: 9 }, // Special Veg Thali · Swad
    { ids: ["j07zp4h5znyzglkv4kxc12qn"], figure: 9 }, // Schezwan Dosa · Abhiruchi
    { ids: ["gnb3k8vby0tzqllyf0vobc6q"], figure: 14 }, // Momos (Fried / Steam) · Pocket Cafe
    { ids: ["cnto9x42vsjsczjg9odnj1dw"], figure: 11 }, // Corn with Cheese Pizza · Bulls & Trader
    { ids: ["jdx4z3bhzsf9rqx61yad9ano"], figure: 10 }, // Veg Mayo Grill · Elite
    // Veg biryanis
    { ids: HALF_FULL("mieokvp1xuolizs7i7l17bh9", "ht1e62gyxp5sn625sw5dnyrf"), figure: 22 }, // Veg Dum Biryani · Annapurna
    { ids: HALF_FULL("nrtzs07a44dive5estyy3azh", "fzjin754rbfx3oyucry7t0wq"), figure: 19 }, // Veg Biryani · Swad
    { ids: ["ssvjpg8ukzd96z84tomyl6tv"], figure: 16 }, // Veg Matka Biryani · Suman
    { ids: ["wzz3ip3ifrok1bz8wpzxsq62"], figure: 15 }, // Veg Hyderabadi Biryani · Sadguru
    { ids: ["a07506jzb4jnkinvlthgchwk"], figure: 13 }, // Paneer Tikka Biryani · Sadguru
    { ids: ["tyl0jhv00t9l062gbhnzlbxn"], figure: 12 }, // Veg Biryani · Ganga Grand
    { ids: ["rek27xy3tp2i4k6xjwm5j1fh"], figure: 11 }, // Paneer Biryani · Rassa Bhakri
    { ids: ["jbluttmwlojki6sr3tdkmpbx"], figure: 9 }, // Paneer Biryani · Radhika
    { ids: ["oyjctymdveonazelllkp763v"], figure: 8 }, // Veg Biryani · Hotel RK
  ],
  "non-veg": [
    { ids: ["jvciksk9b2i3tmbkxhygwk8f"], figure: 17 }, // Dalcha Half · Swad
    { ids: ["kj6lbtirkx9u0xyu2yxibird"], figure: 23 }, // Chicken Lollipop Half · Swad
    { ids: ["uidi5cjoqtnc0vlmvvkk3g9w"], figure: 10 }, // Chicken Manchurian · Swad
    { ids: ["d5i1se61pzvf2nt6o7i36oyh"], figure: 19 }, // Macchi Roast · Swad
    { ids: ["p3bnsi3jdogg8biydj7qritj"], figure: 12 }, // Afghani Leg Piece · Nikhara
    { ids: HALF_FULL("c3k1bnlk3vf5b1nnnesvaqc2", "b3aoesubxtjo2nsoo9vf1eq8"), figure: 15 }, // Chicken Barra Tandoori · Nikhara
    { ids: HALF_FULL("cl8qhskcef721hx4dbgaeed2", "hiusxjwqusurz9e9gt6a9wqd"), figure: 28 }, // Chicken Mumtaz Tandoori · Nikhara
    { ids: ["jwihvzbdkls0kj8e0gj33s48"], figure: 16 }, // Chicken Roll · Tiranga
    { ids: ["orfbshn1qr6tygcqjx40mdh6"], figure: 12 }, // Chicken Samosa · Tiranga
    { ids: HALF_FULL("lyjraprpfgzpy1sqgc5isv8i", "sfonlir2f4bt5w40caupaka9"), figure: 9 }, // Chicken Drumstick · Tiranga
    { ids: ["es0c53nm9bk74mgeaqztrb8l"], figure: 12 }, // Crispy Wings Classic · Chicken Affair
    { ids: ["l5lzus631mz7sb2qxi6lpepo"], figure: 8 }, // Chicken KFC · Tiranga (one size on the menu)
    { ids: ["oerlq7dy6tv44ll1yawxl68g"], figure: 21 }, // Rohu Fish Tawa / Rava Fry · Ganga Grand
    { ids: ["kkcbbkz5cva4i3eiho5nn09w"], figure: 12 }, // Chicken Banjara Kabab · Ganga Grand
    // Biryanis, one per biryani house
    { ids: HALF_FULL("udcxhiuh49oamu9wcjebk3p4", "p3yvdxjksnje3oh75z779q82"), figure: 26 }, // Chicken Biryani · Yash Biryani
    { ids: HALF_FULL("m3semfvao3145svuucyv7hol", "purn2ipt89zjbdgmuvy7u8o7"), figure: 24 }, // Chicken Hyderabadi Biryani · Swad
    { ids: ["rgawr17v2vbhwm9mnk9pxti5"], figure: 22 }, // Chicken Hyderabadi Dum Biryani · Nikhara
    { ids: ["v8875pgomcycgb0yj7ijgb82"], figure: 20 }, // Chicken Biryani · Rassa Bhakri
    { ids: HALF_FULL("gnzr2ho00dsuf93gonl1qpg3", "sdm5il4yuybli4ayt4b5ory1"), figure: 18 }, // Chicken Biryani · Annapurna
    { ids: ["ij3hustgw5myyk52ffn6rgx1"], figure: 17 }, // Chicken Dum Biryani · Tiranga
    { ids: ["xkwjced4g42ipl4tthe8hbus"], figure: 15 }, // Chicken Dum Biryani · Ganga Grand
    { ids: ["sciy49ioob1asepalj2lst1s"], figure: 14 }, // Spl. Chicken Dum Biryani · Radhika
    { ids: ["z6i4ktk85rjwiw83fiqixzgb"], figure: 11 }, // Chicken Biryani (Gavran) · Hotel RK
  ],
};

// Figure of every listed dish by id (the half portion carries it for Half / Full dishes).
export const LOCAL_FAVOURITE_FIGURES = new Map<string, number>(
  [...LOCAL_FAVOURITES.veg, ...LOCAL_FAVOURITES["non-veg"]].map((fav) => [fav.ids[0], fav.figure]),
);

// Order counters move all day: every 3 minutes each dish's figure shifts by -2 … +3 around the
// supplied number (never below 1), differently per dish, so the rows never look frozen.
export function liveFigure(id: string, figure: number, now: Date = new Date()): number {
  if (figure <= 0) return 0;
  const slot = Math.floor(now.getTime() / (3 * 60 * 1000));
  const shift = (createHash("sha256").update(`${slot}:${id}`).digest().readUInt32BE(0) % 6) - 2;
  return Math.max(1, figure + shift);
}

// "Chicken Barra Tandoori (Half)" -> "Chicken Barra Tandoori"; "Veg Biryani Half" -> "Veg Biryani".
export const withoutPortion = (name: string) =>
  name.replace(/\s*\(?\b(half|full)\b\)?\s*$/i, "").trim();
