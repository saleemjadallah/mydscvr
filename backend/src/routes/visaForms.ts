/**
 * Visa Forms Routes - Uses Perplexity AI to find official visa forms for any country
 */

import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { analyzePDFForm } from '../lib/geminiVision.js';
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
 * Analyze PDF form pages using Gemini Vision AI to identify field labels
 */
router.post('/analyze-pdf', async (req: Request, res: Response) => {
  try {
    const { pageImages, fieldCount, visaType } = req.body;

    if (!pageImages || !Array.isArray(pageImages) || pageImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'pageImages array is required (base64 encoded PNG images)'
      });
    }

    console.log(`[VisaForms] Analyzing PDF form with ${pageImages.length} pages, ${fieldCount || 'unknown'} fields`);
    console.log(`[VisaForms] Visa type: ${visaType || 'unknown'}`);

    // Call Gemini Vision to analyze the PDF pages
    const analysisResult = await analyzePDFForm(
      pageImages,
      fieldCount || pageImages.length * 10 // Estimate 10 fields per page if not provided
    );

    console.log(`[VisaForms] Analysis complete: ${analysisResult.totalFields} fields identified`);

    return res.json({
      success: true,
      data: {
        ...analysisResult,
        visaType: visaType || 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[VisaForms] PDF analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze PDF form. Please try again.'
    });
  }
});

/**
 * POST /api/visadocs/forms/reanalyze-field
 * Re-analyze a specific field using Gemini Vision for disagreement cases
 */
router.post('/reanalyze-field', async (req: Request, res: Response) => {
  try {
    const { pageImage, fieldIndex, currentLabel, visaType: _visaType } = req.body;

    if (!pageImage) {
      return res.status(400).json({
        success: false,
        error: 'pageImage is required (base64 encoded PNG image)'
      });
    }

    console.log(`[VisaForms] Re-analyzing field #${fieldIndex}, current label: "${currentLabel}"`);

    // Re-analyze just this one page with focus on the specific field
    const { analyzePDFFormFields } = await import('../lib/geminiVision.js');
    const fields = await analyzePDFFormFields(
      pageImage,
      1, // Single page
      1, // Total pages = 1 for focused analysis
      1  // Focus on single field area
    );

    // Find the field closest to the requested index
    const targetField = fields.find(f => f.fieldNumber === fieldIndex) || fields[0];

    return res.json({
      success: true,
      data: {
        fieldIndex,
        previousLabel: currentLabel,
        newLabel: targetField?.label || currentLabel,
        confidence: targetField?.confidence || 0.5,
        fieldType: targetField?.fieldType || 'text',
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[VisaForms] Field re-analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to re-analyze field'
    });
  }
});

/**
 * POST /api/visadocs/forms/analyze-validation
 * Analyze a visa form using Gemini Vision for validation insights
 */
router.post('/analyze-validation', async (req: Request, res: Response) => {
  try {
    const { pageImages, prompt, country } = req.body;

    if (!pageImages || !Array.isArray(pageImages) || pageImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'pageImages array is required (base64 encoded PNG images)'
      });
    }

    console.log(`[VisaForms] Analyzing form for validation - ${pageImages.length} pages, country: ${country}`);

    // Use Gemini Vision for analysis
    const { analyzeFormForValidation } = await import('../lib/geminiVision.js');

    const validationResult = await analyzeFormForValidation(
      pageImages,
      prompt,
      country || ''
    );

    console.log(`[VisaForms] Validation analysis complete`);

    return res.json({
      success: true,
      data: {
        validation: validationResult,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[VisaForms] Form validation analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze form for validation. Please try again.'
    });
  }
});

export default router;
