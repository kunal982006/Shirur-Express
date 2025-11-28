// server/src/shared/schema.ts (UPDATED)

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


// Users table
export const users = pgTable("users", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").default("customer"), // customer, provider, admin
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service categories
export const serviceCategories = pgTable("service_categories", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
});

// Service providers
export const serviceProviders = pgTable("service_providers", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  categoryId: varchar("category_id").references(() => serviceCategories.id).notNull(),
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

// Service problems/categories (for electrician, plumber)
export const serviceProblems = pgTable("service_problems", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  categoryId: varchar("category_id").references(() => serviceCategories.id).notNull(),
  name: text("name").notNull(),
  parentId: varchar("parent_id"),
});

// Beauty services (UPDATED)
export const beautyServices = pgTable("beauty_services", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id") // providerId type matches serviceProviders.id
    .notNull()
    .references(() => serviceProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Service ka naam (e.g., "Haircut", "Facial")
  description: text("description"), // Service ki description
  imageUrl: text("image_url"), // Service ki image
  duration: integer("duration_minutes"), // Service kitni der ki hai (in minutes)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Service ki price
  category: text("category"), // Category (e.g., "Hair", "Skin", "Nails")
  subCategory: text("sub_category"), // Naya field: subCategory
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(), // Naya field: updatedAt
});

// Cake products
export const cakeProducts = pgTable("cake_products", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // Birthday, Anniversary, Wedding, Custom
  imageUrl: text("image_url"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  weightOptions: jsonb("weight_options").$type<Array<{ weight: string; price: number }>>(),
  isCustomizable: boolean("is_customizable").default(false),
});

// Grocery products
export const groceryProducts = pgTable("grocery_products", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 256 }).notNull(), // Category slug (e.g., "fruits")
  price: varchar("price", { length: 50 }).notNull(), // Price as string to handle currency symbols easily
  weight: varchar("weight", { length: 100 }), // e.g., "1 kg", "500g"
  unit: varchar("unit", { length: 50 }), // e.g., "kg", "dozen", "pack"
  inStock: boolean("in_stock").default(true).notNull(),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  imageUrl: varchar("image_url", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rental properties
export const rentalProperties = pgTable("rental_properties", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull(), // 1BHK, 2BHK, etc.
  rent: decimal("rent", { precision: 10, scale: 2 }).notNull(),
  area: integer("area_sqft"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  furnishing: text("furnishing"), // Furnished, Semi-Furnished, Unfurnished
  address: text("address").notNull(),
  locality: text("locality"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  amenities: jsonb("amenities").$type<string[]>(),
  images: jsonb("images").$type<string[]>(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings/Service requests (ELECTRICIAN FLOW KE LIYE UPDATED)
export const bookings = pgTable("bookings", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  providerId: varchar("provider_id").references(() => serviceProviders.id),
  serviceType: text("service_type").notNull(),
  problemId: varchar("problem_id").references(() => serviceProblems.id),

  // STATUS FLOW: 
  // pending -> accepted -> in_progress -> awaiting_otp -> awaiting_billing -> pending_payment -> completed
  // 'pending' se 'declined' ya 'cancelled' bhi ho sakta hai
  status: text("status").default("pending"),

  scheduledAt: timestamp("scheduled_at"),
  preferredTimeSlots: jsonb("preferred_time_slots").$type<string[]>(),
  userAddress: text("user_address").notNull(),
  userPhone: text("user_phone").notNull(),
  notes: text("notes"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }), // Yeh provider accept karte waqt de sakta hai
  createdAt: timestamp("created_at").defaultNow(),

  // --- NAYE FIELDS AAPKE ELECTRICIAN FLOW KE LIYE ---
  isUrgent: boolean("is_urgent").default(false), // Customer yeh 'true' set karega agar urgent hai
  serviceOtp: text("service_otp"), // 6-digit OTP jo provider verify karega
  serviceOtpExpiresAt: timestamp("service_otp_expires_at"), // OTP expiry time
  invoiceId: text("invoice_id").references(() => invoices.id), // Final bill/invoice se link
});

// Grocery orders
export const groceryOrders = pgTable("grocery_orders", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  items: jsonb("items").$type<Array<{ productId: string; quantity: number; price: number }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").default("pending"), // pending, confirmed, delivered, cancelled
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- YEH AAPKE FLOW KE LIYE NAYA TABLE HAI ---
// Final Invoice/Bill
export const invoices = pgTable("invoices", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull().unique(), // Har booking ka ek hi invoice
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),

  sparePartsDetails: jsonb("spare_parts_details").$type<Array<{ part: string; cost: number }>>(),
  sparePartsTotal: decimal("spare_parts_total", { precision: 10, scale: 2 }).default("0.00"),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),

  paymentStatus: text("payment_status").default("pending"), // pending, completed
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),

  createdAt: timestamp("created_at").defaultNow(),
});


