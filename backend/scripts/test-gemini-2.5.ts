import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testGemini25ImageGeneration() {
  console.log('🧪 Testing Gemini 2.5 Flash Image Generation...\n');

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const prompt = `Generate a professional corporate headshot of a person in business attire.

Requirements:
- Professional business suit
- Neutral gray background
- Studio lighting
- Confident expression
- High quality, sharp focus
- 1024x1024 pixels

Create a photorealistic professional headshot suitable for LinkedIn.`;

    console.log('📝 Prompt:', prompt);
    console.log('\n⏳ Generating image...\n');

    const result = await model.generateContent([prompt]);
    const response = result.response;

    console.log('📊 Response received');
    console.log('Candidates:', response.candidates?.length);

    // Extract image from response
    let imageGenerated = false;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log('\n✅ Image generated successfully!');
        console.log('MIME Type:', part.inlineData.mimeType);
        console.log('Data size:', part.inlineData.data.length, 'bytes');

        // Save the image
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        const outputPath = join(process.cwd(), 'test-generated-headshot.jpg');
        writeFileSync(outputPath, imageBuffer);

        console.log('💾 Saved to:', outputPath);
        imageGenerated = true;
        break;
      }

      if (part.text) {
        console.log('📝 Text response:', part.text);
      }
    }

    if (!imageGenerated) {
      console.log('\n⚠️  No image was generated in the response');
      console.log('Full response:', JSON.stringify(response, null, 2));
    }

    console.log('\n✨ Test completed!');
  } catch (error: any) {
    console.error('\n❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
}

// Run the test
testGemini25ImageGeneration().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
