import sharp from "sharp";
import { uploadBuffersToR2 } from "./r2-storage.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Use Gemini 2.5 Flash Image model for image enhancement
const imageModelName = process.env.GEMINI_IMAGE_MODEL || "models/gemini-2.5-flash-image";

// Enhancement style prompts for AI-powered enhancement
const ENHANCEMENT_PROMPTS = {
  vibrant: `Transform this food photo into a vibrant, mouth-watering professional image. Enhance colors to be rich and appetizing, boost saturation for visual pop, improve lighting to highlight textures and details, increase sharpness and clarity, enhance contrast for depth, make colors more vivid and eye-catching, optimize for social media and menu displays. Professional food photography quality with award-winning appeal.`,

  natural: `Enhance this food photo with natural, authentic appeal. Improve lighting while maintaining realistic tones, subtly boost colors to be appetizing but true-to-life, enhance sharpness and details, optimize shadows and highlights for depth, maintain authentic food appearance, create warm and inviting atmosphere. High-end restaurant photography with natural elegance.`,

  dramatic: `Transform this food photo into a dramatic, striking professional image. Create bold contrast and rich shadows, enhance colors to be deep and intense, optimize lighting for dramatic effect, sharpen details for impact, create mood and atmosphere, add cinematic food photography quality, make the dish visually captivating and memorable. Award-winning editorial food photography style.`
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
 * Enhance an image using Gemini AI-powered enhancement
 * Transforms food photos into professional, menu-ready images
 */
async function processImageEnhancement(
  buffer: Buffer,
  enhancementType: 'vibrant' | 'natural' | 'dramatic' = 'vibrant'
): Promise<Buffer> {
  const enhancementPrompt = ENHANCEMENT_PROMPTS[enhancementType];

  // Convert image to base64 for Gemini
  const base64Image = buffer.toString('base64');
  const metadata = await sharp(buffer).metadata();
  const mimeType = metadata.format === 'png' ? 'image/png' : 'image/jpeg';

  try {
    console.log(`[Gemini Enhancement] Starting ${enhancementType} enhancement with ${imageModelName}`);
    const startTime = process.hrtime.bigint();

    // Call Gemini to enhance the image
    const response = await genAI.models.generateContent({
      model: imageModelName,
      config: {
        responseModalities: ["IMAGE"],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: enhancementPrompt,
            },
          ],
        },
      ],
    });

    const parts = response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];

    // Extract the enhanced image from response
    for (const part of parts) {
      if (part.inlineData?.data) {
        const enhancedBase64 = part.inlineData.data;
        const enhancedBuffer = Buffer.from(enhancedBase64, 'base64');

        const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        console.log(`[Gemini Enhancement] Enhanced in ${elapsedMs.toFixed(0)}ms`);

        // Ensure output is in JPEG format with good quality
        return await sharp(enhancedBuffer)
          .jpeg({ quality: 95, progressive: true })
          .toBuffer();
      }
    }

    throw new Error("Gemini did not return enhanced image data");
  } catch (error: any) {
    console.error("[Gemini Enhancement] AI enhancement failed:", error.message);
    throw new Error(`AI enhancement failed: ${error.message}`);
  }
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