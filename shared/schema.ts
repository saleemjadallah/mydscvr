import { sql } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================
// SESSION & AUTH TABLES (Required for Replit Auth)
// ============================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================
// OTP CODES
// ============================================

export const otpPurposes = ["login", "registration"] as const;
export type OTPPurpose = typeof otpPurposes[number];

export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: varchar("purpose", { length: 32 })
    .notNull()
    .$type<OTPPurpose>(),
  code: varchar("code", { length: 12 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertOtpCode = typeof otpCodes.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;

// ============================================
// SUBSCRIPTION TABLES
// ============================================

export const subscriptionTiers = ["starter", "pro", "enterprise"] as const;
export type SubscriptionTier = typeof subscriptionTiers[number];

export const subscriptionStatuses = ["active", "cancelled", "past_due", "trialing"] as const;
export type SubscriptionStatus = typeof subscriptionStatuses[number];

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: varchar("tier", { length: 50 }).notNull().$type<SubscriptionTier>(),
  status: varchar("status", { length: 50 }).notNull().$type<SubscriptionStatus>().default("active"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0), // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// ============================================
// USAGE TRACKING TABLE
// ============================================

export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  dishesGenerated: integer("dishes_generated").default(0),
  imagesGenerated: integer("images_generated").default(0),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUsageRecordSchema = createInsertSchema(usageRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;
export type UsageRecord = typeof usageRecords.$inferSelect;

// ============================================
// MENU ITEMS TABLE (Updated with userId)
// ============================================

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Temporarily optional until auth is implemented
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  ingredients: text("ingredients").array(),
  allergens: text("allergens").array(),
  generatedImages: text("generated_images").array(),
  selectedStyle: text("selected_style"),
  editCount: integer("edit_count").default(0), // Track number of times images have been regenerated
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  menuItems: many(menuItems),
  subscriptions: many(subscriptions),
  usageRecords: many(usageRecords),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  user: one(users, {
    fields: [menuItems.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  usageRecords: many(usageRecords),
}));

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  user: one(users, {
    fields: [usageRecords.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [usageRecords.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// ============================================
// CONSTANTS & TYPES
// ============================================

export const styleOptions = ["Rustic/Dark", "Bright/Modern", "Social Media", "Delivery App"] as const;
export type StyleOption = typeof styleOptions[number];

// Only Rustic/Dark and Bright/Modern can be added to menu items
export const menuItemStyleOptions = ["Rustic/Dark", "Bright/Modern"] as const;
export type MenuItemStyleOption = typeof menuItemStyleOptions[number];

// Social Media and Delivery App are for downloads only
export const downloadOnlyStyleOptions = ["Social Media", "Delivery App"] as const;
export type DownloadOnlyStyleOption = typeof downloadOnlyStyleOptions[number];

export const allergenOptions = [
  "Nuts",
  "Dairy",
  "Gluten",
  "Soy",
  "Eggs",
  "Shellfish",
  "Fish",
  "Wheat",
] as const;
export type AllergenOption = typeof allergenOptions[number];

// ============================================
// SUBSCRIPTION TIER CONFIGURATION
// ============================================

export interface TierLimits {
  dishesPerMonth: number;
  imagesPerDish: number;
  priceAED: number;
  overagePricePerDish: number;
}

export const tierLimits: Record<SubscriptionTier, TierLimits> = {
  starter: {
    dishesPerMonth: 30,
    imagesPerDish: 3,
    priceAED: 99,
    overagePricePerDish: 5,
  },
  pro: {
    dishesPerMonth: 150,
    imagesPerDish: 3,
    priceAED: 299,
    overagePricePerDish: 3,
  },
  enterprise: {
    dishesPerMonth: 999999, // Effectively unlimited
    imagesPerDish: 3,
    priceAED: 0, // Custom pricing
    overagePricePerDish: 0,
  },
};
