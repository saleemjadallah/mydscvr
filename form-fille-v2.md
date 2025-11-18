# AI Form Filler MVP Implementation Prompt

## Project Context

You are building the AI Form Filler feature for MYDSCVR (mydscvr.ai), an AI-powered visa and immigration services platform targeting the GCC market. This is one of three core revenue-generating features, priced at AED 50-75 per form filled.

**Existing Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (Railway)
- Storage: Cloudflare R2
- AI: Gemini API (primary)
- Authentication: Passport.js Local Strategy
- Payments: Stripe

**Design System:** Gamma.app-inspired with generous white space, soft gradients, glass morphism effects, and smooth animations. The platform features Jeffrey, an AI chat guide that appears in a fixed sidebar providing contextual assistance throughout workflows.

---

## Feature Overview: AI Form Filler

### Core Value Proposition
- Users fill personal info once → auto-populate across ANY immigration form
- "I filled out my Singapore visa, now I need Thailand visa" → 80% auto-populated
- Validation prevents rejections from stupid mistakes (wrong date format, expired passport, missing required fields)
- Family profiles (spouse, children data ready to go)

### User Pain Points Solved
1. Repetitive data entry across multiple visa applications
2. Form rejections due to format errors (DD/MM/YYYY vs MM/DD/YYYY)
3. Missing required fields due to conditional logic confusion
4. Passport validity issues (6-month rule violations)
5. Character count and field format violations

---

## MVP Scope Definition

### What to Include (MVP)
- Personal profile data storage (name, DOB, nationality, address, contact)
- Family member profiles (spouse, children - basic info only)
- PDF form extraction (both fillable PDFs and scanned documents)
- Intelligent field mapping with fuzzy matching
- Three-tier validation (client → server rules → selective AI)
- Form population and PDF generation
- Confidence-based review routing

### What to Defer (Post-MVP)
- Employment history (complex date ranges, multiple jobs, validation)
- Education history
- Travel history
- Extended family members (parents, siblings)
- Photo compliance integration
- Document validator integration

---

## Technical Architecture

### 1. Document Extraction Layer

**Primary Service:** Azure Document Intelligence (best cost-performance at $10/1000 pages)
- Use prebuilt ID model for passport extraction
- Use Layout model for general form field extraction
- Supports 300+ languages including Arabic (critical for GCC)

**Fallback for Scanned/Poor Quality:** Gemini 2.5 Flash
- 7,500 free requests/month
- Handle handwritten sections and poor-quality scans
- Use for semantic field understanding

**Implementation Approach:**
```typescript
// Smart routing based on document quality
interface ExtractionStrategy {
  documentType: 'passport' | 'visa_form' | 'supporting_doc';
  quality: 'high' | 'medium' | 'low';
  service: 'azure_prebuilt' | 'azure_layout' | 'gemini_flash';
}

// Route documents to optimal extraction service
function routeExtraction(document: UploadedDocument): ExtractionStrategy {
  // Classify document type first
  // Assess quality (resolution, clarity, handwriting presence)
  // Return optimal extraction strategy
}
```

### 2. Canonical Data Model

**Store user data in normalized, country-agnostic format:**

```typescript
// User Profile Schema
interface UserProfile {
  id: string;
  userId: string;
  
  // Names - atomic components for flexible formatting
  names: {
    given: string;
    middle?: string;
    family: string;
    preferred?: string;
    aliases?: string[];
  };
  
  // Demographics
  dateOfBirth: string; // ISO 8601: YYYY-MM-DD
  placeOfBirth: {
    city: string;
    country: string; // ISO 3166-1 alpha-3
  };
  nationality: string; // ISO 3166-1 alpha-3
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  
  // Contact - component-based for international formats
  contact: {
    email: string;
    phone: {
      countryCode: string;
      number: string;
      type: 'mobile' | 'home' | 'work';
    };
  };
  
  // Address - component-based for flexible formatting
  currentAddress: {
    streetNumber?: string;
    streetName: string;
    unit?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    country: string; // ISO 3166-1 alpha-3
  };
  
  // Passport - NO actual passport number stored for MVP
  passport: {
    issuingCountry: string;
    expiryDate: string; // ISO 8601
    // Note: Passport number entered per-form, not stored
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completeness: number; // 0-100 percentage
}

// Family Member Schema
interface FamilyMember {
  id: string;
  profileId: string;
  relationship: 'spouse' | 'child';
  
  names: {
    given: string;
    middle?: string;
    family: string;
  };
  
  dateOfBirth: string;
  nationality: string;
  gender: 'male' | 'female' | 'other';
  
  passport?: {
    issuingCountry: string;
    expiryDate: string;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Field Mapping System

**Form Template Configuration:**
```typescript
interface FormTemplate {
  id: string;
  name: string; // e.g., "UAE Tourist Visa Application"
  country: string;
  visaType: string;
  version: string;
  
