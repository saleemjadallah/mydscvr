/**
 * Visa Photo Specifications by Country
 *
 * Each country has specific requirements for visa/passport photos.
 * This configuration ensures AI-generated photos meet official standards.
 */

export interface VisaPhotoSpec {
  dimensions: string; // Pixel dimensions (width x height)
  physicalSize?: string; // Physical size in mm or inches
  dpi: number;
  background: string; // Background color (hex code or description)
  faceSize: string; // Percentage or measurement
  headPosition: string;
  expression: string;
  fileFormat: string;
  maxFileSize?: string;
  colorSpace?: string;
  eyeLevel?: string;
  glasses?: string;
  headCovering?: string;
  clothing?: string;
  recency?: string;
  ears?: string;
}

export const VISA_PHOTO_SPECS: Record<string, VisaPhotoSpec> = {
  // ========================================
  // UAE (Emirates ID, Visa, Residence)
  // ========================================
  uae_visa: {
    dimensions: '600x600', // pixels
    dpi: 600,
    background: '#FFFFFF', // Pure white
    faceSize: '70-80%', // of total image
    headPosition: 'centered',
    expression: 'neutral, eyes open, mouth closed',
    clothing: 'formal, no white clothing',
    glasses: 'allowed if normally worn, no tint',
    headCovering: 'religious only, face must be visible',
    fileFormat: 'JPG',
    maxFileSize: '100KB',
    colorSpace: 'sRGB',
  },

  // ========================================
  // SCHENGEN (EU countries)
  // ========================================
  schengen_visa: {
    dimensions: '826x1063', // 35mm x 45mm at 600 DPI
    physicalSize: '35mm x 45mm',
    dpi: 600,
    background: '#F0F0F0', // Light gray
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral, looking straight',
    eyeLevel: '2/3 from bottom',
    glasses: 'no glare, frames not covering eyes',
    headCovering: 'religious only',
    fileFormat: 'JPG',
    colorSpace: 'sRGB',
  },

  // ========================================
  // USA (Passport, Visa)
  // ========================================
  us_visa: {
    dimensions: '600x600', // 2x2 inches at 300 DPI
    physicalSize: '2in x 2in',
    dpi: 300,
    background: '#FFFFFF', // White or off-white
    faceSize: '50-69%', // 1 to 1-3/8 inches
    headPosition: 'centered',
    expression: 'neutral, natural smile allowed',
    glasses: 'no glare, must see eyes',
    recency: 'taken within 6 months',
    fileFormat: 'JPG',
    colorSpace: 'sRGB',
  },

  // ========================================
  // SAUDI ARABIA
  // ========================================
  saudi_visa: {
    dimensions: '600x600',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    clothing: 'formal, conservative',
    headCovering: 'women: optional, men: no caps',
    fileFormat: 'JPG',
    maxFileSize: '100KB',
  },

  // ========================================
  // QATAR
  // ========================================
  qatar_visa: {
    dimensions: '600x600',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    fileFormat: 'JPG',
  },

  // ========================================
  // OMAN
  // ========================================
  oman_visa: {
    dimensions: '600x600',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    fileFormat: 'JPG',
  },

  // ========================================
  // BAHRAIN
  // ========================================
  bahrain_visa: {
    dimensions: '600x600',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    fileFormat: 'JPG',
  },

  // ========================================
  // KUWAIT
  // ========================================
  kuwait_visa: {
    dimensions: '600x600',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    fileFormat: 'JPG',
  },

  // ========================================
  // INDIA (Passport, Visa)
  // ========================================
  india_visa: {
    dimensions: '600x600', // 2x2 inches
    dpi: 300,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered, forward-facing',
    expression: 'neutral, no smile',
    ears: 'both ears visible',
    fileFormat: 'JPG',
  },

  // ========================================
  // UK (Visitor Visa)
  // ========================================
  uk_visa: {
    dimensions: '826x1063', // 35mm x 45mm
    physicalSize: '35mm x 45mm',
    dpi: 600,
    background: '#F0F0F0', // Light gray or off-white
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral, mouth closed',
    fileFormat: 'JPG',
  },

  // ========================================
  // CANADA
  // ========================================
  canada_visa: {
    dimensions: '780x1024', // 35mm x 45mm at 600 DPI
    physicalSize: '35mm x 45mm',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral, no smile',
    fileFormat: 'JPG',
  },

  // ========================================
  // AUSTRALIA
  // ========================================
  australia_visa: {
    dimensions: '600x600', // 45mm x 35mm passport size
    physicalSize: '45mm x 35mm',
    dpi: 600,
    background: '#FFFFFF',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    fileFormat: 'JPG',
  },

  // ========================================
  // GENERIC ICAO PASSPORT PHOTO
  // ========================================
  passport_generic: {
    dimensions: '827x1063', // 35mm x 45mm
    dpi: 600,
    background: '#FFFFFF to #F0F0F0',
    faceSize: '70-80%',
    headPosition: 'centered',
    expression: 'neutral',
    fileFormat: 'JPG',
  },
};

// ========================================
// GEMINI PROMPTS FOR EACH VISA PHOTO TYPE
// ========================================

