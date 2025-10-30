import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import {
  insertMenuItemSchema,
  insertSubscriptionSchema,
  tierLimits,
  type TierLimits,
  type SubscriptionTier,
} from "../shared/schema.js";
import { generateImageBase64 } from "./openai.js";
import { setupAuth, isAuthenticated } from "./auth.js";
import { z } from "zod";
import Stripe from "stripe";

// Use testing Stripe key in development/test, production key in production
const stripeSecretKey = process.env.NODE_ENV === 'development'
  ? (process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY)
  : process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing required Stripe secret key. Set TESTING_STRIPE_SECRET_KEY for development or STRIPE_SECRET_KEY for production.');
}

// Verify it's a secret key, not a publishable key
if (!stripeSecretKey.startsWith('sk_')) {
  throw new Error(
    `Invalid Stripe secret key format. Expected key starting with 'sk_', got '${stripeSecretKey.substring(0, 7)}...' ` +
    `(${process.env.NODE_ENV === 'development' ? 'TESTING_STRIPE_SECRET_KEY' : 'STRIPE_SECRET_KEY'})`
  );
}

console.log('[Stripe] Initializing Stripe with API version 2025-09-30.clover');
console.log('[Stripe] Using key:', stripeSecretKey.substring(0, 12) + '...');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
});

const TRIAL_DISH_LIMIT = 3;
const TRIAL_IMAGES_PER_DISH = 3;
const VARIATION_VIEWS = [
  "Centered plating",
  "Slightly angled view",
  "Close-up detail shot",
] as const;

const priceIds = {
  starter: process.env.STRIPE_STARTER_PRICE_ID ?? "",
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
};

const missingPrices = Object.entries(priceIds)
  .filter(([tier, value]) => !value && tier !== "enterprise")
  .map(([tier]) => tier);

if (missingPrices.length > 0) {
  console.warn(
    `[Stripe] Missing price IDs for tiers: ${missingPrices.join(", ")}. Set STRIPE_STARTER_PRICE_ID and STRIPE_PRO_PRICE_ID environment variables to enable checkout.`
  );
}

