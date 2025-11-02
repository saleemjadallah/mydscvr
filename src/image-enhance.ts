import sharp from "sharp";
import { uploadImagesToR2 } from "./r2-storage.js";

// Enhancement presets for food photography
const ENHANCEMENT_PRESETS = {
  vibrant: {
    brightness: 1.1,
    saturation: 1.3,
    contrast: 1.15,
    sharpen: true,
    vibrance: 1.2,
  },
  natural: {
    brightness: 1.05,
    saturation: 1.15,
    contrast: 1.1,
    sharpen: true,
    vibrance: 1.1,
  },
  dramatic: {
    brightness: 1.0,
    saturation: 1.4,
    contrast: 1.25,
    sharpen: true,
    vibrance: 1.3,
  }
};

export interface EnhancementResult {
  originalUrl: string;
  enhancedUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    enhancementType: string;
  };
}

/**
 * Enhance an image using Sharp image processing
 * In production, this could be replaced with AI-based enhancement services
 */
async function processImageEnhancement(
  buffer: Buffer,
  enhancementType: 'vibrant' | 'natural' | 'dramatic' = 'vibrant'
): Promise<Buffer> {
  const preset = ENHANCEMENT_PRESETS[enhancementType];

  let pipeline = sharp(buffer)
    .jpeg({ quality: 95, progressive: true })
    .modulate({
      brightness: preset.brightness,
      saturation: preset.saturation,
    })
    .linear(preset.contrast, -(128 * (preset.contrast - 1))); // Contrast adjustment

  if (preset.sharpen) {
    pipeline = pipeline.sharpen();
  }

  // Auto-enhance using Sharp's built-in algorithms
  pipeline = pipeline
    .normalize() // Normalize the image histogram
    .removeAlpha(); // Remove alpha channel if present

  return await pipeline.toBuffer();
}

/**
 * Main enhancement function that handles the entire flow
 */
export async function enhanceImage(
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  enhancementType: 'vibrant' | 'natural' | 'dramatic' = 'vibrant'
): Promise<EnhancementResult> {
  try {
    // Get image metadata
    const metadata = await sharp(fileBuffer).metadata();

    // Generate unique file names
    const timestamp = Date.now();
    const originalFileName = `enhance/original/${userId}/${timestamp}_${fileName}`;
    const enhancedFileName = `enhance/enhanced/${userId}/${timestamp}_enhanced_${fileName}`;

    // Process the enhancement
    const enhancedBuffer = await processImageEnhancement(fileBuffer, enhancementType);

    // Upload both original and enhanced to R2 in parallel
    const [originalUrls, enhancedUrls] = await Promise.all([
      uploadImagesToR2([{
        buffer: fileBuffer,
        key: originalFileName,
      }]),
      uploadImagesToR2([{
        buffer: enhancedBuffer,
        key: enhancedFileName,
      }]),
    ]);

    return {
      originalUrl: originalUrls[0],
      enhancedUrl: enhancedUrls[0],
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: enhancedBuffer.length,
        enhancementType,
      },
    };
  } catch (error) {
    console.error("Error enhancing image:", error);
    throw new Error("Failed to enhance image");
  }
}

/**
 * Analyze food in image using Gemini Vision API
 * This can provide insights about the food for better enhancement
 * NOTE: Temporarily simplified - returns default values
 */
export async function analyzeFoodImage(buffer: Buffer): Promise<{
  description: string;
  suggestions: string[];
  quality: 'excellent' | 'good' | 'needs_improvement';
}> {
  // For now, return default analysis
  // TODO: Implement proper Gemini Vision API integration when needed
  return {
    description: "Food dish",
    quality: 'good',
    suggestions: ["Enhance colors", "Improve sharpness", "Adjust lighting"],
  };
}

/**
 * Batch enhance multiple images
 */
export async function batchEnhanceImages(
  images: Array<{ buffer: Buffer; fileName: string }>,
  userId: string,
  enhancementType: 'vibrant' | 'natural' | 'dramatic' = 'vibrant'
): Promise<EnhancementResult[]> {
  const results = await Promise.all(
    images.map(image =>
      enhanceImage(image.buffer, image.fileName, userId, enhancementType)
    )
  );

  return results;
}