  // Field mappings from canonical profile to form fields
  fieldMappings: FieldMapping[];
  
  // Country-specific formatting rules
  formatting: {
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    nameFormat: 'given_family' | 'family_given' | 'full';
    addressFormat: 'usa' | 'uk' | 'gcc' | 'asia';
  };
  
  // Validation rules specific to this form
  validationRules: ValidationRule[];
  
  // Conditional field logic
  conditionalFields: ConditionalField[];
}

interface FieldMapping {
  formFieldId: string; // Field identifier in PDF
  formFieldLabel: string; // Human-readable label
  canonicalPath: string; // Path in user profile (e.g., "names.given")
  
  // Transformation function if needed
  transform?: 'uppercase' | 'lowercase' | 'date_format' | 'phone_format' | 'custom';
  customTransform?: string; // Function name for custom transforms
  
  // Fuzzy matching configuration
  alternateLabels?: string[]; // ["First Name", "Given Name", "Forename"]
  matchThreshold: number; // 0-100, default 80
}

interface ConditionalField {
  fieldId: string;
  condition: {
    dependsOn: string; // Field ID
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than';
    value: any;
  };
  action: 'required' | 'hidden' | 'optional';
  message?: string; // Validation message if required
}
```

**Fuzzy Matching Implementation:**
```typescript
import Fuse from 'fuse.js';

// Match extracted field labels to canonical fields
function matchFieldToCanonical(
  extractedLabel: string,
  fieldMappings: FieldMapping[]
): { mapping: FieldMapping; confidence: number } | null {
  
  const fuse = new Fuse(fieldMappings, {
    keys: ['formFieldLabel', 'alternateLabels'],
    threshold: 0.3, // Lower = stricter matching
    includeScore: true,
  });
  
  const results = fuse.search(extractedLabel);
  
  if (results.length === 0) return null;
  
  const best = results[0];
  const confidence = (1 - (best.score || 0)) * 100;
  
  return {
    mapping: best.item,
    confidence,
  };
}
```

### 4. Three-Tier Validation System

**Tier 1: Client-Side Instant Validation (Zod)**
```typescript
import { z } from 'zod';

// Profile validation schema
const profileSchema = z.object({
  names: z.object({
    given: z.string().min(1, "First name is required").max(50),
    middle: z.string().max(50).optional(),
    family: z.string().min(1, "Last name is required").max(50),
  }),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .refine((date) => {
      const dob = new Date(date);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 0 && age <= 120;
    }, "Invalid date of birth"),
  
  contact: z.object({
    email: z.string().email("Invalid email format"),
    phone: z.object({
      countryCode: z.string().regex(/^\+\d{1,4}$/, "Invalid country code"),
      number: z.string().min(6).max(15),
    }),
  }),
  
  // ... more fields
});
```

**Tier 2: Server-Side Rule Engine (JSON Rules Engine)**
```typescript
import { Engine } from 'json-rules-engine';

// Initialize rule engine
const engine = new Engine();

// Passport validity rule (6-month rule)
engine.addRule({
  conditions: {
    all: [{
      fact: 'passportExpiry',
      operator: 'lessThan',
      value: { fact: 'requiredValidity' }
    }]
  },
  event: {
    type: 'validation_error',
    params: {
      field: 'passport.expiryDate',
      message: 'Passport must be valid for at least 6 months after your travel date',
      severity: 'error'
    }
  }
});

