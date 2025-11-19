import {
  DocumentAnalysisClient,
  AzureKeyCredential,
  AnalyzeResult,
} from '@azure/ai-form-recognizer';

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
  type: 'text' | 'date' | 'number' | 'checkbox' | 'signature' | 'selectionMark';
  boundingBox?: number[];
}

export interface ExtractedTable {
  rowCount: number;
  columnCount: number;
  cells: Array<{
    rowIndex: number;
    columnIndex: number;
    content: string;
    kind: 'content' | 'columnHeader' | 'rowHeader' | 'stubHead';
  }>;
}

export interface ExtractedSelectionMark {
  state: 'selected' | 'unselected';
  confidence: number;
  boundingBox?: number[];
}

export interface ExtractedBarcode {
  value: string;
  kind: string;
  confidence: number;
}

export interface ExtractedLanguage {
  locale: string;
  confidence: number;
}

export interface DocumentMetadata {
  pageCount: number;
  languages: ExtractedLanguage[];
  hasHandwriting: boolean;
  overallConfidence: number;
}

// Document extraction result
export interface DocumentExtractionResult {
  fields: ExtractedField[];
  queryResults: Array<{ field: string; value: string; confidence: number }>;
  tables: ExtractedTable[];
  selectionMarks: ExtractedSelectionMark[];
  barcodes: ExtractedBarcode[];
  metadata: DocumentMetadata;
  markdownOutput: string;
  extractionMethod: 'azure_layout' | 'azure_document' | 'azure_prebuilt_id' | 'gemini_flash';
  processingTime: number;
}

export interface FormTemplate {
  queryFields: string[];
}

export class AzureFormExtractor {
  private client: DocumentAnalysisClient;

  constructor() {
    this.client = getClient();
  }

  // Main extraction pipeline
  async extractVisaForm(
    file: Buffer,
    formTemplate?: FormTemplate
  ): Promise<DocumentExtractionResult> {
    const startTime = Date.now();

    // Determine features based on document
    // Note: In the JS SDK, features are passed as strings in the options
    // 'keyValuePairs' is native to prebuilt-document, so we don't need to request it as a feature
    const features: string[] = [
      'languages',
      'barcodes',
      'ocr.font',
      'styles'
    ];

    // Add query fields if we have template
    let queryFields: string[] = [];
    if (formTemplate && formTemplate.queryFields.length > 0) {
      queryFields = formTemplate.queryFields;
      features.push('queryFields');
    }

    console.log(`[AzureFormExtractor] Analyzing document with features: ${features.join(', ')}`);

    // Analyze document using prebuilt-document (General Document) which supports KVPs
    // @ts-ignore - The SDK types might not be fully up to date with all features, but they are supported by the service
    const poller = await this.client.beginAnalyzeDocument(
      "prebuilt-document",
      file,
      {
        features: features as any, // Cast to any to bypass strict type checking if SDK is older
        queryFields: queryFields.length > 0 ? queryFields : undefined
      }
    );

    const analyzeResult = await poller.pollUntilDone();

    // Check for handwriting
    const hasHandwriting = analyzeResult.styles?.some(
      s => s.isHandwritten
    );

    const result: DocumentExtractionResult = {
      // Key-value pairs
      fields: this.extractKeyValuePairs(analyzeResult),

      // Query field results
      queryResults: this.extractQueryResults(analyzeResult),

      // Tables (travel history, employment, etc.)
      tables: this.extractTables(analyzeResult),

      // Checkboxes and radio buttons
      selectionMarks: this.extractSelectionMarks(analyzeResult),

      // Barcodes
      barcodes: this.extractBarcodes(analyzeResult),

      // Metadata
      metadata: {
        pageCount: analyzeResult.pages?.length || 0,
        languages: this.extractLanguages(analyzeResult),
        hasHandwriting: !!hasHandwriting,
        overallConfidence: this.calculateOverallConfidence(analyzeResult)
      },

      markdownOutput: this.generateMarkdownOutput(analyzeResult),
      extractionMethod: 'azure_document',
      processingTime: Date.now() - startTime
    };

    return result;
  }

