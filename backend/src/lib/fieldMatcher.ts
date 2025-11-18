/**
 * Fuzzy Field Matcher - Intelligently maps extracted form fields to canonical profile data
 *
 * Uses Fuse.js for fuzzy string matching to handle variations in field labels across
 * different visa forms (e.g., "First Name" vs "Given Name" vs "Forename")
 */

import Fuse from 'fuse.js';
import type { ExtractedField } from './documentRouter';

// Canonical field paths in the user profile schema
export type CanonicalFieldPath =
  // Names
  | 'names.given'
  | 'names.middle'
  | 'names.family'
  | 'names.preferred'
  // Demographics
  | 'dateOfBirth'
  | 'placeOfBirth.city'
  | 'placeOfBirth.country'
  | 'nationality'
  | 'gender'
  | 'maritalStatus'
  // Contact
  | 'contact.email'
  | 'contact.phone.countryCode'
  | 'contact.phone.number'
  | 'contact.phone.type'
  // Address
  | 'currentAddress.streetNumber'
  | 'currentAddress.streetName'
  | 'currentAddress.unit'
  | 'currentAddress.city'
  | 'currentAddress.stateProvince'
  | 'currentAddress.postalCode'
  | 'currentAddress.country'
  // Passport
  | 'passport.number'
  | 'passport.issuingCountry'
  | 'passport.issueDate'
  | 'passport.expiryDate'
  | 'passport.type'
  // Employment (basic)
  | 'employment.currentEmployer'
  | 'employment.currentJobTitle'
  | 'employment.currentSalary'
  // Emergency contact
  | 'emergencyContact.name'
  | 'emergencyContact.relationship'
  | 'emergencyContact.phone';

// Field mapping definition
export interface FieldMapping {
  canonicalPath: CanonicalFieldPath;
  formFieldLabel: string;
  alternateLabels: string[];
  matchThreshold: number; // 0-100, minimum similarity score
  transform?: 'uppercase' | 'lowercase' | 'date_format' | 'phone_format' | 'custom';
  customTransform?: string;
}

