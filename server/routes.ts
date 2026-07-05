// server/routes.ts (FIXED FOR DATE BUG)

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from './cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import { storage } from "./storage";
import { db } from "./db";
import { eq, ne, and, inArray, ilike, gt, desc, asc, count, gte, sql, aliasedTable } from "drizzle-orm";
import {
  insertBookingSchema,
  insertGroceryOrderSchema,
  insertRentalPropertySchema,
  insertStreetFoodOrderSchema, // NAYA IMPORT
  insertServiceProviderSchema,
  insertInvoiceSchema, // NAYA IMPORT
  type InsertInvoice,
  insertServiceOfferingSchema, // NAYA IMPORT
  serviceProviders, // NAYA IMPORT
  insertRestaurantOrderSchema, // NAYA IMPORT
  groceryProducts, // NAYA IMPORT
  cakeProducts, // Fix: Import this
  streetFoodItems, // Product search support
  restaurantMenuItems, // Product search support
  serviceOfferings, // Beauty Parlor service combo support
  insertDeliveryPartnerSchema, // DELIVERY PARTNER IMPORT
  deliveryPartners, // DELIVERY PARTNER TABLE
  restaurantOrders, // FOR RIDER QUERIES
  providerOffers, // OFFERS CAROUSEL
  insertProviderOfferSchema, // OFFERS CAROUSEL
  users, // FOR FCM DEBUG ENDPOINT
  bookings, // FOR NOTIFICATIONS
  groceryOrders, // FOR NOTIFICATIONS
  streetFoodOrders, // FOR NOTIFICATIONS
  serviceCategories, // FOR ADMIN DASHBOARD
  appSettings, // PLATFORM TOGGLE
  adminPromotionalOffers, // ADMIN PROMOS
  insertAdminPromotionalOfferSchema, // ADMIN PROMOS
} from "@shared/schema";

import { razorpayInstance, verifyPaymentSignature } from "./razorpay-client";

// NAYA IMPORT: z for validation
import { z } from "zod";

import { sendPushNotification } from "./firebase";
import { importGmartProducts } from "./import-gmart-products";
import { trackLead, trackPurchase, isConversionsApiConfigured } from "./facebook-conversions";

// ===== PERFORMANCE: In-memory cache for read-heavy public endpoints =====
const apiCache = new Map<string, { data: any; expiry: number }>();

function getCachedOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = apiCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return Promise.resolve(cached.data as T);
  }
  return fetcher().then(data => {
    apiCache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  });
}
// ========================================================================

// ===== ADMIN NOTIFICATION HELPER =====
// Sends a copy of every order/booking notification to the admin (main_branch) account
async function notifyAdmin(payload: {
  title: string;
  body: string;
  data: Record<string, string>;
}) {
  try {
    const adminUser = await storage.getUserByUsername('main_branch');
    if (!adminUser) return;

    const allTokens: string[] = [];
    if (adminUser.fcmTokens && Array.isArray(adminUser.fcmTokens)) {
      allTokens.push(...adminUser.fcmTokens);
    } else if (adminUser.fcmToken) {
      allTokens.push(adminUser.fcmToken);
    }
    const uniqueTokens = [...new Set(allTokens)];
    if (uniqueTokens.length === 0) return;

    console.log(`[FCM Admin] Sending notification to main_branch (${uniqueTokens.length} device(s))`);
    for (const deviceToken of uniqueTokens) {
      await sendPushNotification(deviceToken, {
        type: 'ORDER_REQUEST',
        title: `👑 ${payload.title}`,
        body: payload.body,
        data: { ...payload.data, navigateTo: '/admin' },
      });
    }
  } catch (err: any) {
    console.error('[FCM Admin] Notification failed (non-critical):', err?.message);
  }
}
// =====================================================================

// Custom request types
interface CustomRequest extends Request {
  provider?: {
    id: string;
    userId: string;
    categoryId: string;
  };
  userId?: string;
}
interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}
interface DeliveryPartnerRequest extends Request {
  userId?: string;
  deliveryPartner?: {
    id: string;
    userId: string;
    vehicleType: string;
    isOnline: boolean | null;
  };
}

// Middleware: Check if user is logged in
const isLoggedIn = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Aap logged in nahi hain." });
  }
  req.userId = req.session.userId;
  next();
};

// Middleware: Check if user is a provider
const isProvider = async (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Aap logged in nahi hain." });
  }
  const provider = await storage.getProviderByUserId(req.session.userId);
  if (!provider) {
    return res.status(403).json({ message: "Aap ek service provider nahi hain." });
  }
  req.provider = provider;
  req.userId = req.session.userId;
  next();
};

// Middleware: Check if user is a delivery partner
const isDeliveryPartner = async (req: DeliveryPartnerRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "You are not logged in." });
  }
  const partner = await storage.getDeliveryPartnerByUserId(req.session.userId);
  if (!partner) {
    return res.status(403).json({ message: "You are not registered as a delivery partner." });
  }
  req.deliveryPartner = partner;
  req.userId = req.session.userId;
  next();
};

// Middleware: Check if user is an admin
const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not logged in." });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required." });
  }
  req.userId = req.session.userId;
  req.user = user;
  next();
};

