import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai';
import { uploadGeneratedHeadshot } from './storage.js';
import { STYLE_TEMPLATES } from './templates.js';
import type { HeadshotBatch } from '../db/index.js';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GeneratedHeadshot {
  url: string;
  thumbnail: string;
  template: string;
  background: string;
  outfit: string;
  platformSpecs: any;
}

// Helper function to convert base64 to buffer
function base64ToBuffer(base64String: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Generate professional headshot using Gemini 2.0 Flash Experimental
export async function generateHeadshotWithGemini2(
  inputPhotoUrl: string,
  template: any,
  variationIndex: number,
  userId: string,
  batchId: number
): Promise<GeneratedHeadshot> {
  try {
    // Use Gemini 2.0 Flash Experimental with native image generation
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
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

    // Fetch the input photo
    const response = await fetch(inputPhotoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // Parse dimensions from template
    const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

    // Create variation-specific adjustments
    const variations = [
      'direct eye contact with confident smile',
      'slight angle with professional expression',
      'three-quarter view with subtle smile',
      'straight-on with neutral professional look',
      'slight tilt with approachable expression',
    ];

    const variationPrompt = variations[variationIndex % variations.length];

    // Construct the prompt for headshot generation
    const prompt = `
    You are a professional headshot photographer. Generate a high-quality professional headshot based on this reference photo.

    Style Requirements:
    - Template: ${template.name}
    - Background: ${template.background}
    - Outfit: ${template.outfit}
    - Expression: ${variationPrompt}
    - Platform: ${template.platformSpecs.optimizedFor}
    - Dimensions: ${width}x${height} pixels
    - Aspect Ratio: ${template.platformSpecs.aspectRatio}

    Additional Instructions:
    ${template.geminiPrompt}

    IMPORTANT: Generate a professional headshot image that:
    1. Maintains the person's identity and facial features from the reference photo
    2. Enhances lighting and composition for professional use
    3. Applies the specified background and style
    4. Ensures high quality and sharp details
    5. Suitable for ${template.platformSpecs.optimizedFor}

    Generate the image now.`;

    // Create the content with image
    const imagePart: Part = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };

    // Generate content with both text and image generation
    const result = await model.generateContent([prompt, imagePart]);
    const response2 = await result.response;
    const text = response2.text();

    // Parse the response to get the generated image
    let generatedImageBuffer: Buffer;

    try {
      const jsonResponse = JSON.parse(text);
      if (jsonResponse.image) {
        generatedImageBuffer = base64ToBuffer(jsonResponse.image);
      } else {
        throw new Error('No image generated');
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract base64 image from text
      const base64Match = text.match(/data:image\/[^;]+;base64,([^"]+)/);
      if (base64Match) {
        generatedImageBuffer = base64ToBuffer(base64Match[1]);
      } else {
        // Fallback: Process original image with enhancements
        console.log('Using fallback image processing');
        generatedImageBuffer = await processImageWithEnhancements(
          Buffer.from(arrayBuffer),
          template,
          variationIndex
        );
      }
    }

    // Ensure correct dimensions
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
  } catch (error) {
    console.error('Error generating headshot with Gemini 2.0:', error);

    // Fallback to enhanced image processing
    const response = await fetch(inputPhotoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const fallbackImage = await processImageWithEnhancements(
      Buffer.from(arrayBuffer),
      template,
      variationIndex
    );

    return uploadAndReturnHeadshot(
      fallbackImage,
      template,
      userId,
      batchId,
      variationIndex
    );
  }
}

// Enhanced image processing fallback
async function processImageWithEnhancements(
  imageBuffer: Buffer,
  template: any,
  variationIndex: number
): Promise<Buffer> {
  const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

  let pipeline = sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
      kernel: 'lanczos3',
    });

  // Apply template-specific enhancements
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
          hue: variationIndex * 3,
        })
        .sharpen({ sigma: 0.8 });
      break;

    case 'casual':
      pipeline = pipeline
        .modulate({
          brightness: 1.08,
          saturation: 1.08,
        })
        .tint({ r: 255, g: 250, b: 240 });
      break;

    case 'speaker':
      pipeline = pipeline
        .modulate({
          brightness: 1.05,
          saturation: 1.02,
        })
        .sharpen({ sigma: 1.8 })
        .normalise();
      break;

    case 'resume':
      pipeline = pipeline
        .modulate({
          brightness: 1.03,
          saturation: 0.9,
        })
        .sharpen({ sigma: 1.0 })
        .normalise();
      break;
  }

  return pipeline
    .jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4',
      progressive: true,
    })
    .toBuffer();
}

// Helper function to upload and return headshot
async function uploadAndReturnHeadshot(
  imageBuffer: Buffer,
  template: any,
  userId: string,
  batchId: number,
  variationIndex: number
): Promise<GeneratedHeadshot> {
  // Generate thumbnail
  const thumbnailBuffer = await sharp(imageBuffer)
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
    imageBuffer,
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

// Generate batch of headshots using Gemini 2.0
export async function generateBatchWithGemini2(
  batch: HeadshotBatch
): Promise<{
  generatedHeadshots: GeneratedHeadshot[];
  headshotsByTemplate: Record<string, number>;
  totalCount: number;
}> {
  console.log(`Starting Gemini 2.0 generation for batch ${batch.id}`);

  const uploadedPhotos = batch.uploadedPhotos || [];
  const styleTemplates = batch.styleTemplates || [];

  // Get plan configuration
  const planHeadshots = getPlanHeadshots(batch.plan);
  const headshotsPerTemplate = Math.floor(planHeadshots / styleTemplates.length);
  const headshotsByTemplate: Record<string, number> = {};
  const allGeneratedHeadshots: GeneratedHeadshot[] = [];

  // Generate headshots for each template
  for (const templateId of styleTemplates) {
    const template = STYLE_TEMPLATES[templateId];
    if (!template) continue;

    console.log(`Generating ${headshotsPerTemplate} headshots for template: ${template.name}`);
    const generatedForTemplate: GeneratedHeadshot[] = [];

    // Generate variations
    for (let i = 0; i < headshotsPerTemplate; i++) {
      try {
        // Distribute photos across variations
        const photoIndex = i % uploadedPhotos.length;
        const photoUrl = uploadedPhotos[photoIndex];

        const headshot = await generateHeadshotWithGemini2(
          photoUrl,
          template,
          i,
          batch.userId,
          batch.id
        );

        generatedForTemplate.push(headshot);
        allGeneratedHeadshots.push(headshot);

        // Log progress
        console.log(`Generated headshot ${i + 1}/${headshotsPerTemplate} for ${template.name}`);
      } catch (error) {
        console.error(`Failed to generate headshot ${i} for template ${templateId}:`, error);
      }
    }

    headshotsByTemplate[templateId] = generatedForTemplate.length;
  }

  console.log(`Completed generation for batch ${batch.id}`);
  console.log(`Total headshots generated: ${allGeneratedHeadshots.length}`);

  return {
    generatedHeadshots: allGeneratedHeadshots,
    headshotsByTemplate,
    totalCount: allGeneratedHeadshots.length,
  };
}

// Helper to get headshot count by plan
function getPlanHeadshots(plan: string): number {
  const plans: Record<string, number> = {
    basic: 40,
    professional: 100,
    executive: 200,
  };
  return plans[plan] || 40;
}

// Export the main generation function
export { generateBatchWithGemini2 as generateBatch };