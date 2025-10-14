import { 
  users, serviceProviders, serviceCategories, serviceProblems, 
  beautyServices, cakeProducts, groceryProducts, rentalProperties,
  bookings, groceryOrders, reviews, streetFoodItems, restaurantMenuItems, tableBookings,
  type User, type InsertUser, type ServiceProvider, type InsertServiceProvider,
  type Booking, type InsertBooking, type GroceryOrder, type InsertGroceryOrder,
  type RentalProperty, type InsertRentalProperty, type ServiceCategory,
  type ServiceProblem, type BeautyService, type CakeProduct, type GroceryProduct,
  type Review, type StreetFoodItem, type RestaurantMenuItem, type TableBooking, type InsertTableBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User>;

  // Service provider operations
  getServiceProviders(categorySlug?: string, latitude?: number, longitude?: number, radius?: number): Promise<(ServiceProvider & { user: User; category: ServiceCategory })[]>;
  getServiceProvider(id: string): Promise<(ServiceProvider & { user: User; category: ServiceCategory }) | undefined>;
  createServiceProvider(provider: InsertServiceProvider & { userId: string; categoryId: string }): Promise<ServiceProvider>;
  updateProviderRating(providerId: string, newRating: number, reviewCount: number): Promise<ServiceProvider>;

  // Service categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(slug: string): Promise<ServiceCategory | undefined>;

  // Service problems (for electrician/plumber)
  getServiceProblems(categoryId: string, parentId?: string): Promise<ServiceProblem[]>;

  // Beauty services
  getBeautyServices(providerId: string): Promise<BeautyService[]>;

  // Cake products
  getCakeProducts(providerId: string): Promise<CakeProduct[]>;

  // Grocery products
  getGroceryProducts(category?: string, search?: string): Promise<GroceryProduct[]>;
  getGroceryProduct(id: string): Promise<GroceryProduct | undefined>;

  // Rental properties
  getRentalProperties(filters: {
    propertyType?: string;
    minRent?: number;
    maxRent?: number;
    furnishing?: string;
    locality?: string;
  }): Promise<(RentalProperty & { owner: User })[]>;
  getRentalProperty(id: string): Promise<(RentalProperty & { owner: User }) | undefined>;
  createRentalProperty(property: InsertRentalProperty & { ownerId: string }): Promise<RentalProperty>;

  // Bookings
  createBooking(booking: InsertBooking & { userId: string; providerId?: string }): Promise<Booking>;
  getBooking(id: string): Promise<(Booking & { user: User; provider?: ServiceProvider }) | undefined>;
  updateBookingStatus(id: string, status: string, providerId?: string): Promise<Booking>;
  getUserBookings(userId: string): Promise<(Booking & { provider?: ServiceProvider })[]>;
  getProviderBookings(providerId: string): Promise<(Booking & { user: User })[]>;

  // Grocery orders
  createGroceryOrder(order: InsertGroceryOrder & { userId: string }): Promise<GroceryOrder>;
  getGroceryOrder(id: string): Promise<GroceryOrder | undefined>;
  updateOrderPaymentId(orderId: string, paymentIntentId: string): Promise<GroceryOrder>;

  // Reviews
  createReview(review: { userId: string; providerId: string; bookingId?: string; rating: number; comment?: string }): Promise<Review>;
  getProviderReviews(providerId: string): Promise<(Review & { user: User })[]>;

  // Street food items
  getStreetFoodItems(providerId?: string): Promise<StreetFoodItem[]>;

  // Restaurant menu items
  getRestaurantMenuItems(providerId?: string): Promise<RestaurantMenuItem[]>;

  // Table bookings
  createTableBooking(booking: InsertTableBooking & { userId: string; providerId: string }): Promise<TableBooking>;
  getTableBooking(id: string): Promise<TableBooking | undefined>;
  updateTableBookingStatus(id: string, status: string): Promise<TableBooking>;
  getUserTableBookings(userId: string): Promise<TableBooking[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: info.customerId,
        stripeSubscriptionId: info.subscriptionId 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getServiceProviders(categorySlug?: string, latitude?: number, longitude?: number, radius?: number) {
    const conditions = [eq(serviceProviders.isAvailable, true)];
    
    if (categorySlug) {
      conditions.push(eq(serviceCategories.slug, categorySlug));
    }

    // Add distance-based filtering if coordinates provided
    if (latitude && longitude && radius) {
      conditions.push(
        sql`(
          6371 * acos(
            cos(radians(${latitude})) 
            * cos(radians(${serviceProviders.latitude})) 
            * cos(radians(${serviceProviders.longitude}) - radians(${longitude}))
            + sin(radians(${latitude})) 
            * sin(radians(${serviceProviders.latitude}))
          )
        ) <= ${radius}`
      );
    }

    const results = await db
      .select({
        id: serviceProviders.id,
        userId: serviceProviders.userId,
        categoryId: serviceProviders.categoryId,
        businessName: serviceProviders.businessName,
        description: serviceProviders.description,
        experience: serviceProviders.experience,
        rating: serviceProviders.rating,
        reviewCount: serviceProviders.reviewCount,
        address: serviceProviders.address,
        latitude: serviceProviders.latitude,
        longitude: serviceProviders.longitude,
        serviceArea: serviceProviders.serviceArea,
        isVerified: serviceProviders.isVerified,
        isAvailable: serviceProviders.isAvailable,
        specializations: serviceProviders.specializations,
        createdAt: serviceProviders.createdAt,
        user: users,
        category: serviceCategories,
      })
      .from(serviceProviders)
      .leftJoin(users, eq(serviceProviders.userId, users.id))
      .leftJoin(serviceCategories, eq(serviceProviders.categoryId, serviceCategories.id))
      .where(and(...conditions))
      .orderBy(desc(serviceProviders.rating));

    return results as any;
  }

  async getServiceProvider(id: string) {
    const [result] = await db
      .select({
        id: serviceProviders.id,
        userId: serviceProviders.userId,
        categoryId: serviceProviders.categoryId,
        businessName: serviceProviders.businessName,
        description: serviceProviders.description,
        experience: serviceProviders.experience,
        rating: serviceProviders.rating,
        reviewCount: serviceProviders.reviewCount,
        address: serviceProviders.address,
        latitude: serviceProviders.latitude,
        longitude: serviceProviders.longitude,
        serviceArea: serviceProviders.serviceArea,
        isVerified: serviceProviders.isVerified,
        isAvailable: serviceProviders.isAvailable,
        specializations: serviceProviders.specializations,
        createdAt: serviceProviders.createdAt,
        user: users,
        category: serviceCategories,
      })
      .from(serviceProviders)
      .leftJoin(users, eq(serviceProviders.userId, users.id))
      .leftJoin(serviceCategories, eq(serviceProviders.categoryId, serviceCategories.id))
      .where(eq(serviceProviders.id, id));

    return result as any;
  }

  async createServiceProvider(provider: InsertServiceProvider & { userId: string; categoryId: string }): Promise<ServiceProvider> {
    const [newProvider] = await db.insert(serviceProviders).values([provider]).returning();
    return newProvider;
  }

  async updateProviderRating(providerId: string, newRating: number, reviewCount: number): Promise<ServiceProvider> {
    const [provider] = await db
      .update(serviceProviders)
      .set({ rating: newRating.toFixed(2), reviewCount })
      .where(eq(serviceProviders.id, providerId))
      .returning();
    return provider;
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories);
  }

  async getServiceCategory(slug: string): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, slug));
    return category;
  }

  async getServiceProblems(categoryId: string, parentId?: string): Promise<ServiceProblem[]> {
    const conditions = [eq(serviceProblems.categoryId, categoryId)];
    
    if (parentId) {
      conditions.push(eq(serviceProblems.parentId, parentId));
    } else {
      conditions.push(sql`${serviceProblems.parentId} IS NULL`);
    }

    return db.select().from(serviceProblems).where(and(...conditions));
  }

  async getBeautyServices(providerId: string): Promise<BeautyService[]> {
    return db.select().from(beautyServices).where(eq(beautyServices.providerId, providerId));
  }

  async getCakeProducts(providerId: string): Promise<CakeProduct[]> {
    return db.select().from(cakeProducts).where(eq(cakeProducts.providerId, providerId));
  }

  async getGroceryProducts(category?: string, search?: string): Promise<GroceryProduct[]> {
    const conditions = [eq(groceryProducts.inStock, true)];

    if (category) {
      conditions.push(eq(groceryProducts.category, category));
    }

    if (search) {
      conditions.push(sql`${groceryProducts.name} ILIKE ${`%${search}%`}`);
    }

    return db.select().from(groceryProducts).where(and(...conditions)).orderBy(asc(groceryProducts.name));
  }

  async getGroceryProduct(id: string): Promise<GroceryProduct | undefined> {
    const [product] = await db.select().from(groceryProducts).where(eq(groceryProducts.id, id));
    return product;
  }

  async getRentalProperties(filters: {
    propertyType?: string;
    minRent?: number;
    maxRent?: number;
    furnishing?: string;
    locality?: string;
  }) {
    const conditions = [eq(rentalProperties.isAvailable, true)];

    if (filters.propertyType) {
      conditions.push(eq(rentalProperties.propertyType, filters.propertyType));
    }
    if (filters.minRent) {
      conditions.push(sql`${rentalProperties.rent} >= ${filters.minRent}`);
    }
    if (filters.maxRent) {
      conditions.push(sql`${rentalProperties.rent} <= ${filters.maxRent}`);
    }
    if (filters.furnishing) {
      conditions.push(eq(rentalProperties.furnishing, filters.furnishing));
    }
    if (filters.locality) {
      conditions.push(sql`${rentalProperties.locality} ILIKE ${`%${filters.locality}%`}`);
    }

    const results = await db
      .select({
        id: rentalProperties.id,
        ownerId: rentalProperties.ownerId,
        title: rentalProperties.title,
        description: rentalProperties.description,
        propertyType: rentalProperties.propertyType,
        rent: rentalProperties.rent,
        area: rentalProperties.area,
        bedrooms: rentalProperties.bedrooms,
        bathrooms: rentalProperties.bathrooms,
        furnishing: rentalProperties.furnishing,
        address: rentalProperties.address,
        locality: rentalProperties.locality,
        latitude: rentalProperties.latitude,
        longitude: rentalProperties.longitude,
        amenities: rentalProperties.amenities,
        images: rentalProperties.images,
        isAvailable: rentalProperties.isAvailable,
        createdAt: rentalProperties.createdAt,
        owner: users,
      })
      .from(rentalProperties)
      .leftJoin(users, eq(rentalProperties.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(rentalProperties.createdAt));

    return results as any;
  }

  async getRentalProperty(id: string) {
    const [result] = await db
      .select({
        id: rentalProperties.id,
        ownerId: rentalProperties.ownerId,
        title: rentalProperties.title,
        description: rentalProperties.description,
        propertyType: rentalProperties.propertyType,
        rent: rentalProperties.rent,
        area: rentalProperties.area,
        bedrooms: rentalProperties.bedrooms,
        bathrooms: rentalProperties.bathrooms,
        furnishing: rentalProperties.furnishing,
        address: rentalProperties.address,
        locality: rentalProperties.locality,
        latitude: rentalProperties.latitude,
        longitude: rentalProperties.longitude,
        amenities: rentalProperties.amenities,
        images: rentalProperties.images,
        isAvailable: rentalProperties.isAvailable,
        createdAt: rentalProperties.createdAt,
        owner: users,
      })
      .from(rentalProperties)
      .leftJoin(users, eq(rentalProperties.ownerId, users.id))
      .where(eq(rentalProperties.id, id));

    return result as any;
  }

  async createRentalProperty(property: InsertRentalProperty & { ownerId: string }): Promise<RentalProperty> {
    const [newProperty] = await db.insert(rentalProperties).values([property]).returning();
    return newProperty;
  }

  async createBooking(booking: InsertBooking & { userId: string; providerId?: string }): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values([booking]).returning();
    return newBooking;
  }

  async getBooking(id: string) {
    const [result] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        providerId: bookings.providerId,
        serviceType: bookings.serviceType,
        problemId: bookings.problemId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        preferredTimeSlots: bookings.preferredTimeSlots,
        userAddress: bookings.userAddress,
        userPhone: bookings.userPhone,
        notes: bookings.notes,
        estimatedCost: bookings.estimatedCost,
        createdAt: bookings.createdAt,
        user: users,
        provider: serviceProviders,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(serviceProviders, eq(bookings.providerId, serviceProviders.id))
      .where(eq(bookings.id, id));

    return result as any;
  }

  async updateBookingStatus(id: string, status: string, providerId?: string): Promise<Booking> {
    const updateData: any = { status };
    if (providerId) {
      updateData.providerId = providerId;
    }

    const [booking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getUserBookings(userId: string) {
    const results = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        providerId: bookings.providerId,
        serviceType: bookings.serviceType,
        problemId: bookings.problemId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        preferredTimeSlots: bookings.preferredTimeSlots,
        userAddress: bookings.userAddress,
        userPhone: bookings.userPhone,
        notes: bookings.notes,
        estimatedCost: bookings.estimatedCost,
        createdAt: bookings.createdAt,
        provider: serviceProviders,
      })
      .from(bookings)
      .leftJoin(serviceProviders, eq(bookings.providerId, serviceProviders.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    return results as any;
  }

  async getProviderBookings(providerId: string) {
    const results = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        providerId: bookings.providerId,
        serviceType: bookings.serviceType,
        problemId: bookings.problemId,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        preferredTimeSlots: bookings.preferredTimeSlots,
        userAddress: bookings.userAddress,
        userPhone: bookings.userPhone,
        notes: bookings.notes,
        estimatedCost: bookings.estimatedCost,
        createdAt: bookings.createdAt,
        user: users,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.providerId, providerId))
      .orderBy(desc(bookings.createdAt));

    return results as any;
  }

  async createGroceryOrder(order: InsertGroceryOrder & { userId: string }): Promise<GroceryOrder> {
    const [newOrder] = await db.insert(groceryOrders).values([order]).returning();
    return newOrder;
  }

  async getGroceryOrder(id: string): Promise<GroceryOrder | undefined> {
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, id));
    return order;
  }

  async updateOrderPaymentId(orderId: string, paymentIntentId: string): Promise<GroceryOrder> {
    const [order] = await db
      .update(groceryOrders)
      .set({ stripePaymentIntentId: paymentIntentId })
      .where(eq(groceryOrders.id, orderId))
      .returning();
    return order;
  }

  async createReview(review: { userId: string; providerId: string; bookingId?: string; rating: number; comment?: string }): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();

    // Update provider rating
    const providerReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, review.providerId));

    const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    await this.updateProviderRating(review.providerId, avgRating, providerReviews.length);

    return newReview;
  }

  async getProviderReviews(providerId: string) {
    const results = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        providerId: reviews.providerId,
        bookingId: reviews.bookingId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        user: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));

    return results as any;
  }

  async getStreetFoodItems(providerId?: string): Promise<StreetFoodItem[]> {
    if (providerId) {
      return db.select().from(streetFoodItems).where(eq(streetFoodItems.providerId, providerId));
    }
    return db.select().from(streetFoodItems).where(eq(streetFoodItems.isAvailable, true));
  }

  async getRestaurantMenuItems(providerId?: string): Promise<RestaurantMenuItem[]> {
    if (providerId) {
      return db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.providerId, providerId));
    }
    return db.select().from(restaurantMenuItems).where(eq(restaurantMenuItems.isAvailable, true));
  }

  async createTableBooking(booking: InsertTableBooking & { userId: string; providerId: string }): Promise<TableBooking> {
    const [newBooking] = await db.insert(tableBookings).values(booking).returning();
    return newBooking;
  }

  async getTableBooking(id: string): Promise<TableBooking | undefined> {
    const [booking] = await db.select().from(tableBookings).where(eq(tableBookings.id, id));
    return booking;
  }

  async updateTableBookingStatus(id: string, status: string): Promise<TableBooking> {
    const [booking] = await db
      .update(tableBookings)
      .set({ status })
      .where(eq(tableBookings.id, id))
      .returning();
    return booking;
  }

  async getUserTableBookings(userId: string): Promise<TableBooking[]> {
    return db.select().from(tableBookings).where(eq(tableBookings.userId, userId)).orderBy(desc(tableBookings.createdAt));
  }
}

export const storage = new DatabaseStorage();
