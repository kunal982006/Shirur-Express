import { db } from "./db";
import { 
  users, serviceCategories, serviceProviders, 
  streetFoodItems, restaurantMenuItems, groceryProducts
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create service categories
    const categories = await db.insert(serviceCategories).values([
      { name: "Electrician", slug: "electrician", description: "Professional electrical services" },
      { name: "Plumber", slug: "plumber", description: "Expert plumbing solutions" },
      { name: "Beauty Parlor", slug: "beauty", description: "Beauty and grooming services" },
      { name: "Cake Shop", slug: "cake-shop", description: "Custom cakes for all occasions" },
      { name: "Grocery", slug: "grocery", description: "Fresh groceries delivered" },
      { name: "Rental", slug: "rental", description: "No brokerage property rentals" },
      { name: "Street Food", slug: "street-food", description: "Delicious street food vendors" },
      { name: "Restaurants", slug: "restaurants", description: "Dine-in and table reservations" },
    ]).onConflictDoNothing().returning();

    console.log(`✅ Created ${categories.length} service categories`);

    // Create sample users
    const sampleUsers = await db.insert(users).values([
      { 
        username: "vendor1", 
        email: "vendor1@servicehub.com", 
        password: "hashed_password_123",
        role: "provider",
        phone: "+91-9876543210"
      },
      { 
        username: "vendor2", 
        email: "vendor2@servicehub.com", 
        password: "hashed_password_123",
        role: "provider",
        phone: "+91-9876543211"
      },
      { 
        username: "restaurant1", 
        email: "restaurant1@servicehub.com", 
        password: "hashed_password_123",
        role: "provider",
        phone: "+91-9876543212"
      },
    ]).onConflictDoNothing().returning();

    console.log(`✅ Created ${sampleUsers.length} sample users`);

    // Get category IDs
    const streetFoodCategory = categories.find(c => c.slug === "street-food");
    const restaurantCategory = categories.find(c => c.slug === "restaurants");

    if (streetFoodCategory && sampleUsers.length > 0) {
      // Create street food vendors
      const streetFoodVendors = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[0].id,
          categoryId: streetFoodCategory.id,
          businessName: "Chaat Corner",
          description: "Authentic North Indian street food with a modern twist",
          address: "MG Road, Bangalore",
          latitude: "12.9716",
          longitude: "77.5946",
          rating: "4.5",
          reviewCount: 127,
          isVerified: true,
          isAvailable: true,
          specializations: ["Chaat", "Pani Puri", "Bhel Puri"],
        },
        {
          userId: sampleUsers[1].id,
          categoryId: streetFoodCategory.id,
          businessName: "Momos King",
          description: "Steamed and fried momos with variety of fillings",
          address: "Indiranagar, Bangalore",
          latitude: "12.9719",
          longitude: "77.6412",
          rating: "4.7",
          reviewCount: 89,
          isVerified: true,
          isAvailable: true,
          specializations: ["Momos", "Dumplings", "Noodles"],
        },
      ]).onConflictDoNothing().returning();

      console.log(`✅ Created ${streetFoodVendors.length} street food vendors`);

      // Add street food items
      if (streetFoodVendors.length > 0) {
        const streetFoodMenuItems = await db.insert(streetFoodItems).values([
          // Chaat Corner items
          {
            providerId: streetFoodVendors[0].id,
            name: "Pani Puri",
            description: "Crispy puris with tangy tamarind water and potato filling",
            category: "Chaat",
            price: "40",
            isVeg: true,
            isAvailable: true,
            spicyLevel: "Medium",
          },
          {
            providerId: streetFoodVendors[0].id,
            name: "Bhel Puri",
            description: "Puffed rice mixed with vegetables and chutneys",
            category: "Chaat",
            price: "50",
            isVeg: true,
            isAvailable: true,
            spicyLevel: "Mild",
          },
          {
            providerId: streetFoodVendors[0].id,
            name: "Sev Puri",
            description: "Crispy puris topped with potatoes, sev, and chutneys",
            category: "Chaat",
            price: "45",
            isVeg: true,
            isAvailable: true,
            spicyLevel: "Medium",
          },
          // Momos King items
          {
            providerId: streetFoodVendors[1].id,
            name: "Veg Steamed Momos",
            description: "Steamed dumplings with mixed vegetable filling",
            category: "Momos",
            price: "80",
            isVeg: true,
            isAvailable: true,
            spicyLevel: "Mild",
          },
          {
            providerId: streetFoodVendors[1].id,
            name: "Chicken Fried Momos",
            description: "Crispy fried momos with chicken filling",
            category: "Momos",
            price: "120",
            isVeg: false,
            isAvailable: true,
            spicyLevel: "Medium",
          },
          {
            providerId: streetFoodVendors[1].id,
            name: "Paneer Momos",
            description: "Steamed momos with spicy paneer filling",
            category: "Momos",
            price: "100",
            isVeg: true,
            isAvailable: true,
            spicyLevel: "Hot",
          },
        ]).onConflictDoNothing().returning();

        console.log(`✅ Created ${streetFoodMenuItems.length} street food items`);
      }
    }

    if (restaurantCategory && sampleUsers.length > 2) {
      // Create restaurants
      const restaurants = await db.insert(serviceProviders).values([
        {
          userId: sampleUsers[2].id,
          categoryId: restaurantCategory.id,
          businessName: "Spice Garden",
          description: "Fine dining with authentic Indian cuisine",
          address: "Koramangala, Bangalore",
          latitude: "12.9352",
          longitude: "77.6245",
          rating: "4.8",
          reviewCount: 245,
          isVerified: true,
          isAvailable: true,
          specializations: ["Indian", "North Indian", "Tandoor"],
        },
        {
          userId: sampleUsers[0].id,
          categoryId: restaurantCategory.id,
          businessName: "The Italian Hub",
          description: "Authentic Italian pasta and pizzas",
          address: "HSR Layout, Bangalore",
          latitude: "12.9121",
          longitude: "77.6446",
          rating: "4.6",
          reviewCount: 178,
          isVerified: true,
          isAvailable: true,
          specializations: ["Italian", "Pizza", "Pasta"],
        },
      ]).onConflictDoNothing().returning();

      console.log(`✅ Created ${restaurants.length} restaurants`);

      // Add restaurant menu items
      if (restaurants.length > 0) {
        const restaurantMenu = await db.insert(restaurantMenuItems).values([
          // Spice Garden items
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
            name: "Paneer Tikka Masala",
            description: "Grilled paneer in creamy tomato sauce",
            category: "Main Course",
            price: "320",
            isVeg: true,
            isAvailable: true,
            cuisine: "Indian",
          },
          {
            providerId: restaurants[0].id,
            name: "Gulab Jamun",
            description: "Classic Indian sweet dumplings in sugar syrup",
            category: "Desserts",
            price: "120",
            isVeg: true,
            isAvailable: true,
            cuisine: "Indian",
          },
          // The Italian Hub items
          {
            providerId: restaurants[1].id,
            name: "Margherita Pizza",
            description: "Classic pizza with tomato sauce, mozzarella, and basil",
            category: "Main Course",
            price: "450",
            isVeg: true,
            isAvailable: true,
            cuisine: "Italian",
          },
          {
            providerId: restaurants[1].id,
            name: "Alfredo Pasta",
            description: "Creamy fettuccine pasta with parmesan",
            category: "Main Course",
            price: "380",
            isVeg: true,
            isAvailable: true,
            cuisine: "Italian",
          },
          {
            providerId: restaurants[1].id,
            name: "Tiramisu",
            description: "Classic Italian dessert with coffee and mascarpone",
            category: "Desserts",
            price: "180",
            isVeg: true,
            isAvailable: true,
            cuisine: "Italian",
          },
        ]).onConflictDoNothing().returning();

        console.log(`✅ Created ${restaurantMenu.length} restaurant menu items`);
      }
    }

    // Add some grocery products
    const groceryItems = await db.insert(groceryProducts).values([
      {
        name: "Fresh Bananas",
        description: "Premium quality ripe bananas",
        category: "Fruits",
        price: "40",
        weight: "1 dozen",
        inStock: true,
        stockQuantity: 50,
      },
      {
        name: "Whole Wheat Bread",
        description: "Freshly baked whole wheat bread",
        category: "Bakery",
        price: "45",
        weight: "400g",
        inStock: true,
        stockQuantity: 30,
      },
      {
        name: "Toned Milk",
        description: "Fresh toned milk",
        category: "Dairy",
        price: "56",
        weight: "1L",
        inStock: true,
        stockQuantity: 100,
      },
    ]).onConflictDoNothing().returning();

    console.log(`✅ Created ${groceryItems.length} grocery items`);

    console.log("✨ Database seeding completed successfully!");
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
