/**
 * JSON Rules Engine (Tier 2 Validation)
 *
 * Server-side rule-based validation using json-rules-engine
 * Handles complex business logic:
 * - Passport validity rules (6-month rule)
 * - Conditional field requirements
 * - Cross-field validation
 * - Country-specific requirements
 */

import { Engine, type RuleProperties } from 'json-rules-engine';
import {
  validatePassportForCountry,
} from './countryRules';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  autoFixable?: boolean;
}

export interface RuleEngineResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
}

/**
 * Initialize the rules engine with all validation rules
 */
export function createRulesEngine(): Engine {
  const engine = new Engine();

  // Add all rule sets
  addPassportValidityRules(engine);
  addConditionalFieldRules(engine);
  addDateFormatRules(engine);
  addCrossFieldValidationRules(engine);
  addCountrySpecificRules(engine);

  return engine;
}

/**
 * PASSPORT VALIDITY RULES
 */
function addPassportValidityRules(engine: Engine) {
  // Rule: Passport must meet country-specific validity requirements
  const passportValidityRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'destinationCountry',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'passport.expiryDate',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'travelDate',
          operator: 'notEqual',
          value: null,
        },
      ],
    },
    event: {
      type: 'passport_validity_check',
      params: {
        field: 'passport.expiryDate',
        severity: 'error',
      },
    },
    priority: 100, // High priority
  };

  engine.addRule(passportValidityRule);

  // Rule: Passport must not be expired
  const passportNotExpiredRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'passport.expiryDate',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'currentDate',
          operator: 'greaterThan',
          value: { fact: 'passport.expiryDate' },
        },
      ],
    },
    event: {
      type: 'validation_error',
      params: {
        field: 'passport.expiryDate',
        message: 'Passport has already expired',
        severity: 'error',
      },
    },
    priority: 100,
  };

  engine.addRule(passportNotExpiredRule);
}

/**
 * CONDITIONAL FIELD RULES
 */
function addConditionalFieldRules(engine: Engine) {
  // Rule: Spouse info required if married
  const spouseRequiredRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'maritalStatus',
          operator: 'equal',
          value: 'married',
        },
        {
          any: [
            {
              fact: 'familyMembers',
              operator: 'equal',
              value: null,
            },
            {
              fact: 'hasSpouse',
              operator: 'equal',
              value: false,
            },
          ],
        },
      ],
    },
    event: {
      type: 'validation_warning',
      params: {
        field: 'familyMembers',
        message: 'Spouse information is typically required for married applicants',
        severity: 'warning',
        suggestion: 'Add spouse information to your profile',
      },
    },
    priority: 50,
  };

  engine.addRule(spouseRequiredRule);

  // Rule: Emergency contact required for certain visa types
  const emergencyContactRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'visaType',
          operator: 'in',
          value: ['tourist', 'visitor', 'long_term'],
        },
        {
          any: [
            {
              fact: 'emergencyContact',
              operator: 'equal',
              value: null,
            },
            {
              fact: 'emergencyContact.name',
              operator: 'equal',
              value: '',
            },
          ],
        },
      ],
    },
    event: {
      type: 'validation_warning',
      params: {
        field: 'emergencyContact',
        message: 'Emergency contact information is recommended for this visa type',
        severity: 'warning',
      },
    },
    priority: 40,
  };

  engine.addRule(emergencyContactRule);

  // Rule: Employment details required for work visas
  const employmentRequiredRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'visaType',
          operator: 'in',
          value: ['work', 'business', 'employment'],
        },
        {
          any: [
            {
              fact: 'employment.currentEmployer',
              operator: 'equal',
              value: null,
            },
            {
              fact: 'employment.currentEmployer',
              operator: 'equal',
              value: '',
            },
          ],
        },
      ],
    },
    event: {
      type: 'validation_error',
      params: {
        field: 'employment',
        message: 'Employment information is required for work/business visas',
        severity: 'error',
      },
    },
    priority: 80,
  };

  engine.addRule(employmentRequiredRule);
}

