import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
});

type GeminiImage = {
  b64_json: string;
  mimeType?: string;
};

async function generateImage(prompt: string): Promise<GeminiImage[]> {
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const parts =
    response.response?.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ??
    [];

  const images = parts
    .map((part) => part.inlineData)
    .filter((inlineData): inlineData is NonNullable<typeof inlineData> => Boolean(inlineData?.data))
    .map((inlineData) => ({
      b64_json: inlineData.data!,
      mimeType: inlineData.mimeType ?? "image/png",
    }));

  if (!images.length) {
    throw new Error("Gemini did not return image data for the requested prompt.");
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
