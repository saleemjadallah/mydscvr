/**
 * Field Transformers - Convert data between different formats for visa applications
 *
 * Handles:
 * - Date formatting (ISO → DD/MM/YYYY, MM/DD/YYYY, etc.)
 * - Phone number formatting (international formats)
 * - Address formatting (country-specific layouts)
 * - Name formatting (given_family vs family_given)
 * - Text case transformations
 */

import { format, parse, parseISO, isValid } from 'date-fns';
import { parsePhoneNumber, CountryCode, isValidPhoneNumber } from 'libphonenumber-js';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'YYYY/MM/DD';
export type NameFormat = 'given_family' | 'family_given' | 'full';
export type AddressFormat = 'usa' | 'uk' | 'gcc' | 'asia' | 'europe';

/**
 * DATE TRANSFORMERS
 */

/**
 * Convert ISO date string (YYYY-MM-DD) to specified format
 */
export function formatDate(isoDate: string, targetFormat: DateFormat): string {
  try {
    // Parse ISO date
    const date = parseISO(isoDate);

    if (!isValid(date)) {
      return isoDate; // Return original if parsing fails
    }

    // Convert to target format
    switch (targetFormat) {
      case 'DD/MM/YYYY':
        return format(date, 'dd/MM/yyyy');
      case 'MM/DD/YYYY':
        return format(date, 'MM/dd/yyyy');
      case 'YYYY-MM-DD':
        return format(date, 'yyyy-MM-dd');
      case 'DD-MM-YYYY':
        return format(date, 'dd-MM-yyyy');
      case 'YYYY/MM/DD':
        return format(date, 'yyyy/MM/dd');
      default:
        return format(date, 'dd/MM/yyyy'); // Default to DD/MM/YYYY
    }
  } catch (error) {
    console.error('[Field Transformer] Date formatting error:', error);
    return isoDate;
  }
}

/**
 * Parse any common date format and convert to ISO (YYYY-MM-DD)
 */
export function parseToISODate(dateString: string): string | null {
  try {
    // Try common date patterns
    const patterns = [
      { format: 'dd/MM/yyyy', regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
      { format: 'MM/dd/yyyy', regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
      { format: 'yyyy-MM-dd', regex: /^\d{4}-\d{1,2}-\d{1,2}$/ },
      { format: 'dd-MM-yyyy', regex: /^\d{1,2}-\d{1,2}-\d{4}$/ },
      { format: 'yyyy/MM/dd', regex: /^\d{4}\/\d{1,2}\/\d{1,2}$/ },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(dateString)) {
        const parsedDate = parse(dateString, pattern.format, new Date());

        if (isValid(parsedDate)) {
          return format(parsedDate, 'yyyy-MM-dd');
        }
      }
    }

    // Try ISO parse as fallback
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) {
      return format(isoDate, 'yyyy-MM-dd');
    }

    return null;
  } catch (error) {
    console.error('[Field Transformer] Date parsing error:', error);
    return null;
  }
}

/**
 * Detect date format from string
 */
export function detectDateFormat(dateString: string): DateFormat | null {
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    // Could be DD/MM/YYYY or MM/DD/YYYY - check day value
    const parts = dateString.split('/');
    const first = parseInt(parts[0]);

    if (first > 12) {
      return 'DD/MM/YYYY'; // Must be day-first
    }

    // Ambiguous - default to MM/DD/YYYY for US forms, DD/MM/YYYY for others
    return 'DD/MM/YYYY'; // Most common globally
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
    return 'YYYY-MM-DD';
  }

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
    return 'DD-MM-YYYY';
  }

  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateString)) {
    return 'YYYY/MM/DD';
  }

  return null;
}

/**
 * PHONE NUMBER TRANSFORMERS
 */

/**
 * Format phone number for international display
 */
export function formatPhoneNumber(
  phoneNumber: string,
  defaultCountry: CountryCode = 'AE'
): {
  formatted: string;
  countryCode: string;
  nationalNumber: string;
  isValid: boolean;
} {
  try {
    // Check if already has country code
    const withPlus = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Try parsing with libphonenumber
    if (isValidPhoneNumber(withPlus)) {
      const parsed = parsePhoneNumber(withPlus);

      return {
        formatted: parsed.formatInternational(),
        countryCode: `+${parsed.countryCallingCode}`,
        nationalNumber: parsed.nationalNumber,
        isValid: true,
      };
    }

    // Try with default country
    if (isValidPhoneNumber(phoneNumber, defaultCountry)) {
      const parsed = parsePhoneNumber(phoneNumber, defaultCountry);

      return {
        formatted: parsed.formatInternational(),
        countryCode: `+${parsed.countryCallingCode}`,
        nationalNumber: parsed.nationalNumber,
        isValid: true,
      };
    }

    // Return as-is if validation fails
    return {
      formatted: phoneNumber,
      countryCode: '',
      nationalNumber: phoneNumber,
      isValid: false,
    };
  } catch (error) {
    console.error('[Field Transformer] Phone formatting error:', error);
    return {
      formatted: phoneNumber,
      countryCode: '',
      nationalNumber: phoneNumber,
      isValid: false,
    };
  }
}

/**
 * Extract country code and national number from phone string
 */
export function parsePhoneComponents(phoneNumber: string): {
  countryCode: string;
  number: string;
} {
  try {
    const formatted = formatPhoneNumber(phoneNumber);

    return {
      countryCode: formatted.countryCode,
      number: formatted.nationalNumber,
    };
  } catch (error) {
    console.error('[Field Transformer] Phone parsing error:', error);
    return {
      countryCode: '',
      number: phoneNumber,
    };
  }
}

