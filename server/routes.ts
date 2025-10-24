import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
// in server/routes.ts

import { uploadToCloudinary } from './cloudinary'; // Naya import
import multer from 'multer'; // Naya import

const upload = multer({ storage: multer.memoryStorage() }); // Multer setup
  
import { storage } from "./storage";
import { 
  insertBookingSchema, 
  insertGroceryOrderSchema, 
  insertRentalPropertySchema,
  insertTableBookingSchema,
  insertUserSchema,
  insertServiceProviderSchema
} from "@shared/schema";

// Initialize Stripe (only if API key is available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });
}

// Twilio for call routing (if available)
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Middleware (simplified) to check if user is a provider
  const isProvider = async (req: any, res: any, next: any) => {
      const userId = req.session.userId;
      if (!userId) {
          return res.status(401).json({ message: "Aap logged in nahi hain." });
      }

      const provider = await storage.getProviderByUserId(userId);
      if (!provider) {
          return res.status(403).json({ message: "Aap ek service provider nahi hain." });
      }

      req.provider = provider;
      next();
  };

  // --- AUTHENTICATION ROUTES ---
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, role, phone } = req.body;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || "customer",
        phone,
      });

      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any).userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- PROVIDER PROFILE ROUTES ---
  app.post("/api/provider/profile", async (req, res) => {
    try {
      const userId = (req.session as any).userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const providerData = insertServiceProviderSchema.parse(req.body);
      const { categoryId } = req.body;

      const provider = await storage.createServiceProvider({
        ...providerData,
        userId,
        categoryId,
      });

      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/provider/profile", async (req, res) => {
    try {
      const userId = (req.session as any).userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const provider = await storage.getProviderByUserId(userId);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      res.json(provider);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- GENERAL SERVICE ROUTES ---
  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-providers", async (req, res) => {
    try {
      const { category, lat, lng, radius } = req.query;
      const latitude = lat ? parseFloat(lat as string) : undefined;
      const longitude = lng ? parseFloat(lng as string) : undefined;
      const searchRadius = radius ? parseInt(radius as string) : 10;

      const providers = await storage.getServiceProviders(
        category as string, 
        latitude, 
        longitude, 
        searchRadius
      );
      res.json(providers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-providers/:id", async (req, res) => {
    try {
      const provider = await storage.getServiceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/service-problems/:categoryId", async (req, res) => {
    try {
      const { parentId } = req.query;
      const problems = await storage.getServiceProblems(
        req.params.categoryId, 
        parentId as string
      );
      res.json(problems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- SPECIFIC SERVICE GET ROUTES ---
  app.get("/api/beauty-services/:providerId", async (req, res) => {
    try {
      const services = await storage.getBeautyServices(req.params.providerId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/cake-products/:providerId", async (req, res) => {
    try {
      const products = await storage.getCakeProducts(req.params.providerId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/grocery-products", async (req, res) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getGroceryProducts(
        category as string, 
        search as string
      );
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/grocery-products/:id", async (req, res) => {
    try {
      const product = await storage.getGroceryProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rental-properties", async (req, res) => {
    try {
      const { propertyType, minRent, maxRent, furnishing, locality } = req.query;
      const properties = await storage.getRentalProperties({
        propertyType: propertyType as string,
        minRent: minRent ? parseInt(minRent as string) : undefined,
        maxRent: maxRent ? parseInt(maxRent as string) : undefined,
        furnishing: furnishing as string,
        locality: locality as string,
      });
      res.json(properties);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rental-properties/:id", async (req, res) => {
    try {
      const property = await storage.getRentalProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/restaurant-menu-items", async (req, res) => {
    try {
      const { providerId } = req.query;
      const items = await storage.getRestaurantMenuItems(providerId as string);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- STREET FOOD & MENU MANAGEMENT ROUTES ---
  app.get("/api/street-food-items", async (req, res) => {
    try {
      const { providerId, search } = req.query; 
      const items = await storage.getStreetFoodItems(providerId as string, search as string); 
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get provider's menu items (category-aware)
  app.get("/api/provider/menu", isProvider, async (req: any, res) => {
    try {
      const provider = req.provider;
      const category = await storage.getServiceCategory(provider.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Provider category not found" });
      }
      const menuItems = await storage.getProviderMenuItems(provider.id, category.slug);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/menu-items", isProvider, async (req: any, res) => {
    try {
      const newItemData = req.body;
      const provider = req.provider;
      
      // Get provider's category to determine which table to use
      const providerWithCategory = await storage.getServiceProvider(provider.id);
      if (!providerWithCategory) {
        return res.status(400).json({ message: "Provider not found" });
      }
      
      const newItem = await storage.createMenuItem(newItemData, provider.id, providerWithCategory.category.slug);
      res.status(201).json(newItem);
    } catch (error: any) {
      res.status(400).json({ message: "Item add nahi ho paaya: " + error.message });
    }
  });

  app.patch("/api/menu-items/:itemId", isProvider, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const updates = req.body;
      const provider = req.provider;
      
      // Get provider's category
      const providerWithCategory = await storage.getServiceProvider(provider.id);
      if (!providerWithCategory) {
        return res.status(400).json({ message: "Provider not found" });
      }
      
      const updatedItem = await storage.updateMenuItem(itemId, provider.id, providerWithCategory.category.slug, updates);
      if (!updatedItem) return res.status(404).json({ message: "Menu item nahi mila ya aap iske maalik nahi hain." });
      res.json(updatedItem);
    } catch (error: any) {
      res.status(400).json({ message: "Item update nahi ho paaya: " + error.message });
    }
  });

  app.delete("/api/menu-items/:itemId", isProvider, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const provider = req.provider;
      
      // Get provider's category
      const providerWithCategory = await storage.getServiceProvider(provider.id);
      if (!providerWithCategory) {
        return res.status(400).json({ message: "Provider not found" });
      }
      
      const deletedItem = await storage.deleteMenuItem(itemId, provider.id, providerWithCategory.category.slug);
      if (!deletedItem) return res.status(404).json({ message: "Menu item nahi mila ya aap iske maalik nahi hain." });
      res.json({ message: "Menu item successfully delete ho gaya." });
    } catch (error: any) {
      res.status(500).json({ message: "Item delete nahi ho paaya: " + error.message });
    }
  });

  // in server/routes.ts -> inside registerRoutes

  // --- IMAGE UPLOAD ROUTE ---
  app.post("/api/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Koi image file nahi mili." });
      }

      // Humari cloudinary.ts file se upload function call kiya
      const imageUrl = await uploadToCloudinary(req.file.buffer);

      // Frontend ko image ka URL wapas bhej diya
      res.status(200).json({ imageUrl });

    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Image upload fail ho gayi: " + error.message });
    }
  });

  // --- BOOKING & ORDER ROUTES ---
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const { userId } = req.body;
      const booking = await storage.createBooking({ ...bookingData, userId });
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { status, providerId } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status, providerId);
      // ... SMS logic ...
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/bookings/provider/:providerId", async (req, res) => {
    try {
      const bookings = await storage.getProviderBookings(req.params.providerId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/user/:userId", async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(req.params.userId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/grocery-orders", async (req, res) => {
    try {
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const { userId } = req.body;
      const order = await storage.createGroceryOrder({ ...orderData, userId });
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/table-bookings", async (req, res) => {
    try {
      const validatedData = insertTableBookingSchema.parse(req.body);
      const booking = await storage.createTableBooking({
        ...validatedData,
        userId: req.body.userId || "user-1",
        providerId: req.body.providerId,
      });
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/table-bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getTableBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/table-bookings/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateTableBookingStatus(req.params.id, status);
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/table-bookings/user/:userId", async (req, res) => {
    try {
      const bookings = await storage.getUserTableBookings(req.params.userId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- PAYMENT & REVIEW ROUTES ---
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) return res.status(503).json({ message: "Payment service not configured." });
      const { amount, orderId, currency = 'inr' } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: { orderId: orderId || '' },
      });
      if (orderId) await storage.updateOrderPaymentId(orderId, paymentIntent.id);
      res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const { userId, providerId, bookingId, rating, comment } = req.body;
      const review = await storage.createReview({
        userId, providerId, bookingId,
        rating: parseInt(rating), comment,
      });
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/reviews/provider/:providerId", async (req, res) => {
    try {
      const reviews = await storage.getProviderReviews(req.params.providerId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // --- TWILIO (CALLING) ROUTES ---
  app.post("/api/call-request", async (req, res) => { /* ... (aapka code yahan) ... */ });
  app.post("/api/call-webhook", async (req, res) => { /* ... (aapka code yahan) ... */ });
  app.post("/api/call-response", async (req, res) => { /* ... (aapka code yahan) ... */ });

  const httpServer = createServer(app);
  return httpServer;
}