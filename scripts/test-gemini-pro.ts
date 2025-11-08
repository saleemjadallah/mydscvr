import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { STYLE_TEMPLATES } from '../src/lib/templates.js';

const MODEL_NAME = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-pro-exp-02-05';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

function usage(): never {
  console.log(`Usage: pnpm tsx scripts/test-gemini-pro.ts <selfiePath> [templateId] [outputPath]

Examples:
  pnpm tsx scripts/test-gemini-pro.ts ./selfie.jpg
  pnpm tsx scripts/test-gemini-pro.ts ./selfie.png linkedin ./tmp/headshot.png

templateId options: ${Object.keys(STYLE_TEMPLATES).join(', ')}
`);
  process.exit(1);
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      throw new Error(`Unsupported file extension "${ext}". Use .jpg, .jpeg, .png, or .webp`);
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const [, , selfiePathArg, templateIdArg = 'linkedin', outputPathArg] = process.argv;

  if (!selfiePathArg) {
    usage();
  }

  const selfiePath = path.resolve(process.cwd(), selfiePathArg);
  const template = STYLE_TEMPLATES[templateIdArg];

  if (!template) {
    throw new Error(`Unknown template "${templateIdArg}". Valid options: ${Object.keys(STYLE_TEMPLATES).join(', ')}`);
  }

  const selfieBuffer = await fs.readFile(selfiePath);
  const mimeType = getMimeType(selfiePath);

  const base64Image = selfieBuffer.toString('base64');

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You are a professional AI headshot generator. Preserve the person's identity and facial structure from the selfie while applying the requested style. Output a single, polished, photorealistic headshot that is studio quality and ready for client delivery.

Instructions:
${template.geminiPrompt}

Key requirements:
- Maintain natural skin texture and consistent facial features
- Avoid artifacts, extra limbs, or warped clothing details
- Ensure lighting and color grading feel realistic and flattering
- Deliver a final rendered headshot (no text response)`,
          },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      responseMimeType: 'image/png',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUAL', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_VIOLENCE', threshold: 'BLOCK_NONE' },
    ],
  };

  const endpoint = `${API_ENDPOINT}/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed (${response.status}): ${errorText}`);
  }

  const json = await response.json() as any;

  const inlinePart = json?.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData && part.inlineData.data
  );

  if (!inlinePart) {
    console.error('Full response:', JSON.stringify(json, null, 2));
    throw new Error('No image data returned from Gemini');
  }

  const outputBuffer = Buffer.from(inlinePart.inlineData.data, 'base64');

  const outputPath = path.resolve(
    process.cwd(),
    outputPathArg || path.join('tmp', `gemini-headshot-${Date.now()}.png`)
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, outputBuffer);

  console.log(`✅ Headshot saved to ${outputPath}`);
}

main().catch((error) => {
  console.error('❌ Failed to generate headshot:', error);
  process.exit(1);
});
