import { pgTable, text, serial, integer, timestamp, json, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Nullable for Google OAuth users
  firstName: text('first_name').notNull(),
  lastName: text('last_name').default(''),
  profileImageUrl: text('profile_image_url'),

  // Stripe fields
  stripeCustomerId: text('stripe_customer_id'),

  // Auth provider tracking
  authProvider: text('auth_provider').default('email').notNull(), // 'email' | 'google'
  firebaseUid: text('firebase_uid'), // For Google OAuth users

  // Usage tracking
  uploads_used: integer('uploads_used').default(0).notNull(),
  batches_created: integer('batches_created').default(0).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Headshot batches table (replaces menu items)
export const headshotBatches = pgTable('headshot_batches', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('processing'), // processing, completed, failed

  // Input photos
  uploadedPhotos: json('uploaded_photos').$type<string[]>(), // Array of R2 URLs
  photoCount: integer('photo_count').notNull(),

  // Generation settings
  plan: text('plan').notNull(), // basic, professional, executive
  styleTemplates: json('style_templates').$type<string[]>(), // [\"linkedin\", \"corporate\", \"creative\"]
  backgrounds: json('backgrounds').$type<string[]>(), // Selected backgrounds (if custom)
  outfits: json('outfits').$type<string[]>(), // Selected outfit styles (if custom)

  // Results
  generatedHeadshots: json('generated_headshots').$type<{
    url: string;
    template: string;
    background: string;
    outfit: string;
    thumbnail: string;
    platformSpecs: {
      aspectRatio: string;
      dimensions: string;
      optimizedFor: string;
    };
  }[]>(),
  headshotCount: integer('headshot_count').default(0),
  headshotsByTemplate: json('headshots_by_template').$type<{
    [template: string]: number;
  }>(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTimeMinutes: integer('processing_time_minutes'),

  // Pricing
  amountPaid: integer('amount_paid').notNull(), // In cents
  stripePaymentId: text('stripe_payment_id'),
});

// Edit requests table
export const editRequests = pgTable('edit_requests', {
  id: serial('id').primaryKey(),
  batchId: integer('batch_id').notNull().references(() => headshotBatches.id),
  userId: text('user_id').notNull().references(() => users.id),
  headshotId: text('headshot_id').notNull(),
  editType: text('edit_type').notNull(), // background_change, outfit_change, regenerate
  status: text('status').notNull().default('pending'), // pending, completed, failed
  resultUrl: text('result_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// OTP codes table for email verification and login
export const otpCodes = pgTable('otp_codes', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: varchar('purpose', { length: 32 }).notNull(), // 'login' | 'registration'
  code: varchar('code', { length: 12 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table (auto-created by connect-pg-simple, defined here for reference)
export const sessions = pgTable('sessions', {
  sid: varchar('sid').primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type HeadshotBatch = typeof headshotBatches.$inferSelect;
export type NewHeadshotBatch = typeof headshotBatches.$inferInsert;
export type EditRequest = typeof editRequests.$inferSelect;
export type NewEditRequest = typeof editRequests.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
