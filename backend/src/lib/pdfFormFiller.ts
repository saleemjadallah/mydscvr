/**
 * PDF Form Filler - Populate PDF forms programmatically
 *
 * Uses pdf-lib to:
 * - Load PDF templates
 * - Populate text fields, checkboxes, dropdowns
 * - Apply field transformations
 * - Generate filled PDFs
 * - Optionally flatten forms to prevent editing
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, rgb } from 'pdf-lib';
import type { CanonicalFieldPath } from './fieldMatcher';
import { applyTransform, formatDate, type DateFormat } from './fieldTransformers';
import { getCountryDateFormat, getCountryAddressFormat } from './countryRules';

export interface FieldPopulation {
  fieldId: string;
  formFieldLabel: string;
  value: string;
  canonicalPath?: CanonicalFieldPath;
  transform?: string;
  targetFormat?: DateFormat;
}

export interface FormPopulationResult {
  success: boolean;
  filledPdfBuffer: Buffer | null;
  populatedFields: number;
  skippedFields: number;
  errors: Array<{
    fieldId: string;
    error: string;
  }>;
  processingTime: number;
}

/**
 * Main function to fill a PDF form with user data
 */
export async function fillPDFForm(
  templatePdfBuffer: Buffer,
  fieldPopulations: FieldPopulation[],
  options: {
    flatten?: boolean; // Prevent further editing
    destinationCountry?: string;
  } = {}
): Promise<FormPopulationResult> {
  const startTime = Date.now();

  console.log(`[PDF Filler] Starting form population with ${fieldPopulations.length} fields...`);

  const errors: Array<{ fieldId: string; error: string }> = [];
  let populatedFields = 0;
  let skippedFields = 0;

  try {
    // Load the PDF template
    const pdfDoc = await PDFDocument.load(templatePdfBuffer);
    const form = pdfDoc.getForm();

    // Get all form fields for reference
    const formFields = form.getFields();
    console.log(`[PDF Filler] PDF contains ${formFields.length} form fields`);

    // Populate each field
    for (const fieldPop of fieldPopulations) {
      try {
        // Apply transformation if needed
        let value = fieldPop.value;

        if (fieldPop.transform) {
          value = applyTransform(value, fieldPop.transform, fieldPop.targetFormat);
        }

        // Try to populate the field
        const populated = await populateField(form, fieldPop.fieldId, value);

        if (populated) {
          populatedFields++;
        } else {
          skippedFields++;
          errors.push({
            fieldId: fieldPop.fieldId,
            error: 'Field not found in PDF or type mismatch',
          });
        }
      } catch (error) {
        console.error(`[PDF Filler] Error populating field ${fieldPop.fieldId}:`, error);
        skippedFields++;
        errors.push({
          fieldId: fieldPop.fieldId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Flatten form if requested (makes fields non-editable)
    if (options.flatten) {
      console.log('[PDF Filler] Flattening form (making fields non-editable)');
      form.flatten();
    }

    // Save the filled PDF
    const filledPdfBuffer = Buffer.from(await pdfDoc.save());

    const processingTime = Date.now() - startTime;

    console.log(
      `[PDF Filler] Form population complete. Populated: ${populatedFields}, Skipped: ${skippedFields}, Time: ${processingTime}ms`
    );

    return {
      success: errors.length < fieldPopulations.length / 2, // Success if less than 50% errors
      filledPdfBuffer,
      populatedFields,
      skippedFields,
      errors,
      processingTime,
    };
  } catch (error) {
    console.error('[PDF Filler] Fatal error during form population:', error);

    return {
      success: false,
      filledPdfBuffer: null,
      populatedFields,
      skippedFields,
      errors: [
        ...errors,
        {
          fieldId: 'general',
          error: error instanceof Error ? error.message : 'Unknown fatal error',
        },
      ],
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Populate a single form field
 */
async function populateField(form: PDFForm, fieldId: string, value: string): Promise<boolean> {
  try {
    // Try as text field first (most common)
    try {
      const textField = form.getTextField(fieldId);
      textField.setText(value);
      return true;
    } catch {
      // Not a text field, try other types
    }

    // Try as checkbox
    try {
      const checkbox = form.getCheckBox(fieldId);
      const isChecked = ['yes', 'true', '1', 'checked', 'x', '✓'].includes(
        value.toLowerCase().trim()
      );

      if (isChecked) {
        checkbox.check();
      } else {
        checkbox.uncheck();
      }
      return true;
    } catch {
      // Not a checkbox
    }

    // Try as dropdown
    try {
      const dropdown = form.getDropdown(fieldId);
      const options = dropdown.getOptions();

      // Find matching option (case-insensitive)
      const matchingOption = options.find(
        (opt) => opt.toLowerCase() === value.toLowerCase()
      );

      if (matchingOption) {
        dropdown.select(matchingOption);
        return true;
      } else {
        // Try to select the value anyway (might work)
        dropdown.select(value);
        return true;
      }
    } catch {
      // Not a dropdown
    }

    // Try as radio group
    try {
      const radioGroup = form.getRadioGroup(fieldId);
      const options = radioGroup.getOptions();

      const matchingOption = options.find(
        (opt) => opt.toLowerCase() === value.toLowerCase()
      );

      if (matchingOption) {
        radioGroup.select(matchingOption);
        return true;
      }
    } catch {
      // Not a radio group
    }

    // Field type not recognized
    console.warn(`[PDF Filler] Unable to populate field: ${fieldId} (unknown type)`);
    return false;
  } catch (error) {
    console.error(`[PDF Filler] Error populating field ${fieldId}:`, error);
    return false;
  }
}

/**
 * Extract all field names from a PDF form (for mapping)
 */
export async function extractPDFFieldNames(pdfBuffer: Buffer): Promise<
  Array<{
    fieldId: string;
    fieldType: string;
    defaultValue?: string;
  }>
> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const fieldInfo: Array<{
      fieldId: string;
      fieldType: string;
      defaultValue?: string;
    }> = [];

    for (const field of fields) {
      const name = field.getName();

      let fieldType = 'unknown';
      let defaultValue: string | undefined;

      // Determine field type
      try {
        const textField = form.getTextField(name);
        fieldType = 'text';
        defaultValue = textField.getText() || undefined;
      } catch {
        try {
          form.getCheckBox(name);
          fieldType = 'checkbox';
        } catch {
          try {
            const dropdown = form.getDropdown(name);
            fieldType = 'dropdown';
            defaultValue = dropdown.getSelected()[0] || undefined;
          } catch {
            try {
              form.getRadioGroup(name);
              fieldType = 'radio';
            } catch {
              fieldType = 'unknown';
            }
          }
        }
      }

      fieldInfo.push({
        fieldId: name,
        fieldType,
        defaultValue,
      });
    }

    console.log(`[PDF Filler] Extracted ${fieldInfo.length} field names from PDF`);

    return fieldInfo;
  } catch (error) {
    console.error('[PDF Filler] Error extracting field names:', error);
    return [];
  }
}

/**
 * Create field populations from user profile data
 */
export function createFieldPopulations(
  userProfile: any,
  fieldMappings: Array<{
    fieldId: string;
    canonicalPath: CanonicalFieldPath;
    transform?: string;
  }>,
  destinationCountry?: string
): FieldPopulation[] {
  const populations: FieldPopulation[] = [];

  for (const mapping of fieldMappings) {
    // Get value from user profile
    const value = getValueFromPath(userProfile, mapping.canonicalPath);

    if (value !== undefined && value !== null) {
      // Determine target format based on destination country
      let targetFormat: DateFormat | undefined;

      if (mapping.transform === 'date_format' && destinationCountry) {
        targetFormat = getCountryDateFormat(destinationCountry);
      }

      populations.push({
        fieldId: mapping.fieldId,
        formFieldLabel: mapping.canonicalPath,
        value: String(value),
        canonicalPath: mapping.canonicalPath,
        transform: mapping.transform,
        targetFormat,
      });
    }
  }

  return populations;
}

/**
 * Get value from object using dot-notation path
 */
function getValueFromPath(obj: any, path: string): any {
  const pathParts = path.split('.');

  let value: any = obj;

  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Check if PDF has fillable fields
 */
export async function hasFillableFields(pdfBuffer: Buffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    return fields.length > 0;
  } catch (error) {
    console.error('[PDF Filler] Error checking for fillable fields:', error);
    return false;
  }
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(pdfBuffer: Buffer): Promise<{
  pageCount: number;
  hasForm: boolean;
  fieldCount: number;
  title?: string;
  author?: string;
}> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    let fieldCount = 0;
    let hasForm = false;

    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      fieldCount = fields.length;
      hasForm = fieldCount > 0;
    } catch {
      // PDF doesn't have a form
    }

    return {
      pageCount: pdfDoc.getPageCount(),
      hasForm,
      fieldCount,
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
    };
  } catch (error) {
    console.error('[PDF Filler] Error getting PDF metadata:', error);

    return {
      pageCount: 0,
      hasForm: false,
      fieldCount: 0,
    };
  }
}

/**
 * Validate PDF is a valid form
 */
export async function validatePDFForm(pdfBuffer: Buffer): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Check if PDF is encrypted
    if (pdfDoc.isEncrypted) {
      errors.push('PDF is encrypted and cannot be filled');
    }

    // Check page count
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      errors.push('PDF has no pages');
    }

    if (pageCount > 20) {
      warnings.push('PDF has more than 20 pages. Processing may take longer.');
    }

    // Check for form fields
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      if (fields.length === 0) {
        errors.push('PDF has no fillable form fields');
      }

      if (fields.length > 200) {
        warnings.push('PDF has many form fields (>200). Processing may take longer.');
      }
    } catch (error) {
      errors.push('PDF does not contain a valid form');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid PDF file: ' + (error instanceof Error ? error.message : 'Unknown error')],
      warnings: [],
    };
  }
}

/**
 * Add watermark to PDF (e.g., "DRAFT" or "SAMPLE")
 */
export async function addWatermarkToPDF(
  pdfBuffer: Buffer,
  watermarkText: string
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Add semi-transparent watermark text
      page.drawText(watermarkText, {
        x: width / 2 - (watermarkText.length * 20) / 2,
        y: height / 2,
        size: 60,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
        rotate: { angle: 45, type: 0 },
      });
    }

    return Buffer.from(await pdfDoc.save());
  } catch (error) {
    console.error('[PDF Filler] Error adding watermark:', error);
    return pdfBuffer; // Return original if watermarking fails
  }
}
