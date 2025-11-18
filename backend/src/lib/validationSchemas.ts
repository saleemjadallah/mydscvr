/**
 * Zod Validation Schemas (Tier 1 Validation)
 *
 * Client-side and basic server-side validation using Zod
 * Fast, synchronous validation for immediate user feedback
 */

import { z } from 'zod';

/**
 * Name validation schema
 */
export const nameSchema = z.object({
  given: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  middle: z
    .string()
    .max(50, 'Middle name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]*$/, 'Middle name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),

  family: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  preferred: z
    .string()
    .max(50, 'Preferred name must be less than 50 characters')
    .optional(),

  aliases: z.array(z.string().max(100)).optional(),
});

/**
 * Date validation schema
 */
export const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in ISO format (YYYY-MM-DD)'
  )
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    'Invalid date'
  );

/**
 * Date of birth validation
 */
export const dateOfBirthSchema = dateSchema.refine(
  (date) => {
    const dob = new Date(date);
    const now = new Date();
    const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 0 && age <= 120;
  },
  'Date of birth must result in age between 0 and 120 years'
);

/**
 * Place of birth schema
 */
export const placeOfBirthSchema = z.object({
  city: z.string().min(1, 'City of birth is required').max(100),
  country: z
    .string()
    .length(3, 'Country code must be ISO 3166-1 alpha-3 (3 characters)')
    .regex(/^[A-Z]{3}$/, 'Country code must be uppercase letters'),
});

/**
 * Contact information schema
 */
export const contactSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),

  phone: z.object({
    countryCode: z
      .string()
      .regex(/^\+\d{1,4}$/, 'Country code must start with + and contain 1-4 digits'),

    number: z
      .string()
      .min(6, 'Phone number must be at least 6 digits')
      .max(15, 'Phone number must be less than 15 digits')
      .regex(/^\d+$/, 'Phone number must contain only digits'),

    type: z.enum(['mobile', 'home', 'work']).default('mobile'),
  }),
});

/**
 * Address schema
 */
export const addressSchema = z.object({
  streetNumber: z.string().max(20).optional(),

  streetName: z
    .string()
    .min(1, 'Street name is required')
    .max(200, 'Street name must be less than 200 characters'),

  unit: z.string().max(50).optional(),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),

  stateProvince: z
    .string()
    .max(100, 'State/Province must be less than 100 characters')
    .optional(),

  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code format'),

  country: z
    .string()
    .length(3, 'Country code must be ISO 3166-1 alpha-3 (3 characters)')
    .regex(/^[A-Z]{3}$/, 'Country code must be uppercase letters'),
});

/**
 * Passport schema
 */
export const passportSchema = z.object({
  number: z
    .string()
    .min(6, 'Passport number must be at least 6 characters')
    .max(20, 'Passport number must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/i, 'Passport number must contain only letters and numbers')
    .optional(), // Optional because we may not store it

  issuingCountry: z
    .string()
    .length(3, 'Country code must be ISO 3166-1 alpha-3')
    .regex(/^[A-Z]{3}$/, 'Country code must be uppercase letters'),

  issueDate: dateSchema.optional(),

  expiryDate: dateSchema.refine(
    (date) => {
      const expiry = new Date(date);
      const now = new Date();
      return expiry > now;
    },
    'Passport expiry date must be in the future'
  ),

  type: z.enum(['ordinary', 'diplomatic', 'official', 'service', 'emergency']).default('ordinary').optional(),
});

/**
 * Emergency contact schema
 */
export const emergencyContactSchema = z.object({
  name: z
    .string()
    .min(1, 'Emergency contact name is required')
    .max(100, 'Name must be less than 100 characters'),

  relationship: z
    .string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship must be less than 50 characters'),

  phone: z
    .string()
    .regex(/^\+?\d[\d\s-]{6,}$/, 'Invalid phone number format')
    .max(30, 'Phone number must be less than 30 characters'),
});

/**
 * Employment schema (basic)
 */
export const employmentSchema = z.object({
  currentEmployer: z
    .string()
    .max(200, 'Employer name must be less than 200 characters')
    .optional(),

  currentJobTitle: z
    .string()
    .max(100, 'Job title must be less than 100 characters')
    .optional(),

  currentSalary: z
    .number()
    .positive('Salary must be positive')
    .optional(),
});

/**
 * Complete user profile schema
 */
export const userProfileSchema = z.object({
  names: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  placeOfBirth: placeOfBirthSchema.optional(),
  nationality: z
    .string()
    .length(3, 'Nationality must be ISO 3166-1 alpha-3')
    .regex(/^[A-Z]{3}$/, 'Nationality must be uppercase letters'),
  gender: z.enum(['male', 'female', 'other']),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  contact: contactSchema,
  currentAddress: addressSchema,
  passport: passportSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  employment: employmentSchema.optional(),
});

/**
 * Form field value schema
 */
export const formFieldValueSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  label: z.string().min(1, 'Field label is required'),
  value: z.string(),
  type: z.enum(['text', 'date', 'number', 'checkbox', 'signature']),
  confidence: z.number().min(0).max(100).optional(),
  source: z.enum(['auto_populated', 'extracted', 'user_input']).default('user_input'),
});

