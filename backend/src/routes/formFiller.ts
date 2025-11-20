/**
 * Form Filler API Routes
 *
 * Complete API for the AI Form Filler feature:
 * - Extract form fields from uploaded PDFs
 * - Map extracted fields to user profile
 * - Validate form data (3-tier validation)
 * - Fill PDF forms programmatically
 * - Download filled forms
 * - Manage form history
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { extractFormFields, detectDocumentType } from '../lib/documentRouter.js';
import { matchExtractedFields, getValueFromProfile } from '../lib/fieldMatcher.js';
import { validateFormData } from '../lib/rulesEngine.js';
import {
  shouldUseAIValidation,
  performAIValidation,
} from '../lib/aiValidator.js';
import {
  fillPDFForm,
  extractPDFFieldNames,
  validatePDFForm,
  getPDFMetadata,
} from '../lib/pdfFormFiller.js';
import {
  createProcessingResult,
  generateReviewMessage,
  getRecommendedActions,
  calculateProcessingStats,
} from '../lib/reviewRouter.js';
import { validateUserProfile } from '../lib/validationSchemas.js';
import { db } from '../db/index.js';
import { filledForms, userProfiles, type FilledForm } from '../db/schema-formfiller.js';
import { eq, and, desc } from 'drizzle-orm';
import { uploadToR2, getSignedDownloadUrl } from '../lib/storage.js';

const router = express.Router();

// Configure multer for PDF upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }
  next();
};

const DRAFT_URL_TTL_SECONDS = 60 * 60; // 1 hour

const buildDraftSummary = (draft: FilledForm) => ({
  id: draft.id,
  fileName: draft.formName,
  updatedAt: draft.updatedAt,
  createdAt: draft.createdAt,
  completionPercentage: draft.completionPercentage,
  country: draft.country,
  visaType: draft.visaType,
  hasPdf: Boolean(draft.originalPdfUrl || draft.outputUrl),
  totalFields: draft.totalFields,
  filledFields: draft.filledFields,
  status: draft.status,
});

const buildDraftDetailResponse = async (draft: FilledForm) => {
  let signedPdfUrl: string | null = null;
  if (draft.originalPdfUrl) {
    signedPdfUrl = await getSignedDownloadUrl(draft.originalPdfUrl, DRAFT_URL_TTL_SECONDS);
  } else if (draft.outputUrl) {
    signedPdfUrl = await getSignedDownloadUrl(draft.outputUrl, DRAFT_URL_TTL_SECONDS);
  }

  return {
    formId: draft.id,
    filledData: draft.filledData,
    pdfUrl: signedPdfUrl,
    fileName: draft.formName,
    updatedAt: draft.updatedAt,
    hasPdf: Boolean(draft.originalPdfUrl || draft.outputUrl),
    status: draft.status,
  };
};

/**
 * POST /api/form-filler/extract
 * Extract form fields from an uploaded PDF
 */
