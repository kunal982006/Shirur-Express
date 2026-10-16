// server/add-hotel-suman-menu.ts
// Menu updater for "Suman pure veg" from the official menu card with +15% pricing

import { pool } from "./db";
import { createId } from "@paralleldrive/cuid2";

interface MenuItemDef {
  name: string;
  category: string;
  basePrice: number;
  description: string;
  imageUrl?: string;
  isPopular?: boolean;
}

export const sumanMenuItems: MenuItemDef[] = [
  // ==========================================
  // PIZZA (8 In / 12 In)
  // ==========================================
  {
    name: 'Margherita Pizza (8")',
    category: "Pizza",
    basePrice: 209,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Basil Leaf.",
    imageUrl: "/images/menu-items/pizza.jpg",
    isPopular: true
  },
  {
    name: 'Margherita Pizza (12")',
    category: "Pizza",
    basePrice: 249,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Basil Leaf.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Veg Supreme Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Bell Pepper, Olive, Jalapeno, Onion, Mushroom, Sweet Corn.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Veg Supreme Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Bell Pepper, Olive, Jalapeno, Onion, Mushroom, Sweet Corn.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Tandoori Paneer Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Onion, Tandoori Paneer, Bell Pepper.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg",
    isPopular: true
  },
  {
    name: 'Tandoori Paneer Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Onion, Tandoori Paneer, Bell Pepper.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },
  {
    name: 'Alfredo Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Cooked Deliciously Creamy White Cheese Sauce, Bell Pepper, Broccoli, Olive, Jalapeno.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Alfredo Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Cooked Deliciously Creamy White Cheese Sauce, Bell Pepper, Broccoli, Olive, Jalapeno.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Veggie Delight Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Onion, Bell Pepper, Olive, Sweet Corn.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Veggie Delight Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Onion, Bell Pepper, Olive, Sweet Corn.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Peri Peri Paneer Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Onion, Bell Pepper, Sweet Corn, Peri Peri Pepper, Black Olive.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },
  {
    name: 'Peri Peri Paneer Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Onion, Bell Pepper, Sweet Corn, Peri Peri Pepper, Black Olive.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },
  {
    name: 'Mexican Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Capsicum, Onion, Sweet Corn, Jalapeno.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Mexican Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Capsicum, Onion, Sweet Corn, Jalapeno.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Triple Cheese Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Cheddar Cheese, Parmesan Cheese.",
    imageUrl: "/images/menu-items/pizza.jpg",
    isPopular: true
  },
  {
    name: 'Triple Cheese Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Cheddar Cheese, Parmesan Cheese.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Pasta Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Mac & Cheese Pasta, Mozzarella Cheese, Bell Pepper, Onion.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Pasta Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Mac & Cheese Pasta, Mozzarella Cheese, Bell Pepper, Onion.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Schezwan Paneer Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Schezwan Sauce, Mozzarella Cheese, Onion, Bell Pepper, Schezwan Paneer.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },
  {
    name: 'Schezwan Paneer Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Schezwan Sauce, Mozzarella Cheese, Onion, Bell Pepper, Schezwan Paneer.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },
  {
    name: 'Cheese Burst Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Parmesan Cheese, Onion, Bell Pepper, Melted Cheese.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Cheese Burst Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Parmesan Cheese, Onion, Bell Pepper, Melted Cheese.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'B.B.Q. Cheese Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Jalapeno, Bell Pepper, Onion, BBQ Pepper.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'B.B.Q. Cheese Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Jalapeno, Bell Pepper, Onion, BBQ Pepper.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Mediterranean Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Broccoli, Olives, Garlic, Bell Pepper, Onion.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Mediterranean Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Fresh Tomato Sauce, Mozzarella Cheese, Broccoli, Olives, Garlic, Bell Pepper, Onion.",
    imageUrl: "/images/menu-items/veg_pizza.jpg"
  },
  {
    name: 'Italian Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Mac & Cheese Pasta, Fresh Tomato Sauce, Mozzarella Cheese, Bell Pepper, Onion, Olives.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Italian Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Mac & Cheese Pasta, Fresh Tomato Sauce, Mozzarella Cheese, Bell Pepper, Onion, Olives.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: 'Mumbai Pizza (8")',
    category: "Pizza",
    basePrice: 229,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Onion, Cottage Cheese, Jalapeno.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },
  {
    name: 'Mumbai Pizza (12")',
    category: "Pizza",
    basePrice: 289,
    description: "Spicy Tomato Sauce, Mozzarella Cheese, Onion, Cottage Cheese, Jalapeno.",
    imageUrl: "/images/menu-items/paneer_pizza.jpg"
  },

  // ==========================================
  // BURGER
  // ==========================================
  {
    name: "Classic Veg Cheese Burger",
    category: "Burger",
    basePrice: 99,
    description: "Crispy vegetable patty with cheese slice, fresh lettuce and burger sauce.",
    imageUrl: "/images/menu-items/burger.jpg",
    isPopular: true
  },
  {
    name: "American Cheese Burger",
    category: "Burger",
    basePrice: 99,
    description: "Juicy veg patty with double cheese, pickles and classic American burger dressing.",
    imageUrl: "/images/menu-items/burger.jpg"
  },
  {
    name: "Crunchy Veg Burger",
    category: "Burger",
    basePrice: 119,
    description: "Extra crunchy crumbed vegetable patty loaded with fresh veggies and mayonnaise.",
    imageUrl: "/images/menu-items/grilled_burger.jpg"
  },
  {
    name: "Mexican Burger",
    category: "Burger",
    basePrice: 119,
    description: "Zesty patty topped with jalapenos, spicy salsa and Mexican sauce.",
    imageUrl: "/images/menu-items/burger.jpg"
  },

  // ==========================================
  // FRENCH FRIES
  // ==========================================
  {
    name: "Classic Fries",
    category: "French Fries",
    basePrice: 99,
    description: "Golden crispy salted french fries.",
    imageUrl: "/images/menu-items/fries.jpg"
  },
  {
    name: "Peri Peri Fries",
    category: "French Fries",
    basePrice: 119,
    description: "Crispy fries tossed in fiery African peri peri spice mix.",
    imageUrl: "/images/menu-items/peri_peri_fries.jpg",
    isPopular: true
  },
  {
    name: "Peri Peri Cheese Fries",
    category: "French Fries",
    basePrice: 129,
    description: "Peri peri dusted fries topped with generous liquid cheese sauce.",
    imageUrl: "/images/menu-items/cheese_fries.jpg"
  },
  {
    name: "Masala Fries",
    category: "French Fries",
    basePrice: 129,
    description: "Crispy fries seasoned with spicy Indian chaat masala blend.",
    imageUrl: "/images/menu-items/fries.jpg"
  },
  {
    name: "Loaded Cheese Fries",
    category: "French Fries",
    basePrice: 129,
    description: "Overloaded with melted cheddar cheese and seasoning.",
    imageUrl: "/images/menu-items/cheese_fries.jpg"
  },
  {
    name: "Barbeque Fries",
    category: "French Fries",
    basePrice: 129,
    description: "Crispy french fries drizzled with smoky barbecue sauce.",
    imageUrl: "/images/menu-items/fries.jpg"
  },

  // ==========================================
  // SANDWICH
  // ==========================================
  {
    name: "Classic Veg Grilled Sandwich",
    category: "Sandwich",
    basePrice: 89,
    description: "Fresh cucumber, tomato, onion and green chutney grilled to golden perfection.",
    imageUrl: "/images/menu-items/grilled_sandwich.jpg"
  },
  {
    name: "Tandoori Paneer Sandwich",
    category: "Sandwich",
    basePrice: 119,
    description: "Spiced tandoori marinated paneer with capsicum, onion and tandoori spread.",
    imageUrl: "/images/menu-items/paneer_sandwich.jpg",
    isPopular: true
  },
  {
    name: "Mexican Sandwich",
    category: "Sandwich",
    basePrice: 119,
    description: "Stuffed with sweet corn, jalapenos, bell pepper and spicy Mexican salsa sauce.",
    imageUrl: "/images/menu-items/sandwich.jpg"
  },
  {
    name: "Cheese Corn Grilled Sandwich",
    category: "Sandwich",
    basePrice: 119,
    description: "Sweet corn and melted cheese filling grilled crisp in buttered bread.",
    imageUrl: "/images/menu-items/grilled_sandwich.jpg"
  },
  {
    name: "Peri Peri Paneer Sandwich",
    category: "Sandwich",
    basePrice: 119,
    description: "Peri peri coated cottage cheese slices grilled with spicy seasoning.",
    imageUrl: "/images/menu-items/paneer_sandwich.jpg"
  },
  {
    name: "Jain Veg Cheese Sandwich",
    category: "Sandwich",
    basePrice: 119,
    description: "Prepared without root vegetables - cheese, capsicum and Jain seasonings.",
    imageUrl: "/images/menu-items/sandwich.jpg"
  },

  // ==========================================
  // GARLIC BREAD
  // ==========================================
  {
    name: "Garlic Bread",
    category: "Garlic Bread",
    basePrice: 99,
    description: "Freshly baked bread infused with herb butter and aromatic garlic.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },
  {
    name: "Cheese Garlic Bread",
    category: "Garlic Bread",
    basePrice: 119,
    description: "Crispy garlic bread smothered with melted mozzarella cheese.",
    imageUrl: "/images/menu-items/pizza.jpg",
    isPopular: true
  },
  {
    name: "Cheese Chilly Toast",
    category: "Garlic Bread",
    basePrice: 129,
    description: "Toasted bread topped with green chillies and molten spiced cheese.",
    imageUrl: "/images/menu-items/sandwich.jpg"
  },
  {
    name: "Chilly Cheese Corn Garlic Bread",
    category: "Garlic Bread",
    basePrice: 139,
    description: "Garlic bread loaded with cheese, spicy green chillies and juicy sweet corn.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },

  // ==========================================
  // EXTRA ADD-ONS
  // ==========================================
  {
    name: "Extra Toppings / Cheese Add-on",
    category: "Add-ons",
    basePrice: 30,
    description: "Add Cheese, Corn, Olives, Broccoli, Jalapeno & Paneer.",
    imageUrl: "/images/menu-items/pizza.jpg"
  },

  // ==========================================
  // PASTA (Choice of Spaghetti, Macaroni, Penne)
  // ==========================================
  {
    name: "Aglio E Olio Pasta",
    category: "Pasta",
    basePrice: 199,
    description: "Classic Italian Pasta Tossed With Garlic, Olive Oil, Bell Pepper, Broccoli, Olives & Chilli Flakes. (Choice of Spaghetti, Macaroni, Penne)",
    imageUrl: "/images/menu-items/pasta.jpg"
  },
  {
    name: "Alfredo Pasta",
    category: "Pasta",
    basePrice: 229,
    description: "Creamy Alfredo Sauce With Bell Pepper, Broccoli & Olives. (Choice of Spaghetti, Macaroni, Penne)",
    imageUrl: "/images/menu-items/pasta.jpg",
    isPopular: true
  },
  {
    name: "Pesto Pasta",
    category: "Pasta",
    basePrice: 229,
    description: "Creamy Pesto Sauce With Bell Pepper, Broccoli & Olives. (Choice of Spaghetti, Macaroni, Penne)",
    imageUrl: "/images/menu-items/pasta.jpg"
  },
  {
    name: "Pink Sauce Pasta",
    category: "Pasta",
    basePrice: 229,
    description: "Fresh Tomato Sauce Blended With Béchamel Sauce, Bell Pepper, Broccoli & Olives. (Choice of Spaghetti, Macaroni, Penne)",
    imageUrl: "/images/menu-items/pasta.jpg"
  },
  {
    name: "Arrabbiata Sauce Pasta",
    category: "Pasta",
    basePrice: 229,
    description: "Spicy Tomato-herb Sauce With Broccoli, Olives & Bell Pepper. (Choice of Spaghetti, Macaroni, Penne)",
    imageUrl: "/images/menu-items/pasta.jpg"
  },
  {
    name: "Baked Pasta",
    category: "Pasta",
    basePrice: 229,
    description: "Fresh Tomato And Béchamel Sauce, Bell Pepper, Broccoli Baked With Mozzarella Cheese. (Choice of Spaghetti, Macaroni, Penne)",
    imageUrl: "/images/menu-items/pasta.jpg"
  }
];

export async function resetAndSeedSumanMenu() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Locate Suman pure veg
    const providerRes = await client.query(
      `SELECT id, business_name FROM service_providers WHERE LOWER(business_name) LIKE '%suman%' LIMIT 1`
    );

    if (providerRes.rows.length === 0) {
      throw new Error("❌ Suman pure veg restaurant not found in database!");
    }

    const provider = providerRes.rows[0];
    console.log(`Found provider: ${provider.business_name} (ID: ${provider.id})`);

    // Ensure restaurant is available
    await client.query(
      `UPDATE service_providers SET is_available = true WHERE id = $1`,
      [provider.id]
    );

    // 2. Delete ALL existing menu items for this restaurant
    const delRes = await client.query(
      `DELETE FROM restaurant_menu_items WHERE provider_id = $1`,
      [provider.id]
    );
    console.log(`🗑️ Deleted ${delRes.rowCount} previous menu items for '${provider.business_name}'.`);

    // 3. Insert fresh items with +15% price markup
    let insertedCount = 0;
    for (const item of sumanMenuItems) {
      // 15% price increase calculation rounded to nearest whole rupee
      const finalPriceNum = Math.round(item.basePrice * 1.15);
      const finalPriceStr = finalPriceNum.toFixed(2);
      const itemId = createId();

      await client.query(
        `INSERT INTO restaurant_menu_items 
         (id, provider_id, name, description, category, image_url, price, is_veg, is_available, cuisine, is_popular, popular_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          itemId,
          provider.id,
          item.name,
          item.description,
          item.category,
          item.imageUrl || null,
          finalPriceStr,
          true,
          true,
          "Pizza / Burger / Pasta / Italian / Fast Food",
          item.isPopular || false,
          0
        ]
      );
      insertedCount++;
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully added ${insertedCount} menu items for '${provider.business_name}' with 15% increased prices!`);

    // Print summary by category
    const categories = Array.from(new Set(sumanMenuItems.map(i => i.category)));
    console.log("\nSummary by Category:");
    for (const cat of categories) {
      const itemsInCat = sumanMenuItems.filter(i => i.category === cat);
      console.log(`  - ${cat}: ${itemsInCat.length} items`);
    }

    return insertedCount;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Auto-run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  resetAndSeedSumanMenu()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