/**
 * DATE FORMAT RULES
 */
function addDateFormatRules(engine: Engine) {
  // Rule: Warn if date format might not match destination country
  const dateFormatWarningRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'destinationCountry',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'hasDateFormatMismatch',
          operator: 'equal',
          value: true,
        },
      ],
    },
    event: {
      type: 'validation_info',
      params: {
        field: 'dates',
        message: 'Date format will be automatically adjusted for destination country',
        severity: 'info',
        autoFixable: true,
      },
    },
    priority: 20,
  };

  engine.addRule(dateFormatWarningRule);

  // Rule: Date of birth cannot be in the future
  const dobFutureRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'dateOfBirth',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'dateOfBirth',
          operator: 'greaterThan',
          value: { fact: 'currentDate' },
        },
      ],
    },
    event: {
      type: 'validation_error',
      params: {
        field: 'dateOfBirth',
        message: 'Date of birth cannot be in the future',
        severity: 'error',
      },
    },
    priority: 100,
  };

  engine.addRule(dobFutureRule);

  // Rule: Applicant must be at least 1 year old
  const minimumAgeRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'applicantAge',
          operator: 'lessThan',
          value: 1,
        },
      ],
    },
    event: {
      type: 'validation_warning',
      params: {
        field: 'dateOfBirth',
        message: 'Applicant appears to be less than 1 year old. Please verify date of birth.',
        severity: 'warning',
      },
    },
    priority: 60,
  };

  engine.addRule(minimumAgeRule);
}

/**
 * CROSS-FIELD VALIDATION RULES
 */
function addCrossFieldValidationRules(engine: Engine) {
  // Rule: Nationality and passport issuing country should match (warning if not)
  const nationalityPassportMismatchRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'nationality',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'passport.issuingCountry',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'nationality',
          operator: 'notEqual',
          value: { fact: 'passport.issuingCountry' },
        },
      ],
    },
    event: {
      type: 'validation_warning',
      params: {
        field: 'passport.issuingCountry',
        message: 'Passport issuing country differs from nationality. This is valid for dual citizens.',
        severity: 'warning',
      },
    },
    priority: 30,
  };

  engine.addRule(nationalityPassportMismatchRule);

  // Rule: Travel date must be in the future
  const travelDateFutureRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'travelDate',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'travelDate',
          operator: 'lessThan',
          value: { fact: 'currentDate' },
        },
      ],
    },
    event: {
      type: 'validation_error',
      params: {
        field: 'travelDate',
        message: 'Travel date must be in the future',
        severity: 'error',
      },
    },
    priority: 90,
  };

  engine.addRule(travelDateFutureRule);

  // Rule: Passport issue date must be before expiry date
  const passportIssueDateRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'passport.issueDate',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'passport.expiryDate',
          operator: 'notEqual',
          value: null,
        },
        {
          fact: 'passport.issueDate',
          operator: 'greaterThanInclusive',
          value: { fact: 'passport.expiryDate' },
        },
      ],
    },
    event: {
      type: 'validation_error',
      params: {
        field: 'passport.issueDate',
        message: 'Passport issue date must be before expiry date',
        severity: 'error',
      },
    },
    priority: 100,
  };

  engine.addRule(passportIssueDateRule);
}

/**
 * COUNTRY-SPECIFIC RULES
 */
