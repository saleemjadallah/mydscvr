import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadToR2 } from './storage.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface PhotoRequirements {
  dimensions: string;
  background: string;
  specifications: string[];
}

/**
 * Generate a compliant visa photo using Gemini AI
 * @param photoBuffer - The user's uploaded selfie
 * @param requirements - Photo requirements from user's travel profile (Jeffrey's analysis)
 * @param userId - User ID for R2 storage path
 * @returns R2 URL of the generated compliant photo
 */
export async function generateCompliantPhoto(
  photoBuffer: Buffer,
  requirements: PhotoRequirements,
  userId: string
): Promise<string> {
  console.log('[Photo Generator] Starting generation with requirements:', requirements);

  // Convert buffer to base64 for Gemini
  const base64Image = photoBuffer.toString('base64');

  // Build detailed prompt from requirements
  const prompt = `You are a professional visa photo generator. Generate a compliant visa/passport photo based on this selfie and the following official requirements:

**Dimensions**: ${requirements.dimensions}
**Background**: ${requirements.background}
**Specifications**:
${requirements.specifications.map((spec, i) => `${i + 1}. ${spec}`).join('\n')}

IMPORTANT INSTRUCTIONS:
- Generate a NEW photo that meets ALL the requirements above
- Use the person's face from the provided selfie but create a compliant visa photo
- Ensure the background is exactly as specified (${requirements.background})
- Center the face and ensure proper sizing according to specifications
- Remove any glasses, headwear, or accessories unless specifications allow them
- Ensure neutral expression, eyes open, mouth closed
- Make the photo look professional and official
- Output should be high quality and meet the exact dimensions specified

Generate the compliant photo now.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const generatedImage = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (!generatedImage?.inlineData?.data) {
      throw new Error('Gemini did not return a generated image');
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(generatedImage.inlineData.data, 'base64');

    // Upload to R2
    const timestamp = Date.now();
    const r2Key = `compliant-photos/${userId}/${timestamp}-compliant.jpg`;
    
    await uploadToR2(r2Key, imageBuffer, 'image/jpeg');

    // Get signed URL for download
    const { getSignedDownloadUrl } = await import('./storage.js');
    const signedUrl = await getSignedDownloadUrl(r2Key, 60 * 60 * 24); // 24 hours
    
    console.log('[Photo Generator] Successfully generated and uploaded photo');
    
    return signedUrl;
  } catch (error: any) {
    console.error('[Photo Generator] Error:', error);
    throw new Error(`Failed to generate compliant photo: ${error.message}`);
  }
}
