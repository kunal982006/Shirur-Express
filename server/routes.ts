// server/routes.ts (FIXED FOR DATE BUG)

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from './cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  insertDeliveryPartnerSchema, // DELIVERY PARTNER IMPORT
  deliveryPartners, // DELIVERY PARTNER TABLE
  restaurantOrders, // FOR RIDER QUERIES
} from "@shared/schema";

import { razorpayInstance, verifyPaymentSignature } from "./razorpay-client";

// NAYA IMPORT: z for validation
import { z } from "zod";

import twilio from "twilio";
import { sendBookingNotification } from "./twilio-client";

let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

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
}
interface DeliveryPartnerRequest extends Request {
  userId?: string;
  deliveryPartner?: {
    id: string;
    userId: string;
    vehicleType: string;
    isOnline: boolean;
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

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // --- AUTHENTICATION ROUTES (No Change) ---

  console.log("Registering Grocery Routes..."); // DEBUG LOG
  app.post("/api/grocery-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const order = await storage.createGroceryOrder({ ...orderData, userId });
      console.log("Created Grocery Order:", order); // DEBUG LOG
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Create grocery order error:", error);
      res.status(400).json({ message: error.message || "Error creating grocery order" });
    }
  });

  console.log("Registering Street Food Routes..."); // DEBUG LOG
  app.post("/api/street-food-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      // Validate body
      const orderData = insertStreetFoodOrderSchema.parse(req.body);

      // Assign a static runner ID for MVP (e.g., "runner-1")
      const orderWithRunner = { ...orderData, runnerId: "runner-1" };

      const order = await storage.createStreetFoodOrder({ ...orderWithRunner, userId });
      console.log("Created Street Food Order:", order); // DEBUG LOG
      res.status(201).json(order);
    } catch (error: any) {
      // FIXED: Safe error logging to prevent crash
      console.error("Create street food order error:", error instanceof Error ? error.message : String(error));
      res.status(400).json({ message: error.message || "Error creating order" });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password, role, phone } = req.body;
      if (!username || !email || !password || !role || !phone) {
        return res.status(400).json({ message: "Username, email, password, role, and phone are required." });
      }
      const existingUser = await storage.getUserByUsername(username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username: username.toLowerCase(),
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
        return res.status(400).json({ message: "Username and password are required." });
      }
      const user = await storage.getUserByUsername(username.toLowerCase());
      if (!user) {
        await bcrypt.compare("dummyPassword", "$2b$10$abcdefghijklmnopqrstuv");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role || 'customer';
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
        res.status(500).json({ message: error.message || "Error uploading image" });
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
      res.status(500).json({ message: error.message || "Upload failed" });
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

  // --- GENERAL SERVICE ROUTES (No Change) ---
  app.get("/api/service-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getServiceCategories();
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
          beautyServices: { with: { template: true } },
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
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create booking error:", error);
      // Zod ka error message ab frontend ko dikhega
      res.status(400).json({ message: error.message || "Error creating booking" });
    }
  });
  // ----- FIX KHATAM -----

  // (Customer) Apni booking cancel karna
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
      if (booking.status !== 'pending') {
        return res.status(400).json({ message: `Aap '${booking.status}' booking ko cancel nahi kar sakte.` });
      }

      const cancelledBooking = await storage.updateBookingStatus(bookingId, "cancelled");
      res.json(cancelledBooking);

    } catch (error: any) {
      console.error("Cancel booking error:", error);
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
      const acceptedBooking = await storage.updateBookingStatus(bookingId, "accepted", providerId, estimatedCost);

      // --- SMS NOTIFICATION LOGIC ---
      try {
        // Explicitly check for user phone and provider name
        const userPhone = acceptedBooking.user?.phone;
        const providerName = acceptedBooking.provider?.businessName;
        const scheduledAt = acceptedBooking.scheduledAt;

        if (userPhone && providerName) {
          console.log(`[SMS] Sending SMS to ${userPhone} for status: accepted`);
          await sendBookingNotification(
            userPhone,
            "accepted",
            providerName,
            scheduledAt ? new Date(scheduledAt).toLocaleString("en-IN") : undefined
          );
        } else {
          console.warn(`[SMS Fail] SMS nahi bhej paaye: User phone (${userPhone}) ya provider name (${providerName}) missing.`);
        }
      } catch (smsError) {
        console.error("[SMS Error] SMS notification bhejte waqt error aaya:", smsError);
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

      // --- SMS NOTIFICATION LOGIC ---
      try {
        const userPhone = declinedBooking.user?.phone;
        const providerName = declinedBooking.provider?.businessName;

        if (userPhone && providerName) {
          console.log(`[SMS] Sending SMS to ${userPhone} for status: declined`);
          await sendBookingNotification(
            userPhone,
            "declined",
            providerName
          );
        } else {
          console.warn(`[SMS Fail] SMS nahi bhej paaye: User phone (${userPhone}) ya provider name (${providerName}) missing.`);
        }
      } catch (smsError) {
        console.error("[SMS Error] SMS notification bhejte waqt error aaya:", smsError);
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
      if (booking.status !== 'accepted') {
        return res.status(400).json({ message: "Job accept karne ke baad hi start kar sakte hain." });
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
          razorpay_order_id
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
        amount = Math.round(parseFloat(dbOrder.totalAmount) * 100);
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

  // --- RESTAURANT ORDERS ROUTES ---

  app.post("/api/restaurant/orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const orderData = insertRestaurantOrderSchema.parse(req.body);

      // Assign a static rider ID for MVP (e.g., "rider-1") if needed, or leave null
      // For now, let's leave riderId as null until a rider accepts it (if that's the flow)
      // Or if we want to auto-assign, we can do it here.
      // Let's keep it simple: created with status 'pending', no rider yet.

      const order = await storage.createRestaurantOrder({ ...orderData, userId });
      console.log("Created Restaurant Order:", order);
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

  // --- MENU MANAGEMENT ROUTES (GENERIC) ---

  // Get Menu Items
  app.get("/api/provider/menu-items/:categorySlug", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      // Provider ID is not in params, so we might need to fetch it based on logged in user
      // But wait, the frontend calls this without provider ID?
      // Ah, the frontend uses `useQuery` with `providerCategorySlug`.
      // But to fetch *my* items, I need to know *my* provider ID.
      // Let's check if the user is logged in.
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const provider = await storage.getProviderByUserId(req.session.userId);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      const items = await storage.getProviderMenuItems(provider.id, categorySlug);
      res.json(items);
    } catch (error: any) {
      console.error("Get menu items error:", error);
      res.status(500).json({ message: error.message || "Error fetching menu items" });
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

  // --- GROCERY PRODUCTS ROUTE (NEW) ---
  app.get("/api/grocery-products", async (req: Request, res: Response) => {
    try {
      const { providerId, search } = req.query;
      if (!providerId) {
        return res.status(400).json({ message: "Provider ID is required" });
      }

      const conditions = [eq(groceryProducts.providerId, providerId as string)];

      const products = await db.select().from(groceryProducts).where(
        and(...conditions)
      );

      if (search) {
        const s = (search as string).toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(s));
        return res.json(filtered);
      }

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

      // Fetch all products for this provider to extract metadata
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
      const validStatuses = ['accepted', 'preparing', 'ready_for_pickup', 'declined'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateProviderOrderStatus(orderId, providerId, status);
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

      const validStatuses = ['accepted', 'preparing', 'ready_for_pickup', 'declined'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateGroceryOrderStatusByProvider(orderId, providerId, status);
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
      } else {
        order = await storage.acceptOrderAsRider(orderId, riderId);
      }
      res.json({ message: "Order accepted!", order });
    } catch (error: any) {
      console.error("Accept order error:", error);
      res.status(400).json({ message: error.message || "Error accepting order" });
    }
  });

  // Mark Arrived at Pickup
  app.post("/api/rider/orders/:id/arrived-at-pickup", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;

      const order = await storage.updateOrderStatus(orderId, riderId, 'arrived_at_pickup');
      res.json({ message: "Marked as arrived at pickup", order });
    } catch (error: any) {
      console.error("Arrived at pickup error:", error);
      res.status(400).json({ message: error.message || "Error updating status" });
    }
  });

  // Mark Order Picked Up (generates OTP for delivery) - handles both order types
  app.post("/api/rider/orders/:id/picked-up", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;
      const { orderType } = req.body;

      let result;
      if (orderType === 'grocery') {
        result = await storage.markGroceryOrderPickedUp(orderId, riderId);
      } else {
        result = await storage.markOrderPickedUp(orderId, riderId);
      }
      res.json({ message: "Order picked up! OTP generated for delivery.", order: result.order, deliveryOtp: result.otp });
    } catch (error: any) {
      console.error("Pick up order error:", error);
      res.status(400).json({ message: error.message || "Error picking up order" });
    }
  });

  // Verify Delivery OTP and Complete - handles both order types
  app.post("/api/rider/orders/:id/verify-delivery", isDeliveryPartner, async (req: DeliveryPartnerRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const riderId = req.userId!;
      const { otp, orderType } = req.body;

      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }

      let order;
      if (orderType === 'grocery') {
        order = await storage.verifyGroceryDeliveryOtp(orderId, riderId, otp);
      } else {
        order = await storage.verifyDeliveryOtp(orderId, riderId, otp);
      }
      res.json({ message: "Delivery completed successfully!", order });
    } catch (error: any) {
      console.error("Verify delivery error:", error);
      res.status(400).json({ message: error.message || "Error verifying delivery" });
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

  return httpServer;
}