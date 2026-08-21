import 'dotenv/config';
import { db } from "./db";
import { users, serviceProviders, cakeProducts, serviceCategories } from "@shared/schema";
import { eq } from "drizzle-orm";
import { crypto } from "crypto"; // Not used but available if we need to hash passwords

// Generate a random password for the user
const randomPassword = "CakeShop" + Math.floor(Math.random() * 10000);

const BAKERY_DATA = {
  businessName: "Premium Bakers",
  categorySlug: "cake-shop",
  address: "Shirur Main Road",
  description: "Delicious cakes, pastries, breads, and snacks.",
  latitude: "18.8285",
  longitude: "74.3734",
  experience: 5,
};

// Extracted from PDF OCR
const MENU_ITEMS = [
  // Pastries
  { name: "Black Forest Pastry", price: "55", category: "Pastries" },
  { name: "Pineapple Pastry", price: "55", category: "Pastries" },
  { name: "Choco Royal Pastry", price: "55", category: "Pastries" },
  { name: "Chocochips Pastry", price: "55", category: "Pastries" },
  { name: "Rasmalai Pastry", price: "55", category: "Pastries" },
  { name: "Red Velvet Pastry", price: "55", category: "Pastries" },
  { name: "Chocolate Ball", price: "25", category: "Pastries" },
  { name: "Choco Marble Pastry", price: "55", category: "Pastries" },
  
  // Cake Half KG
  { name: "Black Forest Cake", price: "310", category: "Cakes", weight: "500g" },
  { name: "White Forest Cake", price: "310", category: "Cakes", weight: "500g" },
  { name: "Chocolate Celebration Cake", price: "310", category: "Cakes", weight: "500g" },
  { name: "Chocolate Delight Cake", price: "360", category: "Cakes", weight: "500g" },
  { name: "Butterscotch Cake", price: "360", category: "Cakes", weight: "500g" },
  { name: "Pineapple Forest Cake", price: "360", category: "Cakes", weight: "500g" },
  { name: "Badam Thandai Cake", price: "360", category: "Cakes", weight: "500g" },
  { name: "Cheese Mix Fruit Cake", price: "360", category: "Cakes", weight: "500g" },
  { name: "Rasmalai Cake", price: "390", category: "Cakes", weight: "500g" },
  { name: "Chocochips Fantacy Cake", price: "390", category: "Cakes", weight: "500g" },
  { name: "Chocolate Truffle Cake", price: "390", category: "Cakes", weight: "500g" },
  { name: "Belgium Chocolate Cake", price: "390", category: "Cakes", weight: "500g" },
  { name: "Red Velvet Cake", price: "390", category: "Cakes", weight: "500g" },
  { name: "Choco Marble Cake", price: "390", category: "Cakes", weight: "500g" },
  { name: "Choco Crunch Cake", price: "430", category: "Cakes", weight: "500g" },
  { name: "Ferrero Rocher Cake", price: "450", category: "Cakes", weight: "500g" },

  // Puffs / Khari Pattice (Snacks)
  { name: "Aloo Puff", price: "25", category: "Snacks" },
  { name: "Paneer Puff", price: "30", category: "Snacks" },
  { name: "Manchurian Puff", price: "30", category: "Snacks" },
  { name: "Paneer Roll", price: "40", category: "Snacks" },
  { name: "Manchurian Roll", price: "40", category: "Snacks" },

  // Breads
  { name: "Super Slice Bread 400gm", price: "45", category: "Breads", weight: "400g" },
  { name: "Super Slice Bread 1kg", price: "100", category: "Breads", weight: "1kg" },
  { name: "Whole Wheat Atta Bread 200gm", price: "30", category: "Breads", weight: "200g" },
  { name: "Whole Wheat Atta Bread 400gm", price: "60", category: "Breads", weight: "400g" },
  { name: "Pav Ladi (8 Piece)", price: "30", category: "Breads" },

  // Khari
  { name: "Twist Khari 250gm", price: "80", category: "Khari", weight: "250g" },
  { name: "Makkhan Khari 250gm", price: "80", category: "Khari", weight: "250g" },
  { name: "Wheat Khari 250gm", price: "100", category: "Khari", weight: "250g" },
  { name: "Twist Khari 100gm", price: "45", category: "Khari", weight: "100g" },
  { name: "Makkhan Khari 100gm", price: "45", category: "Khari", weight: "100g" },

  // Toast
  { name: "Wheat Toast 250gm", price: "90", category: "Toast", weight: "250g" },
  { name: "Elaichi Toast 250gm", price: "80", category: "Toast", weight: "250g" },
  { name: "Fruity Toast 250gm", price: "80", category: "Toast", weight: "250g" },
  { name: "Special Toast 250gm", price: "80", category: "Toast", weight: "250g" },

  // Butter / Chai Dips
  { name: "Special Butter", price: "60", category: "Butter/Dips" },
  { name: "Jeera Butter", price: "60", category: "Butter/Dips" },
  { name: "Mhaska Butter", price: "60", category: "Butter/Dips" },

  // Cookies
  { name: "Nachani Cookies", price: "130", category: "Cookies" },
  { name: "Wheat Cookies", price: "140", category: "Cookies" },
  { name: "Fruit Cookies", price: "130", category: "Cookies" },
  { name: "Nankatai Cookies", price: "140", category: "Cookies" },
  { name: "Chocochips Cookies", price: "150", category: "Cookies" },
  { name: "Jeera Namkeen Cookies", price: "150", category: "Cookies" },
  { name: "Coconut Cookies", price: "140", category: "Cookies" },
  { name: "Shrewsbury Cookies", price: "160", category: "Cookies" },

  // Cream Roll PKT
  { name: "Mango Cream Roll", price: "90", category: "Cream Rolls" },
  { name: "Vanilla Cream Roll", price: "90", category: "Cream Rolls" },
  { name: "Chocolate Cream Roll", price: "90", category: "Cream Rolls" },

  // Sponge Cake
  { name: "Fruit Sponge Cake", price: "155", category: "Sponge Cake" },
  { name: "Chocolate Sponge Cake", price: "155", category: "Sponge Cake" },
  { name: "Pure Mawa Cake", price: "175", category: "Sponge Cake" },
  { name: "Choco Slice", price: "60", category: "Sponge Cake" },
  { name: "Pineapple Slice", price: "60", category: "Sponge Cake" },
  { name: "Vanilla Slice", price: "60", category: "Sponge Cake" },
  { name: "Cake Bite Vanilla", price: "25", category: "Sponge Cake" },
  { name: "Chocolate Bite", price: "25", category: "Sponge Cake" },

  // Premium Products
  { name: "Nutella Cheese Cake", price: "200", category: "Premium Products" },
  { name: "Double Choc Brownie", price: "90", category: "Premium Products" },
  { name: "Donut Chocolate", price: "70", category: "Premium Products" },
  { name: "Donut White Chocolate", price: "70", category: "Premium Products" },
  { name: "Croissant Chocolate", price: "100", category: "Premium Products" },
  { name: "Lava Cake", price: "80", category: "Premium Products" }
];

