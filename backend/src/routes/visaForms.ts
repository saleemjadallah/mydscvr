/**
 * Visa Forms Routes - Uses Perplexity AI to find official visa forms for any country
 */

import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { extractFormFields, type DocumentType } from '../lib/documentRouter.js';
import { extractPDFFormFields, generateFieldLabel, correlateFields } from '../lib/pdfFieldExtractor.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Initialize Perplexity AI client
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
});

const FORM_CACHE_TTL_SECONDS = parseInt(process.env.FORM_CACHE_TTL_SECONDS || `${7 * 24 * 60 * 60}`, 10); // default 7 days

const FORM_RESEARCH_PROMPT = `You are a visa application expert. Your job is to find the OFFICIAL visa application forms for a specific country and visa type.

You MUST respond ONLY with valid JSON matching this exact structure (no markdown, no explanation, just JSON):
{
  "forms": [
    {
      "name": "string - exact official name of the form (e.g., 'DS-160', 'IMM 5257')",
      "description": "string - brief description of what this form is for",
      "officialUrl": "string - OFFICIAL government website URL to access/download this form",
      "source": "string - official government department or agency name",
      "formType": "string - 'online' | 'pdf' | 'both'",
      "instructions": "string - brief key instructions for this form (optional)"
    }
  ],
  "additionalResources": [
    {
      "title": "string - resource title",
      "url": "string - official URL",
      "description": "string - what this resource helps with"
    }
  ],
  "processingNotes": "string - important notes about form submission for this country"
}

CRITICAL REQUIREMENTS:
- ONLY provide OFFICIAL government sources (no third-party websites)
- Include the EXACT official form names/codes
- Provide DIRECT links to the official application portals or PDF downloads
- Include ALL required forms for the visa type (main application + supplementary forms)
- Verify URLs are current and working (use your web search capability)
- Include any mandatory supporting documents that need to be filled`;

/**
 * GET /api/visadocs/forms/search
 * Search for visa forms for any country using Perplexity AI
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { country, visaType, purpose, nationality } = req.query;

    if (!country) {
      return res.status(400).json({ success: false, error: 'Country is required' });
    }

    console.log(`[VisaForms] Searching forms for: ${country}, type: ${visaType}, purpose: ${purpose}`);

    // Build cache key (tie to authenticated user when available, otherwise session)
    const userKey = (req as any).user?.id || (req as any).sessionID || 'guest';
    const normalizedCountry = String(country).toLowerCase();
    const normalizedType = String(visaType || purpose || 'tourist/visitor visa').toLowerCase();
    const normalizedNationality = String(nationality || 'any').toLowerCase();
    const cacheKey = `visaforms:${userKey}:${normalizedCountry}:${normalizedType}:${normalizedNationality}`;

    // Serve from cache if present
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        return res.json({
          success: true,
          data: {
            ...cachedData,
            searchedAt: cachedData.searchedAt || new Date().toISOString(),
            fromCache: true,
          },
        });
      }
    } catch (cacheError) {
      console.warn('[VisaForms] Cache lookup failed:', cacheError);
    }

    const userQuery = `Find the OFFICIAL visa application forms for:
- Destination Country: ${country}
- Visa Type/Purpose: ${visaType || purpose || 'tourist/visitor visa'}
${nationality ? `- Applicant Nationality: ${nationality}` : ''}

Provide:
1. All required official application forms with direct links to government websites
2. Any supplementary forms needed
3. Important submission instructions
4. Links to official portals where forms must be filled online (if applicable)

Focus on the CURRENT 2024-2025 requirements.`;

    const completion = await perplexity.chat.completions.create({
      model: 'sonar-pro', // Advanced search model with grounding for real-time web search
      messages: [
        {
          role: 'system',
          content: FORM_RESEARCH_PROMPT,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      temperature: 0.3, // Lower temperature for factual accuracy
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    try {
      let cleanedResponse = responseContent.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      const formData = JSON.parse(cleanedResponse);

      const responsePayload = {
        country,
        visaType: visaType || purpose || 'tourist/visitor',
        ...formData,
        searchedAt: new Date().toISOString(),
      };

      // Cache the response for the user/session
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', FORM_CACHE_TTL_SECONDS);
      } catch (cacheError) {
        console.warn('[VisaForms] Cache set failed:', cacheError);
      }

      return res.json({
        success: true,
        data: responsePayload,
      });
    } catch (parseError) {
      console.error('[VisaForms] Failed to parse JSON response:', parseError);
      console.error('[VisaForms] Raw response:', responseContent);

      // Return raw response if parsing fails
      return res.json({
        success: true,
        data: {
          country,
          visaType: visaType || purpose || 'tourist/visitor',
          forms: [],
          rawResponse: responseContent,
          note: 'Unable to parse structured data. Please see raw response.',
          searchedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('[VisaForms] Search error:', error);
    return res.status(500).json({ success: false, error: 'Failed to search for visa forms' });
  }
});

/**
 * POST /api/visadocs/forms/ask-jeffrey
 * Ask Jeffrey specifically about visa forms
 */