// Comprehensive field mapping database
// Maps 50+ common visa form field variations to canonical profile fields
export const FIELD_MAPPINGS: FieldMapping[] = [
  // Given Name (First Name)
  {
    canonicalPath: 'names.given',
    formFieldLabel: 'Given Name',
    alternateLabels: [
      'First Name',
      'Forename',
      'Christian Name',
      'Personal Name',
      'Name (Given)',
      'Given Names',
      'First name(s)',
      'Prenom',
    ],
    matchThreshold: 80,
    transform: 'uppercase',
  },

  // Middle Name
  {
    canonicalPath: 'names.middle',
    formFieldLabel: 'Middle Name',
    alternateLabels: ['Middle Initial', 'Second Name', 'Middle Name(s)', 'Middle name (if any)'],
    matchThreshold: 85,
    transform: 'uppercase',
  },

  // Family Name (Last Name)
  {
    canonicalPath: 'names.family',
    formFieldLabel: 'Family Name',
    alternateLabels: [
      'Last Name',
      'Surname',
      'Name (Family)',
      'Family Name / Surname',
      'Apellido',
      'Nom de famille',
      'Last name(s)',
    ],
    matchThreshold: 80,
    transform: 'uppercase',
  },

  // Date of Birth
  {
    canonicalPath: 'dateOfBirth',
    formFieldLabel: 'Date of Birth',
    alternateLabels: [
      'DOB',
      'Birth Date',
      'Date of birth (DD/MM/YYYY)',
      'Date of birth (MM/DD/YYYY)',
      'Birthday',
      'D.O.B',
      'Date de naissance',
    ],
    matchThreshold: 85,
    transform: 'date_format',
  },

  // Place of Birth - City
  {
    canonicalPath: 'placeOfBirth.city',
    formFieldLabel: 'Place of Birth (City)',
    alternateLabels: ['City of Birth', 'Birth City', 'Town of Birth', 'Birthplace'],
    matchThreshold: 85,
  },

  // Place of Birth - Country
  {
    canonicalPath: 'placeOfBirth.country',
    formFieldLabel: 'Country of Birth',
    alternateLabels: ['Birth Country', 'Country of birth', 'Nationality at birth'],
    matchThreshold: 85,
  },

  // Nationality
  {
    canonicalPath: 'nationality',
    formFieldLabel: 'Nationality',
    alternateLabels: [
      'Citizenship',
      'Country of Citizenship',
      'National',
      'Citizen of',
      'Nationalité',
      'Current Nationality',
    ],
    matchThreshold: 85,
  },

  // Gender
  {
    canonicalPath: 'gender',
    formFieldLabel: 'Gender',
    alternateLabels: ['Sex', 'M/F', 'Male/Female', 'Sexe', 'Gender (M/F)'],
    matchThreshold: 90,
  },

  // Marital Status
  {
    canonicalPath: 'maritalStatus',
    formFieldLabel: 'Marital Status',
    alternateLabels: ['Civil Status', 'Marriage Status', 'Single/Married', 'État civil'],
    matchThreshold: 85,
  },

  // Email
  {
    canonicalPath: 'contact.email',
    formFieldLabel: 'Email Address',
    alternateLabels: ['Email', 'E-mail', 'Electronic Mail', 'Contact Email', 'E-mail address'],
    matchThreshold: 85,
    transform: 'lowercase',
  },

  // Phone Number
  {
    canonicalPath: 'contact.phone.number',
    formFieldLabel: 'Phone Number',
    alternateLabels: [
      'Telephone',
      'Mobile Number',
      'Contact Number',
      'Tel',
      'Phone',
      'Cell Phone',
      'Téléphone',
      'Mobile phone',
    ],
    matchThreshold: 80,
    transform: 'phone_format',
  },

  // Street Address
  {
    canonicalPath: 'currentAddress.streetName',
    formFieldLabel: 'Street Address',
    alternateLabels: [
      'Address Line 1',
      'Street',
      'Address',
      'Residential Address',
      'Home Address',
      'Street Name',
      'Address (Street)',
    ],
    matchThreshold: 75,
  },

  // Apartment/Unit
  {
    canonicalPath: 'currentAddress.unit',
    formFieldLabel: 'Apartment/Unit',
    alternateLabels: ['Address Line 2', 'Unit Number', 'Apt', 'Suite', 'Flat Number', 'Unit #'],
    matchThreshold: 80,
  },

  // City
  {
    canonicalPath: 'currentAddress.city',
    formFieldLabel: 'City',
    alternateLabels: ['Town', 'City/Town', 'Municipality', 'Ville', 'City of Residence'],
    matchThreshold: 90,
  },

  // State/Province
  {
    canonicalPath: 'currentAddress.stateProvince',
    formFieldLabel: 'State/Province',
    alternateLabels: ['State', 'Province', 'Region', 'County', 'État/Province', 'State or Province'],
    matchThreshold: 85,
  },

  // Postal Code
  {
    canonicalPath: 'currentAddress.postalCode',
    formFieldLabel: 'Postal Code',
    alternateLabels: ['ZIP Code', 'Post Code', 'ZIP', 'Postcode', 'Code postal', 'Postal/ZIP Code'],
    matchThreshold: 85,
  },

  // Country of Residence
  {
    canonicalPath: 'currentAddress.country',
    formFieldLabel: 'Country of Residence',
    alternateLabels: ['Country', 'Resident Country', 'Current Country', 'Pays', 'Country of Address'],
    matchThreshold: 80,
  },

  // Passport Number
  {
    canonicalPath: 'passport.number',
    formFieldLabel: 'Passport Number',
    alternateLabels: [
      'Passport No',
      'Passport #',
      'Travel Document Number',
      'Passport No.',
      'Numéro de passeport',
      'Passport Number / Travel Document Number',
    ],
    matchThreshold: 85,
    transform: 'uppercase',
  },

  // Passport Issuing Country
  {
    canonicalPath: 'passport.issuingCountry',
    formFieldLabel: 'Passport Issuing Country',
    alternateLabels: [
      'Country of Issue',
      'Issuing Country',
      'Issued by',
      'Passport Issued In',
      'Country/Authority Issuing Passport',
    ],
    matchThreshold: 80,
  },

  // Passport Issue Date
  {
    canonicalPath: 'passport.issueDate',
    formFieldLabel: 'Passport Issue Date',
    alternateLabels: [
      'Date of Issue',
      'Issue Date',
      'Passport Issued On',
      'Date Issued',
      'Date of Issue (DD/MM/YYYY)',
    ],
    matchThreshold: 85,
    transform: 'date_format',
  },

  // Passport Expiry Date
  {
    canonicalPath: 'passport.expiryDate',
    formFieldLabel: 'Passport Expiry Date',
    alternateLabels: [
      'Expiry Date',
      'Date of Expiry',
      'Valid Until',
      'Expiration Date',
      'Passport Expires On',
      'Date of Expiry (DD/MM/YYYY)',
    ],
    matchThreshold: 85,
    transform: 'date_format',
  },

  // Passport Type
  {
    canonicalPath: 'passport.type',
    formFieldLabel: 'Passport Type',
    alternateLabels: ['Type of Passport', 'Document Type', 'Passport Category', 'Type'],
    matchThreshold: 85,
  },

  // Current Employer
  {
    canonicalPath: 'employment.currentEmployer',
    formFieldLabel: 'Current Employer',
    alternateLabels: [
      'Employer',
      'Company Name',
      'Organization',
      'Current Company',
      'Employer Name',
      'Name of Employer',
    ],
    matchThreshold: 80,
  },

  // Job Title
  {
    canonicalPath: 'employment.currentJobTitle',
    formFieldLabel: 'Job Title',
    alternateLabels: ['Occupation', 'Position', 'Title', 'Current Position', 'Job Position', 'Profession'],
    matchThreshold: 80,
  },

  // Emergency Contact Name
  {
    canonicalPath: 'emergencyContact.name',
    formFieldLabel: 'Emergency Contact Name',
    alternateLabels: [
      'Emergency Contact',
      'Contact Person',
      'Next of Kin',
      'Person to Contact in Emergency',
      'Emergency Contact (Name)',
    ],
    matchThreshold: 75,
  },

  // Emergency Contact Relationship
  {
    canonicalPath: 'emergencyContact.relationship',
    formFieldLabel: 'Emergency Contact Relationship',
    alternateLabels: [
      'Relationship to Emergency Contact',
      'Relationship',
      'Emergency Contact (Relationship)',
      'Relation to Contact Person',
    ],
    matchThreshold: 75,
  },

  // Emergency Contact Phone
  {
    canonicalPath: 'emergencyContact.phone',
    formFieldLabel: 'Emergency Contact Phone',
    alternateLabels: [
      'Emergency Contact Number',
      'Emergency Phone',
      'Contact Person Phone',
      'Emergency Contact (Phone)',
    ],
    matchThreshold: 75,
    transform: 'phone_format',
  },
];