async function seed() {
  try {
    let user = await db.query.users.findFirst({
      where: eq(users.username, 'premiumbakers')
    });

    if (!user) {
      console.log('Creating user: premiumbakers');
      const [newUser] = await db.insert(users).values({
        username: 'premiumbakers',
        password: randomPassword,
        email: 'premiumbakers@shirur.com',
        phone: '9876543210', // Placeholder
        role: 'provider'
      }).returning();
      user = newUser;
      console.log(`User created. Login with: premiumbakers / ${randomPassword}`);
    } else {
      console.log('User already exists:', user.username);
    }

    let provider = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, user.id)
    });

    if (!provider) {
      let category = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, BAKERY_DATA.categorySlug)
      });
      if (!category) {
        throw new Error(`Category ${BAKERY_DATA.categorySlug} not found`);
      }

      console.log('Creating service provider:', BAKERY_DATA.businessName);
      const [newProvider] = await db.insert(serviceProviders).values({
        userId: user.id,
        categoryId: category.id,
        businessName: BAKERY_DATA.businessName,
        categorySlug: BAKERY_DATA.categorySlug,
        address: BAKERY_DATA.address,
        description: BAKERY_DATA.description,
        latitude: BAKERY_DATA.latitude,
        longitude: BAKERY_DATA.longitude,
        experience: BAKERY_DATA.experience,
        isVerified: true
      }).returning();
      provider = newProvider;
      console.log('Provider created successfully.');
    } else {
      console.log('Provider already exists:', provider.businessName);
    }

    console.log(`Deleting existing menu items for ${provider.businessName}...`);
    await db.delete(cakeProducts).where(eq(cakeProducts.providerId, provider.id));

    console.log('Inserting new menu items...');
    for (const item of MENU_ITEMS) {
      await db.insert(cakeProducts).values({
        providerId: provider.id,
        name: item.name,
        category: item.category,
        price: item.price,
        weight: (item as any).weight || null,
        isAvailable: true,
        isCustomizable: false,
        imageUrl: null // will be populated by another script
      });
      console.log(`Added: ${item.name}`);
    }

    console.log(`\nSuccessfully added ${MENU_ITEMS.length} items to ${provider.businessName}!`);
  } catch (err) {
    console.error('Error seeding cake shop:', err);
  } finally {
    process.exit(0);
  }
}

seed();
