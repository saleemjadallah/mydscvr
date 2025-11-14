import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { uploadGeneratedHeadshot, uploadBuffer } from './storage.js';
import { STYLE_TEMPLATES } from './templates.js';
import type { HeadshotBatch } from '../db/index.js';
import sharp from 'sharp';
import { processHeadshotWithFaceSwap, checkFaceSwapService } from './faceSwap.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Base facial preservation prompt to prepend to all templates
const FACIAL_PRESERVATION_PROMPT = `
CRITICAL FACIAL ACCURACY REQUIREMENTS:
- Preserve the EXACT facial features, bone structure, and proportions from the reference photos
- Maintain precise facial symmetry, eye shape, nose structure, and mouth characteristics
- Keep skin texture, complexion, and facial details identical to the source
- Do NOT alter facial features, face shape, or distinctive characteristics
- Focus changes ONLY on lighting, background, clothing, and pose
- Ensure the generated face is indistinguishable from the person in the reference photos
- Prioritize photorealistic facial matching over artistic interpretation
- Maintain natural skin tones and facial texture from reference images

IDENTITY CONSISTENCY:
- The person's identity must be 100% recognizable across all variations
- Facial geometry (eye distance, nose width, jaw line) must match reference exactly
- Any facial marks, characteristics, or unique features must be preserved
- Expression changes should be subtle and maintain facial structure
`;

interface GeneratedHeadshot {
  url: string;
  thumbnail: string;
  template: string;
  background: string;
  outfit: string;
  platformSpecs: any;
}

interface PlatformSpecs {
  aspectRatio: string;
  dimensions: string;
  optimizedFor: string;
}

