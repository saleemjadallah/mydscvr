/**
 * Virtual Wardrobe Service
 * Handles post-generation outfit changes using Gemini AI virtual try-on
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { PROFESSIONAL_WARDROBE, ProfessionalOutfit, isOutfitCompatibleWithTemplate } from '../data/professionalWardrobe.js';
import { STYLE_TEMPLATES } from './templates.js';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Helper function to fetch image as base64
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

/**
 * Generate a professional headshot with virtual outfit try-on
 * This is the CORE function for post-generation wardrobe changes
 */
export async function generateHeadshotWithVirtualOutfit(
  headshotUrl: string, // Existing generated headshot URL
  outfitId: string, // Selected outfit from PROFESSIONAL_WARDROBE
  options?: {
    templateId?: string; // Optional: to ensure compatibility
    colorVariant?: string; // If user wants specific color from outfit.colors
  }
): Promise<Buffer> {

  const outfit = PROFESSIONAL_WARDROBE.find(o => o.id === outfitId);

  if (!outfit) {
    throw new Error(`Outfit ${outfitId} not found`);
  }

  // Check compatibility if template ID is provided
  if (options?.templateId && !isOutfitCompatibleWithTemplate(outfitId, options.templateId)) {
    console.warn(`Outfit ${outfit.name} may not be optimal for template ${options.templateId}`);
    // Continue anyway - it's a warning, not a hard block
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  try {
    // Fetch the existing headshot as base64
    const base64Image = await imageUrlToBase64(headshotUrl);

    // Build comprehensive prompt combining outfit details
    const prompt = buildVirtualWardrobePrompt(outfit, options);

    console.log(`🎭 Applying virtual outfit: ${outfit.name} to headshot`);

    // Create the content parts with the reference image
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };

    // Call Gemini 2.5 Flash Image to generate the new headshot with outfit
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;

    // Extract generated image from response parts
    let generatedImageBuffer: Buffer | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        generatedImageBuffer = Buffer.from(imageData, 'base64');
        console.log(`✓ Virtual outfit applied: ${outfit.name}`);
        break;
      }
    }

    if (!generatedImageBuffer) {
      throw new Error('No image generated in response');
    }

    // Get original image metadata to maintain dimensions
    const metadata = await sharp(Buffer.from(base64Image, 'base64')).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Ensure correct dimensions and optimize
    const finalImage = await sharp(generatedImageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
      })
      .toBuffer();

    return finalImage;

  } catch (error) {
    console.error('Virtual wardrobe generation error:', error);
    throw new Error(`Failed to generate headshot with ${outfit.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build the Gemini prompt for virtual outfit try-on
 */
function buildVirtualWardrobePrompt(
  outfit: ProfessionalOutfit,
  options?: {
    colorVariant?: string;
  }
): string {

  const selectedColor = options?.colorVariant || outfit.colors[0];

  return `Transform this professional headshot by changing ONLY the clothing/outfit to the following specification.

CRITICAL REQUIREMENTS:
- MAINTAIN the person's facial features, identity, skin tone, and appearance EXACTLY as shown
- MAINTAIN the background, lighting, and composition EXACTLY as shown
- MAINTAIN the pose, expression, and framing EXACTLY as shown
- CHANGE ONLY the clothing/outfit to match the specification below
- Keep everything else identical - this is a wardrobe change only

## NEW OUTFIT SPECIFICATION:
${outfit.geminiPrompt}

## COLOR PREFERENCE:
- Primary color scheme: ${selectedColor}
- Available colors: ${outfit.colors.join(', ')}

## OUTFIT DETAILS:
- Category: ${outfit.category}
- Formality level: ${outfit.formality}/10
- Style: ${outfit.styleModifiers.join(', ')}
- Description: ${outfit.attire}

## QUALITY REQUIREMENTS:
1. The outfit should fit naturally and realistically
2. Proper draping, shadows, and fabric texture
3. Consistent lighting with the original photo
4. Professional appearance suitable for: ${outfit.occasions.join(', ')}
5. No alterations to face, hair, background, or lighting
6. Seamless integration - should look like the person naturally wore this outfit

## CRITICAL INSTRUCTIONS:
- DO NOT alter the person's facial features, identity, expression, or appearance
- DO NOT change the background, lighting setup, or photo composition
- DO change the clothing to exactly match the outfit specification above
- Ensure the new outfit looks natural, properly fitted, and professionally photographed
- Maintain the same professional photography quality and style

Generate the transformed headshot with the new outfit now.`;
}

/**
 * Generate quick preview for user to see outfit before committing
 * Returns smaller, faster preview
 */
export async function generateOutfitPreview(
  headshotUrl: string,
  outfitId: string,
  options?: {
    templateId?: string;
    colorVariant?: string;
  }
): Promise<Buffer> {

  // Use same function but resize smaller for faster preview
  const fullImage = await generateHeadshotWithVirtualOutfit(headshotUrl, outfitId, options);

  // Create smaller preview (400x400)
  const preview = await sharp(fullImage)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 80,
    })
    .toBuffer();

  return preview;
}

/**
 * Generate outfit color variant
 * E.g., navy suit → charcoal suit
 */
export async function generateOutfitColorVariant(
  headshotUrl: string,
  outfitId: string,
  colorVariant: string,
  templateId?: string
): Promise<Buffer> {

  const outfit = PROFESSIONAL_WARDROBE.find(o => o.id === outfitId);
  if (!outfit) throw new Error('Outfit not found');

  if (!outfit.colors.includes(colorVariant)) {
    throw new Error(`Color ${colorVariant} not available for ${outfit.name}`);
  }

  return await generateHeadshotWithVirtualOutfit(
    headshotUrl,
    outfitId,
    { templateId, colorVariant }
  );
}

/**
 * Validate outfit change request
 * Returns { valid: boolean, error?: string }
 */
export function validateOutfitChangeRequest(
  outfitId: string,
  templateId?: string
): { valid: boolean; error?: string } {

  const outfit = PROFESSIONAL_WARDROBE.find(o => o.id === outfitId);

  if (!outfit) {
    return {
      valid: false,
      error: `Outfit ${outfitId} not found`,
    };
  }

  if (templateId && !isOutfitCompatibleWithTemplate(outfitId, templateId)) {
    return {
      valid: false,
      error: `Outfit ${outfit.name} is not compatible with template ${templateId}`,
    };
  }

  return { valid: true };
}

/**
 * Get outfit by ID with full details
 */
export function getOutfitById(outfitId: string): ProfessionalOutfit | undefined {
  return PROFESSIONAL_WARDROBE.find(o => o.id === outfitId);
}

/**
 * Get all available outfits with optional filters
 */
export function getAvailableOutfits(filters?: {
  category?: string;
  gender?: string;
  minFormality?: number;
  premiumOnly?: boolean;
}): ProfessionalOutfit[] {

  let outfits = [...PROFESSIONAL_WARDROBE];

  if (filters?.category) {
    outfits = outfits.filter(o => o.category === filters.category);
  }

  if (filters?.gender && filters.gender !== 'all') {
    outfits = outfits.filter(o => o.gender === filters.gender || o.gender === 'unisex');
  }

  if (filters?.minFormality) {
    outfits = outfits.filter(o => o.formality >= filters.minFormality);
  }

  if (filters?.premiumOnly) {
    outfits = outfits.filter(o => o.premium);
  }

  return outfits;
}