/**
 * NAME TRANSFORMERS
 */

/**
 * Format name according to specified pattern
 */
export function formatName(
  givenName: string,
  familyName: string,
  middleName?: string,
  format: NameFormat = 'given_family'
): string {
  switch (format) {
    case 'family_given':
      return middleName
        ? `${familyName}, ${givenName} ${middleName}`.trim()
        : `${familyName}, ${givenName}`.trim();

    case 'full':
      return middleName
        ? `${givenName} ${middleName} ${familyName}`.trim()
        : `${givenName} ${familyName}`.trim();

    case 'given_family':
    default:
      return middleName
        ? `${givenName} ${middleName} ${familyName}`.trim()
        : `${givenName} ${familyName}`.trim();
  }
}

/**
 * ADDRESS TRANSFORMERS
 */

export interface AddressComponents {
  streetNumber?: string;
  streetName: string;
  unit?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  country: string;
}

/**
 * Format address for specific country/region layout
 */
export function formatAddress(address: AddressComponents, format: AddressFormat): string {
  const lines: string[] = [];

  switch (format) {
    case 'usa':
      // US Format:
      // 123 Main Street, Apt 4B
      // City, State ZIP
      // Country

      lines.push(
        [address.streetNumber, address.streetName, address.unit].filter(Boolean).join(' ')
      );
      lines.push(
        [address.city, address.stateProvince, address.postalCode].filter(Boolean).join(', ')
      );
      lines.push(address.country);
      break;

    case 'uk':
    case 'europe':
      // UK/Europe Format:
      // 123 Main Street
      // Apartment 4B
      // City
      // County/State
      // Postcode
      // Country

      lines.push([address.streetNumber, address.streetName].filter(Boolean).join(' '));
      if (address.unit) lines.push(address.unit);
      lines.push(address.city);
      if (address.stateProvince) lines.push(address.stateProvince);
      lines.push(address.postalCode);
      lines.push(address.country);
      break;

    case 'gcc':
    case 'asia':
      // GCC/Asia Format:
      // Unit/Apartment
      // Street Name, Building Number
      // City, State
      // Postal Code
      // Country

      if (address.unit) lines.push(address.unit);
      lines.push([address.streetName, address.streetNumber].filter(Boolean).join(', '));
      lines.push([address.city, address.stateProvince].filter(Boolean).join(', '));
      lines.push(address.postalCode);
      lines.push(address.country);
      break;

    default:
      // Generic format
      lines.push(
        [address.streetNumber, address.streetName, address.unit].filter(Boolean).join(' ')
      );
      lines.push(address.city);
      if (address.stateProvince) lines.push(address.stateProvince);
      lines.push(address.postalCode);
      lines.push(address.country);
  }

  return lines.filter(Boolean).join('\n');
}

/**
 * Format address as single line (for form fields with limited space)
 */
export function formatAddressSingleLine(address: AddressComponents): string {
  const parts = [
    address.streetNumber,
    address.streetName,
    address.unit,
    address.city,
    address.stateProvince,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * TEXT CASE TRANSFORMERS
 */

/**
 * Convert to uppercase
 */
export function toUpperCase(value: string): string {
  return value.toUpperCase();
}

/**
 * Convert to lowercase
 */
export function toLowerCase(value: string): string {
  return value.toLowerCase();
}

/**
 * Convert to title case (First Letter Of Each Word)
 */
export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * MASTER TRANSFORM FUNCTION
 */

/**
 * Apply specified transformation to field value
 */
export function applyTransform(
  value: string,
  transformType: string,
  targetFormat?: DateFormat | AddressFormat | NameFormat
): string {
  try {
    switch (transformType) {
      case 'uppercase':
        return toUpperCase(value);

      case 'lowercase':
        return toLowerCase(value);

      case 'titlecase':
        return toTitleCase(value);

      case 'date_format':
        if (targetFormat && ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY/MM/DD'].includes(targetFormat)) {
          return formatDate(value, targetFormat as DateFormat);
        }
        return formatDate(value, 'DD/MM/YYYY'); // Default

      case 'phone_format':
        return formatPhoneNumber(value).formatted;

      default:
        return value;
    }
  } catch (error) {
    console.error('[Field Transformer] Transform error:', error);
    return value;
  }
}

/**
 * VALIDATION HELPERS
 */

/**
 * Check if date is valid and within reasonable range (18-120 years old)
 */
export function isValidDateOfBirth(dateString: string): boolean {
  try {
    const isoDate = parseToISODate(dateString);
    if (!isoDate) return false;

    const date = parseISO(isoDate);
    if (!isValid(date)) return false;

    const now = new Date();
    const age = (now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    return age >= 0 && age <= 120;
  } catch (error) {
    return false;
  }
}

/**
 * Check if passport expiry date meets minimum validity requirement
 */
export function checkPassportValidity(
  expiryDate: string,
  travelDate: string,
  requiredMonths: number
): { isValid: boolean; message: string } {
  try {
    const expiry = parseISO(parseToISODate(expiryDate) || expiryDate);
    const travel = parseISO(parseToISODate(travelDate) || travelDate);

    if (!isValid(expiry) || !isValid(travel)) {
      return {
        isValid: false,
        message: 'Invalid date format',
      };
    }

    // Calculate months between travel and expiry
    const monthsDiff = (expiry.getTime() - travel.getTime()) / (30.44 * 24 * 60 * 60 * 1000);

    if (monthsDiff < requiredMonths) {
      return {
        isValid: false,
        message: `Passport must be valid for at least ${requiredMonths} months after travel date`,
      };
    }

    return {
      isValid: true,
      message: 'Passport validity meets requirements',
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Error checking passport validity',
    };
  }
}