// Helper function to fetch image as base64 with quality enhancement
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Enhance image quality before sending to Gemini
    const enhancedBuffer = await sharp(buffer)
      // Normalize lighting for consistency
      .normalize()
      // Enhance sharpness
      .sharpen({ sigma: 1.0 })
      // Ensure high quality
      .jpeg({ quality: 98 })
      .toBuffer();

    return enhancedBuffer.toString('base64');
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// Generate single headshot using Gemini 2.5 Flash Image
export async function generateHeadshotWithTemplate(
  inputPhotos: string[],
  template: any,
  variationIndex: number,
  userId: string,
  batchId: number
): Promise<GeneratedHeadshot> {
  // Use Gemini 2.5 Flash Image for native image generation
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      temperature: 0.3, // Lower temperature for more accurate, less creative outputs
      topK: 20, // More focused on likely tokens for facial accuracy
      topP: 0.85, // Slightly lower for more deterministic outputs
      maxOutputTokens: 8192,
      candidateCount: 1, // Generate single best result
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
    // Select best reference photos (use multiple for better accuracy)
    const numReferencePhotos = Math.min(5, inputPhotos.length);
    const referencePhotos = [];

    // Use a spread of photos, not just sequential
    for (let i = 0; i < numReferencePhotos; i++) {
      const photoIndex = Math.floor((i * inputPhotos.length) / numReferencePhotos);
      referencePhotos.push(inputPhotos[photoIndex]);
    }

    // Fetch reference photos as base64
    const base64Images = await Promise.all(
      referencePhotos.map(url => imageUrlToBase64(url))
    );

    // Parse dimensions from template
    const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

    // Create variation-specific expressions
    const variations = [
      'direct eye contact with confident smile',
      'slight angle with professional expression',
      'three-quarter view with subtle smile',
      'straight-on with neutral professional look',
      'slight head tilt with approachable expression',
    ];
    const expressionVariation = variations[variationIndex % variations.length];

    // Construct enhanced prompt with facial preservation emphasis
    const prompt = `${FACIAL_PRESERVATION_PROMPT}

CRITICAL INSTRUCTION: Take your time to carefully analyze the reference photos before generating. Accuracy is more important than speed.

REFERENCE PHOTO ANALYSIS (STUDY CAREFULLY):
You are provided with ${referencePhotos.length} reference photos of the SAME person from different angles.
BEFORE generating, analyze and memorize these specific details:
- Exact facial structure: face shape, jawline, cheekbones, forehead
- Eye characteristics: shape, size, distance between eyes, eye color, eyebrow shape
- Nose structure: width, length, bridge shape, nostril shape
- Mouth and lips: shape, size, natural smile characteristics
- Skin texture: tone, any marks, natural skin characteristics
- Facial proportions: golden ratio measurements, symmetry
- Unique identifying features: anything distinctive about this person's face

STUDY THE REFERENCE PHOTOS THOROUGHLY. The generated face must be IDENTICAL to the reference photos.

GENERATION TASK:
Create a professional ${template.name} headshot that:
1. PRESERVES the exact facial features from the reference photos (MOST IMPORTANT)
2. Applies only the specified changes to: background, lighting, clothing, pose
3. Maintains 100% facial identity recognition
4. Keeps the person's natural appearance and characteristics

CRITICAL REQUIREMENTS:
- Maintain the person's facial features, identity, skin tone, and appearance from the reference photos
- Create a completely new professional photograph, not just an edit
- Output dimensions: ${width}x${height} pixels (${template.platformSpecs.aspectRatio} aspect ratio)
- Optimized for: ${template.platformSpecs.optimizedFor}

STYLE SPECIFICATIONS:
- Template: ${template.name}
- Background: ${template.background}
- Outfit/Attire: ${template.outfit}
- Expression: ${expressionVariation}
- Lighting: Professional studio lighting with soft shadows
- Image quality: High resolution, sharp focus, professional color grading

HEADSHOT STYLE REQUIREMENTS:
${template.geminiPrompt}

VARIATION ${variationIndex + 1}:
Generate a subtle variation in ${template.name} style by adjusting:
- Slight angle variation (within 15 degrees)
- Minor expression change (maintaining facial structure)
- Lighting direction and intensity
- Background element positioning

DO NOT MODIFY:
- Facial features, bone structure, or proportions
- Skin texture or complexion (beyond professional color correction)
- Eye color, shape, or position
- Nose structure or mouth characteristics
- Any distinguishing facial features

OUTPUT REQUIREMENTS:
- Generate a photorealistic professional headshot
- Ensure excellent composition following photography best practices
- Sharp focus on eyes and face
- Natural skin tones with professional retouching
- Appropriate depth of field for headshots
- No watermarks, text, or artifacts
- High-resolution professional headshot (minimum ${width}x${height})

Generate the professional headshot image now.`;

    console.log(`Generating headshot for ${template.name} (variation ${variationIndex}) with ${referencePhotos.length} reference photos...`);

    // Create content parts with multiple reference images
    const imageParts = base64Images.map(data => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: data,
      },
    }));

    // Call Gemini 2.5 Flash Image to generate the headshot with multiple references
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;

    // Extract generated image from response parts
    let generatedImageBuffer: Buffer | null = null;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        // Image data is in base64
        const imageData = part.inlineData.data;
        generatedImageBuffer = Buffer.from(imageData, 'base64');
        console.log(`✓ AI generated image for ${template.name}`);
        break;
      }
    }

    if (!generatedImageBuffer) {
      throw new Error('No image generated in response');
    }

    // Ensure correct dimensions and optimize Gemini's output
    let finalImage = await sharp(generatedImageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
      })
      .toBuffer();

    // ============================================================================
    // FACE-SWAPPING STEP: Replace AI-generated face with user's real face
    // ============================================================================
    try {
      // Check if face-swap service is available
      const faceSwapAvailable = await checkFaceSwapService();

      if (faceSwapAvailable) {
        console.log('[FaceSwap] Service available, performing face swap...');

        // Upload Gemini's generated image temporarily to R2 for face-swap service to access
        const tempKey = `temp/${userId}/${batchId}/gemini-${Date.now()}.jpg`;
        const tempUrl = await uploadBuffer(finalImage, tempKey, 'image/jpeg');

        // Perform face swap using primary reference photo
        const swappedImage = await processHeadshotWithFaceSwap(
          tempUrl,
          referencePhotos[0], // Use first (best) reference photo
          referencePhotos.slice(1) // Fallbacks
        );

        if (swappedImage) {
          console.log('[FaceSwap] ✓ Face swap successful! Using swapped image.');
          finalImage = swappedImage;

          // Clean up temp file (optional - could also let R2 lifecycle rules handle it)
          // We'll keep it for now in case we need to debug
        } else {
          console.warn('[FaceSwap] Face swap failed, using original Gemini image');
        }
      } else {
        console.warn('[FaceSwap] Service not available, using original Gemini image');
      }
    } catch (faceSwapError) {
      console.error('[FaceSwap] Error during face swap, falling back to original:', faceSwapError);
      // Continue with Gemini's original image
    }

    // Generate thumbnail
    const thumbnailBuffer = await sharp(finalImage)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 85,
      })
      .toBuffer();

    // Upload full-size image to R2
    const { url } = await uploadGeneratedHeadshot(
      userId,
      batchId,
      finalImage,
      {
        template: template.id,
        index: variationIndex,
      }
    );

    // Upload thumbnail to R2
    const { url: thumbnailUrl } = await uploadGeneratedHeadshot(
      userId,
      batchId,
      thumbnailBuffer,
      {
        template: template.id,
        index: variationIndex,
      }
    );

    return {
      url,
      thumbnail: thumbnailUrl,
      template: template.id,
      background: template.background,
      outfit: template.outfit,
      platformSpecs: template.platformSpecs,
    };
  } catch (error) {
    console.error('Error generating headshot with Gemini 2.5:', error);

    // Fallback: Enhanced image processing if AI generation fails
    console.log('Falling back to enhanced image processing...');
    return await generateFallbackHeadshot(
      inputPhotos[variationIndex % inputPhotos.length],
      template,
      variationIndex,
      userId,
      batchId
    );
  }
}

