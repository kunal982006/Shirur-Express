// server/storage.ts (UPDATED FOR ELECTRICIAN FLOW)

import {
  users,
  serviceProviders,
  serviceCategories,
  serviceProblems,
  cakeProducts,
  groceryProducts,
  rentalProperties,
  bookings,
  groceryOrders,
  reviews,
  streetFoodItems,
  restaurantMenuItems,

  invoices, // NAYA IMPORT
  type User,
  type InsertUser,
  type ServiceProvider,
  type InsertServiceProvider,
  type Booking,
  type InsertBooking,
  type GroceryOrder,
  type InsertGroceryOrder,
  type RentalProperty,
  type InsertRentalProperty,
  type ServiceCategory,
  type ServiceProblem,
  type CakeProduct,
  type GroceryProduct,
  type Review,
  type StreetFoodItem,
  type InsertStreetFoodItem,
  type RestaurantMenuItem,

  type Invoice,
  type InsertInvoice, // NAYE TYPES
  serviceTemplates,
  type ServiceTemplate,
  type InsertServiceTemplate,
  serviceOfferings,
  type ServiceOffering,
  type InsertServiceOffering,
  insertServiceOfferingSchema,
  streetFoodOrders,
  type StreetFoodOrder,
  type InsertStreetFoodOrder,
  restaurantOrders,
  type RestaurantOrder,
  type InsertRestaurantOrder,
  // DELIVERY PARTNER IMPORTS
  deliveryPartners,
  type DeliveryPartner,
  type InsertDeliveryPartner,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, gt, lt, gte, lte } from "drizzle-orm";
