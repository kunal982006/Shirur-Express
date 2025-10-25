// server/routes.ts (FINAL UPDATED - TYPE FIXES)

import type { Express, Request, Response, NextFunction } from "express"; // Import Request, Response, NextFunction
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from './cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import { storage } from "./storage"; // storage module import
import {
  insertBookingSchema,
  insertGroceryOrderSchema,
  insertRentalPropertySchema,
  insertTableBookingSchema,
  insertUserSchema,
  insertServiceProviderSchema,
} from "@shared/schema"; // Assuming these are correctly defined

// Initialize Stripe (only if API key is available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2020-08-27", // Standard Stripe API version
  });
}

// Twilio for call routing (if available)
let twilioClient: any = null; // TwilioClient type would be better if defined
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio'); // CommonJS import for Twilio
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Custom Request type for middleware to avoid 'any'
interface CustomRequest extends Request {
  provider?: { // Define properties that your provider object has
    id: string;
    userId: string;
    categoryId: string;
    // Add other provider properties here as needed (e.g., name, description)
  };
}

// Middleware to check if user is a provider (updated to use req.session directly and CustomRequest)
const isProvider = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const userId = req.session.userId; // Direct access from extended SessionData
  if (!userId) {
    return res.status(401).json({ message: "Aap logged in nahi hain." });
  }

  const provider = await storage.getProviderByUserId(userId);
  if (!provider) {
    return res.status(403).json({ message: "Aap ek service provider nahi hain." });
  }

  req.provider = provider; // Assign to req.provider directly
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {

  // --- AUTHENTICATION ROUTES ---
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password, role, phone } = req.body;

      if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Username, email, password, and role are required." });
      }

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

      req.session.userId = user.id;
      req.session.userRole = user.role;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error after signup:", err);
          return res.status(500).json({ message: "Signup successful, but session could not be established." });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, message: "Signed up and logged in successfully!" });
      });

    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: error.message || "Error during signup" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error after login:", err);
          return res.status(500).json({ message: "Login successful, but session could not be established." });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, message: "Logged in successfully!" });
      });

    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Error during login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ user: null, message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        req.session.destroy(() => {
          res.clearCookie("connect.sid");
          return res.status(404).json({ user: null, message: "Authenticated user not found, session cleared." });
        });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("GET /api/auth/me error:", error);
      res.status(500).json({ user: null, message: error.message || "Error fetching user data" });
    }
  });

  // --- PROVIDER PROFILE ROUTES ---
  app.post("/api/provider/profile", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;

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

      res.status(201).json(provider);
    } catch (error: any) {
      console.error("Create provider profile error:", error);
      res.status(400).json({ message: error.message || "Error creating provider profile" });
    }
  });

  app.get("/api/provider/profile", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const provider = await storage.getProviderByUserId(userId);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      res.json(provider);
    } catch (error: any) {
      console.error("Get provider profile error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider profile" });
    }
  });

  // --- GENERAL SERVICE ROUTES ---
  app.get("/api/service-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Get service categories error:", error);
      res.status(500).json({ message: error.message || "Error fetching service categories" });
    }
  });

  app.get("/api/service-providers", async (req: Request, res: Response) => {
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
      console.error("Get service providers error:", error);
      res.status(500).json({ message: error.message || "Error fetching service providers" });
    }
  });

  app.get("/api/service-providers/:id", async (req: Request, res: Response) => {
    try {
      const provider = await storage.getServiceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      res.json(provider);
    } catch (error: any) {
      console.error("Get service provider by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching service provider" });
    }
  });

  app.get("/api/service-problems/:categoryId", async (req: Request, res: Response) => {
    try {
      const { parentId } = req.query;
      const problems = await storage.getServiceProblems(
        req.params.categoryId,
        parentId as string
      );
      res.json(problems);
    } catch (error: any) {
      console.error("Get service problems error:", error);
      res.status(500).json({ message: error.message || "Error fetching service problems" });
    }
  });

  // --- SPECIFIC SERVICE GET ROUTES ---
  app.get("/api/beauty-services/:providerId", async (req: Request, res: Response) => {
    try {
      const services = await storage.getBeautyServices(req.params.providerId);
      res.json(services);
    } catch (error: any) {
      console.error("Get beauty services error:", error);
      res.status(500).json({ message: error.message || "Error fetching beauty services" });
    }
  });

  app.get("/api/cake-products/:providerId", async (req: Request, res: Response) => {
    try {
      const products = await storage.getCakeProducts(req.params.providerId);
      res.json(products);
    } catch (error: any) {
      console.error("Get cake products error:", error);
      res.status(500).json({ message: error.message || "Error fetching cake products" });
    }
  });

  app.get("/api/grocery-products", async (req: Request, res: Response) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getGroceryProducts(
        category as string,
        search as string
      );
      res.json(products);
    } catch (error: any) {
      console.error("Get grocery products error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery products" });
    }
  });

  app.get("/api/grocery-products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getGroceryProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      console.error("Get grocery product by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery product" });
    }
  });

  app.get("/api/rental-properties", async (req: Request, res: Response) => {
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
      console.error("Get rental properties error:", error);
      res.status(500).json({ message: error.message || "Error fetching rental properties" });
    }
  });

  app.get("/api/rental-properties/:id", async (req: Request, res: Response) => {
    try {
      const property = await storage.getRentalProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error: any) {
      console.error("Get rental property by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching rental property" });
    }
  });

  app.get("/api/restaurant-menu-items", async (req: Request, res: Response) => {
    try {
      const { providerId } = req.query;
      const items = await storage.getRestaurantMenuItems(providerId as string);
      res.json(items);
    } catch (error: any) {
      console.error("Get restaurant menu items error:", error);
      res.status(500).json({ message: error.message || "Error fetching restaurant menu items" });
    }
  });

  // --- STREET FOOD & MENU MANAGEMENT ROUTES ---
  app.get("/api/street-food-items", async (req: Request, res: Response) => {
    try {
      const { providerId, search } = req.query;
      const items = await storage.getStreetFoodItems(providerId as string, search as string);
      res.json(items);
    } catch (error: any) {
      console.error("Get street food items error:", error);
      res.status(500).json({ message: error.message || "Error fetching street food items" });
    }
  });

  // Get provider's menu items (category-aware)
  app.get("/api/provider/menu", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      // req.provider is now correctly typed as CustomRequest['provider']
      const provider = req.provider!; // ! asserts that provider is not undefined
      const category = await storage.getServiceCategory(provider.categoryId);
      if (!category) {
        return res.status(400).json({ message: "Provider category not found" });
      }
      const menuItems = await storage.getProviderMenuItems(provider.id, category.slug);
      res.json(menuItems);
    } catch (error: any) {
      console.error("Get provider menu error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider menu" });
    }
  });

  app.post("/api/menu-items", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const newItemData = req.body;
      const provider = req.provider!;

      const providerWithCategory = await storage.getServiceProvider(provider.id);
      if (!providerWithCategory) {
        return res.status(400).json({ message: "Provider not found" });
      }

      const newItem = await storage.createMenuItem(newItemData, provider.id, providerWithCategory.category.slug);
      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Create menu item error:", error);
      res.status(400).json({ message: "Item add nahi ho paaya: " + (error.message || "Unknown error") });
    }
  });

  app.patch("/api/menu-items/:itemId", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const { itemId } = req.params;
      const updates = req.body;
      const provider = req.provider!;

      const providerWithCategory = await storage.getServiceProvider(provider.id);
      if (!providerWithCategory) {
        return res.status(400).json({ message: "Provider not found" });
      }

      const updatedItem = await storage.updateMenuItem(itemId, provider.id, providerWithCategory.category.slug, updates);
      if (!updatedItem) return res.status(404).json({ message: "Menu item nahi mila ya aap iske maalik nahi hain." });
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Update menu item error:", error);
      res.status(400).json({ message: "Item update nahi ho paaya: " + (error.message || "Unknown error") });
    }
  });

  app.delete("/api/menu-items/:itemId", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const { itemId } = req.params;
      const provider = req.provider!;

      const providerWithCategory = await storage.getServiceProvider(provider.id);
      if (!providerWithCategory) {
        return res.status(400).json({ message: "Provider not found" });
      }

      const deletedItem = await storage.deleteMenuItem(itemId, provider.id, providerWithCategory.category.slug);
      if (!deletedItem) return res.status(404).json({ message: "Menu item nahi mila ya aap iske maalik nahi hain." });
      res.json({ message: "Menu item successfully delete ho gaya." });
    } catch (error: any) {
      console.error("Delete menu item error:", error);
      res.status(500).json({ message: "Item delete nahi ho paaya: " + (error.message || "Unknown error") });
    }
  });

  // --- IMAGE UPLOAD ROUTE ---
  app.post("/api/upload-image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Koi image file nahi mili." });
      }

      const imageUrl = await uploadToCloudinary(req.file.buffer);

      res.status(200).json({ imageUrl });

    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Image upload fail ho gayi: " + (error.message || "Unknown error") });
    }
  });

  // --- BOOKING & ORDER ROUTES ---
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for booking." });
      }

      const bookingData = insertBookingSchema.parse(req.body);
      const { userId: bodyUserId, ...restBookingData } = bookingData;
      const booking = await storage.createBooking({ ...restBookingData, userId });
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: error.message || "Error creating booking" });
    }
  });

  app.get("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error: any) {
      console.error("Get booking by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching booking" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, providerId } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status, providerId);
      res.json(booking);
    } catch (error: any) {
      console.error("Update booking status error:", error);
      res.status(400).json({ message: error.message || "Error updating booking status" });
    }
  });

  app.get("/api/bookings/provider/:providerId", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getProviderBookings(req.params.providerId);
      res.json(bookings);
    } catch (error: any) {
      console.error("Get provider bookings error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider bookings" });
    }
  });

  app.get("/api/bookings/user/:userId", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getUserBookings(req.params.userId);
      res.json(bookings);
    } catch (error: any) {
      console.error("Get user bookings error:", error);
      res.status(500).json({ message: error.message || "Error fetching user bookings" });
    }
  });

  app.post("/api/grocery-orders", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for ordering." });
      }

      const orderData = insertGroceryOrderSchema.parse(req.body);
      const { userId: bodyUserId, ...restOrderData } = orderData;
      const order = await storage.createGroceryOrder({ ...restOrderData, userId });
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Create grocery order error:", error);
      res.status(400).json({ message: error.message || "Error creating grocery order" });
    }
  });

  app.post("/api/table-bookings", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for table booking." });
      }

      const validatedData = insertTableBookingSchema.parse(req.body);
      const { userId: bodyUserId, ...restValidatedData } = validatedData;

      const booking = await storage.createTableBooking({
        ...restValidatedData,
        userId,
        providerId: req.body.providerId,
      });
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create table booking error:", error);
      res.status(400).json({ message: error.message || "Error creating table booking" });
    }
  });

  app.get("/api/table-bookings/:id", async (req: Request, res: Response) => {
    try {
      const booking = await storage.getTableBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json(booking);
    } catch (error: any) {
      console.error("Get table booking by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching table booking" });
    }
  });

  app.patch("/api/table-bookings/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateTableBookingStatus(req.params.id, status);
      res.json(booking);
    } catch (error: any) {
      console.error("Update table booking status error:", error);
      res.status(400).json({ message: error.message || "Error updating table booking status" });
    }
  });

  app.get("/api/table-bookings/user/:userId", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getUserTableBookings(req.params.userId);
      res.json(bookings);
    } catch (error: any) {
      console.error("Get user table bookings error:", error);
      res.status(500).json({ message: error.message || "Error fetching user table bookings" });
    }
  });

  // --- PAYMENT & REVIEW ROUTES ---
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
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
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + (error.message || "Unknown error") });
    }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated for review." });
      }

      const { providerId, bookingId, rating, comment } = req.body;
      const review = await storage.createReview({
        userId, providerId, bookingId,
        rating: parseInt(rating), comment,
      });
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Create review error:", error);
      res.status(400).json({ message: error.message || "Error creating review" });
    }
  });

  app.get("/api/reviews/provider/:providerId", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getProviderReviews(req.params.providerId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Get provider reviews error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider reviews" });
    }
  });

  // --- TWILIO (CALLING) ROUTES ---
  app.post("/api/call-request", async (req, res) => { /* ... (aapka code yahan) ... */ });
  app.post("/api/call-webhook", async (req, res) => { /* ... (aapka code yahan) ... */ });
  app.post("/api/call-response", async (req, res) => { /* ... (aapka code yahan) ... */ });

  const httpServer = createServer(app);
  return httpServer;
}