  // Handle poor quality scans
  async extractWithHighResolution(file: Buffer): Promise<DocumentExtractionResult> {
    const startTime = Date.now();
    console.log('[AzureFormExtractor] Analyzing document with High Resolution OCR...');

    // @ts-ignore
    const poller = await this.client.beginAnalyzeDocument(
      "prebuilt-document",
      file,
      {
        features: [
          'ocr.highResolution'
        ] as any
      }
    );

    const analyzeResult = await poller.pollUntilDone();

    return {
      fields: this.extractKeyValuePairs(analyzeResult),
      queryResults: [],
      tables: this.extractTables(analyzeResult),
      selectionMarks: this.extractSelectionMarks(analyzeResult),
      barcodes: [],
      metadata: {
        pageCount: analyzeResult.pages?.length || 0,
        languages: [],
        hasHandwriting: false, // Not checking styles here
        overallConfidence: this.calculateOverallConfidence(analyzeResult)
      },
      markdownOutput: this.generateMarkdownOutput(analyzeResult),
      extractionMethod: 'azure_document',
      processingTime: Date.now() - startTime
    };
  }

  private extractKeyValuePairs(result: AnalyzeResult): ExtractedField[] {
    const fields: ExtractedField[] = [];

    if (result.keyValuePairs) {
      for (const kvp of result.keyValuePairs) {
        if (kvp.key && kvp.value) {
          const label = kvp.key.content || '';
          const value = kvp.value.content || '';
          const confidence = kvp.confidence || 0;

          if (label && value) {
            const polygon = kvp.key.boundingRegions?.[0]?.polygon;
            const boundingBox = polygon?.map((point) => [point.x, point.y]).flat();

            fields.push({
              label: label.trim(),
              value: value.trim(),
              confidence: Math.round(confidence * 100),
              type: inferFieldType(value),
              boundingBox,
            });
          }
        }
      }
    }
    return fields;
  }

  private extractQueryResults(result: AnalyzeResult): Array<{ field: string; value: string; confidence: number }> {
    const queryResults: Array<{ field: string; value: string; confidence: number }> = [];

    // Note: The SDK structure for query fields might vary.
    // Usually they appear in documents[0].fields if using prebuilt-layout with queryFields
    // Or in a specific property if using the latest API version.
    // We'll check documents[0].fields for now as that's common for custom/query fields.

    if (result.documents && result.documents.length > 0) {
      const doc = result.documents[0];
      if (doc.fields) {
        for (const [key, field] of Object.entries(doc.fields)) {
          // Filter out standard fields if any, though prebuilt-layout usually doesn't have them unless query fields are used
          if (field) {
            queryResults.push({
              field: key,
              value: field.content || '',
              confidence: Math.round((field.confidence || 0) * 100)
            });
          }
        }
      }
    }

    return queryResults;
  }

  private extractTables(result: AnalyzeResult): ExtractedTable[] {
    const tables: ExtractedTable[] = [];

    if (result.tables) {
      for (const table of result.tables) {
        tables.push({
          rowCount: table.rowCount,
          columnCount: table.columnCount,
          cells: table.cells.map(cell => ({
            rowIndex: cell.rowIndex,
            columnIndex: cell.columnIndex,
            content: cell.content,
            kind: (cell.kind || 'content') as 'content' | 'columnHeader' | 'rowHeader' | 'stubHead'
          }))
        });
      }
    }
    return tables;
  }

  private extractSelectionMarks(result: AnalyzeResult): ExtractedSelectionMark[] {
    const marks: ExtractedSelectionMark[] = [];

    // Selection marks can be found in pages
    if (result.pages) {
      for (const page of result.pages) {
        if (page.selectionMarks) {
          for (const mark of page.selectionMarks) {
            marks.push({
              state: (mark.state || 'unselected') as 'selected' | 'unselected',
              confidence: Math.round(mark.confidence * 100),
              boundingBox: mark.polygon ? mark.polygon.map(p => [p.x, p.y]).flat() : undefined
            });
          }
        }
      }
    }
    return marks;
  }