// Matching result
export interface FieldMatchResult {
  extractedField: ExtractedField;
  canonicalPath: CanonicalFieldPath | null;
  confidence: number;
  needsTransform: boolean;
  transform?: string;
  suggestion?: string;
}

/**
 * Match a single extracted field to canonical profile field
 */
export function matchFieldToCanonical(extractedLabel: string): FieldMatchResult | null {
  // Create Fuse instance for fuzzy matching
  const fuse = new Fuse(FIELD_MAPPINGS, {
    keys: ['formFieldLabel', 'alternateLabels'],
    threshold: 0.3, // Lower = stricter matching (0.0 = perfect match, 1.0 = match anything)
    includeScore: true,
    minMatchCharLength: 3,
  });

  // Search for matches
  const results = fuse.search(extractedLabel);

  if (results.length === 0) {
    return null;
  }

  // Get best match
  const best = results[0];
  const mapping = best.item;

  // Convert Fuse score (0 = perfect, 1 = terrible) to confidence (0-100)
  const confidence = Math.round((1 - (best.score || 0)) * 100);

  // Check if confidence meets threshold
  if (confidence < mapping.matchThreshold) {
    return null;
  }

  return {
    extractedField: {
      label: extractedLabel,
      value: '',
      confidence: confidence,
      type: 'text',
    },
    canonicalPath: mapping.canonicalPath,
    confidence,
    needsTransform: !!mapping.transform,
    transform: mapping.transform || mapping.customTransform,
    suggestion: `Matched to ${mapping.canonicalPath} with ${confidence}% confidence`,
  };
}

/**
 * Match multiple extracted fields to canonical profile fields
 */
export function matchExtractedFields(extractedFields: ExtractedField[]): FieldMatchResult[] {
  const matches: FieldMatchResult[] = [];

  for (const field of extractedFields) {
    const match = matchFieldToCanonical(field.label);

    if (match) {
      // Update with actual extracted field data
      match.extractedField = field;
      matches.push(match);
    } else {
      // Keep unmatched fields with null canonical path
      matches.push({
        extractedField: field,
        canonicalPath: null,
        confidence: 0,
        needsTransform: false,
        suggestion: 'No matching profile field found - may need manual mapping',
      });
    }
  }

  console.log(`[Field Matcher] Matched ${matches.filter((m) => m.canonicalPath).length}/${extractedFields.length} fields`);

  return matches;
}

/**
 * Get value from user profile using canonical path
 * (e.g., "names.given" → profile.names.given)
 */
export function getValueFromProfile(profile: any, canonicalPath: CanonicalFieldPath): string | undefined {
  const pathParts = canonicalPath.split('.');

  let value: any = profile;

  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value !== null && value !== undefined ? String(value) : undefined;
}

/**
 * Create field mapping suggestions for unmapped fields
 */
export function suggestFieldMappings(unmappedFields: ExtractedField[]): Array<{
  fieldLabel: string;
  suggestedPath: CanonicalFieldPath;
  confidence: number;
  reason: string;
}> {
  const suggestions: Array<{
    fieldLabel: string;
    suggestedPath: CanonicalFieldPath;
    confidence: number;
    reason: string;
  }> = [];

  for (const field of unmappedFields) {
    // Use Fuse with very relaxed threshold to get *any* matches
    const fuse = new Fuse(FIELD_MAPPINGS, {
      keys: ['formFieldLabel', 'alternateLabels'],
      threshold: 0.6, // More relaxed
      includeScore: true,
    });

    const results = fuse.search(field.label);

    if (results.length > 0) {
      const best = results[0];
      const confidence = Math.round((1 - (best.score || 0)) * 100);

      suggestions.push({
        fieldLabel: field.label,
        suggestedPath: best.item.canonicalPath,
        confidence,
        reason: `Possible match to ${best.item.formFieldLabel} (${confidence}% similar)`,
      });
    }
  }

  return suggestions;
}
