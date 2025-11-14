/**
 * Professional Wardrobe Data Structure
 * Defines 20+ professional outfits for virtual try-on using Gemini AI
 */

export interface ProfessionalOutfit {
  id: string;
  name: string;
  category: 'business-formal' | 'business-casual' | 'creative' | 'executive' | 'industry-specific';
  description: string;

  // Visual details for Gemini
  attire: string; // Full description for AI prompt
  colors: string[]; // Available color options
  formality: number; // 1-10 scale

  // Metadata
  gender: 'male' | 'female' | 'unisex';
  occasions: string[];
  thumbnail: string; // Preview image URL
  premium: boolean;

  // Gemini-specific
  geminiPrompt: string; // Detailed outfit description for AI
  styleModifiers: string[]; // Additional style hints

  // Compatibility
  compatibleTemplates: string[]; // Which style templates work best
  incompatibleTemplates?: string[]; // Templates to avoid
}

export const PROFESSIONAL_WARDROBE: ProfessionalOutfit[] = [
  // ==========================================
  // BUSINESS FORMAL - MALE
  // ==========================================
  {
    id: 'navy-suit-classic-male',
    name: 'Classic Navy Suit',
    category: 'business-formal',
    description: 'Traditional navy business suit with white dress shirt and tie',
    attire: 'Navy blue two-piece business suit, crisp white dress shirt, silk tie',
    colors: ['navy', 'white', 'burgundy', 'silver'],
    formality: 10,
    gender: 'male',
    occasions: ['Executive meetings', 'LinkedIn', 'Corporate website', 'Board presentations', 'Resume'],
    thumbnail: '/assets/wardrobe/navy-suit-male.jpg',
    premium: false,
    compatibleTemplates: ['linkedin', 'corporate', 'resume', 'executive'],
    geminiPrompt: `
      Professional business attire:
      - Navy blue two-piece suit (single-breasted, notch lapel)
      - Crisp white dress shirt with spread collar
      - Silk tie in burgundy or navy pattern
      - Polished black leather dress shoes (if visible)
      - Silver or gold cufflinks (subtle)
      - Professional fit: tailored, not baggy
      - Clean, pressed appearance
      Style: Traditional corporate professional, confidence-inspiring
    `,
    styleModifiers: ['formal', 'traditional', 'executive', 'trustworthy'],
  },

  {
    id: 'charcoal-suit-modern-male',
    name: 'Modern Charcoal Suit',
    category: 'business-formal',
    description: 'Contemporary charcoal suit with slim fit',
    attire: 'Charcoal gray slim-fit suit, light blue shirt, patterned tie',
    colors: ['charcoal', 'light-blue', 'navy', 'burgundy'],
    formality: 9,
    gender: 'male',
    occasions: ['Professional LinkedIn', 'Corporate website', 'Business meetings', 'Interviews'],
    thumbnail: '/assets/wardrobe/charcoal-suit-male.jpg',
    premium: false,
    compatibleTemplates: ['linkedin', 'corporate', 'professional'],
    geminiPrompt: `
      Modern professional business attire:
      - Charcoal gray two-piece suit (slim fit, contemporary cut)
      - Light blue dress shirt with button-down or spread collar
      - Patterned silk tie (geometric or diagonal stripes)
      - Modern professional aesthetic
      - Well-fitted, sharp lines
      - Clean, contemporary appearance
      Style: Modern corporate professional, approachable yet authoritative
    `,
    styleModifiers: ['modern', 'professional', 'approachable', 'confident'],
  },

  {
    id: 'black-suit-executive-male',
    name: 'Executive Black Suit',
    category: 'executive',
    description: 'Premium black suit for C-suite presence',
    attire: 'Black premium tailored suit, white shirt, power tie',
    colors: ['black', 'white', 'red', 'silver'],
    formality: 10,
    gender: 'male',
    occasions: ['Executive headshots', 'C-suite', 'Board photos', 'High-level meetings'],
    thumbnail: '/assets/wardrobe/black-suit-executive-male.jpg',
    premium: true,
    compatibleTemplates: ['executive', 'corporate', 'linkedin'],
    geminiPrompt: `
      Premium executive business attire:
      - Black two-piece suit (luxury fabric, impeccable tailoring)
      - Crisp white premium dress shirt
      - Power tie (red, burgundy, or navy)
      - High-end professional appearance
      - Perfect fit and drape
      - Commanding executive presence
      Style: C-suite executive, authoritative, premium
    `,
    styleModifiers: ['executive', 'authoritative', 'premium', 'leadership'],
  },

  // ==========================================
  // BUSINESS FORMAL - FEMALE
  // ==========================================
  {
    id: 'navy-blazer-female',
    name: 'Professional Navy Blazer',
    category: 'business-formal',
    description: 'Tailored navy blazer with coordinated blouse',
    attire: 'Navy blazer, ivory or white blouse, minimal professional jewelry',
    colors: ['navy', 'white', 'ivory', 'light-blue'],
    formality: 9,
    gender: 'female',
    occasions: ['LinkedIn', 'Corporate website', 'Professional meetings', 'Resume'],
    thumbnail: '/assets/wardrobe/navy-blazer-female.jpg',
    premium: false,
    compatibleTemplates: ['linkedin', 'corporate', 'resume', 'professional'],
    geminiPrompt: `
      Professional business attire:
      - Navy blue tailored blazer (single-breasted, notch or shawl collar)
      - Ivory or white silk blouse or professional top
      - Minimal professional jewelry (small earrings, simple necklace)
      - Professional styling: neat, polished
      - Well-fitted, flattering cut
      - Clean, professional appearance
      Style: Professional, confident, approachable
    `,
    styleModifiers: ['professional', 'confident', 'approachable', 'polished'],
  },

  {
    id: 'power-blazer-female',
    name: 'Executive Power Blazer',
    category: 'executive',
    description: 'Premium tailored blazer for leadership presence',
    attire: 'Charcoal or navy executive blazer, silk blouse, sophisticated jewelry',
    colors: ['charcoal', 'navy', 'burgundy', 'ivory'],
    formality: 10,
    gender: 'female',
    occasions: ['Executive photos', 'Leadership LinkedIn', 'C-suite', 'Speaking engagements'],
    thumbnail: '/assets/wardrobe/power-blazer-female.jpg',
    premium: true,
    compatibleTemplates: ['executive', 'corporate', 'speaker', 'linkedin'],
    geminiPrompt: `
      Executive leadership attire:
      - Premium tailored blazer in charcoal gray or navy (luxury fabric, perfect fit)
      - Silk blouse in complementary color
      - Sophisticated minimal jewelry (statement earrings or necklace, not both)
      - Executive styling: polished, authoritative
      - Impeccable fit and presence
      - Commanding yet approachable
      Style: Executive leadership, authoritative, sophisticated
    `,
    styleModifiers: ['executive', 'authoritative', 'sophisticated', 'leadership'],
  },

  {
    id: 'dress-blazer-combo-female',
    name: 'Professional Dress & Blazer',
    category: 'business-formal',
    description: 'Coordinated dress with blazer',
    attire: 'Sheath dress with structured blazer, professional accessories',
    colors: ['navy', 'black', 'burgundy', 'charcoal'],
    formality: 9,
    gender: 'female',
    occasions: ['Corporate website', 'Professional meetings', 'LinkedIn', 'Conferences'],
    thumbnail: '/assets/wardrobe/dress-blazer-female.jpg',
    premium: false,
    compatibleTemplates: ['corporate', 'linkedin', 'professional'],
    geminiPrompt: `
      Professional business attire:
      - Professional sheath dress in solid color
      - Structured blazer overtop (can be same or complementary color)
      - Minimal professional accessories
      - Polished, put-together appearance
      - Professional styling
      Style: Corporate professional, polished, confident
    `,
    styleModifiers: ['corporate', 'polished', 'professional', 'feminine'],
  },

  // ==========================================
  // BUSINESS CASUAL - UNISEX
  // ==========================================
  {
    id: 'smart-casual-blazer-unisex',
    name: 'Smart Casual Blazer',
    category: 'business-casual',
    description: 'Modern blazer with open-collar shirt',
    attire: 'Fitted blazer, button-down with open collar, smart casual',
    colors: ['gray', 'blue', 'white', 'navy'],
    formality: 7,
    gender: 'unisex',
    occasions: ['Startup environment', 'Creative roles', 'Modern professional', 'Casual LinkedIn'],
    thumbnail: '/assets/wardrobe/smart-casual.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'creative', 'linkedin', 'social'],
    geminiPrompt: `
      Smart casual professional attire:
      - Fitted blazer (can be textured or patterned)
      - Button-down shirt with open collar (no tie)
      - Modern, relaxed but professional appearance
      - Clean, contemporary styling
      - Approachable yet professional
      Style: Modern professional, approachable, smart casual
    `,
    styleModifiers: ['modern', 'approachable', 'casual-professional', 'contemporary'],
  },

  {
    id: 'business-casual-sweater-male',
    name: 'Business Casual Sweater',
    category: 'business-casual',
    description: 'V-neck sweater over collared shirt',
    attire: 'V-neck sweater, collared shirt, business casual pants',
    colors: ['navy', 'gray', 'burgundy', 'forest-green'],
    formality: 6,
    gender: 'male',
    occasions: ['Casual professional', 'Tech industry', 'Creative roles', 'Approachable LinkedIn'],
    thumbnail: '/assets/wardrobe/sweater-male.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'creative', 'social'],
    geminiPrompt: `
      Business casual attire:
      - V-neck sweater in solid color
      - Collared shirt underneath (collar visible)
      - Relaxed professional appearance
      - Clean, neat styling
      - Warm, approachable aesthetic
      Style: Business casual, approachable, friendly professional
    `,
    styleModifiers: ['casual', 'approachable', 'warm', 'friendly'],
  },

  {
    id: 'cardigan-professional-female',
    name: 'Professional Cardigan',
    category: 'business-casual',
    description: 'Structured cardigan with professional top',
    attire: 'Structured cardigan, professional blouse or knit top',
    colors: ['navy', 'gray', 'burgundy', 'camel'],
    formality: 6,
    gender: 'female',
    occasions: ['Business casual', 'Creative professional', 'Approachable team photo'],
    thumbnail: '/assets/wardrobe/cardigan-female.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'creative', 'social'],
    geminiPrompt: `
      Business casual attire:
      - Structured cardigan (fitted, professional cut)
      - Professional blouse or knit top underneath
      - Minimal jewelry
      - Polished but approachable appearance
      - Neat, professional styling
      Style: Business casual, approachable, professional
    `,
    styleModifiers: ['casual', 'approachable', 'professional', 'warm'],
  },

  // ==========================================
  // CREATIVE PROFESSIONAL
  // ==========================================
  {
    id: 'creative-blazer-unisex',
    name: 'Creative Professional Blazer',
    category: 'creative',
    description: 'Modern blazer with creative flair',
    attire: 'Textured or patterned blazer, stylish shirt, creative aesthetic',
    colors: ['charcoal', 'navy', 'olive', 'burgundy'],
    formality: 7,
    gender: 'unisex',
    occasions: ['Creative industry', 'Design portfolio', 'Modern professional', 'Agency work'],
    thumbnail: '/assets/wardrobe/creative-blazer.jpg',
    premium: false,
    compatibleTemplates: ['creative', 'casual', 'social'],
    geminiPrompt: `
      Creative professional attire:
      - Blazer with texture, pattern, or unique cut
      - Stylish shirt or top (can have pattern or color)
      - Modern, creative styling
      - Professional but personality-forward
      - Contemporary aesthetic
      Style: Creative professional, modern, personality-driven
    `,
    styleModifiers: ['creative', 'modern', 'stylish', 'personality'],
  },

  {
    id: 'turtleneck-professional-unisex',
    name: 'Modern Turtleneck',
    category: 'creative',
    description: 'Fitted turtleneck for creative professional look',
    attire: 'Fitted turtleneck, structured jacket or blazer optional',
    colors: ['black', 'navy', 'gray', 'burgundy'],
    formality: 7,
    gender: 'unisex',
    occasions: ['Creative professional', 'Tech industry', 'Design portfolio', 'Modern LinkedIn'],
    thumbnail: '/assets/wardrobe/turtleneck.jpg',
    premium: false,
    compatibleTemplates: ['creative', 'casual', 'social'],
    geminiPrompt: `
      Modern creative professional attire:
      - Fitted turtleneck in solid color
      - Structured jacket or blazer optional
      - Clean, minimalist aesthetic
      - Contemporary professional styling
      - Modern, confident appearance
      Style: Creative professional, minimalist, modern
    `,
    styleModifiers: ['creative', 'minimalist', 'modern', 'tech-forward'],
  },

  // ==========================================
  // INDUSTRY-SPECIFIC
  // ==========================================
  {
    id: 'medical-scrubs-unisex',
    name: 'Medical Professional Scrubs',
    category: 'industry-specific',
    description: 'Professional medical scrubs',
    attire: 'Clean medical scrubs, stethoscope optional',
    colors: ['navy', 'ceil-blue', 'burgundy', 'hunter-green'],
    formality: 8,
    gender: 'unisex',
    occasions: ['Healthcare', 'Hospital directory', 'Medical LinkedIn', 'Clinic website'],
    thumbnail: '/assets/wardrobe/medical-scrubs.jpg',
    premium: false,
    compatibleTemplates: ['corporate', 'linkedin', 'professional'],
    geminiPrompt: `
      Medical professional attire:
      - Clean, professional medical scrubs (solid color)
      - Stethoscope draped around neck (optional)
      - Professional, clean appearance
      - Healthcare setting aesthetic
      - Trustworthy, competent styling
      Style: Medical professional, trustworthy, clean
    `,
    styleModifiers: ['medical', 'professional', 'trustworthy', 'healthcare'],
  },

  {
    id: 'chef-jacket-unisex',
    name: 'Chef Professional',
    category: 'industry-specific',
    description: 'Professional chef attire',
    attire: 'Chef\'s jacket, professional culinary appearance',
    colors: ['white', 'black'],
    formality: 7,
    gender: 'unisex',
    occasions: ['Restaurant websites', 'Culinary professionals', 'Chef portfolio', 'Food industry'],
    thumbnail: '/assets/wardrobe/chef-jacket.jpg',
    premium: false,
    compatibleTemplates: ['corporate', 'creative', 'professional'],
    geminiPrompt: `
      Culinary professional attire:
      - Professional chef's jacket (double-breasted, white or black)
      - Clean, pressed appearance
      - Professional culinary styling
      - Confident, skilled aesthetic
      Style: Culinary professional, skilled, confident
    `,
    styleModifiers: ['culinary', 'professional', 'skilled', 'creative'],
  },

  {
    id: 'tech-hoodie-unisex',
    name: 'Tech Professional Hoodie',
    category: 'creative',
    description: 'Modern tech industry casual professional',
    attire: 'Premium hoodie or quarter-zip, modern tech aesthetic',
    colors: ['gray', 'black', 'navy', 'charcoal'],
    formality: 5,
    gender: 'unisex',
    occasions: ['Tech startups', 'Developer profiles', 'Modern tech company', 'GitHub profile'],
    thumbnail: '/assets/wardrobe/tech-hoodie.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'creative', 'social'],
    geminiPrompt: `
      Tech professional casual attire:
      - Premium hoodie or quarter-zip pullover (solid color, quality fabric)
      - Modern, clean tech aesthetic
      - Casual yet professional appearance
      - Contemporary tech industry styling
      Style: Tech professional, modern, casual-confident
    `,
    styleModifiers: ['tech', 'casual', 'modern', 'startup'],
  },

  {
    id: 'lab-coat-unisex',
    name: 'Lab Coat Professional',
    category: 'industry-specific',
    description: 'Professional lab coat for scientists/researchers',
    attire: 'White lab coat over professional attire',
    colors: ['white'],
    formality: 8,
    gender: 'unisex',
    occasions: ['Research', 'Scientific LinkedIn', 'Lab websites', 'Academic profiles'],
    thumbnail: '/assets/wardrobe/lab-coat.jpg',
    premium: false,
    compatibleTemplates: ['corporate', 'linkedin', 'professional'],
    geminiPrompt: `
      Scientific professional attire:
      - Clean white lab coat (professional fit)
      - Professional attire visible underneath
      - Scientific, academic aesthetic
      - Knowledgeable, credible appearance
      Style: Scientific professional, credible, academic
    `,
    styleModifiers: ['scientific', 'academic', 'professional', 'credible'],
  },

  // Additional outfits to reach 20+
  {
    id: 'blue-blazer-khakis-male',
    name: 'Classic Blue Blazer',
    category: 'business-casual',
    description: 'Navy blazer with khaki pants look',
    attire: 'Navy blazer, khaki pants, oxford shirt',
    colors: ['navy', 'khaki', 'light-blue', 'white'],
    formality: 7,
    gender: 'male',
    occasions: ['Business casual', 'Country club', 'Networking events', 'LinkedIn'],
    thumbnail: '/assets/wardrobe/blue-blazer-male.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'linkedin', 'social'],
    geminiPrompt: `
      Business casual attire:
      - Navy blue blazer (classic fit)
      - Khaki or tan dress pants
      - Oxford or button-down shirt (light blue or white)
      - Classic business casual aesthetic
      - Polished but relaxed
      Style: Classic business casual, approachable, professional
    `,
    styleModifiers: ['casual', 'classic', 'approachable', 'timeless'],
  },

  {
    id: 'white-blouse-professional-female',
    name: 'Classic White Blouse',
    category: 'business-formal',
    description: 'Crisp white blouse professional look',
    attire: 'White silk blouse, tailored pants or skirt',
    colors: ['white', 'ivory', 'cream'],
    formality: 8,
    gender: 'female',
    occasions: ['Professional meetings', 'LinkedIn', 'Corporate', 'Interviews'],
    thumbnail: '/assets/wardrobe/white-blouse-female.jpg',
    premium: false,
    compatibleTemplates: ['linkedin', 'corporate', 'professional'],
    geminiPrompt: `
      Professional business attire:
      - Crisp white silk blouse
      - Tailored pants or pencil skirt
      - Minimal elegant jewelry
      - Clean, classic professional appearance
      - Polished, confident styling
      Style: Classic professional, elegant, timeless
    `,
    styleModifiers: ['classic', 'elegant', 'professional', 'timeless'],
  },

  {
    id: 'polo-shirt-smart-casual-male',
    name: 'Smart Casual Polo',
    category: 'business-casual',
    description: 'Professional polo shirt look',
    attire: 'Premium polo shirt, dress pants or chinos',
    colors: ['navy', 'black', 'gray', 'burgundy'],
    formality: 5,
    gender: 'male',
    occasions: ['Casual work environment', 'Tech company', 'Startup', 'Business casual'],
    thumbnail: '/assets/wardrobe/polo-male.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'social', 'creative'],
    geminiPrompt: `
      Smart casual attire:
      - Premium polo shirt (solid color, quality fabric)
      - Dress pants or chinos
      - Relaxed professional appearance
      - Clean, neat styling
      Style: Smart casual, approachable, relaxed professional
    `,
    styleModifiers: ['casual', 'relaxed', 'approachable', 'modern'],
  },

  {
    id: 'architect-black-outfit-unisex',
    name: 'Architect All-Black',
    category: 'creative',
    description: 'All-black creative professional look',
    attire: 'Black shirt or turtleneck, black jacket',
    colors: ['black'],
    formality: 7,
    gender: 'unisex',
    occasions: ['Creative industry', 'Architecture', 'Design', 'Fashion'],
    thumbnail: '/assets/wardrobe/architect-black.jpg',
    premium: true,
    compatibleTemplates: ['creative', 'casual', 'social'],
    geminiPrompt: `
      Creative professional attire:
      - All-black ensemble (shirt or turtleneck, jacket)
      - Minimalist, sophisticated aesthetic
      - Modern, artistic styling
      - Confident, creative presence
      Style: Creative professional, minimalist, sophisticated
    `,
    styleModifiers: ['creative', 'minimalist', 'artistic', 'sophisticated'],
  },

  {
    id: 'summer-linen-blazer-unisex',
    name: 'Summer Linen Blazer',
    category: 'business-casual',
    description: 'Light linen blazer for warm climate professionals',
    attire: 'Linen blazer, light shirt, summer business look',
    colors: ['beige', 'light-gray', 'cream', 'white'],
    formality: 6,
    gender: 'unisex',
    occasions: ['Summer business', 'Outdoor events', 'Resort business', 'Warm climate'],
    thumbnail: '/assets/wardrobe/linen-blazer.jpg',
    premium: false,
    compatibleTemplates: ['casual', 'social', 'creative'],
    geminiPrompt: `
      Summer business attire:
      - Light-weight linen blazer (beige, light gray, or cream)
      - Light-colored shirt underneath
      - Relaxed summer professional aesthetic
      - Breathable, comfortable appearance
      Style: Summer professional, relaxed, sophisticated
    `,
    styleModifiers: ['casual', 'summer', 'relaxed', 'sophisticated'],
  },

  {
    id: 'statement-blazer-female',
    name: 'Statement Blazer',
    category: 'creative',
    description: 'Bold colored blazer for personality',
    attire: 'Bold colored blazer, coordinated top',
    colors: ['burgundy', 'emerald', 'royal-blue', 'deep-purple'],
    formality: 7,
    gender: 'female',
    occasions: ['Creative roles', 'Marketing', 'PR', 'Media'],
    thumbnail: '/assets/wardrobe/statement-blazer-female.jpg',
    premium: true,
    compatibleTemplates: ['creative', 'social', 'casual'],
    geminiPrompt: `
      Creative professional attire:
      - Bold colored blazer (burgundy, emerald, royal blue, or deep purple)
      - Coordinated top underneath
      - Confident, personality-forward styling
      - Modern, professional appearance
      Style: Creative professional, confident, personality-driven
    `,
    styleModifiers: ['creative', 'bold', 'confident', 'modern'],
  },
];

