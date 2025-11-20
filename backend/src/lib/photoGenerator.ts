import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadToR2, getSignedDownloadUrl } from './storage.js';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface PhotoRequirements {
  dimensions: string;
  background: string;
  specifications: string[];
}

/**
 * Process and optimize a photo to meet visa requirements
 * Since Gemini doesn't generate images, we'll use it to analyze the photo
 * and use Sharp to process it according to requirements
 * @param photoBuffer - The user's uploaded selfie
 * @param requirements - Photo requirements from user's travel profile (Jeffrey's analysis)
 * @param userId - User ID for R2 storage path
 * @returns R2 URL of the processed compliant photo
 */
export async function generateCompliantPhoto(
  photoBuffer: Buffer,
  requirements: PhotoRequirements,
  userId: string
): Promise<string> {
  console.log('[Photo Generator] Starting processing with requirements:', requirements);

  try {
    // Parse dimensions from requirements (e.g., "35mm x 45mm" or "2\" x 2\"")
    let targetWidth = 600; // Default width in pixels
    let targetHeight = 600; // Default height in pixels

    // Extract dimensions from requirements
    const dimensionMatch = requirements.dimensions.match(/(\d+\.?\d*)\s*(?:mm|cm|"|inch|in)?\s*x\s*(\d+\.?\d*)\s*(?:mm|cm|"|inch|in)?/i);

    if (dimensionMatch) {
      const [_, w, h] = dimensionMatch;
      // Convert to pixels assuming 300 DPI
      if (requirements.dimensions.includes('mm')) {
        // mm to pixels at 300 DPI: mm * 11.811
        targetWidth = Math.round(parseFloat(w) * 11.811);
        targetHeight = Math.round(parseFloat(h) * 11.811);
      } else if (requirements.dimensions.includes('cm')) {
        // cm to pixels at 300 DPI: cm * 118.11
        targetWidth = Math.round(parseFloat(w) * 118.11);
        targetHeight = Math.round(parseFloat(h) * 118.11);
      } else if (requirements.dimensions.includes('"') || requirements.dimensions.includes('inch')) {
        // inches to pixels at 300 DPI
        targetWidth = Math.round(parseFloat(w) * 300);
        targetHeight = Math.round(parseFloat(h) * 300);
      }
    }

    console.log(`[Photo Generator] Target dimensions: ${targetWidth}x${targetHeight} pixels`);

    // First, analyze the photo with Gemini to check compliance
    const base64Image = photoBuffer.toString('base64');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const analysisPrompt = `Analyze this photo for visa/passport photo compliance. Check for:
1. Face clearly visible and centered
2. Neutral expression
3. Eyes open and visible
4. No glasses with glare
5. Plain background
6. Good lighting without shadows

Return a JSON object with:
- compliant: boolean
- issues: array of strings describing any issues
- suggestions: array of strings for improvements`;

    const analysisResult = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      { text: analysisPrompt },
    ]);

    const analysisText = analysisResult.response.text();
    console.log('[Photo Generator] Analysis result:', analysisText);

    // Process the image with Sharp
    let processedImage = sharp(photoBuffer);

    // Get image metadata
    const metadata = await processedImage.metadata();
    const originalWidth = metadata.width || targetWidth;
    const originalHeight = metadata.height || targetHeight;

    // Calculate crop area to center the face (assuming face is in the center)
    const aspectRatio = targetWidth / targetHeight;
    let cropWidth = originalWidth;
    let cropHeight = originalHeight;

    if (originalWidth / originalHeight > aspectRatio) {
      // Image is wider than needed
      cropWidth = Math.round(originalHeight * aspectRatio);
    } else {
      // Image is taller than needed
      cropHeight = Math.round(originalWidth / aspectRatio);
    }

    const cropLeft = Math.round((originalWidth - cropWidth) / 2);
    const cropTop = Math.round((originalHeight - cropHeight) / 2);

    // Process the image
    processedImage = processedImage
      // Crop to correct aspect ratio
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight
      })
      // Resize to target dimensions
      .resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.lanczos3,
        fit: 'cover',
        position: 'center'
      })
      // Adjust brightness and contrast for better visibility
      .normalize()
      // Ensure white/light background if needed
      .flatten({
        background: requirements.background.toLowerCase().includes('white')
          ? { r: 255, g: 255, b: 255 }
          : { r: 240, g: 240, b: 240 }
      })
      // Sharpen slightly for clarity
      .sharpen({ sigma: 0.5 })
      // Convert to JPEG with high quality
      .jpeg({
        quality: 95,
        mozjpeg: true
      });

    const processedBuffer = await processedImage.toBuffer();

    // Upload to R2
    const timestamp = Date.now();
    const r2Key = `compliant-photos/${userId}/${timestamp}-compliant.jpg`;

    await uploadToR2(r2Key, processedBuffer, 'image/jpeg');

    // Get signed URL for download
    const signedUrl = await getSignedDownloadUrl(r2Key, 60 * 60 * 24); // 24 hours

    console.log('[Photo Generator] Successfully processed and uploaded photo');

    return signedUrl;
  } catch (error: any) {
    console.error('[Photo Generator] Error:', error);
    throw new Error(`Failed to process compliant photo: ${error.message}`);
  }
}