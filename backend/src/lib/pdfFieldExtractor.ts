/**
 * PDF Form Field Extractor
 *
 * Extracts actual fillable form field definitions from PDFs using pdf-lib.
 * This bypasses character box overlays and gets the real form structure.
 */

import { PDFDocument } from 'pdf-lib';

export interface PDFFormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'button';
  value?: string;
  defaultValue?: string;
  maxLength?: number;
  readOnly: boolean;
  required: boolean;
  pageNumber?: number;
  rect?: number[]; // [x, y, width, height]
}

export interface PDFFormStructure {
  fields: PDFFormField[];
  totalFields: number;
  pageCount: number;
  hasOverlays: boolean;
}

/**
 * Extract form field definitions directly from PDF structure
 * This ignores visual overlays and gets the actual form fields
 */
export async function extractPDFFormFields(pdfBuffer: Buffer): Promise<PDFFormStructure> {
  console.log('[PDF Field Extractor] Loading PDF...');

  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  const formFields = form.getFields();

  console.log(`[PDF Field Extractor] Found ${formFields.length} form fields across ${pages.length} pages`);

  const fields: PDFFormField[] = [];

  for (const field of formFields) {
    const fieldName = field.getName();
    let fieldType: PDFFormField['type'] = 'text';
    let value: string | undefined;
    let maxLength: number | undefined;
    let readOnly = false;
    let required = false;

    // Determine field type and extract properties
    try {
      if (field.constructor.name === 'PDFTextField') {
        fieldType = 'text';
        const textField = field as any;
        value = textField.getText?.() || '';
        maxLength = textField.getMaxLength?.();
        readOnly = textField.isReadOnly?.() || false;
      } else if (field.constructor.name === 'PDFCheckBox') {
        fieldType = 'checkbox';
        const checkboxField = field as any;
        value = checkboxField.isChecked?.() ? 'checked' : 'unchecked';
        readOnly = checkboxField.isReadOnly?.() || false;
      } else if (field.constructor.name === 'PDFRadioGroup') {
        fieldType = 'radio';
        const radioField = field as any;
        value = radioField.getSelected?.() || '';
        readOnly = radioField.isReadOnly?.() || false;
      } else if (field.constructor.name === 'PDFDropdown') {
        fieldType = 'dropdown';
        const dropdownField = field as any;
        value = dropdownField.getSelected?.()?.join(', ') || '';
        readOnly = dropdownField.isReadOnly?.() || false;
      } else if (field.constructor.name === 'PDFSignature') {
        fieldType = 'signature';
      } else if (field.constructor.name === 'PDFButton') {
        fieldType = 'button';
      }
    } catch (error) {
      console.warn(`[PDF Field Extractor] Error processing field "${fieldName}":`, error);
    }

    fields.push({
      name: fieldName,
      type: fieldType,
      value,
      maxLength,
      readOnly,
      required,
    });
  }

  // Check for annotations that might be overlays
  // Note: This is a simplified check - a more robust implementation would
  // require direct PDF dictionary access
  let hasOverlays = false;
  try {
    // Check if any page has annotations (potential overlays)
    for (const page of pages) {
      const pageDict = page.node;
      const annotsRef = pageDict.get(pageDict.context.obj('Annots'));
      if (annotsRef) {
        hasOverlays = true;
        break;
      }
    }
  } catch (error) {
    // Unable to check for overlays, assume false
    hasOverlays = false;
  }

  return {
    fields,
    totalFields: fields.length,
    pageCount: pages.length,
    hasOverlays,
  };
}

/**
 * Generate field labels from form field names
 * Converts camelCase, snake_case, or abbreviated names to readable labels
 */
export function generateFieldLabel(fieldName: string): string {
  // Remove common prefixes
  let label = fieldName.replace(/^(form|field|input|txt|chk)_?/gi, '');

  // Convert camelCase to spaces
  label = label.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Convert snake_case or kebab-case to spaces
  label = label.replace(/[_-]/g, ' ');

  // Remove numbers that are just for indexing
  label = label.replace(/\d+$/g, '').trim();

  // Capitalize first letter of each word
  label = label
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return label || fieldName;
}

/**
 * Match extracted PDF fields with Azure Document Intelligence results
 * This helps correlate the visual field detection with actual form structure
 */
export function correlateFields(
  pdfFields: PDFFormField[],
  azureFields: Array<{ label: string; value: string; confidence: number }>
): Array<{
  fieldName: string;
  detectedLabel: string;
  generatedLabel: string;
  type: string;
  confidence: number;
  matched: boolean;
}> {
  const correlations = [];

  for (const pdfField of pdfFields) {
    const generatedLabel = generateFieldLabel(pdfField.name);

    // Try to find a match in Azure results
    const azureMatch = azureFields.find(af =>
      af.label.toLowerCase().includes(generatedLabel.toLowerCase()) ||
      generatedLabel.toLowerCase().includes(af.label.toLowerCase()) ||
      af.label.toLowerCase().includes(pdfField.name.toLowerCase())
    );

    correlations.push({
      fieldName: pdfField.name,
      detectedLabel: azureMatch?.label || '',
      generatedLabel,
      type: pdfField.type,
      confidence: azureMatch?.confidence || 0,
      matched: !!azureMatch,
    });
  }

  return correlations;
}
