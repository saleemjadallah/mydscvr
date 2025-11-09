import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { db, headshotBatches } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { generateBatch } from './gemini.js';

// Redis connection with BullMQ-compatible settings
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create queue
export const headshotQueue = new Queue('headshot-generation', {
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
