/**
 * Document Router - Intelligently routes PDF documents to optimal extraction service
 *
 * Strategy:
 * 1. Try Azure Document Intelligence first for all documents if configured.
 * 2. If Azure fails or is not configured, fall back to Gemini Vision.
 * 3. For Gemini, convert PDF pages to images for processing.
 */

import {
  isAzureConfigured,
  extractFormFieldsWithLayout,
  extractPassportWithPrebuilt,
  assessDocumentQuality,
} from './azureDocumentIntelligence.js';
import {
  extractFormFieldsWithGemini,
} from './geminiVision.js';
import * as pdfjs from 'pdfjs-dist';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';

// Set workerSrc to null to prevent it from trying to load a worker script.
pdfjs.GlobalWorkerOptions.workerSrc = '';


// Unified extraction result interface
export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  type: 'text' | 'date' | 'number' | 'checkbox' | 'signature';
  boundingBox?: number[];
}

export interface ExtractionResult {
  fields: ExtractedField[];
  extractionMethod: 'azure_layout' | 'azure_prebuilt_id' | 'gemini_flash';
  overallConfidence: number;
  pageCount: number;
  processingTime: number;
  qualityAssessment?: {
    quality: 'high' | 'medium' | 'low';
    score: number;
    reasons: string[];
  };
}

export type DocumentType = 'visa_form' | 'passport' | 'supporting_doc';

/**
 * Main extraction router - automatically selects best extraction service
 */
export async function extractFormFields(
  pdfBuffer: Buffer,
  documentType: DocumentType = 'visa_form'
): Promise<ExtractionResult> {
  console.log(`[Document Router] Processing ${documentType} (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

  // Special handling for passport documents
  if (documentType === 'passport') {
    return extractPassportDocument(pdfBuffer);
  }

  // For visa forms and supporting documents
  return extractVisaForm(pdfBuffer);
}

/**
 * Extract passport/ID document
 * Prefers Azure's specialized ID model, falls back to Gemini
 */
async function extractPassportDocument(pdfBuffer: Buffer): Promise<ExtractionResult> {
  if (isAzureConfigured()) {
    try {
      console.log('[Document Router] Using Azure Prebuilt ID model for passport extraction');
      const azureResult = await extractPassportWithPrebuilt(pdfBuffer);
      return {
        fields: azureResult.fields,
        extractionMethod: azureResult.extractionMethod,
        overallConfidence: azureResult.overallConfidence,
        pageCount: azureResult.pageCount,
        processingTime: azureResult.processingTime,
      };
    } catch (azureError) {
      console.warn('[Document Router] Azure passport extraction failed, falling back to Gemini.', azureError);
    }
  }

  // Fallback to Gemini
  console.log('[Document Router] Using Gemini for passport extraction');
  const pdfPages = await convertPDFToBase64Images(pdfBuffer);
  const geminiResult = await extractFormFieldsWithGemini(pdfPages);
  return {
    fields: geminiResult.fields,
    extractionMethod: geminiResult.extractionMethod,
    overallConfidence: geminiResult.overallConfidence,
    pageCount: geminiResult.pageCount,
    processingTime: geminiResult.processingTime,
  };
}

/**
 * Extract visa form fields with intelligent routing
 */
async function extractVisaForm(pdfBuffer: Buffer): Promise<ExtractionResult> {
  if (isAzureConfigured()) {
    try {
      console.log('[Document Router] Using Azure Document Intelligence for form extraction');
      const qualityAssessment = await assessDocumentQuality(pdfBuffer);
      console.log(
        `[Document Router] Quality assessment: ${qualityAssessment.quality} (score: ${qualityAssessment.score})`
      );
      const azureResult = await extractFormFieldsWithLayout(pdfBuffer);
      return {
        fields: azureResult.fields,
        extractionMethod: azureResult.extractionMethod,
        overallConfidence: azureResult.overallConfidence,
        pageCount: azureResult.pageCount,
        processingTime: azureResult.processingTime,
        qualityAssessment,
      };
    } catch (azureError) {
      console.warn('[Document Router] Azure form extraction failed, falling back to Gemini.', azureError);
    }
  }

  // Fallback to Gemini
  console.log('[Document Router] Using Gemini Flash for form extraction');
  const pdfPages = await convertPDFToBase64Images(pdfBuffer);
  const geminiResult = await extractFormFieldsWithGemini(pdfPages);
  const qualityAssessment = await assessDocumentQuality(pdfBuffer);
  return {
    fields: geminiResult.fields,
    extractionMethod: geminiResult.extractionMethod,
    overallConfidence: geminiResult.overallConfidence,
    pageCount: geminiResult.pageCount,
    processingTime: geminiResult.processingTime,
    qualityAssessment,
  };
}

/**
 * Convert PDF to base64-encoded PNG images (for Gemini Vision)
 */
async function convertPDFToBase64Images(pdfBuffer: Buffer): Promise<string[]> {
  const base64Pages: string[] = [];
  const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  console.log(`[Document Router] Converting ${pageCount} PDF pages to images...`);

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(viewport.width, viewport.height) as Canvas;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;
    base64Pages.push(canvas.toDataURL('image/png'));
  }

  console.log(`[Document Router] PDF conversion complete.`);
  return base64Pages;
}

/**
 * Detect document type from PDF content
 */
export async function detectDocumentType(_pdfBuffer: Buffer): Promise<DocumentType> {
  try {
    // For MVP: Default to visa_form
    // In production, you could use Azure DI or Gemini to detect document type
    // or add more sophisticated heuristics
    return 'visa_form';
  } catch (error) {
    console.error('[Document Router] Document type detection failed:', error);
    return 'visa_form'; // Default assumption
  }
}

/**
 * Get cost estimate for extraction
 */
export function estimateExtractionCost(pageCount: number, quality: 'high' | 'medium' | 'low'): number {
  // Azure Document Intelligence: ~$0.01 per page
  // Gemini Flash: ~$0.001-0.005 per request

  if (!isAzureConfigured()) {
    // Gemini only
    return 0.005;
  }

  if (quality === 'high') {
    // Azure
    return pageCount * 0.01;
  }

  if (quality === 'medium') {
    // Might use either (assume 50/50)
    return pageCount * 0.0055;
  }

  // Low quality → Gemini
  return 0.005;
}
