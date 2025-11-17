import { pgTable, text, serial, integer, timestamp, json, varchar } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Nullable for Google OAuth users
  firstName: text('first_name').notNull(),
  lastName: text('last_name').default(''),
  profileImageUrl: text('profile_image_url'),

  // Stripe fields
  stripeCustomerId: text('stripe_customer_id'),

  // Auth provider tracking
  authProvider: text('auth_provider').default('email').notNull(), // 'email' | 'google'
  firebaseUid: text('firebase_uid'), // For Google OAuth users

  // Usage tracking
  uploads_used: integer('uploads_used').default(0).notNull(),
  batches_created: integer('batches_created').default(0).notNull(),

  // Edit credits tracking
  editCreditsRemaining: integer('edit_credits_remaining').default(0).notNull(),
  totalEditCreditsEarned: integer('total_edit_credits_earned').default(0).notNull(),

  // Premium/Free tier
  isFreeUser: integer('is_free_user').default(0).notNull(), // 1 = free unlimited access, 0 = normal user

  // Onboarding status
  onboardingCompleted: integer('onboarding_completed').default(0).notNull(), // 1 = completed, 0 = not completed

  // Travel profile from onboarding
  travelProfile: json('travel_profile').$type<{
    destinationCountry: string;
    travelPurpose: string;
    nationality: string;
    travelDates: { start: string; end: string };
    specialConcerns: string[];
    visaRequirements?: {
      visaType: string;
      processingTime: string;
      requiredDocuments: string[];
      photoRequirements: {
        dimensions: string;
        background: string;
        specifications: string[];
      };
      fees: string;
      validity: string;
      additionalNotes: string[];
    };
    lastUpdated: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Headshot batches table (replaces menu items)
export const headshotBatches = pgTable('headshot_batches', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status').notNull().default('processing'), // processing, completed, failed

  // Input photos
  uploadedPhotos: json('uploaded_photos').$type<string[]>(), // Array of R2 URLs
  photoCount: integer('photo_count').notNull(),

  // Generation settings
  plan: text('plan').notNull(), // basic, professional, executive
  styleTemplates: json('style_templates').$type<string[]>(), // [\"linkedin\", \"corporate\", \"creative\"]
  backgrounds: json('backgrounds').$type<string[]>(), // Selected backgrounds (if custom)
  outfits: json('outfits').$type<string[]>(), // Selected outfit styles (if custom)

  // Edit credits allocated with this batch
  editCreditsAllocated: integer('edit_credits_allocated').default(0).notNull(),

  // Results
  generatedHeadshots: json('generated_headshots').$type<{
    url: string;
    template: string;
    background: string;
    outfit: string;
    thumbnail: string;
    platformSpecs: {
      aspectRatio: string;
      dimensions: string;
      optimizedFor: string;
    };
  }[]>(),
  headshotCount: integer('headshot_count').default(0),
  headshotsByTemplate: json('headshots_by_template').$type<{
    [template: string]: number;
  }>(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTimeMinutes: integer('processing_time_minutes'),

  // Pricing
  amountPaid: integer('amount_paid').notNull(), // In cents
  stripePaymentId: text('stripe_payment_id'),
});

// Edit requests table
export const editRequests = pgTable('edit_requests', {
  id: serial('id').primaryKey(),
  batchId: integer('batch_id').notNull().references(() => headshotBatches.id),
  userId: text('user_id').notNull().references(() => users.id),
  headshotId: text('headshot_id').notNull(), // URL or identifier of the original headshot
  editType: text('edit_type').notNull(), // background_change, outfit_change, regenerate
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed

  // Edit details
  outfitId: text('outfit_id'), // For outfit_change type
  colorVariant: text('color_variant'), // Optional color variant
  costInCredits: integer('cost_in_credits').notNull().default(2), // Cost: 2 credits for outfit changes

  // Results
  resultUrl: text('result_url'), // URL of the edited headshot
  thumbnailUrl: text('thumbnail_url'), // Thumbnail of edited headshot
  errorMessage: text('error_message'), // If failed

  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTimeSeconds: integer('processing_time_seconds'),
});

// OTP codes table for email verification and login
export const otpCodes = pgTable('otp_codes', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: varchar('purpose', { length: 32 }).notNull(), // 'login' | 'registration'
  code: varchar('code', { length: 12 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table (auto-created by connect-pg-simple, defined here for reference)
export const sessions = pgTable('sessions', {
  sid: varchar('sid').primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

// ===================================
// VISADOCS TABLES
// ===================================

// Visa packages table (similar to headshot_batches but for visa document processing)
export const visaPackages = pgTable('visa_packages', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),

  // Visa application details
  visaType: text('visa_type').notNull(),
  // work_visa, tourist_visa, family_visa, student_visa, residence_visa, business_visa

  destinationCountry: text('destination_country').notNull(),
  // uae, saudi_arabia, qatar, oman, bahrain, kuwait, schengen, usa, uk, canada

  nationality: text('nationality'),
  applicantName: text('applicant_name'),
  passportNumber: text('passport_number'),

  // Documents uploaded
  uploadedDocuments: json('uploaded_documents').$type<{
    type: string; // passport, education, employment, bank_statement, etc.
    originalName: string;
    r2Url: string;
    uploadedAt: Date;
    extractedData?: Record<string, any>; // Gemini extraction results
    status: 'pending' | 'processed' | 'failed';
  }[]>(),

  // AI-generated outputs
  visaPhotos: json('visa_photos').$type<{
    format: string; // uae_visa, schengen_visa, us_visa, passport_photo
    url: string;
    thumbnail: string;
    specifications: {
      dimensions: string;
      background: string;
      faceSize: string;
    };
  }[]>(),

  translatedDocuments: json('translated_documents').$type<{
    originalUrl: string;
    translatedUrl: string;
    sourceLanguage: string;
    targetLanguage: string;
    translatedAt: Date;
  }[]>(),

  filledForms: json('filled_forms').$type<{
    formType: string; // visa_application, sponsorship_form, etc.
    originalFormUrl: string;
    filledFormUrl: string;
    filledAt: Date;
    fields: Record<string, any>; // Field mapping
    fillMethod: 'ai_vision' | 'pdf_lib' | 'instafill'; // Which method was used
  }[]>(),

  // Requirements checklist
  requirements: json('requirements').$type<{
    category: string; // mandatory, optional
    item: string;
    description: string;
    completed: boolean;
    documentId?: string;
    notes?: string;
  }[]>(),

  completenessScore: integer('completeness_score'), // 0-100
  missingItems: json('missing_items').$type<string[]>(),

  // Plan & pricing
  plan: text('plan').notNull(), // basic, professional, premium
  amountPaid: integer('amount_paid').notNull(), // In cents
  stripePaymentId: text('stripe_payment_id'),

  // Status tracking
  status: text('status').notNull().default('in_progress'),
  // in_progress, documents_uploaded, processing, ready_for_review, ready_for_submission, completed

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// RAG knowledge base for visa requirements
export const visaKnowledge = pgTable('visa_knowledge', {
  id: serial('id').primaryKey(),
  country: text('country').notNull(),
  visaType: text('visa_type').notNull(),
  documentUrl: text('document_url').notNull(), // R2 URL of PDF
  documentName: text('document_name').notNull(),
  lastUpdated: timestamp('last_updated').notNull(),

  // Vector embeddings for RAG
  chunks: json('chunks').$type<{
    text: string;
    embedding: number[];
    metadata: {
      page?: number;
      section?: string;
      chunkIndex: number;
    };
  }[]>(),

  indexed: integer('indexed').default(0).notNull(), // Boolean: 0 = false, 1 = true
  indexedAt: timestamp('indexed_at'),
});

// AI chat sessions for interactive Q&A
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  packageId: integer('package_id').references(() => visaPackages.id), // Optional: link to specific visa package

  // Chat configuration
  visaContext: json('visa_context').$type<{
    country?: string;
    visaType?: string;
  }>(), // Context for better RAG retrieval

  messages: json('messages').$type<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: {
      text: string;
      metadata: {
        documentName: string;
        page?: number;
      };
    }[]; // Citations from RAG
  }[]>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================================
// MYDSCVR CORE TRANSACTIONAL FEATURES
// ===================================

// Document Validator table
export const documentValidations = pgTable('document_validations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  documentType: text('document_type').notNull(), // attested_degree, marriage_certificate, passport_copy, etc.
  status: text('status').notNull().default('processing'), // processing, completed, failed

  // Input
  uploadedDocumentUrl: text('uploaded_document_url').notNull(),

  // Validation results
  score: integer('score'), // 0-100 compliance score
  issues: json('issues').$type<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    location?: string;
  }[]>(),

  validationReport: json('validation_report').$type<{
    attestationCheck: { passed: boolean; details: string };
    signatureCheck: { passed: boolean; details: string };
    formatCheck: { passed: boolean; details: string };
    expiryCheck: { passed: boolean; details: string };
    legibilityCheck: { passed: boolean; details: string };
  }>(),

  reportPdfUrl: text('report_pdf_url'), // Generated PDF report URL

  // Pricing
  amountPaid: integer('amount_paid').notNull(), // In fils (AED cents)
  stripePaymentId: text('stripe_payment_id'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTimeSeconds: integer('processing_time_seconds'),
});

// Photo Compliance table
export const photoCompliance = pgTable('photo_compliance', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  visaType: text('visa_type').notNull(), // uae_visa, schengen_visa, us_visa, passport_photo, etc.
  status: text('status').notNull().default('processing'), // processing, completed, failed

  // Input photos
  uploadedPhotos: json('uploaded_photos').$type<string[]>(), // Array of R2 URLs

  // Compliance results
  results: json('results').$type<{
    photoUrl: string;
    compliant: boolean;
    issues: {
      dimension: boolean;
      background: boolean;
      faceSize: boolean;
      lighting: boolean;
      quality: boolean;
    };
    correctedPhotoUrl?: string; // Auto-corrected photo if applicable
    score: number; // 0-100
  }[]>(),

  specifications: json('specifications').$type<{
    requiredDimensions: string;
    requiredBackground: string;
    requiredFaceSize: string;
  }>(),

  // Pricing
  amountPaid: integer('amount_paid').notNull(), // In fils (AED cents)
  stripePaymentId: text('stripe_payment_id'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTimeSeconds: integer('processing_time_seconds'),
});

// Travel Itinerary table
export const travelItineraries = pgTable('travel_itineraries', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  destination: text('destination').notNull(), // schengen, uk, us, canada, etc.
  status: text('status').notNull().default('processing'), // processing, completed, failed

  // Input details
  countries: json('countries').$type<string[]>(), // For multi-country trips (Schengen)
  duration: integer('duration').notNull(), // In days
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  travelPurpose: text('travel_purpose'), // tourism, business, family_visit, etc.
  budget: text('budget'), // low, medium, high

  // Generated itinerary
  itinerary: json('itinerary').$type<{
    day: number;
    date: string;
    city: string;
    country: string;
    activities: {
      time: string;
      activity: string;
      location: string;
      description: string;
    }[];
    accommodation: {
      name: string;
      address: string;
      checkIn: string;
      checkOut: string;
      confirmationNumber?: string;
    };
    transportation: {
      type: string;
      from: string;
      to: string;
      time: string;
      details: string;
    }[];
  }[]>(),

  flightDetails: json('flight_details').$type<{
    outbound: {
      airline: string;
      flightNumber: string;
      departure: { airport: string; time: string; date: string };
      arrival: { airport: string; time: string; date: string };
    };
    return: {
      airline: string;
      flightNumber: string;
      departure: { airport: string; time: string; date: string };
      arrival: { airport: string; time: string; date: string };
    };
  }>(),

  itineraryPdfUrl: text('itinerary_pdf_url'), // Generated PDF itinerary URL

  // Pricing
  amountPaid: integer('amount_paid').notNull(), // In fils (AED cents)
  stripePaymentId: text('stripe_payment_id'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTimeMinutes: integer('processing_time_minutes'),
});

// Export all form filler tables
export * from './schema-formfiller.js';

// ===================================
// TYPE EXPORTS
// ===================================

// Existing types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type HeadshotBatch = typeof headshotBatches.$inferSelect;
export type NewHeadshotBatch = typeof headshotBatches.$inferInsert;
export type EditRequest = typeof editRequests.$inferSelect;
export type NewEditRequest = typeof editRequests.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;

// VisaDocs types
export type VisaPackage = typeof visaPackages.$inferSelect;
export type NewVisaPackage = typeof visaPackages.$inferInsert;
export type VisaKnowledge = typeof visaKnowledge.$inferSelect;
export type NewVisaKnowledge = typeof visaKnowledge.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

// MYDSCVR Core Features types
export type DocumentValidation = typeof documentValidations.$inferSelect;
export type NewDocumentValidation = typeof documentValidations.$inferInsert;
export type PhotoCompliance = typeof photoCompliance.$inferSelect;
export type NewPhotoCompliance = typeof photoCompliance.$inferInsert;
export type TravelItinerary = typeof travelItineraries.$inferSelect;
export type NewTravelItinerary = typeof travelItineraries.$inferInsert;
