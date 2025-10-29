import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const defaultModel = "models/gemini-2.5-flash-image";
const configuredModel = process.env.GEMINI_IMAGE_MODEL;
const imageModelName = configuredModel ?? defaultModel;

type GeminiImage = {
  b64_json: string;
  mimeType?: string;
};

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function streamImageParts(prompt: string): Promise<{ images: GeminiImage[]; messages: string[] }> {
  const stream = await genAI.models.generateContentStream({
    model: imageModelName,
    config: {
      responseModalities: ["IMAGE"],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const images: GeminiImage[] = [];
  const messages: string[] = [];

  for await (const chunk of stream) {
    const parts = chunk.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        images.push({
          b64_json: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? "image/png",
        });
      } else if ((part as any)?.text) {
        messages.push((part as any).text as string);
      }
    }
  }

  return { images, messages };
}

export async function generateImageBase64(prompt: string): Promise<string> {
  const { images, messages } = await streamImageParts(prompt);
  const [image] = images;
  if (!image) {
    const fallbackText = messages.length ? messages.join("\n") : "No additional details provided.";
    throw new Error(
      `Gemini (model: ${imageModelName}) did not return image data. Details: ${fallbackText}`
    );
  }

  return `data:${image.mimeType ?? "image/png"};base64,${image.b64_json}`;
}
