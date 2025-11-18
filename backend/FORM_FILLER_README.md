# AI Form Filler Feature - Production Documentation

## Overview

The AI Form Filler is a comprehensive, production-ready feature that automatically extracts, validates, and populates visa application forms using advanced AI and OCR technologies.

### Key Value Proposition
- **Auto-fill 80%+ of form fields** from user profile data
- **Three-tier validation** prevents form rejections
- **Smart extraction** with Azure DI + Gemini fallback
- **Country-specific rules** for 50+ countries
- **Cost-effective**: ~$0.02-0.05 per form

---

## Architecture

### Tech Stack

**Dependencies Installed:**
```json
{
  "pdf-lib": "PDF manipulation and form filling",
  "pdf-parse": "PDF text extraction",
  "fuse.js": "Fuzzy string matching for field mapping",
  "json-rules-engine": "Rule-based validation",
  "date-fns": "Date formatting and manipulation",
  "libphonenumber-js": "International phone number formatting",
  "@azure/ai-form-recognizer": "Azure Document Intelligence SDK",
  "canvas": "PDF rendering support"
}
```

### Component Overview

#### 1. **Extraction Layer** (`backend/src/lib/`)

**azureDocumentIntelligence.ts**
- Primary extraction using Azure Document Intelligence
- Prebuilt ID model for passports
- Layout model for general forms
- Document quality assessment
- Cost: ~$0.01-0.02 per page

**geminiVision.ts** (Extended)
- Fallback extraction for poor quality/handwritten documents
- Added `extractFormFieldsWithGemini()` function
- Handles edge cases Azure struggles with
- Free tier: 7,500 requests/month

**documentRouter.ts**
- Smart routing between Azure and Gemini
- Quality assessment determines which service to use
- Automatic fallback on low confidence
- Cost estimation

#### 2. **Field Mapping** (`backend/src/lib/`)

**fieldMatcher.ts**
- Fuzzy matching using Fuse.js
- 50+ common visa field variations mapped
- Confidence scoring for matches
- Handles variations like "First Name" vs "Given Name" vs "Forename"

**fieldTransformers.ts**
- Date format conversions (DD/MM/YYYY, MM/DD/YYYY, ISO)
- Phone number formatting (international)
- Address formatting (country-specific layouts)
- Text case transformations

#### 3. **Validation System** (`backend/src/lib/`)

**Tier 1 - validationSchemas.ts** (Client/Instant)
- Zod schemas for immediate validation
- Type checking, format validation
- Email, phone, date validations
- Runs client-side and server-side

**Tier 2 - rulesEngine.ts** (Server/Business Logic)
- JSON Rules Engine for complex validation
- Passport 6-month validity rules
- Conditional field requirements
- Cross-field validation
- Country-specific rules

**Tier 3 - aiValidator.ts** (AI/Edge Cases)
- Selective AI validation (<5% of forms)
- Contradiction detection
- Semantic understanding of free-text
- Low-confidence field verification
- Cost: ~$0.001-0.005 per request

#### 4. **Country Rules** (`backend/src/lib/countryRules.ts`)

**50+ Countries Configured:**
- GCC: UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman
- Schengen: Germany, France, Italy, Spain, etc.
- Asia-Pacific: Singapore, Thailand, India, China, Japan
- Americas: USA, Canada, Brazil
- UK & Commonwealth: UK, Australia, New Zealand
- Africa: South Africa, Egypt

**Each Country Includes:**
- Passport validity requirements (3-month vs 6-month rule)
- Preferred date format
- Address format style
- Phone country code
- Common visa requirements
- Restrictions and special rules

#### 5. **PDF Form Filling** (`backend/src/lib/pdfFormFiller.ts`)

- Uses pdf-lib for PDF manipulation
- Supports text fields, checkboxes, dropdowns, radio buttons
- Automatic field transformations
- Form flattening (prevent editing)
- Watermarking support
- Field extraction for debugging

#### 6. **Review Routing** (`backend/src/lib/reviewRouter.ts`)

**Confidence-Based Decisions:**
- **>90% confidence + no errors** → Auto-approve
- **70-89% confidence** → Spot check (highlight specific fields)
- **<70% confidence** → Full manual review

**User Experience:**
- Clear review messages
- Recommended actions
- Processing statistics
- Estimated review time

---

## API Endpoints

All endpoints require authentication (`requireAuth` middleware).

### POST `/api/form-filler/extract`
Extract form fields from an uploaded PDF.

