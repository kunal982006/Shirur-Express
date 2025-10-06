import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertBookingSchema, 
  insertGroceryOrderSchema, 
  insertRentalPropertySchema,
  insertUserSchema 
} from "@shared/schema";

// Initialize Stripe (only if API key is available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
  });
}

// Twilio for call routing (if available)
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
