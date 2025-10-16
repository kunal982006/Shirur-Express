import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import bcrypt from "bcrypt";
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
  
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, role, phone } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || "customer",
        phone,
      });

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      // Don't send password back
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

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Provider profile creation
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
  
  // Service categories
  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Service providers
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

  // Service problems (for electrician/plumber)
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

  // Beauty services
  app.get("/api/beauty-services/:providerId", async (req, res) => {
    try {
      const services = await storage.getBeautyServices(req.params.providerId);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cake products
  app.get("/api/cake-products/:providerId", async (req, res) => {
    try {
      const products = await storage.getCakeProducts(req.params.providerId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Grocery products
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

  // Rental properties
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

  // Bookings
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const { userId } = req.body; // This would come from authentication

      const booking = await storage.createBooking({
        ...bookingData,
        userId,
      });

      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { status, providerId } = req.body;
      const booking = await storage.updateBookingStatus(
        req.params.id, 
        status, 
        providerId
      );

      // Send SMS notification to customer
      if (booking && booking.userPhone && (status === 'accepted' || status === 'declined')) {
        try {
          const { sendBookingNotification } = await import('./twilio-client.js');
          const providerName = booking.provider?.businessName || 'The service provider';
          const scheduledDate = booking.scheduledAt 
            ? new Date(booking.scheduledAt).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : undefined;

          await sendBookingNotification(
            booking.userPhone,
            status,
            providerName,
            scheduledDate
          );
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          // Don't fail the request if SMS fails
        }
      }

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

  // Call request system (with Twilio integration)
  app.post("/api/call-request", async (req, res) => {
    try {
      const { bookingId, providerId, customerPhone, providerPhone } = req.body;

      if (!twilioClient) {
        return res.status(503).json({ 
          message: "Call service not available. Twilio not configured." 
        });
      }

      // Create a conference call or TwiML application
      // This is a simplified version - in production you'd want more sophisticated call routing
      const call = await twilioClient.calls.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: providerPhone,
        url: `${req.protocol}://${req.get('host')}/api/call-webhook?bookingId=${bookingId}`,
        method: 'POST'
      });

      res.json({ callSid: call.sid, status: 'initiated' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Twilio webhook for call handling
  app.post("/api/call-webhook", async (req, res) => {
    const { bookingId } = req.query;
    
    // TwiML response to handle the call
    const twiml = `
      <Response>
        <Say voice="alice">You have a new service request. Press 1 to accept or 2 to decline.</Say>
        <Gather numDigits="1" action="/api/call-response?bookingId=${bookingId}" method="POST">
          <Say voice="alice">Please press a key.</Say>
        </Gather>
      </Response>
    `;
    
    res.type('text/xml');
    res.send(twiml);
  });

  app.post("/api/call-response", async (req, res) => {
    const { bookingId } = req.query;
    const { Digits } = req.body;

    try {
      if (Digits === '1') {
        await storage.updateBookingStatus(bookingId as string, 'accepted');
        res.type('text/xml');
        res.send('<Response><Say voice="alice">Thank you! The booking has been accepted.</Say></Response>');
      } else if (Digits === '2') {
        await storage.updateBookingStatus(bookingId as string, 'declined');
        res.type('text/xml');
        res.send('<Response><Say voice="alice">The booking has been declined.</Say></Response>');
      } else {
        res.type('text/xml');
        res.send('<Response><Say voice="alice">Invalid input. Goodbye.</Say></Response>');
      }
    } catch (error) {
      res.type('text/xml');
      res.send('<Response><Say voice="alice">An error occurred. Please try again.</Say></Response>');
    }
  });

  // Grocery order and payment
  app.post("/api/grocery-orders", async (req, res) => {
    try {
      const orderData = insertGroceryOrderSchema.parse(req.body);
      const { userId } = req.body;

      const order = await storage.createGroceryOrder({
        ...orderData,
        userId,
      });

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe payment intent for grocery orders
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment service not configured. Please add Stripe API keys." 
        });
      }

      const { amount, orderId, currency = 'inr' } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paisa for INR
        currency,
        metadata: {
          orderId: orderId || '',
        },
      });

      // Update order with payment intent ID if orderId provided
      if (orderId) {
        await storage.updateOrderPaymentId(orderId, paymentIntent.id);
      }

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Reviews
  app.post("/api/reviews", async (req, res) => {
    try {
      const { userId, providerId, bookingId, rating, comment } = req.body;
      
      const review = await storage.createReview({
        userId,
        providerId,
        bookingId,
        rating: parseInt(rating),
        comment,
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

  // Street food items
  app.get("/api/street-food-items", async (req, res) => {
    try {
      const { providerId } = req.query;
      const items = await storage.getStreetFoodItems(providerId as string);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Restaurant menu items
  app.get("/api/restaurant-menu-items", async (req, res) => {
    try {
      const { providerId } = req.query;
      const items = await storage.getRestaurantMenuItems(providerId as string);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Table bookings
  app.post("/api/table-bookings", async (req, res) => {
    try {
      const validatedData = insertTableBookingSchema.parse(req.body);
      const booking = await storage.createTableBooking({
        ...validatedData,
        userId: req.body.userId || "user-1", // TODO: Get from auth session
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
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
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

  const httpServer = createServer(app);
  return httpServer;
}