  private extractBarcodes(result: AnalyzeResult): ExtractedBarcode[] {
    const barcodes: ExtractedBarcode[] = [];

    if (result.pages) {
      for (const page of result.pages) {
        if (page.barcodes) {
          for (const barcode of page.barcodes) {
            barcodes.push({
              value: barcode.value,
              kind: barcode.kind,
              confidence: Math.round(barcode.confidence * 100)
            });
          }
        }
      }
    }
    return barcodes;
  }

  private extractLanguages(result: AnalyzeResult): ExtractedLanguage[] {
    const languages: ExtractedLanguage[] = [];

    // Languages are usually returned in the analyze result top level or pages
    if (result.languages) {
      for (const lang of result.languages) {
        languages.push({
          locale: lang.locale,
          confidence: Math.round(lang.confidence * 100)
        });
      }
    }
    return languages;
  }

  private calculateOverallConfidence(result: AnalyzeResult): number {
    let totalConfidence = 0;
    let count = 0;

    // Average of word confidences is a good proxy for OCR quality
    if (result.pages) {
      for (const page of result.pages) {
        if (page.words) {
          for (const word of page.words) {
            totalConfidence += word.confidence;
            count++;
          }
        }
      }
    }

    if (count === 0) return 0;
    return Math.round((totalConfidence / count) * 100);
  }

  private generateMarkdownOutput(result: AnalyzeResult): string {
    let markdown = '# Extracted Form Data\n\n';

    // Add Key-Value Pairs
    if (result.keyValuePairs && result.keyValuePairs.length > 0) {
      markdown += '## Fields\n\n';
      for (const kvp of result.keyValuePairs) {
        if (kvp.key && kvp.value) {
          markdown += `- **${kvp.key.content}**: ${kvp.value.content}\n`;
        }
      }
      markdown += '\n';
    }

    // Add Tables
    if (result.tables && result.tables.length > 0) {
      markdown += '## Tables\n\n';
      for (const table of result.tables) {
        // Simple markdown table generation
        // This is a basic approximation
        markdown += `### Table (Rows: ${table.rowCount}, Cols: ${table.columnCount})\n\n`;

        // Group cells by row
        const rows: string[][] = Array(table.rowCount).fill(null).map(() => Array(table.columnCount).fill(''));
        for (const cell of table.cells) {
          rows[cell.rowIndex][cell.columnIndex] = cell.content.replace(/\n/g, ' ');
        }

        // Header row
        markdown += '| ' + rows[0].join(' | ') + ' |\n';
        markdown += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';

        // Data rows
        for (let i = 1; i < rows.length; i++) {
          markdown += '| ' + rows[i].join(' | ') + ' |\n';
        }
        markdown += '\n';
      }
    }

    // Add Query Fields
    if (result.documents && result.documents.length > 0 && result.documents[0].fields) {
      markdown += '## Query Results\n\n';
      for (const [key, field] of Object.entries(result.documents[0].fields)) {
        if (field) {
          markdown += `- **${key}**: ${field.content}\n`;
        }
      }
    }

    return markdown;
  }
}

// Export singleton instance or helper functions for backward compatibility
export const azureFormExtractor = new AzureFormExtractor();

/**
 * Backward compatible function for existing code
 */
export async function extractFormFieldsWithLayout(
  pdfBuffer: Buffer
): Promise<DocumentExtractionResult> {
  return azureFormExtractor.extractVisaForm(pdfBuffer);
}

/**
 * Extract passport/ID information using Azure's prebuilt ID model
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
      queryResults: [],
      tables: [],
      selectionMarks: [],
      barcodes: [],
      metadata: {
        pageCount: result.pages?.length || 1,
        languages: [],
        hasHandwriting: false,
        overallConfidence
      },
      markdownOutput: '', // Could generate if needed
      extractionMethod: 'azure_prebuilt_id',
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

    // Quick analysis using document model (supports KVPs)
    const poller = await client.beginAnalyzeDocument('prebuilt-document', pdfBuffer);
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
