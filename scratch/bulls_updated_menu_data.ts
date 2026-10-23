import { config } from "dotenv";
import fs from "fs";
config();

// Define all items directly transcribed from the two menu card images.
// Card base price -> calculate +15% with Math.round(cardPrice * 1.15)
// Categories are structured cleanly:
// Merged categories:
// - "Veg Sandwich" (merges Non Grilled, Grilled Sandwich 2 Slice, 3 Slice Sandwich)
// - "Pizza (Veg)" (merges Simply Veg, Classic Veg, Signature Veg, Exotic Veg)
// - "Pizza (Non-Veg)" (merges Simply Chicken, Classic Chicken, Signature Chicken, Exotic Chicken)
// - "Veg Starters"
// - "Non-Veg Starters"
// - "Veg Burger"
// - "Non-Veg Burger"
// - "Momos (Veg)"
// - "Momos (Non-Veg)"
// - "Chicken Wings"
// - "Veg Pizza Combo"
// - "Non-Veg Pizza Combo"
// - "Beverages & Coffee" (merges Coffee, Mocktails, Cold Drink, Water)
// - "Desserts" (Choco Lava Cake)
// - "Add-Ons & Extras" (Extra cheese, cheese slice, toppings)
// - "Special Daily Offers" (Corn with Cheese Pizza, Herb Chicken Pizza)

export interface MenuCardItem {
  name: string;
  category: string;
  subCategory?: string; // e.g. "Simply Veg", "Classic Veg", "3 Slice", etc.
  cardPrice: number;
  finalPrice: number;
  isVeg: boolean;
  description?: string;
}

function calcPrice(p: number): number {
  return Math.round(p * 1.15);
}

