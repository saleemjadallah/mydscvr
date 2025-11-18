import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';

// Azure Document Intelligence Configuration
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '';
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '';

// Initialize client
let client: DocumentAnalysisClient | null = null;

function getClient(): DocumentAnalysisClient {
  if (!client) {
    if (!endpoint || !apiKey) {
      throw new Error('Azure Document Intelligence credentials not configured');
    }
    client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  }
  return client;
}

// Check if Azure DI is configured
export function isAzureConfigured(): boolean {
  return !!endpoint && !!apiKey;
}

// Extracted field interface
export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  type: 'text' | 'date' | 'number' | 'checkbox' | 'signature';
  boundingBox?: number[];
}

// Document extraction result
export interface DocumentExtractionResult {
  fields: ExtractedField[];
  extractionMethod: 'azure_layout' | 'azure_prebuilt_id';
  overallConfidence: number;
  pageCount: number;
  processingTime: number;
}

/**
 * Extract form fields from a PDF using Azure Document Intelligence Layout model
 * Best for general visa forms, applications, and documents
 */
export async function extractFormFieldsWithLayout(
  pdfBuffer: Buffer
): Promise<DocumentExtractionResult> {
  const startTime = Date.now();

  try {
    const client = getClient();

    // Use the prebuilt layout model
    const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
    const result = await poller.pollUntilDone();

    const fields: ExtractedField[] = [];
    let totalConfidence = 0;
    let fieldCount = 0;

    // Extract key-value pairs (form fields)
    if (result.keyValuePairs) {
      for (const kvp of result.keyValuePairs) {
        if (kvp.key && kvp.value) {
          const label = kvp.key.content || '';
          const value = kvp.value.content || '';
          const confidence = kvp.confidence || 0;

          if (label && value) {
            // Convert Point2D[] to number[] if polygon exists
            const polygon = kvp.key.boundingRegions?.[0]?.polygon;
            const boundingBox = polygon?.map((point) => [point.x, point.y]).flat();

            fields.push({
              label: label.trim(),
              value: value.trim(),
              confidence: Math.round(confidence * 100),
              type: inferFieldType(value),
              boundingBox,
            });

            totalConfidence += confidence;
            fieldCount++;
          }
        }
      }
    }

    // Also extract tables if present
    if (result.tables) {
      for (const table of result.tables) {
        for (const cell of table.cells) {
          if (cell.kind === 'columnHeader' && table.cells.length > cell.columnIndex + 1) {
            // Try to match column headers with cell values
            const headerContent = cell.content || '';
            if (headerContent) {
              fields.push({
                label: headerContent.trim(),
                value: '', // Tables need special handling
                confidence: 80, // Default confidence for table headers
                type: 'text',
              });
            }
          }
        }
      }
    }

    const overallConfidence = fieldCount > 0 ? Math.round((totalConfidence / fieldCount) * 100) : 0;
    const processingTime = Date.now() - startTime;

    return {
      fields,
      extractionMethod: 'azure_layout',
      overallConfidence,
      pageCount: result.pages?.length || 1,
      processingTime,
    };
  } catch (error) {
    console.error('Azure Document Intelligence extraction failed:', error);
    throw new Error(`Azure extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract passport/ID information using Azure's prebuilt ID model
 * Best for passport extraction with high accuracy
 */
export async function extractPassportWithPrebuilt(
  imageBuffer: Buffer
): Promise<DocumentExtractionResult> {
  const startTime = Date.now();

  try {
    const client = getClient();

    // Use the prebuilt ID document model
    const poller = await client.beginAnalyzeDocument('prebuilt-idDocument', imageBuffer);
    const result = await poller.pollUntilDone();

    const fields: ExtractedField[] = [];
    let totalConfidence = 0;
    let fieldCount = 0;

    // Extract document fields
    if (result.documents && result.documents.length > 0) {
      const doc = result.documents[0];

      if (doc.fields) {
        for (const [key, field] of Object.entries(doc.fields)) {
          if (field && field.content) {
            const confidence = field.confidence || 0;

            fields.push({
              label: formatFieldLabel(key),
              value: field.content,
              confidence: Math.round(confidence * 100),
              type: inferFieldType(field.content),
            });

            totalConfidence += confidence;
            fieldCount++;
          }
        }
      }
    }

    const overallConfidence = fieldCount > 0 ? Math.round((totalConfidence / fieldCount) * 100) : 0;
    const processingTime = Date.now() - startTime;

    return {
      fields,
      extractionMethod: 'azure_prebuilt_id',
      overallConfidence,
      pageCount: result.pages?.length || 1,
      processingTime,
    };
  } catch (error) {
    console.error('Azure passport extraction failed:', error);
    throw new Error(`Azure passport extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Infer field type from value content
 */
function inferFieldType(value: string): ExtractedField['type'] {
  // Date patterns (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(value) || /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(value)) {
    return 'date';
  }

  // Number patterns
  if (/^\d+$/.test(value.trim())) {
    return 'number';
  }

  // Checkbox indicators
  if (/^(yes|no|true|false|x|✓|☑|☐)$/i.test(value.trim())) {
    return 'checkbox';
  }

  // Signature indicators
  if (/signature|signed|sign here/i.test(value)) {
    return 'signature';
  }

  return 'text';
}

/**
 * Format camelCase or snake_case field labels to human-readable format
 */
function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

/**
 * Assess document quality for routing decisions
 * Returns quality score 0-100
 */
export async function assessDocumentQuality(pdfBuffer: Buffer): Promise<{
  quality: 'high' | 'medium' | 'low';
  score: number;
  reasons: string[];
}> {
  try {
    const client = getClient();

    // Quick analysis using layout model
    const poller = await client.beginAnalyzeDocument('prebuilt-layout', pdfBuffer);
    const result = await poller.pollUntilDone();

    let score = 100;
    const reasons: string[] = [];

    // Check if document has clear key-value pairs
    if (!result.keyValuePairs || result.keyValuePairs.length === 0) {
      score -= 30;
      reasons.push('No clear form fields detected');
    }

    // Check average confidence
    if (result.keyValuePairs && result.keyValuePairs.length > 0) {
      const avgConfidence = result.keyValuePairs.reduce((sum, kvp) => sum + (kvp.confidence || 0), 0) / result.keyValuePairs.length;

      if (avgConfidence < 0.7) {
        score -= 20;
        reasons.push('Low extraction confidence');
      }
    }

    // Note: Handwriting detection not available in current Azure SDK version
    // Could be added in future versions or via alternative methods

    // Determine quality level
    let quality: 'high' | 'medium' | 'low';
    if (score >= 80) {
      quality = 'high';
    } else if (score >= 60) {
      quality = 'medium';
    } else {
      quality = 'low';
    }

    return { quality, score, reasons };
  } catch (error) {
    console.error('Document quality assessment failed:', error);
    // Default to medium quality if assessment fails
    return {
      quality: 'medium',
      score: 60,
      reasons: ['Quality assessment failed, using default routing'],
    };
  }
}
