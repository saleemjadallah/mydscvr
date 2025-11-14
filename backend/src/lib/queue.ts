import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { db, headshotBatches, editRequests } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { generateBatch } from './gemini.js';
import { generateHeadshotWithVirtualOutfit } from './virtualWardrobeService.js';
import { uploadGeneratedHeadshot } from './storage.js';
import sharp from 'sharp';

// Redis connection with BullMQ-compatible settings
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create queues
export const headshotQueue = new Queue('headshot-generation', {
  connection: redis,
});

export const editRequestQueue = new Queue('edit-requests', {
  connection: redis,
});

// Enqueue generation job after payment
export async function queueGenerationJob(batchId: number): Promise<void> {
  await headshotQueue.add(
    'generate',
    { batchId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    }
  );
}

// Enqueue edit request job
export async function queueEditRequestJob(editRequestId: number): Promise<void> {
  await editRequestQueue.add(
    'process-edit',
    { editRequestId },
    {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 30000, // 30 seconds
      },
    }
  );
}

// Worker to process generation
export const worker = new Worker(
  'headshot-generation',
  async (job) => {
    const { batchId } = job.data;

    console.log(`Processing batch ${batchId}`);

    try {
      // Update status
      await db
        .update(headshotBatches)
        .set({ status: 'processing' })
        .where(eq(headshotBatches.id, batchId));

      // Get batch details
      const [batch] = await db
        .select()
        .from(headshotBatches)
        .where(eq(headshotBatches.id, batchId));

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Generate headshots
      const result = await generateBatch(batch);

      // Update completion time
      const processingTime = Math.round(
        (new Date().getTime() - batch.createdAt.getTime()) / 60000
      );

      await db
        .update(headshotBatches)
        .set({
          status: 'completed',
          completedAt: new Date(),
          processingTimeMinutes: processingTime,
          generatedHeadshots: result.generatedHeadshots,
          headshotsByTemplate: result.headshotsByTemplate,
          headshotCount: result.totalCount,
        })
        .where(eq(headshotBatches.id, batchId));

      console.log(`Batch ${batchId} completed`);

      // TODO: Send completion email
    } catch (error) {
      console.error(`Batch ${batchId} failed:`, error);

      // Update status to failed
      await db
        .update(headshotBatches)
        .set({ status: 'failed' })
        .where(eq(headshotBatches.id, batchId));

      throw error;
    }
  },
  { connection: redis }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

// Worker to process edit requests
export const editWorker = new Worker(
  'edit-requests',
  async (job) => {
    const { editRequestId } = job.data;

    console.log(`Processing edit request ${editRequestId}`);
    const startTime = Date.now();

    try {
      // Get edit request details
      const [editRequest] = await db
        .select()
        .from(editRequests)
        .where(eq(editRequests.id, editRequestId));

      if (!editRequest) {
        throw new Error(`Edit request ${editRequestId} not found`);
      }

      // Update status to processing
      await db
        .update(editRequests)
        .set({ status: 'processing' })
        .where(eq(editRequests.id, editRequestId));

      // Get batch details for userId
      const [batch] = await db
        .select()
        .from(headshotBatches)
        .where(eq(headshotBatches.id, editRequest.batchId));

      if (!batch) {
        throw new Error(`Batch ${editRequest.batchId} not found`);
      }

      let resultBuffer: Buffer;
      let thumbnailBuffer: Buffer;

      // Process based on edit type
      if (editRequest.editType === 'outfit_change') {
        if (!editRequest.outfitId) {
          throw new Error('outfitId is required for outfit_change edit type');
        }

        console.log(`🎭 Applying outfit ${editRequest.outfitId} to headshot ${editRequest.headshotId}`);

        // Generate new headshot with virtual outfit
        resultBuffer = await generateHeadshotWithVirtualOutfit(
          editRequest.headshotId,
          editRequest.outfitId,
          {
            colorVariant: editRequest.colorVariant || undefined,
          }
        );

        // Generate thumbnail
        thumbnailBuffer = await sharp(resultBuffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({
            quality: 85,
          })
          .toBuffer();

      } else {
        // For future edit types (background_change, regenerate, etc.)
        throw new Error(`Edit type ${editRequest.editType} not yet implemented`);
      }

      // Upload full-size edited headshot to R2
      const { url: resultUrl } = await uploadGeneratedHeadshot(
        batch.userId,
        batch.id,
        resultBuffer,
        {
          template: 'edit',
          index: editRequest.id,
          folder: 'edited', // Store in separate folder
        }
      );

      // Upload thumbnail
      const { url: thumbnailUrl } = await uploadGeneratedHeadshot(
        batch.userId,
        batch.id,
        thumbnailBuffer,
        {
          template: 'edit-thumb',
          index: editRequest.id,
          folder: 'edited',
        }
      );

      // Calculate processing time
      const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000);

      // Update edit request with results
      await db
        .update(editRequests)
        .set({
          status: 'completed',
          resultUrl,
          thumbnailUrl,
          completedAt: new Date(),
          processingTimeSeconds,
        })
        .where(eq(editRequests.id, editRequestId));

      console.log(`✓ Edit request ${editRequestId} completed in ${processingTimeSeconds}s`);

      // TODO: Send notification to user

    } catch (error) {
      console.error(`Edit request ${editRequestId} failed:`, error);

      // Update status to failed with error message
      await db
        .update(editRequests)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(editRequests.id, editRequestId));

      throw error;
    }
  },
  { connection: redis }
);

editWorker.on('completed', (job) => {
  console.log(`Edit request job ${job.id} completed`);
});

editWorker.on('failed', (job, err) => {
  console.error(`Edit request job ${job?.id} failed:`, err);
});