router.post('/extract', requireAuth, upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded',
      });
    }

    console.log(`[Form Filler API] Extracting fields from ${req.file.originalname}...`);

    const pdfBuffer = req.file.buffer;

    // Validate PDF
    const validation = await validatePDFForm(pdfBuffer);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PDF form',
        details: validation.errors,
      });
    }

    // Get PDF metadata
    const metadata = await getPDFMetadata(pdfBuffer);

    // Detect document type
    const documentType = await detectDocumentType(pdfBuffer);

    // Extract fields
    const extractionResult = await extractFormFields(pdfBuffer, documentType);

    res.json({
      success: true,
      data: {
        documentType,
        metadata,
        extraction: {
          fields: extractionResult.fields,
          queryResults: extractionResult.queryResults || [],
          tables: extractionResult.tables || [],
          selectionMarks: extractionResult.selectionMarks || [],
          barcodes: extractionResult.barcodes || [],
          markdownOutput: extractionResult.markdownOutput || '',
          method: extractionResult.extractionMethod,
          confidence: extractionResult.overallConfidence,
          pageCount: extractionResult.pageCount,
          processingTime: extractionResult.processingTime,
          smartAnalysis: extractionResult.smartAnalysis,
        },
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract form fields',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/form-filler/map
 * Map extracted fields to user profile data
 */
router.post('/map', requireAuth, async (req: Request, res: Response) => {
  try {
    const { extractedFields } = req.body;

    if (!extractedFields || !Array.isArray(extractedFields)) {
      return res.status(400).json({
        success: false,
        error: 'extractedFields array is required',
      });
    }

    // Get user profile
    const userId = (req.user as any).id;
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found. Please complete your profile first.',
      });
    }

    const profile = profiles[0];

    // Match fields
    const matchResults = matchExtractedFields(extractedFields);

    // Populate matched fields with profile data
    const populatedFields = matchResults.map((match) => {
      let value = match.extractedField.value;

      // If we have a canonical match, get value from profile
      if (match.canonicalPath) {
        const profileValue = getValueFromProfile(profile, match.canonicalPath);
        if (profileValue !== undefined) {
          value = profileValue;
        }
      }

      return {
        ...match,
        populatedValue: value,
      };
    });

    // Calculate statistics
    const totalFields = matchResults.length;
    const matchedFields = matchResults.filter((m) => m.canonicalPath !== null).length;
    const autoPopulatedFields = populatedFields.filter(
      (f) => f.populatedValue !== f.extractedField.value
    ).length;

    res.json({
      success: true,
      data: {
        populatedFields,
        statistics: {
          totalFields,
          matchedFields,
          autoPopulatedFields,
          matchRate: Math.round((matchedFields / totalFields) * 100),
        },
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Mapping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to map fields',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/form-filler/fill
 * Fill a PDF form with user data
 */
router.post('/fill', requireAuth, upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded',
      });
    }

    const { fieldPopulations, destinationCountry, flatten } = req.body;

    if (!fieldPopulations) {
      return res.status(400).json({
        success: false,
        error: 'fieldPopulations data is required',
      });
    }

    const pdfBuffer = req.file.buffer;
    const parsedFieldPopulations = JSON.parse(fieldPopulations);
    const shouldFlatten = flatten === 'true' || flatten === true;

    console.log(`[Form Filler API] Filling form with ${parsedFieldPopulations.length} fields...`);

    // Fill the PDF
    const fillResult = await fillPDFForm(pdfBuffer, parsedFieldPopulations, {
      flatten: shouldFlatten,
      destinationCountry: destinationCountry || undefined,
    });

    if (!fillResult.success || !fillResult.filledPdfBuffer) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fill PDF form',
        details: fillResult.errors,
      });
    }

    // Upload filled PDF to R2
    const userId = (req.user as any).id;
    const formId = `form_${Date.now()}`;
    const r2Key = `form-fills/${userId}/${formId}/filled.pdf`;

    await uploadToR2(r2Key, fillResult.filledPdfBuffer, 'application/pdf');

    // Save filled form to database
    await db.insert(filledForms).values({
      id: formId,
      userId,
      country: destinationCountry || 'Unknown',
      visaType: 'General',
      formName: req.file.originalname || 'Form',
      filledData: {
        values: {},
        metadata: {
          fields: [],
          fileName: req.file.originalname || 'Form',
          savedAt: new Date().toISOString(),
        },
      },
      totalFields: parsedFieldPopulations.length,
      filledFields: fillResult.populatedFields,
      validFields: fillResult.populatedFields,
      completionPercentage: Math.round((fillResult.populatedFields / parsedFieldPopulations.length) * 100),
      status: 'completed',
      outputUrl: r2Key,
      fieldResults: parsedFieldPopulations,
      overallConfidence: 85, // Calculate from field results
      completedAt: new Date(),
    });

    // Get signed URL for download
    const downloadUrl = await getSignedDownloadUrl(r2Key);

    res.json({
      success: true,
      data: {
        formId,
        downloadUrl,
        statistics: {
          populatedFields: fillResult.populatedFields,
          skippedFields: fillResult.skippedFields,
          processingTime: fillResult.processingTime,
        },
        errors: fillResult.errors.length > 0 ? fillResult.errors : undefined,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Fill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fill form',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/form-filler/:id/validate
 * Run full validation on form data (3-tier system)
 */
router.post('/:id/validate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { formData, extractedFields, destinationCountry, travelDate } = req.body;

    console.log('[Form Filler API] Running validation...');

    // Tier 1: Zod validation
    const zodValidation = validateUserProfile(formData);
    const zodIssues = zodValidation.success
      ? []
      : zodValidation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        severity: 'error' as const,
      }));

    // Tier 2: Rules engine validation
    const rulesResult = await validateFormData(formData, destinationCountry, travelDate);

    // Combine Tier 1 & 2 issues
    const allIssues = [...zodIssues, ...rulesResult.errors, ...rulesResult.warnings];

    // Tier 3: Determine if AI validation needed
    const needsAI = shouldUseAIValidation(
      extractedFields || [],
      formData.overallConfidence || 100,
      allIssues
    );

    let aiValidation;
    if (needsAI) {
      console.log('[Form Filler API] AI validation recommended...');
      aiValidation = await performAIValidation(
        formData,
        extractedFields || [],
        allIssues,
        destinationCountry
      );
    }

    // Create processing result
    const processingResult = createProcessingResult(
      req.params.id,
      extractedFields || [],
      allIssues,
      aiValidation
    );

    // Generate user-friendly messages
    const reviewMessage = generateReviewMessage(processingResult);
    const recommendedActions = getRecommendedActions(processingResult);
    const stats = calculateProcessingStats(processingResult);

    res.json({
      success: true,
      data: {
        validation: {
          isValid: rulesResult.isValid && zodIssues.length === 0,
          overallConfidence: processingResult.overallConfidence,
          status: processingResult.status,
          reviewMessage,
          recommendedActions,
          statistics: stats,
        },
        issues: {
          errors: [...zodIssues, ...rulesResult.errors],
          warnings: rulesResult.warnings,
          infos: rulesResult.infos,
        },
        reviewItems: processingResult.reviewItems,
        aiValidation: aiValidation
          ? {
            used: true,
            confidence: aiValidation.overallConfidence,
            suggestions: aiValidation.suggestions,
            contradictions: aiValidation.contradictions,
          }
          : { used: false },
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/form-filler/:id
 * Get filled form details
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const formId = req.params.id;

    const forms = await db
      .select()
      .from(filledForms)
      .where(eq(filledForms.id, formId))
      .limit(1);

    if (forms.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }

    const form = forms[0];

    // Verify ownership
    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get download URL if form is completed
    let downloadUrl;
    if (form.outputUrl) {
      downloadUrl = await getSignedDownloadUrl(form.outputUrl);
    }

    res.json({
      success: true,
      data: {
        id: form.id,
        status: form.status,
        confidence: form.overallConfidence,
        downloadUrl,
        createdAt: form.createdAt,
        completedAt: form.completedAt,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Get form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve form',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/form-filler/:id/download
 * Download filled PDF
 */
router.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const formId = req.params.id;

    const forms = await db
      .select()
      .from(filledForms)
      .where(eq(filledForms.id, formId))
      .limit(1);

    if (forms.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }

    const form = forms[0];

    // Verify ownership
    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    if (!form.outputUrl) {
      return res.status(404).json({
        success: false,
        error: 'PDF not available',
      });
    }

    // Get signed download URL
    const downloadUrl = await getSignedDownloadUrl(form.outputUrl, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download link',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/form-filler/history
 * Get user's form filling history
 */
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const forms = await db
      .select({
        id: filledForms.id,
        status: filledForms.status,
        confidence: filledForms.overallConfidence,
        createdAt: filledForms.createdAt,
        completedAt: filledForms.completedAt,
      })
      .from(filledForms)
      .where(eq(filledForms.userId, userId))
      .orderBy(filledForms.createdAt)
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        forms,
        pagination: {
          limit,
          offset,
          total: forms.length,
        },
      },
    });
  } catch (error) {
    console.error('[Form Filler API] History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve form history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/form-filler/:id/fields
 * Update specific fields in a filled form
 */
router.put('/:id/fields', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const formId = req.params.id;
    const { fieldUpdates } = req.body;

    if (!fieldUpdates || !Array.isArray(fieldUpdates)) {
      return res.status(400).json({
        success: false,
        error: 'fieldUpdates array is required',
      });
    }

    // Get existing form
    const forms = await db
      .select()
      .from(filledForms)
      .where(eq(filledForms.id, formId))
      .limit(1);

    if (forms.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }

    const form = forms[0];

    // Verify ownership
    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update field values
    const updatedFieldResults = { ...(form.fieldResults || {}) };

    for (const update of fieldUpdates) {
      if (update.fieldId && update.value !== undefined) {
        updatedFieldResults[update.fieldId] = {
          ...updatedFieldResults[update.fieldId],
          value: update.value,
          source: 'manual',
        };
      }
    }

    // Save updates
    await db
      .update(filledForms)
      .set({
        fieldResults: Object.values(updatedFieldResults) as any,
        updatedAt: new Date(),
      })
      .where(eq(filledForms.id, formId));

    res.json({
      success: true,
      data: {
        updatedFields: fieldUpdates.length,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Field update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update fields',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/form-filler/pdf/fields
 * Extract field names from a PDF (for debugging/mapping)
 */
router.post('/pdf/fields', requireAuth, upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded',
      });
    }

    const fieldNames = await extractPDFFieldNames(req.file.buffer);

    res.json({
      success: true,
      data: {
        fields: fieldNames,
        total: fieldNames.length,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Field names extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract field names',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/form-filler/save-draft
 * Save form progress (autosave)
 */
router.post('/save-draft', requireAuth, async (req: Request, res: Response) => {
  let incomingFormId: string | null = null;
  let hadIncomingPdf = false;
  try {
    const {
      formId,
      formData,
      pdfBytes: _pdfBytes,
      fields = [],
      fileName,
      country,
      visaType,
      formName,
    } = req.body;
    incomingFormId = formId || null;
    const userId = (req.user as any).id;

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'Form data is required',
      });
    }

    const hasIncomingPdf = typeof _pdfBytes === 'string' && _pdfBytes.length > 0;
    hadIncomingPdf = hasIncomingPdf;
    if (!formId && !hasIncomingPdf) {
      return res.status(400).json({
        success: false,
        error: 'PDF file is required when creating a new draft',
      });
    }

    const storedValues = formData?.values ?? formData;
    const metadata = {
      ...(formData?.metadata || {}),
      fields: fields?.length ? fields : formData?.metadata?.fields || [],
      fileName: formName || fileName || formData?.metadata?.fileName || 'Draft Form.pdf',
      savedAt: new Date().toISOString(),
    };

    const structuredData = {
      values: storedValues,
      metadata,
    };

    const totalFields =
      (metadata.fields && metadata.fields.length) || Object.keys(storedValues || {}).length || 0;
    const filledFields = Object.values(storedValues || {}).filter(
      (entry: any) => entry?.value && entry.value.trim() !== ''
    ).length;

    const completionPercentage =
      totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    let originalPdfUrl: string | undefined;
    if (hasIncomingPdf) {
      const buffer = Buffer.from(_pdfBytes, 'base64');
      const sanitizedName = (metadata.fileName || 'draft-form.pdf').replace(/[^\w.\-]+/g, '-');
      const r2Key = `form-drafts/${userId}/${Date.now()}-${sanitizedName}`;
      await uploadToR2(r2Key, buffer, 'application/pdf');
      originalPdfUrl = r2Key;
    }

    const now = new Date();
    const baseDraftData = {
      filledData: structuredData,
      totalFields,
      filledFields,
      validFields: filledFields,
      completionPercentage,
      updatedAt: now,
      ...(originalPdfUrl ? { originalPdfUrl } : {}),
    };

    if (formId) {
      const [existingForm] = await db
        .select()
        .from(filledForms)
        .where(and(eq(filledForms.id, formId), eq(filledForms.userId, userId)));

      if (!existingForm) {
        return res.status(404).json({
          success: false,
          error: 'Form not found or access denied',
        });
      }

      await db
        .update(filledForms)
        .set({
          ...baseDraftData,
          status: 'draft',
          completedAt: null,
        })
        .where(eq(filledForms.id, formId));

      const hasPdf = Boolean(originalPdfUrl || existingForm.originalPdfUrl || existingForm.outputUrl);
      return res.json({
        success: true,
        data: {
          formId,
          savedAt: now,
          persisted: true,
          hasPdf,
        },
      });
    } else {
      if (!originalPdfUrl) {
        return res.status(400).json({
          success: false,
          error: 'PDF upload is required for a new draft',
        });
      }

      const [newForm] = await db
        .insert(filledForms)
        .values({
          userId,
          country: country || 'Unknown',
          visaType: visaType || 'Unknown',
          formName: formName || fileName || 'Draft Form',
          ...baseDraftData,
          status: 'draft',
        })
        .returning();

      return res.json({
        success: true,
        data: {
          formId: newForm.id,
          savedAt: now,
          persisted: true,
          hasPdf: true,
        },
      });
    }
  } catch (error) {
    console.error('[Form Filler API] Save draft error:', error);

    if ((error as any)?.code === '42703') {
      return res.json({
        success: true,
        data: {
          formId: incomingFormId,
          savedAt: new Date(),
          persisted: false,
          hasPdf: hadIncomingPdf,
        },
        warning: 'Draft saved locally only (database schema missing columns).',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
    });
  }
});

router.get('/drafts', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    const drafts = await db
      .select()
      .from(filledForms)
      .where(and(eq(filledForms.userId, userId), eq(filledForms.status, 'draft')))
      .orderBy(desc(filledForms.updatedAt));

    res.json({
      success: true,
      data: {
        drafts: drafts.map(buildDraftSummary),
      },
    });
  } catch (error) {
    console.error('[Form Filler API] List drafts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load drafts',
    });
  }
});

router.get('/drafts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const formId = req.params.id;

    const drafts = await db
      .select()
      .from(filledForms)
      .where(and(eq(filledForms.userId, userId), eq(filledForms.id, formId), eq(filledForms.status, 'draft')))
      .limit(1);

    if (!drafts.length) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
      });
    }

    const payload = await buildDraftDetailResponse(drafts[0]);
    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('[Form Filler API] Load draft detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft',
    });
  }
});

router.delete('/drafts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const formId = req.params.id;

    const deleted = await db
      .delete(filledForms)
      .where(and(eq(filledForms.id, formId), eq(filledForms.userId, userId), eq(filledForms.status, 'draft')))
      .returning({
        id: filledForms.id,
      });

    if (!deleted.length) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
      });
    }

    res.json({
      success: true,
      data: {
        formId: deleted[0].id,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Delete draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft',
    });
  }
});

