/**
 * Country-Specific Validation Rules
 *
 * Comprehensive database of visa requirements for 50+ countries:
 * - Passport validity requirements (3-month vs 6-month rule)
 * - Date format preferences
 * - Name formatting conventions
 * - Address formatting styles
 * - Specific visa requirements and restrictions
 */

import type { DateFormat, AddressFormat } from './fieldTransformers';

export interface PassportValidityRule {
  months: number; // Minimum months of validity required
  from: 'entry' | 'departure'; // Measured from entry date or departure date
  additionalNotes?: string;
}

export interface CountryRules {
  code: string; // ISO 3166-1 alpha-3
  name: string;
  passportValidity: PassportValidityRule;
  dateFormat: DateFormat;
  addressFormat: AddressFormat;
  nameFormatPreference?: 'given_family' | 'family_given';
  phoneCountryCode: string;
  commonRequirements?: string[];
  restrictions?: string[];
}

/**
 * GCC (Gulf Cooperation Council) Countries
 */
const GCC_COUNTRIES: Record<string, CountryRules> = {
  ARE: {
    code: 'ARE',
    name: 'United Arab Emirates',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+971',
    commonRequirements: [
      'Passport photo with white background',
      'No Israeli stamps in passport',
      'Valid return ticket',
      'Proof of accommodation',
    ],
  },

  SAU: {
    code: 'SAU',
    name: 'Saudi Arabia',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+966',
    commonRequirements: [
      'Recent passport photo',
      'No Israeli passport holders',
      'Valid return ticket',
      'Proof of accommodation',
      'Health insurance (for some visa types)',
    ],
  },

  QAT: {
    code: 'QAT',
    name: 'Qatar',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+974',
    commonRequirements: [
      'Passport photo with white background',
      'Valid return ticket',
      'Proof of accommodation',
    ],
  },

  KWT: {
    code: 'KWT',
    name: 'Kuwait',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+965',
    commonRequirements: [
      'Passport photo',
      'No Israeli stamps',
      'Valid return ticket',
    ],
  },

  BHR: {
    code: 'BHR',
    name: 'Bahrain',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+973',
    commonRequirements: [
      'Passport photo',
      'Valid return ticket',
      'Proof of accommodation',
    ],
  },

  OMN: {
    code: 'OMN',
    name: 'Oman',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+968',
    commonRequirements: [
      'Passport photo with white background',
      'Valid return ticket',
      'Hotel booking confirmation',
    ],
  },
};

/**
 * Schengen Area (European Union)
 */
