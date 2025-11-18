/**
 * AI Validator (Tier 3 Validation)
 *
 * Selective AI validation using Gemini Flash for edge cases only
 * Invoked for:
 * - Low confidence extractions (< 70%)
 * - Free-text fields requiring semantic understanding
 * - Contradiction detection across multiple fields
 * - Complex validation that can't be handled by rules
 *
 * Target: < 5% of forms to minimize cost
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedField } from './documentRouter';
import type { ValidationIssue } from './rulesEngine';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AIValidationResult {
  needsAI: boolean;
  overallConfidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
  contradictions: Array<{
    field1: string;
    field2: string;
    description: string;
  }>;
  reviewRequired: boolean;
}

/**
 * Determine if AI validation is needed
 */
export function shouldUseAIValidation(
  extractedFields: ExtractedField[],
  overallConfidence: number,
  existingIssues: ValidationIssue[]
): boolean {
  // AI validation needed if:
  // 1. Overall confidence < 70%
  if (overallConfidence < 70) {
    console.log('[AI Validator] Low overall confidence, AI validation recommended');
    return true;
  }

  // 2. Any critical field has confidence < 70%
  const criticalFields = [
    'passport',
    'name',
    'date of birth',
    'nationality',
    'expiry',
  ];

  const lowConfidenceCriticalFields = extractedFields.filter(
    (field) =>
      field.confidence < 70 &&
      criticalFields.some((critical) =>
        field.label.toLowerCase().includes(critical)
      )
  );

  if (lowConfidenceCriticalFields.length > 0) {
    console.log('[AI Validator] Low confidence on critical fields, AI validation recommended');
    return true;
  }

  // 3. Multiple errors detected by rules engine
  if (existingIssues.filter((i) => i.severity === 'error').length > 3) {
    console.log('[AI Validator] Multiple validation errors, AI validation recommended');
    return true;
  }

  // 4. Free-text fields present (addresses, employment details, etc.)
  const hasFreeTextField = extractedFields.some(
    (field) =>
      field.type === 'text' &&
      field.value.length > 50 // Long text values might need semantic validation
  );

  if (hasFreeTextField) {
    console.log('[AI Validator] Free-text fields present, AI validation may be helpful');
    return true;
  }

  return false;
}

/**
 * Perform AI validation on form data
 */
export async function performAIValidation(
  formData: any,
  extractedFields: ExtractedField[],
  existingIssues: ValidationIssue[],
  destinationCountry?: string
): Promise<AIValidationResult> {
  console.log('[AI Validator] Performing AI validation...');

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        topK: 10,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    });

    // Filter low confidence fields
    const lowConfidenceFields = extractedFields.filter((f) => f.confidence < 70);

    const prompt = `You are an expert visa application validator. Analyze this form data for potential issues.

**FORM DATA:**
${JSON.stringify(formData, null, 2)}

**LOW CONFIDENCE EXTRACTIONS:**
${JSON.stringify(lowConfidenceFields, null, 2)}

**EXISTING VALIDATION ISSUES:**
${JSON.stringify(existingIssues, null, 2)}

${destinationCountry ? `**DESTINATION COUNTRY:** ${destinationCountry}` : ''}

**YOUR TASK:**
1. Identify any contradictions between fields (e.g., date of birth suggests age 25 but passport issue date was 30 years ago)
2. Validate semantic correctness of free-text fields
3. Suggest improvements for low-confidence extractions
4. Identify any data that seems unusual or potentially incorrect
5. Check for missing critical information

**RESPOND WITH VALID JSON ONLY (no markdown):**
{
  "overallConfidence": 0-100,
  "issues": [
    {
      "field": "fieldName",
      "message": "Clear description of the issue",
      "severity": "error|warning|info",
      "suggestion": "How to fix it"
    }
  ],
  "suggestions": [
    "General suggestions for improving the application"
  ],
  "contradictions": [
    {
      "field1": "fieldName1",
      "field2": "fieldName2",
      "description": "Description of the contradiction"
    }
  ],
  "reviewRequired": true/false
}

**IMPORTANT:**
- Only flag genuine issues, not minor formatting differences
- Be specific about what needs to be reviewed
- Provide actionable suggestions
- Consider cultural variations in names and addresses
- If everything looks correct, return empty arrays and reviewRequired: false`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);

    console.log(
      `[AI Validator] Analysis complete. Confidence: ${analysis.overallConfidence}%, Issues: ${analysis.issues.length}`
    );

    return {
      needsAI: true,
      overallConfidence: analysis.overallConfidence || 50,
      issues: analysis.issues || [],
      suggestions: analysis.suggestions || [],
      contradictions: analysis.contradictions || [],
      reviewRequired: analysis.reviewRequired || false,
    };
  } catch (error) {
    console.error('[AI Validator] AI validation failed:', error);

    // Return safe default on error
    return {
      needsAI: true,
      overallConfidence: 50,
      issues: [
        {
          field: 'general',
          message: 'AI validation unavailable. Please manually review all fields.',
          severity: 'warning',
        },
      ],
      suggestions: ['Manual review recommended due to AI validation failure'],
      contradictions: [],
      reviewRequired: true,
    };
  }
}