// Conditional field requirement
engine.addRule({
  conditions: {
    all: [
      {
        fact: 'maritalStatus',
        operator: 'equal',
        value: 'married'
      },
      {
        fact: 'spouseInfo',
        operator: 'equal',
        value: null
      }
    ]
  },
  event: {
    type: 'validation_error',
    params: {
      field: 'spouse',
      message: 'Spouse information is required for married applicants',
      severity: 'error'
    }
  }
});

// Date format detection and correction
engine.addRule({
  conditions: {
    all: [{
      fact: 'dateFormatMismatch',
      operator: 'equal',
      value: true
    }]
  },
  event: {
    type: 'validation_warning',
    params: {
      field: 'dates',
      message: 'Date format should be DD/MM/YYYY for this form',
      suggestion: 'auto_convert',
      severity: 'warning'
    }
  }
});

// Run validation
async function validateApplication(data: any, formTemplate: FormTemplate) {
  // Add facts to engine
  engine.addFact('passportExpiry', data.passport.expiryDate);
  engine.addFact('requiredValidity', calculateRequiredValidity(data.travelDate, formTemplate.country));
  engine.addFact('maritalStatus', data.maritalStatus);
  engine.addFact('spouseInfo', data.familyMembers?.find(m => m.relationship === 'spouse'));
  
  const results = await engine.run();
  return results.events;
}
```

**Tier 3: Selective AI Validation (Gemini Flash)**
```typescript
// Only invoke for edge cases (< 5% of forms)
async function aiValidation(
  formData: any,
  extractedFields: any[],
  issues: ValidationIssue[]
): Promise<AIValidationResult> {
  
  // Only use AI for:
  // 1. Low confidence extractions (< 70%)
  // 2. Free-text fields requiring semantic understanding
  // 3. Contradiction detection across multiple fields
  
  const lowConfidenceFields = extractedFields.filter(f => f.confidence < 70);
  
  if (lowConfidenceFields.length === 0 && issues.length === 0) {
    return { needsAI: false };
  }
  
  const prompt = `
    Analyze this visa application data for potential issues:
    
    Form Data: ${JSON.stringify(formData, null, 2)}
    
    Low Confidence Extractions: ${JSON.stringify(lowConfidenceFields, null, 2)}
    
    Please identify:
    1. Any contradictions between fields
    2. Potential data entry errors
    3. Fields that may need human review
    
    Respond in JSON format:
    {
      "issues": [
        {
          "field": "fieldName",
          "issue": "description",
          "suggestion": "recommended action",
          "confidence": 0-100
        }
      ],
      "overallConfidence": 0-100
    }
  `;
  
  const response = await geminiFlash.generateContent(prompt);
  return JSON.parse(response.text());
}
```

### 5. Form Population Engine

**PDF Generation with pdf-lib:**
```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function populateForm(
  templatePath: string,
  userData: UserProfile,
  formTemplate: FormTemplate
): Promise<Uint8Array> {
  
  // Load the PDF template
  const templateBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  // Get form fields
  const form = pdfDoc.getForm();
  
  // Populate each field
  for (const mapping of formTemplate.fieldMappings) {
    const value = getValueFromPath(userData, mapping.canonicalPath);
    
    if (value) {
      // Apply transformation if needed
      const transformedValue = applyTransform(value, mapping, formTemplate.formatting);
      
      try {
        const field = form.getTextField(mapping.formFieldId);
        field.setText(transformedValue);
      } catch (error) {
        // Field might be checkbox, dropdown, etc.
        handleSpecialField(form, mapping.formFieldId, transformedValue);
      }
    }
  }
  
  // Flatten form to prevent editing (optional)
  // form.flatten();
  
  return pdfDoc.save();
}

function applyTransform(
  value: any,
  mapping: FieldMapping,
  formatting: FormTemplate['formatting']
): string {
  
  switch (mapping.transform) {
    case 'uppercase':
      return String(value).toUpperCase();
      
    case 'date_format':
      return formatDate(value, formatting.dateFormat);
      
    case 'phone_format':
      return formatPhone(value);
      
    default:
      return String(value);
  }
}

function formatDate(isoDate: string, format: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return isoDate;
  }
}
```

### 6. Confidence-Based Review Routing

```typescript
interface ProcessingResult {
  formId: string;
  status: 'auto_approved' | 'needs_review' | 'needs_full_review';
  overallConfidence: number;
  
