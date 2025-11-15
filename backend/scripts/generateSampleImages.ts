/**
 * Generate sample before/after images for homepage showcase
 * Uses Gemini API to create realistic headshot examples
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { STYLE_TEMPLATES } from '../src/lib/templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Sample "before" prompts - casual selfies
const beforePrompts = [
  'A casual selfie photo of a professional woman in her 30s with brown hair, natural lighting, indoor background, neutral expression, smartphone camera quality',
  'A casual selfie of a professional man in his 40s with short hair, taken in an office, slight smile, natural indoor lighting',
  'A casual selfie of a young professional woman in her 20s with blonde hair, outdoor natural lighting, relaxed expression',
  'A casual selfie of a professional man in his 30s with glasses, indoor setting, neutral background, natural pose',
  'A casual selfie of a professional woman in her 40s with dark hair, home background, warm lighting, friendly expression',
  'A casual selfie of a young professional man in his 20s, casual attire, outdoor setting, confident expression',
];

// Generate a "before" casual selfie image
async function generateBeforeImage(index: number): Promise<Buffer> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const prompt = `${beforePrompts[index % beforePrompts.length]}

IMPORTANT: Generate a realistic casual selfie photo that looks like it was taken with a smartphone. The photo should have:
- Natural, unposed expression
- Casual indoor or outdoor background
- Natural lighting (not studio lighting)
- Slight imperfections (realistic smartphone camera quality)
- Casual clothing
- Direct front-facing pose
- Resolution: 800x1000 pixels (portrait)

The image should look authentic and realistic, like a real person took a selfie.`;

  console.log(`Generating before image ${index + 1}...`);

  const result = await model.generateContent(prompt);
  const response = result.response;

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const imageBuffer = Buffer.from(part.inlineData.data, 'base64');

      // Resize to exact dimensions
      return await sharp(imageBuffer)
        .resize(800, 1000, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    }
  }

  throw new Error('No image generated');
}

// Generate an "after" professional headshot using template
async function generateAfterImage(beforeImageBuffer: Buffer, templateId: string, index: number): Promise<Buffer> {
  const template = STYLE_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const [width, height] = template.platformSpecs.dimensions.split('x').map(Number);

  const prompt = `Transform this casual selfie into a professional ${template.name} headshot.

CRITICAL REQUIREMENTS:
- Maintain the EXACT same person's facial features, identity, and appearance
- Keep the person's face, hair color, skin tone, and facial structure identical
- Only change: background, lighting, clothing, and professional styling
- The person must be 100% recognizable as the same individual

PROFESSIONAL HEADSHOT REQUIREMENTS:
- Template: ${template.name}
- Background: ${template.background}
- Outfit: ${template.outfit}
- Lighting: Professional studio lighting
- Expression: Professional, confident, approachable
- Optimized for: ${template.platformSpecs.optimizedFor}
- Dimensions: ${width}x${height} pixels
- High-resolution professional quality

STYLE SPECIFICATIONS:
${template.geminiPrompt}

Create a studio-quality professional headshot while preserving the person's complete facial identity.`;

  console.log(`  → Generating after image for ${template.name}...`);

  // Convert image buffer to base64
  const base64Image = beforeImageBuffer.toString('base64');

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    },
  ]);

  const response = result.response;

  // Extract generated image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const imageBuffer = Buffer.from(part.inlineData.data, 'base64');

      // Resize to template dimensions
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 95 })
        .toBuffer();
    }
  }

  throw new Error('No image generated');
}

// Main function
async function generateAllSamples() {
  console.log('🎨 Generating sample images for homepage...\n');

  const outputDir = path.join(__dirname, '../../frontend/public/assets/samples');

  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });

  // Generate 6 before/after pairs
  const numSamples = 6;
  const templates = ['linkedin', 'corporate', 'creative', 'executive', 'resume', 'social'];

  for (let i = 0; i < numSamples; i++) {
    try {
      console.log(`\n📸 Generating sample ${i + 1}/${numSamples}:`);

      // Generate before image
      const beforeImage = await generateBeforeImage(i);
      const beforePath = path.join(outputDir, `before-${i + 1}.jpg`);
      await fs.writeFile(beforePath, beforeImage);
      console.log(`  ✓ Saved: before-${i + 1}.jpg`);

      // Generate after image with template
      const templateId = templates[i % templates.length];
      const afterImage = await generateAfterImage(beforeImage, templateId, i);
      const afterPath = path.join(outputDir, `after-${templateId}-${i + 1}.jpg`);
      await fs.writeFile(afterPath, afterImage);
      console.log(`  ✓ Saved: after-${templateId}-${i + 1}.jpg`);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error generating sample ${i + 1}:`, error);
    }
  }

  console.log('\n✨ Sample image generation complete!');
  console.log(`Images saved to: ${outputDir}`);
}

// Run the script
generateAllSamples().catch(console.error);
