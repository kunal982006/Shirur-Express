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
  providerOffers,
  type ProviderOffer,
  type InsertProviderOffer,
  // DELIVERY PARTNER IMPORTS
  deliveryPartners,
  type DeliveryPartner,
  type InsertDeliveryPartner,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, gt, lt, gte, lte, or, ilike } from "drizzle-orm";
// NAYE IMPORTS
import { sendPushNotification } from "./firebase";
import { razorpayInstance } from "./razorpay-client";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(
    userId: string,
    info: { customerId: string; subscriptionId: string },
  ): Promise<User>;
  updateUserFcmToken(userId: string, token: string): Promise<User>;
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
        isAvailable?: boolean;
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
    booking: InsertBooking & { userId: string; providerId?: string | null },
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
  getAllStreetFoodOrders(): Promise<StreetFoodOrder[]>;
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
  markOrderDelivered(orderId: string, riderId: string): Promise<RestaurantOrder>;
  markGroceryOrderDelivered(orderId: string, riderId: string): Promise<GroceryOrder>;
  markStreetFoodOrderDelivered(orderId: string, riderId: string): Promise<StreetFoodOrder>;
  getOrderTrackingInfo(orderId: string, userId: string): Promise<any>;
  markOrderReadyForPickup(orderId: string, providerId: string): Promise<RestaurantOrder>;

  // POPULAR ITEMS MANAGEMENT
  togglePopularStatus(type: 'street_food' | 'street_food_vendor' | 'restaurant' | 'cake', id: string, isPopular: boolean, popularOrder?: number): Promise<any>;
  getPopularStreetFood(): Promise<StreetFoodItem[]>;
  getPopularStreetFoodProviders(): Promise<ServiceProvider[]>;
  getPopularRestaurants(): Promise<ServiceProvider[]>;
  getPopularCakes(): Promise<CakeProduct[]>;
  searchItemsForAdmin(query: string, type: 'street_food' | 'street_food_vendor' | 'restaurant' | 'cake'): Promise<any[]>;
  searchGlobal(query: string): Promise<{
    services: any[];
    restaurants: any[];
    streetFood: any[];
    menuItems: any[];
    cakes: any[];
    grocery: any[];
    rentals: any[];
    didYouMean: string | null;
  }>;
  searchSuggestions(query: string): Promise<{ suggestions: string[]; didYouMean: string | null }>;
  getPopularRestaurantMenuItems(): Promise<(RestaurantMenuItem & { provider: ServiceProvider })[]>;
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: eq(users.phone, phone) });
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

  async deleteUser(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Check if user is a service provider and delete associated records
      const provider = await tx.query.serviceProviders.findFirst({
        where: eq(serviceProviders.userId, id),
      });

      if (provider) {
        // Delete provider's specific offerings
        await tx.delete(serviceOfferings).where(eq(serviceOfferings.providerId, provider.id));
        await tx.delete(cakeProducts).where(eq(cakeProducts.providerId, provider.id));
        await tx.delete(groceryProducts).where(eq(groceryProducts.providerId, provider.id));
        await tx.delete(streetFoodItems).where(eq(streetFoodItems.providerId, provider.id));
        await tx.delete(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, provider.id));
        await tx.delete(providerOffers).where(eq(providerOffers.providerId, provider.id));

        // Delete orders meant for this provider
        await tx.delete(restaurantOrders).where(eq(restaurantOrders.providerId, provider.id));
        await tx.delete(streetFoodOrders).where(eq(streetFoodOrders.providerId, provider.id));
        await tx.delete(groceryOrders).where(eq(groceryOrders.providerId, provider.id));

        // Delete provider profile
        await tx.delete(serviceProviders).where(eq(serviceProviders.id, provider.id));
      }

      // 2. Delete Delivery Partner Profile if exists
      await tx.delete(deliveryPartners).where(eq(deliveryPartners.userId, id));

      // 3. Delete user's own orders/bookings/invoices/reviews
      await tx.delete(invoices).where(eq(invoices.userId, id));
      await tx.delete(bookings).where(eq(bookings.userId, id));
      await tx.delete(restaurantOrders).where(eq(restaurantOrders.userId, id));
      await tx.delete(streetFoodOrders).where(eq(streetFoodOrders.userId, id));
      await tx.delete(groceryOrders).where(eq(groceryOrders.userId, id));
      await tx.delete(reviews).where(eq(reviews.userId, id));
      await tx.delete(rentalProperties).where(eq(rentalProperties.ownerId, id));

      // 4. Finally delete the User record
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async updateUserFcmToken(userId: string, token: string): Promise<User> {
    // First, get the user's existing tokens
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    let tokenList: string[] = [];
    if (existingUser?.fcmTokens && Array.isArray(existingUser.fcmTokens)) {
      tokenList = existingUser.fcmTokens.filter(t => t !== token); // Remove duplicate if re-registering
    }
    tokenList.push(token); // Add the new token at the end

    // Keep max 5 tokens per user (most recent devices)
    if (tokenList.length > 5) {
      tokenList = tokenList.slice(-5);
    }

    const [updatedUser] = await db
      .update(users)
      .set({ fcmToken: token, fcmTokens: tokenList })
      .where(eq(users.id, userId))
      .returning();
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
        user: true, // CRITICAL: Needed to fetch fcmToken for push notifications
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

    // Debug logging for FCM token
    if (result) {
      console.log(`[getServiceProvider] Fetched provider: ${result.businessName}`);
      console.log(`[getServiceProvider] User object: ${result.user ? 'EXISTS' : 'MISSING'}`);
      console.log(`[getServiceProvider] FCM Token in DB: ${result.user?.fcmToken ? 'FOUND (' + result.user.fcmToken.substring(0, 25) + '...)' : 'NOT SET'}`);
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
        isAvailable?: boolean;
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
    booking: InsertBooking & { userId: string; providerId?: string | null },
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
        problem: true,
        serviceOffering: { with: { template: true } },
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
        problem: true,
        serviceOffering: { with: { template: true } },
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
        invoice: true,
        problem: true,
        serviceOffering: { with: { template: true } },
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

    // Customer ko in-app OTP dikhao + Firebase push notification bhejo
    // (No Twilio SMS — OTP is shown in customer's My Bookings page)
    try {
      const customerUser = await this.getUser(booking.userId);
      if (customerUser?.fcmToken) {
        await sendPushNotification(customerUser.fcmToken, {
          type: 'ORDER_UPDATE',
          title: '🔐 Service OTP Generated',
          body: `Your service verification OTP is: ${otp}. Share it with the technician to confirm service completion.`,
          data: { bookingId, otp, action: 'SERVICE_OTP' },
        });
      }
    } catch (pushError) {
      console.warn('[OTP] Firebase push notification failed (non-critical):', pushError);
    }

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
      paymentMethod: order.paymentMethod, // NEW FIX
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

  async getGroceryOrdersByProvider(providerId: string): Promise<any[]> {
    const orders = await db.query.groceryOrders.findMany({
      where: eq(groceryOrders.providerId, providerId),
      with: { user: true },
      orderBy: (groceryOrders, { desc }) => [desc(groceryOrders.createdAt)],
    });

    // Manually fetch and attach product details for each item
    // Since items are stored in JSONB, we need to populate them
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const itemsWithDetails = await Promise.all((order.items || []).map(async (item: any) => {
        try {
          const product = await db.query.groceryProducts.findFirst({
            where: eq(groceryProducts.id, item.productId)
          });
          return {
            ...item,
            name: product?.name || item.name || "Unknown Product",
            imageUrl: product?.imageUrl || null
          };
        } catch (err) {
          return { ...item, name: item.name || "Unknown Product" };
        }
      }));
      return { ...order, items: itemsWithDetails };
    }));

    return enhancedOrders;
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
  async getRestaurantMenuItems(providerId?: string): Promise<RestaurantMenuItem[]> {
    if (!providerId) {
      return db.query.restaurantMenuItems.findMany({
        where: eq(restaurantMenuItems.isAvailable, true),
        orderBy: (restaurantMenuItems, { asc }) => [asc(restaurantMenuItems.price)],
      });
    }

    const restaurantItems = await db.query.restaurantMenuItems.findMany({
      where: eq(restaurantMenuItems.providerId, providerId),
    });

    const cakes = await db.query.cakeProducts.findMany({
      where: eq(cakeProducts.providerId, providerId),
    });

    const mappedCakes: RestaurantMenuItem[] = cakes.map((cake) => ({
      id: cake.id,
      providerId: cake.providerId,
      name: cake.name,
      description: cake.description || null,
      category: cake.category || "Cakes",
      imageUrl: cake.imageUrl,
      price: cake.price ? String(cake.price) : "0",
      isVeg: true,
      isAvailable: cake.isAvailable !== false,
      cuisine: "Bakery",
      isPopular: cake.isPopular || false,
    }));

    const merged = [...restaurantItems, ...mappedCakes];
    return merged.sort((a, b) => Number(a.price) - Number(b.price));
  }


  async getRentalProperties(filters: {
    propertyType?: string;
    listingType?: string;
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
    if (filters.listingType) {
      conditions.push(eq(rentalProperties.listingType, filters.listingType));
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
    options?: { category?: string; search?: string; limit?: number }
  ): Promise<any[]> {
    const { table, providerIdField } = this.getMenuTableInfo(categorySlug);

    // For grocery, support category filtering + limit for performance
    if (categorySlug === 'grocery' && options) {
      const conditions = [eq(providerIdField, providerId)];
      if (options.category) {
        conditions.push(eq(groceryProducts.category, options.category));
      }
      if (options.search) {
        conditions.push(sql`${groceryProducts.name} ILIKE ${`%${options.search}%`}`);
      }
      return db.select().from(table)
        .where(and(...conditions))
        .orderBy(asc(groceryProducts.name))
        .limit(options.limit || 5000);
    }

    return db.select().from(table).where(eq(providerIdField, providerId));
  }

  // Lightweight: only get category names and counts for grocery provider dashboard
  async getProviderGroceryCategories(providerId: string): Promise<{ name: string; count: number }[]> {
    const result = await db
      .select({
        name: groceryProducts.category,
        count: sql<number>`count(*)::int`,
      })
      .from(groceryProducts)
      .where(eq(groceryProducts.providerId, providerId))
      .groupBy(groceryProducts.category)
      .orderBy(asc(groceryProducts.category));
    return result;
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

  async getAllStreetFoodOrders(): Promise<StreetFoodOrder[]> {
    const orders = await db.select().from(streetFoodOrders).orderBy(desc(streetFoodOrders.createdAt));
    return orders;
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

  async getOnlineDeliveryPartnersWithTokens(): Promise<Array<{ userId: string; fcmToken: string | null; fcmTokens: string[] | null }>> {
    const partners = await db.query.deliveryPartners.findMany({
      where: and(
        eq(deliveryPartners.isOnline, true),
        eq(deliveryPartners.isActive, true)
      ),
      with: { user: true },
    });

    return partners
      .filter(p => p.user)
      .map(p => ({
        userId: p.userId,
        fcmToken: p.user?.fcmToken || null,
        fcmTokens: (p.user?.fcmTokens as string[] | null) || null,
      }));
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

    // Get available street food orders
    const streetFoodOrdersList = await db.query.streetFoodOrders.findMany({
      where: and(
        eq(streetFoodOrders.status, 'ready_for_pickup'),
        sql`${streetFoodOrders.riderId} IS NULL`
      ),
      orderBy: [desc(streetFoodOrders.createdAt)],
    });

    // Combine and tag with orderType
    const combined = [
      ...restaurantOrdersList.map(o => ({ ...o, orderType: 'restaurant' })),
      ...groceryOrdersList.map(o => ({ ...o, orderType: 'grocery' })),
      ...streetFoodOrdersList.map(o => ({ ...o, orderType: 'street_food' })),
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

    const streetFoodOrdersList = await db.query.streetFoodOrders.findMany({
      where: eq(streetFoodOrders.riderId, riderId),
      orderBy: [desc(streetFoodOrders.createdAt)],
    });

    const combined = [
      ...restaurantOrdersList.map(o => ({ ...o, orderType: 'restaurant' })),
      ...groceryOrdersList.map(o => ({ ...o, orderType: 'grocery' })),
      ...streetFoodOrdersList.map(o => ({ ...o, orderType: 'street_food' })),
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

  async acceptStreetFoodOrderAsRider(orderId: string, riderId: string): Promise<StreetFoodOrder> {
    const order = await db.query.streetFoodOrders.findFirst({
      where: eq(streetFoodOrders.id, orderId),
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
      .update(streetFoodOrders)
      .set({
        riderId,
        status: 'assigned',
        riderAcceptedAt: new Date(),
      })
      .where(eq(streetFoodOrders.id, orderId))
      .returning();

    return updated;
  }

  async updateStreetFoodOrderStatusByRider(orderId: string, riderId: string, status: string): Promise<StreetFoodOrder> {
    const order = await db.query.streetFoodOrders.findFirst({
      where: and(
        eq(streetFoodOrders.id, orderId),
        eq(streetFoodOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or not assigned to you");
    }

    const [updated] = await db
      .update(streetFoodOrders)
      .set({ status })
      .where(eq(streetFoodOrders.id, orderId))
      .returning();

    return updated;
  }

  async markStreetFoodOrderPickedUp(orderId: string, riderId: string): Promise<{ order: StreetFoodOrder; otp: string }> {
    const order = await db.query.streetFoodOrders.findFirst({
      where: and(
        eq(streetFoodOrders.id, orderId),
        eq(streetFoodOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or not assigned to you");
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const [updated] = await db
      .update(streetFoodOrders)
      .set({
        status: 'out_for_delivery',
        deliveryOtp: otp,
        deliveryOtpGeneratedAt: new Date(),
        pickedUpAt: new Date(),
      })
      .where(eq(streetFoodOrders.id, orderId))
      .returning();

    return { order: updated, otp };
  }

  async verifyStreetFoodDeliveryOtp(orderId: string, riderId: string, otp: string): Promise<StreetFoodOrder> {
    const order = await db.query.streetFoodOrders.findFirst({
      where: and(
        eq(streetFoodOrders.id, orderId),
        eq(streetFoodOrders.riderId, riderId)
      ),
    });

    if (!order) {
      throw new Error("Order not found or not assigned to you");
    }

    if (order.deliveryOtp !== otp) {
      throw new Error("Invalid OTP");
    }

    const [updated] = await db
      .update(streetFoodOrders)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
      })
      .where(eq(streetFoodOrders.id, orderId))
      .returning();

    return updated;
  }

  // --- DIRECT MARK DELIVERED (OTP removed) ---

  async markOrderDelivered(orderId: string, riderId: string): Promise<RestaurantOrder> {
    const order = await db.query.restaurantOrders.findFirst({
      where: and(
        eq(restaurantOrders.id, orderId),
        eq(restaurantOrders.riderId, riderId)
      ),
    });
    if (!order) throw new Error("Order not found or not assigned to you");
    if (order.status !== 'out_for_delivery') throw new Error("Order is not out for delivery");

    const [updated] = await db
      .update(restaurantOrders)
      .set({ status: 'delivered', deliveredAt: new Date(), deliveryOtp: null })
      .where(eq(restaurantOrders.id, orderId))
      .returning();

    const partner = await this.getDeliveryPartnerByUserId(riderId);
    if (partner) {
      await db.update(deliveryPartners)
        .set({ totalDeliveries: (partner.totalDeliveries || 0) + 1 })
        .where(eq(deliveryPartners.id, partner.id));
    }
    return updated;
  }

  async markGroceryOrderDelivered(orderId: string, riderId: string): Promise<GroceryOrder> {
    const order = await db.query.groceryOrders.findFirst({
      where: and(
        eq(groceryOrders.id, orderId),
        eq(groceryOrders.riderId, riderId)
      ),
    });
    if (!order) throw new Error("Order not found or not assigned to you");

    const [updated] = await db
      .update(groceryOrders)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(groceryOrders.id, orderId))
      .returning();

    const partner = await this.getDeliveryPartnerByUserId(riderId);
    if (partner) {
      await db.update(deliveryPartners)
        .set({ totalDeliveries: (partner.totalDeliveries || 0) + 1 })
        .where(eq(deliveryPartners.id, partner.id));
    }
    return updated;
  }

  async markStreetFoodOrderDelivered(orderId: string, riderId: string): Promise<StreetFoodOrder> {
    const order = await db.query.streetFoodOrders.findFirst({
      where: and(
        eq(streetFoodOrders.id, orderId),
        eq(streetFoodOrders.riderId, riderId)
      ),
    });
    if (!order) throw new Error("Order not found or not assigned to you");

    const [updated] = await db
      .update(streetFoodOrders)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(streetFoodOrders.id, orderId))
      .returning();

    const partner = await this.getDeliveryPartnerByUserId(riderId);
    if (partner) {
      await db.update(deliveryPartners)
        .set({ totalDeliveries: (partner.totalDeliveries || 0) + 1 })
        .where(eq(deliveryPartners.id, partner.id));
    }
    return updated;
  }

  // --- POPULAR ITEMS MANAGEMENT ---

  async togglePopularStatus(type: 'street_food' | 'street_food_vendor' | 'restaurant' | 'cake', id: string, isPopular: boolean, popularOrder?: number): Promise<any> {
    if (type === 'street_food') {
      const updateData: any = { isPopular };
      if (popularOrder !== undefined) updateData.popularOrder = popularOrder;
      const [item] = await db.update(streetFoodItems)
        .set(updateData)
        .where(eq(streetFoodItems.id, id))
        .returning();
      return item;
    } else if (type === 'restaurant' || type === 'street_food_vendor') {
      // For restaurants and street food vendors, we are toggling the ServiceProvider itself
      const [provider] = await db.update(serviceProviders)
        .set({ isPopular })
        .where(eq(serviceProviders.id, id))
        .returning();
      return provider;
    } else if (type === 'cake') {
      const updateData: any = { isPopular };
      if (popularOrder !== undefined) updateData.popularOrder = popularOrder;
      const [cake] = await db.update(cakeProducts)
        .set(updateData)
        .where(eq(cakeProducts.id, id))
        .returning();
      return cake;
    }
    throw new Error("Invalid type");
  }

  async getPopularStreetFood(): Promise<StreetFoodItem[]> {
    return db.select()
      .from(streetFoodItems)
      .where(and(eq(streetFoodItems.isPopular, true), eq(streetFoodItems.isAvailable, true)))
      .orderBy(sql`CASE WHEN ${streetFoodItems.popularOrder} = 0 THEN 9999 ELSE ${streetFoodItems.popularOrder} END ASC`);
  }

  async getPopularStreetFoodProviders(): Promise<ServiceProvider[]> {
    const category = await db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.slug, 'street-food')
    });
    if (!category) return [];

    return db.query.serviceProviders.findMany({
      where: and(
        eq(serviceProviders.isPopular, true),
        eq(serviceProviders.isAvailable, true),
        eq(serviceProviders.categoryId, category.id)
      ),
      with: { category: true }
    });
  }

  async getPopularRestaurants(): Promise<ServiceProvider[]> {
    const category = await db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.slug, 'restaurants')
    });
    if (!category) return [];

    return db.query.serviceProviders.findMany({
      where: and(
        eq(serviceProviders.isPopular, true),
        eq(serviceProviders.isAvailable, true),
        eq(serviceProviders.categoryId, category.id)
      ),
      with: { category: true }
    });
  }

  async getPopularCakes(): Promise<CakeProduct[]> {
    const records = await db.select({ cake: cakeProducts })
      .from(cakeProducts)
      .innerJoin(serviceProviders, eq(cakeProducts.providerId, serviceProviders.id))
      .where(
        and(
          eq(cakeProducts.isPopular, true),
          eq(cakeProducts.isAvailable, true),
          eq(serviceProviders.isAvailable, true)
        )
      )
      .orderBy(sql`CASE WHEN ${cakeProducts.popularOrder} = 0 THEN 9999 ELSE ${cakeProducts.popularOrder} END ASC`);
    return records.map(r => r.cake);
  }

  async searchItemsForAdmin(query: string, type: 'street_food' | 'street_food_vendor' | 'restaurant' | 'cake'): Promise<any[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;

    if (type === 'street_food') {
      return db.select().from(streetFoodItems).where(ilike(streetFoodItems.name, lowerQuery));
    } else if (type === 'street_food_vendor') {
      const sfCategory = await db.query.serviceCategories.findFirst({ where: eq(serviceCategories.slug, 'street-food') });
      if (!sfCategory) return [];
      return db.query.serviceProviders.findMany({
        where: and(ilike(serviceProviders.businessName, lowerQuery), eq(serviceProviders.categoryId, sfCategory.id)),
      });
    } else if (type === 'restaurant') {
      const resCategory = await db.query.serviceCategories.findFirst({ where: eq(serviceCategories.slug, 'restaurants') });
      if (!resCategory) return [];
      return db.query.serviceProviders.findMany({
        where: and(ilike(serviceProviders.businessName, lowerQuery), eq(serviceProviders.categoryId, resCategory.id)),
      });
    } else if (type === 'cake') {
      return db.select()
        .from(cakeProducts)
        .where(sql`lower(${cakeProducts.name}) LIKE ${lowerQuery}`)
        .limit(20);
    }
    return [];
  }

  // ===== ELASTIC / FUZZY SEARCH ENGINE =====
  
  // Comprehensive synonym dictionary for ALL services
  // Maps common misspellings, alternate names, and aliases to canonical search terms
  private readonly searchSynonyms: Record<string, string[]> = {
    // --- FOOD ITEMS ---
    'shawarma': ['shorma', 'sharma', 'shawrma', 'shwarma', 'shavrma', 'shaurma', 'showrma', 'shawrama'],
    'chicken': ['chiken', 'chikken', 'chkin', 'chickan', 'chiken', 'chikin', 'chcken'],
    'biryani': ['biriyani', 'biriani', 'briyani', 'bryani', 'biryni', 'biryanee', 'biriyanee', 'biryaniii'],
    'paneer': ['panner', 'panir', 'paner', 'panneer', 'pneer'],
    'samosa': ['samossa', 'somosa', 'samoosa', 'smosa'],
    'momos': ['momo', 'momoz', 'momus', 'momoes'],
    'naan': ['nan', 'naaan', 'nann'],
    'chapati': ['chapathi', 'chapatti', 'chapti', 'chapathi'],
    'roti': ['rotii', 'rooti', 'rotti'],
    'pulao': ['pulav', 'pilaf', 'pilau', 'pulau'],
    'dosa': ['dhosa', 'dosai', 'dhosai'],
    'idli': ['idly', 'idaly', 'idlee'],
    'manchurian': ['manchurean', 'manchoorian', 'manchurien', 'manchurain'],
    'gobi': ['gobhi', 'gobbi', 'gobhee'],
    'kebab': ['kabab', 'kebap', 'kabob', 'kababs'],
    'fried rice': ['freid rice', 'frid rice', 'friedrice', 'fry rice'],
    'pizza': ['piza', 'pizaa', 'pizzza', 'piazza'],
    'burger': ['burgar', 'berger', 'burgur', 'burgerr'],
    'sandwich': ['sandwitch', 'sandwish', 'sandwhich', 'sanwich', 'sandwch'],
    'pasta': ['psta', 'pastaa'],
    'noodles': ['noodels', 'nudels', 'noodls', 'noodless'],
    'tandoori': ['tanduri', 'tandoory', 'tandori', 'tandhori'],
    'malai': ['malay', 'malaii', 'mlai'],
    'tikka': ['tika', 'tikaa', 'tikha'],
    'masala': ['masla', 'masalla', 'msala'],
    'dal': ['daal', 'dhal', 'dhaal', 'dall'],
    'paratha': ['parantha', 'pratha', 'paratha', 'partha', 'paratha'],
    'thali': ['thaali', 'thalli', 'thaly'],
    'chole': ['chhole', 'chola', 'cholay', 'choley'],
    'pav bhaji': ['pavbhaji', 'pav baji', 'pavbaji'],
    'vada pav': ['vadapav', 'vada paw', 'vadapaw', 'wada pav'],
    'poha': ['pohe', 'pohaa', 'pohay'],
    'bhel': ['bhell', 'bhel puri', 'bhelpuri'],
    'pani puri': ['panipuri', 'pani poori', 'golgappa', 'gol gappa', 'gol gappe'],
    'chaat': ['chat', 'chatt', 'chaaat'],
    'lassi': ['lasi', 'lassie', 'lasee'],
    'kulfi': ['kulfy', 'kulfee', 'kulphee'],
    'gulab jamun': ['gulabjamun', 'gulab jamoon', 'gulab jaman'],
    'jalebi': ['jaleby', 'jilebi', 'jalebii'],
    'rasgulla': ['rasogulla', 'rasgula', 'rosogulla'],
    'kheer': ['khir', 'khear', 'kher'],
    'milkshake': ['milk shake', 'milkshek', 'milkshake'],
    'juice': ['juce', 'juuce', 'joos'],
    'roll': ['rool', 'rol'],
    'wrap': ['warp', 'wrrap', 'raap'],
    'frankie': ['franky', 'frankee', 'frankii'],
    'schezwan': ['shezwan', 'schezuan', 'szechuan', 'sezwan'],
    'mughlai': ['mughlaii', 'mughlae', 'mughlay'],
    'cake': ['cakee', 'kake', 'caek'],
    'pastry': ['pastri', 'pastree', 'pastery'],
    'brownie': ['brownee', 'browny', 'brownii'],
    'cookie': ['coookie', 'cooky', 'cokie'],
    'ice cream': ['icecream', 'ice creem', 'icecrem'],
    'chocolate': ['choclate', 'chocklate', 'chocolat', 'chocholate', 'chocalate'],
    'vanilla': ['vanila', 'vanilla', 'vanela'],
    'strawberry': ['stawberry', 'strawbery', 'strabery'],
    'butterscotch': ['buterscotch', 'butterscoch', 'butterscoch'],
    
    // --- HOME SERVICES ---
    'electrician': ['electrican', 'electritian', 'electrian', 'eletricain', 'electricin', 'electrisan', 'bijli wala', 'bijliwala'],
    'plumber': ['plumer', 'plumber', 'plummber', 'plamer', 'plumbar', 'nalwala', 'nal wala'],
    'carpenter': ['carpanter', 'carpeter', 'carpnter', 'carpinter', 'mistri'],
    'painter': ['paintar', 'paynter', 'panther', 'penter', 'pentar'],
    'pest control': ['pestcontrol', 'pest contol', 'pest kontrol', 'kide marne wala'],
    'ac repair': ['ac repir', 'ac ripar', 'ac repar', 'air conditioner repair', 'ac service'],
    'appliance repair': ['appliance repir', 'appliance ripar', 'appliance repar'],
    
    // --- BEAUTY / SALON ---
    'beauty parlor': ['beauty parlour', 'beauty parlar', 'buty parlor', 'beauty salon', 'byuti parlar'],
    'haircut': ['hair cut', 'harecut', 'harcut', 'baal katna'],
    'facial': ['facal', 'fecial', 'ficial', 'fecal'],
    'manicure': ['menicure', 'manikure', 'mannicure'],
    'pedicure': ['pedicur', 'pedikure', 'paddikure'],
    'waxing': ['waxin', 'vaxing', 'waksing'],
    'threading': ['threding', 'threeding', 'thrading'],
    'massage': ['masage', 'masaj', 'massage'],
    'bridal': ['bridel', 'bridol', 'braidel', 'bridal makeup'],
    'mehendi': ['mehndi', 'mehandi', 'mehandi', 'heena', 'henna'],
    
    // --- GROCERY ---
    'grocery': ['grocerry', 'grocary', 'grosery', 'groosry', 'kirana'],
    'vegetables': ['vegtables', 'vegatables', 'vegitables', 'sabji', 'sabzi'],
    'fruits': ['fruts', 'froots', 'fuits', 'phal'],
    'milk': ['milkk', 'doodh', 'dudh'],
    'bread': ['bred', 'braed', 'pav'],
    'rice': ['ryce', 'chawal', 'chaval'],
    'flour': ['flowr', 'flor', 'atta', 'aata', 'maida'],
    'sugar': ['suagar', 'suger', 'cheeni', 'chini'],
    'oil': ['oyl', 'tel'],
    'spices': ['spicees', 'masale', 'masalay'],
    'eggs': ['egs', 'ande', 'egg'],
    'butter': ['butar', 'buttar', 'makhan'],
    
    // --- RENTAL / PROPERTY ---
    'rental': ['rentel', 'rantal', 'kiraya', 'rent'],
    'apartment': ['appartment', 'apartmant', 'apartement', 'flat'],
    'house': ['hous', 'ghar', 'home'],
    'room': ['rom', 'ruum', 'kamra'],
    'pg': ['paying guest', 'payingguest'],
    'bhk': ['bedroom', 'bedrom'],
  };

  // Resolve a misspelled query to its canonical term(s)
  private resolveSearchQuery(query: string): { resolvedQuery: string; didYouMean: string | null } {
    const lowerQuery = query.toLowerCase().trim();
    
    // 1. Check if the query itself is a canonical term
    if (this.searchSynonyms[lowerQuery]) {
      return { resolvedQuery: lowerQuery, didYouMean: null };
    }
    
    // 2. Check if the query matches any synonym
    for (const [canonical, aliases] of Object.entries(this.searchSynonyms)) {
      if (aliases.includes(lowerQuery)) {
        return { resolvedQuery: canonical, didYouMean: canonical };
      }
    }
    
    // 3. Partial match — check if query is a substring of any synonym
    for (const [canonical, aliases] of Object.entries(this.searchSynonyms)) {
      for (const alias of aliases) {
        if (alias.startsWith(lowerQuery) || lowerQuery.startsWith(alias)) {
          return { resolvedQuery: canonical, didYouMean: canonical };
        }
      }
    }
    
    // 4. No match — return as-is
    return { resolvedQuery: lowerQuery, didYouMean: null };
  }

  async searchGlobal(query: string) {
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) {
      return {
        services: [], restaurants: [], streetFood: [], menuItems: [], cakes: [], grocery: [], rentals: [],
        didYouMean: null
      };
    }

    // Step 1: Resolve synonyms first
    const { resolvedQuery, didYouMean } = this.resolveSearchQuery(sanitizedQuery);
    
    // Step 2: Build fuzzy SQL using pg_trgm similarity + ILIKE fallback
    const likePattern = `%${resolvedQuery}%`;
    // Also search with original query in case synonym resolution isn't needed
    const originalLikePattern = `%${sanitizedQuery.toLowerCase()}%`;

    const [services, restaurants, streetFood, menuItems, cakes, grocery, rentals] = await Promise.all([
      // Services — fuzzy match on category name
      db.select({
        id: serviceCategories.id,
        name: serviceCategories.name,
        slug: serviceCategories.slug,
        icon: serviceCategories.icon,
        description: serviceCategories.description,
      }).from(serviceCategories)
        .where(sql`(
          similarity(LOWER(${serviceCategories.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${serviceCategories.name}) LIKE ${likePattern}
          OR LOWER(${serviceCategories.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${serviceCategories.name}), ${resolvedQuery}) DESC`)
        .limit(8),

      // Restaurants & Providers — fuzzy match on business name
      db.query.serviceProviders.findMany({
        where: and(
          sql`(
            similarity(LOWER(${serviceProviders.businessName}), ${resolvedQuery}) > 0.15
            OR LOWER(${serviceProviders.businessName}) LIKE ${likePattern}
            OR LOWER(${serviceProviders.businessName}) LIKE ${originalLikePattern}
          )`,
          eq(serviceProviders.isAvailable, true)
        ),
        limit: 8
      }),

      // Street Food — fuzzy match on name
      db.select({
        id: streetFoodItems.id,
        name: streetFoodItems.name,
        providerId: streetFoodItems.providerId,
        price: streetFoodItems.price,
        imageUrl: streetFoodItems.imageUrl,
        description: streetFoodItems.description,
        isPopular: streetFoodItems.isPopular,
        isVeg: streetFoodItems.isVeg,
      }).from(streetFoodItems)
        .where(sql`(
          similarity(LOWER(${streetFoodItems.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${streetFoodItems.name}) LIKE ${likePattern}
          OR LOWER(${streetFoodItems.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${streetFoodItems.name}), ${resolvedQuery}) DESC`)
        .limit(10),

      // Restaurant Menu Items — fuzzy match on name, category, cuisine
      db.select({
        id: restaurantMenuItems.id,
        name: restaurantMenuItems.name,
        providerId: restaurantMenuItems.providerId,
        price: restaurantMenuItems.price,
        imageUrl: restaurantMenuItems.imageUrl,
        description: restaurantMenuItems.description,
        isVeg: restaurantMenuItems.isVeg,
        category: restaurantMenuItems.category,
        providerName: serviceProviders.businessName,
        providerImage: serviceProviders.profileImageUrl
      }).from(restaurantMenuItems)
        .leftJoin(serviceProviders, eq(restaurantMenuItems.providerId, serviceProviders.id))
        .where(sql`(
          similarity(LOWER(${restaurantMenuItems.name}), ${resolvedQuery}) > 0.15
          OR similarity(LOWER(COALESCE(${restaurantMenuItems.category}, '')), ${resolvedQuery}) > 0.2
          OR similarity(LOWER(COALESCE(${restaurantMenuItems.cuisine}, '')), ${resolvedQuery}) > 0.2
          OR LOWER(${restaurantMenuItems.name}) LIKE ${likePattern}
          OR LOWER(COALESCE(${restaurantMenuItems.category}, '')) LIKE ${likePattern}
          OR LOWER(COALESCE(${restaurantMenuItems.cuisine}, '')) LIKE ${likePattern}
          OR LOWER(${restaurantMenuItems.name}) LIKE ${originalLikePattern}
          OR LOWER(COALESCE(${restaurantMenuItems.category}, '')) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${restaurantMenuItems.name}), ${resolvedQuery}) DESC`)
        .limit(50),

      // Cakes — fuzzy match on name
      db.select().from(cakeProducts)
        .where(sql`(
          similarity(LOWER(${cakeProducts.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${cakeProducts.name}) LIKE ${likePattern}
          OR LOWER(${cakeProducts.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${cakeProducts.name}), ${resolvedQuery}) DESC`)
        .limit(10),

      // Grocery — fuzzy match on name
      db.select().from(groceryProducts)
        .where(sql`(
          similarity(LOWER(${groceryProducts.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${groceryProducts.name}) LIKE ${likePattern}
          OR LOWER(${groceryProducts.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${groceryProducts.name}), ${resolvedQuery}) DESC`)
        .limit(10),

      // Rental Properties — fuzzy match on title and locality
      db.select().from(rentalProperties)
        .where(sql`(
          similarity(LOWER(${rentalProperties.title}), ${resolvedQuery}) > 0.15
          OR similarity(LOWER(COALESCE(${rentalProperties.locality}, '')), ${resolvedQuery}) > 0.15
          OR LOWER(${rentalProperties.title}) LIKE ${likePattern}
          OR LOWER(COALESCE(${rentalProperties.locality}, '')) LIKE ${likePattern}
          OR LOWER(${rentalProperties.title}) LIKE ${originalLikePattern}
          OR LOWER(COALESCE(${rentalProperties.locality}, '')) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${rentalProperties.title}), ${resolvedQuery}) DESC`)
        .limit(8)
    ]);

    return {
      services, restaurants, streetFood, menuItems, cakes, grocery, rentals,
      didYouMean
    };
  }

  async searchSuggestions(query: string): Promise<{ suggestions: string[]; didYouMean: string | null }> {
    if (!query.trim()) return { suggestions: [], didYouMean: null };

    const { resolvedQuery, didYouMean } = this.resolveSearchQuery(query);
    const likePattern = `%${resolvedQuery}%`;
    const originalLikePattern = `%${query.toLowerCase()}%`;

    const [services, restaurants, streetFood, menuItems, cakes, grocery] = await Promise.all([
      db.select({ name: serviceCategories.name }).from(serviceCategories)
        .where(sql`(
          similarity(LOWER(${serviceCategories.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${serviceCategories.name}) LIKE ${likePattern}
          OR LOWER(${serviceCategories.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${serviceCategories.name}), ${resolvedQuery}) DESC`)
        .limit(3),
      db.query.serviceProviders.findMany({
        where: sql`(
            similarity(LOWER(${serviceProviders.businessName}), ${resolvedQuery}) > 0.15
            OR LOWER(${serviceProviders.businessName}) LIKE ${likePattern}
            OR LOWER(${serviceProviders.businessName}) LIKE ${originalLikePattern}
          )`,
        limit: 3,
        columns: { businessName: true }
      }),
      db.select({ name: streetFoodItems.name }).from(streetFoodItems)
        .where(sql`(
          similarity(LOWER(${streetFoodItems.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${streetFoodItems.name}) LIKE ${likePattern}
          OR LOWER(${streetFoodItems.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${streetFoodItems.name}), ${resolvedQuery}) DESC`)
        .limit(3),
      db.select({ name: restaurantMenuItems.name }).from(restaurantMenuItems)
        .where(sql`(
          similarity(LOWER(${restaurantMenuItems.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${restaurantMenuItems.name}) LIKE ${likePattern}
          OR LOWER(${restaurantMenuItems.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${restaurantMenuItems.name}), ${resolvedQuery}) DESC`)
        .limit(4),
      db.select({ name: cakeProducts.name }).from(cakeProducts)
        .where(sql`(
          similarity(LOWER(${cakeProducts.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${cakeProducts.name}) LIKE ${likePattern}
          OR LOWER(${cakeProducts.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${cakeProducts.name}), ${resolvedQuery}) DESC`)
        .limit(3),
      db.select({ name: groceryProducts.name }).from(groceryProducts)
        .where(sql`(
          similarity(LOWER(${groceryProducts.name}), ${resolvedQuery}) > 0.15
          OR LOWER(${groceryProducts.name}) LIKE ${likePattern}
          OR LOWER(${groceryProducts.name}) LIKE ${originalLikePattern}
        )`)
        .orderBy(sql`similarity(LOWER(${groceryProducts.name}), ${resolvedQuery}) DESC`)
        .limit(3),
    ]);

    const allSuggestions = [
      ...services.map(s => s.name),
      ...restaurants.map(r => r.businessName),
      ...streetFood.map(s => s.name),
      ...menuItems.map(m => m.name),
      ...cakes.map(c => c.name),
      ...grocery.map(g => g.name),
    ];

    return {
      suggestions: Array.from(new Set(allSuggestions)).slice(0, 10),
      didYouMean
    };
  }
  async getPopularRestaurantMenuItems(): Promise<(RestaurantMenuItem & { provider: ServiceProvider })[]> {
    return db.query.restaurantMenuItems.findMany({
      where: and(
        eq(restaurantMenuItems.isPopular, true),
        eq(restaurantMenuItems.isAvailable, true)
      ),
      with: {
        provider: true
      },
      orderBy: [sql`CASE WHEN ${restaurantMenuItems.popularOrder} = 0 THEN 9999 ELSE ${restaurantMenuItems.popularOrder} END ASC`]
    }) as any;
  }
}

export const storage = new DatabaseStorage();