  fieldResults: {
    fieldId: string;
    value: string;
    confidence: number;
    source: 'auto_populated' | 'extracted' | 'user_input';
    issues?: ValidationIssue[];
  }[];
  
  reviewItems?: {
    fieldId: string;
    reason: string;
    suggestion?: string;
  }[];
}

function routeForReview(result: ProcessingResult): ReviewDecision {
  // Auto-approve if confidence > 90% and no errors
  if (result.overallConfidence >= 90 && !hasErrors(result)) {
    return {
      action: 'auto_approve',
      message: 'Application ready for submission'
    };
  }
  
  // Needs spot-check if confidence 70-89%
  if (result.overallConfidence >= 70) {
    return {
      action: 'spot_check',
      message: 'Please review highlighted fields',
      highlightFields: result.fieldResults
        .filter(f => f.confidence < 85 || f.issues?.length)
        .map(f => f.fieldId)
    };
  }
  
  // Full review if confidence < 70%
  return {
    action: 'full_review',
    message: 'This form requires manual review',
    reason: 'Low extraction confidence or multiple validation issues'
  };
}
```

---

## Database Schema

```sql
-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Names (JSONB for flexibility)
  names JSONB NOT NULL,
  
  -- Demographics
  date_of_birth DATE NOT NULL,
  place_of_birth JSONB,
  nationality VARCHAR(3) NOT NULL, -- ISO 3166-1 alpha-3
  gender VARCHAR(10),
  marital_status VARCHAR(20),
  
  -- Contact
  contact JSONB NOT NULL,
  
  -- Address
  current_address JSONB NOT NULL,
  
  -- Passport (no number stored)
  passport JSONB,
  
  -- Metadata
  completeness INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Family members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES user_profiles(id),
  relationship VARCHAR(20) NOT NULL,
  
  names JSONB NOT NULL,
  date_of_birth DATE,
  nationality VARCHAR(3),
  gender VARCHAR(10),
  passport JSONB,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Form templates table
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(3) NOT NULL,
  visa_type VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  
  -- Template configuration
  field_mappings JSONB NOT NULL,
  formatting JSONB NOT NULL,
  validation_rules JSONB,
  conditional_fields JSONB,
  
  -- Template file
  template_url TEXT NOT NULL, -- R2 URL
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_template_version UNIQUE (country, visa_type, version)
);

-- Filled forms table
CREATE TABLE filled_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  profile_id UUID NOT NULL REFERENCES user_profiles(id),
  template_id UUID NOT NULL REFERENCES form_templates(id),
  
  -- Processing results
  status VARCHAR(50) NOT NULL, -- draft, processing, review, completed, failed
  overall_confidence INTEGER,
  
  -- Field data
  field_results JSONB NOT NULL,
  review_items JSONB,
  
  -- Generated PDF
  output_url TEXT, -- R2 URL
  
  -- Metadata
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Form fill transactions (for billing)
CREATE TABLE form_fill_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  filled_form_id UUID REFERENCES filled_forms(id),
  
  amount_aed INTEGER NOT NULL, -- Amount in fils
  status VARCHAR(50) NOT NULL, -- pending, completed, refunded
  stripe_payment_id TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_family_profile ON family_members(profile_id);
CREATE INDEX idx_templates_country ON form_templates(country, visa_type);
CREATE INDEX idx_filled_forms_user ON filled_forms(user_id);
CREATE INDEX idx_filled_forms_status ON filled_forms(status);
```

---

## API Endpoints

```typescript
// Profile Management
POST   /api/profiles                    // Create user profile
GET    /api/profiles/me                 // Get current user's profile
PUT    /api/profiles/me                 // Update profile
GET    /api/profiles/me/completeness    // Get profile completeness score

// Family Members
POST   /api/profiles/me/family          // Add family member
GET    /api/profiles/me/family          // List family members
PUT    /api/profiles/me/family/:id      // Update family member
DELETE /api/profiles/me/family/:id      // Remove family member

// Form Templates
GET    /api/templates                   // List available templates
GET    /api/templates/:id               // Get template details
GET    /api/templates/search            // Search by country/visa type

