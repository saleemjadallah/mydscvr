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

// ========================================
// VISADOCS PLANS
// ========================================

export const VISADOCS_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 2900, // $29 in cents
    stripePriceId: process.env.STRIPE_PRICE_VISADOCS_BASIC || 'price_visadocs_basic_xxx',
    features: {
      // Core features
      visaPhotos: true, // Visa-compliant photos for all countries
      photoFormats: 'all', // All formats (UAE, Schengen, USA, etc.)
      documentScanning: true, // Upload and scan documents
      documentExtraction: true, // AI extracts data from passports, certificates
      requirementsChecklist: 1, // Checklist for 1 visa type

      // Advanced features
      formAutoFill: 0, // No auto-fill
      documentTranslation: 0, // No translation
      chatSupport: false, // No AI Q&A chatbot
      completenessCheck: 'basic', // Basic checklist only

      // Support
      emailSupport: true,
      prioritySupport: false,
      agentConsultation: false,
    },
    description: 'Perfect for visa photos and basic document assistance',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 9900, // $99
    stripePriceId: process.env.STRIPE_PRICE_VISADOCS_PROFESSIONAL || 'price_visadocs_pro_xxx',
    popular: true,
    features: {
      // Core features (everything from Basic)
      visaPhotos: true,
      photoFormats: 'all',
      documentScanning: true,
      documentExtraction: true,
      requirementsChecklist: 'unlimited', // Unlimited visa types

      // Advanced features
      formAutoFill: 3, // Auto-fill up to 3 forms
      documentTranslation: 10, // Translate up to 10 pages
      chatSupport: true, // AI Q&A chatbot with RAG
      completenessCheck: 'advanced', // AI-powered completeness verification

      // Support
      emailSupport: true,
      prioritySupport: true,
      agentConsultation: false,
    },
    description: 'Complete document preparation with AI assistance',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 29900, // $299
    stripePriceId: process.env.STRIPE_PRICE_VISADOCS_PREMIUM || 'price_visadocs_premium_xxx',
    features: {
      // Core features (everything from Professional)
      visaPhotos: true,
      photoFormats: 'all',
      documentScanning: true,
      documentExtraction: true,
      requirementsChecklist: 'unlimited',

      // Advanced features (unlimited)
      formAutoFill: 'unlimited', // Unlimited form auto-fill
      documentTranslation: 'unlimited', // Unlimited translation
      chatSupport: true,
      completenessCheck: 'premium', // Premium AI verification with recommendations

      // Premium-only features
      agentConsultation: true, // 30-min licensed agent consultation
      documentCourier: true, // Coordination for document courier
      applicationTracking: true, // Track application status
      whiteGloveSupport: true, // Dedicated support

      // Support
      emailSupport: true,
      prioritySupport: true,
    },
    description: 'White-glove service with licensed agent consultation',
  },
};

export function getVisaDocsPlan(planId: string) {
  return VISADOCS_PLANS[planId as keyof typeof VISADOCS_PLANS];
}

// Helper to get all plans (for pricing page)
export function getAllVisaDocsPlans() {
  return Object.values(VISADOCS_PLANS);
}

// Helper to validate plan
export function isValidVisaDocsPlan(planId: string): boolean {
  return planId in VISADOCS_PLANS;
}
