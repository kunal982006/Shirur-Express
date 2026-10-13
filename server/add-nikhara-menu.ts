import 'dotenv/config';
import { db } from "./db";
import { restaurantMenuItems, serviceProviders } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

interface MenuItemDef {
  name: string;
  category: string;
  price: string;
  isVeg: boolean;
  description?: string;
  imageUrl?: string;
}

const menuItems: MenuItemDef[] = [
  // ==========================================
  // MANDI RICE (MUTTON) (Non-Veg)
  // ==========================================
  { name: "Mutton Juicy Mandi (1 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "420", isVeg: false, description: "Tender juicy mutton pieces served over aromatic spiced mandi rice for 1 person" },
  { name: "Mutton Juicy Mandi (2 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "690", isVeg: false, description: "Succulent mutton mandi rice platter designed for 2 persons" },
  { name: "Mutton Juicy Mandi (3 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "930", isVeg: false, description: "Rich juicy mutton mandi platter for 3 persons" },
  { name: "Mutton Juicy Mandi (4 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1270", isVeg: false, description: "Generous mutton juicy mandi feast for 4 persons" },
  { name: "Mutton Juicy Mandi (Family Pack)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1580", isVeg: false, description: "Grand family size juicy mutton mandi feast" },
  { name: "Mutton Juicy Mandi (Extra Piece)", category: "Mandi Rice - Mutton (Non-Veg)", price: "210", isVeg: false, description: "Extra piece of succulent juicy mutton" },

  { name: "Mutton Fry Mandi (1 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "410", isVeg: false, description: "Crisp fried spiced mutton served with traditional mandi rice for 1 person" },
  { name: "Mutton Fry Mandi (2 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "670", isVeg: false, description: "Mutton fry mandi platter portion for 2 persons" },
  { name: "Mutton Fry Mandi (3 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "910", isVeg: false, description: "Flavorful fried mutton mandi platter for 3 persons" },
  { name: "Mutton Fry Mandi (4 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1250", isVeg: false, description: "Delightful fried mutton mandi feast for 4 persons" },
  { name: "Mutton Fry Mandi (Family Pack)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1560", isVeg: false, description: "Mutton fry mandi family pack feast" },
  { name: "Mutton Fry Mandi (Extra Piece)", category: "Mandi Rice - Mutton (Non-Veg)", price: "200", isVeg: false, description: "Extra piece of fried spiced mutton" },

  { name: "Mutton Afghani Mandi (2 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "780", isVeg: false, description: "Mild creamy Afghani mutton infused mandi rice for 2 persons" },
  { name: "Mutton Afghani Mandi (3 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1270", isVeg: false, description: "Afghani spiced mutton mandi platter for 3 persons" },
  { name: "Mutton Afghani Mandi (4 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1550", isVeg: false, description: "Rich royal Afghani mutton mandi for 4 persons" },
  { name: "Mutton Afghani Mandi (Extra Piece)", category: "Mandi Rice - Mutton (Non-Veg)", price: "290", isVeg: false, description: "Extra piece of creamy Afghani mutton" },

  { name: "Mutton Marag Mandi (1 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "450", isVeg: false, description: "Hyderabadi spiced mutton broth marag flavored mandi for 1 person" },
  { name: "Mutton Marag Mandi (2 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "710", isVeg: false, description: "Rich mutton marag mandi platter for 2 persons" },
  { name: "Mutton Marag Mandi (3 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1000", isVeg: false, description: "Aromatic mutton marag mandi platter for 3 persons" },
  { name: "Mutton Marag Mandi (4 Person)", category: "Mandi Rice - Mutton (Non-Veg)", price: "1350", isVeg: false, description: "Delicious mutton marag mandi feast for 4 persons" },
  { name: "Mutton Marag Mandi (Extra Piece)", category: "Mandi Rice - Mutton (Non-Veg)", price: "250", isVeg: false, description: "Extra piece of mutton marag" },

  // ==========================================
  // MIX MANDI (Non-Veg)
  // ==========================================
  { name: "Nikhara Platter Mandi (6 Person)", category: "Mix Mandi Platters (Non-Veg)", price: "2350", isVeg: false, description: "1 Pc Mutton Juicy, 1 Pc Mutton Fry, 1 Pc Al Faham, 1 Pc Chicken Fry, 1 Pc Chicken Tandoori, 25 Pcs Kebabs, Mumtaz and Barra Tandoori" },
  { name: "Nikhara Platter Mandi (3 Person)", category: "Mix Mandi Platters (Non-Veg)", price: "1500", isVeg: false, description: "1 Pc Mutton Fry, 1 Pc Al Faham, 1 Pc Chicken Fry, 14 Pcs Kebabs, Mumtaz and Barra Tandoori" },

  // ==========================================
  // MANDI RICE (CHICKEN) (Non-Veg)
  // ==========================================
  { name: "Chicken Fry Mandi (1 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "320", isVeg: false, description: "Crispy spiced fried chicken served over long grain mandi rice for 1 person" },
  { name: "Chicken Fry Mandi (2 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "530", isVeg: false, description: "Chicken fry mandi platter for 2 persons" },
  { name: "Chicken Fry Mandi (3 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "780", isVeg: false, description: "Chicken fry mandi platter for 3 persons" },
  { name: "Chicken Fry Mandi (4 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "960", isVeg: false, description: "Hearty chicken fry mandi feast for 4 persons" },
  { name: "Chicken Fry Mandi (Family Pack)", category: "Mandi Rice - Chicken (Non-Veg)", price: "1150", isVeg: false, description: "Family pack chicken fry mandi with generous rice & chicken" },
  { name: "Chicken Fry Mandi (Extra Piece)", category: "Mandi Rice - Chicken (Non-Veg)", price: "150", isVeg: false, description: "Extra piece of fried chicken" },
  { name: "Chicken Fry Mandi (Extra Chest Piece)", category: "Mandi Rice - Chicken (Non-Veg)", price: "160", isVeg: false, description: "Extra piece of juicy chicken chest" },

  { name: "Chicken Tandoori Mandi (1 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "320", isVeg: false, description: "Clay-oven smoked tandoori chicken on fragrant mandi rice for 1 person" },
  { name: "Chicken Tandoori Mandi (2 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "530", isVeg: false, description: "Chicken tandoori mandi platter for 2 persons" },
  { name: "Chicken Tandoori Mandi (3 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "780", isVeg: false, description: "Smoky tandoori chicken mandi platter for 3 persons" },
  { name: "Chicken Tandoori Mandi (4 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "960", isVeg: false, description: "Full tandoori chicken mandi feast for 4 persons" },
  { name: "Chicken Tandoori Mandi (Family Pack)", category: "Mandi Rice - Chicken (Non-Veg)", price: "1150", isVeg: false, description: "Chicken tandoori mandi family pack feast" },
  { name: "Chicken Tandoori Mandi (Extra Piece)", category: "Mandi Rice - Chicken (Non-Veg)", price: "150", isVeg: false, description: "Extra piece of tandoori chicken" },
  { name: "Chicken Tandoori Mandi (Extra Chest Piece)", category: "Mandi Rice - Chicken (Non-Veg)", price: "160", isVeg: false, description: "Extra chest piece of tandoori chicken" },

  { name: "Chicken Al-Faham Mandi (1 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "340", isVeg: false, description: "Charcoal grilled Arabian Al-Faham chicken on seasoned mandi rice for 1 person" },
  { name: "Chicken Al-Faham Mandi (2 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "550", isVeg: false, description: "Arabian Al-Faham chicken mandi platter for 2 persons" },
  { name: "Chicken Al-Faham Mandi (3 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "810", isVeg: false, description: "Arabian Al-Faham chicken mandi platter for 3 persons" },
  { name: "Chicken Al-Faham Mandi (4 Person)", category: "Mandi Rice - Chicken (Non-Veg)", price: "990", isVeg: false, description: "Arabian Al-Faham chicken mandi feast for 4 persons" },
  { name: "Chicken Al-Faham Mandi (Family Pack)", category: "Mandi Rice - Chicken (Non-Veg)", price: "1180", isVeg: false, description: "Arabian Al-Faham chicken mandi family pack feast" },
  { name: "Chicken Al-Faham Mandi (Extra Piece)", category: "Mandi Rice - Chicken (Non-Veg)", price: "170", isVeg: false, description: "Extra piece of smoky Al-Faham chicken" },

  // ==========================================
  // KEPSA RICE (Non-Veg)
  // ==========================================
  { name: "Chicken Kepsa Rice - Indian (Half)", category: "Kepsa Rice (Non-Veg)", price: "500", isVeg: false, description: "Indian spiced rich chicken kepsa rice (Half portion)" },
  { name: "Chicken Kepsa Rice - Indian (Full)", category: "Kepsa Rice (Non-Veg)", price: "900", isVeg: false, description: "Indian spiced rich chicken kepsa rice (Full portion)" },
  { name: "Chicken Kepsa Rice - Chinese (Half)", category: "Kepsa Rice (Non-Veg)", price: "600", isVeg: false, description: "Indo-Chinese fusion chicken kepsa rice with gravy & crunch (Half)" },
  { name: "Chicken Kepsa Rice - Chinese (Full)", category: "Kepsa Rice (Non-Veg)", price: "1000", isVeg: false, description: "Indo-Chinese fusion chicken kepsa rice with gravy & crunch (Full)" },

  // ==========================================
  // NIKHARA SPECIALITY (Non-Veg)
  // ==========================================
  { name: "Chicken Dum Biryani", category: "Nikhara Speciality (Non-Veg)", price: "200", isVeg: false, imageUrl: "/images/menu-items/chicken_biryani.jpg", description: "Authentic dum cooked chicken biryani with spiced rice and tender chicken" },
  { name: "Chicken Hyderabadi Dum Biryani", category: "Nikhara Speciality (Non-Veg)", price: "250", isVeg: false, imageUrl: "/images/menu-items/chicken_biryani.jpg", description: "Spicy Hyderabadi style slow cooked chicken dum biryani" },
  { name: "Chicken Lucknowi Dum Biryani (Mild)", category: "Nikhara Speciality (Non-Veg)", price: "180", isVeg: false, imageUrl: "/images/menu-items/chicken_biryani.jpg", description: "Delicately spiced mild aromatic Awadhi Lucknowi dum biryani" },
  { name: "Special Hyderabadi Mutton Dum Biryani", category: "Nikhara Speciality (Non-Veg)", price: "500", isVeg: false, imageUrl: "/images/menu-items/biryani.jpg", description: "Rich and royal dum biryani cooked with marinated tender mutton" },
  { name: "Mutton Dalcha Only", category: "Nikhara Speciality (Non-Veg)", price: "350", isVeg: false, description: "Slow-cooked lentil and mutton gravy stewed with aromatic spices" },
  { name: "Mutton Dalcha Khana (Dalcha + Bagara Rice)", category: "Nikhara Speciality (Non-Veg)", price: "500", isVeg: false, description: "Traditional Hyderabadi meal combo of mutton dalcha served with bagara rice" },
  { name: "Chicken Raan (1 - 1.25 Kg)", category: "Nikhara Speciality (Non-Veg)", price: "600", isVeg: false, description: "Whole roasted chicken leg quarter feast marinated in secret spices (1 - 1.25 Kg)" },
  { name: "Mutton Raan (1 - 1.25 Kg)", category: "Nikhara Speciality (Non-Veg)", price: "1600", isVeg: false, description: "Mughlai style slow-cooked tender whole mutton raan leg (1 - 1.25 Kg)" },
  { name: "Arabian Mutton Raan Mandi (4-5 Persons)", category: "Nikhara Speciality (Non-Veg)", price: "2400", isVeg: false, description: "Grand Arabian platter of whole mutton raan served over mandi rice (Serves 4-5)" },

  // ==========================================
  // CHICKEN TANDOORI STARTERS (Non-Veg)
  // ==========================================
  { name: "Chicken Al-Faham", category: "Chicken Tandoori Starters (Non-Veg)", price: "550", isVeg: false, description: "Arabian spiced flame-grilled whole Al-Faham chicken" },
  { name: "Chicken Tandoori (Half)", category: "Chicken Tandoori Starters (Non-Veg)", price: "270", isVeg: false, description: "Classic yoghurt and tandoori masala marinated chicken (Half)" },
  { name: "Chicken Tandoori (Full)", category: "Chicken Tandoori Starters (Non-Veg)", price: "500", isVeg: false, description: "Classic yoghurt and tandoori masala marinated chicken (Full)" },
  { name: "Chicken Barra Tandoori (Half)", category: "Chicken Tandoori Starters (Non-Veg)", price: "290", isVeg: false, description: "Robust spiced chargrilled chicken barra starter (Half)" },
  { name: "Chicken Barra Tandoori (Full)", category: "Chicken Tandoori Starters (Non-Veg)", price: "520", isVeg: false, description: "Robust spiced chargrilled chicken barra starter (Full)" },
  { name: "Chicken Mumtaz Tandoori (Half)", category: "Chicken Tandoori Starters (Non-Veg)", price: "290", isVeg: false, description: "Rich royal tandoori preparation with exotic spices (Half)" },
  { name: "Chicken Mumtaz Tandoori (Full)", category: "Chicken Tandoori Starters (Non-Veg)", price: "520", isVeg: false, description: "Rich royal tandoori preparation with exotic spices (Full)" },
  { name: "Chicken Afghani Tandoori (Half)", category: "Chicken Tandoori Starters (Non-Veg)", price: "320", isVeg: false, description: "Creamy cashew and cheese marinade roasted chicken (Half)" },
  { name: "Chicken Afghani Tandoori (Full)", category: "Chicken Tandoori Starters (Non-Veg)", price: "600", isVeg: false, description: "Creamy cashew and cheese marinade roasted chicken (Full)" },
  { name: "Nikhara Special Chicken Tandoori (Half)", category: "Chicken Tandoori Starters (Non-Veg)", price: "380", isVeg: false, description: "Chef's signature double-marinated special tandoori chicken (Half)" },
  { name: "Nikhara Special Chicken Tandoori (Full)", category: "Chicken Tandoori Starters (Non-Veg)", price: "700", isVeg: false, description: "Chef's signature double-marinated special tandoori chicken (Full)" },
  { name: "Afghani Leg Piece (1 Piece)", category: "Chicken Tandoori Starters (Non-Veg)", price: "160", isVeg: false, description: "Juicy chicken leg piece roasted in rich creamy Afghani masala" },
  { name: "Mix Tandoori Chicken Platter (Half / 4 Persons)", category: "Chicken Tandoori Starters (Non-Veg)", price: "1250", isVeg: false, description: "Assortment of chef's finest tandoori chicken starters (Serves 4)" },
  { name: "Mix Tandoori Chicken Platter (Full / 8 Persons)", category: "Chicken Tandoori Starters (Non-Veg)", price: "2500", isVeg: false, description: "Grand mega tandoori starter platter (Serves 8)" },

  // ==========================================
  // KEBABS (Non-Veg)
  // ==========================================
  { name: "Chicken Tikka Kebab", category: "Kebabs (Non-Veg)", price: "260", isVeg: false, description: "Boneless chicken chunks marinated in fiery tandoori spices and skewered" },
  { name: "Chicken Barra Kebab", category: "Kebabs (Non-Veg)", price: "300", isVeg: false, description: "Peppery smokey chargrilled chicken kebab" },
  { name: "Chicken Banjara Kebab", category: "Kebabs (Non-Veg)", price: "320", isVeg: false, description: "Flavored with fresh cilantro, mint and rustic roasted spices" },
  { name: "Chicken Reshmi Kebab", category: "Kebabs (Non-Veg)", price: "220", isVeg: false, description: "Silky melt-in-mouth chicken kebab cooked with cream and egg white" },
  { name: "Chicken Dahi Lasuni Kebab", category: "Kebabs (Non-Veg)", price: "320", isVeg: false, description: "Hung curd and roasted garlic infused succulent chicken kebab" },
  { name: "Chicken Malai Kebab", category: "Kebabs (Non-Veg)", price: "300", isVeg: false, description: "Creamy mild chicken kebabs marinated in cream and cheese" },
  { name: "Chicken Afghani Kebab", category: "Kebabs (Non-Veg)", price: "340", isVeg: false, description: "Rich, mildly spiced cashew and saffron flavored chicken kebab" },
  { name: "Chicken Singapuri Kebab", category: "Kebabs (Non-Veg)", price: "320", isVeg: false, description: "Zesty sweet & spicy Asian spiced grilled chicken kebabs" },
  { name: "Chicken Malaysian Kebab", category: "Kebabs (Non-Veg)", price: "320", isVeg: false, description: "Exotic Malaysian spice marinated skewered chicken kebab" },
  { name: "Chicken Seekh Kebab", category: "Kebabs (Non-Veg)", price: "320", isVeg: false, description: "Minced chicken blended with herbs, skewered and tandoor-roasted" },
  { name: "Chicken Lucknowi Seekh Kebab", category: "Kebabs (Non-Veg)", price: "320", isVeg: false, description: "Awadhi style delicate seasoned minced chicken seekh kebab" },
  { name: "Chicken Rimzim Seekh Kebab", category: "Kebabs (Non-Veg)", price: "350", isVeg: false, description: "Chef's special colorful spiced seekh kebab with bell peppers" },
  { name: "Mutton Seekh Kebab", category: "Kebabs (Non-Veg)", price: "450", isVeg: false, description: "Finely minced seasoned mutton rolled on skewers and grilled" },
  { name: "Mutton Turki Kebab", category: "Kebabs (Non-Veg)", price: "400", isVeg: false, description: "Turkish style sumac and herb spiced grilled mutton kebab" },
  { name: "Mutton Juicy Kebab", category: "Kebabs (Non-Veg)", price: "450", isVeg: false, description: "Ultra succulent hand-beaten mutton kebabs bursting with flavour" },

  // ==========================================
  // CHINESE STARTERS (Non-Veg)
  // ==========================================
  { name: "Chicken Teriyaki", category: "Chinese Starters (Non-Veg)", price: "360", isVeg: false, description: "Glossy sweet-savory Japanese teriyaki sauce glazed chicken starter" },
  { name: "Chicken 89 (Dry)", category: "Chinese Starters (Non-Veg)", price: "300", isVeg: false, description: "Special spicy wok-tossed chicken dry starter" },
  { name: "Crush Pepper Chicken", category: "Chinese Starters (Non-Veg)", price: "320", isVeg: false, description: "Crushed black peppercorn tempered spicy chicken" },
  { name: "Chicken Chilly Dry", category: "Chinese Starters (Non-Veg)", price: "260", isVeg: false, description: "Crisp chicken tossed with green chillies, onions and soy sauce" },
  { name: "Chicken Crystal Dry", category: "Chinese Starters (Non-Veg)", price: "280", isVeg: false, description: "Glazed crisp chicken with subtle garlic and oriental spices" },
  { name: "Chicken Dry", category: "Chinese Starters (Non-Veg)", price: "250", isVeg: false, description: "Classic stir fried seasoned dry chicken" },
  { name: "Chicken 65", category: "Chinese Starters (Non-Veg)", price: "260", isVeg: false, description: "Deep-fried spicy chicken bites tempered with curry leaves and mustard" },
  { name: "Chicken Green Lemon Chilly", category: "Chinese Starters (Non-Veg)", price: "270", isVeg: false, description: "Tangy fresh lemon juice and green chilli tossed spicy chicken" },
  { name: "Chicken Schezwan Dry", category: "Chinese Starters (Non-Veg)", price: "270", isVeg: false, description: "Fiery Schezwan sauce coated wok tossed chicken dry" },
  { name: "Chicken Crispy", category: "Chinese Starters (Non-Veg)", price: "280", isVeg: false, imageUrl: "/images/menu-items/chicken_strips.jpg", description: "Crunchy shredded chicken tossed in sweet and tangy chilli glaze" },
  { name: "Chicken Lollipop Dry", category: "Chinese Starters (Non-Veg)", price: "200", isVeg: false, imageUrl: "/images/menu-items/chicken_drumstick.jpg", description: "Crispy seasoned chicken wingettes fried to golden perfection" },
  { name: "Chicken Masala Lollipop", category: "Chinese Starters (Non-Veg)", price: "240", isVeg: false, imageUrl: "/images/menu-items/chicken_drumstick.jpg", description: "Chicken lollipops tossed in spicy Indo-Chinese masala" },
  { name: "Chicken Tikka Chilli Dry", category: "Chinese Starters (Non-Veg)", price: "280", isVeg: false, description: "Tandoori chicken tikka chunks wok tossed in chilli garlic gravy" },
  { name: "Hot Plate Dry", category: "Chinese Starters (Non-Veg)", price: "250", isVeg: false, description: "Sizzling spicy chicken served hot on iron griddle" },
  { name: "Chicken Ghee Roast", category: "Chinese Starters (Non-Veg)", price: "300", isVeg: false, description: "Mangalorean style aromatic pure ghee roasted spicy chicken" },
  { name: "Chicken Kharda", category: "Chinese Starters (Non-Veg)", price: "250", isVeg: false, description: "Spicy roasted green chilli thecha kharda tossed chicken" },
  { name: "Mutton Ghee Roast", category: "Chinese Starters (Non-Veg)", price: "450", isVeg: false, description: "Rich tender mutton pieces roasted in desi ghee and whole spices" },
  { name: "Mutton Kharda", category: "Chinese Starters (Non-Veg)", price: "400", isVeg: false, description: "Maharashtra style roasted green chilli thecha fried mutton" },
  { name: "Mutton Dry", category: "Chinese Starters (Non-Veg)", price: "420", isVeg: false, description: "Spicy pan-fried mutton dry starter" },
  { name: "Prawns Chilly", category: "Chinese Starters (Non-Veg)", price: "350", isVeg: false, description: "Batter-fried juicy prawns tossed with capsicum and green chillies" },
  { name: "Prawns Garlic Butter", category: "Chinese Starters (Non-Veg)", price: "400", isVeg: false, description: "Succulent prawns sauteed in golden garlic butter and parsley" },
  { name: "Fish 65", category: "Chinese Starters (Non-Veg)", price: "300", isVeg: false, description: "Crispy fried boneless fish morsels in spicy south-Indian 65 seasoning" },
  { name: "Fish Tikka", category: "Chinese Starters (Non-Veg)", price: "320", isVeg: false, description: "Ajwain and tandoori masala marinated grilled fish cubes" },
  { name: "Fish Chilly", category: "Chinese Starters (Non-Veg)", price: "350", isVeg: false, description: "Crispy fish tossed in classic spicy chilli garlic sauce" },
  { name: "Fish Finger", category: "Chinese Starters (Non-Veg)", price: "400", isVeg: false, description: "Crumb coated golden fried crisp fish fingers served with dip" },
  { name: "Fish Dragon", category: "Chinese Starters (Non-Veg)", price: "420", isVeg: false, description: "Crisp fish strips wok tossed in spicy sweet dragon sauce with cashews" },
  { name: "Fish Fry", category: "Chinese Starters (Non-Veg)", price: "350", isVeg: false, description: "Rawa coated traditional pan fried fish slices" },
  { name: "Chicken Kantaki (500 Grams)", category: "Chinese Starters (Non-Veg)", price: "220", isVeg: false, description: "Crispy batter fried Kantaki chicken (Half Kg)" },
  { name: "Chicken Kantaki (1 Kilogram)", category: "Chinese Starters (Non-Veg)", price: "440", isVeg: false, description: "Crispy batter fried Kantaki chicken (1 Kg)" },

  // ==========================================
  // CHINESE SOUPS (Non-Veg)
  // ==========================================
  { name: "Chicken Manchow Soup", category: "Chinese Soups (Non-Veg)", price: "120", isVeg: false, imageUrl: "/images/menu-items/manchau_soup.jpg", description: "Popular spicy garlic chicken soup topped with crispy fried noodles" },
  { name: "Chicken Sweetcorn Soup", category: "Chinese Soups (Non-Veg)", price: "130", isVeg: false, description: "Soothing velvety cream style sweet corn soup with chicken shreds" },
  { name: "Chicken Lemon Coriander Soup", category: "Chinese Soups (Non-Veg)", price: "110", isVeg: false, description: "Fresh coriander and lemon broth with tender shredded chicken" },
  { name: "Chicken Hot And Sour Soup", category: "Chinese Soups (Non-Veg)", price: "120", isVeg: false, description: "Spicy and tangy Chinese chicken soup with mushrooms and bamboo shoots" },
  { name: "Chicken Clear Soup", category: "Chinese Soups (Non-Veg)", price: "100", isVeg: false, description: "Light nourishing chicken broth with garden fresh vegetables" },
  { name: "Chicken Shorba", category: "Chinese Soups (Non-Veg)", price: "150", isVeg: false, description: "Traditional spiced aromatic chicken soup" },
  { name: "Mutton Shorba", category: "Chinese Soups (Non-Veg)", price: "200", isVeg: false, description: "Rich slow-simmered bone marrow mutton broth with whole spices" },

  // ==========================================
  // CHINESE FRIED RICE (Non-Veg)
  // ==========================================
  { name: "Chicken Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "180", isVeg: false, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Wok tossed basmati rice with shredded chicken, eggs and seasonal vegetables" },
  { name: "Chicken Schezwan Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "200", isVeg: false, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Spicy wok fried rice tossed in homemade fiery Schezwan paste and chicken" },
  { name: "Chicken Combination Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "220", isVeg: false, description: "Unique mix of rice and noodles stir-fried with chicken" },
  { name: "Chicken Schezwan Combination Rice", category: "Chinese Fried Rice (Non-Veg)", price: "250", isVeg: false, description: "Spicy Schezwan rice and noodle combination with chicken" },
  { name: "Chicken Hong Kong Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "260", isVeg: false, description: "Hong Kong style mildly sweet & savory stir-fried chicken rice" },
  { name: "Chicken Triple Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "300", isVeg: false, description: "Fried rice, noodles and fried chicken served with a bowl of rich Schezwan gravy" },
  { name: "Chicken Chopper Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "340", isVeg: false, description: "Flavor-packed chopped chicken fried rice topped with spicy sauce" },
  { name: "Chicken Singapuri Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "280", isVeg: false, description: "Aromatic curry powder and turmeric infused Singaporean chicken rice" },
  { name: "Mix Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "280", isVeg: false, description: "Delicious mix of chicken, egg and prawns stir-fried in rice" },
  { name: "Egg Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "140", isVeg: false, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Fluffy wok-tossed rice with scrambled eggs and spring onions" },
  { name: "Egg Schezwan Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "160", isVeg: false, description: "Zesty Schezwan fried rice loaded with scrambled eggs" },
  { name: "Prawns Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "280", isVeg: false, description: "Fresh juicy prawns wok fried with seasoned rice and veggies" },
  { name: "Prawns Schezwan Fried Rice", category: "Chinese Fried Rice (Non-Veg)", price: "300", isVeg: false, description: "Spicy Schezwan stir-fried rice featuring tender prawns" },

  // ==========================================
  // CHINESE NOODLES (Non-Veg)
  // ==========================================
  { name: "Chicken Noodle", category: "Chinese Noodles (Non-Veg)", price: "170", isVeg: false, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Hakka style wok tossed noodles with tender chicken and crisp vegetables" },
  { name: "Chicken Schezwan Noodle", category: "Chinese Noodles (Non-Veg)", price: "190", isVeg: false, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Fiery noodles tossed in Schezwan sauce with shredded chicken" },
  { name: "Chicken Combination Noodle", category: "Chinese Noodles (Non-Veg)", price: "210", isVeg: false, description: "Harmonious blend of noodles and rice tossed with chicken" },
  { name: "Chicken Schezwan Combination Noodle", category: "Chinese Noodles (Non-Veg)", price: "240", isVeg: false, description: "Spicy Schezwan mix of noodles and rice with chicken" },
  { name: "Chicken Hong Kong Noodle", category: "Chinese Noodles (Non-Veg)", price: "250", isVeg: false, description: "Hong Kong style mildly sweet & savory stir-fried noodles with chicken" },
  { name: "Chicken Triple Noodles", category: "Chinese Noodles (Non-Veg)", price: "290", isVeg: false, description: "Layered noodles tossed with chicken and served with spicy gravy" },
  { name: "Chicken Chopper Noodles", category: "Chinese Noodles (Non-Veg)", price: "330", isVeg: false, description: "Stir-fried chicken noodles topped with spicy chopped chicken sauce" },
  { name: "Chicken Singapuri Noodle", category: "Chinese Noodles (Non-Veg)", price: "270", isVeg: false, description: "Spicy yellow curry-spiced Singaporean chicken noodles" },
  { name: "Mix Noodle", category: "Chinese Noodles (Non-Veg)", price: "270", isVeg: false, description: "Delightful blend of chicken, prawns and eggs in Hakka noodles" },
  { name: "Egg Noodle", category: "Chinese Noodles (Non-Veg)", price: "130", isVeg: false, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Stir-fried noodles with scrambled egg and cabbage" },
  { name: "Egg Schezwan Noodle", category: "Chinese Noodles (Non-Veg)", price: "150", isVeg: false, description: "Spicy Schezwan noodles tossed with scrambled eggs" },
  { name: "Prawns Noodle", category: "Chinese Noodles (Non-Veg)", price: "270", isVeg: false, description: "Fresh juicy prawns wok-tossed with Hakka noodles" },
  { name: "Prawns Schezwan Noodle", category: "Chinese Noodles (Non-Veg)", price: "290", isVeg: false, description: "Fiery Schezwan noodles packed with tender succulent prawns" },

  // ==========================================
  // CHINESE SOUPS (Veg)
  // ==========================================
  { name: "Veg Manchow Soup", category: "Chinese Soups (Veg)", price: "90", isVeg: true, imageUrl: "/images/menu-items/manchau_soup.jpg", description: "Popular spicy garlic vegetable soup topped with crispy fried noodles" },
  { name: "Veg Lemon Coriander Soup", category: "Chinese Soups (Veg)", price: "80", isVeg: true, description: "Refreshing clear broth with fresh lemon juice, coriander and vegetables" },
  { name: "Veg Hot And Sour Soup", category: "Chinese Soups (Veg)", price: "80", isVeg: true, description: "Classic tangy and peppery Chinese vegetable soup" },
  { name: "Veg Clear Soup", category: "Chinese Soups (Veg)", price: "80", isVeg: true, description: "Light and healthy vegetable broth loaded with diced garden veggies" },
  { name: "Veg Sweet Corn Soup", category: "Chinese Soups (Veg)", price: "100", isVeg: true, description: "Sweet corn kernel and cream soup seasoned mildly" },
  { name: "Cream Of Tomato Soup", category: "Chinese Soups (Veg)", price: "100", isVeg: true, imageUrl: "/images/menu-items/soup.jpg", description: "Velvety ripe tomato soup served with crispy bread croutons" },

  // ==========================================
  // CHINESE FRIED RICE (Veg)
  // ==========================================
  { name: "Veg Fried Rice", category: "Chinese Fried Rice (Veg)", price: "160", isVeg: true, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Wok-tossed basmati rice with finely chopped carrots, beans and cabbage" },
  { name: "Veg Schezwan Fried Rice", category: "Chinese Fried Rice (Veg)", price: "180", isVeg: true, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Spicy Schezwan sauce infused wok-fried rice with vegetables" },
  { name: "Veg Combination Fried Rice", category: "Chinese Fried Rice (Veg)", price: "200", isVeg: true, description: "Stir-fried mix of rice and noodles with fresh veggies" },
  { name: "Veg Schezwan Combination Rice", category: "Chinese Fried Rice (Veg)", price: "230", isVeg: true, description: "Spicy Schezwan flavored rice and noodle fusion" },
  { name: "Veg Hongkong Fried Rice", category: "Chinese Fried Rice (Veg)", price: "240", isVeg: true, description: "Hong Kong style mildly sweet and savory vegetable fried rice" },
  { name: "Veg Mix Fried Rice", category: "Chinese Fried Rice (Veg)", price: "260", isVeg: true, description: "Rich mix of assorted veggies and paneer in seasoned fried rice" },
  { name: "Veg Triple Fried Rice", category: "Chinese Fried Rice (Veg)", price: "280", isVeg: true, description: "Veg fried rice, noodles and crispy elements served with Schezwan gravy" },
  { name: "Veg Chopper Fried Rice", category: "Chinese Fried Rice (Veg)", price: "320", isVeg: true, description: "Fried rice topped with a spicy chopped vegetable oriental sauce" },
  { name: "Veg Singapuri Fried Rice", category: "Chinese Fried Rice (Veg)", price: "260", isVeg: true, description: "Curry powder and dry spices infused Singapore style vegetable rice" },

  // ==========================================
  // CHINESE NOODLES (Veg)
  // ==========================================
  { name: "Veg Hakka Noodles", category: "Chinese Noodles (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Classic stir fried Hakka noodles with crunchy julienned vegetables" },
  { name: "Veg Schezwan Noodle", category: "Chinese Noodles (Veg)", price: "170", isVeg: true, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Spicy noodles tossed in fiery homemade Schezwan sauce with vegetables" },
  { name: "Veg Combination Noodle", category: "Chinese Noodles (Veg)", price: "190", isVeg: true, description: "Delicious combination of stir-fried noodles and rice" },
  { name: "Veg Schezwan Combination Noodle", category: "Chinese Noodles (Veg)", price: "220", isVeg: true, description: "Spicy Schezwan combination of wok noodles and rice" },
  { name: "Veg Hongkong Noodle", category: "Chinese Noodles (Veg)", price: "230", isVeg: true, description: "Hong Kong style sweet & spicy vegetable noodles" },
  { name: "Veg Triple Noodles", category: "Chinese Noodles (Veg)", price: "270", isVeg: true, description: "Triple vegetable noodles served with crispy noodles and hot gravy" },
  { name: "Veg Chopper Noodles", category: "Chinese Noodles (Veg)", price: "310", isVeg: true, description: "Noodles covered with a savoury chopped vegetable gravy topping" },
  { name: "Veg Singapuri Noodle", category: "Chinese Noodles (Veg)", price: "250", isVeg: true, description: "Singaporean spices wok tossed yellow vegetable noodles" },
  { name: "Veg Mix Noodle", category: "Chinese Noodles (Veg)", price: "250", isVeg: true, description: "Assorted vegetables and paneer tossed with Hakka noodles" },

  // ==========================================
  // CHICKEN MAIN COURSE (Non-Veg)
  // ==========================================
  { name: "Chicken Fry", category: "Chicken Main Course (Non-Veg)", price: "200", isVeg: false, description: "Pan fried chicken tossed in roasted aromatic Maharashtrian spices" },
  { name: "Chicken Masala", category: "Chicken Main Course (Non-Veg)", price: "220", isVeg: false, imageUrl: "/images/menu-items/chicken_curry.jpg", description: "Classic chicken curry simmered in onion-tomato masala" },
  { name: "Butter Chicken - Boneless", category: "Chicken Main Course (Non-Veg)", price: "280", isVeg: false, imageUrl: "/images/menu-items/butter_chicken.jpg", description: "Tender tandoori chicken cooked in rich buttery tomato cashew makhani gravy" },
  { name: "Chicken Kolhapuri", category: "Chicken Main Course (Non-Veg)", price: "260", isVeg: false, imageUrl: "/images/menu-items/chicken_curry.jpg", description: "Fiery authentic Kolhapuri red chilli gravy chicken" },
  { name: "Chicken Laziz - Boneless", category: "Chicken Main Course (Non-Veg)", price: "280", isVeg: false, description: "Rich, mildly spiced boneless chicken in creamy onion-cashew gravy" },
  { name: "Chicken Afghani - Boneless", category: "Chicken Main Course (Non-Veg)", price: "300", isVeg: false, description: "Mild creamy white gravy with tender boneless chicken pieces" },
  { name: "Chicken Lajwab - Boneless", category: "Chicken Main Course (Non-Veg)", price: "350", isVeg: false, description: "Chef's exquisite royal boneless chicken preparation" },
  { name: "Chicken Patiyala - Boneless", category: "Chicken Main Course (Non-Veg)", price: "380", isVeg: false, description: "Dhaba style rich boneless chicken wrapped in an egg omelette roll with curry" },
  { name: "Chicken Angara - Boneless", category: "Chicken Main Course (Non-Veg)", price: "350", isVeg: false, description: "Charcoal smoked spicy boneless chicken in red gravy" },
  { name: "Chicken Tikka Masala - Boneless", category: "Chicken Main Course (Non-Veg)", price: "320", isVeg: false, description: "Chargrilled chicken tikka pieces in rich spiced gravy" },
  { name: "Chicken Tava - Boneless", category: "Chicken Main Course (Non-Veg)", price: "260", isVeg: false, description: "Spicy semi-dry boneless chicken prepared on an iron tava" },
  { name: "Chicken Kadhai", category: "Chicken Main Course (Non-Veg)", price: "250", isVeg: false, description: "Chicken cooked with bell peppers, onions and crushed coriander seeds" },
  { name: "Chicken Lahori - Boneless", category: "Chicken Main Course (Non-Veg)", price: "280", isVeg: false, description: "Lahore style spiced thick tomato gravy with tender boneless chicken" },
  { name: "Chicken Murg Ra Ra", category: "Chicken Main Course (Non-Veg)", price: "420", isVeg: false, description: "Chicken pieces slow-cooked in a rich spiced minced chicken (kheema) gravy" },
  { name: "Chicken Murg Musallam (Half)", category: "Chicken Main Course (Non-Veg)", price: "550", isVeg: false, description: "Mughlai roasted whole chicken cooked in rich almond-saffron gravy (Half)" },
  { name: "Chicken Murg Musallam (Full)", category: "Chicken Main Course (Non-Veg)", price: "1000", isVeg: false, description: "Mughlai roasted whole chicken cooked in rich almond-saffron gravy (Full)" },
  { name: "Chicken Handi (Half)", category: "Chicken Main Course (Non-Veg)", price: "400", isVeg: false, imageUrl: "/images/menu-items/chicken_curry.jpg", description: "Clay pot slow-cooked rustic chicken curry (Half)" },
  { name: "Chicken Handi (Full)", category: "Chicken Main Course (Non-Veg)", price: "750", isVeg: false, imageUrl: "/images/menu-items/chicken_curry.jpg", description: "Clay pot slow-cooked rustic chicken curry (Full)" },
  { name: "Chicken Maratha", category: "Chicken Main Course (Non-Veg)", price: "350", isVeg: false, description: "Authentic spicy Maratha black masala gravy chicken" },
  { name: "Chicken Korma", category: "Chicken Main Course (Non-Veg)", price: "280", isVeg: false, description: "Mughlai chicken curry prepared with yoghurt, nuts and fragrant spices" },
  { name: "Chicken Stew", category: "Chicken Main Course (Non-Veg)", price: "300", isVeg: false, description: "Subtle whole-spiced chicken curry with onions and garlic" },
  { name: "Chicken Kheema Masala", category: "Chicken Main Course (Non-Veg)", price: "160", isVeg: false, imageUrl: "/images/menu-items/kheema.jpg", description: "Minced chicken cooked with green peas and warm aromatic spices" },
  { name: "Chicken Kheema Fry", category: "Chicken Main Course (Non-Veg)", price: "180", isVeg: false, imageUrl: "/images/menu-items/kheema.jpg", description: "Pan fried spicy dry minced chicken preparation" },
  { name: "Egg Masala", category: "Chicken Main Course (Non-Veg)", price: "150", isVeg: false, imageUrl: "/images/menu-items/egg_curry.jpg", description: "Boiled eggs tossed in thick onion-tomato spiced gravy" },
  { name: "Egg Curry", category: "Chicken Main Course (Non-Veg)", price: "140", isVeg: false, imageUrl: "/images/menu-items/egg_curry.jpg", description: "Traditional spiced home-style egg curry" },

  // ==========================================
  // MUTTON MAIN COURSE (Non-Veg)
  // ==========================================
  { name: "Mutton Masala", category: "Mutton Main Course (Non-Veg)", price: "250", isVeg: false, imageUrl: "/images/menu-items/mutton_curry.jpg", description: "Tender goat mutton cooked in traditional spiced brown gravy" },
  { name: "Mutton Fry Dry", category: "Mutton Main Course (Non-Veg)", price: "280", isVeg: false, description: "Dry roasted spicy mutton chunks sauteed with onions and curry spices" },
  { name: "Mutton Tava", category: "Mutton Main Course (Non-Veg)", price: "260", isVeg: false, description: "Spicy tava-cooked succulent mutton" },
  { name: "Mutton Kolhapuri", category: "Mutton Main Course (Non-Veg)", price: "260", isVeg: false, imageUrl: "/images/menu-items/mutton_curry.jpg", description: "Extra spicy Kolhapuri red chilli mutton gravy" },
  { name: "Mutton Laziz - Boneless", category: "Mutton Main Course (Non-Veg)", price: "320", isVeg: false, description: "Melt in mouth boneless mutton cooked in royal creamy sauce" },
  { name: "Mutton Lajwab - Boneless", category: "Mutton Main Course (Non-Veg)", price: "320", isVeg: false, description: "Exotic boneless mutton prepared with hand ground spices" },
  { name: "Mutton Patiyala - Boneless", category: "Mutton Main Course (Non-Veg)", price: "320", isVeg: false, description: "Punjab Patiyala style boneless mutton in rich egg-folded curry" },
  { name: "Mutton Angara - Boneless", category: "Mutton Main Course (Non-Veg)", price: "340", isVeg: false, description: "Smoky spicy boneless mutton cooked with charcoal infusion" },
  { name: "Mutton Kadhai", category: "Mutton Main Course (Non-Veg)", price: "280", isVeg: false, description: "Mutton cooked with fresh bell peppers, onions and kadhai masala" },
  { name: "Mutton Maratha", category: "Mutton Main Course (Non-Veg)", price: "340", isVeg: false, description: "Traditional spicy Maharashtrian black masala mutton rassa" },
  { name: "Mutton Handi (Half)", category: "Mutton Main Course (Non-Veg)", price: "600", isVeg: false, imageUrl: "/images/menu-items/mutton_curry.jpg", description: "Slow earthen pot simmered rich mutton handi curry (Half)" },
  { name: "Mutton Handi (Full)", category: "Mutton Main Course (Non-Veg)", price: "1100", isVeg: false, imageUrl: "/images/menu-items/mutton_curry.jpg", description: "Slow earthen pot simmered rich mutton handi curry (Full)" },
  { name: "Mutton Shahi Korma", category: "Mutton Main Course (Non-Veg)", price: "300", isVeg: false, description: "Royal mild mutton curry infused with cashew paste and saffron" },
  { name: "Mutton Kheema", category: "Mutton Main Course (Non-Veg)", price: "280", isVeg: false, imageUrl: "/images/menu-items/kheema.jpg", description: "Fine minced mutton cooked with onions, garlic and spices" },
  { name: "Mutton Kheema Fry", category: "Mutton Main Course (Non-Veg)", price: "300", isVeg: false, imageUrl: "/images/menu-items/kheema.jpg", description: "Pan fried spiced minced mutton fry" },
  { name: "Mutton Bheja Masala", category: "Mutton Main Course (Non-Veg)", price: "240", isVeg: false, description: "Delicate mutton brain cooked in fragrant onion-tomato masala" },
  { name: "Mutton Bheja Fry", category: "Mutton Main Course (Non-Veg)", price: "260", isVeg: false, description: "Pan-fried spiced mutton brain delicacy" },
  { name: "Mutton Dabba Gosht", category: "Mutton Main Course (Non-Veg)", price: "350", isVeg: false, description: "Bohri style baked mutton in rich white gravy topped with egg" },
  { name: "Mutton Do Pyaza", category: "Mutton Main Course (Non-Veg)", price: "280", isVeg: false, description: "Mutton cooked with abundant caramelized and diced crunchy onions" },
  { name: "Mutton Paya Salan", category: "Mutton Main Course (Non-Veg)", price: "300", isVeg: false, description: "Slow simmered wholesome mutton trotter soup-curry" },

  // ==========================================
  // MAIN COURSE - VEG (Veg)
  // ==========================================
  { name: "Paneer Masala", category: "Veg Main Course", price: "250", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Cottage cheese cubes simmered in spiced onion-tomato gravy" },
  { name: "Paneer Butter Masala", category: "Veg Main Course", price: "300", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Paneer cubes cooked in rich silky buttery tomato-cashew gravy" },
  { name: "Paneer Tikka Masala", category: "Veg Main Course", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_tikka.jpg", description: "Grilled marinated paneer tikka chunks cooked in spiced masala" },
  { name: "Paneer Chatpata", category: "Veg Main Course", price: "300", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Tangy and spicy chatpata masala gravy paneer" },
  { name: "Paneer Angara", category: "Veg Main Course", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Charcoal smoked spicy paneer gravy with rich flavours" },
  { name: "Paneer Bhurji", category: "Veg Main Course", price: "240", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Scrambled fresh paneer tossed with onions, tomatoes and green chillies" },
  { name: "Paneer Pasanda", category: "Veg Main Course", price: "260", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Stuffed paneer sandwiches cooked in a creamy Mughlai nut gravy" },
  { name: "Paneer Patiyala", category: "Veg Main Course", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Patiyala style rich paneer stuffed roll simmered in two gravies" },
  { name: "Palak Paneer", category: "Veg Main Course", price: "200", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Fresh cottage cheese cubes in mildly spiced smooth spinach gravy" },
  { name: "Veg Angara", category: "Veg Main Course", price: "220", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Smoky spicy mixed vegetables in red hot gravy" },
  { name: "Veg Kolhapuri", category: "Veg Main Course", price: "200", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Spicy mixed vegetables cooked in authentic Kolhapuri masala" },
  { name: "Veg Kadhai", category: "Veg Main Course", price: "220", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Assorted vegetables cooked with crunchy bell peppers and kadhai spices" },
  { name: "Veg Jaipuri", category: "Veg Main Course", price: "240", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Rajasthani style vegetable curry topped with crispy papad" },
  { name: "Veg Patiyala", category: "Veg Main Course", price: "230", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Spiced vegetable roll simmered in flavorful brown gravy" },
  { name: "Veg Kofta", category: "Veg Main Course", price: "240", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Crispy fried spiced vegetable dumplings in a rich onion-tomato sauce" },
  { name: "Veg Hariyali", category: "Veg Main Course", price: "180", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Mixed vegetables cooked in fresh green spinach-mint-coriander gravy" },
  { name: "Veg Handi (Half)", category: "Veg Main Course", price: "200", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Slow handi-cooked aromatic mixed vegetable curry (Half)" },
  { name: "Veg Handi (Full)", category: "Veg Main Course", price: "380", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Slow handi-cooked aromatic mixed vegetable curry (Full)" },
  { name: "Kaju Curry", category: "Veg Main Course", price: "260", isVeg: true, description: "Whole roasted cashew nuts simmered in rich velvety onion gravy" },
  { name: "Kaju Masala", category: "Veg Main Course", price: "280", isVeg: true, description: "Roasted cashews cooked in spicy and tangy tomato-onion gravy" },
  { name: "Kaju Paneer Masala", category: "Veg Main Course", price: "300", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Delicious combination of roasted cashew nuts and paneer in rich masala" },
  { name: "Malai Kofta", category: "Veg Main Course", price: "260", isVeg: true, description: "Melt in mouth paneer and potato dumplings in sweet-savory white cream gravy" },
  { name: "Milk Methi", category: "Veg Main Course", price: "220", isVeg: true, description: "Fresh fenugreek leaves cooked gently in creamy sweet milk gravy" },
  { name: "Methi Chaman", category: "Veg Main Course", price: "240", isVeg: true, description: "Kashmiri delicacy of fresh methi greens and cottage cheese cubes" },
  { name: "Lasuni Methi", category: "Veg Main Course", price: "220", isVeg: true, description: "Tender fenugreek leaves tempered generously with burnt garlic and spices" },
  { name: "Lasuni Palak", category: "Veg Main Course", price: "180", isVeg: true, description: "Smooth spinach curry with dominant aroma of roasted golden garlic" },
  { name: "Methi Masala", category: "Veg Main Course", price: "200", isVeg: true, description: "Fenugreek leaves sauteed with spicy onion and tomato masala" },
  { name: "Mix Veg", category: "Veg Main Course", price: "160", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Garden fresh seasonal vegetables simmered in mild spiced gravy" },
  { name: "Shev Bhaji", category: "Veg Main Course", price: "160", isVeg: true, description: "Crisp gram flour sev served in spicy Maharashtrian rassa curry" },

  // ==========================================
  // ROTI & BREADS (Veg)
  // ==========================================
  { name: "Tandoor Roti (Maida)", category: "Roti & Breads (Veg)", price: "20", isVeg: true, description: "Traditional clay oven baked crisp tandoori roti made with refined flour" },
  { name: "Butter Tandoor Roti", category: "Roti & Breads (Veg)", price: "30", isVeg: true, description: "Crisp tandoori roti brushed generously with melted butter" },
  { name: "Wheat Tandoor Roti", category: "Roti & Breads (Veg)", price: "20", isVeg: true, description: "Wholesome 100% whole wheat roti baked in clay tandoor oven" },
  { name: "Wheat Butter Tandoor Roti", category: "Roti & Breads (Veg)", price: "30", isVeg: true, description: "Clay oven roasted whole wheat roti glazed with fresh butter" },
  { name: "Naan", category: "Roti & Breads (Veg)", price: "40", isVeg: true, description: "Soft and fluffy traditional leavened tandoor-baked flatbread" },
  { name: "Butter Naan", category: "Roti & Breads (Veg)", price: "60", isVeg: true, description: "Classic soft tandoor naan topped with a generous layer of butter" },
  { name: "Garlic Naan", category: "Roti & Breads (Veg)", price: "70", isVeg: true, description: "Aromatic naan topped with minced roasted garlic and fresh coriander" },
  { name: "Butter Garlic Naan", category: "Roti & Breads (Veg)", price: "90", isVeg: true, description: "Fluffy naan coated with golden roasted garlic and melting butter" },
  { name: "Cheese Garlic Naan", category: "Roti & Breads (Veg)", price: "120", isVeg: true, description: "Decadent naan stuffed and topped with melted cheese and roasted garlic" },
  { name: "Peri Peri Naan", category: "Roti & Breads (Veg)", price: "100", isVeg: true, description: "Spicy and tangy peri-peri herb seasoned tandoori naan" },
  { name: "Kulcha Plain", category: "Roti & Breads (Veg)", price: "50", isVeg: true, description: "Soft mildly leavened Amritsari flatbread cooked in tandoor" },
  { name: "Butter Kulcha", category: "Roti & Breads (Veg)", price: "60", isVeg: true, description: "Warm and flaky tandoori kulcha smeared with rich butter" },
  { name: "Laccha Paratha", category: "Roti & Breads (Veg)", price: "60", isVeg: true, imageUrl: "/images/menu-items/paratha.jpg", description: "Multi-layered flaky crispy tandoori whole wheat paratha" },
  { name: "Rumali Roti", category: "Roti & Breads (Veg)", price: "60", isVeg: true, description: "Ultra-thin, soft handkerchief-style Indian flatbread cooked on inverted wok" },
  { name: "Chapati", category: "Roti & Breads (Veg)", price: "20", isVeg: true, description: "Homestyle soft puffed whole wheat flatbread made on tawa" },
  { name: "Jwari Bhakari", category: "Roti & Breads (Veg)", price: "35", isVeg: true, description: "Traditional rustic Maharashtrian flatbread made from healthy jowar flour" },
  { name: "Bajari Bhakari", category: "Roti & Breads (Veg)", price: "30", isVeg: true, description: "Wholesome gluten-free pearl millet flatbread freshly roasted on griddle" },

  // ==========================================
  // DAL SPECIALITIES (Veg)
  // ==========================================
  { name: "Dal Fry", category: "Dal (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Yellow lentils tempered with cumin, onions, garlic and tomatoes" },
  { name: "Dal Tadka", category: "Dal (Veg)", price: "160", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Creamy yellow dal topped with a sizzling tadka of ghee, garlic, and dried red chillies" },
  { name: "Dal Khichadi", category: "Dal (Veg)", price: "180", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Comforting homestyle blend of rice and yellow lentils cooked with mild spices and ghee" },
  { name: "Dal Khichadi Tadka", category: "Dal (Veg)", price: "200", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Classic comforting dal khichadi elevated with a spicy aromatic garlic-ghee tadka" },

  // ==========================================
  // RICE SPECIALITIES (Veg)
  // ==========================================
  { name: "Steam Rice (Half)", category: "Rice (Veg)", price: "60", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Fluffy steamed long grain basmati rice (Half portion)" },
  { name: "Steam Rice (Full)", category: "Rice (Veg)", price: "100", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Fluffy steamed long grain basmati rice (Full portion)" },
  { name: "Jeera Rice (Half)", category: "Rice (Veg)", price: "80", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Fragrant basmati rice tempered with roasted cumin seeds and desi ghee (Half)" },
  { name: "Jeera Rice (Full)", category: "Rice (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Fragrant basmati rice tempered with roasted cumin seeds and desi ghee (Full)" },
  { name: "Biryani Rice (Half)", category: "Rice (Veg)", price: "80", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Aromatic saffron and whole spice infused biryani rice (Half)" },
  { name: "Biryani Rice (Full)", category: "Rice (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Aromatic saffron and whole spice infused biryani rice (Full)" },
  { name: "Indrayani Rice (Half)", category: "Rice (Veg)", price: "80", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Sweet-scented soft native Maharashtra Indrayani sticky rice (Half)" },
  { name: "Indrayani Rice (Full)", category: "Rice (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Sweet-scented soft native Maharashtra Indrayani sticky rice (Full)" },
  { name: "Bagara Rice", category: "Rice (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Hyderabadi style seasoned rice tempered with whole spices, mint, and fried onions" },

  // ==========================================
  // PAPAD & SIDES (Veg)
  // ==========================================
  { name: "Fry Papad", category: "Papad & Sides (Veg)", price: "25", isVeg: true, description: "Crisp golden deep-fried spiced urad dal papad" },
  { name: "Roast Papad", category: "Papad & Sides (Veg)", price: "20", isVeg: true, description: "Flame-roasted crunchy light papad" },
  { name: "Masala Papad", category: "Papad & Sides (Veg)", price: "50", isVeg: true, description: "Crisp roasted papad loaded with crunchy onions, tomatoes, coriander and tangy chaat masala" },

  // ==========================================
  // BEVERAGES
  // ==========================================
  { name: "Water Bottle", category: "Beverages", price: "20", isVeg: true, description: "Chilled packaged mineral water bottle (1 Litre)" },
  { name: "Soft Drink", category: "Beverages", price: "20", isVeg: true, description: "Chilled refreshing soft drink / soda" },

  // ==========================================
  // SWEETS & DESSERTS (Veg)
  // ==========================================
  { name: "Gulab Jamun", category: "Sweets & Desserts (Veg)", price: "50", isVeg: true, imageUrl: "/images/menu-items/gulab_jamun.jpg", description: "Warm, melt-in-mouth milk solid dumplings soaked in cardamom flavored sugar syrup" },
  { name: "Fruit Salad", category: "Sweets & Desserts (Veg)", price: "180", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Fresh seasonal chopped fruits tossed in chilled creamy vanilla custard" },
  { name: "Caramel Custard", category: "Sweets & Desserts (Veg)", price: "80", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Silky smooth baked custard drizzled with rich golden caramel sauce" },
];

async function seedNikharaMenu() {
  console.log("Searching for restaurant 'Nikhara veg & non-veg'...");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%nikhara%"),
  });

  if (!provider) {
    console.error("❌ Restaurant 'Nikhara veg & non-veg' not found in database!");
    process.exit(1);
  }

  console.log(`Found provider: ${provider.businessName} (ID: ${provider.id})`);

  // Delete existing items for clean update
  const deleted = await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, provider.id));
  console.log("Cleared any existing items for Nikhara.");

  console.log(`Inserting ${menuItems.length} menu items...`);

  let insertedCount = 0;
  for (const item of menuItems) {
    await db.insert(restaurantMenuItems).values({
      id: createId(),
      providerId: provider.id,
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      description: item.description,
      imageUrl: item.imageUrl || null,
      isAvailable: true,
      cuisine: item.isVeg ? "North Indian / Chinese Veg" : "Mughlai / Arabian / Chinese Non-Veg",
    });
    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} menu items for '${provider.businessName}'!`);

  // Print summary by category
  const categories = [...new Set(menuItems.map(i => i.category))];
  console.log("\nSummary by Category:");
  for (const cat of categories) {
    const count = menuItems.filter(i => i.category === cat).length;
    const isVegCategory = menuItems.find(i => i.category === cat)?.isVeg;
    console.log(`  - [${isVegCategory ? '🟢 VEG' : '🔴 NON-VEG'}] ${cat}: ${count} items`);
  }

  process.exit(0);
}

seedNikharaMenu().catch(err => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