function addCountrySpecificRules(engine: Engine) {
  // Rule: GCC countries - No Israeli stamps allowed
  const israeliStampsRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'destinationCountry',
          operator: 'in',
          value: ['ARE', 'SAU', 'QAT', 'KWT', 'BHR', 'OMN'],
        },
        {
          fact: 'hasIsraeliStamps',
          operator: 'equal',
          value: true,
        },
      ],
    },
    event: {
      type: 'validation_error',
      params: {
        field: 'passport',
        message: 'GCC countries do not accept passports with Israeli stamps or visas',
        severity: 'error',
        suggestion: 'You may need to obtain a new passport',
      },
    },
    priority: 100,
  };

  engine.addRule(israeliStampsRule);

  // Rule: Schengen - Travel insurance required
  const schengenInsuranceRule: RuleProperties = {
    conditions: {
      all: [
        {
          fact: 'destinationCountry',
          operator: 'in',
          value: ['DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'AUT', 'PRT', 'GRC'],
        },
        {
          fact: 'hasTravelInsurance',
          operator: 'equal',
          value: false,
        },
      ],
    },
    event: {
      type: 'validation_warning',
      params: {
        field: 'travelInsurance',
        message: 'Schengen visa requires travel insurance with minimum 30,000 EUR coverage',
        severity: 'warning',
        suggestion: 'Purchase travel insurance before submitting application',
      },
    },
    priority: 70,
  };

  engine.addRule(schengenInsuranceRule);
}

/**
 * Run validation rules against application data
 */
export async function validateFormData(
  formData: any,
  destinationCountry?: string,
  travelDate?: string
): Promise<RuleEngineResult> {
  const engine = createRulesEngine();

  // Prepare facts for the engine
  const facts = prepareFacts(formData, destinationCountry, travelDate);

  // Run the engine
  const { events } = await engine.run(facts);

  // Categorize results
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const infos: ValidationIssue[] = [];

  for (const event of events) {
    if (!event.params) continue;

    const issue: ValidationIssue = {
      field: event.params.field || 'general',
      message: event.params.message || 'Validation issue detected',
      severity: event.params.severity || 'error',
      suggestion: event.params.suggestion,
      autoFixable: event.params.autoFixable,
    };

    // Handle special passport validity check
    if (event.type === 'passport_validity_check' && destinationCountry && travelDate) {
      const passportValidation = validatePassportForCountry(
        destinationCountry,
        new Date(facts.passport?.expiryDate),
        new Date(travelDate)
      );

      if (!passportValidation.isValid) {
        errors.push({
          field: 'passport.expiryDate',
          message: passportValidation.message,
          severity: 'error',
          suggestion: 'Consider renewing your passport before travel',
        });
      }
    } else {
      // Regular validation issue
      switch (issue.severity) {
        case 'error':
          errors.push(issue);
          break;
        case 'warning':
          warnings.push(issue);
          break;
        case 'info':
          infos.push(issue);
          break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
  };
}

/**
 * Prepare facts for the rules engine
 */
function prepareFacts(formData: any, destinationCountry?: string, travelDate?: string): any {
  const currentDate = new Date().toISOString().split('T')[0];

  // Calculate applicant age if DOB provided
  let applicantAge = null;
  if (formData.dateOfBirth) {
    const dob = new Date(formData.dateOfBirth);
    applicantAge = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }

  // Check if there's a spouse in family members
  const hasSpouse = formData.familyMembers?.some(
    (member: any) => member.relationship === 'spouse'
  ) || false;

  // Check for date format mismatches
  const hasDateFormatMismatch = false; // TODO: Implement date format detection

  return {
    ...formData,
    destinationCountry,
    travelDate,
    currentDate,
    applicantAge,
    hasSpouse,
    hasDateFormatMismatch,
    // Placeholder facts (would be determined from actual data)
    hasIsraeliStamps: false,
    hasTravelInsurance: false,
    visaType: formData.visaType || 'tourist',
  };
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: RuleEngineResult): string {
  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error(s)`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }

  if (result.infos.length > 0) {
    parts.push(`${result.infos.length} info item(s)`);
  }

  if (parts.length === 0) {
    return 'All validations passed';
  }

  return parts.join(', ');
}

/**
 * Check if validation issues can be auto-fixed
 */
export function getAutoFixableIssues(result: RuleEngineResult): ValidationIssue[] {
  const allIssues = [...result.errors, ...result.warnings, ...result.infos];
  return allIssues.filter((issue) => issue.autoFixable);
}
