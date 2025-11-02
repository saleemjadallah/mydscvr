import {
  users,
  menuItems,
  subscriptions,
  usageRecords,
  establishmentSettings,
  type User,
  type UpsertUser,
  type MenuItem,
  type InsertMenuItem,
  type Subscription,
  type InsertSubscription,
  type UsageRecord,
  type InsertUsageRecord,
  type EstablishmentSettings,
  type InsertEstablishmentSettings,
  type CoverStyle,
  type FontFamily,
  otpCodes,
  type InsertOtpCode,
  type OtpCode,
  type OTPPurpose,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  
  // Menu item operations
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  getAllMenuItems(userId?: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<boolean>;
  
  // Subscription operations
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  getActiveSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Usage tracking operations
  getCurrentUsage(userId: string): Promise<UsageRecord | undefined>;
  createUsageRecord(record: InsertUsageRecord): Promise<UsageRecord>;
  updateUsageRecord(id: string, updates: Partial<InsertUsageRecord>): Promise<UsageRecord | undefined>;
  incrementUsage(userId: string, dishesIncrement: number, imagesIncrement: number): Promise<UsageRecord>;

  // OTP operations
  createOtpCode(code: InsertOtpCode): Promise<OtpCode>;
  findOtpCode(userId: string, purpose: OTPPurpose, code: string): Promise<OtpCode | undefined>;
  deleteOtpCodesForUser(userId: string, purpose: OTPPurpose): Promise<void>;

  // Establishment settings operations
  getEstablishmentSettings(userId: string): Promise<EstablishmentSettings | undefined>;
  createEstablishmentSettings(settings: InsertEstablishmentSettings): Promise<EstablishmentSettings>;
  updateEstablishmentSettings(userId: string, updates: Partial<InsertEstablishmentSettings>): Promise<EstablishmentSettings | undefined>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // USER OPERATIONS
  // ============================================

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!user) {
        throw new Error("Failed to upsert user");
      }
      return user;
    } catch (error: any) {
      // Handle unique constraint violation on email
      if (error?.code === '23505' && error?.constraint?.includes('email')) {
        // Email conflict - this happens in testing when multiple OIDC users share an email
        // In production, each email should have a unique sub, so this shouldn't occur
        console.warn(`[Storage] Email conflict detected for ${userData.email}, updating existing user's ID`);
        
        // Use a transaction to update the user ID and all foreign key references
        return await db.transaction(async (tx) => {
          const [existingUser] = await tx.select().from(users).where(eq(users.email, userData.email!));
          
          if (!existingUser) {
            throw new Error('Email conflict but no existing user found');
          }
          
          const oldId = existingUser.id;
          const newId = userData.id;
          
          // First, update the user's ID (must happen before FK updates to avoid constraint violations)
          const [updatedUser] = await tx
            .update(users)
            .set({
              id: newId,
              ...userData,
              updatedAt: new Date(),
            })
            .where(eq(users.id, oldId))
            .returning();
          if (!updatedUser) {
            throw new Error("Failed to update existing user during upsert");
          }
          
          // Then update all foreign key references to point to the new ID
          await tx.update(menuItems).set({ userId: newId }).where(eq(menuItems.userId, oldId));
          await tx.update(subscriptions).set({ userId: newId }).where(eq(subscriptions.userId, oldId));
          await tx.update(usageRecords).set({ userId: newId }).where(eq(usageRecords.userId, oldId));
          
          return updatedUser;
        });
      }
      // Re-throw if we can't handle it
      console.error('[Storage] Upsert user error:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // MENU ITEM OPERATIONS
  // ============================================

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async getAllMenuItems(userId?: string): Promise<MenuItem[]> {
    if (userId) {
      return await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.userId, userId))
        .orderBy(desc(menuItems.createdAt));
    }
    // Return all items if no userId provided (for development before auth)
    return await db
      .select()
      .from(menuItems)
      .orderBy(desc(menuItems.createdAt));
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db
      .insert(menuItems)
      .values(insertItem)
      .returning();
    if (!item) {
      throw new Error("Failed to create menu item");
    }
    return item;
  }

  async updateMenuItem(id: string, updates: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, id))
      .returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const result = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================
  // SUBSCRIPTION OPERATIONS
  // ============================================

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
  }

  async getActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values([insertSubscription as any])
      .returning();
    if (!subscription) {
      throw new Error("Failed to create subscription");
    }
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'createdAt'>>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({
        ...(updates as any),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // USAGE TRACKING OPERATIONS
  // ============================================

  async getCurrentUsage(userId: string): Promise<UsageRecord | undefined> {
    const now = new Date();
    const [usage] = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.userId, userId),
          lte(usageRecords.billingPeriodStart, now),
          gte(usageRecords.billingPeriodEnd, now)
        )
      )
      .orderBy(desc(usageRecords.createdAt))
      .limit(1);
    return usage;
  }

  async createUsageRecord(record: InsertUsageRecord): Promise<UsageRecord> {
    const [usageRecord] = await db
      .insert(usageRecords)
      .values(record)
      .returning();
    if (!usageRecord) {
      throw new Error("Failed to create usage record");
    }
    return usageRecord;
  }

  async updateUsageRecord(id: string, updates: Partial<InsertUsageRecord>): Promise<UsageRecord | undefined> {
    const [updated] = await db
      .update(usageRecords)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(usageRecords.id, id))
      .returning();
    return updated;
  }

  async incrementUsage(userId: string, dishesIncrement: number, imagesIncrement: number): Promise<UsageRecord> {
    // Get or create current billing period usage
    let usage = await this.getCurrentUsage(userId);
    
    if (!usage) {
      // Create new usage record for current billing period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const subscription = await this.getActiveSubscription(userId);
      
      usage = await this.createUsageRecord({
        userId,
        subscriptionId: subscription?.id ?? null,
        dishesGenerated: dishesIncrement,
        imagesGenerated: imagesIncrement,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      });
    } else {
      // Update existing usage record
      const updated = await this.updateUsageRecord(usage.id, {
        dishesGenerated: (usage.dishesGenerated ?? 0) + dishesIncrement,
        imagesGenerated: (usage.imagesGenerated ?? 0) + imagesIncrement,
      });
      usage = updated!;
    }
    
    return usage;
  }

  // ============================================
  // OTP OPERATIONS
  // ============================================

  async createOtpCode(codeData: InsertOtpCode): Promise<OtpCode> {
    const [code] = await db.insert(otpCodes).values(codeData).returning();
    if (!code) {
      throw new Error("Failed to create OTP code");
    }
    return code;
  }

  async findOtpCode(userId: string, purpose: OTPPurpose, code: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.purpose, purpose),
          eq(otpCodes.code, code)
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    return otp;
  }

  async deleteOtpCodesForUser(userId: string, purpose: OTPPurpose): Promise<void> {
    await db
      .delete(otpCodes)
      .where(and(eq(otpCodes.userId, userId), eq(otpCodes.purpose, purpose)));
  }

  // ============================================
  // ESTABLISHMENT SETTINGS OPERATIONS
  // ============================================

  async getEstablishmentSettings(userId: string): Promise<EstablishmentSettings | undefined> {
    const [settings] = await db
      .select()
      .from(establishmentSettings)
      .where(eq(establishmentSettings.userId, userId))
      .limit(1);
    return settings;
  }

  async createEstablishmentSettings(settings: InsertEstablishmentSettings): Promise<EstablishmentSettings> {
    // Ensure proper types for enums
    const validatedSettings = {
      ...settings,
      coverStyle: settings.coverStyle as CoverStyle | undefined,
      fontFamily: settings.fontFamily as FontFamily | undefined,
    };

    const [created] = await db
      .insert(establishmentSettings)
      .values(validatedSettings as any)
      .returning();
    return created || {} as EstablishmentSettings;
  }

  async updateEstablishmentSettings(
    userId: string,
    updates: Partial<InsertEstablishmentSettings>
  ): Promise<EstablishmentSettings | undefined> {
    // Ensure proper types for enums
    const validatedUpdates = {
      ...updates,
      coverStyle: updates.coverStyle as CoverStyle | undefined,
      fontFamily: updates.fontFamily as FontFamily | undefined,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(establishmentSettings)
      .set(validatedUpdates as any)
      .where(eq(establishmentSettings.userId, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
