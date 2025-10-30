import type Stripe from "stripe";

declare module "stripe" {
  namespace Stripe {
    interface Subscription {
      current_period_start?: number | null;
      current_period_end?: number | null;
      trial_start?: number | null;
      trial_end?: number | null;
    }

    interface Invoice {
      subscription?: string | Stripe.Subscription | null;
      payment_intent?: string | Stripe.PaymentIntent | null;
    }
  }
}