**Request:**
- `Content-Type: multipart/form-data`
- `pdf`: PDF file (max 10MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "documentType": "visa_form",
    "metadata": {
      "pageCount": 3,
      "hasForm": true,
      "fieldCount": 45
    },
    "extraction": {
      "fields": [...],
      "method": "azure_layout",
      "confidence": 92,
      "pageCount": 3,
      "processingTime": 2341
    }
  }
}
```

### POST `/api/form-filler/map`
Map extracted fields to user profile data.

**Request:**
```json
{
  "extractedFields": [...],
  "profileId": "optional_profile_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "populatedFields": [...],
    "statistics": {
      "totalFields": 45,
      "matchedFields": 38,
      "autoPopulatedFields": 35,
      "matchRate": 84
    }
  }
}
```

### POST `/api/form-filler/fill`
Fill a PDF form with user data.

**Request:**
- `Content-Type: multipart/form-data`
- `pdf`: PDF template
- `fieldPopulations`: JSON array of field data
- `destinationCountry`: Optional country code
- `flatten`: Boolean (make form non-editable)

**Response:**
```json
{
  "success": true,
  "data": {
    "formId": "form_1234567890",
    "downloadUrl": "https://...",
    "statistics": {
      "populatedFields": 38,
      "skippedFields": 7,
      "processingTime": 1523
    }
  }
}
```

### POST `/api/form-filler/:id/validate`
Run full 3-tier validation on form data.

**Request:**
```json
{
  "formData": {...},
  "extractedFields": [...],
  "destinationCountry": "ARE",
  "travelDate": "2025-06-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": true,
      "overallConfidence": 88,
      "status": "needs_review",
      "reviewMessage": "Please review 5 highlighted fields",
      "recommendedActions": [...],
      "statistics": {
        "autoFillRate": 84,
        "reviewRate": 11,
        "avgConfidence": 88,
        "completeness": 95
      }
    },
    "issues": {
      "errors": [],
      "warnings": [...],
      "infos": [...]
    },
    "reviewItems": [...],
    "aiValidation": {
      "used": false
    }
  }
}
```

### GET `/api/form-filler/:id`
Get filled form details.

### GET `/api/form-filler/:id/download`
Get download URL for filled PDF.

### GET `/api/form-filler/history`
Get user's form filling history.

**Query Parameters:**
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

### PUT `/api/form-filler/:id/fields`
Update specific fields in a filled form.

### POST `/api/form-filler/pdf/fields`
Extract field names from a PDF (debugging/mapping).

---

## Environment Variables

Add to `.env` file:

```env
# Azure Document Intelligence (Optional - falls back to Gemini if not configured)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your_azure_document_intelligence_key_here

# Google Gemini API (Required)
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
```

**Note:** Azure Document Intelligence is optional. The system will automatically use Gemini Flash as fallback if Azure is not configured.

---

## Database Schema

The form filler feature uses these tables from `schema-formfiller.ts`:

- **user_profiles** - Personal information
- **passport_profiles** - Passport details
- **family_profiles** - Family members
- **employment_profiles** - Work history
- **education_profiles** - Academic records
- **travel_history** - Past travel
- **form_templates** - Form field mappings
- **filled_forms** - Completed forms
- **validation_library** - Reusable validation rules

All tables are automatically created on server startup via `ensureTables.ts`.

---

## Usage Flow

### 1. User Profile Setup
User completes profile once with personal data (already implemented in `/api/profile` routes).

### 2. Upload PDF Form
```typescript
const formData = new FormData();
formData.append('pdf', pdfFile);

