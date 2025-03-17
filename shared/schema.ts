import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  currentPrice: numeric("current_price").notNull(),
  originalPrice: numeric("original_price"),
  currency: text("currency").default("USD").notNull(),
  store: text("store").notNull(),
  productUrl: text("product_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isAlertSet: boolean("is_alert_set").default(false),
  alertPrice: numeric("alert_price"),
  isFavorite: boolean("is_favorite").default(false),
});

// Price history table
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  price: numeric("price").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  date: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// Chrome extension specific schemas
export const productInfoSchema = z.object({
  title: z.string(),
  imageUrl: z.string().optional(),
  currentPrice: z.number(),
  originalPrice: z.number().optional(),
  currency: z.string().default("USD"),
  store: z.string(),
  productUrl: z.string(),
});

export type ProductInfo = z.infer<typeof productInfoSchema>;
