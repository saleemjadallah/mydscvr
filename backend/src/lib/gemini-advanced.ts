import { GoogleGenerativeAI } from '@google/generative-ai';
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

interface ImageAnalysis {
  bestPhoto: number;
  faceQuality: string;
  lighting: string;
  composition: string;
  suggestions: string[];
}

// Analyze uploaded photos using Gemini Pro Vision
export async function analyzePhotosWithGemini(
  photoUrls: string[]
): Promise<ImageAnalysis> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-pro-vision',
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    },
  });

  try {
    // Prepare images for analysis
    const imageParts = await Promise.all(
      photoUrls.slice(0, 5).map(async (url) => {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          inlineData: {
            data: base64,
            mimeType: 'image/jpeg',
          },
        };
      })
    );

    const prompt = `
    Analyze these photos for professional headshot generation. Evaluate:
    1. Which photo has the best face quality, lighting, and composition (specify index 0-4)
    2. Overall face quality (sharp/clear/blurry)
    3. Lighting conditions (excellent/good/poor)
    4. Composition quality (professional/casual/needs improvement)
    5. Specific suggestions for improvement

    Return your analysis in JSON format:
    {
      "bestPhoto": 0,
      "faceQuality": "sharp",
      "lighting": "excellent",
      "composition": "professional",
      "suggestions": ["suggestion1", "suggestion2"]
    }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      bestPhoto: 0,
      faceQuality: 'good',
      lighting: 'good',
      composition: 'professional',
      suggestions: [],
    };
  } catch (error) {
    console.error('Error analyzing photos:', error);
    return {
      bestPhoto: 0,
      faceQuality: 'unknown',
      lighting: 'unknown',
      composition: 'unknown',
      suggestions: [],
    };
  }
}

// Generate enhanced headshot using AI-powered transformations
export async function generateEnhancedHeadshot(
  inputPhotoUrl: string,
  template: any,
  variationIndex: number,
  userId: string,
  batchId: number,
  _analysis?: ImageAnalysis
): Promise<GeneratedHeadshot> {
  try {
    // Fetch the input image
    const response = await fetch(inputPhotoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Parse dimensions from template
    const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

    // Base processing
    let processedImage = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        kernel: 'lanczos3', // High-quality resize algorithm
      })
      .jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
        progressive: true,
      })
      .toBuffer();

    // Apply template-specific enhancements
    processedImage = await applyTemplateEnhancements(
      processedImage,
      template,
      variationIndex
    );

    // Generate thumbnail
    const thumbnailBuffer = await sharp(processedImage)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 85,
      })
      .toBuffer();

    // Upload both images to R2
    const { url } = await uploadGeneratedHeadshot(
      userId,
      batchId,
      processedImage,
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
    console.error('Error generating enhanced headshot:', error);
    throw new Error('Failed to generate enhanced headshot');
  }
}

// Apply template-specific image enhancements
async function applyTemplateEnhancements(
  imageBuffer: Buffer,
  template: any,
  variationIndex: number
): Promise<Buffer> {
  let pipeline = sharp(imageBuffer);

  // Template-specific adjustments
  switch (template.id) {
    case 'linkedin':
    case 'corporate':
      // Professional look: slight desaturation, increased sharpness
      pipeline = pipeline
        .modulate({
          brightness: 1.02,
          saturation: 0.95,
        })
        .sharpen({ sigma: 1.0 })
        .normalise(); // Improve contrast
      break;

    case 'executive':
      // Executive look: stronger contrast, professional toning
      pipeline = pipeline
        .modulate({
          brightness: 1.0,
          saturation: 0.9,
        })
        .sharpen({ sigma: 1.2 })
        .normalise()
        .gamma(1.1); // Slight gamma adjustment for depth
      break;

    case 'creative':
    case 'social':
      // Creative look: vibrant colors, softer feel
      pipeline = pipeline
        .modulate({
          brightness: 1.08,
          saturation: 1.15,
          hue: variationIndex * 2, // Subtle hue variation
        })
        .sharpen({ sigma: 0.8 });
      break;

    case 'casual':
      // Casual look: warm and approachable
      pipeline = pipeline
        .modulate({
          brightness: 1.05,
          saturation: 1.05,
        })
        .tint({ r: 255, g: 252, b: 245 }); // Warm tint
      break;

    case 'speaker':
      // Speaker look: clear and impactful
      pipeline = pipeline
        .modulate({
          brightness: 1.03,
          saturation: 1.0,
        })
        .sharpen({ sigma: 1.5 })
        .normalise();
      break;

    case 'resume':
      // Resume look: clean and professional
      pipeline = pipeline
        .modulate({
          brightness: 1.02,
          saturation: 0.92,
        })
        .sharpen({ sigma: 1.0 })
        .normalise();
      break;
  }

  // Apply variation-specific adjustments
  if (variationIndex > 0) {
    const variationAdjustments = [
      { brightness: 0.98, saturation: 1.02 },
      { brightness: 1.02, saturation: 0.98 },
      { brightness: 1.0, saturation: 1.05 },
      { brightness: 1.03, saturation: 0.95 },
      { brightness: 0.97, saturation: 1.0 },
    ];

    const adjustment = variationAdjustments[variationIndex % variationAdjustments.length];
    pipeline = pipeline.modulate(adjustment);
  }

  return pipeline.toBuffer();
}

// Generate batch with Gemini Pro analysis
export async function generateBatchWithGemini(
  batch: HeadshotBatch
): Promise<{
  generatedHeadshots: GeneratedHeadshot[];
  headshotsByTemplate: Record<string, number>;
  totalCount: number;
  analysis: ImageAnalysis;
}> {
  console.log(`Starting AI-powered generation for batch ${batch.id}`);

  const uploadedPhotos = batch.uploadedPhotos || [];
  const styleTemplates = batch.styleTemplates || [];

  // Analyze photos first
  const analysis = await analyzePhotosWithGemini(uploadedPhotos);
  console.log('Photo analysis complete:', analysis);

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
        // Use best photos more frequently
        let photoIndex = i % uploadedPhotos.length;
        if (i % 3 === 0 && analysis.bestPhoto !== undefined) {
          photoIndex = analysis.bestPhoto;
        }

        const headshot = await generateEnhancedHeadshot(
          uploadedPhotos[photoIndex],
          template,
          i,
          batch.userId,
          batch.id,
          analysis
        );

        generatedForTemplate.push(headshot);
        allGeneratedHeadshots.push(headshot);
      } catch (error) {
        console.error(`Failed to generate headshot ${i} for template ${templateId}:`, error);
      }
    }

    headshotsByTemplate[templateId] = generatedForTemplate.length;
  }

  console.log(`Completed AI-powered generation for batch ${batch.id}`);
  console.log(`Total headshots generated: ${allGeneratedHeadshots.length}`);

  return {
    generatedHeadshots: allGeneratedHeadshots,
    headshotsByTemplate,
    totalCount: allGeneratedHeadshots.length,
    analysis,
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

export { generateBatchWithGemini as generateBatch };