router.get('/draft', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    const drafts = await db
      .select()
      .from(filledForms)
      .where(and(eq(filledForms.userId, userId), eq(filledForms.status, 'draft')))
      .orderBy(desc(filledForms.updatedAt))
      .limit(1);

    if (!drafts.length) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const draft = drafts[0];
    const payload = await buildDraftDetailResponse(draft);
    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('[Form Filler API] Load draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft',
    });
  }
});

router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const formId = req.params.id;
    const { status } = req.body as { status?: string };

    if (!status || !['draft', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value',
      });
    }

    const forms = await db
      .select()
      .from(filledForms)
      .where(and(eq(filledForms.id, formId), eq(filledForms.userId, userId)))
      .limit(1);

    if (!forms.length) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
      });
    }

    const now = new Date();
    const updatePayload: Partial<FilledForm> = {
      status,
      updatedAt: now,
      completedAt: status === 'completed' ? now : null,
    };

    const [updatedForm] = await db
      .update(filledForms)
      .set(updatePayload)
      .where(eq(filledForms.id, formId))
      .returning({
        id: filledForms.id,
        status: filledForms.status,
        completedAt: filledForms.completedAt,
      });

    res.json({
      success: true,
      data: {
        formId: updatedForm.id,
        status: updatedForm.status,
        completedAt: updatedForm.completedAt,
      },
    });
  } catch (error) {
    console.error('[Form Filler API] Update draft status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update draft status',
    });
  }
});

export default router;