export const VISA_PHOTO_PROMPTS: Record<string, string> = {
  uae_visa: `
    Generate a professional UAE visa photo with the following exact specifications:

    CRITICAL REQUIREMENTS:
    - Pure white background (#FFFFFF)
    - Face occupies 70-80% of image
    - Perfectly centered head position
    - Neutral expression, eyes open, mouth closed
    - Direct eye contact with camera
    - Formal attire (no white clothing as it blends with background)
    - Even, soft lighting with no harsh shadows
    - Sharp focus on face, particularly eyes
    - Head straight, not tilted
    - Both ears visible (unless covered for religious reasons)

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: High-quality JPG, sRGB color space
    - File size: Under 100KB

    AVOID:
    - Smiling or any expression
    - Sunglasses, tinted glasses
    - Hats or headwear (except religious)
    - Shadows on face or background
    - Red-eye effect
    - Blurriness
    - Over-exposure or under-exposure

    Generate a photo that would be accepted by UAE immigration authorities.
  `,

  schengen_visa: `
    Generate a Schengen visa-compliant photo (EU standard):

    CRITICAL REQUIREMENTS:
    - Light gray background (#F0F0F0)
    - Face occupies 70-80% of image height
    - Eyes at 2/3 from bottom of photo
    - Neutral expression, closed mouth
    - Looking straight at camera
    - Both eyes clearly visible
    - Face evenly lit, no shadows

    TECHNICAL SPECS:
    - Output: 826x1063 pixels (35mm x 45mm at 600 DPI)
    - Format: High-quality JPG, sRGB

    AVOID:
    - Smiling
    - Glasses with glare
    - Red-eye
    - Hair covering eyes
    - Any accessories on head

    Must comply with ICAO standards for biometric photos.
  `,

  us_visa: `
    Generate a US visa photo compliant with Department of State requirements:

    CRITICAL REQUIREMENTS:
    - White or off-white background
    - Face 50-69% of image (1 to 1-3/8 inches from chin to top of head)
    - Head centered in frame
    - Neutral expression (natural smile acceptable)
    - Looking directly at camera
    - Both eyes open and visible
    - Photo taken within last 6 months
    - Full-face view, facing camera

    TECHNICAL SPECS:
    - Output: 600x600 pixels (2x2 inches at 300 DPI)
    - Format: JPG, sRGB color space

    AVOID:
    - Uniforms (except religious clothing)
    - Hats or head coverings (except religious)
    - Headphones or wireless devices
    - Glasses with glare

    Must meet US passport photo requirements.
  `,

  saudi_visa: `
    Generate a Saudi Arabia visa photo with these specifications:

    CRITICAL REQUIREMENTS:
    - Pure white background (#FFFFFF)
    - Face occupies 70-80% of image
    - Centered head position
    - Neutral expression
    - Conservative formal attire
    - For women: headcovering optional but face must be fully visible
    - For men: no caps or headwear
    - Even lighting, no shadows

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: JPG, under 100KB

    Must comply with Saudi immigration photo standards.
  `,

  qatar_visa: `
    Generate a Qatar visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered, forward-facing
    - Neutral expression
    - Formal attire

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: JPG
  `,

  oman_visa: `
    Generate an Oman visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered position
    - Neutral expression
    - Formal attire

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: JPG
  `,

  bahrain_visa: `
    Generate a Bahrain visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered position
    - Neutral expression
    - Formal attire

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: JPG
  `,

  kuwait_visa: `
    Generate a Kuwait visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered position
    - Neutral expression
    - Formal attire

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: JPG
  `,

  india_visa: `
    Generate an India visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered, forward-facing
    - Neutral expression, no smile
    - Both ears visible
    - Direct eye contact

    TECHNICAL SPECS:
    - Output: 600x600 pixels (2x2 inches), 300 DPI
    - Format: JPG
  `,

  uk_visa: `
    Generate a UK visa photo:

    CRITICAL REQUIREMENTS:
    - Light gray or off-white background (#F0F0F0)
    - Face 70-80% of image
    - Centered position
    - Neutral expression, mouth closed
    - Even lighting

    TECHNICAL SPECS:
    - Output: 826x1063 pixels (35mm x 45mm), 600 DPI
    - Format: JPG
  `,

  canada_visa: `
    Generate a Canada visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered position
    - Neutral expression, no smile
    - Even lighting, no shadows

    TECHNICAL SPECS:
    - Output: 780x1024 pixels (35mm x 45mm), 600 DPI
    - Format: JPG
  `,

  australia_visa: `
    Generate an Australia visa photo:

    CRITICAL REQUIREMENTS:
    - White background (#FFFFFF)
    - Face 70-80% of image
    - Centered position
    - Neutral expression
    - Even lighting

    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: JPG
  `,

  passport_generic: `
    Generate a generic ICAO-compliant passport photo:

    CRITICAL REQUIREMENTS:
    - White or light gray background (#FFFFFF to #F0F0F0)
    - Face 70-80% of image
    - Centered position
    - Neutral expression
    - Even lighting
    - Meets international ICAO standards

    TECHNICAL SPECS:
    - Output: 827x1063 pixels (35mm x 45mm), 600 DPI
    - Format: JPG
  `,
};

// Helper to get all available visa photo formats
export function getAllVisaPhotoFormats(): string[] {
  return Object.keys(VISA_PHOTO_SPECS);
}

// Helper to get spec by format
export function getVisaPhotoSpec(format: string): VisaPhotoSpec | undefined {
  return VISA_PHOTO_SPECS[format];
}

// Helper to get prompt by format
export function getVisaPhotoPrompt(format: string): string | undefined {
  return VISA_PHOTO_PROMPTS[format];
}

// Helper to validate format
export function isValidVisaPhotoFormat(format: string): boolean {
  return format in VISA_PHOTO_SPECS;
}
