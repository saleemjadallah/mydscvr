import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const imageModelName = process.env.GEMINI_IMAGE_MODEL || "models/gemini-2.5-flash-image";

interface FoodStyle {
  name: string;
  foodItem: string;
  prompt: string;
  filename: string;
}

const foodStyles: FoodStyle[] = [
  {
    name: "Rustic Dark",
    foodItem: "Grilled ribeye steak",
    prompt: "A professional food photography shot of a perfectly grilled ribeye steak with beautiful char marks, served on a dark rustic wooden board. Dark, moody lighting with dramatic shadows. Garnished with fresh herbs and roasted vegetables. Restaurant-quality plating. Warm, dim lighting from above. Cinematic food photography style. 8k resolution, ultra detailed.",
    filename: "rustic-dark-steak.jpg"
  },
  {
    name: "Bright Modern",
    foodItem: "Avocado toast",
    prompt: "A bright, minimalist overhead shot of gourmet avocado toast on artisan sourdough bread. Clean white background with natural daylight. Perfectly arranged with microgreens, cherry tomatoes, and a poached egg. Modern, health-conscious aesthetic. Crisp, clean shadows. Professional food photography for a health food brand. 8k resolution, ultra detailed.",
    filename: "bright-modern-avocado-toast.jpg"
  },
  {
    name: "Social Media",
    foodItem: "Acai bowl",
    prompt: "An Instagram-perfect overhead shot of a vibrant acai bowl. Beautifully arranged with fresh berries, sliced banana, granola, and coconut flakes in a symmetric pattern. Bright, saturated colors. Shot from directly above on a marble surface. Natural lighting. Instagram food photography style, highly shareable. 8k resolution, ultra detailed.",
    filename: "social-media-acai-bowl.jpg"
  },
  {
    name: "Delivery App",
    foodItem: "Burger and fries",
    prompt: "A clean, appetizing shot of a gourmet burger with crispy fries, optimized for a food delivery app. Bright, even lighting with no harsh shadows. Shot at a 45-degree angle showing the layers of the burger. Fresh ingredients visible. White or light neutral background. Professional e-commerce food photography. 8k resolution, ultra detailed.",
    filename: "delivery-app-burger.jpg"
  },
  {
    name: "Rustic Dark",
    foodItem: "Pasta carbonara",
    prompt: "A moody, atmospheric shot of fresh pasta carbonara in a dark ceramic bowl. Rich, creamy sauce with visible black pepper and crispy pancetta. Dark wooden table background. Soft, dramatic side lighting. Steam rising from the hot pasta. Professional Italian restaurant photography. 8k resolution, ultra detailed.",
    filename: "rustic-dark-pasta.jpg"
  },
  {
    name: "Bright Modern",
    foodItem: "Poke bowl",
    prompt: "A clean, vibrant overhead shot of a colorful poke bowl with fresh salmon, edamame, cucumber, and avocado. Bright white bowl on a light background. Natural daylight photography. Fresh, healthy aesthetic. All ingredients perfectly arranged in sections. Modern restaurant photography. 8k resolution, ultra detailed.",
    filename: "bright-modern-poke-bowl.jpg"
  },
  {
    name: "Social Media",
    foodItem: "Matcha latte art",
    prompt: "A perfectly styled overhead shot of a matcha latte with beautiful latte art. White ceramic cup on a pink marble surface. Surrounded by aesthetic props like flowers and small plates. Soft, natural lighting. Instagram-worthy composition. Trendy coffee shop aesthetic. 8k resolution, ultra detailed.",
    filename: "social-media-matcha-latte.jpg"
  },
  {
    name: "Delivery App",
    foodItem: "Sushi platter",
    prompt: "A clean, professional shot of a sushi platter with various rolls arranged neatly. Bright, even lighting. Shot from a slight angle to show depth. White serving plate with soy sauce, wasabi, and ginger on the side. Light background. Perfect for a delivery app menu. 8k resolution, ultra detailed.",
    filename: "delivery-app-sushi.jpg"
  },
  {
    name: "Rustic Dark",
    foodItem: "BBQ ribs",
    prompt: "A dramatic shot of glazed BBQ ribs on a dark slate board. Rich, dark BBQ sauce glistening under moody lighting. Smoke effects visible. Dark wooden background. Garnished with fresh herbs. Cinematic food photography with dramatic shadows. Restaurant-quality presentation. 8k resolution, ultra detailed.",
    filename: "rustic-dark-ribs.jpg"
  },
  {
    name: "Bright Modern",
    foodItem: "Greek salad",
    prompt: "A fresh, colorful overhead shot of a Greek salad with feta cheese, olives, tomatoes, and cucumbers. Bright white bowl on a light marble surface. Natural daylight from a window. Clean, minimal aesthetic. All ingredients beautifully arranged. Health-focused restaurant photography. 8k resolution, ultra detailed.",
    filename: "bright-modern-greek-salad.jpg"
  }
];

async function generateFoodImage(style: FoodStyle): Promise<void> {
  try {
    console.log(`Generating: ${style.name} - ${style.foodItem}...`);

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
              text: style.prompt,
            },
          ],
        },
      ],
    });

    const parts = response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        const imageBase64 = part.inlineData.data;
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Save to attached_assets/sample-food-carousel/
        const outputDir = path.join(process.cwd(), '..', 'attached_assets', 'sample-food-carousel');
        await fs.mkdir(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, style.filename);
        await fs.writeFile(outputPath, imageBuffer);

        console.log(`✓ Saved: ${style.filename} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
        return;
      }
    }

    throw new Error("Gemini did not return image data");
  } catch (error: any) {
    console.error(`✗ Failed to generate ${style.name} - ${style.foodItem}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎨 Generating 10 AI food images for carousel...\n');

  try {
    // Generate images sequentially to avoid rate limits
    for (const style of foodStyles) {
      await generateFoodImage(style);
      // Small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✨ All images generated successfully!');
    console.log('📁 Images saved to: attached_assets/sample-food-carousel/');
  } catch (error: any) {
    console.error('\n❌ Error generating images:', error.message);
    process.exit(1);
  }
}

main();
