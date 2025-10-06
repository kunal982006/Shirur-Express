import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
});

// Service providers
export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  categoryId: varchar("category_id").references(() => serviceCategories.id).notNull(),
  businessName: text("business_name").notNull(),
  description: text("description"),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => serviceCategories.id).notNull(),
  name: text("name").notNull(),
  parentId: varchar("parent_id"),
});

// Add self-referencing foreign key after table definition
// This avoids the circular reference issue during initialization

// Beauty services
export const beautyServices = pgTable("beauty_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").references(() => serviceProviders.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration_minutes"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category"), // Hair, Facial, Makeup, Spa, Bridal
});

// Cake products
export const cakeProducts = pgTable("cake_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  weight: text("weight"),
  unit: text("unit"),
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
});

// Rental properties
export const rentalProperties = pgTable("rental_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Bookings/Service requests
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  providerId: varchar("provider_id").references(() => serviceProviders.id),
  serviceType: text("service_type").notNull(),
  problemId: varchar("problem_id").references(() => serviceProblems.id),
  status: text("status").default("pending"), // pending, accepted, declined, completed, cancelled
  scheduledAt: timestamp("scheduled_at"),
  preferredTimeSlots: jsonb("preferred_time_slots").$type<string[]>(),
  userAddress: text("user_address").notNull(),
  userPhone: text("user_phone").notNull(),
  notes: text("notes"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grocery orders
export const groceryOrders = pgTable("grocery_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  items: jsonb("items").$type<Array<{ productId: string; quantity: number; price: number }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").default("pending"), // pending, confirmed, delivered, cancelled
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  serviceType: true,
  problemId: true,
  scheduledAt: true,
  preferredTimeSlots: true,
  userAddress: true,
  userPhone: true,
  notes: true,
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
export type CakeProduct = typeof cakeProducts.$inferSelect;
export type GroceryProduct = typeof groceryProducts.$inferSelect;
export type Review = typeof reviews.$inferSelect;
