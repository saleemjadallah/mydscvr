// @ts-nocheck

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
import { db, headshotBatches, editRequests, users } from '../db/index.js';
import { getPlan, HEADSHOT_PLANS } from '../lib/plans.js';
import { STYLE_TEMPLATES } from '../lib/templates.js';
import { queueGenerationJob, queueEditRequestJob } from '../lib/queue.js';
import {
  getAvailableOutfits,
  validateOutfitChangeRequest,
  generateOutfitPreview,
  getOutfitById,
} from '../lib/virtualWardrobeService.js';

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

// ============================================================================
// VIRTUAL WARDROBE & EDIT REQUESTS (must be before /:batchId routes)
// ============================================================================

// Get available professional wardrobe outfits
router.get('/wardrobe', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { category, gender, minFormality, premiumOnly } = req.query;

    const filters: any = {};
    if (category) filters.category = category as string;
    if (gender) filters.gender = gender as string;
    if (minFormality) filters.minFormality = parseInt(minFormality as string);
    if (premiumOnly) filters.premiumOnly = premiumOnly === 'true';

    const outfits = getAvailableOutfits(filters);

    return res.json({
      success: true,
      data: {
        outfits,
        total: outfits.length,
        categories: ['business-formal', 'business-casual', 'creative', 'executive', 'industry-specific'],
      },
    });
  } catch (error) {
    console.error('[Wardrobe] Failed to fetch outfits:', error);
    return res.status(500).json({ success: false, error: 'Failed to load wardrobe' });
  }
});

// Get single outfit by ID
router.get('/wardrobe/:outfitId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { outfitId } = req.params;

    const outfit = getOutfitById(outfitId);

    if (!outfit) {
      return res.status(404).json({ success: false, error: 'Outfit not found' });
    }

    return res.json({ success: true, data: outfit });
  } catch (error) {
    console.error('[Wardrobe] Failed to fetch outfit:', error);
    return res.status(500).json({ success: false, error: 'Failed to load outfit' });
  }
});

// Generate quick preview of outfit on headshot (non-destructive, no credits consumed)
router.post('/wardrobe/preview', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { headshotUrl, outfitId, templateId, colorVariant } = req.body;

    if (!headshotUrl || !outfitId) {
      return res.status(400).json({ success: false, error: 'headshotUrl and outfitId are required' });
    }

    // Validate outfit exists
    const outfit = getOutfitById(outfitId);
    if (!outfit) {
      return res.status(404).json({ success: false, error: 'Outfit not found' });
    }

    // Generate preview (smaller, faster)
    const previewBuffer = await generateOutfitPreview(headshotUrl, outfitId, {
      templateId,
      colorVariant,
    });

    // Return as base64 for easy frontend display
    const previewBase64 = previewBuffer.toString('base64');

    return res.json({
      success: true,
      data: {
        preview: `data:image/jpeg;base64,${previewBase64}`,
        outfit: outfit,
      },
    });
  } catch (error) {
    console.error('[Wardrobe] Preview failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    });
  }
});

// Get user's edit credits remaining
router.get('/edit-credits', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    const [user] = await db
      .select({
        editCreditsRemaining: users.editCreditsRemaining,
        totalEditCreditsEarned: users.totalEditCreditsEarned,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        remaining: user.editCreditsRemaining || 0,
        total: user.totalEditCreditsEarned || 0,
      },
    });
  } catch (error) {
    console.error('[Edit Credits] Failed to fetch:', error);
    return res.status(500).json({ success: false, error: 'Failed to load edit credits' });
  }
});

// ============================================================================
// BATCH-SPECIFIC ROUTES (with :batchId parameter)
// ============================================================================

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

// ============================================================================
// EDIT REQUESTS (outfit changes, regenerations, etc.)
// ============================================================================

