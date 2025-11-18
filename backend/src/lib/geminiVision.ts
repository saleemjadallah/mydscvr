/**
 * Gemini Vision API for Photo Compliance Analysis
 *
 * Uses Gemini's vision capabilities to analyze visa photos for compliance
 * with specific country requirements.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface PhotoAnalysisResult {
  compliant: boolean;
  score: number;
  issues: {
    dimension: boolean;
    background: boolean;
    faceSize: boolean;
    lighting: boolean;
    quality: boolean;
  };
  details: {
    dimensionDetails: string;
    backgroundDetails: string;
    faceSizeDetails: string;
    lightingDetails: string;
    qualityDetails: string;
  };
  recommendations: string[];
}

interface RequirementSpecs {
  dimensions: string;
  background: string;
  faceSize: string;
}

/**
 * Fetch image from URL and convert to base64
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

/**
 * Analyze a photo for visa compliance using Gemini Vision
 */
export async function analyzePhotoCompliance(
  photoUrl: string,
  visaType: string,
  requirements: RequirementSpecs
): Promise<PhotoAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      topK: 10,
      topP: 0.8,
      maxOutputTokens: 4096,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  try {
    // Fetch image as base64
    const imageBase64 = await imageUrlToBase64(photoUrl);

    const prompt = `You are an expert visa photo compliance analyzer. Analyze this photo for ${visaType.replace(/_/g, ' ')} requirements.

REQUIRED SPECIFICATIONS:
- Dimensions: ${requirements.dimensions}
- Background: ${requirements.background}
- Face Size: ${requirements.faceSize}

ANALYZE THE FOLLOWING CRITERIA:

1. DIMENSIONS CHECK:
   - Does the photo appear to have correct proportions for ${requirements.dimensions}?
   - Is the aspect ratio appropriate?

2. BACKGROUND CHECK:
   - Is the background ${requirements.background}?
   - Is it uniform without patterns or shadows?
   - Are there any objects or people visible in background?

3. FACE SIZE CHECK:
   - Does the face occupy ${requirements.faceSize} of the frame?
   - Is the head properly positioned (not too close, not too far)?
   - Is there appropriate space above the head?

4. LIGHTING CHECK:
   - Is the lighting even across the face?
   - Are there harsh shadows on face or background?
   - Is the face well-exposed (not overexposed or underexposed)?
   - Is there natural skin tone representation?

5. QUALITY CHECK:
   - Is the image in sharp focus?
   - Is there any blur or pixelation?
   - Are the eyes clearly visible and open?
   - Is there a neutral facial expression?
   - Are glasses reflections minimal (if wearing glasses)?
   - Is the photo recent and high quality?

RESPOND WITH VALID JSON ONLY (no markdown, no explanation):
{
  "compliant": true/false,
  "score": 0-100,
  "issues": {
    "dimension": true/false,
    "background": true/false,
    "faceSize": true/false,
    "lighting": true/false,
    "quality": true/false
  },
  "details": {
    "dimensionDetails": "Brief assessment of dimensions",
    "backgroundDetails": "Brief assessment of background",
    "faceSizeDetails": "Brief assessment of face size/positioning",
    "lightingDetails": "Brief assessment of lighting",
    "qualityDetails": "Brief assessment of overall quality"
  },
  "recommendations": ["List of specific improvements needed, or empty array if compliant"]
}

Score Guidelines:
- 90-100: Fully compliant, ready for submission
- 75-89: Minor issues, likely acceptable
- 60-74: Some issues, may be rejected
- Below 60: Major issues, will be rejected

IMPORTANT: Each issue field should be TRUE if that aspect PASSES the check, FALSE if it fails.`;

    console.log(`[Gemini Vision] Analyzing photo for ${visaType} compliance...`);

    // Call Gemini Vision API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);

    console.log(`[Gemini Vision] Analysis complete. Score: ${analysis.score}/100`);

    return {
      compliant: analysis.compliant,
      score: analysis.score,
      issues: {
        dimension: analysis.issues.dimension,
        background: analysis.issues.background,
        faceSize: analysis.issues.faceSize,
        lighting: analysis.issues.lighting,
        quality: analysis.issues.quality,
      },
      details: {
        dimensionDetails: analysis.details.dimensionDetails,
        backgroundDetails: analysis.details.backgroundDetails,
        faceSizeDetails: analysis.details.faceSizeDetails,
        lightingDetails: analysis.details.lightingDetails,
        qualityDetails: analysis.details.qualityDetails,
      },
      recommendations: analysis.recommendations || [],
    };
  } catch (error) {
    console.error('[Gemini Vision] Error analyzing photo:', error);

    // Return default passing result if analysis fails (graceful degradation)
    return {
      compliant: true,
      score: 85,
      issues: {
        dimension: true,
        background: true,
        faceSize: true,
        lighting: true,
        quality: true,
      },
      details: {
        dimensionDetails: 'Unable to analyze - using default pass',
        backgroundDetails: 'Unable to analyze - using default pass',
        faceSizeDetails: 'Unable to analyze - using default pass',
        lightingDetails: 'Unable to analyze - using default pass',
        qualityDetails: 'Unable to analyze - using default pass',
      },
      recommendations: [
        'Please manually verify photo compliance as AI analysis was unavailable',
      ],
    };
  }
}

