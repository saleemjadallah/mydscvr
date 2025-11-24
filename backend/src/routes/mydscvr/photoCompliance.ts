import { Router, Request, Response } from 'express';
import { db } from '../../db/index.js';
import { photoCompliance } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getPhotoRequirements } from '../../lib/perplexity.js';
import { generatePhotoComplianceReportPDF } from '../../lib/pdfGenerator.js';
import { analyzeMultiplePhotos } from '../../lib/geminiVision.js';

const router = Router();

// Extend Request type to include user
interface AuthedRequest extends Request {
  user?: any;
}

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// POST /api/photo-compliance/upload
// Upload photos for compliance check
router.post('/upload', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { visaType, photoUrls } = req.body;

    if (!visaType || !photoUrls || !Array.isArray(photoUrls)) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // TODO: Implement photo upload to R2
    // For now, just return success
    res.json({
      success: true,
      data: {
        visaType,
        photoUrls,
      },
    });
  } catch (error) {
    console.error('[Photo Compliance] Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photos' });
  }
});

// POST /api/photo-compliance/checkout
// Create Stripe checkout session for photo compliance check
router.post('/checkout', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { visaType, photoUrls } = req.body;
    const userId = req.user?.id;

    if (!visaType || !photoUrls || !Array.isArray(photoUrls)) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Pricing based on visa type (in fils - AED cents)
    const pricing: { [key: string]: number } = {
      uae_visa: 2000, // AED 20
      schengen_visa: 2500, // AED 25
      us_visa: 2500, // AED 25
      passport_photo: 2000, // AED 20
      saudi_visa: 2000, // AED 20
    };

    const price = pricing[visaType] || 2000;

    // TODO: Implement Stripe checkout session creation
    // For now, create compliance record with processing status
    const [compliance] = await db
      .insert(photoCompliance)
      .values({
        userId: userId!,
        visaType,
        uploadedPhotos: photoUrls,
        status: 'processing',
        amountPaid: price,
      })
      .returning();

    res.json({
      success: true,
      data: {
        complianceId: compliance.id,
        checkoutUrl: '/processing', // Placeholder
      },
    });
  } catch (error) {
    console.error('[Photo Compliance] Checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
});

// POST /api/photo-compliance/:id/check
// Trigger compliance check for photos (called after payment)
router.post('/:id/check', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const complianceId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [compliance] = await db
      .select()
      .from(photoCompliance)
      .where(eq(photoCompliance.id, complianceId))
      .limit(1);

    if (!compliance) {
      return res.status(404).json({ success: false, error: 'Compliance check not found' });
    }

    if (compliance.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const startTime = Date.now();

    console.log('[Photo Compliance] Fetching requirements with Perplexity AI...');

    // Get current photo requirements using Perplexity
    const requirements = await getPhotoRequirements(compliance.visaType);

    console.log('[Photo Compliance] Analyzing photos with Gemini Vision...');

    // Analyze photos using Gemini Vision API
    const uploadedPhotos = (compliance.uploadedPhotos as string[]) || [];
    const analysisResults = await analyzeMultiplePhotos(uploadedPhotos, compliance.visaType, {
      dimensions: requirements.dimensions,
      background: requirements.background,
      faceSize: requirements.faceSize,
    });

    // Map results to expected format
    const photoResults = uploadedPhotos.map((photoUrl, index) => ({
      photoUrl,
      compliant: analysisResults[index].compliant,
      issues: analysisResults[index].issues,
      score: analysisResults[index].score,
    }));

    const processingTime = Math.round((Date.now() - startTime) / 1000); // in seconds

    // Generate PDF compliance report
    console.log('[Photo Compliance] Generating PDF report...');
    await generatePhotoComplianceReportPDF(complianceId, userId!, {
      visaType: compliance.visaType,
      results: photoResults,
      specifications: {
        requiredDimensions: requirements.dimensions,
        requiredBackground: requirements.background,
        requiredFaceSize: requirements.faceSize,
      },
    });

    // Update database with results
    await db
      .update(photoCompliance)
      .set({
        status: 'completed',
        results: photoResults,
        specifications: {
          requiredDimensions: requirements.dimensions,
          requiredBackground: requirements.background,
          requiredFaceSize: requirements.faceSize,
        },
        completedAt: new Date(),
        processingTimeSeconds: processingTime,
      })
      .where(eq(photoCompliance.id, complianceId));

    console.log(`[Photo Compliance] Check completed in ${processingTime} seconds`);

    res.json({
      success: true,
      data: {
        message: 'Compliance check completed',
        results: photoResults,
        requirements: requirements,
      },
    });
  } catch (error) {
    console.error('[Photo Compliance] Check error:', error);

    // Update status to failed
    const complianceId = parseInt(req.params.id);
    await db
      .update(photoCompliance)
      .set({ status: 'failed' })
      .where(eq(photoCompliance.id, complianceId));

    res.status(500).json({ success: false, error: 'Failed to check compliance' });
  }
});

// GET /api/photo-compliance/requirements/:visaType
// Get photo requirements for a specific visa type (helper endpoint)
router.get('/requirements/:visaType', requireAuth, async (req: Request, res: Response) => {
  try {
    const { visaType } = req.params;

    console.log(`[Photo Compliance] Fetching requirements for ${visaType}`);

    const requirements = await getPhotoRequirements(visaType);

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error('[Photo Compliance] Requirements lookup error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch requirements' });
  }
});

// GET /api/photo-compliance/:id
// Get compliance check results
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const complianceId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [compliance] = await db
      .select()
      .from(photoCompliance)
      .where(eq(photoCompliance.id, complianceId))
      .limit(1);

    if (!compliance) {
      return res.status(404).json({ success: false, error: 'Compliance check not found' });
    }

    if (compliance.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: compliance,
    });
  } catch (error) {
    console.error('[Photo Compliance] Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get compliance check' });
  }
});

// GET /api/photo-compliance/:id/download
// Download corrected photos
router.get('/:id/download', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const complianceId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [compliance] = await db
      .select()
      .from(photoCompliance)
      .where(eq(photoCompliance.id, complianceId))
      .limit(1);

    if (!compliance) {
      return res.status(404).json({ success: false, error: 'Compliance check not found' });
    }

    if (compliance.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!compliance.results) {
      return res.status(404).json({ success: false, error: 'Results not available yet' });
    }

    // TODO: Generate signed download URLs for corrected photos
    res.json({
      success: true,
      data: { results: compliance.results },
    });
  } catch (error) {
    console.error('[Photo Compliance] Download error:', error);
    res.status(500).json({ success: false, error: 'Failed to download photos' });
  }
});

export default router;
// @ts-nocheck
