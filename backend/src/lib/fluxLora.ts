/**
 * Flux LoRA Fine-Tuning Integration
 * Uses fal.ai Turbo Flux Trainer for 100% facial accuracy in headshots
 */

import * as fal from '@fal-ai/serverless-client';
import archiver from 'archiver';
import axios from 'axios';
import sharp from 'sharp';
import { File } from 'buffer';

const FAL_API_KEY = process.env.FAL_API_KEY;

// Initialize fal.ai client
if (FAL_API_KEY) {
  fal.config({
    credentials: FAL_API_KEY,
  });
}

interface TrainingResult {
  diffusers_lora_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  config_file: {
    url: string;
  };
}

interface GenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: Record<string, number>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

/**
 * Create a ZIP file from image URLs and upload to fal.ai storage
 * @param imageUrls - Array of publicly accessible image URLs
 * @returns URL to the uploaded ZIP file
 */
async function createAndUploadZip(imageUrls: string[]): Promise<string> {
  console.log(`[FluxLoRA] Creating ZIP from ${imageUrls.length} images...`);

  // Create ZIP archive in memory
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on('data', (chunk) => chunks.push(chunk));

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
  });

  // Download each image, compress, and add to ZIP
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    try {
      console.log(`[FluxLoRA]   Processing image ${i + 1}/${imageUrls.length}...`);
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const originalBuffer = Buffer.from(response.data);

      // Compress image to reduce ZIP size (max 1024px, 85% quality)
      // Training still works great with 1024px images
      const compressedBuffer = await sharp(originalBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const savedKB = ((originalBuffer.length - compressedBuffer.length) / 1024).toFixed(1);
      console.log(`[FluxLoRA]     Compressed: ${(originalBuffer.length / 1024).toFixed(1)}KB → ${(compressedBuffer.length / 1024).toFixed(1)}KB (saved ${savedKB}KB)`);

      // Add to ZIP with simple numeric filename
      archive.append(compressedBuffer, { name: `${i}.jpg` });
    } catch (error: any) {
      console.error(`[FluxLoRA] Failed to process image ${i}: ${error.message}`);
      throw new Error(`Failed to process training image ${i}: ${error.message}`);
    }
  }

  // Finalize the archive
  await archive.finalize();
  const zipBuffer = await zipPromise;

  console.log(`[FluxLoRA] ZIP created (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Upload ZIP to fal.ai storage using SDK
  console.log(`[FluxLoRA] Uploading ZIP to fal.ai storage...`);

  try {
    // Create a File-like object from the buffer
    const zipFile = new File([zipBuffer], 'training-images.zip', {
      type: 'application/zip',
    });

    // Use fal.ai SDK's built-in storage upload
    const zipUrl = await fal.storage.upload(zipFile);

    console.log(`[FluxLoRA] ✓ ZIP uploaded: ${zipUrl}`);
    return zipUrl;
  } catch (error: any) {
    console.error('[FluxLoRA] Failed to upload ZIP:', error.message);
    throw new Error('Failed to upload training images ZIP to fal.ai');
  }
}

/**
 * Train a Flux LoRA model on user's uploaded photos
 * Takes ~30 seconds with Turbo trainer
 *
 * @param imageUrls - Array of 12-20 user photo URLs from R2
 * @param triggerWord - Unique trigger word (e.g., "ohwx person")
 * @returns Training result with LoRA file URL
 */
export async function trainFluxLora(
  imageUrls: string[],
  triggerWord: string = 'ohwx person'
): Promise<TrainingResult> {
  if (!FAL_API_KEY) {
    throw new Error('FAL_API_KEY not configured');
  }

  console.log(`[FluxLoRA] Training model on ${imageUrls.length} images...`);
  console.log(`[FluxLoRA] Trigger word: "${triggerWord}"`);

  const startTime = Date.now();

  // Step 1: Create ZIP file and upload to fal.ai storage
  const zipUrl = await createAndUploadZip(imageUrls);

  // Step 2: Start training with ZIP URL
  const trainingInput = {
    images_data_url: zipUrl, // URL to ZIP file
    trigger_word: triggerWord,
    // Fast preset optimized for portraits/headshots
    steps_per_image: 27, // Fast preset for people (default: 100 for high quality)
    lora_rank: 16,       // Good balance of quality and file size
    optimizer: 'adamw8bit',
  };

  console.log(`[FluxLoRA] Starting training with ZIP URL...`);

  try {
    const result = await fal.subscribe('fal-ai/flux-lora-fast-training', {
      input: trainingInput,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`[FluxLoRA] Training progress: ${JSON.stringify(update.logs)}`);
        }
      },
    }) as TrainingResult;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[FluxLoRA] ✓ Training completed in ${elapsed}s`);
    console.log(`[FluxLoRA] LoRA file: ${result.diffusers_lora_file.url}`);

    return result;
  } catch (error: any) {
    console.error('[FluxLoRA] Training failed:', error.message);
    console.error('[FluxLoRA] Error details:', JSON.stringify(error.body || error, null, 2));
    throw error;
  }
}

