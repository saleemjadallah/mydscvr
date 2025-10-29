import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertMenuItemSchema, insertSubscriptionSchema, tierLimits, type TierLimits } from "../shared/schema.js";
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
  apiVersion: '2025-09-30.clover',
});

const TRIAL_DISH_LIMIT = 3;
  const TRIAL_IMAGES_PER_DISH = 3;
  const VARIATION_VIEWS = ["Centered plating", "Slightly angled view", "Close-up detail shot"] as const;

  const getImageSize = (style: string, quality: "preview" | "final"): string => {
    const isDelivery = style === "Delivery App";
    if (quality === "preview") {
      return isDelivery ? "1024x682" : "768x768";
    }
    return isDelivery ? "1536x1024" : "1536x1536";
  };

  const buildPrompt = (
    index: number,
    stylePrompt: string,
    dishName: string,
    description: string,
    ingredientsList: string,
    quality: "preview" | "final",
    style: string
  ): string => {
    const view = VARIATION_VIEWS[index] ?? VARIATION_VIEWS[VARIATION_VIEWS.length - 1];
    const resolutionHint = getImageSize(style, quality);
    const qualityHint =
      quality === "preview"
        ? `Render a quick low-resolution preview (approximately ${resolutionHint}) to evaluate composition.`
        : `Produce a detailed, production-ready high-resolution image (approximately ${resolutionHint}).`;

    return `${dishName}${description ? `: ${description}` : ""}${ingredientsList}. ${stylePrompt}. ${view}. ${qualityHint} High-end restaurant quality, award-winning food photography, ultra realistic.`;
  };

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // AUTHENTICATION SETUP
  // ============================================

  await setupAuth(app);

  // ============================================
  // STRIPE WEBHOOK
  // ============================================

  app.post("/api/stripe/webhook", async (req: any, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody as Buffer; // Use the raw body captured by express.json verify

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('[Webhook] Received event:', event.type);

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      console.log('[Webhook] Payment succeeded:', paymentIntent.id);
      console.log('[Webhook] Customer:', paymentIntent.customer);
      console.log('[Webhook] Metadata:', paymentIntent.metadata);

      try {
        const { userId, tier, subscription_setup } = paymentIntent.metadata;

        if (subscription_setup === 'true' && userId && tier) {
          console.log('[Webhook] Creating subscription for user:', userId);

          // Create price for recurring subscription
          const prices: Record<string, number> = {
            starter: 9900, // AED 99
            pro: 29900,    // AED 299
            enterprise: 0,
          };

          const price = await stripe.prices.create({
            currency: "aed",
            unit_amount: prices[tier],
            recurring: {
              interval: "month",
            },
            product_data: {
              name: `Virtual Food Photographer - ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
            },
          });

          // Create Stripe subscription
          const subscription = await stripe.subscriptions.create({
            customer: paymentIntent.customer,
            items: [{ price: price.id }],
            default_payment_method: paymentIntent.payment_method,
            metadata: {
              userId,
              tier,
            },
          });

          console.log('[Webhook] Stripe subscription created:', subscription.id);

          // Create local subscription record
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          const localSubscription = await storage.createSubscription({
            userId,
            tier: tier as any,
            status: "active",
            stripeCustomerId: paymentIntent.customer,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: 0,
          });

          // Create initial usage record using the local subscription ID
          await storage.createUsageRecord({
            userId,
            subscriptionId: localSubscription.id, // Use local DB subscription ID, not Stripe ID
            dishesGenerated: 0,
            imagesGenerated: 0,
            billingPeriodStart: now,
            billingPeriodEnd: periodEnd,
          });

          console.log('[Webhook] Subscription setup complete');
        }
      } catch (error) {
        console.error('[Webhook] Error creating subscription:', error);
      }
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
      console.log('[Subscription Intent] ========== STARTING ==========');
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        console.log('[Subscription Intent] ERROR: User not found:', userId);
        return res.status(404).json({ error: "User not found" });
      }

      const { tier } = z.object({
        tier: z.enum(["starter", "pro"]),
      }).parse(req.body);

      console.log('[Subscription Intent] Creating for tier:', tier);
      console.log('[Subscription Intent] User ID:', userId);
      console.log('[Subscription Intent] User email:', user.email);

      // Pricing in AED (cents)
      const prices = {
        starter: 9900, // AED 99.00
        pro: 29900,    // AED 299.00
      };

      console.log('[Subscription Intent] Price:', prices[tier], 'AED cents');

      let customerId = user.stripeCustomerId;

      // Create or retrieve Stripe customer
      if (!customerId) {
        console.log('[Subscription Intent] Creating new Stripe customer for:', user.email);
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        console.log('[Subscription Intent] Created customer:', customerId);
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      } else {
        console.log('[Subscription Intent] Using existing customer:', customerId);
      }

      // Create a standalone PaymentIntent for the first payment
      console.log('[Subscription Intent] Creating PaymentIntent for first payment...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: prices[tier],
        currency: "aed",
        customer: customerId,
        setup_future_usage: 'off_session', // Save card for future subscription payments
        metadata: {
          userId,
          tier,
          subscription_setup: 'true',
        },
      });

      console.log('[Subscription Intent] ========== PAYMENT INTENT CREATED ==========');
      console.log('[Subscription Intent] PaymentIntent ID:', paymentIntent.id);
      console.log('[Subscription Intent] PaymentIntent status:', paymentIntent.status);
      console.log('[Subscription Intent] Client secret:', paymentIntent.client_secret ? 'present' : 'MISSING');

      if (!paymentIntent.client_secret) {
        console.error('[Subscription Intent] ERROR: No client secret on PaymentIntent!');
        return res.status(500).json({
          error: "Failed to get client secret from Stripe",
          details: "Payment intent was created but has no client_secret"
        });
      }

      // Store payment intent ID and tier for webhook processing
      await storage.updateUser(userId, {
        stripeCustomerId: customerId,
      });

      // Store the tier in metadata so we can create subscription after payment
      // Update the payment intent to include tier in metadata
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...paymentIntent.metadata,
          tier,
        },
      });

      const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        tier,
      };

      console.log('[Subscription Intent] Sending response with clientSecret');
      res.json(response);
    } catch (error) {
      console.error("Stripe subscription error:", error);
      res.status(500).json({
        error: "Failed to create subscription intent",
        details: error instanceof Error ? error.message : "Unknown error"
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
          "preview",
          style
        );

        try {
          return await generateImageBase64(variationPrompt);
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

      const generateHighResVariant = async (index: number): Promise<string | null> => {
        const variationPrompt: string = buildPrompt(
          index,
          stylePrompt,
          dishName,
          description ?? '',
          ingredientsList,
          "final",
          style
        );
        try {
          return await generateImageBase64(variationPrompt);
        } catch (error) {
          console.error("High-res generation failed:", error);
          return null;
        }
      };

      const highResResults = await Promise.all(uniqueIndices.map((index) => generateHighResVariant(index)));
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