// Fallback: Enhanced image processing when AI generation fails
async function generateFallbackHeadshot(
  photoUrl: string,
  template: any,
  variationIndex: number,
  userId: string,
  batchId: number
): Promise<GeneratedHeadshot> {
  console.log('Using fallback image processing for', template.name);

  // Fetch the original photo
  const response = await fetch(photoUrl);
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  // Parse dimensions
  const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

  // Apply template-specific enhancements
  let pipeline = sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
      kernel: 'lanczos3',
    });

  // Style-specific adjustments
  switch (template.id) {
    case 'linkedin':
    case 'corporate':
      pipeline = pipeline
        .modulate({
          brightness: 1.05,
          saturation: 0.92,
        })
        .sharpen({ sigma: 1.2 })
        .normalise();
      break;

    case 'executive':
      pipeline = pipeline
        .modulate({
          brightness: 1.02,
          saturation: 0.88,
        })
        .sharpen({ sigma: 1.5 })
        .normalise()
        .gamma(1.1);
      break;

    case 'creative':
    case 'social':
      pipeline = pipeline
        .modulate({
          brightness: 1.1,
          saturation: 1.2,
        })
        .sharpen({ sigma: 0.8 });
      break;

    case 'casual':
      pipeline = pipeline
        .modulate({
          brightness: 1.08,
          saturation: 1.08,
        });
      break;

    default:
      pipeline = pipeline.sharpen({ sigma: 1.0 });
  }

  const finalImage = await pipeline
    .jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4',
    })
    .toBuffer();

  // Generate thumbnail
  const thumbnailBuffer = await sharp(finalImage)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({
      quality: 85,
    })
    .toBuffer();

  // Upload to R2
  const { url } = await uploadGeneratedHeadshot(
    userId,
    batchId,
    finalImage,
    {
      template: template.id,
      index: variationIndex,
    }
  );

  const { url: thumbnailUrl } = await uploadGeneratedHeadshot(
    userId,
    batchId,
    thumbnailBuffer,
    {
      template: template.id,
      index: variationIndex,
    }
  );

  return {
    url,
    thumbnail: thumbnailUrl,
    template: template.id,
    background: template.background,
    outfit: template.outfit,
    platformSpecs: template.platformSpecs,
  };
}

