import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Initialize R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Upload a base64 image to R2 and return the public URL
 */
export async function uploadImageToR2(
  base64Image: string,
  filename?: string
): Promise<string> {
  try {
    // Remove data URI prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Generate unique filename if not provided
    const key = filename || `images/${crypto.randomUUID()}.png`;

    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000", // Cache for 1 year
      })
    );

    // Return public URL
    return `${PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload image to storage");
  }
}

/**
 * Upload multiple base64 images to R2
 */
export async function uploadImagesToR2(
  base64Images: string[],
  prefix?: string
): Promise<string[]> {
  const uploadPromises = base64Images.map((image, index) => {
    const filename = prefix
      ? `images/${prefix}-${index + 1}-${crypto.randomUUID()}.png`
      : undefined;
    return uploadImageToR2(image, filename);
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete an image from R2 by URL
 */
export async function deleteImageFromR2(imageUrl: string): Promise<void> {
  try {
    // Extract key from URL
    const key = imageUrl.replace(`${PUBLIC_URL}/`, "");

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Failed to delete image from storage");
  }
}

/**
 * Delete multiple images from R2
 */
export async function deleteImagesFromR2(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map((url) => deleteImageFromR2(url));
  await Promise.all(deletePromises);
}

/**
 * Upload a buffer to R2 and return the public URL
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  try {
    // Upload to R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000", // Cache for 1 year
      })
    );

    // Return public URL
    return `${PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("Error uploading buffer to R2:", error);
    throw new Error("Failed to upload image to storage");
  }
}

/**
 * Upload multiple buffers to R2
 */
export async function uploadBuffersToR2(
  items: Array<{ buffer: Buffer; key: string; contentType?: string }>
): Promise<string[]> {
  const uploadPromises = items.map((item) =>
    uploadBufferToR2(item.buffer, item.key, item.contentType || "image/jpeg")
  );
  return Promise.all(uploadPromises);
}
