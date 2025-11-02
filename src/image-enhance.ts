import sharp from "sharp";
import { uploadBuffersToR2 } from "./r2-storage.js";

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

  // First, detect the actual image format
  let image = sharp(buffer);
  const metadata = await image.metadata();

  // Check if the image is in HEIF/HEIC format or any other problematic format
  // Sharp might misidentify or have issues with certain formats
  // Note: Sharp doesn't have 'heif' or 'heic' in its format types, but we keep this for safety
  if (metadata.format && (metadata.format as string) === 'heif' || (metadata.format as string) === 'heic') {
    // Convert HEIF/HEIC to JPEG first
    image = sharp(buffer).jpeg({ quality: 95, progressive: true });
  } else {
    // For other formats, create a fresh sharp instance
    image = sharp(buffer);
  }

  let pipeline = image
    .jpeg({ quality: 95, progressive: true }) // Convert to JPEG
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
    // First, try to get metadata to detect format issues early
    let metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch (metadataError: any) {
      // If we can't read metadata, it might be a HEIF/HEIC issue
      if (metadataError.message?.includes('heif') ||
          metadataError.message?.includes('bad seek') ||
          metadataError.message?.includes('compression format')) {
        throw new Error("HEIF/HEIC format is not supported. Please convert your image to JPEG or PNG format before uploading.");
      }
      throw metadataError;
    }

    // Generate unique file names with .jpg extension for enhanced images
    const timestamp = Date.now();
    const originalFileName = `enhance/original/${userId}/${timestamp}_${fileName}`;
    // Ensure enhanced file has .jpg extension
    const baseFileName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const enhancedFileName = `enhance/enhanced/${userId}/${timestamp}_enhanced_${baseFileName}.jpg`;

    // Process the enhancement
    let enhancedBuffer: Buffer;
    try {
      enhancedBuffer = await processImageEnhancement(fileBuffer, enhancementType);
    } catch (enhanceError: any) {
      if (enhanceError.message?.includes('heif') ||
          enhanceError.message?.includes('bad seek') ||
          enhanceError.message?.includes('compression format')) {
        throw new Error("Unable to process this image format. Please convert your image to JPEG or PNG format before uploading.");
      }
      throw enhanceError;
    }

    // Upload both original and enhanced to R2 in parallel
    const [originalUrls, enhancedUrls] = await Promise.all([
      uploadBuffersToR2([{
        buffer: fileBuffer,
        key: originalFileName,
      }]),
      uploadBuffersToR2([{
        buffer: enhancedBuffer,
        key: enhancedFileName,
      }]),
    ]);

    return {
      originalUrl: originalUrls[0] || '',
      enhancedUrl: enhancedUrls[0] || '',
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: enhancedBuffer.length,
        enhancementType,
      },
    };
  } catch (error: any) {
    console.error("Error enhancing image:", error);
    // Re-throw if it's already a formatted error message
    if (error.message?.includes('format')) {
      throw error;
    }
    throw new Error("Failed to enhance image. Please try a different image format.");
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