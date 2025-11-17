import { pgTable, text, serial, integer, timestamp, json, varchar, boolean } from 'drizzle-orm/pg-core';
import { users } from './schema';

// ===================================
// PRIVACY-FIRST FORM FILLER TABLES
// ===================================

// User Preferences - Only Non-Sensitive Information
export const userPreferences = pgTable('user_preferences', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  // Basic Non-Sensitive Information
  firstName: text('first_name'),
  middleName: text('middle_name'),
  lastName: text('last_name'),
  namePrefix: text('name_prefix'), // Mr., Ms., Dr., etc.

  // General Non-Sensitive Details
  nationality: text('nationality'), // For format preferences
  countryOfResidence: text('country_of_residence'), // For timezone/format
  cityOfResidence: text('city_of_residence'), // General location only
  gender: text('gender'), // For form prefixes (Mr./Ms.)

  // Professional Information (General, Non-Specific)
  professionCategory: text('profession_category'), // "Technology", "Healthcare", "Education"
  employmentStatus: text('employment_status'), // "Employed", "Self-employed", "Student"
  educationLevel: text('education_level'), // "High School", "Bachelor's", "Master's", "PhD"

  // User Preferences for Form Filling
  preferredDateFormat: text('preferred_date_format'), // 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
  preferredPhoneFormat: text('preferred_phone_format'), // Country code preference
  preferredLanguage: text('preferred_language'), // For multi-language forms
  measurementSystem: text('measurement_system'), // 'metric' or 'imperial'

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Form Field Mappings - How to map fields intelligently
export const fieldMappings = pgTable('field_mappings', {
  id: serial('id').primaryKey(),

  fieldPattern: text('field_pattern').notNull(), // Regex or pattern to match
  standardFieldName: text('standard_field_name').notNull(), // What we call it internally
  fieldCategory: text('field_category').notNull(), // 'name', 'location', 'professional', etc.

  // Common variations we've seen
  variations: json('variations').$type<string[]>().notNull(),

  // Hints and helpers
  helperText: text('helper_text'),
  exampleValue: text('example_value'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Country-Specific Validation Rules (No User Data)
export const countryValidationRules = pgTable('country_validation_rules', {
  id: serial('id').primaryKey(),

  country: text('country').notNull(),
  visaType: text('visa_type'),

  // Validation rules and requirements
  validationRules: json('validation_rules').$type<{
    dateFormat: string;
    phoneFormat: string;
    nameFormat: 'firstName_lastName' | 'lastName_firstName';
    requiredFields: string[];
    fieldCharacterLimits: Record<string, number>;
    rejectionReasons: {
      reason: string;
      howToAvoid: string;
    }[];
  }>().notNull(),

  // Common mistakes specific to this country/visa
  commonMistakes: json('common_mistakes').$type<{
    mistake: string;
    correction: string;
    severity: 'error' | 'warning';
  }[]>(),

  isActive: boolean('is_active').default(true).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Form Templates - Structure only, no data
export const formTemplates = pgTable('form_templates', {
  id: serial('id').primaryKey(),

  country: text('country').notNull(),
  visaType: text('visa_type').notNull(),
  formName: text('form_name').notNull(),
  formVersion: text('form_version'),

  // Field structure and requirements
  fieldStructure: json('field_structure').$type<{
    fieldId: string;
    fieldLabel: string;
    fieldType: 'text' | 'date' | 'select' | 'checkbox' | 'number';
    isRequired: boolean;
    validationPattern?: string;
    maxLength?: number;
    helpText?: string;
    category: 'personal' | 'professional' | 'travel' | 'other';
  }[]>().notNull(),

  // Tips for this specific form
  formTips: json('form_tips').$type<string[]>(),
  estimatedCompletionTime: integer('estimated_completion_time'), // in minutes

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Form History - Metadata only, no sensitive data
export const userFormHistory = pgTable('user_form_history', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  // What form they worked on (no data)
  country: text('country').notNull(),
  visaType: text('visa_type').notNull(),
  formName: text('form_name'),

  // Completion metadata (no actual data)
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  completionPercentage: integer('completion_percentage'),

  // Validation results (no data, just stats)
  totalFields: integer('total_fields'),
  validFields: integer('valid_fields'),
  errorsFound: integer('errors_found'),
  warningsFound: integer('warnings_found'),

  // What validation helped with (no sensitive data)
  validationHelped: json('validation_helped').$type<{
    formatErrors: number;
    missingFields: number;
    characterLimitErrors: number;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Validation Library - Reusable validation patterns
export const validationPatterns = pgTable('validation_patterns', {
  id: serial('id').primaryKey(),

  patternName: text('pattern_name').notNull().unique(),
  patternType: text('pattern_type').notNull(), // 'date', 'phone', 'name', 'email', etc.

  // The actual validation pattern
  pattern: text('pattern').notNull(), // Regex or validation rule

  // User-friendly error message
  errorMessage: text('error_message').notNull(),

  // Examples of valid inputs
  validExamples: json('valid_examples').$type<string[]>(),
  invalidExamples: json('invalid_examples').$type<string[]>(),

  // Which countries/forms use this
  usedBy: json('used_by').$type<{
    countries?: string[];
    formTypes?: string[];
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Privacy Settings - User control over their data
export const privacySettings = pgTable('privacy_settings', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id).unique(),

  // Privacy preferences
  allowPreferenceStorage: boolean('allow_preference_storage').default(true).notNull(),
  allowFormPatternAnalysis: boolean('allow_form_pattern_analysis').default(true).notNull(),
  allowAnonymousAnalytics: boolean('allow_anonymous_analytics').default(true).notNull(),

  // Data retention preferences
  autoDeleteAfterDays: integer('auto_delete_after_days'), // null = never
  lastDataPurgeDate: timestamp('last_data_purge_date'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================================
// TYPE EXPORTS
// ===================================

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type FieldMapping = typeof fieldMappings.$inferSelect;
export type NewFieldMapping = typeof fieldMappings.$inferInsert;

export type CountryValidationRule = typeof countryValidationRules.$inferSelect;
export type NewCountryValidationRule = typeof countryValidationRules.$inferInsert;

export type FormTemplate = typeof formTemplates.$inferSelect;
export type NewFormTemplate = typeof formTemplates.$inferInsert;

export type UserFormHistory = typeof userFormHistory.$inferSelect;
export type NewUserFormHistory = typeof userFormHistory.$inferInsert;

export type ValidationPattern = typeof validationPatterns.$inferSelect;
export type NewValidationPattern = typeof validationPatterns.$inferInsert;

export type PrivacySettings = typeof privacySettings.$inferSelect;
export type NewPrivacySettings = typeof privacySettings.$inferInsert;