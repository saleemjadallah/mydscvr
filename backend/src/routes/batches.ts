import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import archiver from 'archiver';
import { requireAuth } from '../lib/auth.js';
import {
  uploadBuffer,
  deleteBatchFiles,
  downloadFileByUrl,
  optimizeUploadedImage,
} from '../lib/storage.js';
import { db, headshotBatches } from '../db/index.js';
import { getPlan, HEADSHOT_PLANS } from '../lib/plans.js';
import { STYLE_TEMPLATES } from '../lib/templates.js';
import { queueGenerationJob } from '../lib/queue.js';

const router = Router();

interface AuthedRequest extends Request {
  user?: any;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 20,
    fileSize: 15 * 1024 * 1024, // 15MB per photo
  },
});

const templateIds = Object.keys(STYLE_TEMPLATES);

const createBatchSchema = z.object({
  uploadedPhotos: z.array(z.string().url()).min(1).max(50),
  plan: z.enum(['basic', 'professional', 'executive']),
  styleTemplates: z.array(z.string()).min(1).max(templateIds.length),
  backgrounds: z.array(z.string()).optional(),
  outfits: z.array(z.string()).optional(),
  stripeSessionId: z.string().optional(),
  amountPaid: z.number().optional(),
});

function getUserId(req: AuthedRequest): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User not found in session');
  }
  return userId;
}

router.post(
  '/upload',
  requireAuth,
  upload.array('photos', 20),
  async (req: AuthedRequest, res: Response) => {
    try {
      const files = (req.files || []) as Express.Multer.File[];
      if (!files.length) {
        return res.status(400).json({ success: false, error: 'No photos uploaded' });
      }

      const userId = getUserId(req);
      const uploadPrefix = `session-${Date.now()}-${crypto.randomUUID()}`;

      const uploadedUrls: string[] = [];

      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        if (!file.mimetype.startsWith('image/')) {
          return res.status(400).json({ success: false, error: 'Only image uploads are allowed' });
        }

        // Optimize image using the centralized function
        const processedBuffer = await optimizeUploadedImage(file.buffer);

        const key = `uploads/${userId}/${uploadPrefix}/${index}.jpg`;
        const url = await uploadBuffer(processedBuffer, key, 'image/jpeg');
        uploadedUrls.push(url);
      }

      return res.json({ success: true, data: uploadedUrls });
    } catch (error) {
      console.error('[Batches] Upload failed:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload photos' });
    }
  }
);

router.post('/create', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const payload = createBatchSchema.parse(req.body);

    payload.styleTemplates.forEach((templateId) => {
      if (!STYLE_TEMPLATES[templateId]) {
        throw new Error(`Invalid template: ${templateId}`);
      }
    });

    const planConfig = getPlan(payload.plan);
    if (!planConfig) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
    }

    const userId = getUserId(req);

    const [batch] = await db
      .insert(headshotBatches)
      .values({
        userId,
        status: 'queued',
        uploadedPhotos: payload.uploadedPhotos,
        photoCount: payload.uploadedPhotos.length,
        plan: payload.plan,
        styleTemplates: payload.styleTemplates,
        backgrounds: payload.backgrounds ?? [],
        outfits: payload.outfits ?? [],
        amountPaid: payload.amountPaid ?? planConfig.price,
        stripePaymentId: payload.stripeSessionId ?? null,
      })
      .returning();

    await queueGenerationJob(batch.id);

    return res.json({ success: true, data: batch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.issues[0]?.message ?? 'Invalid request' });
    }
    console.error('[Batches] Create failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to create batch' });
  }
});

router.get('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batches = await db
      .select()
      .from(headshotBatches)
      .where(eq(headshotBatches.userId, userId))
      .orderBy(desc(headshotBatches.createdAt));

    return res.json({ success: true, data: batches });
  } catch (error) {
    console.error('[Batches] List failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to load batches' });
  }
});

router.get('/:batchId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);

    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    return res.json({ success: true, data: batch });
  } catch (error) {
    console.error('[Batches] Fetch failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to load batch' });
  }
});

router.get('/:batchId/status', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);

    const [batch] = await db
      .select({
        id: headshotBatches.id,
        status: headshotBatches.status,
        headshotCount: headshotBatches.headshotCount,
        plan: headshotBatches.plan,
      })
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const planConfig = HEADSHOT_PLANS[batch.plan as keyof typeof HEADSHOT_PLANS];
    const expectedHeadshots = planConfig?.headshots ?? 40;
    const generated = batch.headshotCount ?? 0;
    let progress = Math.round((generated / expectedHeadshots) * 100);

    if (batch.status === 'completed') {
      progress = 100;
    } else if (batch.status === 'failed') {
      progress = Math.max(progress, 10);
    } else if (batch.status === 'queued') {
      progress = Math.max(progress, 5);
    } else {
      progress = Math.max(progress, 15);
    }

    progress = Math.min(progress, batch.status === 'completed' ? 100 : 95);

    return res.json({
      success: true,
      data: {
        status: batch.status,
        progress,
      },
    });
  } catch (error) {
    console.error('[Batches] Status failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to load batch status' });
  }
});

router.delete('/:batchId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);

    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    await deleteBatchFiles(userId, batchId);

    await db.delete(headshotBatches).where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[Batches] Delete failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete batch' });
  }
});

// Download single headshot by URL
router.get('/:batchId/download/:headshotId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);
    const headshotId = req.params.headshotId;

    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Find the headshot in the batch
    const headshot = batch.generatedHeadshots?.find((h: any) => h.id === headshotId);

    if (!headshot) {
      return res.status(404).json({ success: false, error: 'Headshot not found' });
    }

    // Download from R2
    const imageBuffer = await downloadFileByUrl(headshot.url);

    // Set headers for download
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="headshot-${headshotId}.jpg"`);
    res.setHeader('Content-Length', imageBuffer.length);

    return res.send(imageBuffer);
  } catch (error) {
    console.error('[Batches] Download failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to download headshot' });
  }
});

// Download all headshots as ZIP
router.get('/:batchId/download-all', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);

    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    if (!batch.generatedHeadshots || batch.generatedHeadshots.length === 0) {
      return res.status(404).json({ success: false, error: 'No headshots available for download' });
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 6 }, // Compression level (0-9)
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="headshots-batch-${batchId}.zip"`);

    // Pipe archive to response
    archive.pipe(res);

    // Download and add each headshot to the archive
    let downloadCount = 0;
    for (const headshot of batch.generatedHeadshots as any[]) {
      try {
        const imageBuffer = await downloadFileByUrl(headshot.url);
        const filename = `${headshot.template || 'headshot'}-${headshot.id}.jpg`;
        archive.append(imageBuffer, { name: filename });
        downloadCount++;
      } catch (error) {
        console.error(`[Batches] Failed to download ${headshot.url}:`, error);
        // Continue with other files
      }
    }

    if (downloadCount === 0) {
      return res.status(500).json({ success: false, error: 'Failed to download any headshots' });
    }

    // Finalize the archive
    await archive.finalize();

    console.log(`[Batches] Downloaded ${downloadCount} headshots as ZIP for batch ${batchId}`);
  } catch (error) {
    console.error('[Batches] Download all failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to create download archive' });
  }
});

export default router;