export const updatedBullsMenu: MenuCardItem[] = [
  // ==========================================
  // 1. PIZZA (NON-VEG)
  // ==========================================
  // Simply Chicken
  {
    name: "Cheesy Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Simply Chicken",
    cardPrice: 140,
    finalPrice: calcPrice(140), // 161
    isVeg: false,
    description: "Sauce, Plain Chicken & Mozzarella Cheese"
  },
  {
    name: "Simple Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Simply Chicken",
    cardPrice: 150,
    finalPrice: calcPrice(150), // 173
    isVeg: false,
    description: "Pizza Sauce, Onion, Chicken & Mozzarella Cheese"
  },
  {
    name: "Zesty Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Simply Chicken",
    cardPrice: 160,
    finalPrice: calcPrice(160), // 184
    isVeg: false,
    description: "Pizza Sauce, Onion, Green Chilly, Plain Chicken & Mozzarella Cheese"
  },
  // Classic Chicken
  {
    name: "Choice Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Classic Chicken",
    cardPrice: 190,
    finalPrice: calcPrice(190), // 219
    isVeg: false,
    description: "Onion, Capsicum, Tomato, Plain Chicken, Corn & Mozzarella Cheese"
  },
  {
    name: "Chicken Lover Pizza",
    category: "Non Veg Pizza",
    subCategory: "Classic Chicken",
    cardPrice: 190,
    finalPrice: calcPrice(190), // 219
    isVeg: false,
    description: "Onion, Capsicum, Tomato, Mushroom & Mozzarella Cheese"
  },
  {
    name: "Chicken Pepe Pizza",
    category: "Non Veg Pizza",
    subCategory: "Classic Chicken",
    cardPrice: 190,
    finalPrice: calcPrice(190), // 219
    isVeg: false,
    description: "Onion, Capsicum, Tomato, Plain Chicken, Green Chilly, Mozzarella Cheese"
  },
  // Signature Chicken
  {
    name: "Chicken Cheese Burst Pizza",
    category: "Non Veg Pizza",
    subCategory: "Signature Chicken",
    cardPrice: 290,
    finalPrice: calcPrice(290), // 334
    isVeg: false,
    description: "Double Layered Cheese, Plain Chicken, Onion & Mozzarella Cheese"
  },
  {
    name: "B.B.Q Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Signature Chicken",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: false,
    description: "B.B.Q Sauce, Marinated Chicken, Onion, Olive, Red Paprika & Mozzarella Cheese"
  },
  {
    name: "Tandoori Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Signature Chicken",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: false,
    description: "Tandoori Sauce, Marinated Chicken, Onion, Capsicum, Tomato, Red Paprika & Mozzarella Cheese"
  },
  {
    name: "Makhani Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Signature Chicken",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: false,
    description: "Makhani Sauce, Onion, Capsicum, Jalapeno, Makhani Chicken & Mozzarella Cheese"
  },
  {
    name: "Peri Peri Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Signature Chicken",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: false,
    description: "Peri Peri Sauce, Marinated Chicken, Onion, Capsicum, Tomato, Green Chilly, Jalapeno & Mozzarella Cheese"
  },
  // Exotic Chicken
  {
    name: "Spicy Chicken Pizza",
    category: "Non Veg Pizza",
    subCategory: "Exotic Chicken",
    cardPrice: 290,
    finalPrice: calcPrice(290), // 334
    isVeg: false,
    description: "Spicy Sauce, Onion, Capsicum, Jalapeno, Red Paprika, Green Chilly, Spicy Chicken & Mozzarella Cheese"
  },
  {
    name: "Chicken Supremo Pizza",
    category: "Non Veg Pizza",
    subCategory: "Exotic Chicken",
    cardPrice: 290,
    finalPrice: calcPrice(290), // 334
    isVeg: false,
    description: "Onion, Capsicum, Tomato, Sweet Corn, Olive, Red Paprika, Mushroom & Mozzarella Cheese"
  },
  {
    name: "Chicken Extravaganza Pizza",
    category: "Non Veg Pizza",
    subCategory: "Exotic Chicken",
    cardPrice: 290,
    finalPrice: calcPrice(290), // 334
    isVeg: false,
    description: "Onion, Olive, Capsicum, Jalapeno, Red Paprika, Green Chilly, Spicy Chicken & Mozzarella Cheese"
  },

  // ==========================================
  // 2. PIZZA (VEG)
  // ==========================================
  // Simply Veg
  {
    name: "Margherita Pizza",
    category: "Veg Pizza",
    subCategory: "Simply Veg",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Tomato Sauce, Fresh & Mozzarella Cheese"
  },
  {
    name: "Makhani Cheesy Pizza",
    category: "Veg Pizza",
    subCategory: "Simply Veg",
    cardPrice: 135,
    finalPrice: calcPrice(135), // 155
    isVeg: true,
    description: "Pure Makhani Sauce, Tomato's & Mozzarella Cheese"
  },
  {
    name: "Cheesy Corn Pizza",
    category: "Veg Pizza",
    subCategory: "Simply Veg",
    cardPrice: 140,
    finalPrice: calcPrice(140), // 161
    isVeg: true,
    description: "Tomato Sauce, Sweet Corn, Mozzarella Cheese"
  },
  // Classic Veg
  {
    name: "Farm Choice Pizza",
    category: "Veg Pizza",
    subCategory: "Classic Veg",
    cardPrice: 180,
    finalPrice: calcPrice(180), // 207
    isVeg: true,
    description: "Onion, Capsicum, Tomato, Sweet Corn & Mozzarella Cheese"
  },
  {
    name: "Lovers Choice Pizza",
    category: "Veg Pizza",
    subCategory: "Classic Veg",
    cardPrice: 180,
    finalPrice: calcPrice(180), // 207
    isVeg: true,
    description: "Onion, Capsicum, Tomato, Mushroom & Mozzarella Cheese"
  },
  {
    name: "Pepe Paneer Pizza",
    category: "Veg Pizza",
    subCategory: "Classic Veg",
    cardPrice: 180,
    finalPrice: calcPrice(180), // 207
    isVeg: true,
    description: "Paneer, Onion, Tomato, Sweet Corn & Mozzarella Cheese"
  },
  {
    name: "Cheesy Mushroom Pizza",
    category: "Veg Pizza",
    subCategory: "Classic Veg",
    cardPrice: 180,
    finalPrice: calcPrice(180), // 207
    isVeg: true,
    description: "Mushroom, Onion, Capsicum, Red Paprika & Mozzarella Cheese"
  },
  // Signature Veg
  {
    name: "Double Burst Pizza",
    category: "Veg Pizza",
    subCategory: "Signature Veg",
    cardPrice: 220,
    finalPrice: calcPrice(220), // 253
    isVeg: true,
    description: "Double Layered Cheese & Mozzarella Cheese"
  },
  {
    name: "B.B.Q Paneer Pizza",
    category: "Veg Pizza",
    subCategory: "Signature Veg",
    cardPrice: 220,
    finalPrice: calcPrice(220), // 253
    isVeg: true,
    description: "B.B.Q Sauce, Marinated Paneer, Onion, Capsicum, Tomato, Red Paprika & Mozzarella Cheese"
  },
  {
    name: "Tandoori Paneer Pizza",
    category: "Veg Pizza",
    subCategory: "Signature Veg",
    cardPrice: 220,
    finalPrice: calcPrice(220), // 253
    isVeg: true,
    description: "Tandoori Sauce, Marinated Paneer, Onion, Capsicum, Tomato, Red Paprika & Mozzarella Cheese"
  },
  {
    name: "Makhani Paneer Pizza",
    category: "Veg Pizza",
    subCategory: "Signature Veg",
    cardPrice: 220,
    finalPrice: calcPrice(220), // 253
    isVeg: true,
    description: "Makhani Sauce, Marinated Paneer, Onion, Capsicum, Olive, Sweet Corn & Mozzarella Cheese"
  },
  {
    name: "Peri Peri Paneer Pizza",
    category: "Veg Pizza",
    subCategory: "Signature Veg",
    cardPrice: 220,
    finalPrice: calcPrice(220), // 253
    isVeg: true,
    description: "Peri Peri Sauce, Marinated Paneer, Onion, Capsicum, Tomato, Green Chilly, Jalapeno & Mozzarella Cheese"
  },
  // Exotic Veg
  {
    name: "Spicy Paneer Pizza",
    category: "Veg Pizza",
    subCategory: "Exotic Veg",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: true,
    description: "Spicy Sauce, Marinated Paneer, Onion, Capsicum, Jalapeno, Red Paprika, Green Chilly & Mozzarella Cheese"
  },
  {
    name: "Veg Supremo Pizza",
    category: "Veg Pizza",
    subCategory: "Exotic Veg",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: true,
    description: "Onion, Capsicum, Tomato, Sweet Corn, Olive, Red Paprika, Mushroom & Mozzarella Cheese"
  },
  {
    name: "Veg Extravaganza Pizza",
    category: "Veg Pizza",
    subCategory: "Exotic Veg",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: true,
    description: "Onion, Capsicum, Tomato, Sweet Corn, Paneer, Jalapeno, Olive, Mushroom & Mozzarella Cheese"
  },

  // ==========================================
  // 3. PIZZA COMBOS (VEG & NON-VEG)
  // ==========================================
  {
    name: "Cheesy Chicken (7\") Pizza Combo",
    category: "Pizza Combo",
    subCategory: "Non-Veg Combo",
    cardPrice: 250,
    finalPrice: calcPrice(250), // 288
    isVeg: false,
    description: "Cheesy Chicken (7\") Pizza, Chicken Popcorn, Coke"
  },
  {
    name: "Any Classic Chicken (7\") Pizza Combo",
    category: "Pizza Combo",
    subCategory: "Non-Veg Combo",
    cardPrice: 300,
    finalPrice: calcPrice(300), // 345
    isVeg: false,
    description: "Any Classic Chicken (7\") Pizza, Chicken Fries, Coke"
  },
  {
    name: "Any Signature Chicken (7\") Pizza Combo",
    category: "Pizza Combo",
    subCategory: "Non-Veg Combo",
    cardPrice: 330,
    finalPrice: calcPrice(330), // 380
    isVeg: false,
    description: "Any Signature Chicken (7\") Pizza, Chicken Fries, Any Mocktail"
  },
  {
    name: "Any Exotic Chicken (7\") Pizza Combo",
    category: "Pizza Combo",
    subCategory: "Non-Veg Combo",
    cardPrice: 370,
    finalPrice: calcPrice(370), // 426
    isVeg: false,
    description: "Any Exotic Chicken (7\") Pizza, Chicken Fries, Any Mocktail"
  },
  {
    name: "Margarita Pizza (7\") Combo",
    category: "Pizza Combo",
    subCategory: "Veg Combo",
    cardPrice: 249,
    finalPrice: calcPrice(249), // 286
    isVeg: true,
    description: "Margarita Pizza (7\"), Peri Peri Fries / Tandoori Fries, Coke"
  },
  {
    name: "Any Classic Pizza (7\") Combo",
    category: "Pizza Combo",
    subCategory: "Veg Combo",
    cardPrice: 299,
    finalPrice: calcPrice(299), // 344
    isVeg: true,
    description: "Any Classic Pizza (7\"), Peri Peri Fries / Tandoori Fries, Coke"
  },
  {
    name: "Any Signature Pizza (7\") Combo",
    category: "Pizza Combo",
    subCategory: "Veg Combo",
    cardPrice: 329,
    finalPrice: calcPrice(329), // 378
    isVeg: true,
    description: "Any Signature Pizza (7\"), Peri Peri Fries / Tandoori Fries, Any Mocktail"
  },
  {
    name: "Any Exotic Pizza (7\") Combo",
    category: "Pizza Combo",
    subCategory: "Veg Combo",
    cardPrice: 379,
    finalPrice: calcPrice(379), // 436
    isVeg: true,
    description: "Any Exotic Pizza (7\"), Peri Peri Fries / Tandoori Fries, Any Mocktail"
  },

  // ==========================================
  // 4. BURGERS (VEG & NON-VEG)
  // ==========================================
  // Non-Veg Burgers
  {
    name: "Chicken Burger",
    category: "Burger",
    subCategory: "Non-Veg Burger",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: false,
    description: "Juicy chicken patty burger with fresh toppings and sauces"
  },
  {
    name: "Cheesy Chicken Burger",
    category: "Burger",
    subCategory: "Non-Veg Burger",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: false,
    description: "Chicken patty topped with melted cheese slice and dressing"
  },
  {
    name: "Makhani Chicken Burger",
    category: "Burger",
    subCategory: "Non-Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: false,
    description: "Chicken patty smothered in creamy makhani sauce & cheese"
  },
  {
    name: "Tandoori Chicken Burger",
    category: "Burger",
    subCategory: "Non-Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: false,
    description: "Spiced tandoori marinated chicken burger with rich flavor"
  },
  {
    name: "Spicy Chicken Burger",
    category: "Burger",
    subCategory: "Non-Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: false,
    description: "Fiery spicy chicken burger with zesty peppers and sauce"
  },
  // Veg Burgers
  {
    name: "Aloo Tikki Burger",
    category: "Burger",
    subCategory: "Veg Burger",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Crispy aloo tikki patty in soft toasted bun with sauces"
  },
  {
    name: "Aloo Tikki Cheese Burger",
    category: "Burger",
    subCategory: "Veg Burger",
    cardPrice: 100,
    finalPrice: calcPrice(100), // 115
    isVeg: true,
    description: "Golden crispy aloo tikki patty with melted cheese slice"
  },
  {
    name: "Shezwan Cheese Burger",
    category: "Burger",
    subCategory: "Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: true,
    description: "Spicy Schezwan sauce loaded veggie patty burger with cheese"
  },
  {
    name: "Cheese Chilli Burger",
    category: "Burger",
    subCategory: "Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: true,
    description: "Green chilli kick with gooey melted cheese & crispy patty"
  },
  {
    name: "Italian Paneer Cheese Burger",
    category: "Burger",
    subCategory: "Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: true,
    description: "Paneer slice marinated in Italian herbs with rich cheese"
  },
  {
    name: "Makhani Cheesy Burger",
    category: "Burger",
    subCategory: "Veg Burger",
    cardPrice: 130,
    finalPrice: calcPrice(130), // 150
    isVeg: true,
    description: "Desi makhani gravy seasoned veg patty topped with cheese"
  },

  // ==========================================
  // 5. SANDWICH (MERGED: Non-Grilled, 2 Slice Grilled, 3 Slice Grilled)
  // ==========================================
  // Non Grilled
  {
    name: "Chutney Cheese Sandwich",
    category: "Sandwich",
    subCategory: "Non-Grilled Sandwich",
    cardPrice: 80,
    finalPrice: calcPrice(80), // 92
    isVeg: true,
    description: "Fresh mint chutney and cheese slices in soft bread"
  },
  {
    name: "Veg Cheese Sandwich",
    category: "Sandwich",
    subCategory: "Non-Grilled Sandwich",
    cardPrice: 80,
    finalPrice: calcPrice(80), // 92
    isVeg: true,
    description: "Sliced cucumber, tomato, potato and cheese layered sandwich"
  },
  // Grilled Sandwich 2 Slice
  {
    name: "Veg Cheese Grilled Sandwich",
    category: "Sandwich",
    subCategory: "2 Slice Grilled",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: true,
    description: "Toasted 2-slice bread loaded with fresh veggies and melted cheese"
  },
  {
    name: "Masala Cheese Grilled Sandwich",
    category: "Sandwich",
    subCategory: "2 Slice Grilled",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: true,
    description: "Spicy potato masala and melted cheese grilled to perfection"
  },
  {
    name: "Cheese Chilli Grilled Sandwich",
    category: "Sandwich",
    subCategory: "2 Slice Grilled",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: true,
    description: "Spicy chopped chillies and gooey cheese grilled crispy"
  },
  {
    name: "Garlic Cheese Grilled Sandwich",
    category: "Sandwich",
    subCategory: "2 Slice Grilled",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: true,
    description: "Aromatic garlic butter and melted cheese grilled golden"
  },
  {
    name: "Chocolate Grilled Sandwich",
    category: "Sandwich",
    subCategory: "2 Slice Grilled",
    cardPrice: 105,
    finalPrice: calcPrice(105), // 121
    isVeg: true,
    description: "Rich chocolate spread inside crispy golden grilled bread"
  },
  {
    name: "Cheese Chilli Garlic Grilled Sandwich",
    category: "Sandwich",
    subCategory: "2 Slice Grilled",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: true,
    description: "Signature trio of cheese, green chilli and garlic grilled hot"
  },
  // 3 Slice Sandwich
  {
    name: "Paneer Cheese Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Triple-decker grilled sandwich packed with paneer and cheese"
  },
  {
    name: "Corn Cheese Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Sweet corn and copious melted cheese in a 3-slice grilled delight"
  },
  {
    name: "Kolhapuri Paneer Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Fiery Kolhapuri spicy masala paneer layered in 3 slices"
  },
  {
    name: "Paneer Schezwan Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Paneer tossed in spicy Schezwan sauce in 3 crispy grilled layers"
  },
  {
    name: "Tandoori Paneer Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Tandoori seasoned paneer cubes layered with cheese in 3 slices"
  },
  {
    name: "Peri Peri Paneer Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Spicy peri peri marinated paneer in a triple-layered grilled sandwich"
  },
  {
    name: "Peri Peri Corn Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Sweet corn spiced with peri-peri seasoning and cheese in 3 slices"
  },
  {
    name: "Makhani Paneer Grilled Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Rich buttery makhani sauce with paneer in 3 grilled bread layers"
  },
  {
    name: "Mix Veg Grill Sandwich",
    category: "Sandwich",
    subCategory: "3 Slice Grilled",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: true,
    description: "Hearty mix of sautéed vegetables and cheese grilled to perfection"
  },

  // ==========================================
  // 6. STARTERS (VEG & NON-VEG)
  // ==========================================
  // Veg Starters
  {
    name: "Chilly Garlic Shots",
    category: "Veg Starters",
    cardPrice: 80,
    finalPrice: calcPrice(80), // 92
    isVeg: true,
    description: "Crispy potato bites infused with fiery chilli and garlic notes"
  },
  {
    name: "Salted Fries",
    category: "Veg Starters",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Classic golden French fries sprinkled with sea salt"
  },
  {
    name: "Peri Peri Fries",
    category: "Veg Starters",
    cardPrice: 100,
    finalPrice: calcPrice(100), // 115
    isVeg: true,
    description: "Crispy fries tossed in aromatic African peri peri spice"
  },
  {
    name: "Tandoori Fries",
    category: "Veg Starters",
    cardPrice: 100,
    finalPrice: calcPrice(100), // 115
    isVeg: true,
    description: "Crispy fries dusted with smoky tandoori masala"
  },
  {
    name: "Cheesy Fries",
    category: "Veg Starters",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: true,
    description: "Hot fries drenched in warm creamy melted cheese sauce"
  },
  {
    name: "Peri Peri Cheesy Fries",
    category: "Veg Starters",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: true,
    description: "Peri peri dusted fries topped with gooey melted cheese"
  },
  {
    name: "Tandoori Cheesy Fries",
    category: "Veg Starters",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: true,
    description: "Tandoori seasoned fries loaded with molten cheese sauce"
  },
  {
    name: "Chocolate Stuff Bread",
    category: "Veg Starters",
    cardPrice: 150,
    finalPrice: calcPrice(150), // 173
    isVeg: true,
    description: "Warm artisan garlic bread stuffed with rich decadent chocolate"
  },
  {
    name: "Cheese Stuff Garlic Bread",
    category: "Veg Starters",
    cardPrice: 150,
    finalPrice: calcPrice(150), // 173
    isVeg: true,
    description: "Freshly baked bread stuffed with mozzarella cheese and herbs"
  },
  {
    name: "Exotic Stuff Garlic Bread",
    category: "Veg Starters",
    cardPrice: 150,
    finalPrice: calcPrice(150), // 173
    isVeg: true,
    description: "Garlic bread stuffed with corn, olives, jalapenos and cheese"
  },

  // Non-Veg Starters
  {
    name: "Chicken Popcorn",
    category: "Non Veg Starters",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: false,
    description: "Bite-sized tender chicken nuggets fried to crunchy perfection"
  },
  {
    name: "Chicken Fries",
    category: "Non Veg Starters",
    cardPrice: 100,
    finalPrice: calcPrice(100), // 115
    isVeg: false,
    description: "Crispy fried chicken strips cut like fries served with dip"
  },
  {
    name: "Chicken Nuggets",
    category: "Non Veg Starters",
    cardPrice: 100,
    finalPrice: calcPrice(100), // 115
    isVeg: false,
    description: "Golden crumb-coated minced chicken nuggets"
  },
  {
    name: "Chicken Stuff Garlic Bread",
    category: "Non Veg Starters",
    cardPrice: 150,
    finalPrice: calcPrice(150), // 173
    isVeg: false,
    description: "Garlic bread stuffed with seasoned chicken chunks and cheese"
  },

  // ==========================================
  // 7. CHICKEN WINGS
  // ==========================================
  {
    name: "Chicken Wings",
    category: "Chicken Wings",
    cardPrice: 170,
    finalPrice: calcPrice(170), // 196
    isVeg: false,
    description: "Crispy juicy seasoned chicken wings served with hot dip"
  },
  {
    name: "Peri Peri Chicken Wings",
    category: "Chicken Wings",
    cardPrice: 180,
    finalPrice: calcPrice(180), // 207
    isVeg: false,
    description: "Tender chicken wings tossed in bold and spicy peri peri seasoning"
  },

  // ==========================================
  // 8. MOMOS (VEG & NON-VEG)
  // ==========================================
  {
    name: "Mix Veg Fried Momo",
    category: "Momos",
    subCategory: "Veg Momos",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: true,
    description: "Crispy fried dumplings stuffed with spiced vegetables"
  },
  {
    name: "Paneer Peri Peri Momos",
    category: "Momos",
    subCategory: "Veg Momos",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: true,
    description: "Paneer filled fried momos dusted in tangy peri peri seasoning"
  },
  {
    name: "Chicken Momos",
    category: "Momos",
    subCategory: "Non-Veg Momos",
    cardPrice: 110,
    finalPrice: calcPrice(110), // 127
    isVeg: false,
    description: "Steamed or fried succulent chicken dumplings with fiery red chutney"
  },
  {
    name: "Chicken Peri Peri Momos",
    category: "Momos",
    subCategory: "Non-Veg Momos",
    cardPrice: 120,
    finalPrice: calcPrice(120), // 138
    isVeg: false,
    description: "Crispy chicken momos tossed with zesty peri peri spice powder"
  },

  // ==========================================
  // 9. BEVERAGES & COFFEE (COFFEE + MOCKTAILS)
  // ==========================================
  {
    name: "Hot Coffee",
    category: "Beverages & Coffee",
    subCategory: "Coffee",
    cardPrice: 25,
    finalPrice: calcPrice(25), // 29
    isVeg: true,
    description: "Rich freshly brewed aromatic hot coffee"
  },
  {
    name: "Thick Cold Coffee",
    category: "Beverages & Coffee",
    subCategory: "Coffee",
    cardPrice: 50,
    finalPrice: calcPrice(50), // 58
    isVeg: true,
    description: "Creamy thick blended cold coffee brewed with full milk"
  },
  {
    name: "Crush Thick Cold Coffee",
    category: "Beverages & Coffee",
    subCategory: "Coffee",
    cardPrice: 60,
    finalPrice: calcPrice(60), // 69
    isVeg: true,
    description: "Signature cold coffee topped with crushed chocolate indulgence"
  },
  {
    name: "Cold Coffee with Ice Cream",
    category: "Beverages & Coffee",
    subCategory: "Coffee",
    cardPrice: 70,
    finalPrice: calcPrice(70), // 81
    isVeg: true,
    description: "Decadent thick cold coffee served with a scoop of vanilla ice cream"
  },
  {
    name: "Blue Ocean Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Refreshing curacao flavored sparkling cooler with mint and lime"
  },
  {
    name: "Blueberry Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Fruity blueberry twist combined with cooling mint and soda"
  },
  {
    name: "Kala Khata Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Tangy sweet and sour nostalgic kala khatta flavored mojito"
  },
  {
    name: "Mint Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Classic virgin mojito with fresh muddled mint leaves, lime and fizz"
  },
  {
    name: "Lemon Ice Tea",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Chilled iced tea infused with citrusy lemon extract"
  },
  {
    name: "Green Apple Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Crisp green apple syrup with soda, crushed ice and mint"
  },
  {
    name: "Peach Ice Tea Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Sweet peach infusion with cool brewed iced tea and mint"
  },
  {
    name: "Watermelon Mojito",
    category: "Beverages & Coffee",
    subCategory: "Mocktails",
    cardPrice: 90,
    finalPrice: calcPrice(90), // 104
    isVeg: true,
    description: "Juicy summer watermelon flavor with chilled sparkling soda"
  },
  {
    name: "Cold Drink",
    category: "Beverages & Coffee",
    subCategory: "Cold Beverages",
    cardPrice: 25,
    finalPrice: calcPrice(25), // 29
    isVeg: true,
    description: "Chilled carbonated soft drink"
  },
  {
    name: "Water Bottle",
    category: "Beverages & Coffee",
    subCategory: "Cold Beverages",
    cardPrice: 20,
    finalPrice: calcPrice(20), // 23
    isVeg: true,
    description: "Packaged mineral drinking water bottle"
  },

  // ==========================================
  // 10. DESSERTS
  // ==========================================
  {
    name: "Choco Lava Cake",
    category: "Desserts",
    cardPrice: 79,
    finalPrice: calcPrice(79), // 91
    isVeg: true,
    description: "Warm chocolate sponge cake with an oozing molten chocolate center"
  },

  // ==========================================
  // 11. ADD ONS
  // ==========================================
  {
    name: "Veg Topping",
    category: "Add On",
    cardPrice: 15,
    finalPrice: calcPrice(15), // 17
    isVeg: true,
    description: "Extra fresh vegetable toppings for pizza and burger"
  },
  {
    name: "Non Veg Topping",
    category: "Add On",
    cardPrice: 20,
    finalPrice: calcPrice(20), // 23
    isVeg: false,
    description: "Extra chicken topping for pizza and burger"
  },
  {
    name: "Extra Cheese",
    category: "Add On",
    cardPrice: 49,
    finalPrice: calcPrice(49), // 56
    isVeg: true,
    description: "Generous portion of extra melted mozzarella cheese"
  },
  {
    name: "Cheese Burst",
    category: "Add On",
    cardPrice: 59,
    finalPrice: calcPrice(59), // 68
    isVeg: true,
    description: "Cheese burst crust loaded inside the pizza base"
  },
  {
    name: "Extra Cheese Slice",
    category: "Add On",
    cardPrice: 20,
    finalPrice: calcPrice(20), // 23
    isVeg: true,
    description: "Extra single cheese slice for burger or sandwich"
  },

  // ==========================================
  // 12. SPECIAL DAILY OFFERS (12:00pm to 06:00pm)
  // ==========================================
  {
    name: "Corn with Cheese Pizza (Daily Offer)",
    category: "Special Offers",
    cardPrice: 80,
    finalPrice: calcPrice(80), // 92
    isVeg: true,
    description: "Single topping daily special: Corn with Cheese Pizza (Valid 12:00pm to 06:00pm)"
  },
  {
    name: "Herb Chicken Pizza (Daily Offer)",
    category: "Special Offers",
    cardPrice: 100,
    finalPrice: calcPrice(100), // 115
    isVeg: false,
    description: "Single topping daily special: Herb Chicken Pizza (Valid 12:00pm to 06:00pm)"
  }
];

console.log(`Prepared ${updatedBullsMenu.length} items with +15% calculated prices.`);
