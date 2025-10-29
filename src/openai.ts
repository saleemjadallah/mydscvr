import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const defaultModel = "models/gemini-2.5-flash-image";
const configuredModel = process.env.GEMINI_IMAGE_MODEL;
const imageModelName =
  configuredModel && configuredModel.startsWith("models/")
    ? configuredModel
    : configuredModel
      ? `models/${configuredModel}`
      : defaultModel;

type GeminiImage = {
  b64_json: string;
  mimeType?: string;
};

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateImage(prompt: string): Promise<GeminiImage[]> {
  const response = await genAI.models.generateContent({
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

  const parts =
    response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];

  const images = parts
    .map((part) => part.inlineData)
    .filter((inlineData): inlineData is NonNullable<typeof inlineData> => Boolean(inlineData?.data))
    .map((inlineData) => ({
      b64_json: inlineData.data!,
      mimeType: inlineData.mimeType ?? "image/png",
    }));

  if (!images.length) {
    const fallbackText =
      response.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => (part as any)?.text as string | undefined)
        .filter((text): text is string => Boolean(text))
        .join("\n") ?? "No additional details provided.";
    throw new Error(
      `Gemini (model: ${imageModelName}) did not return image data. Details: ${fallbackText}`
    );
  }

  return images;
}

export const openai = {
  images: {
    async generate({
      prompt,
    }: {
      model?: string;
      prompt: string;
      size?: string;
      n?: number;
    }): Promise<{ data: GeminiImage[] }> {
      const images = await generateImage(prompt);
      return { data: images };
    },
  },
};
