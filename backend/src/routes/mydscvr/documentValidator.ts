import { Router, Request, Response } from 'express';
import { db } from '../../db/index.js';
import { documentValidations } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getDocumentRequirements, analyzeDocumentCompliance } from '../../lib/perplexity.js';
import { generateValidationReportPDF } from '../../lib/pdfGenerator.js';
import { extractDocumentText, analyzeDocumentImage } from '../../lib/geminiVision.js';

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

// POST /api/document-validator/upload
// Upload document for validation
router.post('/upload', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // TODO: Implement document upload to R2
    // For now, just return success
    res.json({
      success: true,
      data: {
        documentType,
        documentUrl,
      },
    });
  } catch (error) {
    console.error('[Document Validator] Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

// POST /api/document-validator/checkout
// Create Stripe checkout session for document validation
router.post('/checkout', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { documentType, documentUrl } = req.body;
    const userId = req.user?.id;

    if (!documentType || !documentUrl) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // TODO: Implement Stripe checkout session creation
    // For now, create validation record with processing status
    const [validation] = await db
      .insert(documentValidations)
      .values({
        userId: userId!,
        documentType,
        uploadedDocumentUrl: documentUrl,
        status: 'processing',
        amountPaid: 4000, // AED 40 in fils
      })
      .returning();

    res.json({
      success: true,
      data: {
        validationId: validation.id,
        checkoutUrl: '/processing', // Placeholder
      },
    });
  } catch (error) {
    console.error('[Document Validator] Checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
});

// POST /api/document-validator/:id/validate
// Trigger validation process for a document (called after payment)
router.post('/:id/validate', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const validationId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { targetCountry } = req.body;

    const [validation] = await db
      .select()
      .from(documentValidations)
      .where(eq(documentValidations.id, validationId))
      .limit(1);

    if (!validation) {
      return res.status(404).json({ success: false, error: 'Validation not found' });
    }

    if (validation.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const startTime = Date.now();

    console.log('[Document Validator] Extracting text with Gemini Vision...');

    // Step 1: Extract text from document image using Gemini Vision
    const extractedText = await extractDocumentText(validation.uploadedDocumentUrl);

    console.log('[Document Validator] Analyzing document image...');

    // Step 2: Analyze document image for visual compliance
    const imageAnalysis = await analyzeDocumentImage(validation.uploadedDocumentUrl);

    console.log('[Document Validator] Fetching requirements with Perplexity AI...');

    // Step 3: Get document requirements for the target country
    const requirements = await getDocumentRequirements(
      validation.documentType,
      targetCountry || 'UAE'
    );

    console.log('[Document Validator] Analyzing document compliance...');

    // Step 4: Analyze document compliance using Perplexity
    const complianceAnalysis = await analyzeDocumentCompliance(
      validation.documentType,
      extractedText,
      imageAnalysis
    );

    const processingTime = Math.round((Date.now() - startTime) / 1000); // in seconds

    // Step 3: Generate PDF report
    console.log('[Document Validator] Generating PDF report...');
    const pdfUrl = await generateValidationReportPDF(validationId, userId!, {
      documentType: validation.documentType,
      score: complianceAnalysis.score,
      issues: complianceAnalysis.issues.map((issue) => ({
        severity: issue.severity,
        category: issue.category,
        description: issue.description,
        location: issue.recommendation,
      })),
      validationReport: complianceAnalysis.validationReport,
      createdAt: new Date(),
    });

    // Step 4: Update database with results
    await db
      .update(documentValidations)
      .set({
        status: 'completed',
        score: complianceAnalysis.score,
        issues: complianceAnalysis.issues.map((issue) => ({
          severity: issue.severity,
          category: issue.category,
          description: issue.description,
          location: issue.recommendation,
        })),
        validationReport: complianceAnalysis.validationReport,
        reportPdfUrl: pdfUrl,
        completedAt: new Date(),
        processingTimeSeconds: processingTime,
      })
      .where(eq(documentValidations.id, validationId));

    console.log(`[Document Validator] Validation completed with score: ${complianceAnalysis.score}`);

    res.json({
      success: true,
      data: {
        message: 'Validation completed',
        score: complianceAnalysis.score,
        issues: complianceAnalysis.issues,
        validationReport: complianceAnalysis.validationReport,
        requirements: requirements,
      },
    });
  } catch (error) {
    console.error('[Document Validator] Validate error:', error);

    // Update status to failed
    const validationId = parseInt(req.params.id);
    await db
      .update(documentValidations)
      .set({ status: 'failed' })
      .where(eq(documentValidations.id, validationId));

    res.status(500).json({ success: false, error: 'Failed to validate document' });
  }
});

// GET /api/document-validator/requirements/:documentType
// Get requirements for a specific document type (helper endpoint)
router.get('/requirements/:documentType', requireAuth, async (req: Request, res: Response) => {
  try {
    const { documentType } = req.params;
    const targetCountry = (req.query.country as string) || 'UAE';

    console.log(`[Document Validator] Fetching requirements for ${documentType} -> ${targetCountry}`);

    const requirements = await getDocumentRequirements(documentType, targetCountry);

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error('[Document Validator] Requirements lookup error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch requirements' });
  }
});

// GET /api/document-validator/:id
// Get validation results
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const validationId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [validation] = await db
      .select()
      .from(documentValidations)
      .where(eq(documentValidations.id, validationId))
      .limit(1);

    if (!validation) {
      return res.status(404).json({ success: false, error: 'Validation not found' });
    }

    if (validation.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('[Document Validator] Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get validation' });
  }
});

// GET /api/document-validator/:id/download
// Download validation report PDF
router.get('/:id/download', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const validationId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [validation] = await db
      .select()
      .from(documentValidations)
      .where(eq(documentValidations.id, validationId))
      .limit(1);

    if (!validation) {
      return res.status(404).json({ success: false, error: 'Validation not found' });
    }

    if (validation.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!validation.reportPdfUrl) {
      return res.status(404).json({ success: false, error: 'Report not available yet' });
    }

    // TODO: Generate signed download URL or redirect to R2 URL
    res.json({
      success: true,
      data: { downloadUrl: validation.reportPdfUrl },
    });
  } catch (error) {
    console.error('[Document Validator] Download error:', error);
    res.status(500).json({ success: false, error: 'Failed to download report' });
  }
});

export default router;
// @ts-nocheck