/**
 * Map our template aspect ratios to Flux's image_size presets
 */
function mapAspectRatioToFluxSize(aspectRatio: string): string {
  const mapping: Record<string, string> = {
    '1:1': 'square_hd',      // LinkedIn, Social
    '4:5': 'portrait_4_3',   // Corporate, Casual (closest match)
    '3:4': 'portrait_4_3',   // Creative (closest match)
    '2:3': 'portrait_4_3',   // Resume, Executive (closest match)
    '16:9': 'landscape_16_9', // Speaker
    '35:45': 'portrait_4_3',  // Visa (closest biometric-friendly match)
  };

  const fluxSize = mapping[aspectRatio] || 'square_hd';
  console.log(`[FluxLoRA] Mapped aspect ratio ${aspectRatio} → ${fluxSize}`);
  return fluxSize;
}

/**
 * Generate headshot using trained Flux LoRA model
 *
 * @param loraUrl - URL of trained LoRA file from training step
 * @param prompt - Generation prompt (e.g., "ohwx person, professional LinkedIn headshot")
 * @param aspectRatio - Image aspect ratio (e.g., "1:1", "4:5")
 * @returns Generated image URL
 */
export async function generateWithFluxLora(
  loraUrl: string,
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<string> {
  if (!FAL_API_KEY) {
    throw new Error('FAL_API_KEY not configured');
  }

  console.log(`[FluxLoRA] Generating image...`);
  console.log(`[FluxLoRA] Prompt: ${prompt}`);
  console.log(`[FluxLoRA] LoRA URL: ${loraUrl}`);

  // Map our aspect ratio to Flux's preset sizes
  const fluxImageSize = mapAspectRatioToFluxSize(aspectRatio);

  const generationInput = {
    prompt: prompt,
    loras: [
      {
        path: loraUrl,
        scale: 1.0, // Full strength of LoRA
      }
    ],
    image_size: fluxImageSize, // Use Flux preset instead of aspect ratio
    num_inference_steps: 28, // Good quality/speed balance
    guidance_scale: 3.5,     // Recommended for Flux
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'jpeg',
    seed: Math.floor(Math.random() * 1000000),
  };

  console.log(`[FluxLoRA] Generation input:`, JSON.stringify(generationInput, null, 2));

  try {
    const result = await fal.subscribe('fal-ai/flux-lora', {
      input: generationInput,
      logs: false,
    }) as GenerationResult;

    const imageUrl = result.images[0].url;
    console.log(`[FluxLoRA] ✓ Generated image: ${imageUrl.substring(0, 60)}...`);

    return imageUrl;
  } catch (error: any) {
    console.error('[FluxLoRA] Generation failed:', error.message);
    console.error('[FluxLoRA] Generation error details:', JSON.stringify(error.body || error, null, 2));
    throw error;
  }
}

/**
 * Check if Flux LoRA is available (API key configured)
 */
export function isFluxLoraAvailable(): boolean {
  return !!FAL_API_KEY;
}
