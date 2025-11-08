export const HEADSHOT_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 2900, // $29 in cents
    headshots: 40,
    backgrounds: 4,
    outfits: 4,
    editCredits: 4,
    turnaroundHours: 3,
    stripePriceId: process.env.STRIPE_PRICE_BASIC || 'price_basic_xxx',
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    price: 3900, // $39
    headshots: 100,
    backgrounds: 10,
    outfits: 10,
    editCredits: 10,
    turnaroundHours: 2,
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_pro_xxx',
    popular: true,
  },
  executive: {
    id: 'executive',
    name: 'Executive Plan',
    price: 5900, // $59
    headshots: 200,
    backgrounds: 20,
    outfits: 20,
    editCredits: 20,
    turnaroundHours: 1,
    stripePriceId: process.env.STRIPE_PRICE_EXECUTIVE || 'price_exec_xxx',
  },
};

export function getPlan(planId: string) {
  return HEADSHOT_PLANS[planId as keyof typeof HEADSHOT_PLANS];
}