// Request outfit change on a headshot (costs 2 credits)
router.post('/:batchId/edit', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);

    const { headshotId, outfitId, colorVariant } = req.body;

    if (!headshotId || !outfitId) {
      return res.status(400).json({ success: false, error: 'headshotId and outfitId are required' });
    }

    // Verify batch ownership
    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Check if user's plan allows wardrobe changes
    const planConfig = getPlan(batch.plan);
    if (!planConfig.canChangeOutfits) {
      return res.status(403).json({
        success: false,
        error: 'Wardrobe changes are only available for Professional and Executive plans. Please upgrade your plan.',
      });
    }

    // Validate outfit
    const validation = validateOutfitChangeRequest(outfitId);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    // Check user has enough edit credits (outfit changes cost 2 credits)
    const OUTFIT_CHANGE_COST = 2;

    const [user] = await db
      .select({
        editCreditsRemaining: users.editCreditsRemaining,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || (user.editCreditsRemaining || 0) < OUTFIT_CHANGE_COST) {
      return res.status(403).json({
        success: false,
        error: `Insufficient edit credits. Outfit changes require ${OUTFIT_CHANGE_COST} credits. You have ${user?.editCreditsRemaining || 0} remaining.`,
      });
    }

    // Create edit request
    const [editRequest] = await db
      .insert(editRequests)
      .values({
        batchId,
        userId,
        headshotId,
        editType: 'outfit_change',
        outfitId,
        colorVariant: colorVariant || null,
        costInCredits: OUTFIT_CHANGE_COST,
        status: 'pending',
      })
      .returning();

    // Deduct edit credits immediately
    await db
      .update(users)
      .set({
        editCreditsRemaining: (user.editCreditsRemaining || 0) - OUTFIT_CHANGE_COST,
      })
      .where(eq(users.id, userId));

    // Queue edit job for processing
    await queueEditRequestJob(editRequest.id);

    return res.json({
      success: true,
      data: {
        editRequest,
        creditsRemaining: (user.editCreditsRemaining || 0) - OUTFIT_CHANGE_COST,
      },
    });
  } catch (error) {
    console.error('[Edit Request] Failed to create:', error);
    return res.status(500).json({ success: false, error: 'Failed to create edit request' });
  }
});

// Get edit requests for a batch
router.get('/:batchId/edits', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);

    // Verify batch ownership
    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Fetch all edit requests for this batch
    const edits = await db
      .select()
      .from(editRequests)
      .where(eq(editRequests.batchId, batchId))
      .orderBy(desc(editRequests.createdAt));

    // Enrich edit requests with outfit details
    const enrichedEdits = edits.map((edit) => {
      let outfitDetails = null;
      if (edit.outfitId) {
        outfitDetails = getOutfitById(edit.outfitId);
      }

      return {
        ...edit,
        outfitDetails,
      };
    });

    return res.json({ success: true, data: enrichedEdits });
  } catch (error) {
    console.error('[Edit Requests] Failed to fetch:', error);
    return res.status(500).json({ success: false, error: 'Failed to load edit requests' });
  }
});

// Get single edit request by ID
router.get('/:batchId/edits/:editId', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const batchId = Number(req.params.batchId);
    const editId = Number(req.params.editId);

    // Verify batch ownership
    const [batch] = await db
      .select()
      .from(headshotBatches)
      .where(and(eq(headshotBatches.id, batchId), eq(headshotBatches.userId, userId)));

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Fetch edit request
    const [edit] = await db
      .select()
      .from(editRequests)
      .where(and(eq(editRequests.id, editId), eq(editRequests.batchId, batchId)));

    if (!edit) {
      return res.status(404).json({ success: false, error: 'Edit request not found' });
    }

    // Enrich with outfit details
    let outfitDetails = null;
    if (edit.outfitId) {
      outfitDetails = getOutfitById(edit.outfitId);
    }

    return res.json({
      success: true,
      data: {
        ...edit,
        outfitDetails,
      },
    });
  } catch (error) {
    console.error('[Edit Request] Failed to fetch:', error);
    return res.status(500).json({ success: false, error: 'Failed to load edit request' });
  }
});

export default router;
// @ts-nocheck