// NAYE IMPORTS
import { sendOtpNotification } from "./twilio-client";
import { razorpayInstance } from "./razorpay-client";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(
    userId: string,
    info: { customerId: string; subscriptionId: string },
  ): Promise<User>;
  // Service provider operations
  getServiceProviders(
    categorySlug?: string,
    latitude?: number,
    longitude?: number,
    radius?: number,
  ): Promise<(ServiceProvider & { user: User; category: ServiceCategory })[]>;
  getServiceProvider(id: string): Promise<
    | (ServiceProvider & {
      user: User;
      category: ServiceCategory;
      galleryImages?: string[];
    })
    | undefined
  >;
  getProviderByUserId(userId: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(
    provider: InsertServiceProvider & { userId: string; categoryId: string },
  ): Promise<ServiceProvider>;
  updateServiceProvider(
    providerId: string,
    updates: Partial<
      InsertServiceProvider & {
        profileImageUrl?: string;
        galleryImages?: string[];
      }
    >,
  ): Promise<ServiceProvider | undefined>;
  updateProviderRating(
    providerId: string,
    newRating: number,
    reviewCount: number,
  ): Promise<ServiceProvider>;
  // Service categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(slug: string): Promise<ServiceCategory | undefined>;
  // Service problems
  getServiceProblems(
    categoryId: string,
    parentId?: string,
  ): Promise<ServiceProblem[]>;
  // Other services...
  getServiceTemplates(categorySlug: string): Promise<ServiceTemplate[]>;
  bulkUpdateServiceOfferings(
    providerId: string,
    offerings: InsertServiceOffering[]
  ): Promise<ServiceOffering[]>;
  getServiceOfferings(providerId: string): Promise<ServiceOffering[]>;

  getCakeProducts(providerId: string): Promise<CakeProduct[]>;
  getGroceryProducts(
    providerId?: string,
    search?: string,
  ): Promise<GroceryProduct[]>;
  getGroceryProduct(id: string): Promise<GroceryProduct | undefined>;
  getRentalProperties(
    filters: any,
  ): Promise<(RentalProperty & { owner: User })[]>;
  getProviderRentalProperties(ownerId: string): Promise<RentalProperty[]>;
  getRentalProperty(
    id: string,
  ): Promise<(RentalProperty & { owner: User }) | undefined>;
  createRentalProperty(
    property: InsertRentalProperty & { ownerId: string },
  ): Promise<RentalProperty>;
  updateRentalProperty(
    id: string,
    updates: Partial<InsertRentalProperty> & { status?: string },
  ): Promise<RentalProperty | undefined>;
  deleteRentalProperty(id: string): Promise<void>;
  auditRentalProperties(): Promise<RentalProperty[]>;

  // Bookings (UPDATED INTERFACE)
  createBooking(
    booking: InsertBooking & { userId: string; providerId?: string },
  ): Promise<Booking>;
  getBooking(
    id: string,
  ): Promise<
    | (Booking & { user: User; provider?: ServiceProvider; invoice?: Invoice })
    | undefined
  >; // Updated
  updateBookingStatus(
    id: string,
    status: string,
    providerId?: string,
  ): Promise<Booking & { provider?: ServiceProvider; user: User }>; // Updated
  getUserBookings(
    userId: string,
  ): Promise<(Booking & { provider?: ServiceProvider; invoice?: Invoice })[]>; // Updated
  getProviderBookings(
    providerId: string,
  ): Promise<(Booking & { user: User; invoice?: Invoice })[]>; // Updated

  // --- NAYE BOOKING FUNCTIONS ---
  generateOtpForBooking(
    bookingId: string,
    providerId: string,
  ): Promise<{ otp: string; userPhone: string }>;
  verifyBookingOtp(
    bookingId: string,
    providerId: string,
    otp: string,
  ): Promise<Booking>;
  createInvoiceForBooking(data: InsertInvoice): Promise<Invoice>;

  // --- NAYE INVOICE/PAYMENT FUNCTIONS ---
  getInvoice(id: string): Promise<Invoice | undefined>;
  createPaymentOrderForInvoice(
    invoiceId: string,
    userId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    invoice: Invoice;
  }>;
  verifyInvoicePayment(
    invoiceId: string,
    rzpPaymentId: string,
    rzpOrderId: string,
    rzpSignature: string,
  ): Promise<Invoice>;

  // Orders
  createGroceryOrder(
    order: InsertGroceryOrder & { userId: string },
  ): Promise<GroceryOrder>;
  getGroceryOrder(id: string): Promise<GroceryOrder | undefined>;
  updateOrderPaymentId(
    orderId: string,
    paymentIntentId: string,
  ): Promise<GroceryOrder>;
  updateOrderWithRazorpayOrderId(
    orderId: string,
    razorpayOrderId: string,
    orderType?: 'grocery' | 'street_food' | 'restaurant',
  ): Promise<GroceryOrder | StreetFoodOrder | RestaurantOrder | undefined>;

  updateGroceryOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<GroceryOrder>;
  updateStreetFoodOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<StreetFoodOrder>;
  updateRestaurantOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<RestaurantOrder>;
  updateGroceryOrderStatus(id: string, status: string, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<GroceryOrder>;
  verifyAndUpdateOrderPayment(
    orderId: string,
    rzpPaymentId: string,
    rzpSignature: string,
    orderType?: 'grocery' | 'street_food' | 'restaurant',
  ): Promise<GroceryOrder | StreetFoodOrder | RestaurantOrder | undefined>;

  // Reviews
  createReview(review: {
    userId: string;
    providerId: string;
    bookingId?: string;
    rating: number;
    comment?: string;
  }): Promise<Review>;
  getProviderReviews(providerId: string): Promise<(Review & { user: User })[]>;
  // Menu items
  getStreetFoodItems(
    providerId?: string,
    search?: string,
  ): Promise<StreetFoodItem[]>;
  getRestaurantMenuItems(providerId?: string): Promise<RestaurantMenuItem[]>;
  // Table bookings
  // Restaurant Orders
  createRestaurantOrder(order: InsertRestaurantOrder & { userId: string }): Promise<RestaurantOrder>;
  getRestaurantOrder(id: string): Promise<RestaurantOrder | undefined>;
  getRestaurantOrders(providerId: string): Promise<RestaurantOrder[]>;
  getRiderOrders(riderId?: string): Promise<RestaurantOrder[]>;
  updateRestaurantOrderStatus(id: string, status: string, riderId?: string | null, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<RestaurantOrder>;
  // Menu Management
  createMenuItem(
    itemData: any,
    providerId: string,
    categorySlug: string,
  ): Promise<any>;
  updateMenuItem(
    itemId: string,
    providerId: string,
    categorySlug: string,
    updates: any,
  ): Promise<any | null>;
  deleteMenuItem(
    itemId: string,
    providerId: string,
    categorySlug: string,
  ): Promise<{ id: string } | null>;
  getProviderMenuItems(
    providerId: string,
    categorySlug: string,
  ): Promise<any[]>;

  // Street Food Orders
  createStreetFoodOrder(order: InsertStreetFoodOrder & { userId: string }): Promise<StreetFoodOrder>;
  getStreetFoodOrder(id: string): Promise<StreetFoodOrder | undefined>;
  getRunnerOrders(runnerId?: string): Promise<StreetFoodOrder[]>;
  updateStreetFoodOrderStatus(id: string, status: string, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<StreetFoodOrder>;
  createStreetFoodVendor(vendor: InsertServiceProvider & { userId: string; categoryId: string }): Promise<ServiceProvider>;
  deleteStreetFoodVendor(id: string): Promise<void>;
  createStreetFoodItem(item: InsertStreetFoodItem): Promise<StreetFoodItem>;
  deleteStreetFoodItem(id: string): Promise<void>;
  updateStreetFoodItem(id: string, updates: Partial<InsertStreetFoodItem>): Promise<StreetFoodItem | undefined>;

  // Grocery Order Methods
  getGroceryOrdersByUser(userId: string): Promise<GroceryOrder[]>;
  getGroceryOrdersByProvider(providerId: string): Promise<GroceryOrder[]>;
  updateGroceryOrderStatusByProvider(orderId: string, providerId: string, status: string): Promise<GroceryOrder>;

  // Delivery Partner Operations
  getDeliveryPartnerByUserId(userId: string): Promise<DeliveryPartner | undefined>;
  createDeliveryPartner(partner: InsertDeliveryPartner & { userId: string }): Promise<DeliveryPartner>;
  updateDeliveryPartnerStatus(partnerId: string, isOnline: boolean): Promise<DeliveryPartner>;
  updateDeliveryPartnerLocation(partnerId: string, latitude: string, longitude: string): Promise<DeliveryPartner>;

  // Rider Order Operations (supports both restaurant and grocery orders)
  getAllAvailableOrdersForRider(): Promise<any[]>; // Returns combined orders
  getAllRiderOrders(riderId: string): Promise<any[]>; // Returns rider's orders from all types
  getAvailableOrdersForRider(): Promise<RestaurantOrder[]>;
  getRiderOrders(riderId: string): Promise<RestaurantOrder[]>;
  getAvailableGroceryOrdersForRider(): Promise<GroceryOrder[]>;
  getRiderGroceryOrders(riderId: string): Promise<GroceryOrder[]>;
  getRestaurantOrdersByUserId(userId: string): Promise<RestaurantOrder[]>;
  getRestaurantOrdersByProviderId(providerId: string): Promise<RestaurantOrder[]>;
  updateProviderOrderStatus(orderId: string, providerId: string, status: string): Promise<RestaurantOrder>;
  acceptOrderAsRider(orderId: string, riderId: string): Promise<RestaurantOrder>;
  acceptGroceryOrderAsRider(orderId: string, riderId: string): Promise<GroceryOrder>;
  updateOrderStatus(orderId: string, riderId: string, status: string): Promise<RestaurantOrder>;
  updateGroceryOrderStatusByRider(orderId: string, riderId: string, status: string): Promise<GroceryOrder>;
  markOrderPickedUp(orderId: string, riderId: string): Promise<{ order: RestaurantOrder; otp: string }>;
  markGroceryOrderPickedUp(orderId: string, riderId: string): Promise<{ order: GroceryOrder; otp: string }>;
  verifyDeliveryOtp(orderId: string, riderId: string, otp: string): Promise<RestaurantOrder>;
  verifyGroceryDeliveryOtp(orderId: string, riderId: string, otp: string): Promise<GroceryOrder>;
  getOrderTrackingInfo(orderId: string, userId: string): Promise<any>;
  markOrderReadyForPickup(orderId: string, providerId: string): Promise<RestaurantOrder>;
}

export class DatabaseStorage implements IStorage {
  // ... existing methods ...
  // ... I need to be careful with replace_file_content not to delete the whole class.
  // The interface update is lines ~266.
  // The implementation update is lines ~1281.
  // I will do two separate Replace calls or one MULTI replace.

  updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    throw new Error("Method not implemented.");
  }
  updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string; }): Promise<User> {
    throw new Error("Method not implemented.");
  }
  // --- User Operations (No Change) ---
  async getUser(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    return updatedUser;
  }



  // --- Service Provider Operations (No Change) ---
  async getServiceProviders(
    categorySlug?: string,
    latitude?: number,
    longitude?: number,
    radius?: number,
  ) {
    const conditions = [];
    if (categorySlug) {
      const category = await this.getServiceCategory(categorySlug);
      if (category) {
        conditions.push(eq(serviceProviders.categoryId, category.id));
      } else {
        return [];
      }
    }

    const withRelations: any = { user: true, category: true };
    if (categorySlug === "cake-shop") {
      withRelations.cakeProducts = true;
    }

    const results = await db.query.serviceProviders.findMany({
      where: and(...conditions),
      with: withRelations,
      orderBy: [desc(serviceProviders.rating)],
    });

    return results as any;
  }

  async getServiceProvider(id: string) {
    const result = await db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.id, id),
      with: {
        category: true,
        beautyServices: { with: { template: true } },
        cakeProducts: true,
        streetFoodItems: true,
        restaurantMenuItems: true,
      },
    });

    // Safety check
    if (result && !result.beautyServices) {
      (result as any).beautyServices = [];
    }



    return result as any;
  }

  async getProviderByUserId(
    userId: string,
  ): Promise<ServiceProvider | undefined> {
    return db.query.serviceProviders.findFirst({
      where: eq(serviceProviders.userId, userId),
    });
  }

  async createServiceProvider(
    provider: InsertServiceProvider & { userId: string; categoryId: string },
  ): Promise<ServiceProvider> {
    const providerToInsert = {
      businessName: provider.businessName,
      description: provider.description,
      experience: provider.experience,
      address: provider.address,
      latitude: provider.latitude,
      longitude: provider.longitude,
      specializations: provider.specializations,
      userId: provider.userId,
      categoryId: provider.categoryId,
    };
    const [newProvider] = await db
      .insert(serviceProviders)
      .values(providerToInsert)
      .returning();
    return newProvider;
  }

  async updateServiceProvider(
    providerId: string,
    updates: Partial<
      InsertServiceProvider & {
        profileImageUrl?: string;
        galleryImages?: string[];
      }
    >,
  ): Promise<ServiceProvider | undefined> {
    const [updatedProvider] = await db
      .update(serviceProviders)
      .set(updates)
      .where(eq(serviceProviders.id, providerId))
      .returning();
    return updatedProvider;
  }

  async updateProviderRating(
    providerId: string,
    newRating: number,
    reviewCount: number,
  ): Promise<ServiceProvider> {
    const [provider] = await db
      .update(serviceProviders)
      .set({ rating: newRating.toFixed(2), reviewCount })
      .where(eq(serviceProviders.id, providerId))
      .returning();
    return provider;
  }

  // --- Other Functions ---

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return db.query.serviceCategories.findMany();
  }

  async getServiceCategory(slug: string): Promise<ServiceCategory | undefined> {
    return db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.slug, slug),
    });
  }

  async getServiceProblems(
    categoryId: string,
    parentId?: string,
  ): Promise<ServiceProblem[]> {
    const conditions = [eq(serviceProblems.categoryId, categoryId)];
    parentId
      ? conditions.push(eq(serviceProblems.parentId, parentId))
      : conditions.push(sql`${serviceProblems.parentId} IS NULL`);
    return db
      .select()
      .from(serviceProblems)
      .where(and(...conditions));
  }

  // --- BOOKING FUNCTIONS (UPDATED) ---

  async createBooking(
    booking: InsertBooking & { userId: string; providerId?: string },
  ): Promise<Booking> {
    const bookingToInsert = {
      serviceType: booking.serviceType,
      problemId: booking.problemId,
      scheduledAt: booking.scheduledAt,
      preferredTimeSlots: booking.preferredTimeSlots,
      userAddress: booking.userAddress,
      userPhone: booking.userPhone,
      notes: booking.notes,
      userId: booking.userId,
      providerId: booking.providerId,
      isUrgent: booking.isUrgent, // NAYA FIELD
    };
    const [newBooking] = await db
      .insert(bookings)
      .values(bookingToInsert)
      .returning();

    // Yahaan pe aap 20 minute waala auto-decline logic laga sakte ho
    // Abhi ke liye, hum usko skip kar rahe hain aur manual flow pe focus kar rahe hain
    if (booking.isUrgent) {
      // TODO: 20 minute auto-decline timer set karo
      console.log(
        `[Urgent Booking] ${newBooking.id} create hui. Timer start karna hai.`,
      );
    }

    return newBooking;
  }

  async getBooking(id: string) {
    return db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        user: true,
        provider: { with: { user: true, category: true } },
        invoice: true, // NAYA: Invoice bhi fetch karo
      },
    }) as any;
  }

  async updateBookingStatus(
    id: string,
    status: string,
    providerId?: string,
    estimatedCost?: string,
  ): Promise<Booking & { provider?: ServiceProvider; user: User }> {
    const updateData: any = { status };
    if (providerId) {
      updateData.providerId = providerId;
    }
    if (estimatedCost) {
      updateData.estimatedCost = estimatedCost;
    }

    await db.update(bookings).set(updateData).where(eq(bookings.id, id));

    const updatedBooking = (await this.getBooking(id)) as any;

    if (!updatedBooking) {
      console.warn(`[SMS Fail] Update ke baad booking ${id} nahi mili.`);
      return updatedBooking;
    }

    // SMS notification logic moved to routes.ts
    return updatedBooking;
  }

  async getUserBookings(userId: string) {
    return db.query.bookings.findMany({
      where: eq(bookings.userId, userId),
      with: {
        provider: { with: { user: true, category: true } },
        invoice: true, // NAYA
      },
      orderBy: [desc(bookings.createdAt)],
    }) as any;
  }

  async getProviderBookings(providerId: string) {
    return db.query.bookings.findMany({
      where: eq(bookings.providerId, providerId),
      with: {
        user: true,
        invoice: true, // NAYA
      },
      orderBy: [desc(bookings.createdAt)],
    }) as any;
  }

  // --- NAYE FUNCTIONS ELECTRICIAN FLOW KE LIYE ---

  /**
   * Job complete hone par OTP generate karta hai aur customer ko bhejta hai
   */
  async generateOtpForBooking(
    bookingId: string,
    providerId: string,
  ): Promise<{ otp: string; userPhone: string }> {
    const booking = await this.getBooking(bookingId);
    console.log("Booking mila:", booking);
    if (!booking || booking.providerId !== providerId) {
      throw new Error("Booking not found or access denied");
    }
    if (booking.status !== "in_progress" && booking.status !== "awaiting_otp") {
      throw new Error(
        `Cannot generate OTP for booking with status: ${booking.status}`,
      );
    }
    if (!booking.userPhone) {
      throw new Error("Customer phone number is not available to send OTP");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute expiry

    await db
      .update(bookings)
      .set({
        serviceOtp: otp,
        serviceOtpExpiresAt: otpExpiresAt,
        status: "awaiting_otp",
      })
      .where(eq(bookings.id, bookingId));

    // Customer ko OTP Bhejo
    await sendOtpNotification(booking.userPhone, otp);

    return { otp, userPhone: booking.userPhone };
  }

  /**
   * Provider dwara enter kiye gaye OTP ko verify karta hai
   */
  async verifyBookingOtp(
    bookingId: string,
    providerId: string,
    otp: string,
  ): Promise<Booking> {
    const booking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.id, bookingId),
        eq(bookings.providerId, providerId),
      ),
    });

    if (!booking) {
      throw new Error("Booking not found or access denied");
    }
    if (booking.status !== "awaiting_otp") {
      throw new Error("Booking is not awaiting OTP verification");
    }
    if (booking.serviceOtp !== otp) {
      throw new Error("Invalid OTP");
    }
    if (
      !booking.serviceOtpExpiresAt ||
      new Date() > new Date(booking.serviceOtpExpiresAt)
    ) {
      throw new Error("OTP has expired");
    }

    // OTP Sahi hai!
    // Check if we can auto-create invoice based on estimatedCost
    if (booking.estimatedCost) {
      console.log(`[Auto-Invoice] Creating invoice for booking ${bookingId} with amount ${booking.estimatedCost}`);

      const invoiceData: InsertInvoice = {
        bookingId: booking.id,
        providerId: booking.providerId!,
        userId: booking.userId,
        sparePartsDetails: [],
        sparePartsTotal: "0",
        serviceCharge: booking.estimatedCost,
        totalAmount: booking.estimatedCost,
      };

      // 1. Invoice create karo
      const [newInvoice] = await db.insert(invoices).values(invoiceData).returning();

      // 2. Booking ko update karo (status: pending_payment)
      const [updatedBooking] = await db
        .update(bookings)
        .set({
          status: "pending_payment",
          serviceOtp: null,
          serviceOtpExpiresAt: null,
          invoiceId: newInvoice.id,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      return updatedBooking;
    } else {
      // No estimated cost, fall back to manual billing (status: awaiting_billing)
      const [updatedBooking] = await db
        .update(bookings)
        .set({
          status: "awaiting_billing",
          serviceOtp: null, // OTP use ho gaya, clear kar do
          serviceOtpExpiresAt: null,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      return updatedBooking;
    }
  }

  /**
   * OTP verify hone ke baad final bill banata hai
   */
  async createInvoiceForBooking(data: InsertInvoice): Promise<Invoice> {
    // 1. Invoice create karo
    const [newInvoice] = await db.insert(invoices).values(data).returning();

    // 2. Booking ko update karo
    await db
      .update(bookings)
      .set({
        status: "pending_payment",
        invoiceId: newInvoice.id,
      })
      .where(eq(bookings.id, data.bookingId));

    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  }

  /**
   * Customer ke liye Bill/Invoice ka Razorpay payment order banata hai
   */
  async createPaymentOrderForInvoice(
    invoiceId: string,
    userId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    invoice: Invoice;
  }> {
    const invoice = await this.getInvoice(invoiceId);

    if (!invoice || invoice.userId !== userId) {
      throw new Error("Invoice not found or access denied");
    }
    if (invoice.paymentStatus === "completed") {
      throw new Error("This invoice has already been paid");
    }

    const amountInPaise = Math.round(parseFloat(invoice.totalAmount) * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: invoice.id,
      notes: {
        databaseInvoiceId: invoice.id,
        bookingId: invoice.bookingId,
        userId: userId,
      },
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Razorpay Order ID ko invoice table me save karo
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ razorpayOrderId: razorpayOrder.id })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency,
      invoice: updatedInvoice,
    };
  }

  /**
   * Invoice payment ko verify aur complete karta hai
   */
  async verifyInvoicePayment(
    invoiceId: string,
    rzpPaymentId: string,
    rzpOrderId: string,
    rzpSignature: string,
  ): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    // (Yahaan `verifyPaymentSignature` helper function use hona chahiye, jo routes.ts me hai)
    // Hum maan rahe hain ki yeh route me verify ho chuka hai.

    // 1. Invoice update karo
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        paymentStatus: "completed",
        razorpayPaymentId: rzpPaymentId,
      })
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.razorpayOrderId, rzpOrderId),
        ),
      )
      .returning();

    if (!updatedInvoice) {
      throw new Error("Invoice not found or Razorpay Order ID mismatch");
    }

    // 2. Booking ko 'completed' mark karo
    await db
      .update(bookings)
      .set({ status: "completed" })
      .where(eq(bookings.id, updatedInvoice.bookingId));

    return updatedInvoice;
  }

  // --- BAAKI FUNCTIONS (Grocery, Rental, etc. No Change) ---

  async createGroceryOrder(
    order: InsertGroceryOrder & { userId: string },
  ): Promise<GroceryOrder> {
    const orderToInsert = {
      items: order.items,
      subtotal: order.subtotal,
      platformFee: order.platformFee,
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryAddress: order.deliveryAddress,
      userId: order.userId,
      providerId: order.providerId, // NAYA FIELD
    };
    const [newOrder] = await db
      .insert(groceryOrders)
      .values(orderToInsert)
      .returning();
    return newOrder;
  }

  async updateOrderPaymentId(
    orderId: string,
    paymentIntentId: string,
  ): Promise<GroceryOrder> {
    const [order] = await db
      .update(groceryOrders)
      .set({ razorpayOrderId: paymentIntentId })
      .where(eq(groceryOrders.id, orderId))
      .returning();
    return order;
  }

  async updateOrderWithRazorpayOrderId(
    orderId: string,
    razorpayOrderId: string,
    orderType: 'grocery' | 'street_food' | 'restaurant' = 'grocery',
  ): Promise<GroceryOrder | StreetFoodOrder | RestaurantOrder | undefined> {
    if (orderType === 'street_food') {
      const [order] = await db
        .update(streetFoodOrders)
        .set({ razorpayOrderId: razorpayOrderId })
        .where(eq(streetFoodOrders.id, orderId))
        .returning();
      return order;
    } else if (orderType === 'restaurant') {
      const [order] = await db
        .update(restaurantOrders)
        .set({ razorpayOrderId: razorpayOrderId })
        .where(eq(restaurantOrders.id, orderId))
        .returning();
      return order;
    } else {
      const [order] = await db
        .update(groceryOrders)
        .set({ razorpayOrderId: razorpayOrderId })
        .where(eq(groceryOrders.id, orderId))
        .returning();
      return order;
    }
  }

  async updateGroceryOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<GroceryOrder> {
    const [order] = await db
      .update(groceryOrders)
      .set({ razorpayOrderId: razorpayOrderId })
      .where(eq(groceryOrders.id, orderId))
      .returning();
    return order;
  }

  async updateStreetFoodOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<StreetFoodOrder> {
    const [order] = await db
      .update(streetFoodOrders)
      .set({ razorpayOrderId: razorpayOrderId })
      .where(eq(streetFoodOrders.id, orderId))
      .returning();
    return order;
  }

  async updateRestaurantOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<RestaurantOrder> {
    const [order] = await db
      .update(restaurantOrders)
      .set({ razorpayOrderId: razorpayOrderId })
      .where(eq(restaurantOrders.id, orderId))
      .returning();
    return order;
  }

  async updateGroceryOrderStatus(id: string, status: string, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<GroceryOrder> {
    const updates: any = { status };
    if (razorpayPaymentId) updates.razorpayPaymentId = razorpayPaymentId;

    const [order] = await db
      .update(groceryOrders)
      .set(updates)
      .where(eq(groceryOrders.id, id))
      .returning();
    return order;
  }

  async verifyAndUpdateOrderPayment(
    orderId: string,
    rzpPaymentId: string,
    rzpSignature: string,
    orderType: 'grocery' | 'street_food' | 'restaurant' = 'grocery',
  ): Promise<GroceryOrder | StreetFoodOrder | RestaurantOrder | undefined> {
    if (orderType === 'street_food') {
      const [order] = await db
        .update(streetFoodOrders)
        .set({
          razorpayPaymentId: rzpPaymentId,
          // razorpaySignature: rzpSignature,
          status: "confirmed", // or "paid"
        })
        .where(eq(streetFoodOrders.id, orderId))
        .returning();
      return order;
    } else if (orderType === 'restaurant') {
      const [order] = await db
        .update(restaurantOrders)
        .set({
          razorpayPaymentId: rzpPaymentId,
          status: "accepted", // Auto-accept upon payment (Direct Payment flow)
        })
        .where(eq(restaurantOrders.id, orderId))
        .returning();
      return order;
    } else {
      const [order] = await db
        .update(groceryOrders)
        .set({
          razorpayPaymentId: rzpPaymentId,
          razorpaySignature: rzpSignature,
          status: "confirmed",
        })
        .where(eq(groceryOrders.id, orderId))
        .returning();
      return order;
    }
  }

  async getGroceryOrdersByUser(userId: string): Promise<GroceryOrder[]> {
    return db.query.groceryOrders.findMany({
      where: eq(groceryOrders.userId, userId),
      orderBy: (groceryOrders, { desc }) => [desc(groceryOrders.createdAt)],
    });
  }

  async getGroceryOrdersByProvider(providerId: string): Promise<GroceryOrder[]> {
    return db.query.groceryOrders.findMany({
      where: eq(groceryOrders.providerId, providerId),
      orderBy: (groceryOrders, { desc }) => [desc(groceryOrders.createdAt)],
    });
  }

  async createRentalProperty(
    property: InsertRentalProperty & { ownerId: string },
  ): Promise<RentalProperty> {
    const propertyToInsert = {
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      rent: property.rent,
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      furnishing: property.furnishing,
      address: property.address,
      locality: property.locality,
      latitude: property.latitude,
      longitude: property.longitude,
      amenities: property.amenities,
      images: property.images,
      ownerId: property.ownerId,
      // New fields
      deposit: property.deposit,
      noticePeriod: property.noticePeriod,
      status: property.status || 'available',
      ownerNote: property.ownerNote,
      contactPhone: property.contactPhone,
      contactEmail: property.contactEmail,
    };
    const [newProperty] = await db
      .insert(rentalProperties)
      .values(propertyToInsert)
      .returning();
    return newProperty;
  }

  async updateRentalProperty(
    id: string,
    updates: Partial<InsertRentalProperty> & { status?: string },
  ): Promise<RentalProperty | undefined> {
    const [updatedProperty] = await db
      .update(rentalProperties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rentalProperties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteRentalProperty(id: string): Promise<void> {
    await db.delete(rentalProperties).where(eq(rentalProperties.id, id));
  }

  async auditRentalProperties(): Promise<RentalProperty[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return db.query.rentalProperties.findMany({
      where: and(
        lt(rentalProperties.updatedAt, ninetyDaysAgo),
        eq(rentalProperties.status, 'available')
      )
    });
  }

  async getServiceTemplates(categorySlug: string): Promise<ServiceTemplate[]> {
    return db.query.serviceTemplates.findMany({
      where: eq(serviceTemplates.categorySlug, categorySlug),
    });
  }

  async bulkUpdateServiceOfferings(
    providerId: string,
    offerings: InsertServiceOffering[]
  ): Promise<ServiceOffering[]> {
    // 1. Delete existing offerings for this provider
    await db.delete(serviceOfferings).where(eq(serviceOfferings.providerId, providerId));

    if (offerings.length === 0) {
      return [];
    }

    // 2. Insert new offerings
    const offeringsToInsert = offerings.map((s) => ({
      ...s,
      providerId,
    }));

    const insertedOfferings = await db
      .insert(serviceOfferings)
      .values(offeringsToInsert)
      .returning();

    return insertedOfferings;
  }

  async getServiceOfferings(providerId: string): Promise<ServiceOffering[]> {
    return db.query.serviceOfferings.findMany({
      where: eq(serviceOfferings.providerId, providerId),
    });
  }


  async getCakeProducts(providerId: string): Promise<CakeProduct[]> {
    return db.query.cakeProducts.findMany({
      where: eq(cakeProducts.providerId, providerId),
    });
  }

  async getGroceryProducts(
    providerId?: string,
    search?: string,
  ): Promise<GroceryProduct[]> {
    const conditions = [eq(groceryProducts.inStock, true)];
    if (providerId) {
      conditions.push(eq(groceryProducts.providerId, providerId));
    }
    if (search) {
      conditions.push(sql`${groceryProducts.name} ILIKE ${`%${search}%`}`);
    }
    if (!providerId) {
      return [];
    }
    return db
      .select()
      .from(groceryProducts)
      .where(and(...conditions))
      .orderBy(asc(groceryProducts.name));
  }

  async getGroceryProduct(id: string): Promise<GroceryProduct | undefined> {
    const [product] = await db
      .select()
      .from(groceryProducts)
      .where(sql`${groceryProducts.id} = ${parseInt(id)}`);
    return product;
  }
  async getGroceryOrder(id: string): Promise<GroceryOrder | undefined> {
    return db.query.groceryOrders.findFirst({
      where: eq(groceryOrders.id, id),
    });
  }
  async getStreetFoodItems(
    providerId?: string,
    search?: string,
  ): Promise<StreetFoodItem[]> {
    const conditions = [eq(streetFoodItems.isAvailable, true)];
    if (providerId) {
      conditions.push(eq(streetFoodItems.providerId, providerId));
    }
    if (search) {
      conditions.push(sql`${streetFoodItems.name} ILIKE ${`%${search}%`}`);
    }
    return db
      .select()
      .from(streetFoodItems)
      .where(and(...conditions));
  }
  async getRestaurantMenuItems(
    providerId?: string,
  ): Promise<RestaurantMenuItem[]> {
    if (providerId) {
      return db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.providerId, providerId),
      });
    }
    return db.query.restaurantMenuItems.findMany({
      where: eq(restaurantMenuItems.isAvailable, true),
    });
  }


  async getRentalProperties(filters: {
    propertyType?: string;
    minRent?: number;
    maxRent?: number;
    furnishing?: string;
    locality?: string;
    bedrooms?: number;
  }) {
    const conditions = [eq(rentalProperties.status, 'available')];

    if (filters.propertyType) {
      conditions.push(eq(rentalProperties.propertyType, filters.propertyType));
    }
    if (filters.minRent) {
      conditions.push(gte(rentalProperties.rent, filters.minRent.toString()));
    }
    if (filters.maxRent) {
      conditions.push(lte(rentalProperties.rent, filters.maxRent.toString()));
    }
    if (filters.furnishing) {
      conditions.push(eq(rentalProperties.furnishing, filters.furnishing));
    }
    if (filters.bedrooms) {
      conditions.push(eq(rentalProperties.bedrooms, filters.bedrooms));
    }
    // Locality search (partial match)
    if (filters.locality) {
      conditions.push(sql`${rentalProperties.locality} ILIKE ${`%${filters.locality}%`}`);
    }

    return db.query.rentalProperties.findMany({
      where: and(...conditions),
      with: { owner: true },
      orderBy: [desc(rentalProperties.createdAt)],
    }) as any;
  }

  async getProviderRentalProperties(ownerId: string): Promise<RentalProperty[]> {
    return db.query.rentalProperties.findMany({
      where: eq(rentalProperties.ownerId, ownerId),
      orderBy: [desc(rentalProperties.createdAt)],
    });
  }

  async getRentalProperty(id: string): Promise<(RentalProperty & { owner: User }) | undefined> {
    return db.query.rentalProperties.findFirst({
      where: eq(rentalProperties.id, id),
      with: { owner: true },
    }) as any;
  }

  async createReview(review: {
    userId: string;
    providerId: string;
    bookingId?: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    const providerReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, review.providerId));
    const avgRating =
      providerReviews.reduce((sum, r) => sum + r.rating, 0) /
      providerReviews.length;
    await this.updateProviderRating(
      review.providerId,
      avgRating,
      providerReviews.length,
    );
    return newReview;
  }
  async getProviderReviews(providerId: string) {
    return db.query.reviews.findMany({
      where: eq(reviews.providerId, providerId),
      with: { user: true },
      orderBy: [desc(reviews.createdAt)],
    }) as any;
  }

  private getMenuTableInfo(categorySlug: string) {
    switch (categorySlug) {

      case "cake-shop":
        return {
          table: cakeProducts,
          idField: cakeProducts.id,
          providerIdField: cakeProducts.providerId,
        };
      case "street-food":
        return {
          table: streetFoodItems,
          idField: streetFoodItems.id,
          providerIdField: streetFoodItems.providerId,
        };
      case "restaurants":
        return {
          table: restaurantMenuItems,
          idField: restaurantMenuItems.id,
          providerIdField: restaurantMenuItems.providerId,
        };
      case "grocery":
        return {
          table: groceryProducts,
          idField: groceryProducts.id,
          providerIdField: groceryProducts.providerId,
        };
      default:
        throw new Error(`Unknown menu category: ${categorySlug}`);
    }
  }
  async createMenuItem(
    itemData: any,
    providerId: string,
    categorySlug: string,
  ): Promise<any> {
    const { table } = this.getMenuTableInfo(categorySlug);
    const [newItem] = await db
      .insert(table)
      .values({ ...itemData, providerId })
      .returning();
    return newItem;
  }
  async updateMenuItem(
    itemId: string,
    providerId: string,
    categorySlug: string,
    updates: any,
  ): Promise<any | null> {
    const { table, idField, providerIdField } =
      this.getMenuTableInfo(categorySlug);
    const [itemToUpdate] = await db
      .select()
      .from(table)
      .where(and(eq(idField, itemId), eq(providerIdField, providerId)));

    if (!itemToUpdate) {
      console.log(`[DEBUG] Item not found for update: ${itemId}`);
      return null;
    }

    console.log(`[DEBUG] Updating item ${itemId} with:`, updates);

    const [updatedItem] = await db
      .update(table)
      .set(updates)
      .where(eq(idField, itemId))
      .returning();

    console.log(`[DEBUG] Item updated result:`, updatedItem);
    return updatedItem;
  }
  async deleteMenuItem(
    itemId: string,
    providerId: string,
    categorySlug: string,
  ): Promise<{ id: string } | null> {
    const { table, idField, providerIdField } =
      this.getMenuTableInfo(categorySlug);
    const [itemToUpdate] = await db
      .select()
      .from(table)
      .where(and(eq(idField, itemId), eq(providerIdField, providerId)));
    if (!itemToUpdate) return null;
    const [deletedItem] = await db
      .delete(table)
      .where(eq(idField, itemId))
      .returning({ id: idField });
    return deletedItem;
  }
  async getProviderMenuItems(
    providerId: string,
    categorySlug: string,
  ): Promise<any[]> {
    const { table, providerIdField } = this.getMenuTableInfo(categorySlug);
    return db.select().from(table).where(eq(providerIdField, providerId));
  }

  // --- STREET FOOD ORDER METHODS ---

  async createStreetFoodOrder(order: InsertStreetFoodOrder & { userId: string }): Promise<StreetFoodOrder> {
    const [newOrder] = await db.insert(streetFoodOrders).values(order).returning();
    // Ensure ID is present. If Drizzle fails to return it (rare), we might need to fetch it? 
    // But returning() should work. 
    return newOrder;
  }

  async getStreetFoodOrder(id: string): Promise<StreetFoodOrder | undefined> {
    const [order] = await db.select().from(streetFoodOrders).where(eq(streetFoodOrders.id, id));
    return order;
  }

  async getRunnerOrders(): Promise<StreetFoodOrder[]> {
    return db.select().from(streetFoodOrders).orderBy(desc(streetFoodOrders.createdAt));
  }

  async updateStreetFoodOrderStatus(id: string, status: string, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<StreetFoodOrder> {
    const updates: any = { status };
    if (razorpayPaymentId) updates.razorpayPaymentId = razorpayPaymentId;

    const [updatedOrder] = await db
      .update(streetFoodOrders)
      .set(updates)
      .where(eq(streetFoodOrders.id, id))
      .returning();
    return updatedOrder;
  }

  // --- STREET FOOD MANAGEMENT (RUNNER) ---

  async createStreetFoodVendor(vendor: InsertServiceProvider & { userId: string; categoryId: string }): Promise<ServiceProvider> {
    const providerToInsert = {
      businessName: vendor.businessName,
      description: vendor.description,
      experience: vendor.experience,
      address: vendor.address,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      specializations: vendor.specializations,
      profileImageUrl: vendor.profileImageUrl,
      userId: vendor.userId,
      categoryId: vendor.categoryId,
    };
    const [newVendor] = await db.insert(serviceProviders).values(providerToInsert).returning();
    return newVendor;
  }

  async deleteStreetFoodVendor(id: string): Promise<void> {
    // First delete related items
    await db.delete(streetFoodItems).where(eq(streetFoodItems.providerId, id));
    // Then delete the vendor
    await db.delete(serviceProviders).where(eq(serviceProviders.id, id));
  }

  async createStreetFoodItem(item: InsertStreetFoodItem): Promise<StreetFoodItem> {
    const [newItem] = await db.insert(streetFoodItems).values(item).returning();
    return newItem;
  }

  async deleteStreetFoodItem(id: string): Promise<void> {
    await db.delete(streetFoodItems).where(eq(streetFoodItems.id, id));
  }

  async updateStreetFoodItem(id: string, updates: Partial<InsertStreetFoodItem>): Promise<StreetFoodItem | undefined> {
    const [updatedItem] = await db
      .update(streetFoodItems)
      .set(updates)
      .where(eq(streetFoodItems.id, id))
      .returning();
    return updatedItem;
  }

  // Restaurant Orders
  async createRestaurantOrder(order: InsertRestaurantOrder & { userId: string }): Promise<RestaurantOrder> {
    const [newOrder] = await db.insert(restaurantOrders).values(order).returning();
    return newOrder;
  }

  async getRestaurantOrder(id: string): Promise<RestaurantOrder | undefined> {
    return db.query.restaurantOrders.findFirst({
      where: eq(restaurantOrders.id, id),
      with: { user: true, provider: true, rider: true },
    });
  }

  async getRestaurantOrders(providerId: string): Promise<RestaurantOrder[]> {
    return db.query.restaurantOrders.findMany({
      where: eq(restaurantOrders.providerId, providerId),
      with: { user: true, rider: true },
      orderBy: [desc(restaurantOrders.createdAt)],
    });
  }

  async getRiderOrders(riderId?: string): Promise<RestaurantOrder[]> {
    if (riderId) {
      return db.query.restaurantOrders.findMany({
        where: eq(restaurantOrders.riderId, riderId),
        with: { user: true, provider: true },
        orderBy: [desc(restaurantOrders.createdAt)],
      });
    } else {
      // Available orders for any rider (pending/accepted/preparing)
      return db.query.restaurantOrders.findMany({
        where: sql`${restaurantOrders.riderId} IS NULL AND ${restaurantOrders.status} IN ('pending', 'accepted', 'preparing')`,
        with: { user: true, provider: true },
        orderBy: [desc(restaurantOrders.createdAt)],
      });
    }
  }

  async getRestaurantOrdersByUserId(userId: string): Promise<RestaurantOrder[]> {
    return db.query.restaurantOrders.findMany({
      where: eq(restaurantOrders.userId, userId),
      with: { provider: true },
      orderBy: [desc(restaurantOrders.createdAt)],
    }) as any;
  }

  async getRestaurantOrdersByProviderId(providerId: string): Promise<RestaurantOrder[]> {
    return db.query.restaurantOrders.findMany({
      where: eq(restaurantOrders.providerId, providerId),
      with: { user: true },
      orderBy: [desc(restaurantOrders.createdAt)],
    }) as any;
  }

  async updateProviderOrderStatus(orderId: string, providerId: string, status: string): Promise<RestaurantOrder> {
    // Verify order belongs to this provider
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.providerId, providerId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or you are not authorized");
    }

    const [updated] = await db
      .update(restaurantOrders)
      .set({ status })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    return updated;
  }

  async updateRestaurantOrderStatus(id: string, status: string, riderId?: string | null, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<RestaurantOrder> {
    const updates: any = { status };
    if (riderId) {
      updates.riderId = riderId;
    }
    if (razorpayPaymentId) {
      updates.razorpayPaymentId = razorpayPaymentId;
    }
    const [updatedOrder] = await db
      .update(restaurantOrders)
      .set(updates)
      .where(eq(restaurantOrders.id, id))
      .returning();
    return updatedOrder;
  }

  // =========================================
  // DELIVERY PARTNER METHODS
  // =========================================

  async getDeliveryPartnerByUserId(userId: string): Promise<DeliveryPartner | undefined> {
    return db.query.deliveryPartners.findFirst({
      where: eq(deliveryPartners.userId, userId),
    });
  }

  async createDeliveryPartner(partner: InsertDeliveryPartner & { userId: string }): Promise<DeliveryPartner> {
    const [newPartner] = await db.insert(deliveryPartners).values(partner).returning();
    return newPartner;
  }

  async updateDeliveryPartnerStatus(partnerId: string, isOnline: boolean): Promise<DeliveryPartner> {
    const [updated] = await db
      .update(deliveryPartners)
      .set({ isOnline })
      .where(eq(deliveryPartners.id, partnerId))
      .returning();
    return updated;
  }

  async updateDeliveryPartnerLocation(partnerId: string, latitude: string, longitude: string): Promise<DeliveryPartner> {
    const [updated] = await db
      .update(deliveryPartners)
      .set({
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      })
      .where(eq(deliveryPartners.id, partnerId))
      .returning();
    return updated;
  }

  // =========================================
  // RIDER ORDER METHODS
  // =========================================

  async getAvailableOrdersForRider(): Promise<RestaurantOrder[]> {
    // Get orders that are ready for pickup and don't have a rider assigned
    return db.query.restaurantOrders.findMany({
      where: and(
        eq(restaurantOrders.status, 'ready_for_pickup'),
        sql`${restaurantOrders.riderId} IS NULL`
      ),
      with: {
        user: true,
        provider: true,
      },
      orderBy: [desc(restaurantOrders.createdAt)],
    }) as any;
  }

  async acceptOrderAsRider(orderId: string, riderId: string): Promise<RestaurantOrder> {
    // First check if order is still available
    const order = await db.query.restaurantOrders.findFirst({
      where: eq(restaurantOrders.id, orderId),
    });

    if (!order) {
      throw new Error("Order not found");
    }
    if (order.riderId) {
      throw new Error("Order already claimed by another rider");
    }
    if (order.status !== 'ready_for_pickup') {
      throw new Error("Order is not ready for pickup");
    }

    const [updated] = await db
      .update(restaurantOrders)
      .set({
        riderId,
        status: 'assigned',
        riderAcceptedAt: new Date(),
      })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    return updated;
  }

  async updateOrderStatus(orderId: string, riderId: string, status: string): Promise<RestaurantOrder> {
    // Verify rider owns this order
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or you are not the assigned rider");
    }

    const [updated] = await db
      .update(restaurantOrders)
      .set({ status })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    return updated;
  }

  async markOrderPickedUp(orderId: string, riderId: string): Promise<{ order: RestaurantOrder; otp: string }> {
    // Verify rider owns this order
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or you are not the assigned rider");
    }

    // Generate 4-digit OTP for delivery
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const [updated] = await db
      .update(restaurantOrders)
      .set({
        status: 'out_for_delivery',
        pickedUpAt: new Date(),
        deliveryOtp: otp,
        deliveryOtpGeneratedAt: new Date(),
      })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    // TODO: Send OTP to customer via SMS
    // await sendOtpNotification(customerPhone, otp);

    return { order: updated, otp };
  }

  async verifyDeliveryOtp(orderId: string, riderId: string, otp: string): Promise<RestaurantOrder> {
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or you are not the assigned rider");
    }
    if (order.status !== 'out_for_delivery') {
      throw new Error("Order is not out for delivery");
    }
    if (order.deliveryOtp !== otp) {
      throw new Error("Invalid OTP");
    }

    // OTP verified - mark as delivered
    const [updated] = await db
      .update(restaurantOrders)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
        deliveryOtp: null, // Clear OTP after use
      })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    // Update rider's delivery count
    const partner = await this.getDeliveryPartnerByUserId(riderId);
    if (partner) {
      await db
        .update(deliveryPartners)
        .set({ totalDeliveries: (partner.totalDeliveries || 0) + 1 })
        .where(eq(deliveryPartners.id, partner.id));
    }

    return updated;
  }

  async getOrderTrackingInfo(orderId: string, userId: string): Promise<any> {
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.userId, userId)
      ),
      with: {
        provider: true,
        rider: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // If rider is assigned, get their current location
    let riderLocation = null;
    if (order.riderId) {
      const partner = await this.getDeliveryPartnerByUserId(order.riderId);
      if (partner && partner.currentLatitude && partner.currentLongitude) {
        riderLocation = {
          latitude: partner.currentLatitude,
          longitude: partner.currentLongitude,
          lastUpdate: partner.lastLocationUpdate,
        };
      }
    }

    return {
      order,
      riderLocation,
      statusTimeline: this.getStatusTimeline(order),
    };
  }

  private getStatusTimeline(order: RestaurantOrder) {
    const statuses = [
      { key: 'pending', label: 'Order Placed', completed: true, time: order.createdAt },
      { key: 'accepted', label: 'Order Accepted', completed: ['accepted', 'preparing', 'ready_for_pickup', 'assigned', 'out_for_delivery', 'delivered'].includes(order.status || ''), time: null },
      { key: 'preparing', label: 'Preparing', completed: ['preparing', 'ready_for_pickup', 'assigned', 'out_for_delivery', 'delivered'].includes(order.status || ''), time: null },
      { key: 'ready_for_pickup', label: 'Ready for Pickup', completed: ['ready_for_pickup', 'assigned', 'out_for_delivery', 'delivered'].includes(order.status || ''), time: null },
      { key: 'out_for_delivery', label: 'Out for Delivery', completed: ['out_for_delivery', 'delivered'].includes(order.status || ''), time: order.pickedUpAt },
      { key: 'delivered', label: 'Delivered', completed: order.status === 'delivered', time: order.deliveredAt },
    ];
    return statuses;
  }

  async markOrderReadyForPickup(orderId: string, providerId: string): Promise<RestaurantOrder> {
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.providerId, providerId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or you are not the provider");
    }

    const [updated] = await db
      .update(restaurantOrders)
      .set({ status: 'ready_for_pickup' })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    return updated;
  }

  // =========================================
  // GROCERY ORDER METHODS FOR PROVIDERS AND RIDERS
  // =========================================

  async updateGroceryOrderStatusByProvider(orderId: string, providerId: string, status: string): Promise<GroceryOrder> {
    const order = await db.query.groceryOrders.findFirst({
      where: and(
        eq(groceryOrders.id, orderId),
        eq(groceryOrders.providerId, providerId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or you are not authorized");
    }

    const [updated] = await db
      .update(groceryOrders)
      .set({ status })
      .where(eq(groceryOrders.id, orderId))
      .returning();

    return updated;
  }

  async getAvailableGroceryOrdersForRider(): Promise<GroceryOrder[]> {
    return db.query.groceryOrders.findMany({
      where: and(
        eq(groceryOrders.status, 'ready_for_pickup'),
        sql`${groceryOrders.riderId} IS NULL`
      ),
      orderBy: [desc(groceryOrders.createdAt)],
    }) as any;
  }

  async getRiderGroceryOrders(riderId: string): Promise<GroceryOrder[]> {
    return db.query.groceryOrders.findMany({
      where: eq(groceryOrders.riderId, riderId),
      orderBy: [desc(groceryOrders.createdAt)],
    }) as any;
  }

  async getAllAvailableOrdersForRider(): Promise<any[]> {
    // Get available restaurant orders
    const restaurantOrdersList = await db.query.restaurantOrders.findMany({
      where: and(
        eq(restaurantOrders.status, 'ready_for_pickup'),
        sql`${restaurantOrders.riderId} IS NULL`
      ),
      with: { user: true, provider: true },
      orderBy: [desc(restaurantOrders.createdAt)],
    });

    // Get available grocery orders
    const groceryOrdersList = await db.query.groceryOrders.findMany({
      where: and(
        eq(groceryOrders.status, 'ready_for_pickup'),
        sql`${groceryOrders.riderId} IS NULL`
      ),
      orderBy: [desc(groceryOrders.createdAt)],
    });

    // Combine and tag with orderType
    const combined = [
      ...restaurantOrdersList.map(o => ({ ...o, orderType: 'restaurant' })),
      ...groceryOrdersList.map(o => ({ ...o, orderType: 'grocery' })),
    ];

    // Sort by createdAt
    combined.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return combined;
  }

  async getAllRiderOrders(riderId: string): Promise<any[]> {
    const restaurantOrdersList = await db.query.restaurantOrders.findMany({
      where: eq(restaurantOrders.riderId, riderId),
      with: { user: true, provider: true },
      orderBy: [desc(restaurantOrders.createdAt)],
    });

    const groceryOrdersList = await db.query.groceryOrders.findMany({
      where: eq(groceryOrders.riderId, riderId),
      orderBy: [desc(groceryOrders.createdAt)],
    });

    const combined = [
      ...restaurantOrdersList.map(o => ({ ...o, orderType: 'restaurant' })),
      ...groceryOrdersList.map(o => ({ ...o, orderType: 'grocery' })),
    ];

    combined.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return combined;
  }

  async acceptGroceryOrderAsRider(orderId: string, riderId: string): Promise<GroceryOrder> {
    const order = await db.query.groceryOrders.findFirst({
      where: eq(groceryOrders.id, orderId),
    });

    if (!order) {
      throw new Error("Order not found");
    }
    if (order.riderId) {
      throw new Error("Order already claimed by another rider");
    }
    if (order.status !== 'ready_for_pickup') {
      throw new Error("Order is not ready for pickup");
    }

    const [updated] = await db
      .update(groceryOrders)
      .set({
        riderId,
        status: 'assigned',
        riderAcceptedAt: new Date(),
      })
      .where(eq(groceryOrders.id, orderId))
      .returning();

    return updated;
  }

  async updateGroceryOrderStatusByRider(orderId: string, riderId: string, status: string): Promise<GroceryOrder> {
    const order = await db.query.groceryOrders.findFirst({
      where: and(
        eq(groceryOrders.id, orderId),
        eq(groceryOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or not assigned to you");
    }

    const [updated] = await db
      .update(groceryOrders)
      .set({ status })
      .where(eq(groceryOrders.id, orderId))
      .returning();

    return updated;
  }

  async markGroceryOrderPickedUp(orderId: string, riderId: string): Promise<{ order: GroceryOrder; otp: string }> {
    const order = await db.query.groceryOrders.findFirst({
      where: and(
        eq(groceryOrders.id, orderId),
        eq(groceryOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or not assigned to you");
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const [updated] = await db
      .update(groceryOrders)
      .set({
        status: 'out_for_delivery',
        deliveryOtp: otp,
        deliveryOtpGeneratedAt: new Date(),
        pickedUpAt: new Date(),
      })
      .where(eq(groceryOrders.id, orderId))
      .returning();

    return { order: updated, otp };
  }

  async verifyGroceryDeliveryOtp(orderId: string, riderId: string, otp: string): Promise<GroceryOrder> {
    const order = await db.query.groceryOrders.findFirst({
      where: and(
        eq(groceryOrders.id, orderId),
        eq(groceryOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or not assigned to you");
    }

    if (order.deliveryOtp !== otp) {
      throw new Error("Invalid OTP");
    }

    const [updated] = await db
      .update(groceryOrders)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
      })
      .where(eq(groceryOrders.id, orderId))
      .returning();

    return updated;
  }
}

export const storage = new DatabaseStorage();