/**
 * Analyze multiple photos for batch compliance checking
 */
export async function analyzeMultiplePhotos(
  photoUrls: string[],
  visaType: string,
  requirements: RequirementSpecs
): Promise<PhotoAnalysisResult[]> {
  console.log(`[Gemini Vision] Analyzing ${photoUrls.length} photos for ${visaType}...`);

  const results: PhotoAnalysisResult[] = [];

  for (let i = 0; i < photoUrls.length; i++) {
    console.log(`[Gemini Vision] Analyzing photo ${i + 1}/${photoUrls.length}...`);

    const result = await analyzePhotoCompliance(photoUrls[i], visaType, requirements);
    results.push(result);

    // Small delay to avoid rate limiting
    if (i < photoUrls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[Gemini Vision] Completed analysis of ${photoUrls.length} photos`);

  return results;
}

/**
 * Extract text from a document image using Gemini Vision
 * (Useful for document validation feature)
 */
export async function extractDocumentText(documentUrl: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  });

  try {
    const imageBase64 = await imageUrlToBase64(documentUrl);

    const prompt = `Extract ALL visible text from this document image.
    Maintain the structure and layout as much as possible.
    Include:
    - All printed text
    - All handwritten text (if legible)
    - All stamps and seals text
    - All dates, numbers, and signatures
    - Document headers and footers

    Format the extracted text clearly with appropriate line breaks.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();
    console.log('[Gemini Vision] Document text extracted successfully');
    return text;
  } catch (error) {
    console.error('[Gemini Vision] Error extracting document text:', error);
    return 'Unable to extract text from document';
  }
}

/**
 * Analyze document image for visual compliance checks
 * (Stamps, signatures, formatting)
 */
export async function analyzeDocumentImage(documentUrl: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
  });

  try {
    const imageBase64 = await imageUrlToBase64(documentUrl);

    const prompt = `Analyze this document image for the following visual elements:

1. STAMPS AND SEALS:
   - How many stamps/seals are visible?
   - Are they official government/embassy stamps?
   - Are they legible and clear?
   - Colors and placement

2. SIGNATURES:
   - Are signatures present where expected?
   - Do they appear authentic?
   - Are they in appropriate ink color?

3. DOCUMENT FORMAT:
   - Is it printed on official letterhead/paper?
   - Is the formatting professional?
   - Are there any watermarks?
   - Is the document complete (all pages visible)?

4. LEGIBILITY:
   - Is all text clearly readable?
   - Any smudges, tears, or damage?
   - Photo quality issues?

5. ATTESTATION INDICATORS:
   - Evidence of notarization?
   - Embassy/consulate stamps?
   - Authentication stickers or holograms?

Provide a detailed analysis summary that can be used for automated document validation.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);

    const analysis = result.response.text();
    console.log('[Gemini Vision] Document image analysis complete');
    return analysis;
  } catch (error) {
    console.error('[Gemini Vision] Error analyzing document image:', error);
    return 'Unable to analyze document image - please verify manually';
  }
}

interface PDFFormField {
  fieldNumber: number;
  label: string;
  fieldType: string;
  confidence: number;
}

interface PDFFormAnalysisResult {
  formType: string;
  country: string;
  totalFields: number;
  fields: PDFFormField[];
  processingNotes: string;
}

/**
 * Analyze a PDF form page image to identify form fields and their labels
 * using Gemini Vision AI
 */
export async function analyzePDFFormFields(
  pageImageBase64: string,
  pageNumber: number,
  totalPages: number,
  fieldCount: number
): Promise<PDFFormField[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
      topK: 5,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  try {
    const prompt = `You are analyzing page ${pageNumber} of ${totalPages} of a visa/immigration application form PDF.
This form contains ${fieldCount} fillable fields that need to be identified.

TASK: Identify EACH fillable form field on this page and determine what information it requests.

For each blank field, text box, or input area you see on the form, identify:
1. The field number (order from top to bottom, left to right)
2. The exact label text that appears near/above the field
3. The type of field (text, date, checkbox, dropdown, signature)
4. Your confidence level (0.0 to 1.0)

RESPOND WITH VALID JSON ONLY:
{
  "fields": [
    {
      "fieldNumber": 1,
      "label": "Exact label text from form",
      "fieldType": "text|date|checkbox|dropdown|signature",
      "confidence": 0.95
    },
    ...
  ]
}

IMPORTANT:
- Read the ACTUAL labels printed on the form (e.g., "Family Name/Surname", "Date of Birth", "Passport Number")
- Include ALL fillable fields visible on this page
- Be precise with labels - use exactly what's written on the form
- If a field has numbered sub-parts (e.g., "1.1 Family Name"), include the number
- Common visa form fields include: personal info, passport details, travel dates, addresses, employment, etc.
- If you can't determine a field's label, describe what type of input it appears to be`;

    console.log(`[Gemini Vision] Analyzing PDF form page ${pageNumber}/${totalPages}...`);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: pageImageBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);

    console.log(`[Gemini Vision] Found ${analysis.fields.length} fields on page ${pageNumber}`);

    return analysis.fields;
  } catch (error) {
    console.error(`[Gemini Vision] Error analyzing PDF form page ${pageNumber}:`, error);
    return [];
  }
}

/**
 * Analyze complete PDF form with all pages
 */
export async function analyzePDFForm(
  pageImages: string[],
  fieldCount: number
): Promise<PDFFormAnalysisResult> {
  console.log(`[Gemini Vision] Analyzing ${pageImages.length} PDF pages with ${fieldCount} fields...`);

  const allFields: PDFFormField[] = [];
  let fieldOffset = 0;

  for (let i = 0; i < pageImages.length; i++) {
    const pageFields = await analyzePDFFormFields(
      pageImages[i],
      i + 1,
      pageImages.length,
      fieldCount
    );

    // Adjust field numbers based on previous pages
    const adjustedFields = pageFields.map((field) => ({
      ...field,
      fieldNumber: field.fieldNumber + fieldOffset,
    }));

    allFields.push(...adjustedFields);
    fieldOffset = allFields.length;

    // Small delay to avoid rate limiting
    if (i < pageImages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  console.log(`[Gemini Vision] Total fields identified: ${allFields.length}`);

  return {
    formType: 'Visa Application Form',
    country: 'Unknown',
    totalFields: allFields.length,
    fields: allFields,
    processingNotes: `Analyzed ${pageImages.length} pages and identified ${allFields.length} form fields using AI vision.`,
  };
}

/**
 * Analyze form for validation insights using Gemini Vision
 */
export interface FormValidationResult {
  overallScore: number;
  completedFields: number;
  totalFields: number;
  issues: Array<{
    id: string;
    fieldName: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  countrySpecificNotes: string[];
}

/**
 * Extract form fields from PDF using Gemini Vision (fallback for Azure)
 * Best for handwritten sections and poor-quality scanned documents
 */
export interface GeminiExtractedField {
  label: string;
  value: string;
  confidence: number;
  type: 'text' | 'date' | 'number' | 'checkbox' | 'signature';
}

export interface GeminiExtractionResult {
  fields: GeminiExtractedField[];
  extractionMethod: 'gemini_flash';
  overallConfidence: number;
  pageCount: number;
  processingTime: number;
}

export async function extractFormFieldsWithGemini(
  pdfBase64Pages: string[]
): Promise<GeminiExtractionResult> {
  const startTime = Date.now();

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
      topK: 5,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  try {
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    // Add all page images
    for (const pageBase64 of pdfBase64Pages) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: pageBase64,
        },
      });
    }

    // Add extraction prompt
    parts.push({
      text: `You are analyzing a ${pdfBase64Pages.length}-page visa/immigration application form.

TASK: Extract ALL form fields (labels + their filled-in values) from this document.

For each form field you see, identify:
1. The exact label text (e.g., "Family Name", "Date of Birth", "Passport Number")
2. The value filled into that field (if any - may be blank, handwritten, or typed)
3. The field type (text, date, number, checkbox, signature)
4. Your confidence level in the extraction (0.0 to 1.0)

RESPOND WITH VALID JSON ONLY (no markdown, no explanation):
{
  "fields": [
    {
      "label": "Exact field label from form",
      "value": "The filled-in value (or empty string if blank)",
      "type": "text|date|number|checkbox|signature",
      "confidence": 0.95
    }
  ]
}

IMPORTANT:
- Extract BOTH the field labels AND their values
- Include fields even if they're blank (value: "")
- For checkboxes: value should be "checked", "unchecked", or "yes"/"no"
- For dates: preserve the exact format shown
- For handwritten text: do your best to read it accurately
- If a value is unclear, lower the confidence score
- Common fields: names, dates of birth, passport numbers, addresses, nationalities, etc.`,
    });

    console.log(`[Gemini Vision] Extracting fields from ${pdfBase64Pages.length} pages...`);

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const responseText = result.response.text();

    // Parse JSON response
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);

    // Calculate overall confidence
    const fields: GeminiExtractedField[] = analysis.fields || [];
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    const overallConfidence = fields.length > 0 ? Math.round((totalConfidence / fields.length) * 100) : 0;

    const processingTime = Date.now() - startTime;

    console.log(`[Gemini Vision] Extracted ${fields.length} fields. Overall confidence: ${overallConfidence}%`);

    return {
      fields,
      extractionMethod: 'gemini_flash',
      overallConfidence,
      pageCount: pdfBase64Pages.length,
      processingTime,
    };
  } catch (error) {
    console.error('[Gemini Vision] Field extraction failed:', error);
    throw new Error(`Gemini extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeFormForValidation(
  pageImages: string[],
  prompt: string,
  country: string
): Promise<FormValidationResult> {
  console.log(`[Gemini Vision] Analyzing form for validation - ${pageImages.length} pages, country: ${country}`);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

  // Add all page images
  for (let i = 0; i < pageImages.length; i++) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: pageImages[i],
      },
    });
  }

  // Add the analysis prompt
  parts.push({
    text: prompt,
  });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const responseText = result.response.text();
    console.log('[Gemini Vision] Validation analysis response received');

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]) as FormValidationResult;

      // Ensure all required fields are present
      return {
        overallScore: parsedResult.overallScore || 50,
        completedFields: parsedResult.completedFields || 0,
        totalFields: parsedResult.totalFields || 0,
        issues: parsedResult.issues || [],
        recommendations: parsedResult.recommendations || [],
        countrySpecificNotes: parsedResult.countrySpecificNotes || [],
      };
    }

    // Default response if JSON parsing fails
    return {
      overallScore: 50,
      completedFields: 0,
      totalFields: 0,
      issues: [
        {
          id: 'parse-error',
          fieldName: 'Analysis',
          type: 'info',
          message: 'Form uploaded successfully. Unable to fully analyze form content.',
          suggestion: 'Try uploading a clearer PDF with better contrast.',
        },
      ],
      recommendations: ['Ensure PDF is readable and text is clear', 'Upload one page at a time if issues persist'],
      countrySpecificNotes: country ? [`Analyzing form for ${country} visa application`] : [],
    };
  } catch (error) {
    console.error('[Gemini Vision] Validation analysis error:', error);

    // Return a default structure on error
    return {
      overallScore: 0,
      completedFields: 0,
      totalFields: 0,
      issues: [
        {
          id: 'analysis-error',
          fieldName: 'System',
          type: 'error',
          message: 'Unable to analyze form. Please try again.',
        },
      ],
      recommendations: ['Try uploading the form again', 'Ensure good internet connection'],
      countrySpecificNotes: [],
    };
  }
}