// Process image to meet platform specifications
export async function processImageForPlatform(
  imageData: Buffer,
  specs: PlatformSpecs
): Promise<Buffer> {

  // Parse dimensions
  const [width, height] = specs.dimensions.split('x').map(Number);

  // Resize and optimize
  const processed = await sharp(imageData)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4', // High quality
    })
    .toBuffer();

  return processed;
}

// Generate entire batch of headshots using Gemini 2.5 Flash Image
export async function generateBatch(
  batch: HeadshotBatch
): Promise<{
  generatedHeadshots: GeneratedHeadshot[];
  headshotsByTemplate: Record<string, number>;
  totalCount: number;
}> {
  console.log(`🚀 Starting AI generation for batch ${batch.id}`);
  console.log(`Plan: ${batch.plan}`);
  console.log(`Templates: ${batch.styleTemplates?.join(', ')}`);

  const uploadedPhotos = batch.uploadedPhotos || [];
  const styleTemplates = batch.styleTemplates || [];

  if (uploadedPhotos.length === 0) {
    throw new Error('No uploaded photos found for batch');
  }

  if (styleTemplates.length === 0) {
    throw new Error('No style templates selected for batch');
  }

  // Get plan config
  const planHeadshots = getPlanHeadshots(batch.plan);
  console.log(`Generating ${planHeadshots} total headshots`);

  // Calculate how many headshots per template
  const headshotsPerTemplate = Math.floor(planHeadshots / styleTemplates.length);
  const headshotsByTemplate: Record<string, number> = {};
  const allGeneratedHeadshots: GeneratedHeadshot[] = [];

  // Generate headshots for each template
  for (const templateId of styleTemplates) {
    const template = STYLE_TEMPLATES[templateId];
    if (!template) {
      console.warn(`Template ${templateId} not found, skipping`);
      continue;
    }

    console.log(`\n📸 Generating ${headshotsPerTemplate} headshots for template: ${template.name}`);

    const generatedForTemplate: GeneratedHeadshot[] = [];

    // Generate variations within this template
    for (let i = 0; i < headshotsPerTemplate; i++) {
      try {
        console.log(`  → Variation ${i + 1}/${headshotsPerTemplate}...`);

        const headshot = await generateHeadshotWithTemplate(
          uploadedPhotos,
          template,
          i,
          batch.userId,
          batch.id
        );

        generatedForTemplate.push(headshot);
        allGeneratedHeadshots.push(headshot);

        console.log(`  ✓ Generated ${i + 1}/${headshotsPerTemplate}`);
      } catch (error) {
        console.error(`  ✗ Failed to generate headshot ${i} for template ${templateId}:`, error);
        // Continue with next variation even if one fails
      }
    }

    headshotsByTemplate[templateId] = generatedForTemplate.length;
    console.log(`✓ Completed ${template.name}: ${generatedForTemplate.length} headshots`);
  }

  console.log(`\n🎉 Completed generation for batch ${batch.id}`);
  console.log(`Total headshots generated: ${allGeneratedHeadshots.length}/${planHeadshots}`);

  return {
    generatedHeadshots: allGeneratedHeadshots,
    headshotsByTemplate,
    totalCount: allGeneratedHeadshots.length,
  };
}

// Helper to get headshot count by plan
function getPlanHeadshots(plan: string): number {
  const plans: Record<string, number> = {
    basic: 10,
    professional: 15,
    executive: 20,
  };
  return plans[plan] || 10;
}
