// server/seed.ts (MODIFIED AND FIXED)

import { db } from "./db";
import bcrypt from "bcrypt";
import {
  users, serviceCategories, serviceProviders, serviceProblems,
  streetFoodItems, restaurantMenuItems, groceryProducts
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create service categories (if they don't exist)
    await db.insert(serviceCategories).values([
      { name: "Technician & Electrician", slug: "electrician", description: "Professional electrical services" },
      { name: "Plumber", slug: "plumber", description: "Expert plumbing solutions" },
      { name: "Beauty Parlor", slug: "beauty", description: "Beauty and grooming services" },
      { name: "Cake Shop", slug: "cake-shop", description: "Custom cakes for all occasions" },
      { name: "Grocery", slug: "grocery", description: "Fresh groceries delivered" },
      { name: "Rental", slug: "rental", description: "No brokerage property rentals" },
      { name: "Street Food", slug: "street-food", description: "Delicious street food vendors" },
      { name: "Restaurants", slug: "restaurants", description: "Dine-in and table reservations" },
    ]).onConflictDoNothing();

    // Fetch all categories
    const categories = await db.select().from(serviceCategories);
    console.log(`✅ Found ${categories.length} service categories`);

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Try to create sample users (ignore if they already exist)
    await db.insert(users).values([
      // Electricians
      { username: "rajesh_electrician", email: "rajesh.electrician@example.com", password: hashedPassword, role: "provider", phone: "+919876543210" },
      { username: "amit_electrical", email: "amit.electrical@example.com", password: hashedPassword, role: "provider", phone: "+919876543211" },
      { username: "suresh_repairs", email: "suresh.repairs@example.com", password: hashedPassword, role: "provider", phone: "+919876543212" },

      // Plumbers
      { username: "vikram_plumber", email: "vikram.plumber@example.com", password: hashedPassword, role: "provider", phone: "+919876543213" },
      { username: "rahul_plumbing", email: "rahul.plumbing@example.com", password: hashedPassword, role: "provider", phone: "+919876543214" },

      // Beauty Parlors
      { username: "priya_beauty", email: "priya.beauty@example.com", password: hashedPassword, role: "provider", phone: "+919876543215" },
      { username: "sonal_salon", email: "sonal.salon@example.com", password: hashedPassword, role: "provider", phone: "+919876543216" },

      // Cake Shops
      { username: "sweetdreams_cakes", email: "sweetdreams@example.com", password: hashedPassword, role: "provider", phone: "+919876543217" },
      { username: "cakehub_delights", email: "cakehub@example.com", password: hashedPassword, role: "provider", phone: "+919876543218" },

      // Street Food
      { username: "chacha_chaat", email: "chacha.chaat@example.com", password: hashedPassword, role: "provider", phone: "+919876543219" },
      { username: "momos_king", email: "momos.king@example.com", password: hashedPassword, role: "provider", phone: "+919876543220" },

      // Restaurants
      { username: "punjabi_dhaba", email: "punjabi.dhaba@example.com", password: hashedPassword, role: "provider", phone: "+919876543221" },
      { username: "chinese_wok", email: "chinese.wok@example.com", password: hashedPassword, role: "provider", phone: "+919876543222" },

      // --- YEH HAI NAYA GMART USER ---
      { username: "gmart_manager", email: "gmart@example.com", password: hashedPassword, role: "provider", phone: "+919876543223" },
    ]).onConflictDoNothing();

    // Fetch the users (whether just created or already existing)
    const usernames = [
      "rajesh_electrician", "amit_electrical", "suresh_repairs",
      "vikram_plumber", "rahul_plumbing",
      "priya_beauty", "sonal_salon",
      "sweetdreams_cakes", "cakehub_delights",
      "chacha_chaat", "momos_king",
      "punjabi_dhaba", "chinese_wok",
      "gmart_manager" // --- NAYA GMART USER ADDED ---
    ];

    const sampleUsers = [];
    for (const username of usernames) {
      const user = await db.select().from(users).where(sql`${users.username} = ${username}`).limit(1);
      if (user.length > 0) {
        sampleUsers.push(user[0]);
      }
    }

    console.log(`✅ Found ${sampleUsers.length} sample users`);

    // Get category IDs
    const electricianCat = categories.find(c => c.slug === "electrician");
    const plumberCat = categories.find(c => c.slug === "plumber");
    const beautyCat = categories.find(c => c.slug === "beauty");
    const cakeCat = categories.find(c => c.slug === "cake-shop");
    const streetFoodCat = categories.find(c => c.slug === "street-food");
    const restaurantCat = categories.find(c => c.slug === "restaurants");
    const groceryCat = categories.find(c => c.slug === "grocery"); // --- NAYI GROCERY CATEGORY ---

    // Create service providers
    const providers = [];

    // ... (Saare puraane providers waise hi rahenge: Electrician, Plumber, Beauty, Cake, Street Food, Restaurants) ...

    // (Electrician providers... code yahaan hai)
    if (electricianCat && sampleUsers.length >= 3) {
      const electricians = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[0].id,
          categoryId: electricianCat.id,
          businessName: "Rajesh Electrical Works",
          description: "Expert in AC, refrigerator, and TV repairs with 15 years of experience. 24/7 emergency service available.",
          experience: 15,
          address: "Shop 12, Malviya Nagar, Delhi",
          latitude: "28.5355",
          longitude: "77.2090",
          rating: "4.8",
          reviewCount: 127,
          serviceArea: 15,
          isVerified: true,
          isAvailable: true,
          specializations: ["AC Repair", "Refrigerator", "TV Repair", "Microwave"],
        },
        {
          userId: sampleUsers[1].id,
          categoryId: electricianCat.id,
          businessName: "Amit Electronics Repair",
          description: "Specialized in washing machine and microwave repairs. Quick and reliable service.",
          experience: 10,
          address: "Sector 18, Noida",
          latitude: "28.5678",
          longitude: "77.3249",
          rating: "4.6",
          reviewCount: 89,
          serviceArea: 12,
          isVerified: true,
          isAvailable: true,
          specializations: ["Washing Machine", "Microwave", "Dishwasher", "Water Heater"],
        },
        {
          userId: sampleUsers[2].id,
          categoryId: electricianCat.id,
          businessName: "Suresh Home Appliances",
          description: "Water heater installation and all home appliance repairs at affordable rates.",
          experience: 8,
          address: "Tilak Nagar, Delhi",
          latitude: "28.6412",
          longitude: "77.0912",
          rating: "4.7",
          reviewCount: 56,
          serviceArea: 10,
          isVerified: true,
          isAvailable: true,
          specializations: ["Water Heater", "AC", "All Appliances"],
        },
      ]).onConflictDoNothing().returning();
      providers.push(...electricians);
      console.log(`✅ Created ${electricians.length} electrician providers`);
    }

    // (Plumber providers... code yahaan hai)
    if (plumberCat && sampleUsers.length >= 5) {
      const plumbers = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[3].id,
          categoryId: plumberCat.id,
          businessName: "Vikram Plumbing Services",
          description: "24/7 emergency plumbing services. Pipe leaks, blockages, and bathroom fittings specialist.",
          experience: 12,
          address: "Dwarka Sector 10, Delhi",
          latitude: "28.5921",
          longitude: "77.0460",
          rating: "4.7",
          reviewCount: 98,
          serviceArea: 12,
          isVerified: true,
          isAvailable: true,
          specializations: ["Pipe Repair", "Drain Cleaning", "Bathroom Fitting"],
        },
        {
          userId: sampleUsers[4].id,
          categoryId: plumberCat.id,
          businessName: "Rahul Quick Fix Plumbing",
          description: "Expert in tap repairs, drain cleaning, and water tank installation. Same day service.",
          experience: 8,
          address: "Rohini Sector 15, Delhi",
          latitude: "28.7417",
          longitude: "77.1025",
          rating: "4.5",
          reviewCount: 67,
          serviceArea: 10,
          isVerified: true,
          isAvailable: true,
          specializations: ["Tap Repair", "Tank Installation", "Emergency Service"],
        },
      ]).onConflictDoNothing().returning();
      providers.push(...plumbers);
      console.log(`✅ Created ${plumbers.length} plumber providers`);
    }

    // (Beauty parlor providers... code yahaan hai)
    if (beautyCat && sampleUsers.length >= 7) {
      const beautyProviders = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[5].id,
          categoryId: beautyCat.id,
          businessName: "Priya's Beauty Lounge",
          description: "Premium beauty services - Hair, Makeup, Spa, and Bridal packages. Experienced beauticians.",
          experience: 10,
          address: "Karol Bagh, Delhi",
          latitude: "28.6519",
          longitude: "77.1900",
          rating: "4.9",
          reviewCount: 156,
          serviceArea: 10,
          isVerified: true,
          isAvailable: true,
          specializations: ["Hair Styling", "Bridal Makeup", "Spa", "Facial"],
        },
        {
          userId: sampleUsers[6].id,
          categoryId: beautyCat.id,
          businessName: "Sonal Unisex Salon",
          description: "Complete beauty solutions for men and women. Expert stylists and modern equipment.",
          experience: 7,
          address: "Lajpat Nagar, Delhi",
          latitude: "28.5677",
          longitude: "77.2430",
          rating: "4.6",
          reviewCount: 92,
          serviceArea: 8,
          isVerified: true,
          isAvailable: true,
          specializations: ["Hair Cut", "Facial", "Makeup", "Manicure"],
        },
      ]).onConflictDoNothing().returning();
      providers.push(...beautyProviders);
      console.log(`✅ Created ${beautyProviders.length} beauty parlor providers`);
    }

    // (Cake shop providers... code yahaan hai)
    if (cakeCat && sampleUsers.length >= 9) {
      const cakeShops = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[7].id,
          categoryId: cakeCat.id,
          businessName: "Sweet Dreams Bakery",
          description: "Custom cakes for birthdays, anniversaries, and weddings. Eggless options available.",
          experience: 8,
          address: "Connaught Place, Delhi",
          latitude: "28.6304",
          longitude: "77.2177",
          rating: "4.8",
          reviewCount: 234,
          serviceArea: 20,
          isVerified: true,
          isAvailable: true,
          specializations: ["Birthday Cakes", "Wedding Cakes", "Eggless", "Custom Design"],
        },
        {
          userId: sampleUsers[8].id,
          categoryId: cakeCat.id,
          businessName: "Cake Hub & Delights",
          description: "Delicious designer cakes and cupcakes. Same-day delivery available for select items.",
          experience: 5,
          address: "Saket, Delhi",
          latitude: "28.5244",
          longitude: "77.2066",
          rating: "4.7",
          reviewCount: 178,
          serviceArea: 15,
          isVerified: true,
          isAvailable: true,
          specializations: ["Designer Cakes", "Cupcakes", "Fast Delivery", "Photo Cakes"],
        },
      ]).onConflictDoNothing().returning();
      providers.push(...cakeShops);
      console.log(`✅ Created ${cakeShops.length} cake shop providers`);
    }

    // (Street food vendors... code yahaan hai)
    // (Street food vendors... REMOVED AS PER USER REQUEST)
    // if (streetFoodCat && sampleUsers.length >= 11) {
    //   // ... Removed fake vendors ...
    // }

    // (Restaurant providers... code yahaan hai)
    if (restaurantCat && sampleUsers.length >= 13) {
      const restaurants = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[11].id,
          categoryId: restaurantCat.id,
          businessName: "Punjabi Dhaba Restaurant",
          description: "Authentic Punjabi cuisine. Family dining with live music on weekends.",
          experience: 15,
          address: "Rajouri Garden, Delhi",
          latitude: "28.6410",
          longitude: "77.1200",
          rating: "4.7",
          reviewCount: 432,
          serviceArea: 8,
          isVerified: true,
          isAvailable: true,
          specializations: ["North Indian", "Punjabi", "Tandoor", "Dal Makhani"],
        },
        {
          userId: sampleUsers[12].id,
          categoryId: restaurantCat.id,
          businessName: "Chinese Wok Express",
          description: "Best Chinese and Thai food. Cozy ambiance with quick service.",
          experience: 8,
          address: "Greater Kailash, Delhi",
          latitude: "28.5494",
          longitude: "77.2428",
          rating: "4.5",
          reviewCount: 289,
          serviceArea: 6,
          isVerified: true,
          isAvailable: true,
          specializations: ["Chinese", "Thai", "Asian Fusion", "Noodles"],
        },
      ]).onConflictDoNothing().returning();
      providers.push(...restaurants);
      console.log(`✅ Created ${restaurants.length} restaurants`);

      // Add restaurant menu items
      if (restaurants.length > 0) {
        const restaurantMenu = await db.insert(restaurantMenuItems).values([
          // ... (restaurant items ka code yahaan hai) ...
          {
            providerId: restaurants[0].id,
            name: "Butter Chicken",
            description: "Tender chicken in rich tomato and butter gravy",
            category: "Main Course",
            price: "380",
            isVeg: false,
            isAvailable: true,
            cuisine: "Indian",
          },
          {
            providerId: restaurants[0].id,
            name: "Dal Makhani",
            description: "Black lentils slow-cooked with butter and cream",
            category: "Main Course",
            price: "280",
            isVeg: true,
            isAvailable: true,
            cuisine: "Indian",
          },
          {
            providerId: restaurants[0].id,
            name: "Paneer Tikka Masala",
            description: "Grilled paneer in creamy tomato sauce",
            category: "Main Course",
            price: "320",
            isVeg: true,
            isAvailable: true,
            cuisine: "Indian",
          },
          {
            providerId: restaurants[1].id,
            name: "Hakka Noodles",
            description: "Stir-fried noodles with vegetables and sauces",
            category: "Main Course",
            price: "220",
            isVeg: true,
            isAvailable: true,
            cuisine: "Chinese",
          },
          {
            providerId: restaurants[1].id,
            name: "Chicken Manchurian",
            description: "Crispy chicken in spicy Manchurian sauce",
            category: "Main Course",
            price: "340",
            isVeg: false,
            isAvailable: true,
            cuisine: "Chinese",
          },
          {
            providerId: restaurants[1].id,
            name: "Thai Green Curry",
            description: "Aromatic green curry with vegetables and coconut milk",
            category: "Main Course",
            price: "360",
            isVeg: true,
            isAvailable: true,
            cuisine: "Thai",
          },
        ]).onConflictDoNothing().returning();

        console.log(`✅ Created ${restaurantMenu.length} restaurant menu items`);
      }
    }

    // --- YEH HAI NAYA GMART PROVIDER BLOCK ---
    let gmartProviderId: string | undefined = undefined;
    if (groceryCat && sampleUsers.length >= 14) { // 14th user
      const gmartProvider = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[13].id, // 14th user (index 13)
          categoryId: groceryCat.id,
          businessName: "GMart Official Store",
          description: "Fresh groceries delivered to your doorstep.",
          experience: 5,
          address: "GMart Warehouse, Shirur",
          latitude: "18.8266",
          longitude: "74.3411",
          rating: "4.9",
          reviewCount: 1200,
          serviceArea: 25,
          isVerified: true,
          isAvailable: true,
          specializations: ["Fresh Produce", "Dairy", "Staples", "Fast Delivery"],
        },
      ]).onConflictDoNothing().returning();

      if (gmartProvider.length > 0) {
        providers.push(gmartProvider[0]);
        gmartProviderId = gmartProvider[0].id;
        console.log(`✅ Created GMart provider`);
      } else {
        // Agar provider pehle se tha, toh usko fetch kar lo
        const existingProvider = await db.query.serviceProviders.findFirst({
          where: (sp, { eq }) => eq(sp.userId, sampleUsers[13].id)
        });
        if (existingProvider) {
          gmartProviderId = existingProvider.id;
          console.log(`✅ Found existing GMart provider`);
        }
      }
    }

    // --- YEH HAI NAYA/FIXED GROCERY ITEMS BLOCK ---
    if (!gmartProviderId) {
      console.error("❌ GMart provider ID not found! Cannot seed grocery items.");
      throw new Error("GMart provider setup failed.");
    }

    // Purane items delete karo
    await db.delete(groceryProducts);
    console.log("✅ Cleared existing grocery products");

    const groceryItems = await db.insert(groceryProducts).values([
      {
        providerId: gmartProviderId, // <-- LINKED
        name: "Fresh Bananas",
        description: "Premium quality ripe bananas",
        category: "fruits",
        price: "60.00",
        weight: "1 dozen",
        unit: "dozen",
        inStock: true,
        stockQuantity: 50,
        imageUrl: 'https://m.media-amazon.com/images/I/51eb+Yc523L._SL1000_.jpg',
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: "Fresh Apples",
        description: "Crisp and juicy red apples",
        category: "fruits",
        price: "150.00",
        weight: "1 kg",
        unit: "kg",
        inStock: true,
        stockQuantity: 30,
        imageUrl: 'https://cdn.shopify.com/s/files/1/0530/2369/products/FreshApples.jpg?v=1604130099',
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: "Whole Wheat Bread",
        description: "Freshly baked whole wheat bread",
        category: "bakery",
        price: "45.00",
        weight: "400g",
        unit: "pack",
        inStock: true,
        stockQuantity: 30,
        imageUrl: 'https://img.etimg.com/thumb/msid-68194451,width-1200,height-900,resizemode-4/.jpg',
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: "Toned Milk",
        description: "Fresh toned milk",
        category: "dairy",
        price: "56.00",
        weight: "1L",
        unit: "liter",
        inStock: true,
        stockQuantity: 100,
        imageUrl: 'https://media.istockphoto.com/id/1179754291/photo/milk-glass-and-bottle-with-milk-splashes-clip-art-milk-illustration-isolated-on-white.jpg?s=612x612&w=0&k=20&c=L_Jj9S_MhQdM-v3G1I_UvK27n-l894DqK4_kR36qR1w=',
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: "Basmati Rice",
        description: "Premium long grain basmati rice",
        category: "staples",
        price: "180.00",
        weight: "1 kg",
        unit: "kg",
        inStock: true,
        stockQuantity: 40,
        imageUrl: 'https://m.media-amazon.com/images/I/71u9yH0K2WL.jpg',
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: "Fresh Tomatoes",
        description: "Farm fresh red tomatoes",
        category: "vegetables",
        price: "35.00",
        weight: "500g",
        unit: "pack",
        inStock: true,
        stockQuantity: 60,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg',
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: 'Detergent Soap',
        description: 'Lifebuoy Total 10 for germ protection',
        category: 'toiletries',
        price: '90.00',
        weight: '125g',
        unit: 'bar',
        imageUrl: 'https://www.jiomart.com/images/product/original/491410756/lifebuoy-total-10-bathing-soap-125-g-product-images-o491410756-p590059341-0-202302281831.jpeg?im=Resize=(1000,1000)',
        inStock: true,
        stockQuantity: 50,
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: 'Colgate Toothpaste',
        description: 'For strong teeth and fresh breath',
        category: 'toiletries',
        price: '110.00',
        weight: '150g',
        unit: 'tube',
        imageUrl: 'https://www.colgate.com/content/dam/cp-sites/oral-care/oral-care-center/en-us/product-detail-pages/toothpaste/colgate-total-plaque-pro-release-paste-product.jpg',
        inStock: true,
        stockQuantity: 40,
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: 'Dettol Handwash',
        description: 'Protects from 100 illness-causing germs',
        category: 'personal-care',
        price: '180.00',
        weight: '250ml',
        unit: 'bottle',
        imageUrl: 'https://www.godrejprotekt.com/cdn/shop/products/3-min_8b4172f3-c5f1-460d-a06f-12c8b827e8a9.jpg?v=1661858599',
        inStock: true,
        stockQuantity: 60,
      },
      {
        providerId: gmartProviderId, // <-- LINKED
        name: 'Dove Shampoo',
        description: 'For smooth and shiny hair',
        category: 'personal-care',
        price: '300.00',
        weight: '360ml',
        unit: 'bottle',
        imageUrl: 'https://m.media-amazon.com/images/I/61N+p2uL7GL._SL1500_.jpg',
        inStock: true,
        stockQuantity: 35,
      },
    ]).returning(); // .onConflictDoNothing() hata diya kyunki hum pehle delete kar rahe hain


    console.log(`✅ Created ${groceryItems.length} grocery items`);

    console.log("✨ Database seeding completed successfully!");
    console.log(`📊 Total providers created: ${providers.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✅ Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });