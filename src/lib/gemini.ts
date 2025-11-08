import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadGeneratedHeadshot } from './storage.js';
import { STYLE_TEMPLATES } from './templates.js';
import type { HeadshotBatch } from '../db/index.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface PlatformSpecs {
  aspectRatio: string;
  dimensions: string;
  optimizedFor: string;
}

// Generate single headshot using template
export async function generateHeadshotWithTemplate(
  _inputPhotos: string[],
  template: any,
  variationIndex: number,
  userId: string,
  batchId: number
): Promise<{ url: string; thumbnail: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  // Use template's pre-configured Gemini prompt
  const prompt = template.geminiPrompt;

  // Add variation instructions
  const variationPrompt = `${prompt}

  Variation ${variationIndex + 1}: Slight variation in angle, expression, or composition
  while maintaining the core ${template.name} style.
  `;

  try {
    // Generate image using Gemini
    // Note: This is a placeholder - actual implementation depends on Gemini's image generation API
    await model.generateContent([
      variationPrompt,
      // ...inputPhotos.map(url => ({
      //   inlineData: { mimeType: 'image/jpeg', data: url }
      // }))
    ]);

    // For now, this is a placeholder
    // In production, you'll need to:
    // 1. Convert the generated image data from Gemini
    // 2. Process it with sharp to match platform specs
    // 3. Upload to R2

    // Placeholder: Upload to R2
    const imageBuffer = Buffer.from('placeholder'); // Replace with actual image data

    const { url, thumbnail } = await uploadGeneratedHeadshot(
      userId,
      batchId,
      imageBuffer,
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
  const sharp = (await import('sharp')).default;

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
): Promise<{
  generatedHeadshots: any[];
  headshotsByTemplate: { [key: string]: number };
  totalCount: number;
}> {
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
  };
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
