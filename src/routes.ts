import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import {
  insertMenuItemSchema,
  insertSubscriptionSchema,
  tierLimits,
  menuItemStyleOptions,
  type MenuItem,
  type TierLimits,
  type SubscriptionTier,
  type EstablishmentSettings,
} from "../shared/schema.js";
import { generateImageBase64 } from "./openai.js";
import { setupAuth, isAuthenticated } from "./auth.js";
import { uploadImagesToR2, deleteImagesFromR2 } from "./r2-storage.js";
import { z } from "zod";
import multer from "multer";
import { enhanceImage, analyzeFoodImage, batchEnhanceImages } from "./image-enhance.js";
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
        console.log("[Webhook] Invoice missing subscription reference (likely already handled by subscription.updated)");
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

        // Check if user exists before creating subscription
        const userExists = await storage.getUser(userId);
        if (!userExists) {
          console.warn(`[Webhook] User ${userId} not found, skipping subscription creation`);
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
            enhancementsUsed: 0,
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

      const mappedStatus = statusMap[subscription.status] ?? "active";

      if (!storedSubscription) {
        // Create new subscription if it doesn't exist
        const userId = subscription.metadata?.userId;
        const tier = subscription.metadata?.tier as SubscriptionTier | undefined;

        if (!userId || !tier) {
          console.warn("[Webhook] Subscription metadata missing userId or tier in subscription.updated");
          return res.json({ received: true });
        }

        // Check if user exists before creating subscription
        const userExists = await storage.getUser(userId);
        if (!userExists) {
          console.warn(`[Webhook] User ${userId} not found in subscription.updated, skipping`);
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

        const newSubscription = await storage.createSubscription({
          userId,
          tier,
          status: mappedStatus,
          stripeCustomerId: stripeCustomerId ?? null,
          stripeSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
        });

        // Create usage record for new subscription
        const usage = await storage.getCurrentUsage(userId);
        if (!usage || usage.subscriptionId !== newSubscription.id) {
          await storage.createUsageRecord({
            userId,
            subscriptionId: newSubscription.id,
            dishesGenerated: 0,
            imagesGenerated: 0,
            enhancementsUsed: 0,
            billingPeriodStart: currentPeriodStart,
            billingPeriodEnd: currentPeriodEnd,
          });
        }

        console.log("[Webhook] Subscription created via subscription.updated:", stripeSubscriptionId);
      } else {
        // Update existing subscription
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

        console.log("[Webhook] Subscription updated:", stripeSubscriptionId);
      }

    }

    res.json({ received: true });
  });

  // ============================================
  // USER PROFILE ROUTES
  // ============================================

  // PATCH /api/user/profile - Update user profile information
  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName } = req.body;

      // Validate input
      const updateSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      });

      const validated = updateSchema.parse({ firstName, lastName });

      // Update user profile
      const updatedUser = await storage.updateUser(userId, validated);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // GET /api/subscription - Get user's current subscription (alias for compatibility)
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getActiveSubscription(userId);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
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

  // POST /api/subscriptions/sync - Manually sync subscription from Stripe
  app.post("/api/subscriptions/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(404).json({ error: "No Stripe customer found" });
      }

      const existingLocalSubscription = await storage.getActiveSubscription(userId);

      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price"],
      });

      const activeSubscription = stripeSubscriptions.data
        .filter((sub) => ["active", "trialing", "past_due"].includes(sub.status))
        .sort((a, b) => (b.current_period_end ?? 0) - (a.current_period_end ?? 0))[0];

      if (!activeSubscription) {
        return res.json({ synced: false, message: "No active subscription found in Stripe" });
      }

      const subscriptionPriceId = activeSubscription.items?.data?.[0]?.price?.id ?? null;
      const tierFromPrice = subscriptionPriceId
        ? (Object.entries(priceIds).find(([, id]) => id === subscriptionPriceId)?.[0] as SubscriptionTier | undefined)
        : undefined;

      let tier = (activeSubscription.metadata?.tier as SubscriptionTier | undefined)
        ?? tierFromPrice
        ?? existingLocalSubscription?.tier;

      if (!tier) {
        return res.status(400).json({
          error: "Subscription missing tier metadata; unable to infer tier from Stripe subscription",
        });
      }

      const metadataNeedsUpdate =
        activeSubscription.metadata?.tier !== tier ||
        activeSubscription.metadata?.userId !== userId;

      if (metadataNeedsUpdate) {
        try {
          await stripe.subscriptions.update(activeSubscription.id, {
            metadata: {
              ...(activeSubscription.metadata ?? {}),
              tier,
              userId,
            },
          });
        } catch (updateError) {
          console.error("[Stripe] Failed to refresh subscription metadata:", updateError);
        }
      }

      const periodStartSeconds =
        activeSubscription.current_period_start ??
        activeSubscription.trial_start ??
        activeSubscription.start_date ??
        null;

      const periodEndSeconds =
        activeSubscription.current_period_end ??
        activeSubscription.trial_end ??
        activeSubscription.cancel_at ??
        null;

      let currentPeriodStart = periodStartSeconds
        ? new Date(periodStartSeconds * 1000)
        : new Date();

      let currentPeriodEnd = periodEndSeconds
        ? new Date(periodEndSeconds * 1000)
        : new Date(currentPeriodStart.getTime());

      if (!periodEndSeconds) {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      if (isNaN(currentPeriodStart.getTime()) || isNaN(currentPeriodEnd.getTime())) {
        return res.status(400).json({ error: "Invalid subscription period dates" });
      }

      if (currentPeriodEnd <= currentPeriodStart) {
        currentPeriodEnd = new Date(currentPeriodStart.getTime());
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      const existing = await storage.getSubscriptionByStripeId(activeSubscription.id);

      let localSubscription;
      if (existing) {
        await storage.updateSubscription(existing.id, {
          status: "active",
          tier,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end ? 1 : 0,
        });
        localSubscription = await storage.getSubscription(existing.id);
      } else {
        const customerId =
          typeof activeSubscription.customer === "string"
            ? activeSubscription.customer
            : activeSubscription.customer?.id ?? user.stripeCustomerId;

        localSubscription = await storage.createSubscription({
          userId,
          tier,
          status: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: activeSubscription.id,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end ? 1 : 0,
        });
      }

      const customerId =
        typeof activeSubscription.customer === "string"
          ? activeSubscription.customer
          : activeSubscription.customer?.id ?? user.stripeCustomerId;

      if (!user.stripeSubscriptionId || user.stripeSubscriptionId !== activeSubscription.id || user.stripeCustomerId !== customerId) {
        await storage.updateUser(userId, {
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          stripeSubscriptionId: activeSubscription.id,
        });
      }

      const usage = await storage.getCurrentUsage(userId);
      if (!usage || usage.subscriptionId !== localSubscription!.id) {
        await storage.createUsageRecord({
          userId,
          subscriptionId: localSubscription!.id,
          dishesGenerated: 0,
          imagesGenerated: 0,
          billingPeriodStart: currentPeriodStart,
          billingPeriodEnd: currentPeriodEnd,
        });
      }

      res.json({
        synced: true,
        subscription: localSubscription,
        message: "Subscription synced successfully",
      });
    } catch (error) {
      console.error("Error syncing subscription:", error);
      res.status(500).json({ error: "Failed to sync subscription" });
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
        enhancementsUsed: 0,
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
        // Only block truly active subscriptions, not incomplete ones
        const blockingStatuses: Stripe.Subscription.Status[] = [
          "active",
          "trialing",
          "past_due",
        ];
        return blockingStatuses.includes(sub.status);
      });

      if (existingStripeSubscription) {
        // User has an actually active subscription
        return res.status(400).json({
          error: "User already has an active subscription",
        });
      }

      // Check for incomplete subscriptions - cancel them to allow retry
      const incompleteSubscriptions = subscriptionsList.data.filter((sub) => {
        if (sub.metadata?.userId !== userId) {
          return false;
        }
        return sub.status === "incomplete" || sub.status === "incomplete_expired";
      });

      // Cancel any incomplete subscriptions to allow fresh start
      if (incompleteSubscriptions.length > 0) {
        console.log(`[Stripe] Found ${incompleteSubscriptions.length} incomplete subscription(s), canceling them...`);
        for (const incompleteSub of incompleteSubscriptions) {
          try {
            await stripe.subscriptions.cancel(incompleteSub.id);
            console.log(`[Stripe] Canceled incomplete subscription ${incompleteSub.id}`);
          } catch (cancelError) {
            console.error(`[Stripe] Failed to cancel incomplete subscription ${incompleteSub.id}:`, cancelError);
            // Continue anyway - we'll create a new one
          }
        }
      }

      let subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceIds[tier as keyof typeof priceIds] }],
        payment_behavior: "default_incomplete",
        collection_method: "charge_automatically",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        metadata: {
          userId,
          tier,
        },
        // Use confirmation_secret instead of payment_intent (Stripe API change Oct 2025)
        expand: ["latest_invoice.confirmation_secret"],
      });

      // Get client_secret directly from confirmation_secret (new Stripe API approach)
      let clientSecret: string | null = null;

      if (subscription.latest_invoice && typeof subscription.latest_invoice !== "string") {
        const invoice = subscription.latest_invoice as any;

        // Check for confirmation_secret first (new API)
        if (invoice.confirmation_secret?.client_secret) {
          clientSecret = invoice.confirmation_secret.client_secret;
        } else if (invoice.confirmation_secret && typeof invoice.confirmation_secret === "string") {
          // If confirmation_secret is just a string, we have the client_secret directly
          clientSecret = invoice.confirmation_secret;
        }
      }

      // If we don't have client_secret yet, try to get it via payment_intent (fallback)
      if (!clientSecret && subscription.latest_invoice) {
        const invoiceId = typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice.id;

        if (invoiceId) {
          try {
            // Try both confirmation_secret and payment_intent
            const invoice = await stripe.invoices.retrieve(invoiceId, {
              expand: ["confirmation_secret", "payment_intent"],
            });

            // Try confirmation_secret first
            const invoiceData = invoice as any;
            if (invoiceData.confirmation_secret?.client_secret) {
              clientSecret = invoiceData.confirmation_secret.client_secret;
            } else if (invoiceData.confirmation_secret && typeof invoiceData.confirmation_secret === "string") {
              clientSecret = invoiceData.confirmation_secret;
            } else if (invoiceData.payment_intent?.client_secret) {
              // Fallback to payment_intent if available
              clientSecret = invoiceData.payment_intent.client_secret;
            } else if (invoiceData.payment_intent && typeof invoiceData.payment_intent === "string") {
              // If payment_intent is a string ID, retrieve it
              const paymentIntent = await stripe.paymentIntents.retrieve(invoiceData.payment_intent);
              clientSecret = paymentIntent.client_secret;
            }
          } catch (error) {
            console.error("[Stripe] Failed to retrieve invoice details:", error);
          }
        }
      }

      // If we have the client_secret directly, return it immediately
      if (clientSecret) {
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: clientSecret,
          tier,
        });
      }

      const resolvePaymentIntent = async (): Promise<{
        paymentIntent: Stripe.PaymentIntent | null;
        invoiceId: string | null;
        paymentIntentReference: string | null;
        invoiceReferenceType: string | null;
      }> => {
        const maxAttempts = 10;
        let attempts = 0;
        let invoiceRef = subscription.latest_invoice;
        let paymentIntent: Stripe.PaymentIntent | null = null;
        let invoiceId: string | null = null;
        let paymentIntentReference: string | null = null;
        let invoiceReferenceType: string | null = invoiceRef ? typeof invoiceRef : null;

        const loadFromInvoice = async (
          invoiceLike: Stripe.Invoice | string | null | undefined,
        ): Promise<{
          paymentIntent: Stripe.PaymentIntent | null;
          invoiceId: string | null;
          paymentIntentReference: string | null;
          invoiceReferenceType: string | null;
        }> => {
          if (!invoiceLike) {
            return { paymentIntent: null, invoiceId: null, paymentIntentReference: null, invoiceReferenceType: null };
          }

          if (typeof invoiceLike === "string") {
            try {
              const invoice = await stripe.invoices.retrieve(invoiceLike, {
                expand: ["payment_intent"],
              });
              return loadFromInvoice(invoice);
            } catch (invoiceError) {
              console.error(`[Stripe] Failed to retrieve invoice ${invoiceLike}:`, invoiceError);
              return {
                paymentIntent: null,
                invoiceId: invoiceLike,
                paymentIntentReference: null,
                invoiceReferenceType: "string",
              };
            }
          }

          const invoice = invoiceLike as Stripe.Invoice;
          const currentInvoiceId = invoice.id ?? null;
          // TypeScript doesn't recognize payment_intent on Invoice, but it exists in the API
          const invoicePaymentIntent = (invoice as any).payment_intent;
          const paymentIntentRef =
            typeof invoicePaymentIntent === "string"
              ? invoicePaymentIntent
              : invoicePaymentIntent?.id ?? null;

          if (!invoicePaymentIntent) {
            return {
              paymentIntent: null,
              invoiceId: currentInvoiceId,
              paymentIntentReference: null,
              invoiceReferenceType: "object",
            };
          }

          if (typeof invoicePaymentIntent === "string") {
            try {
              const resolved = await stripe.paymentIntents.retrieve(invoicePaymentIntent);
              return {
                paymentIntent: resolved,
                invoiceId: currentInvoiceId,
                paymentIntentReference: paymentIntentRef,
                invoiceReferenceType: "object",
              };
            } catch (piError) {
              console.error(`[Stripe] Failed to retrieve payment intent ${invoicePaymentIntent}:`, piError);
              return {
                paymentIntent: null,
                invoiceId: currentInvoiceId,
                paymentIntentReference: paymentIntentRef,
                invoiceReferenceType: "object",
              };
            }
          }

          return {
            paymentIntent: invoicePaymentIntent,
            invoiceId: currentInvoiceId,
            paymentIntentReference: paymentIntentRef,
            invoiceReferenceType: "object",
          };
        };

        while (attempts < maxAttempts && !paymentIntent?.client_secret) {
          attempts += 1;
          const result = await loadFromInvoice(invoiceRef);
          paymentIntent = result.paymentIntent ?? paymentIntent;
          invoiceId = result.invoiceId ?? invoiceId;
          paymentIntentReference = result.paymentIntentReference ?? paymentIntentReference;
          invoiceReferenceType = result.invoiceReferenceType ?? invoiceReferenceType;

          if (paymentIntent?.client_secret) {
            break;
          }

          if (attempts >= maxAttempts) {
            break;
          }

          const delayMs = Math.min(1000 * attempts, 5000);
          await new Promise((resolve) => setTimeout(resolve, delayMs));

          try {
            const refreshedSubscription = await stripe.subscriptions.retrieve(subscription.id, {
              expand: ["latest_invoice.payment_intent"],
            });
            invoiceRef = refreshedSubscription.latest_invoice;
            invoiceReferenceType = invoiceRef ? typeof invoiceRef : invoiceReferenceType;
          } catch (refreshError) {
            console.error("[Stripe] Failed to refresh subscription while resolving payment intent:", refreshError);
            break;
          }
        }

        return { paymentIntent, invoiceId, paymentIntentReference, invoiceReferenceType };
      };

      const { paymentIntent, invoiceId, paymentIntentReference, invoiceReferenceType } =
        await resolvePaymentIntent();

      if (!paymentIntent?.client_secret) {
        console.error("[Stripe] Subscription intent missing client secret", {
          subscriptionId: subscription.id,
          invoiceId,
          invoiceReferenceType,
          paymentIntentId: paymentIntent?.id ?? paymentIntentReference,
          paymentIntentStatus: paymentIntent?.status,
        });
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

  // POST /api/create-portal-session - Create Stripe Customer Portal session
  app.post("/api/create-portal-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // User must have a Stripe customer ID to access the portal
      if (!user.stripeCustomerId) {
        return res.status(400).json({
          error: "No billing account found. Please subscribe to a plan first."
        });
      }

      // Create a billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin || 'http://localhost:5000'}/settings`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({
        error: "Failed to create portal session",
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
      const TRIAL_ENHANCEMENT_LIMIT = 5;
      const limits: TierLimits = subscription
        ? tierLimits[subscription.tier]
        : {
            dishesPerMonth: TRIAL_DISH_LIMIT,
            imagesPerDish: TRIAL_IMAGES_PER_DISH,
            enhancementsPerMonth: TRIAL_ENHANCEMENT_LIMIT,
            priceAED: 0,
            overagePricePerDish: 0,
          };
      const tier = subscription?.tier || "starter";

      const dishesUsed = usage?.dishesGenerated || 0;
      const imagesUsed = usage?.imagesGenerated || 0;
      const enhancementsUsed = usage?.enhancementsUsed || 0;
      const dishesRemaining = Math.max(0, limits.dishesPerMonth - dishesUsed);
      const enhancementsRemaining = Math.max(0, limits.enhancementsPerMonth - enhancementsUsed);

      res.json({
        usage: usage || null,
        limits,
        tier,
        dishesUsed,
        imagesUsed,
        enhancementsUsed,
        dishesRemaining,
        enhancementsRemaining,
        hasReachedLimit: dishesUsed >= limits.dishesPerMonth,
        hasReachedEnhancementLimit: enhancementsUsed >= limits.enhancementsPerMonth,
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

      console.log("[MenuItem Update] Received body:", JSON.stringify(req.body));

      // Parse and filter out undefined values, but keep null, false, 0, etc.
      const parsed = insertMenuItemSchema.partial().parse(req.body);
      const updates = Object.fromEntries(
        Object.entries(parsed).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedItem = await storage.updateMenuItem(req.params.id, updates);

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      if (error instanceof z.ZodError) {
        console.log("[MenuItem Update] Zod validation errors:", JSON.stringify(error.errors));
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

      // Delete images from R2 if they exist
      if (item.generatedImages && item.generatedImages.length > 0) {
        const r2Images = item.generatedImages.filter(url => url && url.startsWith('http'));
        if (r2Images.length > 0) {
          console.log(`[R2] Deleting ${r2Images.length} images from R2...`);
          await deleteImagesFromR2(r2Images).catch(err =>
            console.error('[R2] Failed to delete images:', err)
          );
        }
      }

      const deleted = await storage.deleteMenuItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // POST /api/menu-items/generate-description - Generate AI description for a dish
  app.post("/api/menu-items/generate-description", isAuthenticated, async (req: any, res) => {
    try {
      const generateDescriptionSchema = z.object({
        name: z.string().min(1),
        ingredients: z.array(z.string()).optional(),
        description: z.string().optional(),
      });

      const { name, ingredients, description } = generateDescriptionSchema.parse(req.body);

      // Build prompt for OpenAI
      let prompt = `Write a concise, appetizing menu description (2-3 sentences max) for a dish called "${name}".`;

      if (ingredients && ingredients.length > 0) {
        prompt += ` The dish includes: ${ingredients.join(", ")}.`;
      }

      if (description) {
        prompt += ` Additional context: ${description}`;
      }

      prompt += ` The description should be professional, enticing, and suitable for a restaurant menu. Focus on flavors, textures, and presentation.`;

      // Call OpenAI API
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional restaurant menu writer. Create appetizing, concise descriptions that highlight flavors and presentation.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        return res.status(500).json({ error: "Failed to generate description" });
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const generatedDescription = data.choices?.[0]?.message?.content?.trim();

      if (!generatedDescription) {
        return res.status(500).json({ error: "No description generated" });
      }

      res.json({ description: generatedDescription });
    } catch (error) {
      console.error("Description generation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({
        error: "Failed to generate description",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /api/menu-items/public/:userId - Get public menu (no auth required)
  app.get("/api/menu-items/public/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const items = await storage.getAllMenuItems(userId);

      // MenuItem type is already correct, no need to extend
      type PublicMenuEntry = {
        id: string;
        name: string;
        description: string | null;
        price: string | null;  // Changed to string to match MenuItem schema
        dietaryInfo: string[] | null;  // Changed to string[] to match MenuItem schema
        allergens: string[] | null;
        generatedImages: string[] | null;
        displayOrder: number;
        isAvailable: boolean;
        category: string;
      };

      // Only show items that have been finalized (have images)
      const finalizedItems = items.filter(item =>
        item.generatedImages &&
        Array.isArray(item.generatedImages) &&
        item.generatedImages.length > 0
      );

      const menuByCategory = finalizedItems.reduce<Record<string, PublicMenuEntry[]>>((acc, item) => {
        // Use the actual category from the item, no fallback
        const rawCategory = typeof item.category === "string" ? item.category.trim() : "";
        const category = rawCategory.length > 0 ? rawCategory : "Mains";
        if (!rawCategory) {
          console.warn(`Menu item "${item.name}" (ID: ${item.id}) has no category set`);
        }
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
          price: item.price ?? null,
          dietaryInfo: item.dietaryInfo ?? null,
          allergens: item.allergens ?? null,
          generatedImages: item.generatedImages ?? null,
          displayOrder: item.displayOrder ?? 0,
          isAvailable: item.isAvailable === 1,  // Convert integer to boolean
          category,
        });
        return acc;
      }, {});

      Object.keys(menuByCategory).forEach((category) => {
        const entries = menuByCategory[category];
        if (entries) {
          entries.sort((a, b) => a.displayOrder - b.displayOrder);
        }
      });

      res.json(menuByCategory);
    } catch (error) {
      console.error("Error fetching public menu:", error);
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  });

  // ============================================
  // IMAGE GENERATION ROUTE (With usage tracking and limits)
  // ============================================

  // POST /api/menu-items/:id/finalize - Save generated images to menu and count usage
  app.post("/api/menu-items/:id/finalize", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const menuItemId = req.params.id;

      const finalizeSchema = z.object({
        images: z.array(z.string()),
        selectedStyle: z.string(),
        action: z.enum(["save", "download"]), // "save" = save to menu, "download" = just download
        // Include all menu item fields that might have been updated during generation
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        ingredients: z.array(z.string()).nullable().optional(),
        category: z.string().optional(),
        price: z.string().nullable().optional(),
        dietaryInfo: z.array(z.string()).nullable().optional(),
        allergens: z.array(z.string()).nullable().optional(),
      });

      const { images, selectedStyle, action, ...menuItemUpdates } = finalizeSchema.parse(req.body);

      // Validate menu item exists and belongs to user
      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      if (menuItem.userId && menuItem.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if style is allowed for menu items
      const isMenuItemStyle = menuItemStyleOptions.includes(selectedStyle as any);
      const isDownloadOnlyStyle = !isMenuItemStyle;

      // For "save" action with download-only styles, return error
      if (action === "save" && isDownloadOnlyStyle) {
        return res.status(400).json({
          error: "Cannot save download-only style to menu",
          message: `The "${selectedStyle}" style can only be downloaded, not saved to menu items.`,
        });
      }

      const currentEditCount = (menuItem as any).editCount || 0;

      // Update menu item only if saving (not just downloading)
      let updatedItem = menuItem;
      if (action === "save") {
        // Filter out undefined values from menuItemUpdates
        const updates = Object.fromEntries(
          Object.entries(menuItemUpdates).filter(([_, value]) => value !== undefined)
        );

        const updated = await storage.updateMenuItem(menuItemId, {
          ...updates,
          generatedImages: images,
          selectedStyle: selectedStyle,
          editCount: currentEditCount + 1,
        });
        if (updated) {
          updatedItem = updated;
        }
      }

      // Track usage: 1 dish finalized, N images created
      await storage.incrementUsage(userId, 1, images.length);

      console.log(`[Finalize] Dish ${menuItemId} finalized with action: ${action}`);

      res.json({
        menuItem: updatedItem,
        action,
        success: true,
      });
    } catch (error) {
      console.error("Finalize error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({
        error: "Failed to finalize dish",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

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

      // Check if style is allowed for menu items (only for saving to menu)
      const isMenuItemStyle = menuItemStyleOptions.includes(style as any);
      const isDownloadOnlyStyle = !isMenuItemStyle;

      // Validate menu item exists and belongs to user
      const menuItem = await storage.getMenuItem(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }
      if (menuItem.userId && menuItem.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check edit count limit (max 2 edits per dish) - only for menu item styles
      const MAX_EDITS = 2;
      const currentEditCount = (menuItem as any).editCount || 0;
      if (!isDownloadOnlyStyle && currentEditCount >= MAX_EDITS) {
        return res.status(403).json({
          error: "Edit limit reached",
          message: `You've already regenerated images for this dish ${MAX_EDITS} times. You cannot regenerate images for this dish anymore.`,
          editCount: currentEditCount,
          maxEdits: MAX_EDITS,
        });
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

      const base64Images = previewResults.filter((url): url is string => Boolean(url));

      // Upload images to R2 and get public URLs
      console.log(`[R2] Uploading ${base64Images.length} images to R2...`);
      const imageUrls = await uploadImagesToR2(base64Images, `${menuItemId}-preview`);
      console.log(`[R2] Successfully uploaded images to R2`);

      // DO NOT save images to menu item or increment usage yet
      // User must explicitly save to menu or download for it to count
      console.log(`[Images] Preview generated - not counting against usage until saved/downloaded`);

      res.json({
        images: imageUrls,
        menuItem: menuItem, // Return original menu item, not updated
        downloadOnly: isDownloadOnlyStyle,
        isPreview: true, // Flag to indicate these are preview images
      });
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

      // Upload high-res images to R2
      console.log(`[R2] Uploading ${b64Images.length} high-res images to R2...`);
      const r2Urls = await uploadImagesToR2(b64Images, `${menuItemId}-highres`);
      console.log(`[R2] Successfully uploaded high-res images to R2`);

      // Replace old URLs with new high-res R2 URLs
      const updatedImages = [...(menuItem.generatedImages ?? [])];
      uniqueIndices.forEach((index, idx) => {
        const r2Url = r2Urls[idx];
        if (r2Url) {
          // Delete old image from R2 if it exists
          const oldUrl = updatedImages[index];
          if (oldUrl && oldUrl.startsWith('http')) {
            deleteImagesFromR2([oldUrl]).catch(err =>
              console.error('[R2] Failed to delete old image:', err)
            );
          }
          updatedImages[index] = r2Url;
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

  // ============================================
  // ESTABLISHMENT SETTINGS ENDPOINTS
  // ============================================

  /**
   * Get establishment settings for the authenticated user
   * Creates default settings if none exist
   */
  app.get("/api/establishment-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      let settings = await storage.getEstablishmentSettings(userId);

      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createEstablishmentSettings({
          userId,
          establishmentName: "Menu",
          tagline: null,
          logoUrl: null,
          coverStyle: "classic",
          accentColor: "#C85A54",
          fontFamily: "serif",
          itemsPerPage: 8,
          showPageNumbers: 1,
          showEstablishmentOnEveryPage: 0,
        });
      }

      // Convert integer booleans to boolean for frontend
      const response = {
        ...settings,
        showPageNumbers: Boolean(settings.showPageNumbers),
        showEstablishmentOnEveryPage: Boolean(settings.showEstablishmentOnEveryPage),
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching establishment settings:", error);
      res.status(500).json({
        error: "Failed to fetch establishment settings",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Update establishment settings for the authenticated user
   */
  app.put("/api/establishment-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Create a custom validation schema that accepts booleans for the boolean fields
      const apiUpdateSchema = z.object({
        establishmentName: z.string().optional(),
        tagline: z.string().nullable().optional(),
        logoUrl: z.string().nullable().optional(),
        coverStyle: z.enum(["classic", "modern", "rustic"]).optional(),
        accentColor: z.string().optional(),
        fontFamily: z.enum(["serif", "sans-serif", "modern"]).optional(),
        itemsPerPage: z.number().optional(),
        showPageNumbers: z.union([z.boolean(), z.number()]).optional(),
        showEstablishmentOnEveryPage: z.union([z.boolean(), z.number()]).optional(),
      });

      const validatedData = apiUpdateSchema.parse(req.body);

      // Convert boolean to integer for database
      const dbData = {
        ...validatedData,
        showPageNumbers: validatedData.showPageNumbers !== undefined
          ? Number(validatedData.showPageNumbers)
          : undefined,
        showEstablishmentOnEveryPage: validatedData.showEstablishmentOnEveryPage !== undefined
          ? Number(validatedData.showEstablishmentOnEveryPage)
          : undefined,
      };

      const updatedSettings = await storage.updateEstablishmentSettings(userId, dbData);

      if (!updatedSettings) {
        return res.status(404).json({ error: "Establishment settings not found" });
      }

      // Convert integer booleans to boolean for frontend
      const response = {
        ...updatedSettings,
        showPageNumbers: Boolean(updatedSettings.showPageNumbers),
        showEstablishmentOnEveryPage: Boolean(updatedSettings.showEstablishmentOnEveryPage),
      };

      res.json(response);
    } catch (error) {
      console.error("Error updating establishment settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors,
        });
      }
      res.status(500).json({
        error: "Failed to update establishment settings",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Get public establishment settings by user ID (for public menu)
   */
  app.get("/api/establishment-settings/public/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const settings = await storage.getEstablishmentSettings(userId);

      if (!settings) {
        // Return default settings if none exist
        return res.json({
          establishmentName: "Menu",
          tagline: null,
          logoUrl: null,
          coverStyle: "classic",
          accentColor: "#C85A54",
          fontFamily: "serif",
          itemsPerPage: 8,
          showPageNumbers: true,
          showEstablishmentOnEveryPage: false,
        });
      }

      // Convert integer booleans to boolean and only return public fields
      const publicSettings = {
        establishmentName: settings.establishmentName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl,
        coverStyle: settings.coverStyle,
        accentColor: settings.accentColor,
        fontFamily: settings.fontFamily,
        itemsPerPage: settings.itemsPerPage,
        showPageNumbers: Boolean(settings.showPageNumbers),
        showEstablishmentOnEveryPage: Boolean(settings.showEstablishmentOnEveryPage),
      };

      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public establishment settings:", error);
      res.status(500).json({
        error: "Failed to fetch establishment settings",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Image Enhancement Endpoints
   */

  // Configure multer for handling file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5, // Maximum 5 files at once
    },
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  /**
   * POST /api/enhance-image - Enhance a single image
   */
  app.post("/api/enhance-image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Check subscription and enhancement limits
      const subscription = await storage.getActiveSubscription(userId);
      const usage = await storage.getCurrentUsage(userId);
      const enhancementsUsed = usage?.enhancementsUsed || 0;

      const TRIAL_ENHANCEMENT_LIMIT = 5;
      const limits: TierLimits = subscription
        ? tierLimits[subscription.tier]
        : {
            dishesPerMonth: TRIAL_DISH_LIMIT,
            imagesPerDish: TRIAL_IMAGES_PER_DISH,
            enhancementsPerMonth: TRIAL_ENHANCEMENT_LIMIT,
            priceAED: 0,
            overagePricePerDish: 0,
          };

      // Check if user has reached enhancement limit
      if (enhancementsUsed >= limits.enhancementsPerMonth) {
        const isEnterprise = subscription?.tier === 'enterprise';
        if (!isEnterprise) {
          return res.status(403).json({
            error: "Enhancement limit reached",
            message: subscription
              ? `You've used all ${limits.enhancementsPerMonth} enhancements for this billing period. Upgrade for more enhancements.`
              : "You've used all 5 free trial enhancements. Subscribe to continue enhancing images.",
            enhancementsUsed,
            enhancementLimit: limits.enhancementsPerMonth,
            tier: subscription?.tier || 'trial',
          });
        }
      }

      // Check for HEIF/HEIC mime types and convert them immediately
      const heifMimeTypes = ['image/heif', 'image/heic', 'image/heif-sequence', 'image/heic-sequence'];
      let fileBuffer = req.file.buffer;
      let fileName = req.file.originalname;

      // Check file extension for HEIF/HEIC
      const isHeifExtension = fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif');

      if (heifMimeTypes.includes(req.file.mimetype) || req.file.mimetype === 'application/octet-stream' || isHeifExtension) {
        // Try to detect if it's actually HEIF/HEIC by checking magic bytes
        const header = fileBuffer.slice(4, 12).toString('hex');
        const isHeifMagicBytes = header.includes('667479706865') || // 'ftyphe' for HEIF
                                 header.includes('6674797068656963') || // 'ftypheic' for HEIC
                                 header.includes('6674797068656978'); // 'ftypheix' for HEIC variants

        if (isHeifMagicBytes || heifMimeTypes.includes(req.file.mimetype) || isHeifExtension) {
          try {
            // Convert HEIF/HEIC to JPEG using Sharp
            const sharp = (await import('sharp')).default;
            fileBuffer = await sharp(fileBuffer)
              .jpeg({ quality: 95, progressive: true })
              .toBuffer();
            // Update filename to reflect new format
            fileName = fileName.replace(/\.(heic|heif)$/i, '.jpg');
            console.log(`Converted HEIF/HEIC image to JPEG: ${fileName}`);
          } catch (conversionError) {
            console.error("Failed to convert HEIF/HEIC:", conversionError);
            return res.status(400).json({
              error: "Unable to convert HEIF/HEIC format",
              details: "Please use your phone's photo app or an image converter to export this image as JPEG before uploading."
            });
          }
        }
      }

      // Validate mime type (after potential conversion)
      const supportedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedMimeTypes.includes(req.file.mimetype) && !heifMimeTypes.includes(req.file.mimetype) && req.file.mimetype !== 'application/octet-stream') {
        return res.status(400).json({
          error: "Unsupported image format",
          details: `Supported formats: JPG, PNG, WEBP. Received: ${req.file.mimetype}`
        });
      }

      // Get enhancement type from request body
      const enhancementType = req.body.enhancementType || 'vibrant';

      // Validate enhancement type
      if (!['vibrant', 'natural', 'dramatic'].includes(enhancementType)) {
        return res.status(400).json({ error: "Invalid enhancement type" });
      }

      // Enhance the image (use potentially converted buffer and filename)
      const result = await enhanceImage(
        fileBuffer,
        fileName,
        userId,
        enhancementType as 'vibrant' | 'natural' | 'dramatic'
      );

      // Increment enhancement counter
      if (usage) {
        await storage.updateUsageRecord(usage.id, {
          enhancementsUsed: enhancementsUsed + 1,
        });
      }

      // Return the result directly (frontend expects this format)
      res.json(result);
    } catch (error: any) {
      console.error("Error enhancing image:", error);

      // Check if it's a format-related error
      if (error.message?.includes('HEIF') ||
          error.message?.includes('HEIC') ||
          error.message?.includes('format') ||
          error.message?.includes('bad seek') ||
          error.message?.includes('compression')) {
        return res.status(400).json({
          error: "Unsupported image format",
          details: "This image appears to be in HEIF/HEIC format. Please convert it to JPEG or PNG before uploading. You can use online converters or your phone's photo app to export as JPEG."
        });
      }

      res.status(500).json({
        error: "Failed to enhance image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/enhance-images - Enhance multiple images
   */
  app.post("/api/enhance-images", isAuthenticated, upload.array('images', 5), async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No image files provided" });
      }

      // Convert HEIF/HEIC files if present
      const heifMimeTypes = ['image/heif', 'image/heic', 'image/heif-sequence', 'image/heic-sequence'];
      const supportedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      const processedFiles = await Promise.all(req.files.map(async (file: any) => {
        let fileBuffer = file.buffer;
        let fileName = file.originalname;

        // Check file extension for HEIF/HEIC
        const isHeifExtension = fileName.toLowerCase().endsWith('.heic') || fileName.toLowerCase().endsWith('.heif');

        // Check if conversion is needed
        if (heifMimeTypes.includes(file.mimetype) || file.mimetype === 'application/octet-stream' || isHeifExtension) {
          const header = fileBuffer.slice(4, 12).toString('hex');
          const isHeifMagicBytes = header.includes('667479706865') ||
                                   header.includes('6674797068656963') ||
                                   header.includes('6674797068656978');

          if (isHeifMagicBytes || heifMimeTypes.includes(file.mimetype) || isHeifExtension) {
            try {
              const sharp = (await import('sharp')).default;
              fileBuffer = await sharp(fileBuffer)
                .jpeg({ quality: 95, progressive: true })
                .toBuffer();
              fileName = fileName.replace(/\.(heic|heif)$/i, '.jpg');
              console.log(`Converted HEIF/HEIC image to JPEG: ${fileName}`);
            } catch (conversionError) {
              throw new Error(`Failed to convert ${fileName}: ${conversionError}`);
            }
          }
        }

        // Validate mime type
        if (!supportedMimeTypes.includes(file.mimetype) &&
            !heifMimeTypes.includes(file.mimetype) &&
            file.mimetype !== 'application/octet-stream') {
          throw new Error(`Unsupported format for ${fileName}: ${file.mimetype}`);
        }

        return { buffer: fileBuffer, fileName };
      }));

      // Get enhancement type from request body
      const enhancementType = req.body.enhancementType || 'vibrant';

      // Validate enhancement type
      if (!['vibrant', 'natural', 'dramatic'].includes(enhancementType)) {
        return res.status(400).json({ error: "Invalid enhancement type" });
      }

      // Batch enhance images (using processed files with potential conversions)
      const results = await batchEnhanceImages(
        processedFiles,
        userId,
        enhancementType as 'vibrant' | 'natural' | 'dramatic'
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error("Error enhancing images:", error);

      // Check if it's a format-related error
      if (error.message?.includes('HEIF') ||
          error.message?.includes('HEIC') ||
          error.message?.includes('format') ||
          error.message?.includes('bad seek') ||
          error.message?.includes('compression')) {
        return res.status(400).json({
          error: "Unsupported image format",
          details: "One or more images appear to be in HEIF/HEIC format. Please convert them to JPEG or PNG before uploading."
        });
      }

      res.status(500).json({
        error: "Failed to enhance images",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/analyze-food-image - Analyze a food image with AI
   */
  app.post("/api/analyze-food-image", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Analyze the food image
      const analysis = await analyzeFoodImage(req.file.buffer);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("Error analyzing food image:", error);
      res.status(500).json({
        error: "Failed to analyze food image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============================================
  // MAINTENANCE ENDPOINTS
  // ============================================

  /**
   * POST /api/maintenance/fix-menu-categories - Fix menu items with null categories
   */
  app.post("/api/maintenance/fix-menu-categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get all menu items for the user
      const items = await storage.getAllMenuItems(userId);

      let fixedCount = 0;
      const fixedItems = [];

      for (const item of items) {
        if (!item.category) {
          // Default to 'Mains' for items without categories
          const updated = await storage.updateMenuItem(item.id, {
            ...item,
            category: 'Mains',
          });

          if (updated) {
            fixedCount++;
            fixedItems.push({
              id: item.id,
              name: item.name,
              oldCategory: null,
              newCategory: 'Mains'
            });
          }
        }
      }

      res.json({
        success: true,
        message: `Fixed ${fixedCount} menu items with missing categories`,
        fixedItems,
      });
    } catch (error) {
      console.error("Error fixing menu categories:", error);
      res.status(500).json({
        error: "Failed to fix menu categories",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
