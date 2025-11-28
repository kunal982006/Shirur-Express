// server/routes.ts (FIXED FOR DATE BUG)

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from './cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import { storage } from "./storage";
import {
  insertBookingSchema,
  insertGroceryOrderSchema,
  insertRentalPropertySchema,
  insertTableBookingSchema,
  insertServiceProviderSchema,
  insertInvoiceSchema, // NAYA IMPORT
  type InsertInvoice,
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


export async function registerRoutes(app: Express): Promise<Server> {

  // --- AUTHENTICATION ROUTES (No Change) ---
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password, role, phone } = req.body;
      if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Username, email, password, and role are required." });
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
      res.json(fullProfile);
    } catch (error: any) {
      console.error("Get provider profile error:", error);
      res.status(500).json({ message: error.message || "Error fetching provider profile" });
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
          razorpay_order_id,
          razorpay_signature
        );
        res.json({ status: "success", message: "Payment verified successfully!", invoice: updatedInvoice });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid payment signature" });
      }
    } catch (error: any) {
      console.error("Verify invoice payment error:", error);
      res.status(500).json({ message: error.message || "Error verifying payment" });
    }
  });

  // --- NEW RAZORPAY ENDPOINTS (MIGRATION) ---

  // Create Order
  app.post("/api/pay/create-order", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { invoiceId } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ message: "Invoice ID is required" });
      }

      const { razorpayOrderId, amount, currency, invoice } = await storage.createPaymentOrderForInvoice(invoiceId, userId);

      res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId,
        amount,
        currency,
        invoice,
      });
    } catch (error: any) {
      console.error("Create payment order error:", error);
      res.status(500).json({ message: error.message || "Error creating payment order" });
    }
  });

  // Verify Payment
  app.post("/api/pay/verify", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
        return res.status(400).json({ message: "Missing payment details for verification" });
      }

      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (isValid) {
        const updatedInvoice = await storage.verifyInvoicePayment(
          invoiceId,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature
        );
        res.json({ status: "success", message: "Payment verified successfully!", invoice: updatedInvoice });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid payment signature" });
      }
    } catch (error: any) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: error.message || "Error verifying payment" });
    }
  });


  // --- BAAKI ROUTES (Grocery, Restaurant, etc.) ---

  app.post("/api/grocery-orders", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const order = await storage.createGroceryOrder({ ...orderData, userId });
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Create grocery order error:", error);
      res.status(400).json({ message: error.message || "Error creating grocery order" });
    }
  });

  // (Grocery Payment)
  app.post("/api/payment/create-order", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      const order = await storage.getGroceryOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found or does not belong to user" });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ message: "This order has already been processed." });
      }
      const amountInPaise = Math.round(parseFloat(order.total) * 100);
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: order.id,
        notes: {
          databaseOrderId: order.id,
          userId: userId,
        }
      };
      const razorpayOrder = await razorpayInstance.orders.create(options);
      await storage.updateOrderWithRazorpayOrderId(order.id, razorpayOrder.id);
      res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    } catch (error: any) {
      console.error("Create Razorpay order error:", error);
      res.status(500).json({ message: error.message || "Error creating Razorpay order" });
    }
  });

  // (Grocery Payment Verify)
  app.post("/api/payment/verify-signature", async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, database_order_id } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !database_order_id) {
        return res.status(400).json({ message: "Missing payment details for verification" });
      }
      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (isValid) {
        await storage.verifyAndUpdateOrderPayment(
          database_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
        res.json({ status: "success", message: "Payment verified successfully", orderId: database_order_id });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid payment signature" });
      }
    } catch (error: any) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: error.message || "Error verifying payment" });
    }
  });

  app.post("/api/table-bookings", isLoggedIn, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const validatedData = insertTableBookingSchema.parse(req.body);
      const booking = await storage.createTableBooking({
        ...validatedData,
        userId,
        providerId: req.body.providerId,
      });
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Create table booking error:", error);
      res.status(400).json({ message: error.message || "Error creating table booking" });
    }
  });

  app.get("/api/street-food-items", async (req: Request, res: Response) => {
    try {
      const { search, providerId } = req.query;
      const items = await storage.getStreetFoodItems(providerId as string, search as string);
      res.json(items);
    } catch (error: any) {
      console.error("Get street food items error:", error);
      res.status(500).json({ message: error.message || "Error fetching street food items" });
    }
  });

  app.get("/api/restaurant-menu-items", async (req: Request, res: Response) => {
    try {
      const items = await storage.getRestaurantMenuItems();
      res.json(items);
    } catch (error: any) {
      console.error("Get restaurant menu items error:", error);
      res.status(500).json({ message: error.message || "Error fetching restaurant menu items" });
    }
  });

  app.get("/api/grocery-products", async (req: Request, res: Response) => {
    try {
      const { providerId, search } = req.query;
      if (!providerId) {
        return res.status(400).json({ message: "Provider ID is required" });
      }
      const products = await storage.getGroceryProducts(providerId as string, search as string);
      res.json(products);
    } catch (error: any) {
      console.error("Get grocery products error:", error);
      res.status(500).json({ message: error.message || "Error fetching grocery products" });
    }
  });

  // --- MENU MANAGEMENT ROUTES (No Change) ---
  app.post("/api/provider/menu-items/:categorySlug", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const categorySlug = req.params.categorySlug;
      const itemData = req.body;
      const newItem = await storage.createMenuItem(itemData, providerId, categorySlug);
      res.status(201).json(newItem);
    } catch (error: any) {
      console.error(`Error creating menu item in ${req.params.categorySlug}:`, error);
      res.status(400).json({ message: error.message || "Error creating menu item" });
    }
  });

  app.get("/api/provider/menu-items/:categorySlug", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const providerId = req.provider!.id;
      const categorySlug = req.params.categorySlug;
      const items = await storage.getProviderMenuItems(providerId, categorySlug);
      res.json(items);
    } catch (error: any) {
      console.error(`Error fetching menu items from ${req.params.categorySlug}:`, error);
      res.status(500).json({ message: error.message || "Error fetching menu items" });
    }
  });

  app.patch("/api/provider/menu-items/:categorySlug/:itemId", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const { categorySlug, itemId } = req.params;
      const providerId = req.provider!.id;
      const updates = req.body;
      const updatedItem = await storage.updateMenuItem(itemId, providerId, categorySlug, updates);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found or you don't have permission." });
      }
      res.json(updatedItem);
    } catch (error: any) {
      console.error(`Error updating menu item in ${req.params.categorySlug}:`, error);
      res.status(400).json({ message: error.message || "Error updating menu item" });
    }
  });

  app.delete("/api/provider/menu-items/:categorySlug/:itemId", isProvider, async (req: CustomRequest, res: Response) => {
    try {
      const { categorySlug, itemId } = req.params;
      const providerId = req.provider!.id;
      const deletedItem = await storage.deleteMenuItem(itemId, providerId, categorySlug);
      if (!deletedItem) {
        return res.status(404).json({ message: "Item not found or you don't have permission." });
      }
      res.json({ message: "Item deleted successfully", id: deletedItem.id });
    } catch (error: any) {
      console.error(`Error deleting menu item in ${req.params.categorySlug}:`, error);
      res.status(500).json({ message: error.message || "Error deleting menu item" });
    }
  });

  // --- Fallback Routes & Server Creation ---
  const httpServer = createServer(app);
  return httpServer;
}