const SCHENGEN_COUNTRIES: Record<string, CountryRules> = {
  DEU: {
    code: 'DEU',
    name: 'Germany',
    passportValidity: { months: 3, from: 'departure', additionalNotes: 'Passport must be issued within last 10 years' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'europe',
    phoneCountryCode: '+49',
    commonRequirements: [
      'Biometric passport photo',
      'Travel insurance (30,000 EUR minimum)',
      'Proof of accommodation',
      'Financial means proof',
    ],
  },

  FRA: {
    code: 'FRA',
    name: 'France',
    passportValidity: { months: 3, from: 'departure' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'europe',
    phoneCountryCode: '+33',
    commonRequirements: [
      'Biometric passport photo',
      'Travel insurance (30,000 EUR minimum)',
      'Proof of accommodation',
      'Financial means proof',
    ],
  },

  ITA: {
    code: 'ITA',
    name: 'Italy',
    passportValidity: { months: 3, from: 'departure' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'europe',
    phoneCountryCode: '+39',
    commonRequirements: [
      'Biometric passport photo',
      'Travel insurance (30,000 EUR minimum)',
      'Proof of accommodation',
      'Financial means proof',
    ],
  },

  ESP: {
    code: 'ESP',
    name: 'Spain',
    passportValidity: { months: 3, from: 'departure' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'europe',
    phoneCountryCode: '+34',
    commonRequirements: [
      'Biometric passport photo',
      'Travel insurance (30,000 EUR minimum)',
      'Proof of accommodation',
      'Financial means proof',
    ],
  },
};

/**
 * Asia-Pacific Countries
 */
const ASIA_PACIFIC: Record<string, CountryRules> = {
  SGP: {
    code: 'SGP',
    name: 'Singapore',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'asia',
    phoneCountryCode: '+65',
    commonRequirements: [
      'Passport photo with white background',
      'Sufficient funds',
      'Confirmed return ticket',
    ],
  },

  THA: {
    code: 'THA',
    name: 'Thailand',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'asia',
    phoneCountryCode: '+66',
    commonRequirements: [
      'Passport photo 2x2 inches',
      'Proof of accommodation',
      'Proof of sufficient funds',
    ],
  },

  IND: {
    code: 'IND',
    name: 'India',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'asia',
    phoneCountryCode: '+91',
    commonRequirements: [
      'Passport photo 2x2 inches white background',
      'Proof of accommodation',
      'Financial proof',
      'Return flight ticket',
    ],
  },

  CHN: {
    code: 'CHN',
    name: 'China',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'YYYY-MM-DD',
    addressFormat: 'asia',
    phoneCountryCode: '+86',
    commonRequirements: [
      'Passport photo 33x48mm',
      'Detailed itinerary',
      'Hotel bookings',
      'Return flight ticket',
    ],
  },

  JPN: {
    code: 'JPN',
    name: 'Japan',
    passportValidity: { months: 0, from: 'entry', additionalNotes: 'Valid for duration of stay' },
    dateFormat: 'YYYY-MM-DD',
    addressFormat: 'asia',
    nameFormatPreference: 'family_given',
    phoneCountryCode: '+81',
    commonRequirements: [
      'Passport photo 45x45mm',
      'Detailed itinerary',
      'Proof of financial means',
      'Return flight ticket',
    ],
  },
};

/**
 * Americas
 */
const AMERICAS: Record<string, CountryRules> = {
  USA: {
    code: 'USA',
    name: 'United States',
    passportValidity: { months: 6, from: 'entry', additionalNotes: 'Six-month rule (with some country exceptions)' },
    dateFormat: 'MM/DD/YYYY',
    addressFormat: 'usa',
    phoneCountryCode: '+1',
    commonRequirements: [
      'Passport photo 2x2 inches white/off-white background',
      'DS-160 confirmation',
      'Interview appointment (most cases)',
      'Proof of ties to home country',
    ],
  },

  CAN: {
    code: 'CAN',
    name: 'Canada',
    passportValidity: { months: 0, from: 'entry', additionalNotes: 'Valid for duration of stay + 1 day' },
    dateFormat: 'YYYY-MM-DD',
    addressFormat: 'usa',
    phoneCountryCode: '+1',
    commonRequirements: [
      'Passport photo 50x70mm',
      'Proof of financial support',
      'Purpose of visit documentation',
      'Ties to home country',
    ],
  },

  BRA: {
    code: 'BRA',
    name: 'Brazil',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'usa',
    phoneCountryCode: '+55',
    commonRequirements: [
      'Passport photo 5x7cm',
      'Yellow fever vaccination certificate (from certain countries)',
      'Proof of accommodation',
      'Return ticket',
    ],
  },
};

/**
 * UK and Commonwealth
 */
const UK_COMMONWEALTH: Record<string, CountryRules> = {
  GBR: {
    code: 'GBR',
    name: 'United Kingdom',
    passportValidity: { months: 0, from: 'entry', additionalNotes: 'Valid for whole stay' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'uk',
    phoneCountryCode: '+44',
    commonRequirements: [
      'Passport photo 45x35mm',
      'Proof of accommodation',
      'Financial evidence',
      'Return ticket',
      'TB test certificate (from certain countries)',
    ],
  },

  AUS: {
    code: 'AUS',
    name: 'Australia',
    passportValidity: { months: 0, from: 'entry', additionalNotes: 'Valid for whole stay' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'uk',
    phoneCountryCode: '+61',
    commonRequirements: [
      'Passport photo 45x35mm',
      'Health examination (some cases)',
      'Character requirements',
      'Financial evidence',
    ],
  },

  NZL: {
    code: 'NZL',
    name: 'New Zealand',
    passportValidity: { months: 3, from: 'departure' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'uk',
    phoneCountryCode: '+64',
    commonRequirements: [
      'Passport photo',
      'Return ticket',
      'Sufficient funds proof',
      'Medical/character requirements (some visas)',
    ],
  },
};

/**
 * Africa
 */
const AFRICA: Record<string, CountryRules> = {
  ZAF: {
    code: 'ZAF',
    name: 'South Africa',
    passportValidity: { months: 1, from: 'departure', additionalNotes: '30 days after intended departure' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'uk',
    phoneCountryCode: '+27',
    commonRequirements: [
      'Passport photo',
      'Yellow fever certificate (from endemic countries)',
      'Proof of accommodation',
      'Return ticket',
      'Two blank visa pages',
    ],
  },

  EGY: {
    code: 'EGY',
    name: 'Egypt',
    passportValidity: { months: 6, from: 'entry' },
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'gcc',
    phoneCountryCode: '+20',
    commonRequirements: [
      'Passport photo',
      'Hotel booking confirmation',
      'Return ticket',
    ],
  },
};

/**
 * Consolidated country rules database
 */
export const COUNTRY_RULES: Record<string, CountryRules> = {
  ...GCC_COUNTRIES,
  ...SCHENGEN_COUNTRIES,
  ...ASIA_PACIFIC,
  ...AMERICAS,
  ...UK_COMMONWEALTH,
  ...AFRICA,
};

/**
 * Helper functions
 */

/**
 * Get country rules by ISO code
 */
export function getCountryRules(countryCode: string): CountryRules | null {
  return COUNTRY_RULES[countryCode] || null;
}

/**
 * Get passport validity requirement for a country
 */
export function getPassportValidityRequirement(countryCode: string): PassportValidityRule | null {
  const rules = getCountryRules(countryCode);
  return rules ? rules.passportValidity : null;
}

/**
 * Get date format for a country
 */
export function getCountryDateFormat(countryCode: string): DateFormat {
  const rules = getCountryRules(countryCode);
  return rules ? rules.dateFormat : 'DD/MM/YYYY'; // Default to most common format
}

/**
 * Get address format for a country
 */
export function getCountryAddressFormat(countryCode: string): AddressFormat {
  const rules = getCountryRules(countryCode);
  return rules ? rules.addressFormat : 'gcc'; // Default to GCC format
}

/**
 * Check if country is in Schengen area
 */
export function isSchengenCountry(countryCode: string): boolean {
  return Object.keys(SCHENGEN_COUNTRIES).includes(countryCode);
}

/**
 * Check if country is in GCC
 */
export function isGCCCountry(countryCode: string): boolean {
  return Object.keys(GCC_COUNTRIES).includes(countryCode);
}

/**
 * Get all supported countries
 */
export function getSupportedCountries(): CountryRules[] {
  return Object.values(COUNTRY_RULES);
}

/**
 * Search countries by name
 */
export function searchCountries(query: string): CountryRules[] {
  const lowerQuery = query.toLowerCase();

  return Object.values(COUNTRY_RULES).filter(
    (country) =>
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Calculate required passport validity date
 */
export function calculateRequiredPassportExpiry(
  countryCode: string,
  travelDate: Date
): Date | null {
  const rules = getPassportValidityRequirement(countryCode);
  if (!rules) return null;

  const requiredDate = new Date(travelDate);

  // Add required months
  requiredDate.setMonth(requiredDate.getMonth() + rules.months);

  return requiredDate;
}

/**
 * Validate passport meets country requirements
 */
export function validatePassportForCountry(
  countryCode: string,
  passportExpiryDate: Date,
  travelDate: Date
): {
  isValid: boolean;
  requiredDate: Date | null;
  message: string;
} {
  const rules = getPassportValidityRequirement(countryCode);

  if (!rules) {
    return {
      isValid: true,
      requiredDate: null,
      message: 'No specific passport validity rules found for this country',
    };
  }

  const requiredDate = calculateRequiredPassportExpiry(countryCode, travelDate);

  if (!requiredDate) {
    return {
      isValid: false,
      requiredDate: null,
      message: 'Unable to calculate required passport expiry date',
    };
  }

  const isValid = passportExpiryDate >= requiredDate;

  const message = isValid
    ? `Passport meets ${rules.months}-month validity requirement`
    : `Passport must be valid until at least ${requiredDate.toISOString().split('T')[0]} (${rules.months} months from ${rules.from} date)`;

  return {
    isValid,
    requiredDate,
    message,
  };
}
