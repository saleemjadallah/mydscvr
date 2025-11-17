import { pgTable, text, serial, integer, timestamp, json, varchar, date, boolean } from 'drizzle-orm/pg-core';
import { users } from './schema';

// ===================================
// ENHANCED FORM FILLER TABLES
// ===================================

// User Profiles - Main profile data that gets reused across forms
export const userProfiles = pgTable('user_profiles', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  // Personal Information
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  maidenName: text('maiden_name'),
  dateOfBirth: date('date_of_birth').notNull(),
  placeOfBirth: text('place_of_birth').notNull(),
  gender: text('gender').notNull(), // Male, Female, Other
  maritalStatus: text('marital_status').notNull(), // Single, Married, Divorced, Widowed

  // Contact Information
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  alternativePhone: text('alternative_phone'),

  // Current Address
  currentAddress: json('current_address').$type<{
    street: string;
    apartment?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    fromDate: string;
    toDate?: string; // null if current
  }>().notNull(),

  // Previous Addresses (last 5 years)
  previousAddresses: json('previous_addresses').$type<{
    street: string;
    apartment?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    fromDate: string;
    toDate: string;
  }[]>(),

  // Nationality Information
  nationality: text('nationality').notNull(),
  dualNationality: text('dual_nationality'),
  countryOfBirth: text('country_of_birth').notNull(),

  // Emergency Contact
  emergencyContact: json('emergency_contact').$type<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Passport Information
export const passportProfiles = pgTable('passport_profiles', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  profileId: varchar('profile_id').references(() => userProfiles.id),

  passportNumber: text('passport_number').notNull(),
  passportType: text('passport_type').notNull(), // Regular, Diplomatic, Official
  issuingCountry: text('issuing_country').notNull(),
  issuingAuthority: text('issuing_authority'),
  issueDate: date('issue_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  placeOfIssue: text('place_of_issue').notNull(),

  // Previous Passports
  previousPassports: json('previous_passports').$type<{
    number: string;
    issuedDate: string;
    expiryDate: string;
    issuingCountry: string;
  }[]>(),

  // Biometric Info
  hasBiometric: boolean('has_biometric').default(false),
  biometricNumber: text('biometric_number'),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employment History
export const employmentProfiles = pgTable('employment_profiles', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  profileId: varchar('profile_id').references(() => userProfiles.id),

  isCurrent: boolean('is_current').default(false).notNull(),
  employerName: text('employer_name').notNull(),
  jobTitle: text('job_title').notNull(),
  department: text('department'),

  // Employment Duration
  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // null if current

  // Employer Details
  employerAddress: json('employer_address').$type<{
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  }>().notNull(),

  employerPhone: text('employer_phone'),
  employerEmail: text('employer_email'),
  employerWebsite: text('employer_website'),

  // Job Details
  employmentType: text('employment_type'), // Full-time, Part-time, Contract, Self-employed
  monthlySalary: text('monthly_salary'),
  currency: text('currency'),
  responsibilities: text('responsibilities'),

  // Supervisor/Reference
  supervisorName: text('supervisor_name'),
  supervisorTitle: text('supervisor_title'),
  supervisorPhone: text('supervisor_phone'),
  supervisorEmail: text('supervisor_email'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Education History
export const educationProfiles = pgTable('education_profiles', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  profileId: varchar('profile_id').references(() => userProfiles.id),

  institutionName: text('institution_name').notNull(),
  degree: text('degree').notNull(), // Bachelor's, Master's, PhD, High School, etc.
  fieldOfStudy: text('field_of_study'),

  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // null if ongoing
  graduationDate: date('graduation_date'),

  // Institution Details
  institutionAddress: json('institution_address').$type<{
    street?: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  }>().notNull(),

  institutionWebsite: text('institution_website'),
  studentId: text('student_id'),

  // Academic Details
  gpa: text('gpa'),
  gradeSystem: text('grade_system'), // 4.0, 10.0, Percentage, etc.
  majorSubjects: json('major_subjects').$type<string[]>(),
  achievements: text('achievements'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Family Members
export const familyProfiles = pgTable('family_profiles', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  primaryProfileId: varchar('primary_profile_id').references(() => userProfiles.id),

  relationship: text('relationship').notNull(), // Spouse, Child, Parent, Sibling

  // Personal Information
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  placeOfBirth: text('place_of_birth'),
  gender: text('gender'),
  nationality: text('nationality'),

  // Passport (if applicable)
  passportNumber: text('passport_number'),
  passportExpiry: date('passport_expiry'),
  passportIssuingCountry: text('passport_issuing_country'),

  // Contact
  email: text('email'),
  phone: text('phone'),

  // Current Status
  occupation: text('occupation'),
  employer: text('employer'),

  // For children
  isMinor: boolean('is_minor').default(false),
  schoolName: text('school_name'),
  grade: text('grade'),

  // Address (if different from primary)
  hasSeparateAddress: boolean('has_separate_address').default(false),
  address: json('address').$type<{
    street: string;
    apartment?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Travel History
export const travelHistory = pgTable('travel_history', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  profileId: varchar('profile_id').references(() => userProfiles.id),

  country: text('country').notNull(),
  purpose: text('purpose').notNull(), // Tourism, Business, Study, Work, etc.
  entryDate: date('entry_date').notNull(),
  exitDate: date('exit_date').notNull(),

  // Visa Details
  visaType: text('visa_type'),
  visaNumber: text('visa_number'),
  visaIssuedDate: date('visa_issued_date'),
  visaIssuedBy: text('visa_issued_by'), // Embassy/Consulate

  // Stay Details
  accommodation: text('accommodation'),
  sponsorName: text('sponsor_name'),

  // Entry/Exit Stamps
  entryPort: text('entry_port'),
  exitPort: text('exit_port'),

  // Any Issues
  hadIssues: boolean('had_issues').default(false),
  issueDescription: text('issue_description'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Form Templates - Store country/visa-specific form templates
export const formTemplates = pgTable('form_templates', {
  id: serial('id').primaryKey(),

  country: text('country').notNull(),
  visaType: text('visa_type').notNull(),
  formName: text('form_name').notNull(),
  formVersion: text('form_version'),

  // Field mappings for auto-fill
  fieldMappings: json('field_mappings').$type<{
    fieldId: string;
    fieldName: string;
    fieldLabel: string;
    profileField: string; // Maps to our profile field
    dataSource: 'personal' | 'passport' | 'employment' | 'education' | 'family' | 'travel';
    validation: {
      required: boolean;
      format?: string; // regex or format type
      minLength?: number;
      maxLength?: number;
      dateFormat?: string;
      customRules?: {
        rule: string;
        message: string;
      }[];
    };
  }[]>().notNull(),

  // Country-specific validation rules
  validationRules: json('validation_rules').$type<{
    passportValidityMonths: number; // Minimum months before expiry
    photoRequirements: {
      width: number;
      height: number;
      background: string;
      format: string[];
    };
    ageRestrictions?: {
      minimum?: number;
      maximum?: number;
    };
    financialRequirements?: {
      minimumBalance?: number;
      currency: string;
      monthsOfStatements?: number;
    };
  }>(),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Filled Forms History - Track all filled forms for reuse
export const filledForms = pgTable('filled_forms', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),

  formTemplateId: integer('form_template_id').references(() => formTemplates.id),
  country: text('country').notNull(),
  visaType: text('visa_type').notNull(),
  formName: text('form_name').notNull(),

  // Filled Data
  filledData: json('filled_data').$type<{
    [fieldId: string]: {
      value: string;
      source: 'profile' | 'manual' | 'suggested';
      filledAt: string;
      validationStatus: 'valid' | 'warning' | 'error';
      validationMessage?: string;
    };
  }>().notNull(),

  // Completion tracking
  totalFields: integer('total_fields').notNull(),
  filledFields: integer('filled_fields').notNull(),
  validFields: integer('valid_fields').notNull(),
  completionPercentage: integer('completion_percentage').notNull(),

  // Files
  originalPdfUrl: text('original_pdf_url'),
  filledPdfUrl: text('filled_pdf_url'),

  // Validation results
  validationErrors: json('validation_errors').$type<{
    fieldId: string;
    error: string;
    severity: 'error' | 'warning' | 'info';
  }[]>(),

  // Status
  status: text('status').notNull().default('draft'), // draft, completed, submitted
  submittedAt: timestamp('submitted_at'),
  applicationNumber: text('application_number'), // If submitted

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Validation Rules Library - Common validation patterns
export const validationLibrary = pgTable('validation_library', {
  id: serial('id').primaryKey(),

  ruleName: text('rule_name').notNull().unique(),
  ruleType: text('rule_type').notNull(), // format, dependency, calculation, comparison

  // Rule Definition
  ruleDefinition: json('rule_definition').$type<{
    type: string;
    params?: any;
    errorMessage: string;
    warningMessage?: string;
  }>().notNull(),

  // Examples and usage
  examples: json('examples').$type<string[]>(),
  applicableFields: json('applicable_fields').$type<string[]>(), // Common field types this applies to

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===================================
// TYPE EXPORTS
// ===================================

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type PassportProfile = typeof passportProfiles.$inferSelect;
export type NewPassportProfile = typeof passportProfiles.$inferInsert;

export type EmploymentProfile = typeof employmentProfiles.$inferSelect;
export type NewEmploymentProfile = typeof employmentProfiles.$inferInsert;

export type EducationProfile = typeof educationProfiles.$inferSelect;
export type NewEducationProfile = typeof educationProfiles.$inferInsert;

export type FamilyProfile = typeof familyProfiles.$inferSelect;
export type NewFamilyProfile = typeof familyProfiles.$inferInsert;

export type TravelHistoryRecord = typeof travelHistory.$inferSelect;
export type NewTravelHistoryRecord = typeof travelHistory.$inferInsert;

export type FormTemplate = typeof formTemplates.$inferSelect;
export type NewFormTemplate = typeof formTemplates.$inferInsert;

export type FilledForm = typeof filledForms.$inferSelect;
export type NewFilledForm = typeof filledForms.$inferInsert;

export type ValidationRule = typeof validationLibrary.$inferSelect;
export type NewValidationRule = typeof validationLibrary.$inferInsert;