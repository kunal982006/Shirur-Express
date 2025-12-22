import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =========================================
// 1. BASE TABLES (Users, Categories, Templates)
// =========================================

export const users = pgTable("users", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").default("customer"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isVerified: boolean("is_verified").default(false),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceCategories = pgTable("service_categories", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
});

export const serviceTemplates = pgTable("service_templates", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  categorySlug: text("category_slug").notNull(),
  subCategory: text("sub_category").notNull(),
  name: text("name").notNull(),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
});

// =========================================
// 2. CORE PROVIDER TABLES
// =========================================

export const serviceProviders = pgTable("service_providers", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull(), // Relation defined below
  categoryId: varchar("category_id").notNull(), // Relation defined below
  businessName: text("business_name").notNull(),
  description: text("description"),
  profileImageUrl: text("profile_image_url"),
  galleryImages: jsonb("gallery_images").$type<string[]>(),
  experience: integer("experience_years"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  serviceArea: integer("service_area_km").default(10),
  isVerified: boolean("is_verified").default(false),
  isAvailable: boolean("is_available").default(true),
  specializations: jsonb("specializations").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceOfferings = pgTable("service_offerings", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").notNull(), // Linked in relations
  templateId: text("template_id"),    // Nullable for custom services
  name: text("name"), // For custom services or overriding template name
  description: text("description"),
  duration: integer("duration_minutes"), // New: Duration in minutes
  imageUrl: text("image_url"),
  categorySlug: text("category_slug"), // Needed for custom services grouping
  subCategory: text("sub_category"),   // Level 2: Haircut
  section: text("section"),            // Level 1: Hair, Skin Care, Makeover
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =========================================
// 3. BOOKINGS & INVOICES (Circular Dependency Broken Here)
// =========================================

export const bookings = pgTable("bookings", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull(),
  providerId: varchar("provider_id"),
  serviceType: text("service_type").notNull(),
  problemId: varchar("problem_id"),
  status: text("status").default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  preferredTimeSlots: jsonb("preferred_time_slots").$type<string[]>(),
  userAddress: text("user_address").notNull(),
  userPhone: text("user_phone").notNull(),
  notes: text("notes"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  isUrgent: boolean("is_urgent").default(false),
  serviceOtp: text("service_otp"),
  serviceOtpExpiresAt: timestamp("service_otp_expires_at"),
  // Removed .references() to stop crash. Relation handles it.
  invoiceId: text("invoice_id"),
});

export const invoices = pgTable("invoices", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  // Removed .references() to stop crash. Relation handles it.
  bookingId: varchar("booking_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  userId: varchar("user_id").notNull(),
  sparePartsDetails: jsonb("spare_parts_details").$type<Array<{ part: string; cost: number }>>(),
  sparePartsTotal: decimal("spare_parts_total", { precision: 10, scale: 2 }).default("0.00"),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========================================
// 4. OTHER PRODUCT TABLES
// =========================================

export const serviceProblems = pgTable("service_problems", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  categoryId: varchar("category_id").notNull(),
  name: text("name").notNull(),
  parentId: varchar("parent_id"),
  imageUrl: text("image_url"),
});

export const cakeProducts = pgTable("cake_products", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  weight: text("weight"), // Added weight field
  weightOptions: jsonb("weight_options").$type<Array<{ weight: string; price: number }>>(),
  isCustomizable: boolean("is_customizable").default(false),
  isPopular: boolean("is_popular").default(false),
});

export const groceryProducts = pgTable("grocery_products", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 256 }).notNull(),
  brand: varchar("brand", { length: 256 }),
  price: varchar("price", { length: 50 }).notNull(),
  mrp: varchar("mrp", { length: 50 }),
  weight: varchar("weight", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  inStock: boolean("in_stock").default(true).notNull(),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  imageUrl: varchar("image_url", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const streetFoodItems = pgTable("street_food_items", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: text("provider_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: text("category"),
  price: text("price").notNull(),
  isVeg: boolean("is_veg").default(true),
  isAvailable: boolean("is_available").default(true),
  spicyLevel: text("spicy_level"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const restaurantMenuItems = pgTable("restaurant_menu_items", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isVeg: boolean("is_veg").default(true),
  isAvailable: boolean("is_available").default(true),
  cuisine: text("cuisine"),
});



export const reviews = pgTable("reviews", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  bookingId: varchar("booking_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rentalProperties = pgTable("rental_properties", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  ownerId: varchar("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull(),
  rent: decimal("rent", { precision: 10, scale: 2 }).notNull(),
  area: integer("area_sqft"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  furnishing: text("furnishing"),
  address: text("address").notNull(),
  locality: text("locality"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  amenities: jsonb("amenities").$type<string[]>(),
  images: jsonb("images").$type<string[]>(),
  // Enhanced fields
  deposit: decimal("deposit", { precision: 10, scale: 2 }),
  noticePeriod: text("notice_period"),
  status: text("status").default("available"), // available, rented, sold, unavailable
  ownerNote: text("owner_note"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groceryOrders = pgTable("grocery_orders", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull(),
  items: jsonb("items").$type<Array<{ productId: string; quantity: number; price: number }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  providerId: varchar("provider_id"),
  riderId: varchar("rider_id"), // Delivery partner assigned
  deliveryOtp: text("delivery_otp"),
  deliveryOtpGeneratedAt: timestamp("delivery_otp_generated_at"),
  riderAcceptedAt: timestamp("rider_accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========================================
// DELIVERY PARTNERS TABLE
// =========================================

export const deliveryPartners = pgTable("delivery_partners", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull().unique(), // Links to users table
  vehicleType: text("vehicle_type").notNull(), // bike, scooter, car
  vehicleNumber: text("vehicle_number"),
  licenseNumber: text("license_number"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false), // Currently accepting orders
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("last_location_update"),
  totalDeliveries: integer("total_deliveries").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =========================================
// 5. ZOD SCHEMAS (Defined after tables)
// =========================================

export const insertUserSchema = createInsertSchema(users).pick({
  username: true, email: true, phone: true, password: true, role: true, address: true,
});
export const insertServiceProviderSchema = createInsertSchema(serviceProviders).pick({
  businessName: true, description: true, experience: true, address: true,
  latitude: true, longitude: true, specializations: true, profileImageUrl: true,
});
export const insertBookingSchema = createInsertSchema(bookings).pick({
  serviceType: true, problemId: true, scheduledAt: true, preferredTimeSlots: true,
  userAddress: true, userPhone: true, notes: true, isUrgent: true, providerId: true,
});
export const insertGroceryOrderSchema = createInsertSchema(groceryOrders).pick({
  items: true, subtotal: true, platformFee: true, deliveryFee: true, total: true, deliveryAddress: true, providerId: true,
});
export const insertRentalPropertySchema = createInsertSchema(rentalProperties).pick({
  title: true, description: true, propertyType: true, rent: true, area: true,
  bedrooms: true, bathrooms: true, furnishing: true, address: true, locality: true,
  latitude: true, longitude: true, amenities: true, images: true,
  deposit: true, noticePeriod: true, status: true, ownerNote: true,
  contactPhone: true, contactEmail: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  bookingId: true, providerId: true, userId: true, sparePartsDetails: true,
  sparePartsTotal: true, serviceCharge: true, totalAmount: true,
});
export const insertServiceTemplateSchema = createInsertSchema(serviceTemplates).pick({
  categorySlug: true, subCategory: true, name: true, defaultPrice: true, imageUrl: true,
});
export const insertStreetFoodItemSchema = createInsertSchema(streetFoodItems).pick({
  name: true, description: true, imageUrl: true, category: true, price: true, isVeg: true, isAvailable: true, spicyLevel: true, providerId: true
});
export const insertServiceOfferingSchema = z.object({
  providerId: z.string(),
  templateId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  duration: z.number().optional(), // minutes
  imageUrl: z.string().optional(),
  categorySlug: z.string().optional(),
  subCategory: z.string().optional(),
  section: z.string().optional(),
  price: z.string(),
  isActive: z.boolean().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type GroceryOrder = typeof groceryOrders.$inferSelect;
export type InsertGroceryOrder = z.infer<typeof insertGroceryOrderSchema>;
export type RentalProperty = typeof rentalProperties.$inferSelect;
export type InsertRentalProperty = z.infer<typeof insertRentalPropertySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ServiceProblem = typeof serviceProblems.$inferSelect;
export type CakeProduct = typeof cakeProducts.$inferSelect;
export type GroceryProduct = typeof groceryProducts.$inferSelect;
export type StreetFoodItem = typeof streetFoodItems.$inferSelect;
export type RestaurantMenuItem = typeof restaurantMenuItems.$inferSelect;

export type Review = typeof reviews.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type ServiceTemplate = typeof serviceTemplates.$inferSelect;
export type InsertServiceTemplate = z.infer<typeof insertServiceTemplateSchema>;
export type InsertStreetFoodItem = z.infer<typeof insertStreetFoodItemSchema>;
export type ServiceOffering = typeof serviceOfferings.$inferSelect;
export type InsertServiceOffering = z.infer<typeof insertServiceOfferingSchema>;
export type DeliveryPartner = typeof deliveryPartners.$inferSelect;

export const insertDeliveryPartnerSchema = createInsertSchema(deliveryPartners).pick({
  vehicleType: true, vehicleNumber: true, licenseNumber: true, profileImageUrl: true,
});
export type InsertDeliveryPartner = z.infer<typeof insertDeliveryPartnerSchema>;

// =========================================
// 6. RELATIONS (STRICTLY AT THE BOTTOM)
// =========================================

export const usersRelations = relations(users, ({ many, one }) => ({
  serviceProviders: many(serviceProviders),
  bookings: many(bookings),
  reviews: many(reviews),
  rentalProperties: many(rentalProperties),
  groceryOrders: many(groceryOrders),
  invoices: many(invoices),
  deliveryPartner: one(deliveryPartners, { fields: [users.id], references: [deliveryPartners.userId] }),
}));

export const deliveryPartnersRelations = relations(deliveryPartners, ({ one }) => ({
  user: one(users, { fields: [deliveryPartners.userId], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  provider: one(serviceProviders, { fields: [bookings.providerId], references: [serviceProviders.id] }),
  problem: one(serviceProblems, { fields: [bookings.problemId], references: [serviceProblems.id] }),
  invoice: one(invoices, { fields: [bookings.invoiceId], references: [invoices.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
  provider: one(serviceProviders, { fields: [invoices.providerId], references: [serviceProviders.id] }),
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
}));

export const groceryProductsRelations = relations(groceryProducts, ({ one }) => ({
  provider: one(serviceProviders, { fields: [groceryProducts.providerId], references: [serviceProviders.id] }),
}));

export const serviceProvidersRelations = relations(serviceProviders, ({ one, many }) => ({
  user: one(users, { fields: [serviceProviders.userId], references: [users.id] }),
  category: one(serviceCategories, { fields: [serviceProviders.categoryId], references: [serviceCategories.id] }),
  bookings: many(bookings),
  reviews: many(reviews),
  // The ALIAS that matches your Backend Code
  beautyServices: many(serviceOfferings),
  cakeProducts: many(cakeProducts),
  streetFoodItems: many(streetFoodItems),
  restaurantMenuItems: many(restaurantMenuItems),
  restaurantOrders: many(restaurantOrders),
  groceryProducts: many(groceryProducts),
  invoices: many(invoices),
}));

export const serviceOfferingsRelations = relations(serviceOfferings, ({ one }) => ({
  provider: one(serviceProviders, { fields: [serviceOfferings.providerId], references: [serviceProviders.id] }),
  template: one(serviceTemplates, { fields: [serviceOfferings.templateId], references: [serviceTemplates.id] }),
}));

// =========================================
// MISSING RELATIONS (Add these at the bottom)
// =========================================

export const cakeProductsRelations = relations(cakeProducts, ({ one }) => ({
  provider: one(serviceProviders, {
    fields: [cakeProducts.providerId],
    references: [serviceProviders.id],
  }),
}));

export const streetFoodItemsRelations = relations(streetFoodItems, ({ one }) => ({
  provider: one(serviceProviders, {
    fields: [streetFoodItems.providerId],
    references: [serviceProviders.id],
  }),
}));

export const restaurantMenuItemsRelations = relations(restaurantMenuItems, ({ one }) => ({
  provider: one(serviceProviders, {
    fields: [restaurantMenuItems.providerId],
    references: [serviceProviders.id],
  }),
}));



export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  provider: one(serviceProviders, {
    fields: [reviews.providerId],
    references: [serviceProviders.id],
  }),
}));

// =========================================
// 7. STREET FOOD ORDERS (NEW)
// =========================================


export const streetFoodOrders = pgTable("street_food_orders", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull(),
  providerId: varchar("provider_id").notNull(), // Street food orders might be single provider too
  items: jsonb("items").$type<Array<{ productId: string; quantity: number; price: number; name: string; providerId: string }>>(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStreetFoodOrderSchema = createInsertSchema(streetFoodOrders).pick({
  items: true, totalAmount: true, deliveryAddress: true, providerId: true,
});

export type StreetFoodOrder = typeof streetFoodOrders.$inferSelect;
export type InsertStreetFoodOrder = z.infer<typeof insertStreetFoodOrderSchema>;

export const restaurantOrders = pgTable("restaurant_orders", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  riderId: varchar("rider_id"), // Nullable initially
  items: jsonb("items").$type<Array<{ menuItemId: string; quantity: number; name: string; price: number }>>(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").default("pending"), // pending, accepted, preparing, ready_for_pickup, picked_up, out_for_delivery, delivered, declined, cancelled
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  deliveryOtp: text("delivery_otp"),
  deliveryOtpGeneratedAt: timestamp("delivery_otp_generated_at"),
  riderAcceptedAt: timestamp("rider_accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRestaurantOrderSchema = createInsertSchema(restaurantOrders).pick({
  items: true, totalAmount: true, deliveryAddress: true, providerId: true,
});

export type RestaurantOrder = typeof restaurantOrders.$inferSelect;
export type InsertRestaurantOrder = z.infer<typeof insertRestaurantOrderSchema>;

export const streetFoodOrdersRelations = relations(streetFoodOrders, ({ one }) => ({
  user: one(users, {
    fields: [streetFoodOrders.userId],
    references: [users.id],
  }),
}));

export const restaurantOrdersRelations = relations(restaurantOrders, ({ one }) => ({
  user: one(users, {
    fields: [restaurantOrders.userId],
    references: [users.id],
  }),
  provider: one(serviceProviders, {
    fields: [restaurantOrders.providerId],
    references: [serviceProviders.id],
  }),
  rider: one(users, {
    fields: [restaurantOrders.riderId],
    references: [users.id],
  }),
}));