/**
 * Validate specific field value using AI
 */
export async function validateFieldWithAI(
  fieldLabel: string,
  fieldValue: string,
  fieldType: string,
  context?: any
): Promise<{
  isValid: boolean;
  confidence: number;
  suggestion?: string;
  correctedValue?: string;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `Validate this form field extraction:

**Field Label:** ${fieldLabel}
**Extracted Value:** ${fieldValue}
**Field Type:** ${fieldType}
${context ? `**Context:** ${JSON.stringify(context)}` : ''}

**Task:** Determine if the extracted value is valid and correct for this field.

**Respond with JSON only:**
{
  "isValid": true/false,
  "confidence": 0-100,
  "suggestion": "What might be wrong or how to correct it",
  "correctedValue": "Suggested correct value (if applicable)"
}

**Examples:**
- If label is "Date of Birth" and value is "1985-13-45", isValid=false (invalid month/day)
- If label is "Email" and value is "user@example", isValid=false (incomplete email)
- If label is "Phone Number" and value is "abc123", isValid=false (not a phone number)
- If label is "Passport Number" and value is "AB123456", isValid=true
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const validation = JSON.parse(cleanedText);

    return {
      isValid: validation.isValid ?? false,
      confidence: validation.confidence ?? 0,
      suggestion: validation.suggestion,
      correctedValue: validation.correctedValue,
    };
  } catch (error) {
    console.error('[AI Validator] Field validation failed:', error);

    return {
      isValid: true, // Default to valid to avoid false positives
      confidence: 50,
      suggestion: 'Unable to validate field automatically. Please verify manually.',
    };
  }
}

/**
 * Detect contradictions in form data using AI
 */
export async function detectContradictions(formData: any): Promise<
  Array<{
    field1: string;
    field2: string;
    description: string;
    severity: 'error' | 'warning';
  }>
> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `Analyze this visa application data for logical contradictions or inconsistencies:

${JSON.stringify(formData, null, 2)}

**Look for contradictions such as:**
- Age derived from date of birth doesn't match other age-related fields
- Passport issue date is after passport expiry date
- Travel date is before current date
- Employment start date is before date of birth
- Address components don't make sense together
- Names with unusual characters or formatting
- Dates that are clearly impossible

**Respond with JSON only:**
{
  "contradictions": [
    {
      "field1": "fieldName1",
      "field2": "fieldName2",
      "description": "Clear explanation of the contradiction",
      "severity": "error|warning"
    }
  ]
}

If no contradictions are found, return an empty array.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);

    return analysis.contradictions || [];
  } catch (error) {
    console.error('[AI Validator] Contradiction detection failed:', error);
    return [];
  }
}

/**
 * Suggest improvements for form data
 */
export async function suggestImprovements(
  formData: any,
  destinationCountry?: string
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `Review this visa application and suggest improvements:

${JSON.stringify(formData, null, 2)}

${destinationCountry ? `Destination: ${destinationCountry}` : ''}

**Provide practical suggestions to improve the application:**
- Missing optional fields that would strengthen the application
- Formatting improvements
- Additional documentation that might be helpful
- Common mistakes to avoid

**Respond with JSON only:**
{
  "suggestions": [
    "Specific, actionable suggestion 1",
    "Specific, actionable suggestion 2"
  ]
}

Keep suggestions concise and relevant.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedText);

    return analysis.suggestions || [];
  } catch (error) {
    console.error('[AI Validator] Suggestions generation failed:', error);
    return [];
  }
}

/**
 * Calculate overall AI validation cost estimate
 */
export function estimateAIValidationCost(useAI: boolean): number {
  if (!useAI) return 0;

  // Gemini Flash API cost: ~$0.001-0.005 per request
  // Assuming one comprehensive validation per form
  return 0.003; // $0.003 per form (conservative estimate)
}
