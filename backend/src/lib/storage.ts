import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'crypto';

// Configure R2 client (Cloudflare R2 is S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Optimize for Cloudflare R2
  forcePathStyle: false,
  requestHandler: {
    requestTimeout: 30000, // 30 seconds for large uploads
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// Image optimization settings
export const IMAGE_SETTINGS = {
  upload: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 95,
    format: 'jpeg',
  },
  generated: {
    quality: 92,
    format: 'jpeg',
    progressive: true,
  },
  thumbnail: {
    width: 400,
    height: 400,
    quality: 85,
    format: 'jpeg',
  },
  preview: {
    width: 800,
    height: 800,
    quality: 88,
    format: 'jpeg',
  },
};

// Upload user photo
export async function uploadUserPhoto(
  userId: string,
  batchId: number,
  photo: Buffer,
  photoIndex: number
): Promise<string> {
  const key = `uploads/${userId}/${batchId}/${photoIndex}.jpg`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: photo,
      ContentType: 'image/jpeg',
    })
  );

  return getPublicUrl(key);
}

// Upload generated headshot
export async function uploadGeneratedHeadshot(
  userId: string,
  batchId: number,
  image: Buffer,
  metadata: {
    template: string;
    index: number;
  }
): Promise<{ url: string; thumbnail: string }> {
  const headshotId = `${metadata.template}-${metadata.index}`;

  // Upload full resolution
  const fullKey = `generated/${userId}/${batchId}/${headshotId}.jpg`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullKey,
      Body: image,
      ContentType: 'image/jpeg',
    })
  );

  // Generate and upload thumbnail
  const thumbnail = await generateThumbnail(image, 300, 300);
  const thumbKey = `thumbnails/${userId}/${batchId}/${headshotId}.jpg`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbKey,
      Body: thumbnail,
      ContentType: 'image/jpeg',
    })
  );

  return {
    url: getPublicUrl(fullKey),
    thumbnail: getPublicUrl(thumbKey),
  };
}

// Generate thumbnail with optimized settings
export async function generateThumbnail(
  image: Buffer,
  width: number = IMAGE_SETTINGS.thumbnail.width,
  height: number = IMAGE_SETTINGS.thumbnail.height
): Promise<Buffer> {
  return sharp(image)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: false,
    })
    .jpeg({
      quality: IMAGE_SETTINGS.thumbnail.quality,
      progressive: true,
      optimizeScans: true,
    })
    .toBuffer();
}

// Generate preview image (medium size for web display)
export async function generatePreview(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .resize(IMAGE_SETTINGS.preview.width, IMAGE_SETTINGS.preview.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: IMAGE_SETTINGS.preview.quality,
      progressive: true,
      optimizeScans: true,
    })
    .toBuffer();
}

// Optimize uploaded image for processing
export async function optimizeUploadedImage(buffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();

  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(IMAGE_SETTINGS.upload.maxWidth, IMAGE_SETTINGS.upload.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: IMAGE_SETTINGS.upload.quality,
      progressive: true,
      optimizeScans: true,
    })
    .toBuffer();
}

// Optimize generated headshot
export async function optimizeGeneratedHeadshot(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .jpeg({
      quality: IMAGE_SETTINGS.generated.quality,
      progressive: IMAGE_SETTINGS.generated.progressive,
      optimizeScans: true,
      mozjpeg: true, // Use mozjpeg for better compression
    })
    .toBuffer();
}

// Get public URL
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

// Get signed URL for temporary access
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

// Delete file from R2
export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

// Delete batch files
export async function deleteBatchFiles(userId: string, batchId: number): Promise<void> {
  const prefixes = [
    `uploads/${userId}/${batchId}/`,
    `generated/${userId}/${batchId}/`,
    `thumbnails/${userId}/${batchId}/`,
  ];

  for (const prefix of prefixes) {
    try {
      // List all objects with this prefix
      const listResponse = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix,
        })
      );

      // Delete each object
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        await Promise.all(
          listResponse.Contents.map((object) =>
            r2Client.send(
              new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: object.Key,
              })
            )
          )
        );
        console.log(`[R2] Deleted ${listResponse.Contents.length} files from ${prefix}`);
      }
    } catch (error) {
      console.error(`[R2] Error deleting files from ${prefix}:`, error);
    }
  }
}

/**
 * Delete multiple images from R2 by their URLs
 */
export async function deleteImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map(async (url) => {
    try {
      const key = url.replace(`${PUBLIC_URL}/`, '');
      await deleteFile(key);
    } catch (error) {
      console.error(`[R2] Error deleting ${url}:`, error);
    }
  });

  await Promise.all(deletePromises);
}

/**
 * Upload base64 image to R2
 */
export async function uploadBase64Image(base64Image: string, filename?: string): Promise<string> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const key = filename || `images/${crypto.randomUUID()}.png`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000', // 1 year cache
    })
  );

  return getPublicUrl(key);
}

/**
 * Upload buffer to R2 with custom key and content type
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    })
  );

  return getPublicUrl(key);
}

/**
 * Download file from R2 as buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Download file by URL
 */
export async function downloadFileByUrl(url: string): Promise<Buffer> {
  const key = url.replace(`${PUBLIC_URL}/`, '');
  return downloadFile(key);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);

  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    etag: response.ETag,
  };
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await getFileMetadata(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all files in a batch
 */
export async function listBatchFiles(userId: string, batchId: number) {
  const prefixes = {
    uploads: `uploads/${userId}/${batchId}/`,
    generated: `generated/${userId}/${batchId}/`,
    thumbnails: `thumbnails/${userId}/${batchId}/`,
  };

  const files: Record<string, string[]> = {
    uploads: [],
    generated: [],
    thumbnails: [],
  };

  for (const [type, prefix] of Object.entries(prefixes)) {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (response.Contents) {
      files[type] = response.Contents.map(obj => getPublicUrl(obj.Key!));
    }
  }

  return files;
}

// R2 bucket structure:
// /uploads/{userId}/{batchId}/{photoId}.jpg          - User uploaded photos (optimized, max 2048x2048)
// /generated/{userId}/{batchId}/{headshotId}.jpg     - Generated headshots (full resolution)
// /thumbnails/{userId}/{batchId}/{headshotId}.jpg    - Thumbnails for gallery (400x400)
// /previews/{userId}/{batchId}/{headshotId}.jpg      - Preview images for web (800x800)
