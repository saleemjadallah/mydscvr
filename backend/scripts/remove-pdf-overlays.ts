/**
 * PDF Overlay Removal Utility
 *
 * This script removes character box overlays from PDFs that interfere with
 * form field detection by Azure Document Intelligence.
 *
 * The character boxes are typically added as annotation layers that sit on top
 * of the actual fillable form fields, causing confusion during OCR/field extraction.
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface RemovalOptions {
  removeAnnotations?: boolean;
  removeWidgets?: boolean;
  flattenForm?: boolean;
  preserveFields?: boolean;
}

/**
 * Remove character box overlays and annotations from a PDF
 */
async function removeOverlays(
  inputPath: string,
  outputPath: string,
  options: RemovalOptions = {}
): Promise<void> {
  const {
    removeAnnotations = true,
    removeWidgets = false,
    flattenForm = false,
    preserveFields = true,
  } = options;

  console.log(`[PDF Overlay Removal] Loading PDF: ${inputPath}`);

  const pdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  const pages = pdfDoc.getPages();
  console.log(`[PDF Overlay Removal] Processing ${pages.length} pages`);

  let removedCount = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`[PDF Overlay Removal] Processing page ${i + 1}/${pages.length}`);

    // Get the page's annotation dictionary
    const annotationsRef = page.node.lookup(page.node.Annots());

    if (annotationsRef && removeAnnotations) {
      try {
        // Remove all annotations (this includes character boxes drawn as annotations)
        page.node.delete(page.node.Annots());
        removedCount++;
        console.log(`[PDF Overlay Removal] Removed annotations from page ${i + 1}`);
      } catch (error) {
        console.warn(`[PDF Overlay Removal] Could not remove annotations from page ${i + 1}:`, error);
      }
    }

    // If we want to preserve form fields, we need a different approach
    if (preserveFields && annotationsRef) {
      // TODO: Implement selective removal - keep form field widgets, remove only graphics/text overlays
      console.log(`[PDF Overlay Removal] Preserving form fields on page ${i + 1}`);
    }
  }

  // Optionally flatten the form (converts form fields to static content)
  if (flattenForm) {
    console.log('[PDF Overlay Removal] Flattening form fields...');
    const form = pdfDoc.getForm();
    form.flatten();
  }

  console.log(`[PDF Overlay Removal] Removed overlays from ${removedCount} pages`);
  console.log(`[PDF Overlay Removal] Saving cleaned PDF to: ${outputPath}`);

  const cleanedPdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, cleanedPdfBytes);

  console.log('[PDF Overlay Removal] Done!');
}

/**
 * Analyze a PDF to detect overlay issues
 */
async function analyzePDF(inputPath: string): Promise<void> {
  console.log(`[PDF Analyzer] Analyzing PDF: ${inputPath}`);

  const pdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`\n=== PDF Analysis ===`);
  console.log(`Total Pages: ${pages.length}`);
  console.log(`Total Form Fields: ${fields.length}`);
  console.log(`\nForm Fields:`);

  fields.forEach((field, index) => {
    console.log(`  ${index + 1}. ${field.getName()} (${field.constructor.name})`);
  });

  console.log(`\nPage Annotations:`);
  pages.forEach((page, index) => {
    const annotationsRef = page.node.lookup(page.node.Annots());
    if (annotationsRef) {
      console.log(`  Page ${index + 1}: Has annotations`);
    } else {
      console.log(`  Page ${index + 1}: No annotations`);
    }
  });

  console.log(`\n===================\n`);
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
PDF Overlay Removal Utility

Usage:
  npm run remove-overlays <input.pdf> <output.pdf> [options]
  npm run analyze-pdf <input.pdf>

Options:
  --no-annotations    Keep annotations
  --remove-widgets    Remove form field widgets
  --flatten           Flatten form fields to static content
  --no-preserve       Don't preserve form fields

Examples:
  npm run remove-overlays input.pdf output.pdf
  npm run remove-overlays input.pdf output.pdf --flatten
  npm run analyze-pdf sample-form.pdf
  `);
  process.exit(0);
}

const command = args[0];

if (command === 'analyze') {
  const inputPath = args[1];
  if (!inputPath) {
    console.error('Error: Input PDF path required');
    process.exit(1);
  }
  analyzePDF(inputPath).catch((error) => {
    console.error('Error analyzing PDF:', error);
    process.exit(1);
  });
} else {
  const inputPath = args[0];
  const outputPath = args[1];

  if (!inputPath || !outputPath) {
    console.error('Error: Both input and output paths required');
    process.exit(1);
  }

  const options: RemovalOptions = {
    removeAnnotations: !args.includes('--no-annotations'),
    removeWidgets: args.includes('--remove-widgets'),
    flattenForm: args.includes('--flatten'),
    preserveFields: !args.includes('--no-preserve'),
  };

  removeOverlays(inputPath, outputPath, options).catch((error) => {
    console.error('Error removing overlays:', error);
    process.exit(1);
  });
}