const response = await fetch('/api/form-filler/extract', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

### 3. Auto-fill & Validate
```typescript
const mapResponse = await fetch('/api/form-filler/map', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ extractedFields })
});
```

### 4. Fill PDF
```typescript
const fillData = new FormData();
fillData.append('pdf', originalPdf);
fillData.append('fieldPopulations', JSON.stringify(populatedFields));
fillData.append('destinationCountry', 'ARE');
fillData.append('flatten', 'true');

const fillResponse = await fetch('/api/form-filler/fill', {
  method: 'POST',
  credentials: 'include',
  body: fillData
});
```

### 5. Download Filled Form
```typescript
const downloadResponse = await fetch(`/api/form-filler/${formId}/download`, {
  credentials: 'include'
});

const { downloadUrl } = await downloadResponse.json();
window.open(downloadUrl, '_blank');
```

---

## Cost Analysis

### Per Form Processing Cost

| Component | Service | Cost |
|-----------|---------|------|
| PDF Extraction (high quality) | Azure DI | $0.01-0.02 |
| PDF Extraction (fallback) | Gemini Flash | $0.001-0.005 |
| Validation (Tier 1 & 2) | Local | $0 |
| AI Validation (5% of forms) | Gemini Flash | $0.001-0.005 |
| **Total** | - | **$0.02-0.05** |

### Monthly Estimates (1,000 forms)

- Total processing cost: **$20-50/month**
- Revenue at AED 50/form: **~$13,600/month**
- **Gross margin: 99%+**

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Field extraction accuracy | 92-96% | Azure DI average |
| Auto-fill rate | 80%+ | Fields populated automatically |
| Processing time | <30 seconds | Full extraction → validation → fill |
| Review rate | 10-15% | Forms needing manual review |
| Form completion rate | 90%+ | Users who complete the process |
| Validation catch rate | 98%+ | Rejectable errors caught |

---

## Error Handling

All API endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common errors handled:
- Invalid PDF format
- PDF too large (>10MB)
- No fillable fields found
- Extraction service failures (automatic fallback)
- Validation failures
- Missing user profile data
- Authentication/authorization errors

---

## Security Considerations

- ✅ All endpoints require authentication
- ✅ User ownership verification for all operations
- ✅ File upload size limits (10MB)
- ✅ File type validation (PDF only)
- ✅ Sensitive data (passport numbers) handled per privacy schema
- ✅ R2 storage with signed URLs (time-limited access)
- ✅ SQL injection protection (Drizzle ORM parameterized queries)
- ✅ Input sanitization on all text fields

---

## Monitoring & Logging

Key events logged:
- Extraction service selection (Azure vs Gemini)
- Document quality assessments
- Field matching results
- Validation issues (errors, warnings)
- AI validation usage
- Processing times
- Cost estimates

Logs prefixed with:
- `[Document Router]`
- `[PDF Filler]`
- `[Field Matcher]`
- `[AI Validator]`
- `[Form Filler API]`

---

## Testing

### Manual Testing Checklist

1. **Upload PDF Form**
   - Valid fillable PDF
   - Scanned PDF (poor quality)
   - Non-fillable PDF (should error)
   - Oversized PDF (>10MB, should error)

2. **Field Extraction**
   - Verify extraction method used (Azure/Gemini)
   - Check confidence scores
   - Verify all fields extracted

3. **Field Mapping**
   - Verify fuzzy matching works
   - Check auto-population from profile
   - Verify transformations applied

4. **Validation**
   - Test with missing required fields
   - Test with invalid dates
   - Test passport expiry rules
   - Verify country-specific rules

5. **PDF Generation**
   - Download filled PDF
   - Verify all fields populated
   - Check formatting (dates, phones)
   - Test flattening option

---

## Future Enhancements

**Post-MVP Features:**
- Employment history validation
- Education credential verification
- Travel history analysis
- Photo compliance integration
- Multi-language support
- Bulk form filling for travel agents
- Template library management UI
- Analytics dashboard
- Webhook notifications

---

## Troubleshooting

### PDF Extraction Failing

**Problem:** "Failed to extract form fields"
**Solution:**
1. Check if Azure DI is configured (optional)
2. Verify Gemini API key is valid
3. Check PDF is not encrypted
4. Verify PDF has fillable fields

### Low Confidence Scores

**Problem:** Extraction confidence < 70%
**Causes:**
- Poor scan quality
- Handwritten sections
- Non-standard form layout
**Solutions:**
- System automatically routes to AI validation
- User prompted for manual review
- Re-scan document at higher quality

### Field Mapping Issues

**Problem:** Fields not auto-populated
**Causes:**
- Profile incomplete
- Field label variations not recognized
**Solutions:**
- Prompt user to complete profile
- Add field variations to `fieldMatcher.ts`
- Use manual field mapping UI (future feature)

### Validation Errors

**Problem:** False positive validation errors
**Solutions:**
- Check country rules in `countryRules.ts`
- Verify date formats match destination country
- Review conditional field requirements

---

## Support & Contact

For issues or questions:
1. Check this documentation
2. Review logs (with appropriate prefixes)
3. Check environment variables
4. Verify user profile completeness

---

## License & Credits

**Built with:**
- Azure Document Intelligence by Microsoft
- Google Gemini AI
- pdf-lib by Andrew Dillon
- Fuse.js by Kirollos Risk
- json-rules-engine by CacheControl

**For:** MYDSCVR.ai - AI-Powered Visa & Immigration Platform

---

*Last Updated: 2025-01-18*
*Version: 1.0.0 (Production Ready)*
