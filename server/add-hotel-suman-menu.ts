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
  // PAVBHAJI STARTERS / पावभाजी स्टार्टर्स
  // ==========================================
  { name: "Masala Pav", category: "Pavbhaji & Starters", price: "100", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Soft pav tossed in spicy butter and special pav bhaji masala on tawa" },
  { name: "Masala Pav Gravy", category: "Pavbhaji & Starters", price: "120", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Masala pav drenched with rich savoury pav bhaji gravy" },
  { name: "Cheese Masala Pav", category: "Pavbhaji & Starters", price: "140", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Tawa masala pav loaded with grated processed Amul cheese" },
  { name: "Cheese Melted Masala Pav", category: "Pavbhaji & Starters", price: "160", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Decadent masala pav topped with hot gooey melted cheese" },
  { name: "Aloo Chaat", category: "Pavbhaji & Starters", price: "120", isVeg: true, description: "Crispy diced potatoes tossed with tangy chaat spices and lemon juice" },
  { name: "Cheese Aloo Chaat", category: "Pavbhaji & Starters", price: "150", isVeg: true, description: "Spicy crisp aloo chaat smothered with shredded cheese" },
  { name: "Garlic Chutney", category: "Pavbhaji & Starters", price: "100", isVeg: true, description: "Fiery Maharashtrian style freshly pounded garlic red chilli chutney" },

  // ==========================================
  // MUMBAI PAVBHAJI / मुंबई पावभाजी
  // ==========================================
  { name: "Amul Pavbhaji", category: "Mumbai Pavbhaji", price: "120", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Classic Mumbai style mashed vegetable bhaji simmered in Amul butter, served with 2 butter pav" },
  { name: "Cheese Pavbhaji", category: "Mumbai Pavbhaji", price: "160", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Signature Amul pav bhaji topped with a generous snowfall of grated cheese" },
  { name: "Khada Pavbhaji", category: "Mumbai Pavbhaji", price: "150", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Chunky unmashed whole vegetables cooked in aromatic tawa spices with butter" },
  { name: "Cheese Khada Pavbhaji", category: "Mumbai Pavbhaji", price: "180", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Chunky vegetable khada bhaji smothered with shredded cheese" },
  { name: "Jain Pavbhaji", category: "Mumbai Pavbhaji", price: "150", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Specially prepared without onion, garlic, or potatoes, cooked in butter" },
  { name: "Jain Cheese Pavbhaji", category: "Mumbai Pavbhaji", price: "180", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "No-onion no-garlic Jain pav bhaji topped with rich cheese" },
  { name: "Jain Khada Pavbhaji", category: "Mumbai Pavbhaji", price: "160", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Jain style chunky unmashed vegetable bhaji cooked in butter" },
  { name: "Jain Cheese Khada Pavbhaji", category: "Mumbai Pavbhaji", price: "190", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Jain chunky vegetable bhaji served with melted cheese" },
  { name: "Paneer Pavbhaji", category: "Mumbai Pavbhaji", price: "180", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Pav bhaji enriched with soft crumbled and cubed cottage cheese" },
  { name: "Paneer Cheese Pavbhaji", category: "Mumbai Pavbhaji", price: "220", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Royal indulgence with both fresh paneer and grated cheese" },
  { name: "Spl. Cheese Melted Pavbhaji", category: "Mumbai Pavbhaji", price: "250", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Chef's special bhaji fully blanketed with melted liquid cheese" },
  { name: "Spl. Amul Tadka Pavbhaji", category: "Mumbai Pavbhaji", price: "220", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Pav bhaji finished with a fiery butter tadka of garlic, kashmiri chilli and cumin" },
  { name: "Spl. Paneer Bhurji Pav", category: "Mumbai Pavbhaji", price: "200", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Spicy scrambled paneer cooked on griddle with tomatoes and onions, served with pav" },
  { name: "Bhaji Plate", category: "Mumbai Pavbhaji", price: "100", isVeg: true, imageUrl: "/images/menu-items/pav_bhaji.jpg", description: "Extra plate of hot buttered pav bhaji gravy without pav" },
  { name: "Extra Pav", category: "Mumbai Pavbhaji", price: "20", isVeg: true, description: "Pair of extra pav toasted in fresh butter" },

  // ==========================================
  // TAVA PULAO / तवा पुलाव
  // ==========================================
  { name: "Tava Pulao", category: "Tava Pulao", price: "150", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Mumbai street style basmati rice stir-fried on iron tava with pav bhaji masala, veggies and butter" },
  { name: "Tava Pulao Schezwan", category: "Tava Pulao", price: "180", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Spicy fusion of Mumbai tava pulao tossed with fiery Schezwan sauce" },
  { name: "Cheese Tava Pulao", category: "Tava Pulao", price: "180", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Classic tava pulao generously topped with melted grated cheese" },
  { name: "Cheese Tava Pulao Schezwan", category: "Tava Pulao", price: "210", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Spicy Schezwan tava pulao topped with a mountain of cheese" },
  { name: "Jain Tava Pulao", category: "Tava Pulao", price: "160", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Tava pulao prepared strictly without onion, garlic, or root vegetables" },
  { name: "Jain Tava Cheese Pulao", category: "Tava Pulao", price: "190", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Jain style tava pulao loaded with grated processed cheese" },
  { name: "Paneer Tava Pulao", category: "Tava Pulao", price: "180", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Tava pulao tossed with golden spiced paneer cubes and vegetables" },
  { name: "Paneer Tava Pulao Schezwan", category: "Tava Pulao", price: "210", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Schezwan spiced tava pulao packed with succulent paneer" },
  { name: "Paneer Cheese Tava Pulao", category: "Tava Pulao", price: "240", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Loaded combination of fresh cottage cheese and melted cheese in tava pulao" },
  { name: "Paneer Cheese Tava Pulao With Schezwan", category: "Tava Pulao", price: "260", isVeg: true, imageUrl: "/images/menu-items/pulao.jpg", description: "Ultimate loaded pulao with paneer, cheese and spicy Schezwan kick" },
  { name: "Extra Raita", category: "Tava Pulao", price: "30", isVeg: true, description: "Cool seasoned yoghurt raita with cucumber and cumin" },
  { name: "Extra Schezwan Chutney", category: "Tava Pulao", price: "30", isVeg: true, description: "Spicy garlic Schezwan dip" },
  { name: "Extra Cheese", category: "Tava Pulao", price: "60", isVeg: true, description: "Extra portion of grated processed Amul cheese" },

  // ==========================================
  // SPECIAL DELHI CHAAT / स्पेशल दिल्ली चाट
  // ==========================================
  { name: "Cold Pani Puri", category: "Special Delhi Chaat", price: "40", isVeg: true, imageUrl: "/images/menu-items/pani_puri.jpg", description: "Crisp puris filled with spiced potato and chilled mint-coriander spicy water" },
  { name: "Ragda Pani Puri", category: "Special Delhi Chaat", price: "40", isVeg: true, imageUrl: "/images/menu-items/pani_puri.jpg", description: "Puris filled with warm white pea ragda and chilled flavored water" },
  { name: "Masala Puri", category: "Special Delhi Chaat", price: "50", isVeg: true, description: "Crushed puris topped with hot ragda, onions, tomatoes and chutneys" },
  { name: "Suki Bhel (Dry Bhel)", category: "Special Delhi Chaat", price: "50", isVeg: true, description: "Crunchy puffed rice mix with sev, onions and dry spicy masala" },
  { name: "Bhel Puri", category: "Special Delhi Chaat", price: "50", isVeg: true, description: "Classic Mumbai bhel with sweet tamarind and spicy green chutney" },
  { name: "Dahi Bhel Puri", category: "Special Delhi Chaat", price: "80", isVeg: true, description: "Bhel puri topped with chilled sweet curd and sev" },
  { name: "Cheese Bhel Puri", category: "Special Delhi Chaat", price: "90", isVeg: true, description: "Crispy bhel puri loaded with shredded cheese" },
  { name: "Sev Puri", category: "Special Delhi Chaat", price: "60", isVeg: true, description: "Flat crisp puris topped with potatoes, onions, trio of chutneys and nylon sev" },
  { name: "Cheese Sev Puri", category: "Special Delhi Chaat", price: "80", isVeg: true, description: "Sev puri topped with extra shredded cheese" },
  { name: "Dahi Puri", category: "Special Delhi Chaat", price: "80", isVeg: true, description: "Puffed puris stuffed with potatoes and drowned in creamy sweetened yogurt and sev" },
  { name: "Special Dahi Puri", category: "Special Delhi Chaat", price: "100", isVeg: true, description: "Deluxe dahi puri topped with dry fruits, pomegranate and rich sweet curd" },
  { name: "Ragda Puri", category: "Special Delhi Chaat", price: "70", isVeg: true, description: "Crisp puris topped with piping hot spiced ragda and chutneys" },
  { name: "Dahi Ragda Puri", category: "Special Delhi Chaat", price: "80", isVeg: true, description: "Ragda puri served with cold creamy yogurt and sweet tamarind sauce" },
  { name: "Ragda Patties", category: "Special Delhi Chaat", price: "70", isVeg: true, description: "Golden pan-fried potato patties served with warm ragda gravy and chutneys" },
  { name: "Ragda Samosa", category: "Special Delhi Chaat", price: "90", isVeg: true, imageUrl: "/images/menu-items/samosa.jpg", description: "Crisp samosa crushed and topped with hot ragda and tangy chutneys" },
  { name: "Dahi Kachori", category: "Special Delhi Chaat", price: "70", isVeg: true, description: "Flaky kachori topped with seasoned curd, tamarind chutney and sev" },
  { name: "Dahi Kachori Chaat", category: "Special Delhi Chaat", price: "100", isVeg: true, description: "Deluxe kachori chaat with sweet curd, spices, coriander and pomegranate" },
  { name: "Dahi Ragda Patties", category: "Special Delhi Chaat", price: "90", isVeg: true, description: "Potato patties served with ragda, sweetened yogurt and crunchy sev" },
  { name: "Samosa Bhel", category: "Special Delhi Chaat", price: "90", isVeg: true, imageUrl: "/images/menu-items/samosa.jpg", description: "Crushed spiced samosa tossed with bhel puri and chutneys" },
  { name: "Dahi Samosa", category: "Special Delhi Chaat", price: "90", isVeg: true, imageUrl: "/images/menu-items/samosa.jpg", description: "Crisp samosa served with chilled spiced curd and sweet chutney" },
  { name: "Samosa Chaat", category: "Special Delhi Chaat", price: "70", isVeg: true, imageUrl: "/images/menu-items/samosa.jpg", description: "Street-style samosa chaat with chole/ragda, onions and sev" },
  { name: "Papdi Chaat", category: "Special Delhi Chaat", price: "80", isVeg: true, description: "Crispy fried flour crackers topped with potatoes, chickpeas, curd and chutneys" },
  { name: "Kachori Bhel", category: "Special Delhi Chaat", price: "100", isVeg: true, description: "Crispy kachori crumbled into fresh tangy bhel mixture" },
  { name: "Dil Khush Bhel", category: "Special Delhi Chaat", price: "100", isVeg: true, description: "Chef's signature rich bhel loaded with dry fruits, fruits and exotic chutneys" },
  { name: "Kurkure Bhel", category: "Special Delhi Chaat", price: "70", isVeg: true, description: "Crunchy kurkure bites tossed with onions, tomatoes and spicy chaat chutneys" },
  { name: "Cheese Kurkure Bhel", category: "Special Delhi Chaat", price: "100", isVeg: true, description: "Kurkure chaat bhel finished with shredded cheese" },
  { name: "Dahi Papdi", category: "Special Delhi Chaat", price: "90", isVeg: true, description: "Crispy papdi covered with whipped sweet yogurt and spice powders" },
  { name: "Dahi Vada", category: "Special Delhi Chaat", price: "100", isVeg: true, description: "Soft lentil dumplings soaked in creamy sweet curd and roasted cumin" },
  { name: "Dahi Tokri Chaat", category: "Special Delhi Chaat", price: "120", isVeg: true, description: "Crispy edible potato basket filled with sprouts, curd and chutneys" },
  { name: "Dahi Cheese Tokri Chaat", category: "Special Delhi Chaat", price: "150", isVeg: true, description: "Tokri chaat filled with curd and covered in shredded cheese" },
  { name: "Paneer Cheese Tokri Chaat", category: "Special Delhi Chaat", price: "200", isVeg: true, description: "Crispy tokri loaded with marinated paneer, curd, and cheese" },

  // ==========================================
  // VEG SOYA CHAAP / व्हेज सोया चाप
  // ==========================================
  { name: "Tandoori Soya Chaap", category: "Veg Soya Chaap", price: "180", isVeg: true, description: "Succulent protein-rich soya chaap skewers roasted in smoky tandoor spices" },
  { name: "Malai Soya Chaap", category: "Veg Soya Chaap", price: "220", isVeg: true, description: "Melt-in-mouth soya chaap marinated in fresh cream, cashew paste and cheese" },
  { name: "Hariyali Soya Chaap", category: "Veg Soya Chaap", price: "160", isVeg: true, description: "Soya chaap marinated in vibrant mint, coriander and roasted gram flour" },
  { name: "Afghani Soya Chaap", category: "Veg Soya Chaap", price: "180", isVeg: true, description: "Mildly spiced royal Afghani style cashew and butter marinated soya chaap" },
  { name: "Moti Soya Chaap Spicy", category: "Veg Soya Chaap", price: "200", isVeg: true, description: "Chef's extra spicy roasted soya chaap with pearl garlic crunch" },

  // ==========================================
  // SOUP / सूप
  // ==========================================
  { name: "Tomato Soup", category: "Soups", price: "80", isVeg: true, imageUrl: "/images/menu-items/soup.jpg", description: "Rich and tangy classic ripe tomato soup served with croutons" },
  { name: "Mix Veg Soup", category: "Soups", price: "90", isVeg: true, imageUrl: "/images/menu-items/soup.jpg", description: "Healthy clear vegetable soup loaded with diced fresh greens" },
  { name: "Manchow Soup", category: "Soups", price: "100", isVeg: true, imageUrl: "/images/menu-items/manchau_soup.jpg", description: "Popular spicy garlic vegetable soup topped with crispy fried noodles" },
  { name: "Hot & Sour Soup", category: "Soups", price: "100", isVeg: true, description: "Peppery and tangy soup loaded with shredded cabbage, carrots and mushrooms" },
  { name: "Veg Noodle Soup", category: "Soups", price: "100", isVeg: true, description: "Warm nourishing broth loaded with noodles and vegetables" },
  { name: "Lemon Coriander Soup", category: "Soups", price: "100", isVeg: true, description: "Zesty soup packed with fresh coriander leaves and fresh lime juice" },
  { name: "Manchurian Soup", category: "Soups", price: "120", isVeg: true, description: "Flavorful Indo-Chinese soup with baby vegetable manchurian balls" },
  { name: "Paneer Soup", category: "Soups", price: "120", isVeg: true, description: "Mild creamy soup enriched with soft cottage cheese cubes" },
  { name: "Sweet Corn Soup", category: "Soups", price: "130", isVeg: true, description: "Sweet golden corn kernel soup with creamy velvet texture" },
  { name: "Cream of Mushroom", category: "Soups", price: "140", isVeg: true, description: "Rich European style creamy pureed button mushroom soup" },

  // ==========================================
  // STARTERS / स्टार्टर्स
  // ==========================================
  { name: "Veg Lollipop", category: "Chinese Starters", price: "150", isVeg: true, description: "Crispy fried vegetable cutlet drumsticks served with Schezwan dip" },
  { name: "Chinese Bhel", category: "Chinese Starters", price: "150", isVeg: true, imageUrl: "/images/menu-items/chinese_bhel.jpg", description: "Crispy fried noodles tossed with cabbage, bell peppers and spicy Schezwan sauce" },
  { name: "Veg 65", category: "Chinese Starters", price: "150", isVeg: true, description: "Crispy spiced vegetable florets tempered with curry leaves and green chillies" },
  { name: "Spring Roll", category: "Chinese Starters", price: "180", isVeg: true, description: "Golden crispy fried pastry sheets stuffed with seasoned vegetable noodles" },
  { name: "Paneer Chilli Dry", category: "Chinese Starters", price: "200", isVeg: true, imageUrl: "/images/menu-items/paneer_tikka.jpg", description: "Wok tossed cottage cheese cubes with onions, capsicum, and chilli soy glaze" },
  { name: "Paneer Chilli Gravy", category: "Chinese Starters", price: "220", isVeg: true, description: "Soft paneer cubes simmered in a saucy garlic chilli gravy" },
  { name: "Veg Manchurian Dry", category: "Chinese Starters", price: "150", isVeg: true, imageUrl: "/images/menu-items/manchurian_dry.jpg", description: "Crispy vegetable balls wok-tossed in dry ginger-garlic-soy glaze" },
  { name: "Veg Manchurian Gravy", category: "Chinese Starters", price: "170", isVeg: true, imageUrl: "/images/menu-items/manchurian.jpg", description: "Minced vegetable dumplings simmered in rich savoury brown Manchurian sauce" },
  { name: "Paneer Manchurian Dry", category: "Chinese Starters", price: "220", isVeg: true, description: "Cottage cheese cubes tossed in spicy Manchurian sauce" },
  { name: "Paneer Manchurian Gravy", category: "Chinese Starters", price: "240", isVeg: true, description: "Paneer cubes in rich garlic and coriander Manchurian gravy" },
  { name: "Mushroom Manchurian Dry", category: "Chinese Starters", price: "200", isVeg: true, description: "Fresh button mushrooms coated and fried crisp, tossed with Manchurian seasoning" },
  { name: "Mushroom Manchurian Gravy", category: "Chinese Starters", price: "220", isVeg: true, description: "Button mushrooms simmered in savoury oriental brown gravy" },
  { name: "Veg Crispy", category: "Chinese Starters", price: "160", isVeg: true, description: "Crunchy batter fried seasonal veggies tossed in sweet-sour chilli garlic sauce" },
  { name: "Paneer Crispy", category: "Chinese Starters", price: "240", isVeg: true, description: "Crisp fried paneer fingers coated in tangy spicy wok sauce" },
  { name: "Hara Bhara Kabab", category: "Chinese Starters", price: "180", isVeg: true, description: "Pan fried patties made with fresh spinach, green peas and potatoes" },
  { name: "Veg Ball Schezwan Dry", category: "Chinese Starters", price: "180", isVeg: true, description: "Crispy vegetable balls tossed in homemade fiery Schezwan sauce" },
  { name: "Cheese Corn Ball", category: "Chinese Starters", price: "250", isVeg: true, description: "Crispy breaded molten cheese and sweet corn balls" },
  { name: "Cheese Corn Croquette", category: "Chinese Starters", price: "300", isVeg: true, description: "Crunchy cylindrical croquettes stuffed with cheese and corn mash" },
  { name: "Paneer Satay", category: "Chinese Starters", price: "260", isVeg: true, description: "Grilled marinated paneer skewers served with rich dipping sauce" },
  { name: "Cheese Ball Manchurian", category: "Chinese Starters", price: "240", isVeg: true, description: "Golden cheese balls finished in spicy Chinese Manchurian gravy" },

  // ==========================================
  // TANDOORI STARTER / तंदूरी स्टार्टर्स
  // ==========================================
  { name: "Paneer Tikka", category: "Tandoori Starters (Veg)", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_tikka.jpg", description: "Clay oven roasted spiced cottage cheese cubes with bell peppers and onions" },
  { name: "Paneer Malai Tikka", category: "Tandoori Starters (Veg)", price: "300", isVeg: true, imageUrl: "/images/menu-items/paneer_tikka.jpg", description: "Mild, creamy paneer tikka marinated in cashew cream and cardamom" },
  { name: "Angara Malai Tikka", category: "Tandoori Starters (Veg)", price: "300", isVeg: true, description: "Charcoal smoked paneer tikka with rich malai marinade and spicy undertones" },
  { name: "Hariyali Paneer Tikka", category: "Tandoori Starters (Veg)", price: "250", isVeg: true, imageUrl: "/images/menu-items/paneer_tikka.jpg", description: "Paneer cubes marinated in fresh mint, coriander, and green chillies" },
  { name: "Paneer Lasuni Tikka", category: "Tandoori Starters (Veg)", price: "280", isVeg: true, description: "Tandoor roasted paneer infused with pungent roasted golden garlic" },
  { name: "Paneer Reshmi Tikka", category: "Tandoori Starters (Veg)", price: "280", isVeg: true, description: "Silky soft skewered paneer roasted with delicate spices" },
  { name: "Paneer Banjara Tikka", category: "Tandoori Starters (Veg)", price: "280", isVeg: true, description: "Rustic spiced tandoori paneer flavored with pounded cumin and coriander" },

  // ==========================================
  // PUNJABI ZAIKA / पंजाबी जायका
  // ==========================================
  { name: "Veg Hyderabadi", category: "Punjabi Zaika", price: "210", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Mixed vegetables cooked in spicy spinach and mint enriched Hyderabadi gravy" },
  { name: "Methi Matar Malai", category: "Punjabi Zaika", price: "220", isVeg: true, description: "Sweet and mildly bitter fenugreek leaves and green peas simmered in rich cream gravy" },
  { name: "Kaju Kari", category: "Punjabi Zaika", price: "260", isVeg: true, description: "Whole roasted cashews simmered in silky onion-cashew curry" },
  { name: "Kaju Masala", category: "Punjabi Zaika", price: "260", isVeg: true, description: "Golden roasted cashew nuts in spicy tomato-onion brown gravy" },
  { name: "Mix Vegetable", category: "Punjabi Zaika", price: "180", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Garden fresh seasonal vegetables cooked in homestyle spiced curry" },
  { name: "Aloo Matar", category: "Punjabi Zaika", price: "150", isVeg: true, description: "Classic comforting potato and green peas curry" },
  { name: "Aloo Palak", category: "Punjabi Zaika", price: "170", isVeg: true, description: "Diced potatoes cooked in smooth seasoned spinach gravy" },
  { name: "Aloo Jeera", category: "Punjabi Zaika", price: "140", isVeg: true, description: "Dry stir fried potatoes tempered with roasted cumin seeds and turmeric" },
  { name: "Aloo Gobi", category: "Punjabi Zaika", price: "170", isVeg: true, description: "Homestyle semi-dry preparation of spiced potatoes and cauliflower florets" },
  { name: "Plain Palak", category: "Punjabi Zaika", price: "120", isVeg: true, description: "Smooth seasoned pureed spinach cooked with subtle spices" },
  { name: "Lasuni Palak", category: "Punjabi Zaika", price: "200", isVeg: true, description: "Pureed spinach tempered with generous browned garlic and red chillies" },
  { name: "Green Peas Masala", category: "Punjabi Zaika", price: "170", isVeg: true, description: "Sweet green peas cooked in a rich onion and tomato masala" },
  { name: "Green Peas Fry", category: "Punjabi Zaika", price: "120", isVeg: true, description: "Dry pan-sautéed green peas with spices" },
  { name: "Baingan Masala", category: "Punjabi Zaika", price: "150", isVeg: true, description: "Baby eggplants cooked in roasted peanut, sesame and coconut masala" },
  { name: "Baingan Bharta", category: "Punjabi Zaika", price: "160", isVeg: true, description: "Smoky roasted mashed aubergine cooked with onions, tomatoes and garlic" },
  { name: "Dum Aloo Punjabi", category: "Punjabi Zaika", price: "200", isVeg: true, description: "Baby potatoes slow cooked dum style in spicy curd and tomato gravy" },
  { name: "Bhendi Masala", category: "Punjabi Zaika", price: "140", isVeg: true, description: "Okra sautéed with sliced onions, tomatoes and warm ground spices" },
  { name: "Bhendi Fry", category: "Punjabi Zaika", price: "150", isVeg: true, description: "Crisp pan fried okra with dry spices" },
  { name: "Veg Kolhapuri", category: "Punjabi Zaika", price: "200", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Fiery spicy mixed vegetables in authentic Kolhapuri red chilli gravy" },
  { name: "Methi Masala", category: "Punjabi Zaika", price: "160", isVeg: true, description: "Fresh fenugreek leaves tossed in onion tomato spiced gravy" },
  { name: "Shev Bhaji", category: "Punjabi Zaika", price: "180", isVeg: true, description: "Crisp gram flour sev served in spicy Maharashtrian rassa" },
  { name: "Veg Do Pyaza", category: "Punjabi Zaika", price: "220", isVeg: true, description: "Assorted vegetables cooked with diced crunchy onions in double measure" },
  { name: "Veg Kofta", category: "Punjabi Zaika", price: "240", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Vegetable dumplings simmered in rich creamy onion tomato gravy" },
  { name: "Veg Lahori", category: "Punjabi Zaika", price: "240", isVeg: true, description: "Lahori style rich spiced tomato curry with seasonal vegetables" },
  { name: "Veg Kadhai", category: "Punjabi Zaika", price: "240", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Mixed veggies cooked with bell peppers, onions and crushed coriander in wok" },
  { name: "Veg Maharaja", category: "Punjabi Zaika", price: "260", isVeg: true, description: "Royal preparation of vegetables with cashew and saffron infused gravy" },
  { name: "Veg Malvani", category: "Punjabi Zaika", price: "280", isVeg: true, description: "Konkan style coconut and roasted whole spice flavored vegetable curry" },
  { name: "Shevga Fry", category: "Punjabi Zaika", price: "180", isVeg: true, description: "Tender drumsticks pan fried in dry spices" },
  { name: "Shevga Handi", category: "Punjabi Zaika", price: "250", isVeg: true, description: "Drumsticks simmered in aromatic handi curry" },
  { name: "Veg Bhuna", category: "Punjabi Zaika", price: "200", isVeg: true, description: "Dry roasted vegetables in thick caramelized onion masala" },
  { name: "Veg Chilimili", category: "Punjabi Zaika", price: "200", isVeg: true, description: "Vegetables cooked with shredded cabbage and mixed chillies" },
  { name: "Cheese Kofta", category: "Punjabi Zaika", price: "240", isVeg: true, description: "Melted cheese stuffed dumplings in rich satin gravy" },
  { name: "Navratan Korma", category: "Punjabi Zaika", price: "240", isVeg: true, description: "Nine jewels of fruits, nuts and vegetables in mild sweet cashew sauce" },
  { name: "Mushroom Masala", category: "Punjabi Zaika", price: "220", isVeg: true, description: "Fresh button mushrooms cooked in thick spiced brown masala" },
  { name: "Mushroom Butter Masala", category: "Punjabi Zaika", price: "260", isVeg: true, description: "Button mushrooms simmered in buttery makhani gravy" },
  { name: "Veg Dilruba", category: "Punjabi Zaika", price: "220", isVeg: true, description: "Chef's special sweet and spicy vegetable delicacy" },
  { name: "Veg Angara", category: "Punjabi Zaika", price: "240", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Charcoal smoked spicy mixed vegetable curry" },

  // ==========================================
  // PANEER-E-KHAAS / पनीर ची खासियत
  // ==========================================
  { name: "Paneer Masala", category: "Paneer-E-Khaas", price: "200", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Cottage cheese cubes simmered in spiced onion-tomato gravy" },
  { name: "Palak Paneer", category: "Paneer-E-Khaas", price: "210", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Fresh cottage cheese in smooth seasoned spinach gravy" },
  { name: "Paneer Butter Masala", category: "Paneer-E-Khaas", price: "230", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Paneer cubes cooked in velvety buttery tomato-cashew makhani sauce" },
  { name: "Paneer Cheese Butter Masala", category: "Paneer-E-Khaas", price: "260", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Rich butter masala loaded with both paneer cubes and melted cheese" },
  { name: "Paneer Tikka Masala", category: "Paneer-E-Khaas", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_tikka.jpg", description: "Tandoori grilled paneer chunks in robust spicy gravy" },
  { name: "Paneer Kadhai", category: "Paneer-E-Khaas", price: "220", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Paneer cooked with crisp bell peppers, onions and crushed kadhai spices" },
  { name: "Paneer Handi", category: "Paneer-E-Khaas", price: "300", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Slow earthen pot simmered rich aromatic cottage cheese curry" },
  { name: "Paneer Saoji", category: "Paneer-E-Khaas", price: "240", isVeg: true, description: "Fiery Vidarbha Saoji style black spice gravy with paneer" },
  { name: "Paneer Kolhapuri", category: "Paneer-E-Khaas", price: "240", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Extra spicy Kolhapuri red chilli gravy cottage cheese" },
  { name: "Matar Paneer", category: "Paneer-E-Khaas", price: "210", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Classic homestyle green peas and soft cottage cheese curry" },
  { name: "Paneer Lacchedar", category: "Paneer-E-Khaas", price: "230", isVeg: true, description: "Grated and layered paneer cooked in thick aromatic gravy" },
  { name: "Paneer Do Pyaza", category: "Paneer-E-Khaas", price: "220", isVeg: true, description: "Paneer cooked with generous double portions of crunchy onions" },
  { name: "Paneer Kofta", category: "Paneer-E-Khaas", price: "250", isVeg: true, description: "Soft melt-in-mouth cottage cheese dumplings in rich cashew sauce" },
  { name: "Paneer Chingari", category: "Paneer-E-Khaas", price: "240", isVeg: true, description: "Fiery sizzling hot spiced paneer preparation" },
  { name: "Paneer Kaju Masala", category: "Paneer-E-Khaas", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Decadent union of paneer and roasted whole cashews in royal gravy" },
  { name: "Paneer Mushroom Masala", category: "Paneer-E-Khaas", price: "280", isVeg: true, description: "Fresh button mushrooms and soft paneer cooked together in brown gravy" },
  { name: "Paneer Cheese Masala", category: "Paneer-E-Khaas", price: "250", isVeg: true, description: "Paneer tossed in spicy gravy topped with gooey cheese" },
  { name: "Paneer Pasanda", category: "Paneer-E-Khaas", price: "250", isVeg: true, description: "Stuffed paneer triangles cooked in delicate creamy nut gravy" },
  { name: "Paneer Maharaja", category: "Paneer-E-Khaas", price: "250", isVeg: true, description: "Regal preparation of cottage cheese in saffron-tinted rich sauce" },
  { name: "Paneer Laziz", category: "Paneer-E-Khaas", price: "230", isVeg: true, description: "Mild, creamy and flavorful cottage cheese preparation" },
  { name: "Paneer Tadkawala", category: "Paneer-E-Khaas", price: "260", isVeg: true, description: "Cottage cheese finished with a sizzling desi ghee and garlic tadka" },

  // ==========================================
  // SUMAN SPECIAL / सुमन स्पेशल
  // ==========================================
  { name: "Paneer Chatpata", category: "Suman Special Main Course", price: "280", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Zesty, tangy and spicy cottage cheese speciality" },
  { name: "Veg Patiyala", category: "Suman Special Main Course", price: "290", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Patiyala style roll stuffed with vegetable mash simmered in rich gravy" },
  { name: "Paneer Mumtaz", category: "Suman Special Main Course", price: "250", isVeg: true, description: "Royal Mughlai paneer cooked with cream and dry fruits" },
  { name: "Paneer Lababdar", category: "Suman Special Main Course", price: "260", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Lush tomato-onion gravy with grated paneer and cottage cheese chunks" },
  { name: "Paneer Laung Lata", category: "Suman Special Main Course", price: "280", isVeg: true, description: "Clove-infused aromatic cottage cheese parcels cooked in exotic sauce" },
  { name: "Paneer Khurchand", category: "Suman Special Main Course", price: "280", isVeg: true, description: "Scraped tawa style rich paneer preparation with bell peppers" },
  { name: "Paneer Rajwadi", category: "Suman Special Main Course", price: "300", isVeg: true, description: "Rajasthani royal spicy rich gravy with tender paneer" },
  { name: "Veg Diwani Handi", category: "Suman Special Main Course", price: "320", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Grand clay pot cooked vegetable medley in spinach and cashew gravy" },
  { name: "Veg Jaipuri", category: "Suman Special Main Course", price: "250", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Rajasthani vegetable curry garnished with roasted papad crunch" },
  { name: "Paneer Patiyala", category: "Suman Special Main Course", price: "330", isVeg: true, imageUrl: "/images/menu-items/paneer_dish.jpg", description: "Chef's signature double-gravy Patiyala paneer roll" },
  { name: "Veg Handi", category: "Suman Special Main Course", price: "280", isVeg: true, imageUrl: "/images/menu-items/veg_curry.jpg", description: "Slow earthen pot simmered rustic vegetable curry" },
  { name: "Kashmiri Dum Aloo", category: "Suman Special Main Course", price: "220", isVeg: true, description: "Whole stuffed potatoes cooked in sweet and mildly spiced fennel gravy" },
  { name: "Paneer Moghlai", category: "Suman Special Main Course", price: "300", isVeg: true, description: "Regal Mughlai cottage cheese dish in almond and saffron gravy" },

  // ==========================================
  // JAIN SPECIAL / जैन स्पेशल
  // ==========================================
  { name: "Jain Shahi Paneer", category: "Jain Special", price: "240", isVeg: true, description: "No onion no garlic royal cottage cheese in sweet tomato-cashew cream gravy" },
  { name: "Jain Matar Paneer", category: "Jain Special", price: "210", isVeg: true, description: "Green peas and cottage cheese prepared strictly in Jain recipe" },
  { name: "Jain Methi Fry", category: "Jain Special", price: "150", isVeg: true, description: "Fresh fenugreek leaves pan-sautéed without onion and garlic" },
  { name: "Jain Palak Paneer", category: "Jain Special", price: "260", isVeg: true, description: "Smooth spinach gravy with paneer cooked as per Jain traditions" },
  { name: "Jain Navratan Korma", category: "Jain Special", price: "240", isVeg: true, description: "Exotic mild sweet nut and fruit korma cooked without onion and garlic" },
  { name: "Jain Paneer Bhurji", category: "Jain Special", price: "200", isVeg: true, description: "Scrambled paneer with tomatoes and green chillies (Jain style)" },
  { name: "Jain Bhindi Fry", category: "Jain Special", price: "150", isVeg: true, description: "Crisp dry pan fried okra prepared without onion or garlic" },
  { name: "Jain Dal Fry", category: "Jain Special", price: "140", isVeg: true, description: "Yellow lentil tempered with cumin and tomatoes, strictly no onion/garlic" },

  // ==========================================
  // CHINESE RICE / चायनीज राईस
  // ==========================================
  { name: "Veg Fried Rice", category: "Chinese Rice (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Wok-tossed basmati rice with finely chopped carrots, beans and cabbage" },
  { name: "Veg Schezwan Fried Rice", category: "Chinese Rice (Veg)", price: "180", isVeg: true, imageUrl: "/images/menu-items/fried_rice.jpg", description: "Spicy Schezwan sauce infused wok-fried rice with vegetables" },
  { name: "Singapore Rice", category: "Chinese Rice (Veg)", price: "220", isVeg: true, description: "Turmeric and curry spiced Singaporean yellow fried rice with vegetables" },
  { name: "Triple Schezwan Rice", category: "Chinese Rice (Veg)", price: "240", isVeg: true, description: "Fried rice, noodles and crispy elements served with spicy Schezwan gravy" },
  { name: "Manchurian Fried Rice", category: "Chinese Rice (Veg)", price: "190", isVeg: true, description: "Wok fried rice tossed with vegetable manchurian balls" },
  { name: "Manchurian Schezwan Fried Rice", category: "Chinese Rice (Veg)", price: "210", isVeg: true, description: "Spicy Schezwan fried rice with crispy vegetable manchurian balls" },
  { name: "Paneer Fried Rice", category: "Chinese Rice (Veg)", price: "220", isVeg: true, description: "Basmati rice wok tossed with spiced golden paneer cubes" },
  { name: "Paneer Schezwan Rice", category: "Chinese Rice (Veg)", price: "230", isVeg: true, description: "Fiery Schezwan fried rice loaded with tender paneer" },
  { name: "Hongkong Rice", category: "Chinese Rice (Veg)", price: "240", isVeg: true, description: "Hong Kong style mildly sweet and savoury vegetable fried rice" },
  { name: "Paneer Garlic Fried Rice", category: "Chinese Rice (Veg)", price: "200", isVeg: true, description: "Aromatic burnt garlic wok tossed rice with fresh paneer" },
  { name: "Paneer Palak Fried Rice", category: "Chinese Rice (Veg)", price: "180", isVeg: true, description: "Healthy spinach pureed wok-tossed green rice with paneer" },
  { name: "Palak Rice", category: "Chinese Rice (Veg)", price: "170", isVeg: true, description: "Fragrant seasoned spinach wok rice with vegetables" },
  { name: "Garlic Fried Rice", category: "Chinese Rice (Veg)", price: "190", isVeg: true, description: "Golden toasted garlic flavored wok fried rice" },
  { name: "Green Chilli Pot Rice", category: "Chinese Rice (Veg)", price: "250", isVeg: true, description: "Clay pot served rice covered with spicy green chilli oriental gravy" },
  { name: "Suman Special Sizzler Rice", category: "Chinese Rice (Veg)", price: "300", isVeg: true, description: "Sizzling platter of seasoned rice, noodles, patties and exotic vegetables" },

  // ==========================================
  // CHINESE NOODLES / चायनीज नूडल्स
  // ==========================================
  { name: "Veg Hakka Noodle", category: "Chinese Noodles (Veg)", price: "150", isVeg: true, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Classic stir fried Hakka noodles with julienned vegetables" },
  { name: "Manchurian Noodles", category: "Chinese Noodles (Veg)", price: "200", isVeg: true, description: "Stir-fried noodles combined with crispy vegetable manchurian balls" },
  { name: "Manchurian Schezwan Noodles", category: "Chinese Noodles (Veg)", price: "220", isVeg: true, description: "Fiery Schezwan noodles served with manchurian balls" },
  { name: "Schezwan Noodles", category: "Chinese Noodles (Veg)", price: "200", isVeg: true, imageUrl: "/images/menu-items/hakka_noodles.jpg", description: "Spicy wok noodles tossed in homemade Schezwan sauce" },
  { name: "Hongkong Noodles", category: "Chinese Noodles (Veg)", price: "240", isVeg: true, description: "Hong Kong style sweet & spicy vegetable noodles" },
  { name: "Singapore Noodles", category: "Chinese Noodles (Veg)", price: "240", isVeg: true, description: "Yellow curry powder spiced Singaporean noodles" },
  { name: "Garlic Noodles", category: "Chinese Noodles (Veg)", price: "200", isVeg: true, description: "Noodles tossed with aromatic toasted golden garlic" },
  { name: "Paneer Noodles", category: "Chinese Noodles (Veg)", price: "220", isVeg: true, description: "Hakka noodles wok-tossed with cottage cheese cubes" },
  { name: "Paneer Schezwan Noodles", category: "Chinese Noodles (Veg)", price: "240", isVeg: true, description: "Spicy Schezwan noodles with cottage cheese" },
  { name: "Triple Noodles", category: "Chinese Noodles (Veg)", price: "260", isVeg: true, description: "Combination of noodles, rice and crispies with Schezwan gravy" },

  // ==========================================
  // DAL / डाळ
  // ==========================================
  { name: "Plain Dal", category: "Dal Specialities", price: "100", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Simple boiled yellow lentils with turmeric and light salt" },
  { name: "Dal Fry", category: "Dal Specialities", price: "140", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Yellow lentils tempered with cumin, onions, garlic and tomatoes" },
  { name: "Dal Tadka", category: "Dal Specialities", price: "150", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Creamy yellow dal topped with a sizzling tadka of ghee, garlic, and dried red chillies" },
  { name: "Kolhapuri Dal", category: "Dal Specialities", price: "180", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Spicy Maharashtrian style dal cooked with authentic Kolhapuri masala" },

  // ==========================================
  // RICE / राईस
  // ==========================================
  { name: "Steam Rice (Half)", category: "Rice & Biryani", price: "60", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Steamed fluffy long grain basmati rice (Half)" },
  { name: "Steam Rice (Full)", category: "Rice & Biryani", price: "100", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Steamed fluffy long grain basmati rice (Full)" },
  { name: "Jeera Rice (Half)", category: "Rice & Biryani", price: "70", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Basmati rice tempered with roasted cumin seeds and desi ghee (Half)" },
  { name: "Jeera Rice (Full)", category: "Rice & Biryani", price: "120", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Basmati rice tempered with roasted cumin seeds and desi ghee (Full)" },
  { name: "Masala Rice", category: "Rice & Biryani", price: "180", isVeg: true, imageUrl: "/images/menu-items/rice_dish.jpg", description: "Spicy traditional Maharashtrian spiced rice with vegetables" },
  { name: "Dal Khichadi Plain", category: "Rice & Biryani", price: "150", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Gentle comforting rice and yellow lentil khichadi" },
  { name: "Dal Khichadi", category: "Rice & Biryani", price: "180", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Homestyle dal khichadi cooked with onions, tomatoes and cumin" },
  { name: "Dal Khichadi Tadka", category: "Rice & Biryani", price: "200", isVeg: true, imageUrl: "/images/menu-items/dal.jpg", description: "Dal khichadi elevated with a sizzling desi ghee and garlic tadka" },
  { name: "Veg Matka Biryani", category: "Rice & Biryani", price: "200", isVeg: true, imageUrl: "/images/menu-items/biryani.jpg", description: "Slow cooked vegetable dum biryani served in traditional earthen matka pot" },
  { name: "Hyderabadi Matka Biryani", category: "Rice & Biryani", price: "250", isVeg: true, imageUrl: "/images/menu-items/biryani.jpg", description: "Spicy Hyderabadi dum biryani layered with aromatic rice and vegetables in matka" },
  { name: "Spl. Veg Matka Biryani", category: "Rice & Biryani", price: "280", isVeg: true, imageUrl: "/images/menu-items/biryani.jpg", description: "Chef's special matka biryani loaded with marinated paneer, kaju and vegetables" },

  // ==========================================
  // TANDOORI ROTI / तंदूर रोटी
  // ==========================================
  { name: "Tandoor Roti", category: "Tandoori Roti & Breads", price: "20", isVeg: true, description: "Crisp tandoori flatbread baked in clay oven" },
  { name: "Tandoor Roti (Wheat)", category: "Tandoori Roti & Breads", price: "20", isVeg: true, description: "100% whole wheat flour tandoori roti" },
  { name: "Butter Roti", category: "Tandoori Roti & Breads", price: "30", isVeg: true, description: "Tandoor baked roti brushed with fresh butter" },
  { name: "Butter Roti (Wheat)", category: "Tandoori Roti & Breads", price: "30", isVeg: true, description: "Whole wheat tandoori roti glazed with melting butter" },
  { name: "Naan", category: "Tandoori Roti & Breads", price: "40", isVeg: true, description: "Traditional soft and leavened tandoor flatbread" },
  { name: "Butter Naan", category: "Tandoori Roti & Breads", price: "60", isVeg: true, description: "Soft tandoori naan brushed with rich butter" },
  { name: "Garlic Naan", category: "Tandoori Roti & Breads", price: "80", isVeg: true, description: "Naan topped with fragrant minced roasted garlic and butter" },
  { name: "Plain Paratha", category: "Tandoori Roti & Breads", price: "50", isVeg: true, imageUrl: "/images/menu-items/paratha.jpg", description: "Layered whole wheat paratha baked in clay tandoor" },
  { name: "Butter Paratha", category: "Tandoori Roti & Breads", price: "70", isVeg: true, imageUrl: "/images/menu-items/paratha.jpg", description: "Crispy flaky layered paratha smeared with rich butter" },
  { name: "Aloo Paratha", category: "Tandoori Roti & Breads", price: "100", isVeg: true, imageUrl: "/images/menu-items/paratha.jpg", description: "Whole wheat paratha generously stuffed with spiced mashed potatoes" },
  { name: "Paneer Paratha", category: "Tandoori Roti & Breads", price: "140", isVeg: true, imageUrl: "/images/menu-items/paratha.jpg", description: "Paratha stuffed with seasoned cottage cheese mash" },
  { name: "Plain Kulcha", category: "Tandoori Roti & Breads", price: "60", isVeg: true, description: "Soft leavened tandoori flatbread" },
  { name: "Butter Kulcha", category: "Tandoori Roti & Breads", price: "80", isVeg: true, description: "Warm flaky tandoori kulcha smeared with butter" },
  { name: "Stuff Kulcha", category: "Tandoori Roti & Breads", price: "120", isVeg: true, description: "Tandoor baked kulcha stuffed with spiced vegetable mash" },

  // ==========================================
  // PAPAD / पापड
  // ==========================================
  { name: "Roast Papad", category: "Papad & Sides", price: "20", isVeg: true, description: "Crisp flame-roasted light urad papad" },
  { name: "Fry Papad", category: "Papad & Sides", price: "30", isVeg: true, description: "Golden deep fried crunchy papad" },
  { name: "Masala Papad", category: "Papad & Sides", price: "50", isVeg: true, description: "Roasted papad topped with chopped onions, tomatoes, coriander and chaat masala" },

  // ==========================================
  // THALI / थाळी
  // ==========================================
  { name: "Suman Special Thali", category: "Thali", price: "260", isVeg: true, imageUrl: "/images/menu-items/thali.jpg", description: "Paneer Tadkawala, Aloo Gobhi, 2 Laccha Paratha, Dal Tadka, Jeera Rice, Gulab Jamun, Raita, Papad & Salad" },

  // ==========================================
  // SANDWICH / सँडविच
  // ==========================================
  { name: "Veg Sandwich", category: "Sandwiches & Grills", price: "60", isVeg: true, imageUrl: "/images/menu-items/sandwich.jpg", description: "Fresh sliced cucumber, tomato, potato and mint chutney sandwich" },
  { name: "Veg Cheese Sandwich", category: "Sandwiches & Grills", price: "80", isVeg: true, imageUrl: "/images/menu-items/sandwich.jpg", description: "Cold vegetable sandwich layered with cheese slice" },
  { name: "Jain Veg Sandwich", category: "Sandwiches & Grills", price: "50", isVeg: true, imageUrl: "/images/menu-items/sandwich.jpg", description: "No onion no potato vegetable sandwich as per Jain preparation" },
  { name: "Jain Veg Cheese Sandwich", category: "Sandwiches & Grills", price: "70", isVeg: true, imageUrl: "/images/menu-items/sandwich.jpg", description: "Jain vegetable sandwich with melted cheese" },
  { name: "Bread Butter Jam", category: "Sandwiches & Grills", price: "60", isVeg: true, description: "Classic bread layered with butter and sweet mixed fruit jam" },

  // ==========================================
  // GRILLED SANDWICH / ग्रिल्ड सँडविच
  // ==========================================
  { name: "Cheese Grill Sandwich", category: "Sandwiches & Grills", price: "100", isVeg: true, imageUrl: "/images/menu-items/grilled_sandwich.jpg", description: "Crispy grilled sandwich loaded with melted cheese and spices" },
  { name: "Veg Cheese Grill Sandwich", category: "Sandwiches & Grills", price: "110", isVeg: true, imageUrl: "/images/menu-items/grilled_sandwich.jpg", description: "Toasted grilled sandwich stuffed with vegetables and cheese" },
  { name: "Cheese Corn Grill Sandwich", category: "Sandwiches & Grills", price: "120", isVeg: true, imageUrl: "/images/menu-items/grilled_sandwich.jpg", description: "Sweet corn and molten cheese grilled between buttered bread" },
  { name: "Paneer Grill Cheese Sandwich", category: "Sandwiches & Grills", price: "150", isVeg: true, imageUrl: "/images/menu-items/grilled_sandwich.jpg", description: "Grilled sandwich stuffed with spiced paneer and cheese" },
  { name: "Spl. Napoleon Grilled Sandwich", category: "Sandwiches & Grills", price: "160", isVeg: true, imageUrl: "/images/menu-items/grilled_sandwich.jpg", description: "Triple layered chef special grilled sandwich loaded with sauces, veggies and cheese" },
  { name: "Chocolate Grill Sandwich", category: "Sandwiches & Grills", price: "100", isVeg: true, imageUrl: "/images/menu-items/chocolate_sandwich.jpg", description: "Warm grilled sandwich stuffed with rich melting chocolate spread" },
  { name: "Jam Grill Sandwich", category: "Sandwiches & Grills", price: "80", isVeg: true, description: "Crisp grilled sweet sandwich layered with mixed fruit jam" },

  // ==========================================
  // PIZZA / पिझ्झा
  // ==========================================
  { name: "Veg Cheese Pizza", category: "Pizza & Burgers", price: "160", isVeg: true, imageUrl: "/images/menu-items/veg_pizza.jpg", description: "Crisp baked pizza base topped with pizza sauce, veggies and mozzarella cheese" },
  { name: "Corn Cheese Pizza", category: "Pizza & Burgers", price: "180", isVeg: true, imageUrl: "/images/menu-items/veg_pizza.jpg", description: "Golden sweet corn and abundant melted cheese on pizza base" },
  { name: "Paneer Cheese Pizza", category: "Pizza & Burgers", price: "200", isVeg: true, imageUrl: "/images/menu-items/paneer_pizza.jpg", description: "Marinated spiced paneer chunks with capsicum, onion and cheese" },
  { name: "Special Pizza", category: "Pizza & Burgers", price: "220", isVeg: true, imageUrl: "/images/menu-items/pizza.jpg", description: "Deluxe pizza loaded with assorted vegetables, olives, corn and extra cheese" },

  // ==========================================
  // BURGER / बर्गर
  // ==========================================
  { name: "Veg Tikki Burger", category: "Pizza & Burgers", price: "80", isVeg: true, imageUrl: "/images/menu-items/burger.jpg", description: "Crispy spiced vegetable patty in soft toasted bun with lettuce and mayo" },
  { name: "Veg Cheese Tikki Burger", category: "Pizza & Burgers", price: "110", isVeg: true, imageUrl: "/images/menu-items/burger.jpg", description: "Crispy veg burger served with an extra slice of melting cheese" },

  // ==========================================
  // FRENCH FRIES / फ्रेंच फ्राईज
  // ==========================================
  { name: "Salted French Fries", category: "French Fries", price: "100", isVeg: true, imageUrl: "/images/menu-items/fries.jpg", description: "Crisp golden potato fries lightly salted" },
  { name: "Peri Peri French Fries", category: "French Fries", price: "120", isVeg: true, imageUrl: "/images/menu-items/peri_peri_fries.jpg", description: "Crispy fries tossed in zesty and spicy peri-peri seasoning" },

  // ==========================================
  // DESSERT / डेझर्ट
  // ==========================================
  { name: "Spl. Sizzling Brownie Ice-Cream", category: "Desserts", price: "160", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Warm walnut brownie served on a hot sizzler plate with vanilla ice cream and hot chocolate sauce" },
  { name: "Choco Lava Cake", category: "Desserts", price: "100", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Decadent chocolate cake with a molten liquid chocolate core" },
  { name: "Ice-cream Scoop", category: "Desserts", price: "40", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Scoop of creamy premium ice cream" },

  // ==========================================
  // FRESH JUICE / फ्रेश ज्यूस
  // ==========================================
  { name: "Mosambi Juice", category: "Fresh Juices", price: "70", isVeg: true, imageUrl: "/images/menu-items/fruit_juice.jpg", description: "Freshly squeezed sweet lime juice" },
  { name: "Orange Juice", category: "Fresh Juices", price: "70", isVeg: true, imageUrl: "/images/menu-items/fruit_juice.jpg", description: "Tangy sweet freshly squeezed orange juice" },
  { name: "Pineapple Juice", category: "Fresh Juices", price: "60", isVeg: true, imageUrl: "/images/menu-items/fruit_juice.jpg", description: "Fresh tropical pineapple juice" },
  { name: "Pomegranate Juice", category: "Fresh Juices", price: "80", isVeg: true, imageUrl: "/images/menu-items/fruit_juice.jpg", description: "Pure fresh ruby red pomegranate juice" },
  { name: "Ganga Jamuna Juice", category: "Fresh Juices", price: "100", isVeg: true, imageUrl: "/images/menu-items/fruit_juice.jpg", description: "Refreshing blend of sweet lime (mosambi) and orange juices" },
  { name: "Maramari Juice", category: "Fresh Juices", price: "100", isVeg: true, imageUrl: "/images/menu-items/fruit_juice.jpg", description: "Classic fusion of pineapple and mosambi juice" },

  // ==========================================
  // MILKSHAKE / मिल्कशेक
  // ==========================================
  { name: "Rose Milkshake", category: "Milkshakes", price: "60", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Chilled fragrant rose syrup blended with creamy milk" },
  { name: "Kesar Milkshake", category: "Milkshakes", price: "70", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Saffron flavored rich chilled milkshake" },
  { name: "Vanilla Milkshake", category: "Milkshakes", price: "60", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Classic smooth vanilla milkshake" },
  { name: "Mango Milkshake", category: "Milkshakes", price: "70", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Rich mango pulp blended with chilled milk" },
  { name: "Pineapple Milkshake", category: "Milkshakes", price: "70", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Tropical pineapple flavored creamy milkshake" },
  { name: "Strawberry Milkshake", category: "Milkshakes", price: "70", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Sweet strawberry blended milkshake" },
  { name: "Badam Milkshake", category: "Milkshakes", price: "80", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Nutritious roasted almond flavored milk" },
  { name: "Pista Milkshake", category: "Milkshakes", price: "80", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Rich pistachio flavored creamy milkshake" },
  { name: "Mixed Dry-fruit Milkshake", category: "Milkshakes", price: "100", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Heavy blended shake loaded with almonds, cashews and raisins" },
  { name: "Anjeer Milkshake", category: "Milkshakes", price: "100", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Healthy dried fig blended milk drink" },
  { name: "Oreo Milkshake", category: "Milkshakes", price: "70", isVeg: true, imageUrl: "/images/menu-items/milkshake.jpg", description: "Thick milkshake blended with crushed Oreo cookies" },
  { name: "Chocolate Milkshake", category: "Milkshakes", price: "70", isVeg: true, imageUrl: "/images/menu-items/chocolate_shake.jpg", description: "Rich cocoa and chocolate syrup blended milkshake" },
  { name: "Extra Ice-cream Scoop", category: "Milkshakes", price: "40", isVeg: true, description: "Extra scoop of rich ice cream" },

  // ==========================================
  // MASTANI & FALOODA / मस्तानी व फालुदा
  // ==========================================
  { name: "Mango Mastani", category: "Mastani & Falooda", price: "90", isVeg: true, imageUrl: "/images/menu-items/mango_mastani.jpg", description: "Pune's famous thick mango shake topped with ice cream, cherries and dry fruits" },
  { name: "Bajirao Mastani", category: "Mastani & Falooda", price: "100", isVeg: true, imageUrl: "/images/menu-items/mango_mastani.jpg", description: "Royal creamy mixed fruit mastani with rich ice cream toppings" },
  { name: "Dry-Fruit Mastani", category: "Mastani & Falooda", price: "120", isVeg: true, imageUrl: "/images/menu-items/mango_mastani.jpg", description: "Loaded dry fruit shake topped with premium ice cream and roasted nuts" },
  { name: "Kesar Pista Mastani", category: "Mastani & Falooda", price: "110", isVeg: true, imageUrl: "/images/menu-items/mango_mastani.jpg", description: "Saffron and pistachio flavored thick mastani with ice cream" },
  { name: "Special Mastani", category: "Mastani & Falooda", price: "140", isVeg: true, imageUrl: "/images/menu-items/mango_mastani.jpg", description: "Chef's ultimate mastani loaded with assorted fruits, nuts and multiple scoops" },
  { name: "Rose Falooda", category: "Mastani & Falooda", price: "100", isVeg: true, description: "Chilled rose milk layered with falooda sev, sabja seeds and rose ice cream" },
  { name: "Royal Falooda", category: "Mastani & Falooda", price: "120", isVeg: true, description: "Deluxe falooda with dry fruits, jelly, sabja and ice cream" },
  { name: "Kesar Falooda", category: "Mastani & Falooda", price: "110", isVeg: true, description: "Saffron flavored milk with falooda sev and kesar ice cream" },
  { name: "Mango Falooda", category: "Mastani & Falooda", price: "100", isVeg: true, description: "Fresh mango puree layered with vermicelli and ice cream" },
  { name: "Dilkhush Falooda", category: "Mastani & Falooda", price: "130", isVeg: true, description: "Special layered falooda loaded with rabdi, jelly, nuts and ice cream" },

  // ==========================================
  // FRUIT SALAD & SUNDAES
  // ==========================================
  { name: "Fruit Salad", category: "Fruit Salad & Sundaes", price: "80", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Bowl of freshly sliced seasonal fruits" },
  { name: "Fruit Salad with Ice-Cream", category: "Fruit Salad & Sundaes", price: "120", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Fresh chopped fruits served with creamy vanilla ice cream" },
  { name: "Single Sundae", category: "Fruit Salad & Sundaes", price: "110", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Single scoop sundae drizzled with sauce and nuts" },
  { name: "Double Sundae", category: "Fruit Salad & Sundaes", price: "130", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Two scoops of ice cream topped with chocolate syrup, nuts and wafer" },
  { name: "Triple Sundae", category: "Fruit Salad & Sundaes", price: "150", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Three distinct ice cream flavors topped with assorted syrups and sprinkles" },
  { name: "Special Sundae", category: "Fruit Salad & Sundaes", price: "170", isVeg: true, imageUrl: "/images/menu-items/dessert.jpg", description: "Deluxe ice cream sundae loaded with fruits, nuts and chocolate fudge" },

  // ==========================================
  // MOCKTAILS & MOJITOS
  // ==========================================
  { name: "Fruit Punch Mocktail", category: "Mocktails & Mojitos", price: "120", isVeg: true, imageUrl: "/images/menu-items/mocktail.jpg", description: "Refreshing blend of mixed fruit juices and grenadine" },
  { name: "Pink Lady Mocktail", category: "Mocktails & Mojitos", price: "100", isVeg: true, imageUrl: "/images/menu-items/mocktail.jpg", description: "Sweet and bubbly pink mocktail flavored with strawberry and soda" },
  { name: "Pineapple Mocktail", category: "Mocktails & Mojitos", price: "110", isVeg: true, imageUrl: "/images/menu-items/mocktail.jpg", description: "Tangy pineapple and mint sparkler" },
  { name: "Cranberry Ginger Mocktail", category: "Mocktails & Mojitos", price: "110", isVeg: true, imageUrl: "/images/menu-items/mocktail.jpg", description: "Tart cranberry juice paired with fiery ginger and soda" },
  { name: "Virgin Mojito", category: "Mocktails & Mojitos", price: "80", isVeg: true, imageUrl: "/images/menu-items/mojito.jpg", description: "Classic muddled mint leaves, lime wedges, sugar syrup and sparkling soda" },
  { name: "Pineapple Mojito", category: "Mocktails & Mojitos", price: "100", isVeg: true, imageUrl: "/images/menu-items/mojito.jpg", description: "Tropical pineapple twist to the classic lime-mint mojito" },
  { name: "Watermelon Mojito", category: "Mocktails & Mojitos", price: "100", isVeg: true, imageUrl: "/images/menu-items/mojito.jpg", description: "Fresh watermelon juice with crushed mint and soda" },

  // ==========================================
  // LASSI & COLD COFFEE
  // ==========================================
  { name: "Plain Lassi", category: "Lassi & Cold Coffee", price: "50", isVeg: true, description: "Traditional sweet churned yogurt drink" },
  { name: "Mango Lassi With Ice-Cream", category: "Lassi & Cold Coffee", price: "80", isVeg: true, description: "Sweet mango yogurt lassi served with a scoop of vanilla ice cream" },
  { name: "Kesar Lassi With Ice-Cream", category: "Lassi & Cold Coffee", price: "80", isVeg: true, description: "Saffron infused sweet lassi with ice cream" },
  { name: "Strawberry Lassi With Ice-Cream", category: "Lassi & Cold Coffee", price: "80", isVeg: true, description: "Strawberry flavored chilled lassi with ice cream" },
  { name: "Thick Cold Coffee", category: "Lassi & Cold Coffee", price: "60", isVeg: true, imageUrl: "/images/menu-items/thick_cold_coffee.jpg", description: "Thick and creamy coffee blended with milk and ice cream" },
  { name: "Thick Cold Coffee with Crush", category: "Lassi & Cold Coffee", price: "90", isVeg: true, imageUrl: "/images/menu-items/thick_cold_coffee.jpg", description: "Thick cold coffee topped with chocolate crush and chocolate syrup" },
];

async function seedHotelSumanMenu() {
  console.log("Searching for restaurant 'Suman pure veg' / 'Hotel Suman'...");

  const provider = await db.query.serviceProviders.findFirst({
    where: ilike(serviceProviders.businessName, "%suman%"),
  });

  if (!provider) {
    console.error("❌ Restaurant 'Hotel Suman' not found in database!");
    process.exit(1);
  }

  console.log(`Found provider: ${provider.businessName} (ID: ${provider.id})`);

  // Update provider availability to true
  await db.update(serviceProviders)
    .set({ isAvailable: true })
    .where(eq(serviceProviders.id, provider.id));
  console.log("Set provider isAvailable = true.");

  // Delete existing items for clean update
  await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, provider.id));
  console.log("Cleared any existing items for Hotel Suman.");

  console.log(`Inserting ${menuItems.length} menu items...`);

  let insertedCount = 0;
  for (const item of menuItems) {
    await db.insert(restaurantMenuItems).values({
      id: createId(),
      providerId: provider.id,
      name: item.name,
      category: item.category,
      price: Math.round(parseFloat(item.price) * 1.15).toFixed(2),
      isVeg: true, // Hotel Suman is 100% Pure Veg!
      description: item.description,
      imageUrl: item.imageUrl || null,
      isAvailable: true,
      cuisine: "Pure Veg / North Indian / Chinese / Chaat / Fast Food",
    });
    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} menu items for '${provider.businessName}'!`);

  // Print summary by category
  const categories = Array.from(new Set(menuItems.map(i => i.category)));
  console.log("\nSummary by Category:");
  for (const cat of categories) {
    const count = menuItems.filter(i => i.category === cat).length;
    console.log(`  - 🟢 [VEG] ${cat}: ${count} items`);
  }

  process.exit(0);
}

seedHotelSumanMenu().catch(err => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
