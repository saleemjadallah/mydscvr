/**
 * Document Router - Intelligently routes PDF documents to optimal extraction service
 *
 * Strategy:
 * 1. High quality PDFs with clear text → Azure Document Intelligence (best accuracy)
 * 2. Low quality or handwritten PDFs → Gemini Flash (better OCR for edge cases)
 * 3. If Azure is not configured → Always use Gemini Flash
 */

import * as pdfParse from 'pdf-parse';
import {
  isAzureConfigured,
  extractFormFieldsWithLayout,
  extractPassportWithPrebuilt,
  assessDocumentQuality,
  type DocumentExtractionResult as AzureExtractionResult,
} from './azureDocumentIntelligence';
import {
  extractFormFieldsWithGemini,
  type GeminiExtractionResult,
} from './geminiVision';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createCanvas, loadImage } from 'canvas';

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
  const startTime = Date.now();

  try {
    // If Azure is configured, use prebuilt ID model
    if (isAzureConfigured()) {
      console.log('[Document Router] Using Azure Prebuilt ID model for passport extraction');

      const azureResult = await extractPassportWithPrebuilt(pdfBuffer);

      return {
        fields: azureResult.fields,
        extractionMethod: azureResult.extractionMethod,
        overallConfidence: azureResult.overallConfidence,
        pageCount: azureResult.pageCount,
        processingTime: azureResult.processingTime,
      };
    }

    // Fallback to Gemini if Azure not configured
    console.log('[Document Router] Azure not configured, using Gemini for passport extraction');

    const pdfPages = await convertPDFToBase64Images(pdfBuffer);
    const geminiResult = await extractFormFieldsWithGemini(pdfPages);

    return {
      fields: geminiResult.fields,
      extractionMethod: geminiResult.extractionMethod,
      overallConfidence: geminiResult.overallConfidence,
      pageCount: geminiResult.pageCount,
      processingTime: geminiResult.processingTime,
    };
  } catch (error) {
    console.error('[Document Router] Passport extraction failed:', error);
    throw new Error(`Passport extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract visa form fields with intelligent routing
 */
async function extractVisaForm(pdfBuffer: Buffer): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    // If Azure is not configured, go straight to Gemini
    if (!isAzureConfigured()) {
      console.log('[Document Router] Azure not configured, using Gemini Flash for all extractions');

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

    // Assess document quality to determine routing
    const qualityAssessment = await assessDocumentQuality(pdfBuffer);

    console.log(
      `[Document Router] Quality assessment: ${qualityAssessment.quality} (score: ${qualityAssessment.score})`
    );

    // High quality PDFs → Azure (better accuracy)
    if (qualityAssessment.quality === 'high') {
      console.log('[Document Router] Using Azure Document Intelligence (high quality)');

      const azureResult = await extractFormFieldsWithLayout(pdfBuffer);

      return {
        fields: azureResult.fields,
        extractionMethod: azureResult.extractionMethod,
        overallConfidence: azureResult.overallConfidence,
        pageCount: azureResult.pageCount,
        processingTime: azureResult.processingTime,
        qualityAssessment,
      };
    }

    // Low/medium quality → Try Azure first, fallback to Gemini if confidence is low
    if (qualityAssessment.quality === 'medium') {
      console.log('[Document Router] Trying Azure first (medium quality)');

      const azureResult = await extractFormFieldsWithLayout(pdfBuffer);

      // If Azure confidence is good enough, use it
      if (azureResult.overallConfidence >= 70) {
        console.log(`[Document Router] Azure extraction successful (confidence: ${azureResult.overallConfidence}%)`);

        return {
          fields: azureResult.fields,
          extractionMethod: azureResult.extractionMethod,
          overallConfidence: azureResult.overallConfidence,
          pageCount: azureResult.pageCount,
          processingTime: azureResult.processingTime,
          qualityAssessment,
        };
      }

      // Azure confidence too low, fallback to Gemini
      console.log(
        `[Document Router] Azure confidence low (${azureResult.overallConfidence}%), falling back to Gemini`
      );
    }

    // Low quality or low Azure confidence → Use Gemini
    console.log('[Document Router] Using Gemini Flash (low quality or handwritten content)');

    const pdfPages = await convertPDFToBase64Images(pdfBuffer);
    const geminiResult = await extractFormFieldsWithGemini(pdfPages);

    return {
      fields: geminiResult.fields,
      extractionMethod: geminiResult.extractionMethod,
      overallConfidence: geminiResult.overallConfidence,
      pageCount: geminiResult.pageCount,
      processingTime: geminiResult.processingTime,
      qualityAssessment,
    };
  } catch (error) {
    console.error('[Document Router] Form extraction failed:', error);
    throw new Error(`Form extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert PDF to base64-encoded PNG images (for Gemini Vision)
 */
async function convertPDFToBase64Images(pdfBuffer: Buffer): Promise<string[]> {
  try {
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    console.log(`[Document Router] Converting ${pageCount} PDF pages to images...`);

    // For now, we'll use a simplified approach
    // In production, you'd want to use a library like pdf-to-img or pdf2pic
    // that can properly render PDFs to images

    // Parse PDF to extract text and basic structure
    const pdfData = await pdfParse(pdfBuffer);

    // Create a simple placeholder image for each page
    // TODO: Replace with actual PDF rendering (e.g., using pdf2pic)
    const base64Pages: string[] = [];

    for (let i = 0; i < pageCount; i++) {
      // For MVP, we'll create a text-based representation
      // In production, render actual PDF pages to images
      const canvas = createCanvas(800, 1100);
      const ctx = canvas.getContext('2d');

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 800, 1100);

      // Add page number
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText(`Page ${i + 1} of ${pageCount}`, 20, 30);

      // Convert to base64
      const base64 = canvas.toBuffer('image/png').toString('base64');
      base64Pages.push(base64);
    }

    console.log(`[Document Router] Converted ${base64Pages.length} pages to base64 images`);

    return base64Pages;
  } catch (error) {
    console.error('[Document Router] PDF conversion failed:', error);
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect document type from PDF content
 */
export async function detectDocumentType(pdfBuffer: Buffer): Promise<DocumentType> {
  try {
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text.toLowerCase();

    // Passport indicators
    if (
      text.includes('passport') &&
      (text.includes('passport number') || text.includes('surname') || text.includes('given name'))
    ) {
      return 'passport';
    }

    // Visa form indicators
    if (
      text.includes('visa') ||
      text.includes('application') ||
      text.includes('entry permit') ||
      text.includes('immigration')
    ) {
      return 'visa_form';
    }

    // Default to supporting document
    return 'supporting_doc';
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
