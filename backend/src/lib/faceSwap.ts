/**
 * Face-Swapping Integration Service
 * Uses Replicate API for high-quality professional face swapping
 */

import Replicate from 'replicate';
import axios from 'axios';

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const USE_REPLICATE = !!REPLICATE_API_KEY; // Use Replicate if API key is set

// Fallback to self-hosted service if no Replicate key
const FACE_SWAP_SERVICE_URL = process.env.FACE_SWAP_SERVICE_URL || 'http://localhost:5000';

// Initialize Replicate client
const replicate = REPLICATE_API_KEY ? new Replicate({
  auth: REPLICATE_API_KEY,
}) : null;

interface PhotoAnalysis {
  score: number;
  face_detected: boolean;
  confidence: number;
  yaw_angle: number;
  front_facing: boolean;
  resolution: string;
  face_size_ratio: number;
  sharpness: number;
  brightness: number;
  num_faces: number;
}

interface BestPhotoSelection {
  primary: string;
  fallbacks: string[];
  scores: Array<PhotoAnalysis & { url: string }>;
}

/**
 * Check if face-swap service is healthy and ready
 */
export async function checkFaceSwapService(): Promise<boolean> {
  try {
    const response = await axios.get(`${FACE_SWAP_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    return response.data.status === 'healthy' && response.data.models_loaded === true;
  } catch (error) {
    console.error('[FaceSwap] Service health check failed:', error);
    return false;
  }
}

/**
 * Analyze photo quality for face-swapping suitability
 */
export async function analyzePhotoQuality(imageUrl: string): Promise<PhotoAnalysis | null> {
  try {
    const response = await axios.post(
      `${FACE_SWAP_SERVICE_URL}/analyze-photo`,
      { image_url: imageUrl },
      { timeout: 30000 }
    );

    if (response.data.success) {
      return response.data.data;
    }

    console.error('[FaceSwap] Analysis failed:', response.data.error);
    return null;
  } catch (error: any) {
    console.error('[FaceSwap] Error analyzing photo:', error.message);
    return null;
  }
}

/**
 * Select best reference photo from multiple uploaded photos
 */
export async function selectBestReferencePhoto(imageUrls: string[]): Promise<BestPhotoSelection | null> {
  try {
    console.log(`[FaceSwap] Selecting best photo from ${imageUrls.length} candidates...`);

    const response = await axios.post(
      `${FACE_SWAP_SERVICE_URL}/select-best-photo`,
      { image_urls: imageUrls },
      { timeout: 60000 } // Allow more time for multiple photos
    );

    if (response.data.success) {
      const selection = response.data.data;
      console.log(`[FaceSwap] Best photo selected: ${selection.primary}`);
      console.log(`[FaceSwap] Score: ${selection.scores[0].score}/100`);
      return selection;
    }

    console.error('[FaceSwap] Selection failed:', response.data.error);
    return null;
  } catch (error: any) {
    console.error('[FaceSwap] Error selecting best photo:', error.message);
    return null;
  }
}

/**
 * Swap face from source image onto target image using Replicate API
 * Falls back to self-hosted service if Replicate is not available
 *
 * @param targetImageUrl - URL of generated professional headshot (from Gemini)
 * @param sourceImageUrl - URL of user's reference photo
 * @returns Buffer of swapped image, or null if failed
 */
export async function swapFace(
  targetImageUrl: string,
  sourceImageUrl: string
): Promise<Buffer | null> {
  console.log('[FaceSwap] Swapping face...');
  console.log(`[FaceSwap]   Target: ${targetImageUrl.substring(0, 60)}...`);
  console.log(`[FaceSwap]   Source: ${sourceImageUrl.substring(0, 60)}...`);

  const startTime = Date.now();

  // Use Replicate API for high-quality face swapping if available
  if (USE_REPLICATE && replicate) {
    try {
      console.log('[FaceSwap] Using Replicate API (high quality)...');

      const output = await replicate.run(
        "yan-ops/face_swap:d5900f9ebed33e7ae6534b097f1151646b1059b2258c58ea950d33778f6d109a",
        {
          input: {
            target_image: targetImageUrl,
            swap_image: sourceImageUrl,
          }
        }
      ) as string;

      // Download the result from Replicate's CDN
      const imageResponse = await axios.get(output, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[FaceSwap] ✓ Replicate face swap completed in ${elapsed}s`);

      return Buffer.from(imageResponse.data);
    } catch (error: any) {
      console.error('[FaceSwap] Replicate API error:', error.message);
      console.log('[FaceSwap] Falling back to self-hosted service...');
    }
  }

  // Fallback to self-hosted InsightFace service
  try {
    const response = await axios.post(
      `${FACE_SWAP_SERVICE_URL}/swap-face`,
      {
        target_url: targetImageUrl,
        source_url: sourceImageUrl,
      },
      {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[FaceSwap] ✓ Self-hosted face swap completed in ${elapsed}s`);

    return Buffer.from(response.data);
  } catch (error: any) {
    if (error.response?.data) {
      try {
        const errorText = Buffer.from(error.response.data).toString();
        const errorJson = JSON.parse(errorText);
        console.error('[FaceSwap] Service error:', errorJson.error);
      } catch {
        console.error('[FaceSwap] Service returned error');
      }
    } else {
      console.error('[FaceSwap] Error swapping face:', error.message);
    }
    return null;
  }
}

/**
 * Process headshot with face-swapping for perfect facial accuracy
 *
 * This is the main function to integrate into the generation pipeline.
 * It wraps the face-swap operation with error handling and fallbacks.
 *
 * @param generatedImageBuffer - Buffer of Gemini-generated professional headshot
 * @param referencePhotoUrl - URL of best user reference photo
 * @param fallbackReferenceUrls - Backup reference photos if primary fails
 * @returns Buffer of final headshot with swapped face
 */
export async function processHeadshotWithFaceSwap(
  generatedImageUrl: string,
  referencePhotoUrl: string,
  fallbackReferenceUrls: string[] = []
): Promise<Buffer | null> {
  try {
    // Try with primary reference photo
    let result = await swapFace(generatedImageUrl, referencePhotoUrl);

    if (result) {
      return result;
    }

    // Try fallback reference photos
    for (const fallbackUrl of fallbackReferenceUrls) {
      console.log('[FaceSwap] Primary swap failed, trying fallback...');
      result = await swapFace(generatedImageUrl, fallbackUrl);

      if (result) {
        console.log('[FaceSwap] ✓ Fallback swap succeeded');
        return result;
      }
    }

    console.error('[FaceSwap] All face swap attempts failed');
    return null;
  } catch (error) {
    console.error('[FaceSwap] Unexpected error in processHeadshotWithFaceSwap:', error);
    return null;
  }
}