/**
 * Filled form submission schema
 */
export const filledFormSubmissionSchema = z.object({
  templateId: z.string().uuid('Invalid template ID').optional(),
  fields: z.array(formFieldValueSchema).min(1, 'At least one field is required'),
  destinationCountry: z
    .string()
    .length(3, 'Country code must be ISO 3166-1 alpha-3')
    .optional(),
  travelDate: dateSchema.optional(),
});

/**
 * Validation helpers
 */

/**
 * Validate user profile data
 */
export function validateUserProfile(data: unknown) {
  return userProfileSchema.safeParse(data);
}

/**
 * Validate form field
 */
export function validateFormField(data: unknown) {
  return formFieldValueSchema.safeParse(data);
}

/**
 * Validate passport expiry against travel date
 */
export function validatePassportExpiry(
  expiryDate: string,
  travelDate: string,
  requiredMonths: number = 6
): { success: boolean; message?: string } {
  try {
    const expiry = new Date(expiryDate);
    const travel = new Date(travelDate);

    if (isNaN(expiry.getTime()) || isNaN(travel.getTime())) {
      return { success: false, message: 'Invalid date format' };
    }

    if (expiry <= travel) {
      return {
        success: false,
        message: 'Passport expires before travel date',
      };
    }

    // Calculate months difference
    const monthsDiff =
      (expiry.getTime() - travel.getTime()) / (30.44 * 24 * 60 * 60 * 1000);

    if (monthsDiff < requiredMonths) {
      return {
        success: false,
        message: `Passport must be valid for at least ${requiredMonths} months after travel date`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: 'Error validating passport expiry' };
  }
}

/**
 * Validate age meets minimum requirement
 */
export function validateMinimumAge(
  dateOfBirth: string,
  minimumAge: number = 18
): { success: boolean; message?: string } {
  try {
    const dob = new Date(dateOfBirth);

    if (isNaN(dob.getTime())) {
      return { success: false, message: 'Invalid date of birth' };
    }

    const now = new Date();
    const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (age < minimumAge) {
      return {
        success: false,
        message: `Applicant must be at least ${minimumAge} years old`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: 'Error validating age' };
  }
}

/**
 * Sanitize field value (remove potentially harmful characters)
 */
export function sanitizeFieldValue(value: string): string {
  // Remove control characters and excessive whitespace
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validate email format (additional check beyond Zod)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate phone number format (basic check)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Allow digits, spaces, hyphens, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]{6,30}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate postal code format by country
 */
export function validatePostalCode(postalCode: string, countryCode: string): boolean {
  const formats: Record<string, RegExp> = {
    USA: /^\d{5}(-\d{4})?$/, // US ZIP code
    CAN: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // Canadian postal code
    GBR: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i, // UK postcode
    ARE: /^\d{5}$/, // UAE postal code
    SAU: /^\d{5}(-\d{4})?$/, // Saudi Arabia
    IND: /^\d{6}$/, // India PIN code
    AUS: /^\d{4}$/, // Australian postcode
    DEU: /^\d{5}$/, // German PLZ
    FRA: /^\d{5}$/, // French postal code
  };

  const format = formats[countryCode];
  if (!format) {
    // Generic validation if no specific format
    return /^[A-Z0-9\s-]{3,20}$/i.test(postalCode);
  }

  return format.test(postalCode);
}
