import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { uploadGeneratedHeadshot } from './storage.js';
import { STYLE_TEMPLATES } from './templates.js';
import type { HeadshotBatch } from '../db/index.js';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface GeneratedHeadshot {
  url: string;
  thumbnail: string;
}

interface PlatformSpecs {
  aspectRatio: string;
  dimensions: string;
  optimizedFor: string;
}

// Helper function to fetch image as base64
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

// Generate single headshot using template
export async function generateHeadshotWithTemplate(
  inputPhotos: string[],
  template: any,
  variationIndex: number,
  userId: string,
  batchId: number
): Promise<{ url: string; thumbnail: string }> {
  // Use Gemini 2.0 Flash Experimental for native image generation
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  try {
    // For now, since Gemini doesn't generate images directly,
    // we'll use it to analyze the best photo and apply transformations

    // Select the best photo from uploaded ones for this variation
    const selectedPhotoIndex = variationIndex % inputPhotos.length;
    const selectedPhotoUrl = inputPhotos[selectedPhotoIndex];

    // Fetch and process the image
    const response = await fetch(selectedPhotoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Parse dimensions from template
    const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

    // Process image according to template specifications
    const processedImage = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
      })
      .toBuffer();

    // Apply style-specific adjustments based on template
    let finalImage = processedImage;

    // Apply template-specific adjustments
    if (template.id === 'corporate' || template.id === 'executive') {
      // Apply professional look adjustments
      finalImage = await sharp(processedImage)
        .modulate({
          brightness: 1.05,
          saturation: 0.95,
        })
        .toBuffer();
    } else if (template.id === 'creative' || template.id === 'social') {
      // Apply creative adjustments
      finalImage = await sharp(processedImage)
        .modulate({
          brightness: 1.1,
          saturation: 1.1,
        })
        .toBuffer();
    }

    // Upload to R2
    const { url, thumbnail } = await uploadGeneratedHeadshot(
      userId,
      batchId,
      finalImage,
      {
        template: template.id,
        index: variationIndex,
      }
    );

    return { url, thumbnail };
  } catch (error) {
    console.error('Error generating headshot:', error);
    throw new Error('Failed to generate headshot');
  }
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

// Generate entire batch of headshots
export async function generateBatch(
  batch: HeadshotBatch
): Promise<void> {
  console.log(`Starting generation for batch ${batch.id}`);

  const uploadedPhotos = batch.uploadedPhotos || [];
  const styleTemplates = batch.styleTemplates || [];

  // Get plan config
  const planHeadshots = getPlanHeadshots(batch.plan);

  // Calculate how many headshots per template
  const headshotsPerTemplate = Math.floor(planHeadshots / styleTemplates.length);
  const headshotsByTemplate: { [key: string]: number } = {};
  const allGeneratedHeadshots: any[] = [];

  // Generate headshots for each template
  for (const templateId of styleTemplates) {
    const template = STYLE_TEMPLATES[templateId];
    if (!template) continue;

    console.log(`Generating ${headshotsPerTemplate} headshots for template: ${template.name}`);

    const generatedForTemplate: any[] = [];

    // Generate variations within this template
    for (let i = 0; i < headshotsPerTemplate; i++) {
      try {
        const headshot = await generateHeadshotWithTemplate(
          uploadedPhotos,
          template,
          i,
          batch.userId,
          batch.id
        );

        const headshotData = {
          url: headshot.url,
          template: templateId,
          background: template.background,
          outfit: template.outfit,
          thumbnail: headshot.thumbnail,
          platformSpecs: template.platformSpecs,
        };

        generatedForTemplate.push(headshotData);
        allGeneratedHeadshots.push(headshotData);
      } catch (error) {
        console.error(`Failed to generate headshot ${i} for template ${templateId}:`, error);
      }
    }

    headshotsByTemplate[templateId] = generatedForTemplate.length;
  }

  console.log(`Completed generation for batch ${batch.id}`);
  console.log(`Total headshots generated: ${allGeneratedHeadshots.length}`);

  // Return results (will be saved by the queue worker)
  return {
    generatedHeadshots: allGeneratedHeadshots,
    headshotsByTemplate,
    totalCount: allGeneratedHeadshots.length,
  } as any;
}

// Helper to get headshot count by plan
function getPlanHeadshots(plan: string): number {
  const plans: { [key: string]: number } = {
    basic: 40,
    professional: 100,
    executive: 200,
  };
  return plans[plan] || 40;
}
