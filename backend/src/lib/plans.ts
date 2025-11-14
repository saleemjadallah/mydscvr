export const HEADSHOT_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 2900, // $29 in cents
    headshots: 10,
    backgrounds: 2,
    outfits: 2,
    editCredits: 2,
    turnaroundHours: 3,
    stripePriceId: process.env.STRIPE_PRICE_BASIC || 'price_basic_xxx',
    // Virtual wardrobe features
    canChangeOutfits: false, // Not available in Basic plan
    virtualOutfits: 0,
    premiumOutfits: 0,
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    price: 3900, // $39
    headshots: 15,
    backgrounds: 3,
    outfits: 3,
    editCredits: 10, // Increased to 10 for Professional plan
    turnaroundHours: 2,
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_pro_xxx',
    popular: true,
    // Virtual wardrobe features
    canChangeOutfits: true, // Available in Professional plan
    virtualOutfits: 5, // Can select up to 5 virtual outfits per edit
    premiumOutfits: 2, // 2 can be premium outfits
  },
  executive: {
    id: 'executive',
    name: 'Executive Plan',
    price: 5900, // $59
    headshots: 20,
    backgrounds: 5,
    outfits: 5,
    editCredits: 20, // Increased to 20 for Executive plan
    turnaroundHours: 1,
    stripePriceId: process.env.STRIPE_PRICE_EXECUTIVE || 'price_exec_xxx',
    // Virtual wardrobe features
    canChangeOutfits: true, // Available in Executive plan
    virtualOutfits: Infinity, // Unlimited virtual outfits
    premiumOutfits: Infinity, // All premium outfits included
  },
};

export function getPlan(planId: string) {
  return HEADSHOT_PLANS[planId as keyof typeof HEADSHOT_PLANS];
}
