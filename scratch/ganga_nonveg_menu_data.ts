export interface GangaNonVegItem {
  marathiName: string;
  englishName: string;
  category: string; // e.g. "Nonveg Soup", "Nonveg Starter", "Handi Special", "Nonveg Main Course", "Thali Special", "Sp. Biryani", "Special Platter"
  cardPrice: number;
  finalPrice: number; // cardPrice * 1.15 rounded
  isVeg: boolean;
  description: string;
}

function calcPrice(p: number): number {
  return Math.round(p * 1.15);
}

export const gangaNonVegItems: GangaNonVegItem[] = [
  // ==========================================
  // 1. नॉनव्हेज सूप / Nonveg Soup
  // ==========================================
  {
    marathiName: "चिकन सूप",
    englishName: "Chicken Soup",
    category: "Nonveg Soup",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: false,
    description: "Classic clear nourishing chicken broth soup with tender shredded chicken"
  },
  {
    marathiName: "चिकन मंचाव सूप",
    englishName: "Chicken Manchow Soup",
    category: "Nonveg Soup",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: false,
    description: "Hot & spicy Indo-Chinese chicken soup served with crispy fried noodles"
  },
  {
    marathiName: "चिकन मंच्युरियन सूप",
    englishName: "Chicken Manchurian Soup",
    category: "Nonveg Soup",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: false,
    description: "Flavorsome chicken soup packed with savory chicken meatballs & garlic"
  },
  {
    marathiName: "मटन सूप",
    englishName: "Mutton Soup",
    category: "Nonveg Soup",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: false,
    description: "Traditional rich bone marrow mutton broth slow-simmered with Indian spices"
  },

  // ==========================================
  // 2. नॉनव्हेज स्टार्टर / Nonveg. Starter
  // ==========================================
  {
    marathiName: "चिकन तंदूर हाफ",
    englishName: "Chicken Tandoori (Half)",
    category: "Nonveg Starter",
    cardPrice: 200,
    finalPrice: calcPrice(200), // 230
    isVeg: false,
    description: "Half portion of chicken marinated in yogurt & tandoori spices roasted in clay oven"
  },
  {
    marathiName: "चिकन तंदूर फुल",
    englishName: "Chicken Tandoori (Full)",
    category: "Nonveg Starter",
    cardPrice: 400,
    finalPrice: calcPrice(400), // 460
    isVeg: false,
    description: "Full whole chicken marinated with fragrant spices roasted to juicy perfection in clay oven"
  },
  {
    marathiName: "चिकन लॉलीपॉप हाफ",
    englishName: "Chicken Lollipop (Half)",
    category: "Nonveg Starter",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: false,
    description: "Half plate crispy Indo-Chinese chicken winglets served with fiery schezwan dip"
  },
  {
    marathiName: "चिकन लॉलीपॉप फुल",
    englishName: "Chicken Lollipop (Full)",
    category: "Nonveg Starter",
    cardPrice: 210,
    finalPrice: calcPrice(210), // 242
    isVeg: false,
    description: "Full plate golden crispy fried chicken lollipops served with tangy schezwan sauce"
  },
  {
    marathiName: "चिकन अंगारा कबाब",
    englishName: "Chicken Angara Kabab",
    category: "Nonveg Starter",
    cardPrice: 240,
    finalPrice: calcPrice(240), // 276
    isVeg: false,
    description: "Smoky charcoal-grilled spicy chicken tikka infused with red hot chilli marinade"
  },
  {
    marathiName: "चिकन बंजारा कबाब",
    englishName: "Chicken Banjara Kabab",
    category: "Nonveg Starter",
    cardPrice: 240,
    finalPrice: calcPrice(240), // 276
    isVeg: false,
    description: "Succulent boneless chicken pieces marinated with cumin, coriander & crushed black pepper"
  },
  {
    marathiName: "चिकन हरियाली कबाब",
    englishName: "Chicken Hariyali Kabab",
    category: "Nonveg Starter",
    cardPrice: 240,
    finalPrice: calcPrice(240), // 276
    isVeg: false,
    description: "Juicy chicken chunks coated in vibrant fresh mint, coriander & green chilli paste"
  },
  {
    marathiName: "मटन शिख कबाब",
    englishName: "Mutton Seekh Kabab",
    category: "Nonveg Starter",
    cardPrice: 400,
    finalPrice: calcPrice(400), // 460
    isVeg: false,
    description: "Finely minced tender mutton mixed with aromatic herbs skewered and tandoor-grilled"
  },
  {
    marathiName: "मटन बोटी कबाब",
    englishName: "Mutton Boti Kabab",
    category: "Nonveg Starter",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Boneless bite-sized mutton cubes marinated in rich Indian spices roasted on skewers"
  },
  {
    marathiName: "मटन कोळीवाडा",
    englishName: "Mutton Koliwada",
    category: "Nonveg Starter",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Crispy Mumbai Koliwada style batter-fried spiced tender mutton chunks"
  },
  {
    marathiName: "सुरमई तवा / रवा फ्राय",
    englishName: "Surmai Tawa / Rava Fry",
    category: "Nonveg Starter",
    cardPrice: 350,
    finalPrice: calcPrice(350), // 403
    isVeg: false,
    description: "Fresh Kingfish (Surmai) slice coated with semolina and pan-fried with coastal spices"
  },
  {
    marathiName: "पापलेट तवा / रवा फ्राय",
    englishName: "Paplet Tawa / Rava Fry",
    category: "Nonveg Starter",
    cardPrice: 350,
    finalPrice: calcPrice(350), // 403
    isVeg: false,
    description: "Fresh Pomfret (Paplet) fish marinated in Malvani masala and crisp rava pan-fried"
  },
  {
    marathiName: "रव तवा / रवा फ्राय",
    englishName: "Rohu Fish Tawa / Rava Fry",
    category: "Nonveg Starter",
    cardPrice: 150,
    finalPrice: calcPrice(150), // 173
    isVeg: false,
    description: "Tender Rohu freshwater fish slice seasoned with coastal herbs and fried golden crisp"
  },

  // ==========================================
  // 3. हंडी स्पेशल / Handi Special
  // ==========================================
  {
    marathiName: "चिकन हंडी हाफ",
    englishName: "Chicken Handi (Half)",
    category: "Handi Special",
    cardPrice: 400,
    finalPrice: calcPrice(400), // 460
    isVeg: false,
    description: "Half clay pot traditional chicken slow-cooked in a rich onion-tomato and spice gravy"
  },
  {
    marathiName: "चिकन हंडी फुल",
    englishName: "Chicken Handi (Full)",
    category: "Handi Special",
    cardPrice: 600,
    finalPrice: calcPrice(600), // 690
    isVeg: false,
    description: "Full clay pot hearty chicken cooked with aromatic roasted whole spices & thick gravy"
  },
  {
    marathiName: "चिकन मालवणी हंडी हाफ",
    englishName: "Chicken Malvani Handi (Half)",
    category: "Handi Special",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Half handi authentic Konkani Malvani style chicken with roasted coconut & special masala"
  },
  {
    marathiName: "चिकन मालवणी हंडी फुल",
    englishName: "Chicken Malvani Handi (Full)",
    category: "Handi Special",
    cardPrice: 650,
    finalPrice: calcPrice(650), // 748
    isVeg: false,
    description: "Full handi authentic Konkani style chicken slow-simmered in coconut-based Malvani curry"
  },
  {
    marathiName: "गावराण चिकन हंडी हाफ",
    englishName: "Gavran Chicken Handi (Half)",
    category: "Handi Special",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Half handi country-style Desi Gavran chicken cooked in rustic Maharashtra village spices"
  },
  {
    marathiName: "गावराण चिकन हंडी फुल",
    englishName: "Gavran Chicken Handi (Full)",
    category: "Handi Special",
    cardPrice: 650,
    finalPrice: calcPrice(650), // 748
    isVeg: false,
    description: "Full handi Desi Gavran chicken cooked slow with authentic local spicy rassa gravy"
  },
  {
    marathiName: "गावराण मालवणी हंडी हाफ",
    englishName: "Gavran Malvani Handi (Half)",
    category: "Handi Special",
    cardPrice: 500,
    finalPrice: calcPrice(500), // 575
    isVeg: false,
    description: "Half handi Desi country chicken infused with coastal Malvani coconut and spices"
  },
  {
    marathiName: "गावराण मालवणी हंडी फुल",
    englishName: "Gavran Malvani Handi (Full)",
    category: "Handi Special",
    cardPrice: 750,
    finalPrice: calcPrice(750), // 863
    isVeg: false,
    description: "Full handi Desi Gavran chicken in deeply flavorful coastal Malvani coconut gravy"
  },
  {
    marathiName: "मुर्ग मुसल्लम हाफ",
    englishName: "Murg Mussallam (Half)",
    category: "Handi Special",
    cardPrice: 500,
    finalPrice: calcPrice(500), // 575
    isVeg: false,
    description: "Half chicken royally simmered in rich saffron cashew almond gravy and boiled eggs"
  },
  {
    marathiName: "मुर्ग मुसल्लम फुल",
    englishName: "Murg Mussallam (Full)",
    category: "Handi Special",
    cardPrice: 800,
    finalPrice: calcPrice(800), // 920
    isVeg: false,
    description: "Grand Mughlai royal whole chicken dish prepared with rich creamy spiced nut gravy"
  },
  {
    marathiName: "फिश हंडी हाफ",
    englishName: "Fish Handi (Half)",
    category: "Handi Special",
    cardPrice: 400,
    finalPrice: calcPrice(400), // 460
    isVeg: false,
    description: "Half portion fresh fish simmered in earthen handi with coconut and kokum curry"
  },
  {
    marathiName: "फिश हंडी फुल",
    englishName: "Fish Handi (Full)",
    category: "Handi Special",
    cardPrice: 550,
    finalPrice: calcPrice(550), // 633
    isVeg: false,
    description: "Full handi delicious coastal style fish curry infused with tamarind, coconut & spices"
  },
  {
    marathiName: "मटन हंडी हाफ",
    englishName: "Mutton Handi (Half)",
    category: "Handi Special",
    cardPrice: 500,
    finalPrice: calcPrice(500), // 575
    isVeg: false,
    description: "Half handi succulent tender mutton pieces simmered in spicy traditional rassa"
  },
  {
    marathiName: "मटन हंडी फुल",
    englishName: "Mutton Handi (Full)",
    category: "Handi Special",
    cardPrice: 800,
    finalPrice: calcPrice(800), // 920
    isVeg: false,
    description: "Full handi tender slow-cooked mutton in earthen pot with robust Maharashtrian spices"
  },
  {
    marathiName: "मटन मालवणी हंडी हाफ",
    englishName: "Mutton Malvani Handi (Half)",
    category: "Handi Special",
    cardPrice: 550,
    finalPrice: calcPrice(550), // 633
    isVeg: false,
    description: "Half handi tender mutton simmered in fragrant Konkan style roasted coconut masala"
  },
  {
    marathiName: "मटन मालवणी हंडी फुल",
    englishName: "Mutton Malvani Handi (Full)",
    category: "Handi Special",
    cardPrice: 850,
    finalPrice: calcPrice(850), // 978
    isVeg: false,
    description: "Full handi premium mutton slow-cooked with signature Malvani masala and roasted coconut"
  },

  // ==========================================
  // 4. नॉनव्हेज मेन कोर्स / Nonveg Main Course
  // ==========================================
  {
    marathiName: "चिकन हरा धनिया",
    englishName: "Chicken Hara Dhaniya",
    category: "Nonveg Main Course",
    cardPrice: 260,
    finalPrice: calcPrice(260), // 299
    isVeg: false,
    description: "Tender chicken cooked with loads of fresh coriander leaves, green chillies & mild spices"
  },
  {
    marathiName: "चिकन मुर्गमुसल्लम हाफ",
    englishName: "Chicken Murg Mussallam (Half)",
    category: "Nonveg Main Course",
    cardPrice: 500,
    finalPrice: calcPrice(500), // 575
    isVeg: false,
    description: "Half portion of exquisite Mughlai chicken cooked with rich almond and cashew gravy"
  },
  {
    marathiName: "चिकन मुर्गमुसल्लम फुल",
    englishName: "Chicken Murg Mussallam (Full)",
    category: "Nonveg Main Course",
    cardPrice: 800,
    finalPrice: calcPrice(800), // 920
    isVeg: false,
    description: "Full portion royal chicken cooked with rich nutty gravy and boiled eggs"
  },
  {
    marathiName: "चिकन लबाबदार",
    englishName: "Chicken Lababdar",
    category: "Nonveg Main Course",
    cardPrice: 290,
    finalPrice: calcPrice(290), // 334
    isVeg: false,
    description: "Tender chicken cooked in rich onion-tomato cream gravy with chopped bell peppers"
  },
  {
    marathiName: "चिकन अंगारा मसाला",
    englishName: "Chicken Angara Masala",
    category: "Nonveg Main Course",
    cardPrice: 280,
    finalPrice: calcPrice(280), // 322
    isVeg: false,
    description: "Fiery spicy chicken infused with charcoal smoke and roasted red chilli gravy"
  },
  {
    marathiName: "चिकन बंजाराम मसाला",
    englishName: "Chicken Banjara Masala",
    category: "Nonveg Main Course",
    cardPrice: 280,
    finalPrice: calcPrice(280), // 322
    isVeg: false,
    description: "Spicy rustic tribal style chicken curry bursting with freshly ground whole spices"
  },
  {
    marathiName: "चिकन कस्तुरी",
    englishName: "Chicken Kasturi",
    category: "Nonveg Main Course",
    cardPrice: 260,
    finalPrice: calcPrice(260), // 299
    isVeg: false,
    description: "Chicken curry flavored with aromatic dried fenugreek leaves (kasuri methi) & cream"
  },
  {
    marathiName: "चिकन कढाई",
    englishName: "Chicken Kadhai",
    category: "Nonveg Main Course",
    cardPrice: 260,
    finalPrice: calcPrice(260), // 299
    isVeg: false,
    description: "Chicken tossed in cast iron wok with chunky capsicum, onions and freshly ground kadhai masala"
  },
  {
    marathiName: "चिकन लपेटा",
    englishName: "Chicken Lapeta",
    category: "Nonveg Main Course",
    cardPrice: 295,
    finalPrice: calcPrice(295), // 339
    isVeg: false,
    description: "Chicken wrapped and coated in a thick, mouthwatering spicy masala gravy"
  },
  {
    marathiName: "गावराण चिकन कस्तुरी",
    englishName: "Gavran Chicken Kasturi",
    category: "Nonveg Main Course",
    cardPrice: 300,
    finalPrice: calcPrice(300), // 345
    isVeg: false,
    description: "Desi country chicken prepared with aromatic fenugreek leaves and rich gravy"
  },
  {
    marathiName: "गावराण चिकन करी",
    englishName: "Gavran Chicken Curry",
    category: "Nonveg Main Course",
    cardPrice: 190,
    finalPrice: calcPrice(190), // 219
    isVeg: false,
    description: "Traditional Maharashtrian Desi country chicken curry with flavorful spicy thin rassa"
  },
  {
    marathiName: "गावराण चिकन मसाला",
    englishName: "Gavran Chicken Masala",
    category: "Nonveg Main Course",
    cardPrice: 190,
    finalPrice: calcPrice(190), // 219
    isVeg: false,
    description: "Country chicken cooked in a thick spicy onion, tomato and roasted coconut masala"
  },

  // ==========================================
  // 5. थाळी स्पेशल / Thali Special
  // ==========================================
  {
    marathiName: "स्पे. चिकन थाळी",
    englishName: "Special Chicken Thali",
    category: "Thali Special",
    cardPrice: 300,
    finalPrice: calcPrice(300), // 345
    isVeg: false,
    description: "Chicken sukka/masala, rich chicken rassa, tambda rassa, rotis/bhakari & rice"
  },
  {
    marathiName: "स्पे. गावराण चिकन थाळी",
    englishName: "Special Gavran Chicken Thali",
    category: "Thali Special",
    cardPrice: 400,
    finalPrice: calcPrice(400), // 460
    isVeg: false,
    description: "Authentic Desi Gavran chicken preparation, piping hot village rassa, bhakaris & rice"
  },
  {
    marathiName: "स्पे. मटन थाळी",
    englishName: "Special Mutton Thali",
    category: "Thali Special",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Tender mutton sukka, spicy mutton rassa broth, fresh bhakaris, onions & jeera rice"
  },
  {
    marathiName: "स्पे. अंडा थाळी",
    englishName: "Special Egg Thali",
    category: "Thali Special",
    cardPrice: 200,
    finalPrice: calcPrice(200), // 230
    isVeg: false,
    description: "Boiled egg curry, spiced egg dry/omlette, aromatic rassa, rotis & steamed rice"
  },
  {
    marathiName: "स्पे. सुरमई थाळी",
    englishName: "Special Surmai Thali",
    category: "Thali Special",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Surmai fish fry slice, coastal fish curry rassa, solkadhi, bhakaris & rice"
  },
  {
    marathiName: "स्पे. पापलेट थाळी",
    englishName: "Special Paplet Thali",
    category: "Thali Special",
    cardPrice: 450,
    finalPrice: calcPrice(450), // 518
    isVeg: false,
    description: "Whole Pomfret (Paplet) fry, Malvani fish rassa, solkadhi, fresh bhakari & rice"
  },
  {
    marathiName: "स्पे. रव फिश थाळी",
    englishName: "Special Rohu Fish Thali",
    category: "Thali Special",
    cardPrice: 300,
    finalPrice: calcPrice(300), // 345
    isVeg: false,
    description: "Crispy Rohu fish fry, coconut spiced fish curry rassa, bhakari & steamed rice"
  },
  {
    marathiName: "स्पे. चिलापी थाळी",
    englishName: "Special Chilapi Thali",
    category: "Thali Special",
    cardPrice: 300,
    finalPrice: calcPrice(300), // 345
    isVeg: false,
    description: "Freshwater Chilapi fish fry, authentic local fish curry, hot bhakaris & rice"
  },

  // ==========================================
  // 6. स्पे. बिर्याणी / Sp. Biryani
  // ==========================================
  {
    marathiName: "चिकन दम बिर्याणी",
    englishName: "Chicken Dum Biryani",
    category: "Sp. Biryani",
    cardPrice: 220,
    finalPrice: calcPrice(220), // 253
    isVeg: false,
    description: "Fragrant long grain basmati rice cooked on slow dum with tender marinated chicken and saffron"
  },
  {
    marathiName: "मटन दम बिर्याणी",
    englishName: "Mutton Dum Biryani",
    category: "Sp. Biryani",
    cardPrice: 300,
    finalPrice: calcPrice(300), // 345
    isVeg: false,
    description: "Classic Royal dum biryani prepared with layered basmati rice, tender mutton & aromatic spices"
  },

  // ==========================================
  // 7. स्पेशल प्लॅटर & रान / Special Platter & Raan
  // ==========================================
  {
    marathiName: "चिकन प्लॅटर",
    englishName: "Chicken Platter",
    category: "Special Platter",
    cardPrice: 999,
    finalPrice: calcPrice(999), // 1149
    isVeg: false,
    description: "Grand assortment of Tandoori, Chicken Tikka, Lollipops, Kebabs & dips on a sizzling platter"
  },
  {
    marathiName: "चिकन रान",
    englishName: "Chicken Raan",
    category: "Special Platter",
    cardPrice: 650,
    finalPrice: calcPrice(650), // 748
    isVeg: false,
    description: "Signature whole leg chicken slow-roasted in royal spices until fall-apart tender"
  }
];

console.log(`Prepared ${gangaNonVegItems.length} non-veg items with +15% pricing.`);