// Street food menu items
export const streetFoodItems = pgTable("street_food_items", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: text("provider_id").notNull().references(() => serviceProviders.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: text("category"),
  price: text("price").notNull(),
  isVeg: boolean("is_veg").default(true),
  isAvailable: boolean("is_available").default(true),
  spicyLevel: text("spicy_level"), // Mild, Medium, Hot
  createdAt: timestamp("created_at").defaultNow(),
});

// Restaurant menu items
export const restaurantMenuItems = pgTable("restaurant_menu_items", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // Starters, Main Course, Desserts, Beverages
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isVeg: boolean("is_veg").default(true),
  isAvailable: boolean("is_available").default(true),
  cuisine: text("cuisine"), // Indian, Chinese, Italian, etc.
});

// Restaurant table bookings
export const tableBookings = pgTable("table_bookings", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  date: timestamp("booking_date").notNull(),
  timeSlot: text("time_slot").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").default("pending"), // pending, confirmed, cancelled, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  serviceProviders: many(serviceProviders),
  bookings: many(bookings),
  reviews: many(reviews),
  rentalProperties: many(rentalProperties),
  groceryOrders: many(groceryOrders),
  invoices: many(invoices), // NAYA
}));

export const serviceProvidersRelations = relations(serviceProviders, ({ one, many }) => ({
  user: one(users, {
    fields: [serviceProviders.userId],
    references: [users.id],
  }),
  category: one(serviceCategories, {
    fields: [serviceProviders.categoryId],
    references: [serviceCategories.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
  beautyServices: many(beautyServices),
  cakeProducts: many(cakeProducts),
  streetFoodItems: many(streetFoodItems),
  restaurantMenuItems: many(restaurantMenuItems),
  tableBookings: many(tableBookings),
  groceryProducts: many(groceryProducts),
  invoices: many(invoices), // NAYA
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  provider: one(serviceProviders, {
    fields: [bookings.providerId],
    references: [serviceProviders.id],
  }),
  problem: one(serviceProblems, {
    fields: [bookings.problemId],
    references: [serviceProblems.id],
  }),
  invoice: one(invoices, { // NAYA
    fields: [bookings.invoiceId],
    references: [invoices.id],
  }),
}));

// NAYA RELATION
export const invoicesRelations = relations(invoices, ({ one }) => ({
  booking: one(bookings, {
    fields: [invoices.bookingId],
    references: [bookings.id],
  }),
  provider: one(serviceProviders, {
    fields: [invoices.providerId],
    references: [serviceProviders.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
}));

export const groceryProductsRelations = relations(groceryProducts, ({ one }) => ({
  provider: one(serviceProviders, {
    fields: [groceryProducts.providerId],
    references: [serviceProviders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  phone: true,
  password: true,
  role: true,
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).pick({
  businessName: true,
  description: true,
  experience: true,
  address: true,
  latitude: true,
  longitude: true,
  specializations: true,
  profileImageUrl: true,
});

// BOOKING SCHEMA UPDATE KARO
export const insertBookingSchema = createInsertSchema(bookings).pick({
  serviceType: true,
  problemId: true,
  scheduledAt: true,
  preferredTimeSlots: true,
  userAddress: true,
  userPhone: true,
  notes: true,
  isUrgent: true,
  providerId: true,
});

export const insertGroceryOrderSchema = createInsertSchema(groceryOrders).pick({
  items: true,
  subtotal: true,
  platformFee: true,
  deliveryFee: true,
  total: true,
  deliveryAddress: true,
});

export const insertRentalPropertySchema = createInsertSchema(rentalProperties).pick({
  title: true,
  description: true,
  propertyType: true,
  rent: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  furnishing: true,
  address: true,
  locality: true,
  latitude: true,
  longitude: true,
  amenities: true,
  images: true,
});

export const insertTableBookingSchema = createInsertSchema(tableBookings).pick({
  date: true,
  timeSlot: true,
  numberOfGuests: true,
  specialRequests: true,
});

export const insertBeautyServiceSchema = createInsertSchema(beautyServices).pick({
  name: true,
  description: true,
  imageUrl: true,
  duration: true,
  price: true,
  category: true,
  subCategory: true,
});

// NAYA INVOICE SCHEMA
export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  bookingId: true,
  providerId: true,
  userId: true,
  sparePartsDetails: true,
  sparePartsTotal: true,
  serviceCharge: true,
  totalAmount: true,
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
export type BeautyService = typeof beautyServices.$inferSelect;
export type InsertBeautyService = z.infer<typeof insertBeautyServiceSchema>;
export type CakeProduct = typeof cakeProducts.$inferSelect;
export type GroceryProduct = typeof groceryProducts.$inferSelect;
export type StreetFoodItem = typeof streetFoodItems.$inferSelect;
export type RestaurantMenuItem = typeof restaurantMenuItems.$inferSelect;
export type TableBooking = typeof tableBookings.$inferSelect;
export type InsertTableBooking = z.infer<typeof insertTableBookingSchema>;
export type Review = typeof reviews.$inferSelect;
export type Invoice = typeof invoices.$inferSelect; // NAYA TYPE
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>; // NAYA TYPE