// Form Filling
POST   /api/forms/extract               // Extract fields from uploaded PDF
POST   /api/forms/fill                  // Fill form with user data
GET    /api/forms/:id                   // Get filled form details
GET    /api/forms/:id/download          // Download filled PDF
POST   /api/forms/:id/validate          // Run validation on filled form
PUT    /api/forms/:id/fields            // Update specific fields

// Form History
GET    /api/forms                       // List user's filled forms
DELETE /api/forms/:id                   // Delete filled form

// Payments
POST   /api/forms/:id/checkout          // Create Stripe checkout for form
POST   /api/forms/webhook               // Stripe webhook handler
```

---

## Frontend Components

### Key Pages

1. **Profile Setup Page** (`/profile/setup`)
   - Progressive multi-step form
   - Step 1: Basic info (name, DOB, nationality)
   - Step 2: Contact details
   - Step 3: Current address
   - Step 4: Passport details
   - Step 5: Family members (optional)
   - Completeness indicator
   - Jeffrey sidebar with contextual tips

2. **Form Selection Page** (`/forms`)
   - Country/visa type filters
   - Search functionality
   - Popular forms section
   - Recently used forms
   - Template cards with preview

3. **Form Filling Page** (`/forms/:templateId/fill`)
   - Split view: PDF preview + form fields
   - Auto-populated fields highlighted in green
   - Fields needing review highlighted in yellow
   - Validation errors in red
   - Jeffrey sidebar showing validation status
   - Real-time confidence score

4. **Review Page** (`/forms/:id/review`)
   - Side-by-side comparison
   - Field-by-field approval
   - Edit capability for flagged fields
   - Final validation check
   - Payment CTA

5. **Form History Page** (`/forms/history`)
   - List of filled forms
   - Status indicators
   - Download links
   - Re-use data option

### Key Components

```typescript
// Profile completeness indicator
<ProfileCompleteness 
  score={profile.completeness}
  missingFields={['passport.expiryDate', 'currentAddress.postalCode']}
  onComplete={() => navigate('/forms')}
/>

// Form field with confidence indicator
<FormField
  label="First Name"
  value={fieldData.value}
  confidence={fieldData.confidence}
  source={fieldData.source}
  issues={fieldData.issues}
  onChange={handleFieldChange}
/>

// Validation status panel
<ValidationPanel
  errors={validationResult.errors}
  warnings={validationResult.warnings}
  suggestions={validationResult.suggestions}
  overallConfidence={validationResult.confidence}
/>

// Jeffrey contextual assistant
<JeffreySidebar
  context="form_filling"
  currentField={activeField}
  validationIssues={issues}
  suggestions={suggestions}
/>

// PDF preview with field highlighting
<PDFPreview
  url={templateUrl}
  highlightedFields={fieldsNeedingReview}
  onFieldClick={handleFieldFocus}