const buildPrompt = (
  index: number,
  stylePrompt: string,
  dishName: string,
  description: string,
  ingredientsList: string,
  quality: "preview" | "final"
): string => {
  const view = VARIATION_VIEWS[index] ?? VARIATION_VIEWS[VARIATION_VIEWS.length - 1];
  const resolutionHint =
    quality === "preview"
      ? "Render a quick preview that loads fast while keeping composition clear."
      : "Render a production-ready, high-resolution image suitable for download.";

  return `${dishName}${description ? `: ${description}` : ""}${ingredientsList}. ${stylePrompt}. ${view}. ${resolutionHint} High-end restaurant quality, award-winning food photography, ultra realistic.`;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // AUTHENTICATION SETUP
  // ============================================

  await setupAuth(app);

  // ============================================
  // STRIPE WEBHOOK
  // ============================================

  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const sigHeader = req.headers["stripe-signature"];
    if (!sigHeader) {
      console.error("[Webhook] Missing stripe-signature header");
      return res.status(400).send("Webhook Error: Missing stripe-signature header");
    }

    const rawBody = req.rawBody;
    if (!(rawBody instanceof Buffer)) {
      console.error("[Webhook] rawBody was not preserved");
      return res.status(400).send("Webhook Error: Invalid payload");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sigHeader,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown signature verification error";
      console.error("[Webhook] Signature verification failed:", message);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    console.log("[Webhook] Received event:", event.type);

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      if (
        invoice.billing_reason !== "subscription_create" &&
        invoice.billing_reason !== "subscription_cycle"
      ) {
        return res.json({ received: true });
      }

      const stripeSubscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!stripeSubscriptionId) {
        console.warn("[Webhook] Invoice missing subscription reference");
        return res.json({ received: true });
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
          expand: ["latest_invoice"],
        });

        const userId = subscription.metadata?.userId;
        const tier = subscription.metadata?.tier as SubscriptionTier | undefined;

        if (!userId || !tier) {
          console.warn("[Webhook] Subscription metadata missing userId or tier");
          return res.json({ received: true });
        }

        const stripeCustomerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null;

        const currentPeriodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : new Date();
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date();

        const existing = await storage.getSubscriptionByStripeId(stripeSubscriptionId);

        let localSubscription = existing;
        if (!localSubscription) {
          localSubscription = await storage.createSubscription({
            userId,
            tier,
            status: "active",
            stripeCustomerId: stripeCustomerId ?? null,
            stripeSubscriptionId,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
          });
        } else {
          await storage.updateSubscription(localSubscription.id, {
            status: "active",
            stripeCustomerId: stripeCustomerId ?? null,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
          });
        }

        const usage = await storage.getCurrentUsage(userId);
        if (!usage || usage.subscriptionId !== localSubscription.id) {
          await storage.createUsageRecord({
            userId,
            subscriptionId: localSubscription.id,
            dishesGenerated: 0,
            imagesGenerated: 0,
            billingPeriodStart: currentPeriodStart,
            billingPeriodEnd: currentPeriodEnd,
          });
        }

        console.log("[Webhook] Subscription synchronized:", stripeSubscriptionId);
      } catch (error) {
        console.error("[Webhook] Error syncing subscription:", error);
      }
    } else if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeSubscriptionId = subscription.id;
      const storedSubscription = await storage.getSubscriptionByStripeId(stripeSubscriptionId);
      if (!storedSubscription) {
        return res.json({ received: true });
      }

      const statusMap: Record<Stripe.Subscription.Status, "active" | "cancelled" | "past_due" | "trialing"> = {
        active: "active",
        past_due: "past_due",
        trialing: "trialing",
        canceled: "cancelled",
        unpaid: "past_due",
        incomplete: "past_due",
        incomplete_expired: "cancelled",
        paused: "past_due",
      };

      const mappedStatus =
        statusMap[subscription.status] ?? storedSubscription.status;

      await storage.updateSubscription(storedSubscription.id, {
        status: mappedStatus,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : storedSubscription.currentPeriodStart,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : storedSubscription.currentPeriodEnd,
      });

    }

    res.json({ received: true });
  });

  // ============================================
  // SUBSCRIPTION ROUTES
  // ============================================

  // GET /api/subscriptions/current - Get user's current active subscription
  app.get("/api/subscriptions/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getActiveSubscription(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // POST /api/subscriptions - Create new subscription
  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const createSubscriptionSchema = z.object({
        tier: z.enum(["starter", "pro", "enterprise"]),
        stripeCustomerId: z.string().optional(),
        stripeSubscriptionId: z.string().optional(),
      });

      const { tier, stripeCustomerId, stripeSubscriptionId } =
        createSubscriptionSchema.parse(req.body);

      // Check if user already has an active subscription
      const existing = await storage.getActiveSubscription(userId);
      if (existing) {
        return res.status(400).json({ error: "User already has an active subscription" });
      }

      // Create subscription
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subscription = await storage.createSubscription({
        userId,
        tier,
        status: "active",
        stripeCustomerId: stripeCustomerId ?? null,
        stripeSubscriptionId: stripeSubscriptionId ?? null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: 0,
      });

      // Create initial usage record for this billing period
      await storage.createUsageRecord({
        userId,
        subscriptionId: subscription.id,
        dishesGenerated: 0,
        imagesGenerated: 0,
        billingPeriodStart: now,
        billingPeriodEnd: periodEnd,
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid subscription data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // POST /api/create-subscription-intent - Create Stripe subscription payment intent
  app.post("/api/create-subscription-intent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { tier } = z
        .object({
          tier: z.enum(["starter", "pro"]),
        })
        .parse(req.body);

      if (!priceIds[tier]) {
        return res.status(500).json({ error: `Pricing configuration missing for tier '${tier}'` });
      }

      const existingSubscription = await storage.getActiveSubscription(userId);
      if (existingSubscription) {
        return res.status(400).json({ error: "User already has an active subscription" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const subscriptionsList = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
        expand: ["data.latest_invoice.payment_intent", "data.items.data.price"],
      });

      const existingStripeSubscription = subscriptionsList.data.find((sub) => {
        if (sub.metadata?.userId !== userId) {
          return false;
        }
        const blockingStatuses: Stripe.Subscription.Status[] = [
          "active",
          "trialing",
          "past_due",
          "incomplete",
        ];
        return blockingStatuses.includes(sub.status);
      });

      if (existingStripeSubscription) {
        if (existingStripeSubscription.status === "active" || existingStripeSubscription.status === "trialing") {
          return res.status(400).json({
            error: "User already has an active subscription",
          });
        }

        const latestInvoice = existingStripeSubscription.latest_invoice as Stripe.Invoice | null;
        const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

        if (paymentIntent?.client_secret) {
          const currentItem = existingStripeSubscription.items.data[0];
          const desiredPrice = priceIds[tier as keyof typeof priceIds];

          if (currentItem && currentItem.price?.id !== desiredPrice) {
            try {
              await stripe.subscriptions.update(existingStripeSubscription.id, {
                items: [
                  {
                    id: currentItem.id,
                    price: desiredPrice,
                  },
                ],
                metadata: {
                  ...existingStripeSubscription.metadata,
                  tier,
                },
              });
            } catch (updateError) {
              console.error("[Stripe] Failed to retarget incomplete subscription price:", updateError);
            }
          }

          return res.json({
            subscriptionId: existingStripeSubscription.id,
            clientSecret: paymentIntent.client_secret,
            tier,
            resumed: true,
          });
        }

        return res.status(400).json({
          error: "Existing subscription requires attention from support before retrying checkout.",
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceIds[tier as keyof typeof priceIds] }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        metadata: {
          userId,
          tier,
        },
        expand: ["latest_invoice.payment_intent"],
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

      if (!paymentIntent?.client_secret) {
        return res.status(500).json({
          error: "Failed to initialize checkout",
          details: "Missing client secret on subscription invoice payment intent",
        });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        tier,
      });
    } catch (error) {
      console.error("Stripe subscription error:", error);
      res.status(500).json({
        error: "Failed to create subscription intent",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // PATCH /api/subscriptions/:id - Update subscription
  app.patch("/api/subscriptions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptionId = req.params.id;

      // Verify subscription belongs to user
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription || subscription.userId !== userId) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const updateSchema = z.object({
        tier: z.enum(["starter", "pro", "enterprise"]).optional(),
        status: z.enum(["active", "cancelled", "past_due", "trialing"]).optional(),
        cancelAtPeriodEnd: z.number().optional(),
      });

      const updates = updateSchema.parse(req.body);
      const updated = await storage.updateSubscription(subscriptionId, updates);

      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // ============================================
  // USAGE TRACKING ROUTES
  // ============================================

  // GET /api/usage/current - Get current billing period usage
  app.get("/api/usage/current", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const usage = await storage.getCurrentUsage(userId);
      const subscription = await storage.getActiveSubscription(userId);

      // Calculate limits and remaining quota
      const isTrial = !subscription;
      const limits: TierLimits = subscription
        ? tierLimits[subscription.tier]
        : {
            dishesPerMonth: TRIAL_DISH_LIMIT,
            imagesPerDish: TRIAL_IMAGES_PER_DISH,
            priceAED: 0,
            overagePricePerDish: 0,
          };
      const tier = subscription?.tier || "starter";

      const dishesUsed = usage?.dishesGenerated || 0;
      const imagesUsed = usage?.imagesGenerated || 0;
      const dishesRemaining = Math.max(0, limits.dishesPerMonth - dishesUsed);

      res.json({
        usage: usage || null,
        limits,
        tier,
        dishesUsed,
        imagesUsed,
        dishesRemaining,
        hasReachedLimit: dishesUsed >= limits.dishesPerMonth,
        limitType: isTrial ? "trial" : "plan",
        trialLimit: isTrial ? TRIAL_DISH_LIMIT : undefined,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ error: "Failed to fetch usage" });
    }
  });

  // ============================================
  // MENU ITEM ROUTES (Auth-protected)
  // ============================================

  // GET /api/menu-items - Get all menu items for authenticated user
  app.get("/api/menu-items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getAllMenuItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // GET /api/menu-items/:id - Get single menu item
  app.get("/api/menu-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const item = await storage.getMenuItem(req.params.id);

      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Verify item belongs to user
      if (item.userId && item.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching menu item:", error);
      res.status(500).json({ error: "Failed to fetch menu item" });
    }
  });

  // POST /api/menu-items - Create new menu item
  app.post("/api/menu-items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertMenuItemSchema.parse(req.body);

      // Add userId to the menu item
      const newItem = await storage.createMenuItem({
        ...validatedData,
        userId,
      });

      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid menu item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  // PATCH /api/menu-items/:id - Update menu item
  app.patch("/api/menu-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const item = await storage.getMenuItem(req.params.id);

      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Verify item belongs to user
      if (item.userId && item.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updates = insertMenuItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateMenuItem(req.params.id, updates);

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  // DELETE /api/menu-items/:id - Delete menu item
  app.delete("/api/menu-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const item = await storage.getMenuItem(req.params.id);

      if (!item) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Verify item belongs to user
      if (item.userId && item.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const deleted = await storage.deleteMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // ============================================
  // IMAGE GENERATION ROUTE (With usage tracking and limits)
  // ============================================

  // POST /api/generate-images - Generate food photography using OpenAI
  app.post("/api/generate-images", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const generateImageSchema = z.object({
        menuItemId: z.string(),
        style: z.enum(["Rustic/Dark", "Bright/Modern", "Social Media", "Delivery App"]),
        dishName: z.string(),
        description: z.string().optional(),
        ingredients: z.array(z.string()).optional(),
      });

      const { menuItemId, style, dishName, description, ingredients } =
        generateImageSchema.parse(req.body);

      // Validate menu item exists and belongs to user
      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      if (menuItem.userId && menuItem.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check subscription and usage limits
      const subscription = await storage.getActiveSubscription(userId);
      const usage = await storage.getCurrentUsage(userId);
      const dishesUsed = usage?.dishesGenerated || 0;

      const limits: TierLimits = subscription
        ? tierLimits[subscription.tier]
        : {
            dishesPerMonth: TRIAL_DISH_LIMIT,
            imagesPerDish: TRIAL_IMAGES_PER_DISH,
            priceAED: 0,
            overagePricePerDish: 0,
          };

      if (!subscription) {
        if (dishesUsed >= limits.dishesPerMonth) {
          return res.status(403).json({
            error: "Trial limit reached",
            message: "You've used your three free dishes. Subscribe to continue generating new images.",
            dishesUsed,
            trialLimit: limits.dishesPerMonth,
          });
        }
      } else {
        // Check if user has exceeded their dish limit
        if (dishesUsed >= limits.dishesPerMonth) {
          return res.status(403).json({
            error: "Usage limit exceeded",
            message: `You've reached your ${subscription.tier} plan limit of ${limits.dishesPerMonth} dishes per month. Please upgrade or wait for next billing cycle.`,
            dishesUsed,
            dishesLimit: limits.dishesPerMonth,
            tier: subscription.tier,
          });
        }
      }

      // Determine images-per-dish limit
      const imagesPerDish = limits.imagesPerDish;

      // Generate style-specific prompt
      const stylePrompts: Record<
        "Rustic/Dark" | "Bright/Modern" | "Social Media" | "Delivery App",
        string
      > = {
        "Rustic/Dark": "dark moody lighting, rustic wooden table, warm tones, dramatic shadows, intimate atmosphere, professional food photography",
        "Bright/Modern": "bright natural lighting, clean white background, minimalist modern aesthetic, crisp focus, professional food photography",
        "Social Media": "overhead top-down view, flat lay style, Instagram-ready composition, vibrant colors, professional food photography",
        "Delivery App": "appetizing well-lit presentation, bright even lighting, mouth-watering appeal, clean professional backdrop, optimized for mobile app display, professional food photography"
      };

      const stylePrompt: string = stylePrompts[style] ?? stylePrompts["Bright/Modern"];
      const ingredientsList: string = ingredients && ingredients.length > 0
        ? `, featuring ${ingredients.join(", ")}`
        : "";

      // Generate image variations
      const generateVariant = async (index: number): Promise<string | null> => {
        const variationPrompt: string = buildPrompt(
          index,
          stylePrompt,
          dishName,
          description ?? '',
          ingredientsList,
          "preview"
        );

        try {
          const startedAt = process.hrtime.bigint();
          const result = await generateImageBase64(variationPrompt);
          const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
          console.log(
            `[Gemini] Preview ${dishName} [${index + 1}/${imagesPerDish}] generated in ${elapsedMs.toFixed(
              0
            )}ms`
          );
          return result;
        } catch (error) {
          console.error("Preview generation failed:", error);
          return null;
        }
      };

      const previewResults = await Promise.all(
        Array.from({ length: imagesPerDish }, (_, index) => generateVariant(index))
      );

      if (previewResults.some((url) => !url)) {
        return res.status(500).json({ error: "Failed to generate preview images" });
      }

      const imageUrls = previewResults.filter((url): url is string => Boolean(url));

      // Update menu item with generated images
      const updatedItem = await storage.updateMenuItem(menuItemId, {
        generatedImages: imageUrls,
        selectedStyle: style,
      });

      // Track usage: 1 dish generated, N images created
      await storage.incrementUsage(userId, 1, imageUrls.length);

      res.json({ images: imageUrls, menuItem: updatedItem });
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/generate-images/highres", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const highResSchema = z.object({
        menuItemId: z.string(),
        style: z.enum(["Rustic/Dark", "Bright/Modern", "Social Media", "Delivery App"]),
        dishName: z.string(),
        description: z.string().optional(),
        ingredients: z.array(z.string()).optional(),
        indices: z.array(z.number().int().min(0)).nonempty(),
      });

      const { menuItemId, style, dishName, description, ingredients, indices } =
        highResSchema.parse(req.body);

      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      if (menuItem.userId && menuItem.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const stylePrompts: Record<
        "Rustic/Dark" | "Bright/Modern" | "Social Media" | "Delivery App",
        string
      > = {
        "Rustic/Dark": "dark moody lighting, rustic wooden table, warm tones, dramatic shadows, intimate atmosphere, professional food photography",
        "Bright/Modern": "bright natural lighting, clean white background, minimalist modern aesthetic, crisp focus, professional food photography",
        "Social Media": "overhead top-down view, flat lay style, Instagram-ready composition, vibrant colors, professional food photography",
        "Delivery App": "appetizing well-lit presentation, bright even lighting, mouth-watering appeal, clean professional backdrop, optimized for mobile app display, professional food photography"
      };

      const stylePrompt: string = stylePrompts[style] ?? stylePrompts["Bright/Modern"];
      const ingredientsList: string = ingredients && ingredients.length > 0
        ? `, featuring ${ingredients.join(", ")}`
        : "";

      const uniqueIndices = Array.from(new Set(indices)).filter((index) => index >= 0 && index < VARIATION_VIEWS.length);
      if (uniqueIndices.length === 0) {
        return res.status(400).json({ error: "No valid image indices provided" });
      }

      const totalHighRes = uniqueIndices.length;
      const generateHighResVariant = async (index: number, ordinal: number): Promise<string | null> => {
        const variationPrompt: string = buildPrompt(
          index,
          stylePrompt,
          dishName,
          description ?? '',
          ingredientsList,
          "final"
        );
        try {
          const startedAt = process.hrtime.bigint();
          const result = await generateImageBase64(variationPrompt);
          const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
          console.log(
            `[Gemini] High-res ${dishName} [${ordinal + 1}/${totalHighRes}] (view ${index + 1}) generated in ${elapsedMs.toFixed(
              0
            )}ms`
          );
          return result;
        } catch (error) {
          console.error("High-res generation failed:", error);
          return null;
        }
      };

      const highResResults = await Promise.all(
        uniqueIndices.map((index, ordinal) => generateHighResVariant(index, ordinal))
      );
      if (highResResults.some((url) => !url)) {
        return res.status(500).json({ error: "Failed to generate high-resolution images" });
      }

      const b64Images = highResResults.filter((url): url is string => Boolean(url));

      const updatedImages = [...(menuItem.generatedImages ?? [])];
      uniqueIndices.forEach((index, idx) => {
        const imageValue = b64Images[idx];
        if (imageValue) {
          updatedImages[index] = imageValue;
        }
      });

      const updatedItem = await storage.updateMenuItem(menuItemId, {
        generatedImages: updatedImages,
        selectedStyle: style,
      });

      res.json({
        images: updatedImages,
        menuItem: updatedItem,
        updatedIndices: uniqueIndices,
      });
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