router.post('/ask-jeffrey', async (req: Request, res: Response) => {
  try {
    const { question, country, visaType } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const contextPrompt = `You are Jeffrey, an expert visa consultant. The user is asking about visa application forms.
${country ? `They are applying for a visa to: ${country}` : ''}
${visaType ? `Visa type: ${visaType}` : ''}

Provide helpful, accurate information about:
- Where to find official forms
- How to fill out specific fields
- Common mistakes to avoid
- Required supporting documents
- Submission procedures

Always cite official government sources when possible. Be specific and actionable.`;

    const completion = await perplexity.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: contextPrompt,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not find information about that.';

    return res.json({
      success: true,
      data: {
        response,
        question,
        context: { country, visaType },
      },
    });
  } catch (error) {
    console.error('[VisaForms] Ask Jeffrey error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get response' });
  }
});

/**
 * POST /api/visadocs/forms/analyze-pdf
 * Analyze PDF form using Azure Document Intelligence
 * NOTE: This is a legacy endpoint for backward compatibility.
 * New code should use /api/form-filler/extract instead.
 */
router.post('/analyze-pdf', async (req: Request, res: Response) => {
  try {
    const { pdfBuffer, visaType } = req.body;

    if (!pdfBuffer) {
      return res.status(400).json({
        success: false,
        error: 'pdfBuffer is required (Buffer or base64 encoded PDF)'
      });
    }

    console.log(`[VisaForms] Analyzing PDF form, visa type: ${visaType || 'unknown'}`);

    // Convert base64 to buffer if needed
    let buffer: Buffer;
    if (typeof pdfBuffer === 'string') {
      // Remove data URI prefix if present
      const base64Data = pdfBuffer.replace(/^data:application\/pdf;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer.type === 'Buffer' && Array.isArray(pdfBuffer.data)) {
      buffer = Buffer.from(pdfBuffer.data);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid pdfBuffer format'
      });
    }

    console.log(`[VisaForms] Processing PDF (${(buffer.length / 1024).toFixed(2)} KB)`);

    // Use document router with smart processing
    const documentType: DocumentType = 'visa_form';
    const extractionResult = await extractFormFields(buffer, documentType);

    console.log(`[VisaForms] Analysis complete: ${extractionResult.fields.length} fields identified`);
    console.log(`[VisaForms] Extraction method: ${extractionResult.extractionMethod}`);
    console.log(`[VisaForms] Overall confidence: ${extractionResult.overallConfidence}%`);

    // Convert to format expected by frontend
    const fields = extractionResult.fields.map((field, index) => ({
      fieldNumber: index + 1,
      label: field.label,
      value: field.value || '',
      confidence: field.confidence,
      fieldType: field.type,
      pageNumber: 1, // Azure doesn't provide page number easily in key-value pairs without bounding region analysis
    }));

    return res.json({
      success: true,
      data: {
        fields,
        queryResults: extractionResult.queryResults || [],
        tables: extractionResult.tables || [],
        selectionMarks: extractionResult.selectionMarks || [],
        barcodes: extractionResult.barcodes || [],
        markdownOutput: extractionResult.markdownOutput || '',
        totalFields: fields.length,
        pagesAnalyzed: extractionResult.pageCount,
        extractionMethod: extractionResult.extractionMethod,
        overallConfidence: extractionResult.overallConfidence,
        processingTime: extractionResult.processingTime,
        qualityAssessment: extractionResult.qualityAssessment,
        smartAnalysis: extractionResult.smartAnalysis,
        visaType: visaType || 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[VisaForms] PDF analysis error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to analyze PDF form: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * POST /api/visadocs/forms/reanalyze-field
 * DISABLED: This endpoint uses Gemini Vision which is disabled for Azure-only testing
 */
router.post('/reanalyze-field', async (_req: Request, res: Response) => {
  console.log('[VisaForms] Reanalyze-field endpoint called - DISABLED for Azure-only testing');

  return res.status(503).json({
    success: false,
    error: 'Field re-analysis is temporarily disabled for Azure Document Intelligence testing. Use /extract-fields instead.'
  });
});

/**
 * POST /api/visadocs/forms/extract-fields
 * Extract form field definitions directly from PDF structure
 * Bypasses visual overlays to get actual fillable field names
 */
router.post('/extract-fields', async (req: Request, res: Response) => {
  try {
    const { pdfBuffer, useAzure = false } = req.body;

    if (!pdfBuffer) {
      return res.status(400).json({
        success: false,
        error: 'pdfBuffer is required (Buffer or base64 encoded PDF)'
      });
    }

    console.log(`[VisaForms] Extracting PDF form fields (useAzure: ${useAzure})`);

    // Convert base64 to buffer if needed
    let buffer: Buffer;
    if (typeof pdfBuffer === 'string') {
      const base64Data = pdfBuffer.replace(/^data:application\/pdf;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer.type === 'Buffer' && Array.isArray(pdfBuffer.data)) {
      buffer = Buffer.from(pdfBuffer.data);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid pdfBuffer format'
      });
    }

    // Extract form field definitions directly from PDF
    const pdfStructure = await extractPDFFormFields(buffer);

    console.log(`[VisaForms] Extracted ${pdfStructure.totalFields} form fields from PDF structure`);
    console.log(`[VisaForms] Has visual overlays: ${pdfStructure.hasOverlays}`);

    // Generate readable labels for each field
    const fieldsWithLabels = pdfStructure.fields.map((field, index) => ({
      fieldNumber: index + 1,
      fieldName: field.name,
      label: generateFieldLabel(field.name),
      type: field.type,
      value: field.value || '',
      readOnly: field.readOnly,
      required: field.required,
      maxLength: field.maxLength,
    }));

    // Optionally combine with Azure Document Intelligence results
    let correlationResults;
    if (useAzure) {
      try {
        console.log('[VisaForms] Running Azure Document Intelligence for correlation...');
        const documentType: DocumentType = 'visa_form';
        const extractionResult = await extractFormFields(buffer, documentType);

        correlationResults = correlateFields(
          pdfStructure.fields,
          extractionResult.fields.map(f => ({
            label: f.label,
            value: f.value,
            confidence: f.confidence
          }))
        );

        console.log(`[VisaForms] Correlated ${correlationResults.filter(c => c.matched).length}/${correlationResults.length} fields with Azure results`);
      } catch (azureError) {
        console.warn('[VisaForms] Azure correlation failed:', azureError);
      }
    }

    return res.json({
      success: true,
      data: {
        fields: fieldsWithLabels,
        totalFields: pdfStructure.totalFields,
        pageCount: pdfStructure.pageCount,
        hasOverlays: pdfStructure.hasOverlays,
        correlation: correlationResults,
        extractedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[VisaForms] Field extraction error:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to extract form fields: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

/**
 * POST /api/visadocs/forms/analyze-validation
 * Form validation endpoint - currently returns minimal response (Gemini Vision not configured)
 */
router.post('/analyze-validation', async (_req: Request, res: Response) => {
  console.log('[VisaForms] Validation endpoint called - returning minimal response');

  // Return a graceful response instead of 503 to prevent frontend errors
  return res.status(200).json({
    success: true,
    data: {
      validation: {
        overallScore: 0,
        completedFields: 0,
        totalFields: 0,
        issues: [],
        recommendations: ['Form validation via Gemini Vision is currently not configured. Use the Smart Document Processor for field analysis.'],
        countrySpecificNotes: []
      }
    }
  });
});

export default router;