// Export by category for easy filtering
export const WARDROBE_BY_CATEGORY = {
  'business-formal': PROFESSIONAL_WARDROBE.filter(o => o.category === 'business-formal'),
  'business-casual': PROFESSIONAL_WARDROBE.filter(o => o.category === 'business-casual'),
  'creative': PROFESSIONAL_WARDROBE.filter(o => o.category === 'creative'),
  'executive': PROFESSIONAL_WARDROBE.filter(o => o.category === 'executive'),
  'industry-specific': PROFESSIONAL_WARDROBE.filter(o => o.category === 'industry-specific'),
};

// Export outfit compatibility checker
export function isOutfitCompatibleWithTemplate(
  outfitId: string,
  templateId: string
): boolean {
  const outfit = PROFESSIONAL_WARDROBE.find(o => o.id === outfitId);
  if (!outfit) return false;

  if (outfit.incompatibleTemplates?.includes(templateId)) {
    return false;
  }

  if (outfit.compatibleTemplates && outfit.compatibleTemplates.length > 0) {
    return outfit.compatibleTemplates.includes(templateId);
  }

  return true; // Default: allow all combinations
}

// Get outfit recommendations based on user's industry/role
export function getRecommendedOutfits(
  industry: string,
  role: string,
  gender: 'male' | 'female' | 'unisex' = 'unisex'
): ProfessionalOutfit[] {

  // Industry mapping
  const industryKeywords: Record<string, string[]> = {
    'finance': ['business-formal', 'executive'],
    'tech': ['business-casual', 'creative'],
    'healthcare': ['industry-specific'],
    'creative': ['creative', 'business-casual'],
    'consulting': ['business-formal', 'executive'],
    'startup': ['business-casual', 'creative'],
  };

  // Role mapping to minimum formality
  const roleKeywords: Record<string, number> = {
    'ceo': 10,
    'executive': 9,
    'director': 9,
    'manager': 8,
    'senior': 7,
    'engineer': 6,
    'designer': 6,
    'analyst': 7,
  };

  const relevantCategories = industryKeywords[industry.toLowerCase()] || ['business-formal'];
  const minFormality = roleKeywords[role.toLowerCase()] || 7;

  return PROFESSIONAL_WARDROBE.filter(outfit => {
    // Filter by gender
    if (gender !== 'unisex' && outfit.gender !== 'unisex' && outfit.gender !== gender) {
      return false;
    }

    // Filter by category
    if (!relevantCategories.includes(outfit.category)) {
      return false;
    }

    // Filter by formality (allow some flexibility)
    if (outfit.formality < minFormality - 2) {
      return false;
    }

    return true;
  });
}