// ===== PLATFORM SERVICES TOGGLE (in-memory for fast checks) =====
let servicesEnabled = true;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // --- Load services_enabled from DB on startup ---
  try {
    const setting = await db.query.appSettings.findFirst({
      where: eq(appSettings.key, 'services_enabled'),
    });
    if (setting) {
      servicesEnabled = setting.value === 'true';
    } else {
      // Seed default setting
      await db.insert(appSettings).values({
        key: 'services_enabled',
        value: 'true',
      });
    }
    console.log(`✅ Platform services status loaded: ${servicesEnabled ? 'OPEN' : 'CLOSED'}`);
  } catch (e: any) {
    console.error('⚠️ Could not load platform settings:', e.message);
  }

  // --- HEALTH CHECK ROUTE ---
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
  });

  // --- DIGITAL ASSET LINKS FOR ANDROID TWA ---
  app.get("/.well-known/assetlinks.json", (_req: Request, res: Response) => {
    const assetlinks = [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.onrender.shirur_express.twa",
          sha256_cert_fingerprints: [
            "5C:FC:35:97:A6:87:42:02:A2:25:20:85:81:C4:A6:56:8B:64:EC:5F:8C:33:FC:BD:F8:94:C0:3A:0B:BD:8C:76"
          ]
        }
      }
    ];
    res.setHeader("Content-Type", "application/json");
    res.json(assetlinks);
  });

  // --- AUTHENTICATION ROUTES (No Change) ---

  console.log("Registering Grocery Routes..."); // DEBUG LOG
  app.post("/api/grocery-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      // --- PLATFORM KILL SWITCH ---
      if (!servicesEnabled) {
        return res.status(503).json({ message: "Services are currently closed. Please try again during business hours." });
      }
      const userId = req.userId!;
      const orderData = insertGroceryOrderSchema.parse(req.body);

      // SERVER-SIDE: Enforce ₹50 minimum order for grocery
      const GROCERY_MIN_ORDER = 50;
      const orderTotal = parseFloat(orderData.total || '0');
      const orderSubtotal = parseFloat(orderData.subtotal || '0');
      // Also recalculate from items as a failsafe
      const itemsTotal = Array.isArray(orderData.items)
        ? orderData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0)
        : 0;
      const effectiveTotal = Math.max(orderTotal, orderSubtotal, itemsTotal);

      if (effectiveTotal < GROCERY_MIN_ORDER) {
        return res.status(400).json({ message: `Minimum order amount is ₹${GROCERY_MIN_ORDER}. Your order total is ₹${effectiveTotal.toFixed(2)}.` });
      }

      // For online payment, create with 'payment_pending' status so it doesn't show in admin/provider panels
      const initialStatus = orderData.paymentMethod === 'online' ? 'payment_pending' : 'pending';
      const order = await storage.createGroceryOrder({ ...orderData, userId, status: initialStatus } as any);
      
      if (orderData.paymentMethod === 'cod') {
        await sendOrderNotifications(order, 'grocery', order.id);
      }

      res.status(201).json(order);
    } catch (error: any) {
      console.error("Create grocery order error:", error);
      res.status(400).json({ message: error.message || "Error creating grocery order" });
    }
  });

  console.log("Registering Street Food Routes..."); // DEBUG LOG
  app.post("/api/street-food-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      // --- PLATFORM KILL SWITCH ---
      if (!servicesEnabled) {
        return res.status(503).json({ message: "Services are currently closed. Please try again during business hours." });
      }
      const userId = req.userId!;
      // Validate body
      const orderData = insertStreetFoodOrderSchema.parse(req.body);

      // Assign a static runner ID for MVP (e.g., "runner-1")
      const orderWithRunner = { ...orderData, runnerId: "runner-1" };

      // For online payment, create with 'payment_pending' status so it doesn't show in admin/provider panels
      const initialStatus = orderData.paymentMethod === 'online' ? 'payment_pending' : 'pending';
      const order = await storage.createStreetFoodOrder({ ...orderWithRunner, userId, status: initialStatus } as any);
      console.log("Created Street Food Order:", order); // DEBUG LOG

      // Ringing system for Street Food Admin and Main Admin
      if (orderData.paymentMethod === 'cod') {
        await sendOrderNotifications(order, 'street_food', order.id);
      }

      res.status(201).json(order);
    } catch (error: any) {
      // FIXED: Safe error logging to prevent crash
      console.error("Create street food order error:", error instanceof Error ? error.message : String(error));
      res.status(400).json({ message: error.message || "Error creating order" });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, phone, username: providedUsername } = req.body;
      if (!email || !password || !phone) {
        return res.status(400).json({ message: "Email, password, and phone are required." });
      }
      // Public signup always creates customer accounts
      const role = "customer";

      // Check if phone already exists
      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Auto-generate username from phone number
      const username = providedUsername?.toLowerCase() || `user_${phone}`;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        // If auto-generated username conflicts, append random chars
        const fallbackUsername = `user_${phone}_${Math.random().toString(36).slice(2, 6)}`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await storage.createUser({
          username: fallbackUsername,
          email,
          password: hashedPassword,
          role: role || "customer",
          phone,
        });
        req.session.userId = user.id;
        req.session.userRole = user.role || 'customer';
        req.session.save((err) => {
          if (err) {
            console.error("Session save error after signup:", err);
            return res.status(500).json({ message: "Signup successful, but session could not be established." });
          }
          const { password: _, ...userWithoutPassword } = user;
          res.status(201).json({ user: userWithoutPassword, message: "Signed up and logged in successfully!" });

          // Track Lead event server-side for Meta Ads
          trackLead({
            email: user.email || undefined,
            phone: user.phone || undefined,
            externalId: user.id,
            clientIpAddress: req.ip,
            clientUserAgent: req.headers['user-agent'],
          }).catch(() => {}); // Fire and forget
        });
        return;
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
      req.session.userRole = user.role || 'customer';
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
        return res.status(400).json({ message: "Username/Phone and password are required." });
      }

      const input = username.trim();
      let user;

      // Check if input is a 10-digit phone number
      if (/^\d{10}$/.test(input)) {
        user = await storage.getUserByPhone(input);
      }

      // Check if input looks like an email
      if (!user && input.includes('@')) {
        user = await storage.getUserByEmail(input.toLowerCase());
      }

      // Fallback: Check if input is a username (for admin/legacy accounts)
      if (!user) {
        user = await storage.getUserByUsername(input.toLowerCase());
      }

      if (!user) {
        await bcrypt.compare("dummyPassword", "$2b$10$abcdefghijklmnopqrstuv");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check for delivery partner profile
      const deliveryPartner = await storage.getDeliveryPartnerByUserId(user.id);

      req.session.userId = user.id;
      req.session.userRole = user.role || 'customer';
      req.session.save((err) => {
        if (err) {
          console.error("Session save error after login:", err);
          return res.status(500).json({ message: "Login successful, but session could not be established." });
        }
        const { password: _, ...userWithoutPassword } = user;
        // Include isDeliveryPartner flag in the response
        res.json({
          user: {
            ...userWithoutPassword,
            isDeliveryPartner: !!deliveryPartner
          },
          message: "Logged in successfully!"
        });
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

  app.delete("/api/auth/profile", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      // Delete user and all associated data from the DB transactionally
      await storage.deleteUser(userId);

      // Log the user out since they no longer exist
      req.logout((err) => {
        if (err) {
          console.error("Logout error during account deletion:", err);
          // Even if passport fails to log out the memory session, the DB data is gone. 
          // So still 200 OK.
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error: any) {
      console.error("DELETE /api/auth/profile error:", error);
      res.status(500).json({ message: "Error deleting account. " + (error.message || "") });
    }
  });

  app.patch("/api/auth/profile", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { username, email, phone, address } = req.body;

      // Basic validation
      if (!username && !email && !phone && !address) {
        return res.status(400).json({ message: "No updates provided" });
      }

      // Check duplicates if changing username/email
      if (username) {
        const existing = await storage.getUserByUsername(username.toLowerCase());
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      if (email) {
        const existing = await storage.getUserByEmail(email);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "Email already taken" });
        }
      }

      const updates: any = {};
      if (username) updates.username = username.toLowerCase();
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;

      const updatedUser = await storage.updateUser(userId, updates);

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword, message: "Profile updated successfully" });

    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: error.message || "Error updating profile" });
    }
  });

  // NAYA: Save FCM Token
  app.post("/api/users/fcm-token", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "Token is required" });

      await storage.updateUserFcmToken(userId, token);
      res.json({ message: "FCM token updated" });
    } catch (error: any) {
      console.error("FCM Token save error:", error);
      res.status(500).json({ message: "Error saving FCM token" });
    }
  });

  // --- PROVIDER PROFILE ROUTES (No Change) ---
  app.post("/api/provider/profile", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const providerData = insertServiceProviderSchema.parse(req.body);
      const { categoryId } = req.body;
      const provider = await storage.createServiceProvider({ ...providerData, userId, categoryId });
      res.status(201).json(provider);
    } catch (error: any) {
      console.error("Create provider profile error:", error);
      res.status(400).json({ message: error.message || "Error creating provider profile" });
    }
  });

  app.get("/api/provider/profile", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const provider = await storage.getProviderByUserId(userId);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      const fullProfile = await storage.getServiceProvider(provider.id);
      if (!fullProfile) {
        return res.status(404).json({ message: "Could not retrieve full provider profile." });
      }
      // Ensure category is included if not already (though storage.ts should handle it)
      // If storage.ts update is preferred, I will do that instead.
      // But let's stick to the user's specific instruction if possible, but here it's a function call.
      // I will update storage.ts as it is the underlying implementation.
      res.json(fullProfile);
    } catch (error: any) {
      console.error("Get provider profile error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider profile" });
    }
  });

  // --- RENTAL PROPERTY ROUTES (NEW) ---
  app.get("/api/provider/rental-properties", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const properties = await storage.getProviderRentalProperties(userId);
      res.json(properties);
    } catch (error: any) {
      console.error("Get provider rental properties error:", error);
      res.status(500).json({ message: error.message || "Error fetching rental properties" });
    }
  });

  app.get("/api/rental-properties", async (req: Request, res: Response) => {
    try {
      const { propertyType, listingType, minRent, maxRent, bedrooms, locality } = req.query;

      const filters = {
        propertyType: propertyType as string | undefined,
        listingType: listingType as string | undefined,
        locality: locality as string | undefined,
        minRent: minRent ? parseInt(minRent as string) : undefined,
        maxRent: maxRent ? parseInt(maxRent as string) : undefined,
        bedrooms: bedrooms && bedrooms !== 'all' ? parseInt(bedrooms as string) : undefined,
      };

      const properties = await storage.getRentalProperties(filters);
      res.json(properties);
    } catch (error: any) {
      console.error("Search rental properties error:", error);
      res.status(500).json({ message: error.message || "Error searching rental properties" });
    }
  });

  app.post("/api/rental-properties", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const propertyData = insertRentalPropertySchema.parse(req.body);
      const property = await storage.createRentalProperty({ ...propertyData, ownerId: userId });
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Create rental property error:", error);
      res.status(400).json({ message: error.message || "Error creating rental property" });
    }
  });

  app.get("/api/rental-properties/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const property = await storage.getRentalProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error: any) {
      console.error("Get rental property error:", error);
      res.status(500).json({ message: error.message || "Error fetching property" });
    }
  });

  app.delete("/api/rental-properties/:id", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const property = await storage.getRentalProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteRentalProperty(id);
      res.json({ message: "Property deleted successfully" });
    } catch (error: any) {
      console.error("Delete rental property error:", error);
      res.status(500).json({ message: error.message || "Error deleting property" });
    }
  });

  app.patch("/api/rental-properties/:id", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const updates = req.body;
      const property = await storage.getRentalProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedProperty = await storage.updateRentalProperty(id, updates);
      res.json(updatedProperty);
    } catch (error: any) {
      console.error("Update rental property error:", error);
      res.status(500).json({ message: error.message || "Error updating property" });
    }
  });

  app.patch("/api/provider/profile", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { profileImageUrl, galleryImages, ...updates } = req.body;

      const updatedProfile = await storage.updateServiceProvider(providerId, updates);
      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found." });
      }
      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Update provider profile error:", error);
      res.status(500).json({ message: error.message || "Error updating provider profile" });
    }
  });

  app.patch(
    "/api/provider/profile/image",
    isProvider,
    upload.single("image"),
    async (req: CustomRequest, res: Response) => {
      try {
        const providerId = req.provider!.id;
        const file = req.file;

        if (!file) {
          return res.status(400).json({ message: "Koi image file nahi mili." });
        }
        const imageUrl = await uploadToCloudinary(file.buffer);
        const updatedProfile = await storage.updateServiceProvider(providerId, {
          profileImageUrl: imageUrl,
        });

        res.json({ message: "Profile image updated!", profile: updatedProfile });
      } catch (error: any) {
        console.error("Profile image upload error:", error);
        const errorMessage = error.message || "Error uploading image";
        if (errorMessage.includes("api_key") || errorMessage.includes("cloud_name")) {
          return res.status(500).json({ message: "Server configuration error: Cloudinary keys missing." });
        }
        res.status(500).json({ message: errorMessage });
      }
    }
  );


  app.post("/api/upload", upload.array("images", 5), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
      const urls = await Promise.all(uploadPromises);

      res.json({ urls });
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "Upload failed";
      if (errorMessage.includes("api_key") || errorMessage.includes("cloud_name")) {
        return res.status(500).json({ message: "Server configuration error: Cloudinary keys missing." });
      }
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post(
    "/api/provider/profile/gallery",
    isProvider,
    upload.array("images", 5),
    async (req: CustomRequest, res: Response) => {
      try {
        const providerId = req.provider!.id;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({ message: "Koi image files nahi mili." });
        }

        const uploadPromises = files.map(file => uploadToCloudinary(file.buffer));
        const imageUrls = await Promise.all(uploadPromises);

        const currentProfile = await storage.getServiceProvider(providerId);
        const existingGallery = currentProfile?.galleryImages || [];
        const updatedGallery = [...existingGallery, ...imageUrls];

        const updatedProfile = await storage.updateServiceProvider(providerId, {
          galleryImages: updatedGallery,
        });

        res.json({ message: "Gallery images updated!", profile: updatedProfile });
      } catch (error: any) {
        console.error("Gallery image upload error:", error);
        res.status(500).json({ message: error.message || "Error uploading gallery images" });
      }
    }
  );

  // --- DELETE PROVIDER PROFILE IMAGES (Refactored to POST for reliable body handling) ---
  app.post("/api/provider/profile/image/delete", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      console.log(`[ProfileImageDelete] ID: ${providerId}`);
      
      const updatedProfile = await storage.updateServiceProvider(providerId, {
        profileImageUrl: null as any,
      });
      res.json({ message: "Profile banner removed", profile: updatedProfile });
    } catch (error: any) {
      console.error("Delete profile image error:", error);
      res.status(500).json({ message: error.message || "Error removing profile banner" });
    }
  });

  app.post("/api/provider/profile/gallery/delete", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { imageUrl, index } = req.body;
      
      console.log(`[GalleryDelete] ID: ${providerId}, Target: ${imageUrl || "ALL"}, Index: ${index}`);

      const currentProfile = await storage.getServiceProvider(providerId);
      if (!currentProfile) {
        return res.status(404).json({ message: "Provider profile nahi mila." });
      }

      const existingGallery = currentProfile.galleryImages || [];
      let updatedGallery: string[] = [...existingGallery];

      let deleted = false;

      // 1. Try URL-based deletion (Ultra-Robust)
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        const targetUrl = imageUrl.trim();
        const initialCount = updatedGallery.length;
        
        updatedGallery = updatedGallery.filter(url => {
          if (!url) return false;
          const trimmedUrl = url.trim();
          
          if (trimmedUrl === targetUrl) return false;
          try {
            if (decodeURIComponent(trimmedUrl) === decodeURIComponent(targetUrl)) return false;
          } catch (e) {}

          const getPublicPart = (u: string) => {
             const parts = u.split('upload/');
             if (parts.length > 1) return parts[1].split('?')[0];
             return u.split('/').pop()?.split('?')[0] || u; 
          };

          const targetPublic = getPublicPart(targetUrl);
          const currentPublic = getPublicPart(trimmedUrl);
          if (targetPublic === currentPublic && targetPublic.length > 5) return false;
          
          if (trimmedUrl.includes(targetUrl) || targetUrl.includes(trimmedUrl)) {
             if (Math.abs(trimmedUrl.length - targetUrl.length) < 50) return false;
          }

          return true;
        });

        if (updatedGallery.length < initialCount) {
          deleted = true;
          console.log(`[GalleryDelete] Image deleted by URL match.`);
        }
      }

      // 2. Fallback: Try Index-based deletion
      if (!deleted && typeof index === 'number' && index >= 0 && index < existingGallery.length) {
        console.log(`[GalleryDelete] URL match failed. Falling back to Index: ${index}`);
        updatedGallery = existingGallery.filter((_, i) => i !== index);
        deleted = true;
      }

      // 3. Special Case: Clear all
      if (imageUrl === "" || imageUrl === null) {
        updatedGallery = [];
        deleted = true;
      }

      if (!deleted && imageUrl !== "" && imageUrl !== null) {
          return res.status(400).json({ 
            message: "Image gallery mein nahi mili. Ho sakta hai pehle hi delete ho gayi ho.",
            debug: { target: imageUrl?.substring(0, 30), index, galleryCount: existingGallery.length }
          });
      }

      const updatedProfile = await storage.updateServiceProvider(providerId, {
        galleryImages: updatedGallery,
      });

      res.json({ 
        message: (imageUrl === "" || imageUrl === null) ? "Photo gallery cleared!" : "Gallery image removed!", 
        profile: updatedProfile 
      });
    } catch (error: any) {
      console.error("Delete gallery image error:", error);
      res.status(500).json({ message: error.message || "Error removing gallery image" });
    }
  });

  // --- PROVIDER AVAILABILITY TOGGLE (Shop Open/Close) ---
  app.patch("/api/provider/availability", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { isAvailable } = req.body;

      if (typeof isAvailable !== 'boolean') {
        return res.status(400).json({ message: "isAvailable must be a boolean value" });
      }

      const updatedProfile = await storage.updateServiceProvider(providerId, { isAvailable });

      if (!updatedProfile) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      console.log(`[AVAILABILITY] Provider ${providerId} set to ${isAvailable ? 'OPEN' : 'CLOSED'}`);

      res.json({
        message: isAvailable ? "Your shop is now OPEN for orders!" : "Your shop is now CLOSED. Customers cannot place orders.",
        isAvailable: updatedProfile.isAvailable
      });
    } catch (error: any) {
      console.error("Toggle availability error:", error);
      res.status(500).json({ message: error.message || "Error updating availability" });
    }
  });

  app.get("/api/provider/my-bookings", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const bookings = await storage.getProviderBookings(providerId);
      res.json(bookings);
    } catch (error: any) {
      console.error("Get provider bookings error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider bookings" });
    }
  });

  app.get("/api/customer/my-bookings", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error: any) {
      console.error("Get customer bookings error:", error);
      res.status(500).json({ message: error.message || "Error fetching customer bookings" });
    }
  });

  // --- GLOBAL FUZZY SEARCH (Elastic Search Engine) ---
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query 'q' is required" });
      }

      console.log(`[Search] Query: "${q}"`);
      const results = await storage.searchGlobal(q);
      console.log(`[Search] Results — ${results.menuItems?.length || 0} menu items, ${results.streetFood?.length || 0} street food, ${results.services?.length || 0} services${results.didYouMean ? `, didYouMean: "${results.didYouMean}"` : ''}`);
      res.json(results);
    } catch (error: any) {
      console.error("Global search error:", error);
      res.status(500).json({ message: error.message || "Search failed" });
    }
  });

  app.get("/api/search/suggestions", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json({ suggestions: [], didYouMean: null });
      }
      const result = await storage.searchSuggestions(q);
      res.json(result);
    } catch (error: any) {
      console.error("Search suggestions error:", error);
      res.status(500).json({ message: "Error fetching suggestions" });
    }
  });

  // --- CUSTOMER NOTIFICATIONS (Aggregated Timeline) ---
  app.get("/api/customer/notifications", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      // Fetch all sources in parallel
      const [userBookings, groceryOrdersList, streetFoodOrdersList, restaurantOrdersList] = await Promise.all([
        db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt)).limit(20),
        db.select().from(groceryOrders).where(eq(groceryOrders.userId, userId)).orderBy(desc(groceryOrders.createdAt)).limit(20),
        db.select().from(streetFoodOrders).where(eq(streetFoodOrders.userId, userId)).orderBy(desc(streetFoodOrders.createdAt)).limit(20),
        db.select().from(restaurantOrders).where(eq(restaurantOrders.userId, userId)).orderBy(desc(restaurantOrders.createdAt)).limit(20),
      ]);

      // Map each to a unified notification shape
      const notifications = [
        ...userBookings.map(b => ({
          id: b.id,
          type: 'booking' as const,
          category: b.serviceType,
          title: `${b.serviceType?.charAt(0).toUpperCase()}${b.serviceType?.slice(1)} Booking`,
          status: b.status || 'pending',
          amount: b.estimatedCost,
          address: b.userAddress,
          createdAt: b.createdAt,
        })),
        ...groceryOrdersList.map(o => ({
          id: o.id,
          type: 'grocery_order' as const,
          category: 'grocery',
          title: 'Grocery Order',
          status: o.status || 'pending',
          amount: o.total,
          address: o.deliveryAddress,
          createdAt: o.createdAt,
        })),
        ...streetFoodOrdersList.map(o => ({
          id: o.id,
          type: 'street_food_order' as const,
          category: 'street_food',
          title: 'Street Food Order',
          status: o.status || 'pending',
          amount: o.totalAmount,
          address: o.deliveryAddress,
          createdAt: o.createdAt,
        })),
        ...restaurantOrdersList.map(o => ({
          id: o.id,
          type: 'restaurant_order' as const,
          category: 'restaurant',
          title: 'Restaurant Order',
          status: o.status || 'pending',
          amount: o.totalAmount,
          address: o.deliveryAddress,
          createdAt: o.createdAt,
        })),
      ];

      // Sort by date descending and limit to 50
      notifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json(notifications.slice(0, 50));
    } catch (error: any) {
      console.error("Get customer notifications error:", error);
      res.status(500).json({ message: error.message || "Error fetching notifications" });
    }
  });


  // --- PROVIDER OFFERS ROUTES (Dynamic Offers Carousel) ---

  // Create a new offer
  app.post("/api/provider/offers", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const offerData = insertProviderOfferSchema.parse(req.body);

      const offer = await db.insert(providerOffers).values({
        ...offerData,
        providerId,
        expiryDate: new Date(offerData.expiryDate),
      }).returning();

      res.status(201).json(offer[0]);
    } catch (error: any) {
      console.error("Create offer error:", error);
      res.status(400).json({ message: error.message || "Error creating offer" });
    }
  });

  // Get provider's offers
  app.get("/api/provider/offers", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const offers = await db.query.providerOffers.findMany({
        where: eq(providerOffers.providerId, providerId),
        orderBy: (offers, { desc }) => [desc(offers.createdAt)],
      });
      res.json(offers);
    } catch (error: any) {
      console.error("Get provider offers error:", error);
      res.status(500).json({ message: error.message || "Error fetching offers" });
    }
  });

  // Update an offer
  app.put("/api/provider/offers/:id", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id } = req.params;

      // Check if offer belongs to this provider
      const existingOffer = await db.query.providerOffers.findFirst({
        where: and(eq(providerOffers.id, id), eq(providerOffers.providerId, providerId)),
      });

      if (!existingOffer) {
        return res.status(404).json({ message: "Offer not found or access denied" });
      }

      const updateData = req.body;
      if (updateData.expiryDate) {
        updateData.expiryDate = new Date(updateData.expiryDate);
      }

      const [updatedOffer] = await db.update(providerOffers)
        .set(updateData)
        .where(eq(providerOffers.id, id))
        .returning();

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Update offer error:", error);
      res.status(500).json({ message: error.message || "Error updating offer" });
    }
  });

  // Delete an offer
  app.delete("/api/provider/offers/:id", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id } = req.params;

      // Check if offer belongs to this provider
      const existingOffer = await db.query.providerOffers.findFirst({
        where: and(eq(providerOffers.id, id), eq(providerOffers.providerId, providerId)),
      });

      if (!existingOffer) {
        return res.status(404).json({ message: "Offer not found or access denied" });
      }

      await db.delete(providerOffers).where(eq(providerOffers.id, id));
      res.json({ message: "Offer deleted successfully" });
    } catch (error: any) {
      console.error("Delete offer error:", error);
      res.status(500).json({ message: error.message || "Error deleting offer" });
    }
  });

  // Get all active offers (for homepage carousel) - PUBLIC (CACHED 2 min)
  app.get("/api/offers/active", async (_req: Request, res: Response) => {
    try {
      const offersData = await getCachedOrFetch('offers_active_mixed', 2 * 60 * 1000, async () => {
        const now = new Date();
        const regularOffers = await db.query.providerOffers.findMany({
          where: and(
            eq(providerOffers.isActive, true),
            gt(providerOffers.expiryDate, now)
          ),
          with: {
            provider: {
              columns: {
                id: true,
                businessName: true,
                profileImageUrl: true,
              }
            }
          },
        });

        const adminOffers = await db.query.adminPromotionalOffers.findMany({
          where: eq(adminPromotionalOffers.isActive, true),
        });

        const mappedAdminOffers = adminOffers.map(ao => ({
          ...ao,
          type: "admin_promo" as const,
          productType: "admin_promo", // For compatibility
          imageUrl: ao.thumbnailImageUrl, // For carousel display compatibility
        }));

        const mappedRegularOffers = regularOffers.map(ro => ({
          ...ro,
          type: "regular" as const,
        }));

        const allOffers = [...mappedAdminOffers, ...mappedRegularOffers];

        // Sort: admin promos first, then by createdAt descending
        allOffers.sort((a, b) => {
          if (a.type === "admin_promo" && b.type !== "admin_promo") return -1;
          if (b.type === "admin_promo" && a.type !== "admin_promo") return 1;
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        return allOffers;
      });
      res.json(offersData);
    } catch (error: any) {
      console.error("Get active offers error:", error);
      res.status(500).json({ message: error.message || "Error fetching active offers" });
    }
  });

  // --- ADMIN PROMOTIONS ROUTES ---
  app.get("/api/admin/promotions", isAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const promos = await db.query.adminPromotionalOffers.findMany({
         orderBy: (offers, { desc }) => [desc(offers.createdAt)],
      });
      res.json(promos);
    } catch(err: any) {
      res.status(500).json({ message: err.message || "Error fetching promos" });
    }
  });

  app.post("/api/admin/promotions", isAdmin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'popup', maxCount: 1 }]), async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const thumbnailFile = files['thumbnail']?.[0];
      const popupFile = files['popup']?.[0];
      
      const { title, redirectUrl, isActive } = req.body;

      if (!thumbnailFile || !popupFile) {
        return res.status(400).json({ message: "Thumbnail and Popup image files are required." });
      }

      const [thumbnailImageUrl, popupImageUrl] = await Promise.all([
        uploadToCloudinary(thumbnailFile.buffer),
        uploadToCloudinary(popupFile.buffer)
      ]);

      const offerData = insertAdminPromotionalOfferSchema.parse({
         title,
         redirectUrl,
         thumbnailImageUrl,
         popupImageUrl,
         isActive: isActive === 'true' || isActive === true,
      });

      const offer = await db.insert(adminPromotionalOffers).values(offerData).returning();
      res.status(201).json(offer[0]);
    } catch(error: any) {
      console.error("Create admin promo error:", error);
      res.status(400).json({ message: error.message || "Error creating promo" });
    }
  });

  app.delete("/api/admin/promotions/:id", isAdmin, async (req: AuthRequest, res: Response) => {
     try {
       const { id } = req.params;
       await db.delete(adminPromotionalOffers).where(eq(adminPromotionalOffers.id, id));
       res.json({ message: "Promotional offer deleted successfully" });
     } catch (err: any) {
       res.status(500).json({ message: err.message || "Error deleting promo" });
     }
  });

  // Get single offer with products (for offer details page) - PUBLIC
  app.get("/api/offers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const offer = await db.query.providerOffers.findFirst({
        where: eq(providerOffers.id, id),
        with: {
          provider: {
            columns: {
              id: true,
              businessName: true,
              profileImageUrl: true,
              address: true,
            }
          }
        }
      });

      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Fetch products based on productType and productIds
      let products: any[] = [];
      if (offer.productIds && offer.productIds.length > 0) {
        switch (offer.productType) {
          case 'grocery':
            products = await db.query.groceryProducts.findMany({
              where: inArray(groceryProducts.id, offer.productIds),
            });
            break;
          case 'restaurant':
            const { restaurantMenuItems } = await import('@shared/schema');
            products = await db.query.restaurantMenuItems.findMany({
              where: inArray(restaurantMenuItems.id, offer.productIds),
            });
            break;
          case 'cake':
            products = await db.query.cakeProducts.findMany({
              where: inArray(cakeProducts.id, offer.productIds),
            });
            break;
          case 'street_food':
            const { streetFoodItems } = await import('@shared/schema');
            products = await db.query.streetFoodItems.findMany({
              where: inArray(streetFoodItems.id, offer.productIds),
            });
            break;
          case 'beauty_parlor':
          case 'beauty-parlor':
            products = await db.query.serviceOfferings.findMany({
              where: inArray(serviceOfferings.id, offer.productIds),
            });
            break;
        }
      }

      res.json({ ...offer, products });
    } catch (error: any) {
      console.error("Get offer details error:", error);
      res.status(500).json({ message: error.message || "Error fetching offer details" });
    }
  });

  // --- PROVIDER PRODUCTS SEARCH (Optimized for Offers Modal) ---
  app.get("/api/provider/products/search", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const {
        productType,
        search = "",
        category = "",
        limit = "10",
        offset = "0"
      } = req.query as Record<string, string>;

      if (!productType) {
        return res.status(400).json({ message: "productType is required (grocery, restaurant, cake, street_food)" });
      }

      let products: any[] = [];
      const limitNum = Math.min(parseInt(limit) || 10, 20); // Max 20 items
      const offsetNum = parseInt(offset) || 0;

      switch (productType) {
        case 'grocery': {
          const conditions = [eq(groceryProducts.providerId, providerId)];
          if (search) {
            conditions.push(ilike(groceryProducts.name, `%${search}%`));
          }
          if (category) {
            conditions.push(eq(groceryProducts.category, category));
          }
          products = await db.select()
            .from(groceryProducts)
            .where(and(...conditions))
            .limit(limitNum)
            .offset(offsetNum);
          break;
        }
        case 'restaurant': {
          const conditions = [eq(restaurantMenuItems.providerId, providerId)];
          if (search) {
            conditions.push(ilike(restaurantMenuItems.name, `%${search}%`));
          }
          if (category) {
            conditions.push(eq(restaurantMenuItems.category, category));
          }
          products = await db.select()
            .from(restaurantMenuItems)
            .where(and(...conditions))
            .limit(limitNum)
            .offset(offsetNum);
          break;
        }
        case 'cake': {
          const conditions = [eq(cakeProducts.providerId, providerId)];
          if (search) {
            conditions.push(ilike(cakeProducts.name, `%${search}%`));
          }
          if (category) {
            conditions.push(eq(cakeProducts.category, category));
          }
          products = await db.select()
            .from(cakeProducts)
            .where(and(...conditions))
            .limit(limitNum)
            .offset(offsetNum);
          break;
        }
        case 'street_food': {
          const conditions = [eq(streetFoodItems.providerId, providerId)];
          if (search) {
            conditions.push(ilike(streetFoodItems.name, `%${search}%`));
          }
          if (category) {
            conditions.push(eq(streetFoodItems.category, category));
          }
          products = await db.select()
            .from(streetFoodItems)
            .where(and(...conditions))
            .limit(limitNum)
            .offset(offsetNum);
          break;
        }
        case 'beauty_parlor': {
          const conditions = [eq(serviceOfferings.providerId, providerId)];
          if (search) {
            conditions.push(ilike(serviceOfferings.name, `%${search}%`));
          }
          if (category) {
            // category maps to 'section' in serviceOfferings (Hair, Skin Care, Makeover, etc.)
            conditions.push(eq(serviceOfferings.section, category));
          }
          products = await db.select()
            .from(serviceOfferings)
            .where(and(...conditions))
            .limit(limitNum)
            .offset(offsetNum);
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid productType" });
      }

      res.json(products);
    } catch (error: any) {
      console.error("Product search error:", error);
      res.status(500).json({ message: error.message || "Error searching products" });
    }
  });

  // Get product categories for a provider (for category dropdown)
  app.get("/api/provider/products/categories", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { productType } = req.query as Record<string, string>;

      if (!productType) {
        return res.status(400).json({ message: "productType is required" });
      }

      let categories: string[] = [];

      switch (productType) {
        case 'grocery': {
          const products = await db.select({ category: groceryProducts.category })
            .from(groceryProducts)
            .where(eq(groceryProducts.providerId, providerId));
          categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort() as string[];
          break;
        }
        case 'restaurant': {
          const products = await db.select({ category: restaurantMenuItems.category })
            .from(restaurantMenuItems)
            .where(eq(restaurantMenuItems.providerId, providerId));
          categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort() as string[];
          break;
        }
        case 'cake': {
          const products = await db.select({ category: cakeProducts.category })
            .from(cakeProducts)
            .where(eq(cakeProducts.providerId, providerId));
          categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort() as string[];
          break;
        }
        case 'street_food': {
          const products = await db.select({ category: streetFoodItems.category })
            .from(streetFoodItems)
            .where(eq(streetFoodItems.providerId, providerId));
          categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort() as string[];
          break;
        }
        case 'beauty_parlor': {
          // For beauty parlor, 'section' acts as category (Hair, Skin Care, Makeover, etc.)
          const services = await db.select({ section: serviceOfferings.section })
            .from(serviceOfferings)
            .where(eq(serviceOfferings.providerId, providerId));
          categories = Array.from(new Set(services.map(s => s.section).filter(Boolean))).sort() as string[];
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid productType" });
      }

      res.json(categories);
    } catch (error: any) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: error.message || "Error fetching categories" });
    }
  });

  // --- GENERAL SERVICE ROUTES (No Change) ---
  app.get("/api/service-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await getCachedOrFetch('service_categories', 5 * 60 * 1000, () =>
        storage.getServiceCategories()
      );
      res.json(categories);
    } catch (error: any) {
      console.error("Get service categories error:", error);
      res.status(500).json({ message: error.message || "Error fetching service categories" });
    }
  });

  // NAYA: Service Templates Route
  app.get("/api/service-templates/:categorySlug", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      const templates = await storage.getServiceTemplates(categorySlug);
      res.json(templates);
    } catch (error: any) {
      console.error("Get service templates error:", error);
      res.status(500).json({ message: error.message || "Error fetching service templates" });
    }
  });

  // NAYA: Bulk Update Beauty Services
  app.post("/api/provider/beauty-services/bulk", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      // 1. Safe Provider ID Extraction
      if (!req.provider || !req.provider.id) {
        console.error("Bulk update failed: Provider not found in request");
        return res.status(401).json({ message: "Unauthorized: Provider not found" });
      }
      const providerId = req.provider.id;

      // 2. Request Body Validation
      const { services } = req.body;
      if (!services || !Array.isArray(services)) {
        console.error("Bulk update failed: 'services' is not an array");
        return res.status(400).json({ message: "Invalid request: 'services' must be an array" });
      }

      // 3. Validate each service item safely
      const validatedServices = [];
      for (const s of services) {
        try {
          // Ensure providerId is set correctly in the payload
          const serviceWithProvider = { ...s, providerId };
          validatedServices.push(insertServiceOfferingSchema.parse(serviceWithProvider));
        } catch (validationError: any) {
          console.error("Validation failed for service item:", s, validationError.message);
          // Option: Skip invalid items or fail entire request. Here we fail to be safe.
          return res.status(400).json({ message: `Invalid service data: ${validationError.message}` });
        }
      }

      // 4. Perform Update
      const updatedServices = await storage.bulkUpdateServiceOfferings(providerId, validatedServices);
      res.json(updatedServices);

    } catch (error: any) {
      // 5. Improved Error Handling
      console.error("Bulk update failed:", error.message); // Log only message to avoid crash
      res.status(500).json({ message: "Internal Server Error during bulk update" });
    }
  });

  app.get("/api/service-problems", async (req: Request, res: Response) => {
    try {
      const { category: categorySlug, parentId } = req.query;

      if (!categorySlug) {
        return res.status(400).json({ message: "Category slug is required" });
      }

      const category = await storage.getServiceCategory(categorySlug as string);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const problems = await storage.getServiceProblems(category.id, parentId as string | undefined);
      res.json(problems);
    } catch (error: any) {
      console.error("Get service problems error:", error);
      res.status(500).json({ message: error.message || "Error fetching service problems" });
    }
  });

  // --- STREET FOOD ITEMS API (PUBLIC) ---
  app.get("/api/street-food-items", async (req: Request, res: Response) => {
    try {
      const { providerId, search, category } = req.query;
      console.log("[DEBUG] /api/street-food-items called with providerId:", providerId);

      const conditions = [];
      if (providerId) {
        conditions.push(eq(streetFoodItems.providerId, providerId as string));
      }
      if (search) {
        conditions.push(ilike(streetFoodItems.name, `%${search}%`));
      }
      if (category && category !== 'all') {
        conditions.push(eq(streetFoodItems.category, category as string));
      }

      const items = await db.query.streetFoodItems.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          provider: true
        },
        orderBy: [sql`CAST(${streetFoodItems.price} AS NUMERIC) ASC`]
      });

      console.log("[DEBUG] Street food items found:", items.length);

      res.json(items);
    } catch (error: any) {
      console.error("Get street food items error:", error);
      res.status(500).json({ message: error.message || "Error fetching street food items" });
    }
  });

  app.get("/api/service-providers", async (req: Request, res: Response) => {
    try {
      const { category, lat, lng, radius } = req.query;
      const latitude = lat ? parseFloat(lat as string) : undefined;
      const longitude = lng ? parseFloat(lng as string) : undefined;
      const searchRadius = radius ? parseInt(radius as string) : 10;
      const providers = await storage.getServiceProviders(category as string, latitude, longitude, searchRadius);
      res.json(providers);
    } catch (error: any) {
      console.error("Get service providers error:", error);
      res.status(500).json({ message: error.message || "Error fetching service providers" });
    }
  });

  app.get("/api/service-providers/:id", async (req: Request, res: Response) => {
    try {
      const provider = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.id, req.params.id),
        with: {
          beautyServices: { 
            with: { template: true },
            orderBy: (beautyServices, { asc }) => [asc(beautyServices.price)]
          },
          user: true,
          category: true,
        }
      });

      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      // Handle case where beautyServices might be undefined/null
      const response = {
        ...provider,
        beautyServices: provider.beautyServices || []
      };

      res.json(response);
    } catch (error: any) {
      console.error("Get service provider by ID error:", error);
      res.status(500).json({ message: error.message || "Error fetching service provider" });
    }
  });


  // --- BOOKING & ORDER ROUTES (UPDATED) ---

  // (Customer) Booking create karna
  // ----- YEH RAHA FIX -----
  app.post("/api/bookings", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      // --- PLATFORM KILL SWITCH ---
      if (!servicesEnabled) {
        return res.status(503).json({ message: "Services are currently closed. Please try again during business hours." });
      }
      const userId = req.userId!;

      // 1. Ek naya schema banao jo string expect kare
      const bodySchema = insertBookingSchema.extend({
        scheduledAt: z.string().datetime(), // String expect karo (ISO format)
      });

      // 2. Body ko naye schema se parse karo
      const parsedBody = bodySchema.parse(req.body);

      // 3. Ab storage ke liye Date object mein convert karo
      const bookingData = {
        ...parsedBody,
        scheduledAt: new Date(parsedBody.scheduledAt),
      };

      const booking = await storage.createBooking({ ...bookingData, userId });

      // --- PUSH NOTIFICATION (RINGING) via Firebase FCM ---
      // This is the PRIMARY notification method for alerting providers about new bookings
      // Twilio SMS is NOT used for ringing - only for OTP and status updates to customers
      if (booking.providerId) {
        try {
          // Fetch provider to get FCM token
          const provider = await storage.getServiceProvider(booking.providerId);
          console.log(`[FCM Ringing] Provider: ${provider?.businessName || 'NOT FOUND'}`);
          console.log(`[FCM Ringing] FCM Token: ${provider?.user?.fcmToken ? 'EXISTS' : 'MISSING'}`);

          if (provider && provider.user) {
            // Collect all FCM tokens for multi-device support
            const allTokens: string[] = [];
            if (provider.user.fcmTokens && Array.isArray(provider.user.fcmTokens)) {
              allTokens.push(...provider.user.fcmTokens);
            } else if (provider.user.fcmToken) {
              allTokens.push(provider.user.fcmToken);
            }

            const uniqueTokens = [...new Set(allTokens)];
            console.log(`[FCM Ringing] Sending to ${uniqueTokens.length} device(s)`);

            // Fetch customer details for richer notification
            const bookingCustomer = await storage.getUser(userId);
            const customerPhone = booking.userPhone || bookingCustomer?.phone || 'N/A';
            const customerName = bookingCustomer?.username || 'Customer';

            for (const deviceToken of uniqueTokens) {
              const fcmResult = await sendPushNotification(deviceToken, {
                type: 'ORDER_REQUEST',
                title: `🔔 New ${booking.serviceType?.charAt(0).toUpperCase()}${booking.serviceType?.slice(1)} Booking!`,
                body: `📞 ${customerPhone} • 📍 ${booking.userAddress || 'Check App'}`,
                data: {
                  orderId: booking.id,
                  orderType: 'service',
                  customerName: customerName,
                  customerPhone: customerPhone,
                  amount: booking.estimatedCost || 'Check App',
                  itemsSummary: `${booking.serviceType} service booking`,
                  dropAddress: booking.userAddress || 'Check App',
                  navigateTo: '/provider/dashboard'
                }
              });

              if (fcmResult.success) {
                console.log(`🚀 Ringing sent to device (token: ${deviceToken.substring(0, 15)}...) - MessageId: ${fcmResult.messageId}`);
              } else {
                console.error(`❌ FCM Ringing failed for device:`, fcmResult.error);
              }
            }

            if (uniqueTokens.length === 0) {
              console.warn(`[FCM Ringing] Cannot send - no FCM tokens registered for provider`);
            }
          } else {
            console.warn(`[FCM Ringing] Cannot send - FCM token not registered for provider`);
          }
        } catch (fcmError: any) {
          console.error("[FCM Ringing Error]", fcmError?.message || fcmError);
        }
      } else {
        console.log(`[FCM Ringing] Skipping - no providerId assigned to booking`);
      }
      // --- END FIREBASE FCM RINGING ---

      // --- ADMIN NOTIFICATION: Also alert admin (main_branch) ---
      try {
        const providerName = booking.providerId
          ? (await storage.getServiceProvider(booking.providerId))?.businessName || 'Unknown'
          : 'Unassigned';
        await notifyAdmin({
          title: `New ${booking.serviceType} Booking`,
          body: `Provider: ${providerName} • 📞 ${booking.userPhone || 'N/A'} • 📍 ${booking.userAddress || 'N/A'}`,
          data: {
            orderId: booking.id,
            orderType: 'service',
            providerName,
            amount: booking.estimatedCost || 'Check App',
            itemsSummary: `${booking.serviceType} service booking`,
            dropAddress: booking.userAddress || 'N/A',
          }
        });
      } catch (adminErr) {
        console.error('[Admin Notif] Service booking admin alert failed:', adminErr);
      }

      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create booking error:", error);
      // Zod ka error message ab frontend ko dikhega
      res.status(400).json({ message: error.message || "Error creating booking" });
    }
  });
  // ----- FIX KHATAM -----

  // (Customer) Apni booking cancel karna - allowed before job starts (pending or accepted)
  app.patch("/api/bookings/:id/cancel", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id: bookingId } = req.params;

      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking nahi mili." });
      }
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Aap yeh booking cancel nahi kar sakte." });
      }
      // Allow cancellation for 'pending' and 'accepted' (before job starts)
      if (booking.status !== 'pending' && booking.status !== 'accepted') {
        return res.status(400).json({ message: `Job already started. '${booking.status}' booking ko cancel nahi kar sakte.` });
      }

      const cancelledBooking = await storage.updateBookingStatus(bookingId, "cancelled");

      // --- PUSH NOTIFICATION to Provider ---
      try {
        if (booking.providerId) {
          const provider = await storage.getServiceProvider(booking.providerId);
          if (provider) {
            const providerUser = await storage.getUser(provider.userId);
            if (providerUser?.fcmToken) {
              await sendPushNotification(providerUser.fcmToken, {
                type: 'ORDER_UPDATE',
                title: '❌ Booking Cancelled by Customer',
                body: `A customer has cancelled their booking. Booking ID: ${bookingId.slice(-8)}`,
                data: { bookingId, action: 'BOOKING_CANCELLED' },
              });
              console.log(`[FCM] Booking cancelled notification sent to provider ${booking.providerId}`);
            }
          }
        }
      } catch (notifError) {
        console.error('[FCM] Cancel notification failed (non-critical):', notifError);
      }

      res.json(cancelledBooking);

    } catch (error: any) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ message: error.message || "Error cancelling booking" });
    }
  });

  // (Provider) Provider booking cancel karna - allowed before job starts (pending or accepted)
  app.patch("/api/bookings/:id/provider-cancel", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id: bookingId } = req.params;

      const booking = await storage.getBooking(bookingId);

      if (!booking || booking.providerId !== providerId) {
        return res.status(404).json({ message: "Booking nahi mili ya aapke liye nahi hai." });
      }
      // Allow cancellation for 'pending' and 'accepted' (before job starts)
      if (booking.status !== 'pending' && booking.status !== 'accepted') {
        return res.status(400).json({ message: `Job already started. '${booking.status}' booking ko cancel nahi kar sakte.` });
      }

      const cancelledBooking = await storage.updateBookingStatus(bookingId, "cancelled");

      // --- PUSH NOTIFICATION to Customer ---
      try {
        const customerUser = await storage.getUser(booking.userId);
        const providerProfile = await storage.getServiceProvider(providerId);
        const providerName = providerProfile?.businessName || 'The provider';

        if (customerUser?.fcmToken) {
          await sendPushNotification(customerUser.fcmToken, {
            type: 'ORDER_UPDATE',
            title: '❌ Booking Cancelled',
            body: `${providerName} has cancelled your booking. Please try booking with another provider.`,
            data: { bookingId, action: 'BOOKING_CANCELLED_BY_PROVIDER' },
          });
          console.log(`[FCM] Provider cancel notification sent to customer ${booking.userId}`);
        }
      } catch (notifError) {
        console.error('[FCM] Provider cancel notification failed (non-critical):', notifError);
      }

      res.json(cancelledBooking);

    } catch (error: any) {
      console.error("Provider cancel booking error:", error);
      res.status(500).json({ message: error.message || "Error cancelling booking" });
    }
  });

  // (Provider) Booking accept karna
  app.patch("/api/bookings/:id/accept", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id: bookingId } = req.params;

      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.providerId !== providerId) {
        return res.status(404).json({ message: "Booking nahi mili ya aapke liye nahi hai." });
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ message: `Yeh booking already '${booking.status}' hai.` });
      }

      const { estimatedCost } = req.body;
      const acceptedBooking = await storage.updateBookingStatus(bookingId, "in_progress", providerId, estimatedCost);

      // --- PUSH NOTIFICATION (Firebase) ---
      try {
        const customerUser = await storage.getUser(booking.userId);
        const providerName = acceptedBooking.provider?.businessName || 'Your provider';
        const scheduledAt = acceptedBooking.scheduledAt;

        if (customerUser?.fcmToken) {
          await sendPushNotification(customerUser.fcmToken, {
            type: 'ORDER_UPDATE',
            title: '✅ Booking Confirmed!',
            body: `${providerName} has confirmed your booking${scheduledAt ? ` for ${new Date(scheduledAt).toLocaleString('en-IN')}` : ''}. Work will begin shortly.`,
            data: { bookingId, action: 'BOOKING_ACCEPTED' },
          });
          console.log(`[FCM] Booking confirmed notification sent to customer ${booking.userId}`);
        } else {
          console.warn(`[FCM] Customer has no FCM token for booking ${bookingId}`);
        }
      } catch (notifError) {
        console.error('[FCM] Booking accepted notification failed (non-critical):', notifError);
      }
      // -----------------------------

      res.json(acceptedBooking);
    } catch (error: any) {
      console.error("Accept booking error:", error);
      res.status(500).json({ message: error.message || "Error accepting booking" });
    }
  });

  // (Provider) Booking decline karna
  app.patch("/api/bookings/:id/decline", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id: bookingId } = req.params;

      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.providerId !== providerId) {
        return res.status(404).json({ message: "Booking nahi mili ya aapke liye nahi hai." });
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ message: `Yeh booking already '${booking.status}' hai.` });
      }

      const declinedBooking = await storage.updateBookingStatus(bookingId, "declined");

      // --- PUSH NOTIFICATION (Firebase) ---
      try {
        const customerUser = await storage.getUser(booking.userId);
        const providerName = declinedBooking.provider?.businessName || 'The provider';

        if (customerUser?.fcmToken) {
          await sendPushNotification(customerUser.fcmToken, {
            type: 'ORDER_UPDATE',
            title: '❌ Booking Declined',
            body: `${providerName} has declined your booking request. Please try booking with another provider.`,
            data: { bookingId, action: 'BOOKING_DECLINED' },
          });
          console.log(`[FCM] Booking declined notification sent to customer ${booking.userId}`);
        } else {
          console.warn(`[FCM] Customer has no FCM token for booking ${bookingId}`);
        }
      } catch (notifError) {
        console.error('[FCM] Booking declined notification failed (non-critical):', notifError);
      }
      // -----------------------------

      res.json(declinedBooking);
    } catch (error: any) {
      console.error("Decline booking error:", error);
      res.status(500).json({ message: error.message || "Error declining booking" });
    }
  });


  // --- NAYE ELECTRICIAN FLOW KE API ENDPOINTS ---

  // (Provider) Job start karna (status = 'in_progress')
  app.patch("/api/bookings/:id/start-job", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id: bookingId } = req.params;
      const booking = await storage.getBooking(bookingId);

      if (!booking || booking.providerId !== providerId) {
        return res.status(404).json({ message: "Booking not found or access denied" });
      }
      if (booking.status !== 'accepted' && booking.status !== 'pending') {
        return res.status(400).json({ message: "Cannot start job for this booking status." });
      }

      const updatedBooking = await storage.updateBookingStatus(bookingId, 'in_progress');
      res.json(updatedBooking);
    } catch (error: any) {
      console.error("Start job error:", error);
      res.status(500).json({ message: error.message || "Error starting job" });
    }
  });

  // (Provider) Job done, OTP generate karna (status = 'awaiting_otp')
  app.post("/api/bookings/:id/generate-otp", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id: bookingId } = req.params;

      const { otp, userPhone } = await storage.generateOtpForBooking(bookingId, providerId);

      res.json({ message: `OTP ${otp} customer ke phone ${userPhone} par bhej diya gaya hai.` });
    } catch (error: any) {
      console.error("Generate OTP error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      res.status(500).json({ message: error.message || "Error generating OTP" });
    }
  });

  // (Provider) OTP Verify karna (status = 'awaiting_billing')
  app.post("/api/bookings/:id/verify-otp", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id: bookingId } = req.params;
      const { otp } = z.object({ otp: z.string().length(6) }).parse(req.body);

      const updatedBooking = await storage.verifyBookingOtp(bookingId, providerId, otp);

      const message = updatedBooking.status === 'pending_payment'
        ? "OTP verified! Invoice created automatically. Customer can now pay."
        : "OTP verified successfully! Ab aap bill bana sakte hain.";

      res.json({ message, booking: updatedBooking });
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      res.status(400).json({ message: error.message || "Error verifying OTP" });
    }
  });

  // (Provider) Final bill/invoice create karna (status = 'pending_payment')
  app.post("/api/bookings/:id/create-invoice", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const userId = req.provider!.userId; // Provider ka user ID nahi, customer ka ID chahiye
      const { id: bookingId } = req.params;

      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.providerId !== providerId) {
        return res.status(404).json({ message: "Booking not found or access denied" });
      }
      if (booking.status !== 'awaiting_billing') {
        return res.status(400).json({ message: `Cannot create bill for booking with status: ${booking.status}` });
      }

      // Zod se validation
      const billSchema = z.object({
        serviceCharge: z.number().min(0),
        spareParts: z.array(z.object({
          part: z.string().min(1),
          cost: z.number().min(0),
        })).optional(),
      });

      const { serviceCharge, spareParts } = billSchema.parse(req.body);

      const sparePartsTotal = spareParts?.reduce((sum, part) => sum + part.cost, 0) || 0;
      const totalAmount = sparePartsTotal + serviceCharge;

      const invoiceData: InsertInvoice = {
        bookingId: bookingId,
        providerId: providerId,
        userId: booking.userId, // Customer ka user ID
        sparePartsDetails: spareParts || [],
        sparePartsTotal: sparePartsTotal.toString(),
        serviceCharge: serviceCharge.toString(),
        totalAmount: totalAmount.toString(),
      };

      const newInvoice = await storage.createInvoiceForBooking(invoiceData);

      res.status(201).json({ message: "Bill create ho gaya. Customer ab pay kar sakta hai.", invoice: newInvoice });
    } catch (error: any) {
      console.error("Create invoice error:", error);
      res.status(400).json({ message: error.message || "Error creating invoice" });
    }
  });
  // (Customer) Get Invoice by ID
  app.get("/api/invoices/:id", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const invoice = await storage.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Security check: Ensure the invoice belongs to the user (or provider)
      // For now, we check if it matches the logged-in user
      if (invoice.userId !== userId) {
        // Optional: Allow providers to view invoices they created
        const provider = await storage.getProviderByUserId(userId);
        if (!provider || provider.id !== invoice.providerId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(invoice);
    } catch (error: any) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: error.message || "Error fetching invoice" });
    }
  });

  // (Customer) Invoice ke liye payment order create karna
  app.post("/api/invoices/:id/create-payment-order", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id: invoiceId } = req.params;

      const { razorpayOrderId, amount, currency, invoice } = await storage.createPaymentOrderForInvoice(invoiceId, userId);

      res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId,
        amount,
        currency,
        invoice,
      });
    } catch (error: any) {
      console.error("Create invoice payment error:", error);
      res.status(500).json({ message: error.message || "Error creating payment order" });
    }
  });

  // (Customer) Invoice payment verify karna (status = 'completed')
  app.post("/api/invoices/verify-payment", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoice_id) {
        return res.status(400).json({ message: "Missing payment details for verification" });
      }

      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (isValid) {
        const updatedInvoice = await storage.verifyInvoicePayment(
          invoice_id,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature
        );
        res.json({ status: "success", invoice: updatedInvoice });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Verify invoice payment error:", error);
      res.status(500).json({ message: error.message || "Error verifying payment" });
    }
  });

  // (Customer) Invoice payment via Cash on Delivery
  app.post("/api/invoices/:id/pay-cod", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const invoiceId = req.params.id;
      // Mark invoice as paid with COD method
      const updatedInvoice = await storage.verifyInvoicePayment(
        invoiceId,
        "COD",
        "COD",
        "COD"
      );
      res.json({ status: "success", invoice: updatedInvoice });
    } catch (error: any) {
      console.error("COD invoice payment error:", error);
      res.status(500).json({ message: error.message || "Error processing COD payment" });
    }
  });

  // --- HELPER FUNCTION FOR ORDER NOTIFICATIONS ---
  async function sendOrderNotifications(updatedOrder: any, orderType: string, database_order_id: string) {
    try {
      const orderLabel = orderType === 'restaurant' ? '🍽️ Restaurant'
        : orderType === 'street_food' ? '🌮 Street Food'
          : '🛒 Grocery';

      if (orderType === 'street_food') {
        const sfAdmin = await storage.getUserByUsername('streetfood_admin');
        if (sfAdmin) {
          console.log(`[FCM] New Order Notification! Sending Ring to streetfood_admin`);
          const allTokens: string[] = [];
          if (sfAdmin.fcmTokens && Array.isArray(sfAdmin.fcmTokens)) {
            allTokens.push(...sfAdmin.fcmTokens);
          } else if (sfAdmin.fcmToken) {
            allTokens.push(sfAdmin.fcmToken);
          }
          const uniqueTokens = [...new Set(allTokens)];
          const sfItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
          const sfItemsSummary = sfItems.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (sfItems.length > 3 ? ` +${sfItems.length - 3} more` : '');
          const sfAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
          const orderUserId = updatedOrder?.userId;
          let sfCustomer;
          let sfPhone = 'N/A';
          if (orderUserId) {
              sfCustomer = await storage.getUser(orderUserId);
              sfPhone = sfCustomer?.phone || 'N/A';
          }

          for (const deviceToken of uniqueTokens) {
            await sendPushNotification(deviceToken, {
              type: 'ORDER_REQUEST',
              title: `${orderLabel} Order — ₹${sfAmount} (COD/Paid)`,
              body: `🛒 ${sfItemsSummary || 'New order'} • 📞 ${sfPhone} • 📍 ${updatedOrder?.deliveryAddress || 'Check App'}${updatedOrder?.deliveryMode === 'scheduled' && updatedOrder?.scheduledDeliveryTime ? ` • 📅 Deliver at ${updatedOrder.scheduledDeliveryTime}` : ' • ⚡ Deliver Now'}`,
              data: {
                orderId: database_order_id,
                orderType: orderType || 'street_food',
                customerName: sfCustomer?.username || 'Customer',
                customerPhone: sfPhone,
                amount: sfAmount,
                itemsSummary: sfItemsSummary || 'Street food order',
                dropAddress: updatedOrder?.deliveryAddress || 'Check App',
                navigateTo: '/provider/dashboard'
              }
            });
          }
        }
      } else {
        const providerId = updatedOrder?.providerId;
        if (providerId) {
          const provider = await storage.getServiceProvider(providerId);
          if (provider && provider.user) {
            console.log(`[FCM] New Order Notification! Sending Ring to ${provider.businessName}`);
            const allTokens: string[] = [];
            if (provider.user.fcmTokens && Array.isArray(provider.user.fcmTokens)) {
              allTokens.push(...provider.user.fcmTokens);
            } else if (provider.user.fcmToken) {
              allTokens.push(provider.user.fcmToken);
            }
            const uniqueTokens = [...new Set(allTokens)];
            const orderItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
            const itemsSummary = orderItems.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (orderItems.length > 3 ? ` +${orderItems.length - 3} more` : '');
            const orderAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
            
            const orderUserId = updatedOrder?.userId;
            let orderCustomer;
            let orderPhone = 'N/A';
            if (orderUserId) {
                orderCustomer = await storage.getUser(orderUserId);
                orderPhone = orderCustomer?.phone || 'N/A';
            }

            for (const deviceToken of uniqueTokens) {
              await sendPushNotification(deviceToken, {
                type: 'ORDER_REQUEST',
                title: `${orderLabel} Order — ₹${orderAmount} (COD/Paid)`,
                body: `🛒 ${itemsSummary || 'New order'} • 📞 ${orderPhone} • 📍 ${updatedOrder?.deliveryAddress || 'Check App'}${updatedOrder?.deliveryMode === 'scheduled' && updatedOrder?.scheduledDeliveryTime ? ` • 📅 Deliver at ${updatedOrder.scheduledDeliveryTime}` : ' • ⚡ Deliver Now'}`,
                data: {
                  orderId: database_order_id,
                  orderType: orderType || 'grocery',
                  customerName: orderCustomer?.username || 'Customer',
                  customerPhone: orderPhone,
                  amount: orderAmount,
                  itemsSummary: itemsSummary || `${orderLabel} order`,
                  dropAddress: updatedOrder?.deliveryAddress || 'Check App',
                  navigateTo: '/provider/dashboard'
                }
              });
            }
          }
        }
      }
    } catch (fcmError) {
      console.error('[FCM Error] Post-payment notification failed (non-critical):', fcmError);
    }
    
    try {
      const adminOrderLabel = orderType === 'restaurant' ? '🍽️ Restaurant'
        : orderType === 'street_food' ? '🌮 Street Food'
          : '🛒 Grocery';
      let adminProviderName = 'N/A';
      if (orderType === 'street_food') {
        adminProviderName = 'Street Food Admin';
      } else if (updatedOrder?.providerId) {
        const prov = await storage.getServiceProvider(updatedOrder.providerId);
        adminProviderName = prov?.businessName || 'Unknown';
      }
      const adminAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
      const adminItems = Array.isArray(updatedOrder?.items)
        ? updatedOrder.items.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (updatedOrder.items.length > 3 ? ` +${updatedOrder.items.length - 3} more` : '')
        : '';
      await notifyAdmin({
        title: `${adminOrderLabel} Order — ₹${adminAmount}`,
        body: `Provider: ${adminProviderName} • 🛒 ${adminItems || 'New order'} • 📍 ${updatedOrder?.deliveryAddress || 'N/A'}${updatedOrder?.deliveryMode === 'scheduled' && updatedOrder?.scheduledDeliveryTime ? ` • 📅 Deliver at ${updatedOrder.scheduledDeliveryTime}` : ' • ⚡ Now'}`,
        data: {
          orderId: database_order_id,
          orderType: orderType || 'grocery',
          providerName: adminProviderName,
          amount: adminAmount,
          itemsSummary: adminItems || `${adminOrderLabel} order`,
          dropAddress: updatedOrder?.deliveryAddress || 'N/A',
        }
      });
    } catch (adminErr) {
      console.error('[Admin Notif] Order admin alert failed:', adminErr);
    }
  }

  // --- PAYMENT VERIFICATION ROUTE (GENERIC) ---
  app.post("/api/payment/verify-signature", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, database_order_id, orderType } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !database_order_id) {
        return res.status(400).json({ message: "Missing payment details" });
      }

      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (isValid) {
        // Update order status in DB
        let updatedOrder;
        if (orderType === 'street_food') {
          updatedOrder = await storage.updateStreetFoodOrderStatus(database_order_id, "paid", razorpay_payment_id, razorpay_order_id);
        } else if (orderType === 'restaurant') {
          updatedOrder = await storage.updateRestaurantOrderStatus(database_order_id, "paid", null, razorpay_payment_id, razorpay_order_id);
        } else {
          updatedOrder = await storage.updateGroceryOrderStatus(database_order_id, "paid", razorpay_payment_id, razorpay_order_id);
        }

        res.json({ status: "success", order: updatedOrder });

        // Track Purchase event server-side for Meta Ads (fire and forget)
        try {
          const orderUser = await storage.getUser(req.session?.userId || '');
          const orderItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
          const itemIds = orderItems.map((i: any) => String(i.productId || i.menuItemId || i.id || ''));
          const totalAmount = parseFloat(updatedOrder?.totalAmount || updatedOrder?.total || '0');
          
          trackPurchase({
            email: orderUser?.email || undefined,
            phone: orderUser?.phone || undefined,
            externalId: orderUser?.id,
            clientIpAddress: req.ip,
            clientUserAgent: req.headers['user-agent'],
          }, database_order_id, totalAmount, itemIds).catch(() => {});
        } catch (fbErr) {
          console.error('[FacebookConversions] Purchase tracking failed:', fbErr);
        }

        // --- PUSH NOTIFICATION (RINGING) — Only after payment is verified! ---
        try {
          const orderLabel = orderType === 'restaurant' ? '🍽️ Restaurant'
            : orderType === 'street_food' ? '🌮 Street Food'
              : '🛒 Grocery';

          if (orderType === 'street_food') {
            const sfAdmin = await storage.getUserByUsername('streetfood_admin');
            if (sfAdmin) {
              console.log(`[FCM] Payment verified! Sending Ring to streetfood_admin`);
              const allTokens: string[] = [];
              if (sfAdmin.fcmTokens && Array.isArray(sfAdmin.fcmTokens)) {
                allTokens.push(...sfAdmin.fcmTokens);
              } else if (sfAdmin.fcmToken) {
                allTokens.push(sfAdmin.fcmToken);
              }
              const uniqueTokens = [...new Set(allTokens)];
              // Build items summary for street food
              const sfItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
              const sfItemsSummary = sfItems.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (sfItems.length > 3 ? ` +${sfItems.length - 3} more` : '');
              const sfAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
              const sfCustomer = await storage.getUser(updatedOrder?.userId);
              const sfPhone = sfCustomer?.phone || 'N/A';

              for (const deviceToken of uniqueTokens) {
                await sendPushNotification(deviceToken, {
                  type: 'ORDER_REQUEST',
                  title: `${orderLabel} Order — ₹${sfAmount}`,
                  body: `🛒 ${sfItemsSummary || 'New order'} • 📞 ${sfPhone} • 📍 ${updatedOrder?.deliveryAddress || 'Check App'}`,
                  data: {
                    orderId: database_order_id,
                    orderType: orderType || 'street_food',
                    customerName: sfCustomer?.username || 'Customer',
                    customerPhone: sfPhone,
                    amount: sfAmount,
                    itemsSummary: sfItemsSummary || 'Street food order',
                    dropAddress: updatedOrder?.deliveryAddress || 'Check App',
                    navigateTo: '/provider/dashboard'
                  }
                });
              }
            }
          } else {
            const providerId = updatedOrder?.providerId;
            if (providerId) {
              const provider = await storage.getServiceProvider(providerId);
              if (provider && provider.user) {
                console.log(`[FCM] Payment verified! Sending Ring to ${provider.businessName}`);

                // Multi-device support: send to all tokens
                const allTokens: string[] = [];
                if (provider.user.fcmTokens && Array.isArray(provider.user.fcmTokens)) {
                  allTokens.push(...provider.user.fcmTokens);
                } else if (provider.user.fcmToken) {
                  allTokens.push(provider.user.fcmToken);
                }
                const uniqueTokens = [...new Set(allTokens)];
                console.log(`[FCM] Sending to ${uniqueTokens.length} device(s)`);

                // Build items summary for restaurant/grocery
                const orderItems = Array.isArray(updatedOrder?.items) ? updatedOrder.items : [];
                const itemsSummary = orderItems.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (orderItems.length > 3 ? ` +${orderItems.length - 3} more` : '');
                const orderAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
                const orderCustomer = await storage.getUser(updatedOrder?.userId);
                const orderPhone = orderCustomer?.phone || 'N/A';

                for (const deviceToken of uniqueTokens) {
                  await sendPushNotification(deviceToken, {
                    type: 'ORDER_REQUEST',
                    title: `${orderLabel} Order — ₹${orderAmount}`,
                    body: `🛒 ${itemsSummary || 'New order'} • 📞 ${orderPhone} • 📍 ${updatedOrder?.deliveryAddress || 'Check App'}`,
                    data: {
                      orderId: database_order_id,
                      orderType: orderType || 'grocery',
                      customerName: orderCustomer?.username || 'Customer',
                      customerPhone: orderPhone,
                      amount: orderAmount,
                      itemsSummary: itemsSummary || `${orderLabel} order`,
                      dropAddress: updatedOrder?.deliveryAddress || 'Check App',
                      navigateTo: '/provider/dashboard'
                    }
                  });
                }
              }
            }
          }
        } catch (fcmError) {
          console.error('[FCM Error] Post-payment notification failed (non-critical):', fcmError);
        }
        // --- END PUSH NOTIFICATION ---

        // --- ADMIN NOTIFICATION: Also alert admin (main_branch) ---
        try {
          const adminOrderLabel = orderType === 'restaurant' ? '🍽️ Restaurant'
            : orderType === 'street_food' ? '🌮 Street Food'
              : '🛒 Grocery';
          let adminProviderName = 'N/A';
          if (orderType === 'street_food') {
            adminProviderName = 'Street Food Admin';
          } else if (updatedOrder?.providerId) {
            const prov = await storage.getServiceProvider(updatedOrder.providerId);
            adminProviderName = prov?.businessName || 'Unknown';
          }
          const adminAmount = updatedOrder?.totalAmount?.toString() || updatedOrder?.total?.toString() || 'Check App';
          const adminItems = Array.isArray(updatedOrder?.items)
            ? updatedOrder.items.slice(0, 3).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') + (updatedOrder.items.length > 3 ? ` +${updatedOrder.items.length - 3} more` : '')
            : '';
          await notifyAdmin({
            title: `${adminOrderLabel} Order — ₹${adminAmount}`,
            body: `Provider: ${adminProviderName} • 🛒 ${adminItems || 'New order'} • 📍 ${updatedOrder?.deliveryAddress || 'N/A'}`,
            data: {
              orderId: database_order_id,
              orderType: orderType || 'grocery',
              providerName: adminProviderName,
              amount: adminAmount,
              itemsSummary: adminItems || `${adminOrderLabel} order`,
              dropAddress: updatedOrder?.deliveryAddress || 'N/A',
            }
          });
        } catch (adminErr) {
          console.error('[Admin Notif] Order admin alert failed:', adminErr);
        }
      } else {
        res.status(400).json({ status: "failure", message: "Invalid signature" });
      }

    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: error.message || "Error verifying payment" });
    }
  });

  // --- PAYMENT ORDER CREATION ROUTE (GENERIC) ---
  app.post("/api/payment/create-order", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, orderType } = req.body; // database order id

      let amount = 0;
      let currency = "INR";
      let dbOrder;

      if (orderType === 'street_food') {
        dbOrder = await storage.getStreetFoodOrder(orderId);
      } else if (orderType === 'restaurant') {
        dbOrder = await storage.getRestaurantOrder(orderId);
      } else {
        dbOrder = await storage.getGroceryOrder(orderId);
      }

      if (!dbOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Amount must be in paise
      if (orderType === 'street_food' || orderType === 'restaurant') {
        amount = Math.round(parseFloat((dbOrder as any).totalAmount) * 100);
      } else {
        amount = Math.round(parseFloat((dbOrder as any).total) * 100);
      }


      const options = {
        amount: amount,
        currency: currency,
        receipt: orderId,
      };

      const order = await razorpayInstance.orders.create(options);

      // Save razorpay order id to db
      if (orderType === 'street_food') {
        await storage.updateStreetFoodOrderRazorpayId(orderId, order.id);
      } else if (orderType === 'restaurant') {
        await storage.updateRestaurantOrderRazorpayId(orderId, order.id);
      } else {
        await storage.updateGroceryOrderRazorpayId(orderId, order.id);
      }

      res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: order.id,
        amount: amount,
        currency: currency,
      });

    } catch (error: any) {
      console.error("Create payment order error:", error);
      res.status(500).json({ message: error.message || "Error creating payment order" });
    }
  });

  // --- CANCEL PAYMENT_PENDING ORDER (when user dismisses Razorpay popup) ---
  app.post("/api/payment/cancel-order", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, orderType } = req.body;
      if (!orderId || !orderType) {
        return res.status(400).json({ message: "orderId and orderType required" });
      }

      // Only cancel orders that are still in payment_pending status
      if (orderType === 'street_food') {
        const order = await storage.getStreetFoodOrder(orderId);
        if (order && order.status === 'payment_pending') {
          await storage.updateStreetFoodOrderStatus(orderId, "cancelled");
          console.log(`[Payment Cancel] Street food order ${orderId} cancelled (payment dismissed)`);
        }
      } else if (orderType === 'restaurant') {
        const order = await storage.getRestaurantOrder(orderId);
        if (order && order.status === 'payment_pending') {
          await storage.updateRestaurantOrderStatus(orderId, "cancelled");
          console.log(`[Payment Cancel] Restaurant order ${orderId} cancelled (payment dismissed)`);
        }
      } else {
        const order = await storage.getGroceryOrder(orderId);
        if (order && order.status === 'payment_pending') {
          await storage.updateGroceryOrderStatus(orderId, "cancelled");
          console.log(`[Payment Cancel] Grocery order ${orderId} cancelled (payment dismissed)`);
        }
      }

      res.json({ status: "cancelled" });
    } catch (error: any) {
      console.error("Cancel payment order error:", error);
      res.status(500).json({ message: error.message || "Error cancelling order" });
    }
  });

  // --- RESTAURANT ORDERS ROUTES ---

  app.post("/api/restaurant/orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      // --- PLATFORM KILL SWITCH ---
      if (!servicesEnabled) {
        return res.status(503).json({ message: "Services are currently closed. Please try again during business hours." });
      }
      const userId = req.userId!;
      const orderData = insertRestaurantOrderSchema.parse(req.body);

      // Assign a static rider ID for MVP (e.g., "rider-1") if needed, or leave null
      // For now, let's leave riderId as null until a rider accepts it (if that's the flow)
      // Or if we want to auto-assign, we can do it here.
      // Let's keep it simple: created with status 'pending', no rider yet.

      // For online payment, create with 'payment_pending' status so it doesn't show in admin/provider panels
      const initialStatus = orderData.paymentMethod === 'online' ? 'payment_pending' : 'pending';
      const order = await storage.createRestaurantOrder({ ...orderData, userId, status: initialStatus } as any);
      console.log("Created Restaurant Order:", order);

      if (orderData.paymentMethod === 'cod') {
        await sendOrderNotifications(order, 'restaurant', order.id);
      }

      res.status(201).json(order);
    } catch (error: any) {
      console.error("Create restaurant order error:", error);
      res.status(400).json({ message: error.message || "Error creating restaurant order" });
    }
  });

  // Get Live Orders for Restaurant
  app.get("/api/restaurant/orders/live", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const orders = await storage.getRestaurantOrders(providerId);
      res.json(orders);
    } catch (error: any) {
      console.error("Get restaurant orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching orders" });
    }
  });

  // Update Order Status
  app.patch("/api/restaurant/orders/:id/status", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { id } = req.params;
      const { status } = req.body;

      // Verify order belongs to provider
      const order = await storage.getRestaurantOrder(id);
      if (!order || order.providerId !== providerId) {
        return res.status(404).json({ message: "Order not found or access denied" });
      }

      const updatedOrder = await storage.updateRestaurantOrderStatus(id, status);
      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: error.message || "Error updating order status" });
    }
  });

  // --- STREET FOOD ORDERS ROUTES (PROVIDER DASHBOARD) ---

  // Get Live Orders for Street Food (Only accessible by streetfood_admin, but going through provider auth route technically checks for 'admin' or 'provider'?)
  // Let's create an endpoint that doesn't strictly check for req.provider if it's streetfood_admin
  app.get("/api/provider/street-food-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (user?.username !== "streetfood_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      // Assuming storage has a method getAllStreetFoodOrders
      const orders = await storage.getAllStreetFoodOrders();
      res.json(orders);
    } catch (error: any) {
      console.error("Get street food orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching orders" });
    }
  });

  // Update Street Food Order Status
  app.patch("/api/provider/street-food-orders/:id/status", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (user?.username !== "streetfood_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const { id } = req.params;
      const { status } = req.body;

      const order = await storage.getStreetFoodOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await storage.updateStreetFoodOrderStatus(id, status);

      // --- RIDER RING: Notify all online riders when provider starts preparing ---
      if (status === 'preparing') {
        try {
          const provider = order.providerId ? await storage.getServiceProvider(order.providerId) : null;
          const providerName = provider?.businessName || 'Street Food Vendor';
          const onlineRiders = await storage.getOnlineDeliveryPartnersWithTokens();
          console.log(`[Rider Ring] Street food order ${id} preparing — notifying ${onlineRiders.length} online rider(s)`);

          for (const rider of onlineRiders) {
            const allTokens: string[] = [];
            if (rider.fcmTokens && Array.isArray(rider.fcmTokens)) {
              allTokens.push(...rider.fcmTokens);
            } else if (rider.fcmToken) {
              allTokens.push(rider.fcmToken);
            }
            const uniqueTokens = [...new Set(allTokens)];
            for (const token of uniqueTokens) {
              const result = await sendPushNotification(token, {
                type: 'ORDER_REQUEST',
                title: `🌮 ${providerName} is Preparing!`,
                body: `Street Food Order #${id.slice(0, 8)} • ₹${updatedOrder.totalAmount} • ${updatedOrder.deliveryAddress?.slice(0, 40) || 'Check App'}`,
                data: {
                  orderId: updatedOrder.id,
                  orderType: 'street_food',
                  customerName: 'Customer',
                  amount: String(updatedOrder.totalAmount || '0'),
                  pickupAddress: provider?.address || 'Check App',
                  dropAddress: updatedOrder.deliveryAddress || 'Check App',
                  navigateTo: '/delivery-partner/dashboard',
                }
              });
              if (result.success) {
                console.log(`✅ Rider ring sent to ${token.substring(0, 15)}...`);
              } else {
                console.error(`❌ Rider ring failed:`, result.error);
              }
            }
          }
        } catch (ringErr: any) {
          console.error('[Rider Ring Error]', ringErr?.message || ringErr);
        }
      }
      // --- END RIDER RING ---

      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: error.message || "Error updating order status" });
    }
  });

  // Get Menu Items
  app.get("/api/provider/menu-items/:categorySlug", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const provider = await storage.getProviderByUserId(req.session.userId);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      // For grocery, support category + search filtering via query params
      const { category, search, limit } = req.query;
      const options = (categorySlug === 'grocery' && (category || search))
        ? {
          category: category as string | undefined,
          search: search as string | undefined,
          limit: limit ? parseInt(limit as string) : 5000
        }
        : undefined;

      const items = await storage.getProviderMenuItems(provider.id, categorySlug, options);
      res.json(items);
    } catch (error: any) {
      console.error("Get menu items error:", error);
      res.status(500).json({ message: error.message || "Error fetching menu items" });
    }
  });

  // Lightweight: Get just grocery category names + counts for provider dashboard
  app.get("/api/provider/grocery-categories", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const provider = await storage.getProviderByUserId(req.session.userId);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      const categories = await storage.getProviderGroceryCategories(provider.id);
      res.json(categories);
    } catch (error: any) {
      console.error("Get grocery categories error:", error);
      res.status(500).json({ message: error.message || "Error fetching categories" });
    }
  });

  // Create Menu Item
  app.post("/api/provider/menu-items/:categorySlug", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { categorySlug } = req.params;
      const itemData = req.body;

      const newItem = await storage.createMenuItem(itemData, providerId, categorySlug);
      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Create menu item error:", error);
      res.status(400).json({ message: error.message || "Error creating menu item" });
    }
  });

  // Update Menu Item
  app.patch("/api/provider/menu-items/:categorySlug/:itemId", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { categorySlug, itemId } = req.params;
      const updates = req.body;
      console.log(`[DEBUG] PATCH Menu Item: ${itemId} | Category: ${categorySlug} | Updates:`, JSON.stringify(updates, null, 2));

      const updatedItem = await storage.updateMenuItem(itemId, providerId, categorySlug, updates);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found or access denied" });
      }
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Update menu item error:", error);
      res.status(500).json({ message: error.message || "Error updating menu item" });
    }
  });

  // Delete Menu Item
  app.delete("/api/provider/menu-items/:categorySlug/:itemId", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { categorySlug, itemId } = req.params;

      const deleted = await storage.deleteMenuItem(itemId, providerId, categorySlug);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found or access denied" });
      }
      res.json({ message: "Item deleted successfully" });
    } catch (error: any) {
      console.error("Delete menu item error:", error);
      res.status(500).json({ message: error.message || "Error deleting menu item" });
    }
  });

  // --- ADMIN BULK TOGGLE ROUTE ---
  app.post("/api/admin/toggle-category-status", async (req: Request, res: Response) => {
    try {
      const { categorySlug, isAvailable } = req.body;
      if (!categorySlug) return res.status(400).json({ message: "categorySlug required" });
      
      const category = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, categorySlug)
      });
      if (!category) return res.status(404).json({ message: "Category not found" });

      await db.update(serviceProviders)
        .set({ isAvailable: Boolean(isAvailable) })
        .where(eq(serviceProviders.categoryId, category.id));

      res.json({ message: "Successfully toggled category providers", isAvailable });
    } catch (error: any) {
      console.error("Bulk toggle error:", error);
      res.status(500).json({ message: error.message || "Error toggling category" });
    }
  });

  // --- RESTAURANT SPECIFIC MENU ROUTE ---
  app.get("/api/restaurant-menu-items", async (req: Request, res: Response) => {
    try {
      const { providerId } = req.query;
      const items = await storage.getRestaurantMenuItems(providerId as string);
      res.json(items);
    } catch (error: any) {
      console.error("Get restaurant menu items error:", error);
      res.status(500).json({ message: error.message || "Error fetching menu items" });
    }
  });

  // --- POPULAR CAKES ROUTE (NEW) ---
  app.get("/api/cake-shop/popular", async (req: Request, res: Response) => {
    try {
      const popularCakes = await db.query.cakeProducts.findMany({
        where: eq(cakeProducts.isPopular, true),
        with: {
          provider: true, // Fetch provider details (businessName, id)
        },
        limit: 10, // Limit results
      });

      res.json(popularCakes);
    } catch (error: any) {
      console.error("Get popular cakes error:", error);
      res.status(500).json({ message: error.message || "Error fetching popular cakes" });
    }
  });

  // --- ALL CAKES FOR CAKE SHOP MAIN PAGE ---
  app.get("/api/cakes", async (req: Request, res: Response) => {
    try {
      // Fetch all active cakes for the main cake shop display
      const records = await db.select({ cake: cakeProducts })
        .from(cakeProducts)
        .innerJoin(serviceProviders, eq(cakeProducts.providerId, serviceProviders.id))
        .where(
          and(
            eq(cakeProducts.isAvailable, true),
            eq(serviceProviders.isAvailable, true)
          )
        )
        .orderBy(asc(cakeProducts.price), desc(cakeProducts.isPopular), desc(cakeProducts.id));
        
      res.json(records.map(r => r.cake));
    } catch (error: any) {
      console.error("Get all cakes error:", error);
      res.status(500).json({ message: error.message || "Error fetching cakes" });
    }
  });

  // --- BAKERIES / CAKE SHOPS ROUTE ---
  app.get("/api/bakeries", async (req: Request, res: Response) => {
    try {
      // Find provider IDs from cakeProducts
      const cakes = await db.select({ providerId: cakeProducts.providerId }).from(cakeProducts);
      const cakeProviderIds = [...new Set(cakes.map(c => c.providerId))];

      // Also find cake-shop category providers (even without products)
      const cakeCategory = await db.query.serviceCategories.findFirst({
        where: eq(serviceCategories.slug, "cake-shop"),
      });

      let categoryProviderIds: string[] = [];
      if (cakeCategory) {
        const catProviders = await db.select({ id: serviceProviders.id })
          .from(serviceProviders)
          .where(eq(serviceProviders.categoryId, cakeCategory.id));
        categoryProviderIds = catProviders.map(p => p.id);
      }

      // Merge both sets
      const allProviderIds = [...new Set([...cakeProviderIds, ...categoryProviderIds])];

      if (allProviderIds.length === 0) {
        return res.json([]);
      }

      // Fetch those providers (available ones)
      const bakeries = await db.select()
        .from(serviceProviders)
        .where(and(
          inArray(serviceProviders.id, allProviderIds),
          eq(serviceProviders.isAvailable, true)
        ));

      res.json(bakeries);
    } catch (error: any) {
      console.error("Get bakeries error:", error);
      res.status(500).json({ message: error.message || "Error fetching bakeries" });
    }
  });

  // --- GROCERY PRODUCTS ROUTE (OPTIMIZED) ---
  app.get("/api/grocery-products", async (req: Request, res: Response) => {
    try {
      const { providerId, search, category, categories, limit = "50", offset = "0" } = req.query;
      if (!providerId) {
        return res.status(400).json({ message: "Provider ID is required" });
      }

      const conditions = [eq(groceryProducts.providerId, providerId as string)];

      // Handle multiple categories (comma-separated or array)
      if (categories) {
        const catList = (categories as string).split(',');
        conditions.push(inArray(groceryProducts.category, catList));
      } else if (category && category !== "") {
        // Fallback for single category legacy/simple use
        conditions.push(eq(groceryProducts.category, category as string));
      }

      // Server-side search with ILIKE
      if (search) {
        conditions.push(ilike(groceryProducts.name, `%${search}%`));
      }

      // Execute optimized query — in-stock items first, then alphabetical
      const products = await db.select()
        .from(groceryProducts)
        .where(and(...conditions))
        .orderBy(desc(groceryProducts.inStock), asc(groceryProducts.name))
        .limit(parseInt(limit as string)) // pagination helps performance
        .offset(parseInt(offset as string));

      res.json(products);
    } catch (error: any) {
      console.error("Get grocery products error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery products" });
    }
  });

  app.get("/api/grocery-metadata", async (req: Request, res: Response) => {
    try {
      const { providerId } = req.query;
      if (!providerId) {
        return res.status(400).json({ message: "Provider ID is required" });
      }

      // Optimize: Only fetch `category` and `brand` columns
      const products = await db.select({
        category: groceryProducts.category,
        brand: groceryProducts.brand
      }).from(groceryProducts).where(
        eq(groceryProducts.providerId, providerId as string)
      );

      // Extract unique categories and brands
      const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
      const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort();

      res.json({ categories, brands });
    } catch (error: any) {
      console.error("Get grocery metadata error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery metadata" });
    }
  });

  // =========================================
  // CUSTOMER ORDER ROUTES
  // =========================================

  // Get Customer's Grocery Orders
  app.get("/api/customer/grocery-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const orders = await storage.getGroceryOrdersByUser(userId);
      res.json(orders);
    } catch (error: any) {
      console.error("Get customer grocery orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery orders" });
    }
  });

  // Get Customer's Restaurant Orders
  app.get("/api/customer/restaurant-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const orders = await storage.getRestaurantOrdersByUserId(userId);
      res.json(orders);
    } catch (error: any) {
      console.error("Get customer restaurant orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching orders" });
    }
  });

  // Get Provider's Restaurant Orders
  app.get("/api/provider/restaurant-orders", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const orders = await storage.getRestaurantOrdersByProviderId(providerId);
      res.json(orders);
    } catch (error: any) {
      console.error("Get provider restaurant orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching orders" });
    }
  });

  // Update Restaurant Order Status (accept, prepare, ready)
  app.patch("/api/provider/restaurant-orders/:orderId/status", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate status transition
      const validStatuses = ['accepted', 'preparing', 'ready_for_pickup'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateProviderOrderStatus(orderId, providerId, status);

      // --- RIDER RING: Notify all online riders when provider starts preparing ---
      if (status === 'preparing') {
        try {
          const provider = await storage.getServiceProvider(providerId);
          const providerName = provider?.businessName || 'Restaurant';
          const onlineRiders = await storage.getOnlineDeliveryPartnersWithTokens();
          console.log(`[Rider Ring] Order ${orderId} preparing — notifying ${onlineRiders.length} online rider(s)`);

          for (const rider of onlineRiders) {
            const allTokens: string[] = [];
            if (rider.fcmTokens && Array.isArray(rider.fcmTokens)) {
              allTokens.push(...rider.fcmTokens);
            } else if (rider.fcmToken) {
              allTokens.push(rider.fcmToken);
            }
            const uniqueTokens = [...new Set(allTokens)];
            for (const token of uniqueTokens) {
              const result = await sendPushNotification(token, {
                type: 'ORDER_REQUEST',
                title: `🍳 ${providerName} is Preparing!`,
                body: `Order #${orderId.slice(0, 8)} • ₹${order.totalAmount} • ${order.deliveryAddress?.slice(0, 40) || 'Check App'}`,
                data: {
                  orderId: order.id,
                  orderType: 'restaurant',
                  customerName: 'Customer',
                  amount: String(order.totalAmount || '0'),
                  pickupAddress: provider?.address || 'Check App',
                  dropAddress: order.deliveryAddress || 'Check App',
                  navigateTo: '/delivery-partner/dashboard',
                }
              });
              if (result.success) {
                console.log(`✅ Rider ring sent to ${token.substring(0, 15)}...`);
              } else {
                console.error(`❌ Rider ring failed:`, result.error);
              }
            }
          }
        } catch (ringErr: any) {
          console.error('[Rider Ring Error]', ringErr?.message || ringErr);
        }
      }
      // --- END RIDER RING ---

      res.json(order);
    } catch (error: any) {
      console.error("Update order status error:", error);
      res.status(400).json({ message: error.message || "Error updating order status" });
    }
  });

  // Get Provider's Grocery Orders
  app.get("/api/provider/grocery-orders", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const orders = await storage.getGroceryOrdersByProvider(providerId);
      res.json(orders);
    } catch (error: any) {
      console.error("Get provider grocery orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching orders" });
    }
  });

  // Update Grocery Order Status (accept, prepare, ready)
  app.patch("/api/provider/grocery-orders/:orderId/status", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const { orderId } = req.params;
      const { status } = req.body;

      const validStatuses = ['accepted', 'preparing', 'ready_for_pickup'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateGroceryOrderStatusByProvider(orderId, providerId, status);

      // --- RIDER RING: Notify all online riders when provider starts preparing ---
      if (status === 'preparing') {
        try {
          const provider = await storage.getServiceProvider(providerId);
          const providerName = provider?.businessName || 'Store';
          const onlineRiders = await storage.getOnlineDeliveryPartnersWithTokens();
          console.log(`[Rider Ring] Grocery order ${orderId} preparing — notifying ${onlineRiders.length} online rider(s)`);

          for (const rider of onlineRiders) {
            const allTokens: string[] = [];
            if (rider.fcmTokens && Array.isArray(rider.fcmTokens)) {
              allTokens.push(...rider.fcmTokens);
            } else if (rider.fcmToken) {
              allTokens.push(rider.fcmToken);
            }
            const uniqueTokens = [...new Set(allTokens)];
            for (const token of uniqueTokens) {
              const result = await sendPushNotification(token, {
                type: 'ORDER_REQUEST',
                title: `📦 ${providerName} is Preparing!`,
                body: `Grocery Order #${orderId.slice(0, 8)} • ₹${order.total} • ${order.deliveryAddress?.slice(0, 40) || 'Check App'}`,
                data: {
                  orderId: order.id,
                  orderType: 'grocery',
                  customerName: 'Customer',
                  amount: String(order.total || '0'),
                  pickupAddress: provider?.address || 'Check App',
                  dropAddress: order.deliveryAddress || 'Check App',
                  navigateTo: '/delivery-partner/dashboard',
                }
              });
              if (result.success) {
                console.log(`✅ Rider ring sent to ${token.substring(0, 15)}...`);
              } else {
                console.error(`❌ Rider ring failed:`, result.error);
              }
            }
          }
        } catch (ringErr: any) {
          console.error('[Rider Ring Error]', ringErr?.message || ringErr);
        }
      }
      // --- END RIDER RING ---

      res.json(order);
    } catch (error: any) {
      console.error("Update grocery order status error:", error);
      res.status(400).json({ message: error.message || "Error updating order status" });
    }
  });

  // =========================================
  // DELIVERY PARTNER ROUTES
  // =========================================

  // Create Delivery Partner Profile
  app.post("/api/delivery-partner/profile", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      // Check if already registered
      const existing = await storage.getDeliveryPartnerByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "You are already registered as a delivery partner." });
      }

      const partnerData = insertDeliveryPartnerSchema.parse(req.body);
      const partner = await storage.createDeliveryPartner({ ...partnerData, userId });
      res.status(201).json(partner);
    } catch (error: any) {
      console.error("Create delivery partner error:", error);
      res.status(400).json({ message: error.message || "Error creating delivery partner profile" });
    }
  });

  // Get own Delivery Partner Profile
  app.get("/api/delivery-partner/profile", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const partner = await storage.getDeliveryPartnerByUserId(userId);
      if (!partner) {
        return res.status(404).json({ message: "Delivery partner profile not found" });
      }
      res.json(partner);
    } catch (error: any) {
      console.error("Get delivery partner profile error:", error);
      res.status(500).json({ message: error.message || "Error fetching profile" });
    }
  });

  // Toggle Online/Offline Status
  app.patch("/api/delivery-partner/status", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const partnerId = req.deliveryPartner!.id;
      const { isOnline } = req.body;

      const updated = await storage.updateDeliveryPartnerStatus(partnerId, isOnline);
      res.json(updated);
    } catch (error: any) {
      console.error("Update delivery partner status error:", error);
      res.status(500).json({ message: error.message || "Error updating status" });
    }
  });

  // Update Location
  app.patch("/api/delivery-partner/location", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const partnerId = req.deliveryPartner!.id;
      const { latitude, longitude } = req.body;

      const updated = await storage.updateDeliveryPartnerLocation(partnerId, latitude, longitude);
      res.json({ message: "Location updated", partner: updated });
    } catch (error: any) {
      console.error("Update delivery partner location error:", error);
      res.status(500).json({ message: error.message || "Error updating location" });
    }
  });

  // Get Available Orders for Riders (ready_for_pickup status, no rider assigned) - includes ALL order types
  app.get("/api/rider/orders/available", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const availableOrders = await storage.getAllAvailableOrdersForRider();
      res.json(availableOrders);
    } catch (error: any) {
      console.error("Get available orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching available orders" });
    }
  });

  // Get Rider's Active/Assigned Orders - includes ALL order types
  app.get("/api/rider/orders/my-active", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const riderId = req.userId!;
      const myOrders = await storage.getAllRiderOrders(riderId);
      res.json(myOrders);
    } catch (error: any) {
      console.error("Get rider orders error:", error);
      res.status(500).json({ message: error.message || "Error fetching orders" });
    }
  });

  // Accept/Claim an Order (works for both restaurant and grocery orders)
  app.post("/api/rider/orders/:id/accept", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;
      const { orderType } = req.body; // 'restaurant' or 'grocery'

      let order;
      if (orderType === 'grocery') {
        order = await storage.acceptGroceryOrderAsRider(orderId, riderId);
      } else if (orderType === 'street_food') {
        order = await storage.acceptStreetFoodOrderAsRider(orderId, riderId);
      } else {
        order = await storage.acceptOrderAsRider(orderId, riderId);
      }
      res.json({ message: "Order accepted!", order });
    } catch (error: any) {
      console.error("Accept order error:", error);
      res.status(400).json({ message: error.message || "Error accepting order" });
    }
  });

  // Mark Arrived at Pickup - handles both order types
  app.post("/api/rider/orders/:id/arrived-at-pickup", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;
      const { orderType } = req.body;

      let order;
      if (orderType === 'grocery') {
        order = await storage.updateGroceryOrderStatusByRider(orderId, riderId, 'arrived_at_pickup');
      } else if (orderType === 'street_food') {
        order = await storage.updateStreetFoodOrderStatusByRider(orderId, riderId, 'arrived_at_pickup');
      } else {
        order = await storage.updateOrderStatus(orderId, riderId, 'arrived_at_pickup');
      }
      res.json({ message: "Marked as arrived at pickup", order });
    } catch (error: any) {
      console.error("Arrived at pickup error:", error);
      res.status(400).json({ message: error.message || "Error updating status" });
    }
  });

  // Mark Order Picked Up - handles both order types (OTP removed)
  app.post("/api/rider/orders/:id/picked-up", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;
      const { orderType } = req.body;

      let result;
      if (orderType === 'grocery') {
        result = await storage.markGroceryOrderPickedUp(orderId, riderId);
      } else if (orderType === 'street_food') {
        result = await storage.markStreetFoodOrderPickedUp(orderId, riderId);
      } else {
        result = await storage.markOrderPickedUp(orderId, riderId);
      }
      res.json({ message: "Order picked up! Deliver to customer.", order: result.order });
    } catch (error: any) {
      console.error("Pick up order error:", error);
      res.status(400).json({ message: error.message || "Error picking up order" });
    }
  });

  // Mark Delivered - directly completes delivery (OTP removed)
  app.post("/api/rider/orders/:id/verify-delivery", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;
      const { orderType } = req.body;

      let order;
      if (orderType === 'grocery') {
        order = await storage.markGroceryOrderDelivered(orderId, riderId);
      } else if (orderType === 'street_food') {
        order = await storage.markStreetFoodOrderDelivered(orderId, riderId);
      } else {
        order = await storage.markOrderDelivered(orderId, riderId);
      }
      res.json({ message: "Delivery completed successfully!", order });
    } catch (error: any) {
      console.error("Mark delivered error:", error);
      res.status(400).json({ message: error.message || "Error marking delivered" });
    }
  });

  // Customer: Track Order
  app.get("/api/orders/:id/track", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const userId = req.userId!;

      const trackingInfo = await storage.getOrderTrackingInfo(orderId, userId);
      res.json(trackingInfo);
    } catch (error: any) {
      console.error("Track order error:", error);
      res.status(400).json({ message: error.message || "Error tracking order" });
    }
  });

  // Provider: Mark Order Ready for Pickup
  app.post("/api/provider/orders/:id/mark-ready", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const providerId = req.provider!.id;

      const order = await storage.markOrderReadyForPickup(orderId, providerId);
      res.json({ message: "Order marked ready for pickup!", order });
    } catch (error: any) {
      console.error("Mark ready error:", error);
      res.status(400).json({ message: error.message || "Error marking order ready" });
    }
  });

  // =========================================
  // Temporary Route for image updates
  // =========================================
  app.get("/api/update-street-food-images", async (req: Request, res: Response) => {
    try {
      const result = await updateStreetFoodImagesDirectly();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/fix-grocery-stock", async (req: Request, res: Response) => {
    try {
      const products = await db.select().from(groceryProducts);
      let updatedCount = 0;

      for (const p of products) {
        let isBroken = false;
        const url = p.imageUrl?.trim();

        if (!url || url === "" || url === "null" || url === "undefined") {
          isBroken = true;
        } else {
          try {
            // Check if URL is reachable
            const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            if (!response.ok) {
              isBroken = true;
            }
          } catch (e) {
            // Fetch failed (network error, timeout, bad url)
            isBroken = true;
          }
        }

        if (isBroken) {
          await db
            .update(groceryProducts)
            .set({ inStock: false })
            .where(eq(groceryProducts.id, p.id));
          updatedCount++;
        }
      }

      res.json({ success: true, updatedCount, message: `Marked ${updatedCount} items with broken or missing images as out of stock.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================
  // DEBUG ENDPOINT - FCM Test
  // =========================================
  app.post("/api/debug/fcm-test", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "userId is required in request body" });
      }

      console.log(`[FCM Debug] Testing FCM for userId: ${userId}`);

      // Get user to find FCM token
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.fcmToken) {
        return res.status(400).json({
          message: "User has no FCM token registered",
          username: user.username,
          userId: user.id
        });
      }

      console.log(`[FCM Debug] Found FCM token for ${user.username}: ${user.fcmToken.substring(0, 20)}...`);

      // Send test FCM notification
      try {
        const fcmResult = await sendPushNotification(user.fcmToken, {
          type: 'ORDER_REQUEST',
          title: '🔧 Test Electrician Order!',
          body: 'This is a test notification from FCM Debug endpoint.',
          data: {
            orderId: 'test-order-123',
            customerName: 'Test Customer',
            amount: '₹500',
            pickupAddress: 'N/A',
            dropAddress: 'Test Address, Shirur'
          }
        });

        console.log(`[FCM Debug] FCM Result:`, JSON.stringify(fcmResult, null, 2));

        res.json({
          success: true,
          message: "FCM test notification sent successfully!",
          fcmResult,
          username: user.username,
          fcmTokenPreview: user.fcmToken.substring(0, 30) + "..."
        });
      } catch (fcmError: any) {
        console.error(`[FCM Debug] FCM Error:`, fcmError);
        res.status(500).json({
          success: false,
          message: "FCM notification failed",
          error: fcmError.message || fcmError,
          username: user.username
        });
      }

    } catch (error: any) {
      console.error("[FCM Debug] Error:", error);
      res.status(500).json({ message: error.message || "Error in FCM debug" });
    }
  });

  // =========================================
  // DIRECT FCM TEST - Bypasses Database Entirely
  // =========================================
  app.get("/api/test-my-ring", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          message: "Token is required. Usage: /api/test-my-ring?token=YOUR_FCM_TOKEN_HERE"
        });
      }

      console.log(`[Direct Ring Test] Testing FCM with token: ${token.substring(0, 30)}...`);
      console.log(`[Direct Ring Test] Token length: ${token.length}`);

      // Send high-priority ORDER_REQUEST directly to the provided token
      const fcmResult = await sendPushNotification(token, {
        type: 'ORDER_REQUEST',
        title: '🔔 Direct Ring Test!',
        body: 'This is a direct FCM test - bypassing database lookup.',
        data: {
          orderId: 'direct-test-' + Date.now(),
          customerName: 'Direct Test',
          amount: '₹999',
          pickupAddress: 'Test Location',
          dropAddress: 'Test Address, Shirur'
        }
      });

      if (fcmResult.success) {
        console.log(`✅ Direct Ring Test SUCCESS - MessageId: ${fcmResult.messageId}`);
        res.json({
          success: true,
          message: "🚀 Direct FCM ring sent successfully!",
          messageId: fcmResult.messageId,
          tokenPreview: token.substring(0, 40) + "..."
        });
      } else {
        console.error(`❌ Direct Ring Test FAILED:`, fcmResult.error);
        res.status(500).json({
          success: false,
          message: "FCM ring failed",
          error: fcmResult.error
        });
      }

    } catch (error: any) {
      console.error("[Direct Ring Test] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error in direct ring test"
      });
    }
  });
  // =========================================
  // ADMIN DASHBOARD ROUTES
  // =========================================

  // GET /api/admin/stats — Dashboard KPIs
  app.get("/api/admin/stats", isAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalUsersResult,
        totalProvidersResult,
        groceryOrdersToday,
        streetFoodOrdersToday,
        restaurantOrdersToday,
        bookingsToday,
        totalGroceryOrders,
        totalStreetFoodOrders,
        totalRestaurantOrders,
        totalBookings,
      ] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(serviceProviders),
        db.select({ value: count() }).from(groceryOrders).where(gte(groceryOrders.createdAt, today)),
        db.select({ value: count() }).from(streetFoodOrders).where(gte(streetFoodOrders.createdAt, today)),
        db.select({ value: count() }).from(restaurantOrders).where(gte(restaurantOrders.createdAt, today)),
        db.select({ value: count() }).from(bookings).where(gte(bookings.createdAt, today)),
        db.select({ value: count() }).from(groceryOrders),
        db.select({ value: count() }).from(streetFoodOrders),
        db.select({ value: count() }).from(restaurantOrders),
        db.select({ value: count() }).from(bookings),
      ]);

      // Revenue today (sum of paid orders)
      const [groceryRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${groceryOrders.total} AS NUMERIC)), 0)` }).from(groceryOrders).where(and(gte(groceryOrders.createdAt, today), eq(groceryOrders.status, 'paid')));
      const [streetFoodRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${streetFoodOrders.totalAmount} AS NUMERIC)), 0)` }).from(streetFoodOrders).where(and(gte(streetFoodOrders.createdAt, today), eq(streetFoodOrders.status, 'paid')));
      const [restaurantRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${restaurantOrders.totalAmount} AS NUMERIC)), 0)` }).from(restaurantOrders).where(and(gte(restaurantOrders.createdAt, today), eq(restaurantOrders.status, 'paid')));

      const revenueToday = parseFloat(groceryRevenue?.total || '0') + parseFloat(streetFoodRevenue?.total || '0') + parseFloat(restaurantRevenue?.total || '0');

      res.json({
        totalUsers: totalUsersResult[0]?.value || 0,
        totalProviders: totalProvidersResult[0]?.value || 0,
        ordersToday: (groceryOrdersToday[0]?.value || 0) + (streetFoodOrdersToday[0]?.value || 0) + (restaurantOrdersToday[0]?.value || 0),
        bookingsToday: bookingsToday[0]?.value || 0,
        totalOrders: (totalGroceryOrders[0]?.value || 0) + (totalStreetFoodOrders[0]?.value || 0) + (totalRestaurantOrders[0]?.value || 0),
        totalBookings: totalBookings[0]?.value || 0,
        revenueToday: revenueToday.toFixed(2),
      });
    } catch (error: any) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/admin/orders — All orders (merged)
  // NOTE: We select specific columns to avoid querying columns (like rider_id)
  // that exist in the Drizzle schema but haven't been migrated to the DB yet.
  app.get("/api/admin/orders", isAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const providerUsers = aliasedTable(users, 'provider_users');
      const [gOrders, sfOrders, rOrders] = await Promise.all([
        db.select({
          id: groceryOrders.id,
          userId: groceryOrders.userId,
          status: groceryOrders.status,
          total: groceryOrders.total,
          deliveryAddress: groceryOrders.deliveryAddress,
          createdAt: groceryOrders.createdAt,
          items: groceryOrders.items,
          paymentMethod: groceryOrders.paymentMethod,
          deliveryMode: groceryOrders.deliveryMode,
          scheduledDeliveryTime: groceryOrders.scheduledDeliveryTime,
          username: users.username,
          phone: users.phone,
          businessName: serviceProviders.businessName,
          providerPhone: providerUsers.phone,
        })
        .from(groceryOrders)
        .leftJoin(users, eq(groceryOrders.userId, users.id))
        .leftJoin(serviceProviders, eq(groceryOrders.providerId, serviceProviders.id))
        .leftJoin(providerUsers, eq(serviceProviders.userId, providerUsers.id))
        .where(ne(groceryOrders.status, 'payment_pending'))
        .orderBy(desc(groceryOrders.createdAt)).limit(100),
        
        db.select({
          id: streetFoodOrders.id,
          userId: streetFoodOrders.userId,
          status: streetFoodOrders.status,
          totalAmount: streetFoodOrders.totalAmount,
          deliveryAddress: streetFoodOrders.deliveryAddress,
          createdAt: streetFoodOrders.createdAt,
          items: streetFoodOrders.items,
          paymentMethod: streetFoodOrders.paymentMethod,
          deliveryMode: streetFoodOrders.deliveryMode,
          scheduledDeliveryTime: streetFoodOrders.scheduledDeliveryTime,
          username: users.username,
          phone: users.phone,
          businessName: serviceProviders.businessName,
          providerPhone: providerUsers.phone,
        })
        .from(streetFoodOrders)
        .leftJoin(users, eq(streetFoodOrders.userId, users.id))
        .leftJoin(serviceProviders, eq(streetFoodOrders.providerId, serviceProviders.id))
        .leftJoin(providerUsers, eq(serviceProviders.userId, providerUsers.id))
        .where(ne(streetFoodOrders.status, 'payment_pending'))
        .orderBy(desc(streetFoodOrders.createdAt)).limit(100),
        
        db.select({
          id: restaurantOrders.id,
          userId: restaurantOrders.userId,
          status: restaurantOrders.status,
          totalAmount: restaurantOrders.totalAmount,
          deliveryAddress: restaurantOrders.deliveryAddress,
          createdAt: restaurantOrders.createdAt,
          items: restaurantOrders.items,
          paymentMethod: restaurantOrders.paymentMethod,
          deliveryMode: restaurantOrders.deliveryMode,
          scheduledDeliveryTime: restaurantOrders.scheduledDeliveryTime,
          username: users.username,
          phone: users.phone,
          businessName: serviceProviders.businessName,
          providerPhone: providerUsers.phone,
        })
        .from(restaurantOrders)
        .leftJoin(users, eq(restaurantOrders.userId, users.id))
        .leftJoin(serviceProviders, eq(restaurantOrders.providerId, serviceProviders.id))
        .leftJoin(providerUsers, eq(serviceProviders.userId, providerUsers.id))
        .where(ne(restaurantOrders.status, 'payment_pending'))
        .orderBy(desc(restaurantOrders.createdAt)).limit(100),
      ]);

      // Map grocery product IDs to names and images
      const groceryItemIds = new Set<string>();
      gOrders.forEach(o => {
          if (Array.isArray(o.items)) {
              o.items.forEach((item: any) => groceryItemIds.add(item.productId));
          }
      });
      const gProducts = groceryItemIds.size > 0 
          ? await db.select({ id: groceryProducts.id, name: groceryProducts.name, imageUrl: groceryProducts.imageUrl }).from(groceryProducts).where(inArray(groceryProducts.id, Array.from(groceryItemIds))) 
          : [];
      const gProductMap = new Map(gProducts.map(p => [p.id, p]));

      // Map street food IDs to images
      const sfItemIds = new Set<string>();
      sfOrders.forEach(o => {
          if (Array.isArray(o.items)) {
              o.items.forEach((item: any) => sfItemIds.add(item.productId || item.itemId));
          }
      });
      const sfProducts = sfItemIds.size > 0
          ? await db.select({ id: streetFoodItems.id, name: streetFoodItems.name, imageUrl: streetFoodItems.imageUrl }).from(streetFoodItems).where(inArray(streetFoodItems.id, Array.from(sfItemIds)))
          : [];
      const sfProductMap = new Map(sfProducts.map(p => [p.id, p]));

      // Map restaurant menu IDs to images
      const rItemIds = new Set<string>();
      rOrders.forEach(o => {
          if (Array.isArray(o.items)) {
              o.items.forEach((item: any) => rItemIds.add(item.menuItemId));
          }
      });
      const rProducts = rItemIds.size > 0
          ? await db.select({ id: restaurantMenuItems.id, name: restaurantMenuItems.name, imageUrl: restaurantMenuItems.imageUrl }).from(restaurantMenuItems).where(inArray(restaurantMenuItems.id, Array.from(rItemIds)))
          : [];
      const rProductMap = new Map(rProducts.map(p => [p.id, p]));

      const merged = [
        ...gOrders.map(o => ({ 
            ...o, 
            orderType: 'grocery' as const, 
            amount: o.total,
            user: { username: o.username || 'Unknown', phone: o.phone },
            provider: { businessName: o.businessName || 'Unknown', phone: o.providerPhone },
            items: Array.isArray(o.items) ? o.items.map((i: any) => ({
                ...i,
                name: gProductMap.get(i.productId)?.name || i.name || 'Unknown Item',
                imageUrl: gProductMap.get(i.productId)?.imageUrl,
            })) : [],
        })),
        ...sfOrders.map(o => ({ 
            ...o, 
            orderType: 'street_food' as const, 
            amount: o.totalAmount,
            user: { username: o.username || 'Unknown', phone: o.phone },
            provider: { businessName: o.businessName || 'Unknown', phone: o.providerPhone },
            items: Array.isArray(o.items) ? o.items.map((i: any) => ({
                ...i,
                name: sfProductMap.get(i.productId || i.itemId)?.name || i.name || 'Unknown Item',
                imageUrl: sfProductMap.get(i.productId || i.itemId)?.imageUrl,
            })) : [],
        })),
        ...rOrders.map(o => ({ 
            ...o, 
            orderType: 'restaurant' as const, 
            amount: o.totalAmount,
            user: { username: o.username || 'Unknown', phone: o.phone },
            provider: { businessName: o.businessName || 'Unknown', phone: o.providerPhone },
            items: Array.isArray(o.items) ? o.items.map((i: any) => ({
                ...i,
                name: rProductMap.get(i.menuItemId)?.name || i.name || 'Unknown Item',
                imageUrl: rProductMap.get(i.menuItemId)?.imageUrl,
            })) : [],
        })),
      ].sort((a, b) => {
        const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dB - dA;
      });

      res.json(merged);
    } catch (error: any) {
      console.error("Admin orders error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/admin/bookings — All bookings (with customer + provider details)
  app.get("/api/admin/bookings", isAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const allBookings = await db.query.bookings.findMany({
        with: {
          user: true,
          provider: true,
          serviceOffering: true,
          problem: true,
        },
        orderBy: [desc(bookings.createdAt)],
        limit: 200,
      });
      res.json(allBookings);
    } catch (error: any) {
      console.error("Admin bookings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/admin/orders/:type/:id/cancel — Admin cancels any order
  app.patch("/api/admin/orders/:type/:id/cancel", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { type, id } = req.params;

      if (!['grocery', 'street_food', 'restaurant'].includes(type)) {
        return res.status(400).json({ message: "Invalid order type. Must be grocery, street_food, or restaurant." });
      }

      let updatedOrder;
      if (type === 'grocery') {
        const [result] = await db
          .update(groceryOrders)
          .set({ status: 'cancelled' })
          .where(eq(groceryOrders.id, id))
          .returning();
        updatedOrder = result;
      } else if (type === 'street_food') {
        const [result] = await db
          .update(streetFoodOrders)
          .set({ status: 'cancelled' })
          .where(eq(streetFoodOrders.id, id))
          .returning();
        updatedOrder = result;
      } else {
        // restaurant
        const [result] = await db
          .update(restaurantOrders)
          .set({ status: 'cancelled' })
          .where(eq(restaurantOrders.id, id))
          .returning();
        updatedOrder = result;
      }

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found." });
      }

      console.log(`[Admin Cancel] Order ${id} (${type}) cancelled by admin.`);
      res.json({ message: "Order cancelled successfully.", order: updatedOrder });
    } catch (error: any) {
      console.error("Admin cancel order error:", error);
      res.status(500).json({ message: error.message || "Error cancelling order" });
    }
  });

  // PATCH /api/admin/orders/:type/:id/status — Admin updates any order's status directly
  app.patch("/api/admin/orders/:type/:id/status", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { type, id } = req.params;
      const { status } = req.body;

      if (!['grocery', 'street_food', 'restaurant'].includes(type)) {
        return res.status(400).json({ message: "Invalid order type. Must be grocery, street_food, or restaurant." });
      }

      const validStatuses = ['accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      let updatedOrder: any;
      if (type === 'grocery') {
        const [result] = await db
          .update(groceryOrders)
          .set({ 
            status,
            ...(status === 'delivered' ? { deliveredAt: new Date() } : {})
          })
          .where(eq(groceryOrders.id, id))
          .returning();
        updatedOrder = result;
      } else if (type === 'street_food') {
        const [result] = await db
          .update(streetFoodOrders)
          .set({ 
            status,
            ...(status === 'delivered' ? { deliveredAt: new Date() } : {})
          })
          .where(eq(streetFoodOrders.id, id))
          .returning();
        updatedOrder = result;
      } else {
        // restaurant
        const [result] = await db
          .update(restaurantOrders)
          .set({ 
            status,
            ...(status === 'delivered' ? { deliveredAt: new Date() } : {})
          })
          .where(eq(restaurantOrders.id, id))
          .returning();
        updatedOrder = result;
      }

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found." });
      }

      console.log(`[Admin Status] Order ${id} (${type}) status updated to '${status}' by admin.`);

      // --- RIDER RING: Notify online riders when admin sets status to 'preparing' ---
      if (status === 'preparing') {
        try {
          let providerName = 'Provider';
          let providerAddress = 'Check App';
          if (updatedOrder.providerId) {
            const provider = await storage.getServiceProvider(updatedOrder.providerId);
            providerName = provider?.businessName || 'Provider';
            providerAddress = provider?.address || 'Check App';
          }

          const orderLabel = type === 'restaurant' ? '🍳' : type === 'street_food' ? '🌮' : '📦';
          const onlineRiders = await storage.getOnlineDeliveryPartnersWithTokens();
          console.log(`[Admin Rider Ring] Order ${id} preparing — notifying ${onlineRiders.length} online rider(s)`);

          for (const rider of onlineRiders) {
            const allTokens: string[] = [];
            if (rider.fcmTokens && Array.isArray(rider.fcmTokens)) {
              allTokens.push(...rider.fcmTokens);
            } else if (rider.fcmToken) {
              allTokens.push(rider.fcmToken);
            }
            const uniqueTokens = [...new Set(allTokens)];
            for (const token of uniqueTokens) {
              await sendPushNotification(token, {
                type: 'ORDER_REQUEST',
                title: `${orderLabel} ${providerName} is Preparing!`,
                body: `Order #${id.slice(0, 8)} • ₹${updatedOrder.totalAmount || updatedOrder.total || '0'} • ${updatedOrder.deliveryAddress?.slice(0, 40) || 'Check App'}`,
                data: {
                  orderId: updatedOrder.id,
                  orderType: type,
                  customerName: 'Customer',
                  amount: String(updatedOrder.totalAmount || updatedOrder.total || '0'),
                  pickupAddress: providerAddress,
                  dropAddress: updatedOrder.deliveryAddress || 'Check App',
                  navigateTo: '/delivery-partner/dashboard',
                }
              });
            }
          }
        } catch (ringErr: any) {
          console.error('[Admin Rider Ring Error]', ringErr?.message || ringErr);
        }
      }
      // --- END RIDER RING ---

      res.json({ message: `Order status updated to '${status}'.`, order: updatedOrder });
    } catch (error: any) {
      console.error("Admin update order status error:", error);
      res.status(500).json({ message: error.message || "Error updating order status" });
    }
  });

  // PATCH /api/admin/bookings/:id/cancel — Admin cancels any booking
  app.patch("/api/admin/bookings/:id/cancel", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [updatedBooking] = await db
        .update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.id, id))
        .returning();

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found." });
      }

      console.log(`[Admin Cancel] Booking ${id} cancelled by admin.`);
      res.json({ message: "Booking cancelled successfully.", booking: updatedBooking });
    } catch (error: any) {
      console.error("Admin cancel booking error:", error);
      res.status(500).json({ message: error.message || "Error cancelling booking" });
    }
  });

  // PATCH /api/admin/bookings/:id/status — Admin updates any booking status
  app.patch("/api/admin/bookings/:id/status", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required." });
      }

      const [updatedBooking] = await db
        .update(bookings)
        .set({ status })
        .where(eq(bookings.id, id))
        .returning();

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found." });
      }

      console.log(`[Admin Update] Booking ${id} status updated to ${status} by admin.`);
      res.json({ message: `Booking status updated to ${status}.`, booking: updatedBooking });
    } catch (error: any) {
      console.error("Admin update booking status error:", error);
      res.status(500).json({ message: error.message || "Error updating booking status" });
    }
  });

  // POST /api/admin/orders/mark-all-delivered — Mark ALL non-delivered/non-cancelled orders as delivered
  app.post("/api/admin/orders/mark-all-delivered", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const now = new Date();

      // Update grocery orders
      const groceryResult = await db
        .update(groceryOrders)
        .set({ status: 'delivered', deliveredAt: now })
        .where(
          sql`${groceryOrders.status} NOT IN ('delivered', 'cancelled')`
        )
        .returning({ id: groceryOrders.id });

      // Update street food orders
      const streetFoodResult = await db
        .update(streetFoodOrders)
        .set({ status: 'delivered', deliveredAt: now })
        .where(
          sql`${streetFoodOrders.status} NOT IN ('delivered', 'cancelled')`
        )
        .returning({ id: streetFoodOrders.id });

      // Update restaurant orders
      const restaurantResult = await db
        .update(restaurantOrders)
        .set({ status: 'delivered', deliveredAt: now })
        .where(
          sql`${restaurantOrders.status} NOT IN ('delivered', 'cancelled')`
        )
        .returning({ id: restaurantOrders.id });

      const totalUpdated = groceryResult.length + streetFoodResult.length + restaurantResult.length;
      console.log(`[Admin Bulk Deliver] ${totalUpdated} orders marked as delivered (Grocery: ${groceryResult.length}, Street Food: ${streetFoodResult.length}, Restaurant: ${restaurantResult.length})`);

      res.json({
        message: `${totalUpdated} orders marked as delivered.`,
        counts: {
          grocery: groceryResult.length,
          streetFood: streetFoodResult.length,
          restaurant: restaurantResult.length,
          total: totalUpdated,
        }
      });
    } catch (error: any) {
      console.error("Admin mark-all-delivered error:", error);
      res.status(500).json({ message: error.message || "Error marking orders as delivered" });
    }
  });

  // GET /api/admin/providers — All providers with category
  app.get("/api/admin/providers", isAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const allProviders = await db.select({
        id: serviceProviders.id,
        userId: serviceProviders.userId,
        businessName: serviceProviders.businessName,
        categoryId: serviceProviders.categoryId,
        address: serviceProviders.address,
        rating: serviceProviders.rating,
        reviewCount: serviceProviders.reviewCount,
        isVerified: serviceProviders.isVerified,
        isAvailable: serviceProviders.isAvailable,
        createdAt: serviceProviders.createdAt,
        profileImageUrl: serviceProviders.profileImageUrl,
      }).from(serviceProviders).orderBy(desc(serviceProviders.createdAt));

      // Get all categories for lookup
      const categories = await db.select().from(serviceCategories);
      const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

      const enriched = allProviders.map(p => ({
        ...p,
        categoryName: catMap[p.categoryId] || p.categoryId,
      }));

      res.json(enriched);
    } catch (error: any) {
      console.error("Admin providers error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Temporary Test Endpoint
  app.get("/api/test-abhiruchi", async (_req, res) => {
    try {
      const providers = await db.select().from(serviceProviders).where(ilike(serviceProviders.businessName, '%abhiruchi%'));
      res.json(providers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/admin/users — All users
  app.get("/api/admin/users", isAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        businessName: serviceProviders.businessName,
      })
        .from(users)
        .leftJoin(serviceProviders, eq(users.id, serviceProviders.userId))
        .orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error: any) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE /api/admin/users/:id — Delete a user
  app.delete("/api/admin/users/:id", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.id;
      // Delete service provider profile if it exists
      await db.delete(serviceProviders).where(eq(serviceProviders.userId, userId));
      // Delete the user
      await db.delete(users).where(eq(users.id, userId));
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ message: "Failed to delete user. They may have active orders or bookings." });
    }
  });

  // POST /api/admin/create-provider — Admin creates a provider account
  app.post("/api/admin/create-provider", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { phone, email, password, businessName, categoryId, address } = req.body;

      if (!phone || !email || !password || !businessName || !categoryId || !address) {
        return res.status(400).json({ message: "All fields are required: phone, email, password, businessName, categoryId, address." });
      }

      // Check duplicates
      const existingPhone = await storage.getUserByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already registered." });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered." });
      }

      // Create user with role=provider
      const username = `provider_${phone}`;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "provider",
        phone,
      });

      // Create service provider profile
      const provider = await storage.createServiceProvider({
        userId: user.id,
        categoryId,
        businessName,
        address,
        description: "",
      } as any);

      console.log(`[Admin] Created provider account: ${businessName} (${phone})`);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        message: `Provider account created for ${businessName}`,
        user: userWithoutPassword,
        provider,
      });
    } catch (error: any) {
      console.error("Admin create provider error:", error);
      res.status(500).json({ message: error.message || "Failed to create provider account." });
    }
  });

  // POST /api/admin/broadcast — Send push notification to audience
  app.post("/api/admin/broadcast", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { audience, title, message } = req.body;

      if (!audience || !title || !message) {
        return res.status(400).json({ message: "audience, title, and message are required." });
      }

      let fcmTokens: string[] = [];

      if (audience === 'all_users' || audience === 'everyone') {
        // All users — collect both fcmToken and fcmTokens arrays
        const userRows = await db.select({ fcmToken: users.fcmToken, fcmTokens: users.fcmTokens }).from(users).where(sql`${users.fcmToken} IS NOT NULL AND ${users.fcmToken} != ''`);
        for (const u of userRows) {
          if (u.fcmTokens && Array.isArray(u.fcmTokens)) {
            fcmTokens.push(...u.fcmTokens);
          } else if (u.fcmToken) {
            fcmTokens.push(u.fcmToken);
          }
        }
      }

      if (audience === 'customers') {
        const rows = await db.select({ fcmToken: users.fcmToken, fcmTokens: users.fcmTokens }).from(users).where(and(eq(users.role, 'customer'), sql`${users.fcmToken} IS NOT NULL AND ${users.fcmToken} != ''`));
        for (const r of rows) {
          if (r.fcmTokens && Array.isArray(r.fcmTokens)) {
            fcmTokens.push(...r.fcmTokens);
          } else if (r.fcmToken) {
            fcmTokens.push(r.fcmToken);
          }
        }
      }

      if (audience === 'providers' || audience === 'everyone') {
        const providerUserIds = await db.select({ userId: serviceProviders.userId }).from(serviceProviders);
        if (providerUserIds.length > 0) {
          const providerUsers = await db.select({ fcmToken: users.fcmToken, fcmTokens: users.fcmTokens }).from(users).where(and(
            inArray(users.id, providerUserIds.map(p => p.userId)),
            sql`${users.fcmToken} IS NOT NULL AND ${users.fcmToken} != ''`
          ));
          for (const u of providerUsers) {
            if (u.fcmTokens && Array.isArray(u.fcmTokens)) {
              fcmTokens.push(...u.fcmTokens);
            } else if (u.fcmToken) {
              fcmTokens.push(u.fcmToken);
            }
          }
        }
      }

      if (audience === 'restaurants') {
        const restaurantCat = await db.query.serviceCategories.findFirst({ where: eq(serviceCategories.slug, 'restaurant') });
        if (restaurantCat) {
          const restProviders = await db.select({ userId: serviceProviders.userId }).from(serviceProviders).where(eq(serviceProviders.categoryId, restaurantCat.id));
          if (restProviders.length > 0) {
            const rows = await db.select({ fcmToken: users.fcmToken, fcmTokens: users.fcmTokens }).from(users).where(and(
              inArray(users.id, restProviders.map(p => p.userId)),
              sql`${users.fcmToken} IS NOT NULL AND ${users.fcmToken} != ''`
            ));
            for (const r of rows) {
              if (r.fcmTokens && Array.isArray(r.fcmTokens)) {
                fcmTokens.push(...r.fcmTokens);
              } else if (r.fcmToken) {
                fcmTokens.push(r.fcmToken);
              }
            }
          }
        }
      }

      if (audience === 'street_food') {
        const sfCat = await db.query.serviceCategories.findFirst({ where: eq(serviceCategories.slug, 'street_food') });
        if (sfCat) {
          const sfProviders = await db.select({ userId: serviceProviders.userId }).from(serviceProviders).where(eq(serviceProviders.categoryId, sfCat.id));
          if (sfProviders.length > 0) {
            const rows = await db.select({ fcmToken: users.fcmToken, fcmTokens: users.fcmTokens }).from(users).where(and(
              inArray(users.id, sfProviders.map(p => p.userId)),
              sql`${users.fcmToken} IS NOT NULL AND ${users.fcmToken} != ''`
            ));
            for (const r of rows) {
              if (r.fcmTokens && Array.isArray(r.fcmTokens)) {
                fcmTokens.push(...r.fcmTokens);
              } else if (r.fcmToken) {
                fcmTokens.push(r.fcmToken);
              }
            }
          }
        }
      }

      // Remove duplicates
      fcmTokens = [...new Set(fcmTokens)];

      if (fcmTokens.length === 0) {
        return res.json({ sent: 0, total: 0, message: "No users with FCM tokens found for this audience." });
      }

      // Send notifications (batch, non-blocking)
      let sentCount = 0;
      let failedCount = 0;
      const results = await Promise.allSettled(
        fcmTokens.map(token =>
          sendPushNotification(token, {
            type: 'ORDER_UPDATE',
            title,
            body: message,
            data: {
              type: 'ADMIN_BROADCAST',
              title: title,
              body: message,
              navigateTo: '/',
            }
          })
        )
      );

      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success) sentCount++;
        else failedCount++;
      });

      console.log(`[Admin Broadcast] Sent to ${sentCount}/${fcmTokens.length} tokens (${failedCount} failed)`);
      res.json({ sent: sentCount, failed: failedCount, total: fcmTokens.length });
    } catch (error: any) {
      console.error("Admin broadcast error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // =========================================
  // ADMIN: GMart Products CSV Import
  // =========================================
  app.post("/api/admin/import-gmart-products", upload.single('csv'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required. Upload with field name 'csv'" });
      }

      // Check file type
      if (!req.file.originalname.endsWith('.csv')) {
        return res.status(400).json({ message: "File must be a CSV file" });
      }

      console.log(`[GMart Import] Received file: ${req.file.originalname} (${req.file.size} bytes)`);

      // Convert buffer to string
      const csvContent = req.file.buffer.toString('utf-8');

      // Import products
      const result = await importGmartProducts(csvContent);

      res.json({
        ...result,
        message: `Successfully imported ${result.imported} products from ${result.totalInCSV} CSV rows`
      });

    } catch (error: any) {
      console.error("[GMart Import] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error importing products"
      });
    }
  });

  // --- POPULAR ITEMS ROUTES ---

  // Get all popular items (Public)
  app.get("/api/homepage/popular", async (_req: Request, res: Response) => {
    try {
      const data = await getCachedOrFetch('homepage_popular', 2 * 60 * 1000, async () => {
        // Run all DB queries in parallel instead of sequentially
        const [streetFood, streetFoodProviders, restaurants, cakes, menuItems] = await Promise.all([
          storage.getPopularStreetFood(),
          storage.getPopularStreetFoodProviders(),
          storage.getPopularRestaurants(),
          storage.getPopularCakes(),
          storage.getPopularRestaurantMenuItems(),
        ]);
        return { streetFood, streetFoodProviders, restaurants, cakes, menuItems };
      });
      res.json(data);
    } catch (error: any) {
      console.error("Get popular items error:", error);
      res.status(500).json({ message: error.message || "Error fetching popular items" });
    }
  });

  // TEMPORARY: Endpoint to update street food images
  app.get("/api/update-street-food-images", async (_req: Request, res: Response) => {
    try {
      const { updateStreetFoodImagesDirectly } = await import("./update_images");
      const result = await updateStreetFoodImagesDirectly();
      res.json(result);
    } catch (error: any) {
      console.error("Error updating images:", error);
      res.status(500).json({ message: error.message || "Error updating images" });
    }
  });

  // Search items for Admin (Admin only)
  app.get("/api/admin/search-items", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { query, type } = req.query;
      if (!query || !type) {
        return res.status(400).json({ message: "Query and type are required" });
      }
      const results = await storage.searchItemsForAdmin(query as string, type as any);
      res.json(results);
    } catch (error: any) {
      console.error("Admin search items error:", error);
      res.status(500).json({ message: error.message || "Error searching items" });
    }
  });

  // Get menus for a specific provider (Admin only)
  app.get("/api/admin/provider-menu/:type/:providerId", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { type, providerId } = req.params;

      let items = [];
      if (type === 'street_food') {
        items = await db.select().from(streetFoodItems).where(eq(streetFoodItems.providerId, providerId));
      } else if (type === 'restaurant') {
        items = await db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, providerId));
      } else if (type === 'cake') {
        items = await db.select().from(cakeProducts).where(eq(cakeProducts.providerId, providerId));
      } else {
        return res.status(400).json({ message: "Invalid type provided" });
      }

      res.json(items);
    } catch (error: any) {
      console.error("Fetch provider menu error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider menu" });
    }
  });

  // Toggle popular status (Admin only)
  app.post("/api/admin/toggle-popular", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { type, id, isPopular, popularOrder } = req.body;
      if (!type || !id || isPopular === undefined) {
        return res.status(400).json({ message: "Type, id, and isPopular are required" });
      }
      const updatedItem = await storage.togglePopularStatus(type, id, isPopular, popularOrder);
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Toggle popular status error:", error);
      res.status(500).json({ message: error.message || "Error updating status" });
    }
  });

  // =========================================
  // ADMIN DISPLAY ORDER MANAGEMENT
  // =========================================

  // Get providers in display order for a given category (Admin only)
  app.get("/api/admin/provider-display-order", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.query;
      if (!category) {
        return res.status(400).json({ message: "Category slug is required (e.g., restaurants, street-food, cake-shop)" });
      }
      const providers = await storage.getProviderDisplayOrder(category as string);
      res.json(providers);
    } catch (error: any) {
      console.error("Get provider display order error:", error);
      res.status(500).json({ message: error.message || "Error fetching display order" });
    }
  });

  // Bulk update provider display order (Admin only)
  app.put("/api/admin/provider-display-order", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { updates } = req.body;
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "updates array is required with [{id, displayOrder}]" });
      }
      // Validate each update
      for (const u of updates) {
        if (!u.id || typeof u.displayOrder !== 'number') {
          return res.status(400).json({ message: "Each update must have 'id' (string) and 'displayOrder' (number)" });
        }
        if (u.rating !== undefined && typeof u.rating !== 'string') {
          return res.status(400).json({ message: "If rating is provided, it must be a string." });
        }
      }
      await storage.bulkUpdateDisplayOrder(updates);
      // Invalidate cache so changes reflect immediately
      apiCache.delete('homepage_popular');
      res.json({ message: `Display order updated for ${updates.length} providers` });
    } catch (error: any) {
      console.error("Update display order error:", error);
      res.status(500).json({ message: error.message || "Error updating display order" });
    }
  });

  // =========================================
  // ADMIN STREET FOOD MANAGEMENT
  // =========================================

  // Helper: resolve real street-food category UUID
  async function getStreetFoodCategoryId(): Promise<string> {
    const cat = await db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.slug, "street-food")
    });
    return cat?.id || "street_food"; // fallback to literal if category missing
  }

  // One-time auto-migration: fix vendors that were created with wrong categoryId AND clean up old vendors
  (async () => {
    try {
      const realId = await getStreetFoodCategoryId();

      // Step 1: Fix wrong categoryId ('street_food' literal → real UUID)
      if (realId !== "street_food") {
        const result = await db.update(serviceProviders)
          .set({ categoryId: realId })
          .where(eq(serviceProviders.categoryId, "street_food"))
          .returning();
        if (result.length > 0) {
          console.log(`[Migration] Fixed categoryId for ${result.length} street food vendor(s): 'street_food' → '${realId}'`);
        }
      }

      // Step 2: Remove old street food vendors not owned by streetfood_admin
      const adminUser = await db.query.users.findFirst({
        where: eq(users.username, "streetfood_admin")
      });

      if (adminUser) {
        // Get all street food vendors NOT owned by the admin
        const oldVendors = await db.query.serviceProviders.findMany({
          where: and(
            eq(serviceProviders.categoryId, realId),
            sql`${serviceProviders.userId} != ${adminUser.id}`
          )
        });

        if (oldVendors.length > 0) {
          console.log(`[Cleanup] Found ${oldVendors.length} old street food vendor(s) not owned by streetfood_admin. Removing...`);
          for (const vendor of oldVendors) {
            // Delete their menu items first
            await db.delete(streetFoodItems).where(eq(streetFoodItems.providerId, vendor.id));
            // Delete the vendor profile
            await db.delete(serviceProviders).where(eq(serviceProviders.id, vendor.id));
            console.log(`[Cleanup] Deleted old vendor: ${vendor.businessName} (${vendor.id})`);
          }
        }
      }
    } catch (err) {
      console.warn("[Migration] Street food migration/cleanup skipped:", err);
    }
  })();

  // Get all street food vendors
  app.get("/api/admin/street-food/vendors", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = await getStreetFoodCategoryId();
      const vendors = await db.query.serviceProviders.findMany({
        where: eq(serviceProviders.categoryId, categoryId),
        orderBy: (providers, { desc }) => [desc(providers.createdAt)]
      });
      res.json(vendors);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch vendors" });
    }
  });

  // Create a new street food vendor
  app.post("/api/admin/street-food/vendors", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Vendor Profile Name is required" });

      // Assign to the admin's userId
      const adminUserId = req.userId;
      if (!adminUserId) return res.status(401).json({ message: "Admin user ID not found" });

      const categoryId = await getStreetFoodCategoryId();

      const [newVendor] = await db.insert(serviceProviders).values({
        userId: adminUserId.toString(),
        categoryId,
        businessName: name,
        address: "Added via Admin Panel", // Default required field
        isVerified: true,
        isAvailable: true,
      }).returning();

      res.status(201).json(newVendor);
    } catch (error: any) {
      console.error("Create street food vendor error:", error);
      res.status(500).json({ message: error.message || "Failed to create vendor" });
    }
  });

  // Get menu for a specific street food vendor
  app.get("/api/admin/street-food/vendors/:id/menu", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const providerId = req.params.id;
      const menu = await db.query.streetFoodItems.findMany({
        where: eq(streetFoodItems.providerId, providerId),
        orderBy: (items, { desc }) => [desc(items.createdAt)]
      });
      res.json(menu);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch menu" });
    }
  });

  app.post("/api/admin/street-food/vendors/:id/menu", isAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
    try {
      const providerId = req.params.id;
      const { name, category, price, description, isVeg, imageUrl: bodyImageUrl } = req.body;

      if (!name || !price) {
        return res.status(400).json({ message: "Name and Price are required" });
      }

      let finalImageUrl = bodyImageUrl;

      // Handle file upload
      if (req.file) {
        try {
          const result = await uploadToCloudinary(req.file.buffer);
          finalImageUrl = result;
        } catch (uploadError: any) {
          console.error("Cloudinary upload failed:", uploadError);
          return res.status(500).json({ message: "Image upload failed" });
        }
      }

      const [newItem] = await db.insert(streetFoodItems).values({
        providerId,
        name,
        category: category || "Recommended",
        price: price.toString(),
        description,
        isVeg: isVeg === 'true' || isVeg === true,
        imageUrl: finalImageUrl,
        isAvailable: true,
      }).returning();

      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Add street food menu item error:", error);
      res.status(500).json({ message: error.message || "Failed to add menu item" });
    }
  });

  // Edit an existing menu item
  app.put("/api/admin/street-food/vendors/:id/menu/:itemId", isAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
    try {
      const { itemId } = req.params;
      const { name, category, price, description, isVeg, imageUrl: bodyImageUrl, isAvailable } = req.body;

      // Find original item
      const existingItem = await db.query.streetFoodItems.findFirst({
        where: eq(streetFoodItems.id, itemId)
      });

      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }

      let finalImageUrl = bodyImageUrl !== undefined ? bodyImageUrl : existingItem.imageUrl;

      // Handle file upload
      if (req.file) {
        try {
          const result = await uploadToCloudinary(req.file.buffer);
          finalImageUrl = result;
        } catch (uploadError: any) {
          console.error("Cloudinary upload failed:", uploadError);
          return res.status(500).json({ message: "Image upload failed" });
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (price !== undefined) updateData.price = price.toString();
      if (description !== undefined) updateData.description = description;
      if (isVeg !== undefined) updateData.isVeg = isVeg === 'true' || isVeg === true;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;

      updateData.imageUrl = finalImageUrl;

      const [updatedItem] = await db.update(streetFoodItems)
        .set(updateData)
        .where(eq(streetFoodItems.id, itemId))
        .returning();

      res.json(updatedItem);
    } catch (error: any) {
      console.error("Edit street food menu item error:", error);
      res.status(500).json({ message: error.message || "Failed to edit menu item" });
    }
  });

  // Delete a menu item
  app.delete("/api/admin/street-food/vendors/:id/menu/:itemId", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { itemId } = req.params;
      await db.delete(streetFoodItems).where(eq(streetFoodItems.id, itemId));
      res.json({ success: true, message: "Item deleted successfully" });
    } catch (error: any) {
      console.error("Delete street food menu item error:", error);
      res.status(500).json({ message: error.message || "Failed to delete item" });
    }
  });

  // Edit Vendor Profile details
  app.put("/api/admin/street-food/vendors/:id", isAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { businessName, isAvailable } = req.body;

      const updateData: any = {};
      if (businessName) updateData.businessName = businessName;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;

      if (req.file) {
        try {
          updateData.profileImageUrl = await uploadToCloudinary(req.file.buffer);
        } catch (uploadError: any) {
          return res.status(500).json({ message: "Image upload failed" });
        }
      }

      const [updatedVendor] = await db.update(serviceProviders)
        .set(updateData)
        .where(eq(serviceProviders.id, id))
        .returning();

      res.json(updatedVendor);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update vendor" });
    }
  });

  // Delete Vendor Profile Details completely
  app.delete("/api/admin/street-food/vendors/:id", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteStreetFoodVendor(id);
      res.json({ success: true, message: "Vendor and all menu items deleted successfully" });
    } catch (error: any) {
      console.error("Delete street food vendor error:", error);
      res.status(500).json({ message: error.message || "Failed to delete vendor" });
    }
  });

  // Manage Gallery Images for Street Food Vendors
  app.post("/api/admin/street-food/vendors/:id/gallery", isAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No image provided" });
      const { id } = req.params;

      const vendor = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.id, id)
      });
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      const imageUrl = await uploadToCloudinary(req.file.buffer);
      const currentGallery = vendor.galleryImages || [];

      const [updatedVendor] = await db.update(serviceProviders)
        .set({ galleryImages: [...currentGallery, imageUrl] })
        .where(eq(serviceProviders.id, id))
        .returning();

      res.status(201).json({ imageUrl, galleryImages: updatedVendor.galleryImages });
    } catch (error: any) {
      console.error("Upload street food gallery error:", error);
      res.status(500).json({ message: error.message || "Failed to upload image" });
    }
  });

  app.delete("/api/admin/street-food/vendors/:id/gallery", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { imageUrl, index } = req.body;
      const { id } = req.params;

      if (!imageUrl && index === undefined) {
        return res.status(400).json({ message: "imageUrl or index is required" });
      }

      const vendor = await db.query.serviceProviders.findFirst({
        where: eq(serviceProviders.id, id)
      });

      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      let currentGallery = vendor.galleryImages || [];
      let newGallery = [...currentGallery];

      if (index !== undefined && index >= 0 && index < currentGallery.length) {
         newGallery.splice(index, 1);
      } else if (imageUrl) {
         newGallery = currentGallery.filter(url => url !== imageUrl);
      } else {
         return res.status(400).json({ message: "Invalid image identifier provided." });
      }

      const [updatedVendor] = await db.update(serviceProviders)
        .set({ galleryImages: newGallery })
        .where(eq(serviceProviders.id, id))
        .returning();

      res.json({ success: true, galleryImages: updatedVendor.galleryImages });
    } catch (error: any) {
      console.error("Delete street food gallery image error:", error);
      res.status(500).json({ message: error.message || "Failed to delete image" });
    }
  });

  // =========================================
  // ADMIN OFFER MANAGEMENT (For Street Food)
  // =========================================

  // Get offers for a specific vendor (Admin)
  app.get("/api/admin/street-food/vendors/:id/offers", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const offers = await db.query.providerOffers.findMany({
        where: eq(providerOffers.providerId, id),
        orderBy: (offers, { desc }) => [desc(offers.createdAt)]
      });
      res.json(offers);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch offers" });
    }
  });

  // Create offer for a specific vendor (Admin)
  app.post("/api/admin/street-food/vendors/:id/offers", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = insertProviderOfferSchema.parse(req.body);
      
      const [newOffer] = await db.insert(providerOffers).values({
        ...data,
        providerId: id,
      }).returning();
      
      res.status(201).json(newOffer);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create offer" });
    }
  });

  // Update offer for a specific vendor (Admin)
  app.put("/api/admin/street-food/vendors/:id/offers/:offerId", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { offerId } = req.params;
      const data = req.body;
      
      const [updatedOffer] = await db.update(providerOffers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(providerOffers.id, offerId))
        .returning();
      
      if (!updatedOffer) return res.status(404).json({ message: "Offer not found" });
      res.json(updatedOffer);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update offer" });
    }
  });

  // Delete offer for a specific vendor (Admin)
  app.delete("/api/admin/street-food/vendors/:id/offers/:offerId", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { offerId } = req.params;
      await db.delete(providerOffers).where(eq(providerOffers.id, offerId));
      res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete offer" });
    }
  });

  // Search products for a vendor (Admin)
  app.get("/api/admin/street-food/vendors/:id/products/search", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { search, limit } = req.query;
      
      const results = await db.query.streetFoodItems.findMany({
        where: and(
          eq(streetFoodItems.providerId, id),
          ilike(streetFoodItems.name, `%${search || ''}%`)
        ),
        limit: limit ? parseInt(limit as string) : 10
      });
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to search products" });
    }
  });

  // Get product categories for a vendor (Admin)
  app.get("/api/admin/street-food/vendors/:id/products/categories", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const items = await db.select({ category: streetFoodItems.category })
        .from(streetFoodItems)
        .where(eq(streetFoodItems.providerId, id));
      
      const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch categories" });
    }
  });

  // Public: Check if services are open (for client banner)
  app.get("/api/platform-status", (_req: Request, res: Response) => {
    res.json({ servicesEnabled });
  });

  // Admin: Get platform status
  app.get("/api/admin/platform-status", isAdmin, (_req: AuthRequest, res: Response) => {
    res.json({ servicesEnabled });
  });

  // Admin: Toggle platform services
  app.put("/api/admin/platform-status", isAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { servicesEnabled: newStatus } = req.body;
      if (typeof newStatus !== 'boolean') {
        return res.status(400).json({ message: "servicesEnabled must be a boolean" });
      }

      // Update DB
      const existing = await db.query.appSettings.findFirst({
        where: eq(appSettings.key, 'services_enabled'),
      });

      if (existing) {
        await db.update(appSettings)
          .set({ value: String(newStatus), updatedAt: new Date() })
          .where(eq(appSettings.key, 'services_enabled'));
      } else {
        await db.insert(appSettings).values({
          key: 'services_enabled',
          value: String(newStatus),
        });
      }

      // Update in-memory flag
      servicesEnabled = newStatus;
      console.log(`🔄 Platform services toggled: ${newStatus ? 'OPEN ✅' : 'CLOSED 🔴'} by admin ${req.userId}`);

      res.json({ servicesEnabled, message: newStatus ? 'All services are now OPEN' : 'All services are now CLOSED' });
    } catch (error: any) {
      console.error("Toggle platform status error:", error);
      res.status(500).json({ message: error.message || "Error toggling platform status" });
    }
  });

  // =========================================
  // AUTO-SEED: Admin Account
  // =========================================
  (async () => {
    try {
      const adminUsername = "main_branch";
      let adminUser = await db.query.users.findFirst({
        where: eq(users.username, adminUsername)
      });
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash("shirur2seva", 10);
        [adminUser] = await db.insert(users).values({
          username: adminUsername,
          email: "admin@shirurexpress.com",
          password: hashedPassword,
          role: "admin",
        }).returning();
        console.log("✅ Admin account created: main_branch");
      } else if (adminUser.role !== "admin") {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, adminUser.id));
        console.log("✅ Admin role granted to: main_branch");
      } else {
        console.log("✅ Admin account ready: main_branch");
      }

      // Auto-seed Street Food Admin Account
      const streetfoodAdminUsername = "streetfood_admin";
      let streetfoodAdmin = await db.query.users.findFirst({
        where: eq(users.username, streetfoodAdminUsername)
      });
      if (!streetfoodAdmin) {
        const sfHashedPassword = await bcrypt.hash("street123", 10);
        [streetfoodAdmin] = await db.insert(users).values({
          username: streetfoodAdminUsername,
          email: "streetfood@shirurexpress.com",
          password: sfHashedPassword,
          role: "admin", // Using 'admin' role, but we will check username/specific permissions later if needed
        }).returning();
        console.log("✅ Streetfood Admin account created: streetfood_admin");
      } else if (streetfoodAdmin.role !== "admin") {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, streetfoodAdmin.id));
        console.log("✅ Admin role granted to: streetfood_admin");
      } else {
        console.log("✅ Streetfood Admin account ready: streetfood_admin");
      }
    } catch (e: any) {
      console.error("⚠️ Admin seed error:", e.message);
    }
  })();

  return httpServer;
}