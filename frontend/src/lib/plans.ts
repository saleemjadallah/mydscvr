import { PlanConfig } from '@/types';

export const HEADSHOT_PLANS: { [key: string]: PlanConfig } = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 2900, // $29 in cents
    headshots: 40,
    backgrounds: 4,
    outfits: 4,
    editCredits: 4,
    turnaroundHours: 3,
    stripePriceId: 'price_basic_xxx', // Replace with actual Stripe price ID
    features: [
      '40 professional headshots',
      '4 unique backgrounds',
      '4 outfit styles',
      '4 edit credits',
      '3-hour turnaround',
      'High-resolution downloads',
      'Full commercial rights',
    ],
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
    stripePriceId: 'price_pro_xxx',
    popular: true, // Show "Most Popular" badge
    features: [
      '100 professional headshots',
      '10 unique backgrounds',
      '10 outfit styles',
      '10 edit credits',
      '2-hour turnaround',
      'High-resolution downloads',
      'Full commercial rights',
      'Priority support',
    ],
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
    stripePriceId: 'price_exec_xxx',
    features: [
      '200 professional headshots',
      '20 unique backgrounds',
      '20 outfit styles',
      '20 edit credits',
      '1-hour turnaround',
      'High-resolution downloads',
      'Full commercial rights',
      'Priority support',
      'Satisfaction guarantee',
    ],
  },
};

// Get plan by ID
export const getPlan = (id: string): PlanConfig | undefined => {
  return HEADSHOT_PLANS[id];
};

// Get all plans as array
export const getAllPlans = (): PlanConfig[] => {
  return Object.values(HEADSHOT_PLANS);
};

// Format price for display
export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(0)}`;
};

// Calculate headshots per template
export const calculateHeadshotsPerTemplate = (
  totalHeadshots: number,
  templateCount: number
): number => {
  return Math.floor(totalHeadshots / templateCount);
};