/>
```

---

## Jeffrey Integration

Jeffrey should provide contextual assistance throughout the form filling workflow:

### Context-Aware Responses

```typescript
const jeffreyContexts = {
  profile_setup: {
    greeting: "Let's set up your profile! This info will auto-fill your visa forms.",
    tips: [
      "Use your name exactly as it appears on your passport",
      "Your address format will be adjusted for each country's requirements",
      "Adding family members now saves time on family visa applications"
    ]
  },
  
  form_filling: {
    greeting: "I've auto-filled {autoFilledCount} fields from your profile!",
    tips: [
      "Fields in yellow need your review",
      "I'll check date formats automatically",
      "Your passport must be valid for 6 months after travel"
    ]
  },
  
  validation_error: {
    passport_expiry: "Your passport expires too soon for this visa. Most countries require 6 months validity.",
    date_format: "This form uses DD/MM/YYYY format. I've converted your dates automatically.",
    missing_field: "This field is required because you indicated you're married."
  },
  
  review: {
    greeting: "Almost done! Just review these {reviewCount} fields and you're ready to submit.",
    tips: [
      "Double-check names match your passport exactly",
      "Verify all dates are in the correct format",
      "Make sure contact numbers include country codes"
    ]
  }
};
```

### Jeffrey Personality for Form Filling

- **Reassuring**: "Don't worry about format differences - I'll handle the conversions"
- **Proactive**: "I noticed your passport expires in 5 months. Some countries require 6 months validity."
- **Educational**: "Tip: GCC countries use DD/MM/YYYY format, so I've adjusted your dates"
- **Encouraging**: "Great progress! Your profile is 85% complete. Just add your postal code to finish."

---

## Validation Rules Database

### Country-Specific Passport Validity Rules

```typescript
const PASSPORT_VALIDITY_RULES: Record<string, ValidityRule> = {
  // 6-month rule countries
  'UAE': { months: 6, from: 'entry' },
  'SAU': { months: 6, from: 'entry' },
  'QAT': { months: 6, from: 'entry' },
  'KWT': { months: 6, from: 'entry' },
  'BHR': { months: 6, from: 'entry' },
  'OMN': { months: 6, from: 'entry' },
  'SGP': { months: 6, from: 'entry' },
  'THA': { months: 6, from: 'entry' },
  'USA': { months: 6, from: 'entry' },
  'IND': { months: 6, from: 'entry' },
  
  // 3-month rule (Schengen)
  'DEU': { months: 3, from: 'departure' },
  'FRA': { months: 3, from: 'departure' },
  'ITA': { months: 3, from: 'departure' },
  'ESP': { months: 3, from: 'departure' },
  
  // No validity requirement
  'GBR': { months: 0, from: 'entry' },
  'AUS': { months: 0, from: 'entry' },
  'CAN': { months: 0, from: 'entry' },
};
```

### Date Format by Country

```typescript
const DATE_FORMATS: Record<string, string> = {
  // DD/MM/YYYY (most of world)
  'UAE': 'DD/MM/YYYY',
  'GBR': 'DD/MM/YYYY',
  'IND': 'DD/MM/YYYY',
  'AUS': 'DD/MM/YYYY',
  'SAU': 'DD/MM/YYYY',
  
  // MM/DD/YYYY (USA style)
  'USA': 'MM/DD/YYYY',
  'PHL': 'MM/DD/YYYY',
  
  // YYYY-MM-DD (ISO style)
  'CHN': 'YYYY-MM-DD',
  'JPN': 'YYYY-MM-DD',
  'KOR': 'YYYY-MM-DD',
};
```

---

## Cost Optimization

### Extraction Costs (per form)
- Azure Document Intelligence: ~$0.01-0.02
- Gemini Flash (fallback): ~$0.001-0.005
- **Target: $0.02-0.04 per form**

### Validation Costs (per form)
- Zod (client): $0
- JSON Rules Engine (server): $0
- Gemini Flash (edge cases, ~5%): ~$0.001
- **Target: $0.001-0.005 per form**

### Total Processing Cost
- **Target: $0.025-0.05 per form**
- **Pricing: AED 50-75 per form (≈ $13-20 USD)**
- **Gross margin: 99%+**

### Caching Strategy
- Cache form templates: 24-hour TTL in Redis
- Cache validation rules: In-memory with 1-hour refresh
- Cache country requirements: Weekly refresh
- Cache LLM responses for similar inputs: 80% hit rate target

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema setup
- [ ] User profile CRUD API
- [ ] Family member management
- [ ] Basic Zod validation
- [ ] Profile completeness calculation

### Phase 2: Extraction (Week 3-4)
- [ ] Azure Document Intelligence integration
- [ ] Gemini Flash fallback integration
- [ ] Document quality assessment
- [ ] Smart routing logic
- [ ] Field extraction pipeline

### Phase 3: Mapping & Population (Week 5-6)
- [ ] Form template system
- [ ] Fuzzy field matching
- [ ] Data transformation functions
- [ ] PDF population with pdf-lib
- [ ] Date/phone/address formatters

### Phase 4: Validation (Week 7-8)
- [ ] JSON Rules Engine setup
- [ ] Passport validity rules
- [ ] Conditional field rules
- [ ] AI validation integration
- [ ] Confidence scoring system

### Phase 5: Frontend (Week 9-10)
- [ ] Profile setup wizard
- [ ] Form selection page
- [ ] Form filling interface
- [ ] Review page
- [ ] Jeffrey integration

### Phase 6: Polish & Payment (Week 11-12)
- [ ] Stripe checkout integration
- [ ] Form history page
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing & QA

---

## Success Metrics

### Accuracy Targets
- Field extraction accuracy: 92-96%
- Auto-fill accuracy: 95%+
- Validation catch rate: 98%+ of rejectable errors

### Performance Targets
- Profile creation: < 3 minutes
- Form extraction: < 10 seconds
- Form population: < 5 seconds
- Full validation: < 3 seconds
- Total form fill time: < 30 seconds

### User Experience Targets
- Auto-fill rate: 80%+ of fields
- Human review rate: 10-15% of forms
- Form completion rate: 90%+
- Customer satisfaction: 4.5+ stars

### Business Targets
- Cost per form: < $0.05
- Gross margin: > 99%
- Processing volume: 1,000+ forms/month by Month 3

---

## Security Considerations

### Data Protection
- AES-256 encryption at rest for all PII
- TLS 1.3 for all data in transit
- No passport numbers stored (entered per-form only)
- Field-level encryption for sensitive data
- 90-day key rotation policy

### Access Control
- Role-based access control (RBAC)
- JWT tokens with 24-hour expiry
- Rate limiting on all endpoints
- Audit logging for all data access

### Compliance
- GDPR-compliant consent management
- Right to be forgotten (soft delete + data purge)
- Data minimization (collect only necessary fields)
- UAE PDPL compliance for GCC market

---

## Testing Requirements

### Unit Tests
- All validation rules
- Date/phone/address formatters
- Fuzzy matching algorithm
- Transformation functions

### Integration Tests
- Azure Document Intelligence API
- Gemini Flash API
- PDF population pipeline
- Stripe payment flow

### E2E Tests
- Complete form fill workflow
- Profile setup flow
- Family member management
- Form history and re-use

### Load Tests
- 100 concurrent form extractions
- 1,000 forms/hour throughput
- API response times < 500ms

---

## Monitoring & Observability

### Key Metrics to Track
- Extraction accuracy per document type
- Processing latency by stage
- Confidence score distributions
- Human review rates
- API costs by provider
- Cache hit rates
- Error rates by type

### Alerts
- Accuracy drops below 85%
- Latency exceeds 60 seconds
- Error rate exceeds 5%
- Cost per form exceeds $0.10
- API provider errors

### Tools
- Datadog or New Relic for APM
- Sentry for error tracking
- Custom dashboard for business metrics

---

## Deliverables

1. **Backend API** - Complete REST API with all endpoints
2. **Database Schema** - PostgreSQL with proper indexes
3. **Extraction Pipeline** - Azure + Gemini integration
4. **Validation Engine** - Three-tier validation system
5. **PDF Generator** - Form population and output
6. **Frontend Pages** - All UI components and pages
7. **Jeffrey Integration** - Contextual AI assistant
8. **Admin Dashboard** - Form template management
9. **Documentation** - API docs, deployment guide
10. **Test Suite** - Unit, integration, E2E tests

---

## Notes for Implementation

1. **Start with GCC countries** - UAE, Saudi, Qatar forms first (core market)
2. **Use progressive profiling** - Don't overwhelm users with 50 fields upfront
3. **Prioritize validation UX** - Clear, actionable error messages
4. **Make Jeffrey helpful** - Proactive suggestions, not just reactive errors
5. **Cache aggressively** - Form templates, rules, LLM responses
6. **Log everything** - Need data to improve extraction accuracy
7. **Plan for scale** - Architecture should handle 10K forms/month
8. **Consider offline** - Users may fill forms with poor connectivity

---

## Questions to Resolve During Implementation

1. Should we allow users to edit auto-populated fields before validation?
2. How do we handle forms that aren't in our template database?
3. Should we offer a "review all fields" option for cautious users?
4. How do we handle multi-page forms with different sections?
5. Should we integrate with visa tracking after form submission?
6. How do we handle form updates when templates change?
7. Should we offer bulk form filling for travel agents?

---

This prompt provides a complete blueprint for implementing the AI Form Filler MVP. The key differentiators are:

1. **Smart hybrid extraction** - Azure for accuracy, Gemini for edge cases
2. **Canonical data model** - Store once, transform for any form
3. **Three-tier validation** - Cost-effective with 99% deterministic rules
4. **Confidence-based routing** - Automate what's certain, review what's not
5. **Jeffrey integration** - AI assistant makes validation feel helpful, not punitive

Build this right, and you'll have a form filler that's faster, cheaper, and more accurate than any competitor in the GCC market.