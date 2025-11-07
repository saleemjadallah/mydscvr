import Stripe from 'stripe';
import { getPlan } from './plans.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Create checkout session for plan purchase
export async function createCheckoutSession(
  userId: string,
  plan: 'basic' | 'professional' | 'executive',
  metadata: {
    uploadedPhotos: string[];
    styleTemplates: string[];
    preferences?: any;
  }
): Promise<string> {
  const planConfig = getPlan(plan);

  if (!planConfig) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment', // ONE-TIME payment, not subscription
    line_items: [
      {
        price: planConfig.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/processing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/upload`,
    metadata: {
      userId,
      plan,
      uploadedPhotos: JSON.stringify(metadata.uploadedPhotos),
      styleTemplates: JSON.stringify(metadata.styleTemplates),
      preferences: JSON.stringify(metadata.preferences || {}),
    },
  });

  return session.url!;
}

// Verify checkout session
export async function verifySession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

// Handle webhook events
export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

export default stripe;
