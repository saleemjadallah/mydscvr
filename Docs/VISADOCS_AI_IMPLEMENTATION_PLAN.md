# VisaDocs AI - Implementation Plan
## AI-Powered Immigration Document Assistant

**Status**: Ready for Implementation  
**Last Updated**: November 2025  
**Tech Stack**: Gemini 2.5 Pro + LlamaParse + LlamaIndex RAG + Instafill.ai

---

## 🎯 Executive Summary

Transform MYDSCVR Headshot Hub into VisaDocs AI - an intelligent immigration document preparation platform that automates tedious visa application tasks using cutting-edge AI technology.

### Core Value Proposition
- **Visa-compliant photos**: Perfect headshots for any country (UAE, Schengen, US, etc.)
- **Smart document extraction**: AI reads passports, certificates, and forms
- **Auto-fill forms**: One-click form completion for government applications
- **Interactive Q&A**: Chat with visa requirements documents
- **Translation**: Instant Arabic ↔ English document translation
- **Completeness check**: AI verifies all requirements are met

### Business Model
- **Basic**: $29 - Visa photos + requirements checklist
- **Professional**: $99 - Everything + form auto-fill + translation
- **Premium**: $299 - Everything + licensed agent consultation

---

## 📊 Tech Stack Architecture

### Layer 1: AI Foundation
```
┌─────────────────────────────────────────────────┐
│         GEMINI 2.5 PRO (Google AI)              │
│  - Document extraction & understanding           │
│  - Image generation (visa photos)                │
│  - Translation (Arabic/English)                  │
│  - Form field mapping                            │
└─────────────────────────────────────────────────┘
```

### Layer 2: Document Processing
```
┌──────────────────┐  ┌─────────────────────────┐
│   LLAMAPARSE     │  │    INSTAFILL.AI         │
│  - PDF parsing   │  │  - Government forms     │
│  - Fast (6sec)   │  │  - Auto-fill engine     │
│  - 1000pg/day    │  │  - Validation           │
└──────────────────┘  └─────────────────────────┘
```

### Layer 3: Intelligence Layer
```
┌─────────────────────────────────────────────────┐
│          LLAMAINDEX RAG PIPELINE                │
│  - Vector embeddings (ChromaDB)                 │
│  - Retrieval system                             │
│  - Q&A generation                               │
│  - Citation tracking                            │
└─────────────────────────────────────────────────┘
```

### Layer 4: Application Layer
```
┌──────────────┐  ┌──────────────┐  ┌────────────┐
│   FRONTEND   │  │   BACKEND    │  │  STORAGE   │
│  React + TS  │  │  Node + TS   │  │  R2 + PG   │
│  Vite + TW   │  │  Express     │  │  Redis     │
└──────────────┘  └──────────────┘  └────────────┘
```

---

## 🗓️ 12-Week Implementation Roadmap

---

## PHASE 1: FOUNDATION (Weeks 1-4)
**Goal**: Core platform with visa photos & basic document handling

### Week 1: Project Setup & Architecture
**Deliverables**:
- [ ] Set up monorepo structure
- [ ] Configure TypeScript + Vite + Tailwind
- [ ] Set up PostgreSQL schema for visa documents
- [ ] Configure Cloudflare R2 buckets
- [ ] Set up development environment

**Database Schema**:
```typescript
// database/schema.ts

// Replace headshot_batches with visa_packages
export const visaPackages = pgTable("visa_packages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Visa application details
  visaType: text("visa_type").notNull(), 
  // work_visa, tourist_visa, family_visa, student_visa, residence_visa
  
  destinationCountry: text("destination_country").notNull(),
  // uae, saudi_arabia, qatar, oman, bahrain, kuwait, schengen, usa, uk, canada
  
  nationality: text("nationality").notNull(),
  applicantName: text("applicant_name"),
  passportNumber: text("passport_number"),
  
  // Documents uploaded
  uploadedDocuments: json("uploaded_documents").$type<{
    type: string; // passport, education, employment, bank_statement, etc.
    originalName: string;
    r2Url: string;
    uploadedAt: Date;
    extractedData?: object; // Gemini extraction results
    status: 'pending' | 'processed' | 'failed';
  }[]>(),
  
  // AI-generated outputs
  visaPhotos: json("visa_photos").$type<{
    format: string; // uae_visa, schengen_visa, us_visa, passport_photo
    url: string;
    thumbnail: string;
    specifications: {
      dimensions: string;
      background: string;
      faceSize: string;
    };
  }[]>(),
  
  translatedDocuments: json("translated_documents").$type<{
    originalUrl: string;
    translatedUrl: string;
    sourceLanguage: string;
    targetLanguage: string;
    translatedAt: Date;
  }[]>(),
  
  filledForms: json("filled_forms").$type<{
    formType: string; // visa_application, sponsorship_form, etc.
    originalFormUrl: string;
    filledFormUrl: string;
    filledAt: Date;
    fields: object; // Field mapping
  }[]>(),
  
  // Requirements checklist
  requirements: json("requirements").$type<{
    category: string; // mandatory, optional
    item: string;
    description: string;
    completed: boolean;
    documentId?: string;
    notes?: string;
  }[]>(),
  
  completenessScore: integer("completeness_score"), // 0-100
  missingItems: json("missing_items").$type<string[]>(),
  
  // Plan & pricing
  plan: text("plan").notNull(), // basic, professional, premium
  amountPaid: integer("amount_paid").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  
  // Status tracking
  status: text("status").notNull().default("in_progress"),
  // in_progress, ready_for_review, ready_for_submission, submitted, completed
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// RAG knowledge base for visa requirements
export const visaKnowledge = pgTable("visa_knowledge", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  visaType: text("visa_type").notNull(),
  documentUrl: text("document_url").notNull(), // R2 URL of PDF
  documentName: text("document_name").notNull(),
  lastUpdated: timestamp("last_updated").notNull(),
  
  // Vector embeddings for RAG
  chunks: json("chunks").$type<{
    text: string;
    embedding: number[];
    metadata: object;
  }[]>(),
  
  indexed: boolean("indexed").default(false),
  indexedAt: timestamp("indexed_at"),
});

// AI chat sessions for interactive Q&A
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  packageId: integer("package_id"), // Optional: link to specific visa package
  
  messages: json("messages").$type<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: string[]; // Citations from RAG
  }[]>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**R2 Bucket Structure**:
```
/uploads/
  /{userId}/
    /{packageId}/
      /documents/
        passport.pdf
        degree.pdf
        employment_letter.pdf
      /photos/
        selfie_1.jpg
        selfie_2.jpg

/generated/
  /{userId}/
    /{packageId}/
      /visa_photos/
        uae_visa_photo.jpg
        schengen_visa_photo.jpg
      /filled_forms/
        visa_application_filled.pdf
        sponsorship_form_filled.pdf
      /translations/
        degree_translated.pdf

/knowledge_base/
  /uae/
    work_visa_requirements.pdf
    residence_visa_guide.pdf
  /saudi/
    tourist_visa_guide.pdf
  /schengen/
    visa_application_guide.pdf
```

---

### Week 2: Visa Photo Generation (Leverage Existing Code)
**Deliverables**:
- [ ] Adapt existing Gemini headshot generation
- [ ] Add visa photo specifications for major countries
- [ ] Create visa photo preview components
- [ ] Build upload interface

**Visa Photo Specifications**:
```typescript
// backend/config/visa-photo-specs.ts

export const VISA_PHOTO_SPECS = {
  // UAE (Emirates ID, Visa, Residence)
  uae_visa: {
    dimensions: "600x600", // pixels
    dpi: 600,
    background: "#FFFFFF", // Pure white
    faceSize: "70-80%", // of total image
    headPosition: "centered",
    expression: "neutral, eyes open, mouth closed",
    clothing: "formal, no white clothing",
    glasses: "allowed if normally worn, no tint",
    headCovering: "religious only, face must be visible",
    fileFormat: "JPG",
    maxFileSize: "100KB",
    colorSpace: "sRGB",
  },
  
  // Schengen (EU countries)
  schengen_visa: {
    dimensions: "826x1063", // 35mm x 45mm at 600 DPI
    physicalSize: "35mm x 45mm",
    dpi: 600,
    background: "#F0F0F0", // Light gray
    faceSize: "70-80%",
    headPosition: "centered",
    expression: "neutral, looking straight",
    eyeLevel: "2/3 from bottom",
    glasses: "no glare, frames not covering eyes",
    headCovering: "religious only",
    fileFormat: "JPG",
    colorSpace: "sRGB",
  },
  
  // USA (Passport, Visa)
  us_visa: {
    dimensions: "600x600", // 2x2 inches at 300 DPI
    physicalSize: "2in x 2in",
    dpi: 300,
    background: "#FFFFFF", // White or off-white
    faceSize: "50-69%", // 1 to 1-3/8 inches
    headPosition: "centered",
    expression: "neutral, natural smile allowed",
    glasses: "no glare, must see eyes",
    recency: "taken within 6 months",
    fileFormat: "JPG",
    colorSpace: "sRGB",
  },
  
  // Saudi Arabia
  saudi_visa: {
    dimensions: "600x600",
    dpi: 600,
    background: "#FFFFFF",
    faceSize: "70-80%",
    headPosition: "centered",
    expression: "neutral",
    clothing: "formal, conservative",
    headCovering: "women: optional, men: no caps",
    fileFormat: "JPG",
    maxFileSize: "100KB",
  },
  
  // Qatar
  qatar_visa: {
    dimensions: "600x600",
    dpi: 600,
    background: "#FFFFFF",
    faceSize: "70-80%",
    headPosition: "centered",
    expression: "neutral",
    fileFormat: "JPG",
  },
  
  // India (Passport, Visa)
  india_visa: {
    dimensions: "600x600", // 2x2 inches
    dpi: 300,
    background: "#FFFFFF",
    faceSize: "70-80%",
    headPosition: "centered, forward-facing",
    expression: "neutral, no smile",
    ears: "both ears visible",
    fileFormat: "JPG",
  },
  
  // Generic passport photo (ICAO standard)
  passport_generic: {
    dimensions: "827x1063", // 35mm x 45mm
    dpi: 600,
    background: "#FFFFFF to #F0F0F0",
    faceSize: "70-80%",
    headPosition: "centered",
    expression: "neutral",
    fileFormat: "JPG",
  },
};

// Gemini prompts for each visa photo type
export const VISA_PHOTO_PROMPTS = {
  uae_visa: `
    Generate a professional UAE visa photo with the following exact specifications:
    
    CRITICAL REQUIREMENTS:
    - Pure white background (#FFFFFF)
    - Face occupies 70-80% of image
    - Perfectly centered head position
    - Neutral expression, eyes open, mouth closed
    - Direct eye contact with camera
    - Formal attire (no white clothing as it blends with background)
    - Even, soft lighting with no harsh shadows
    - Sharp focus on face, particularly eyes
    - Head straight, not tilted
    - Both ears visible (unless covered for religious reasons)
    
    TECHNICAL SPECS:
    - Output: 600x600 pixels, 600 DPI
    - Format: High-quality JPG, sRGB color space
    - File size: Under 100KB
    
    AVOID:
    - Smiling or any expression
    - Sunglasses, tinted glasses
    - Hats or headwear (except religious)
    - Shadows on face or background
    - Red-eye effect
    - Blurriness
    - Over-exposure or under-exposure
    
    Generate a photo that would be accepted by UAE immigration authorities.
  `,
  
  schengen_visa: `
    Generate a Schengen visa-compliant photo (EU standard):
    
    CRITICAL REQUIREMENTS:
    - Light gray background (#F0F0F0)
    - Face occupies 70-80% of image height
    - Eyes at 2/3 from bottom of photo
    - Neutral expression, closed mouth
    - Looking straight at camera
    - Both eyes clearly visible
    - Face evenly lit, no shadows
    
    TECHNICAL SPECS:
    - Output: 826x1063 pixels (35mm x 45mm at 600 DPI)
    - Format: High-quality JPG, sRGB
    
    AVOID:
    - Smiling
    - Glasses with glare
    - Red-eye
    - Hair covering eyes
    - Any accessories on head
    
    Must comply with ICAO standards for biometric photos.
  `,
  
  us_visa: `
    Generate a US visa photo compliant with Department of State requirements:
    
    CRITICAL REQUIREMENTS:
    - White or off-white background
    - Face 50-69% of image (1 to 1-3/8 inches from chin to top of head)
    - Head centered in frame
    - Neutral expression (natural smile acceptable)
    - Looking directly at camera
    - Both eyes open and visible
    - Photo taken within last 6 months
    - Full-face view, facing camera
    
    TECHNICAL SPECS:
    - Output: 600x600 pixels (2x2 inches at 300 DPI)
    - Format: JPG, sRGB color space
    
    AVOID:
    - Uniforms (except religious clothing)
    - Hats or head coverings (except religious)
    - Headphones or wireless devices
    - Glasses with glare
    
    Must meet US passport photo requirements.
  `,
};
```

**Gemini Integration**:
```typescript
// backend/services/visa-photo-generator.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface VisaPhotoOptions {
  format: keyof typeof VISA_PHOTO_SPECS;
  inputPhotos: string[]; // R2 URLs of user selfies
  userId: string;
  packageId: number;
}

export async function generateVisaPhoto(
  options: VisaPhotoOptions
): Promise<{
  url: string;
  thumbnail: string;
  specifications: object;
}> {
  const { format, inputPhotos, userId, packageId } = options;
  
  const specs = VISA_PHOTO_SPECS[format];
  const prompt = VISA_PHOTO_PROMPTS[format];
  
  // Use Gemini 2.5 Pro with vision
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro-vision" 
  });
  
  // Prepare input photos
  const photoInputs = await Promise.all(
    inputPhotos.map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return {
        inlineData: {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: 'image/jpeg',
        },
      };
    })
  );
  
  // Generate visa photo
  const result = await model.generateContent([
    prompt,
    ...photoInputs,
  ]);
  
  const generatedImageData = result.response.candidates[0]
    .content.parts[0].inlineData.data;
  
  // Process image to exact specifications
  const [width, height] = specs.dimensions.split('x').map(Number);
  
  const processedImage = await sharp(Buffer.from(generatedImageData, 'base64'))
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4',
      force: true,
    })
    .withMetadata({
      density: specs.dpi,
    })
    .toBuffer();
  
  // Create thumbnail
  const thumbnail = await sharp(processedImage)
    .resize(300, 300)
    .jpeg({ quality: 80 })
    .toBuffer();
  
  // Upload to R2
  const timestamp = Date.now();
  const mainKey = `generated/${userId}/${packageId}/visa_photos/${format}_${timestamp}.jpg`;
  const thumbKey = `generated/${userId}/${packageId}/visa_photos/${format}_${timestamp}_thumb.jpg`;
  
  await uploadToR2(mainKey, processedImage);
  await uploadToR2(thumbKey, thumbnail);
  
  return {
    url: getR2PublicUrl(mainKey),
    thumbnail: getR2PublicUrl(thumbKey),
    specifications: specs,
  };
}

// Generate all visa photos for a package
export async function generateAllVisaPhotos(
  inputPhotos: string[],
  selectedFormats: string[],
  userId: string,
  packageId: number
): Promise<any[]> {
  const photos = await Promise.all(
    selectedFormats.map(format =>
      generateVisaPhoto({
        format: format as keyof typeof VISA_PHOTO_SPECS,
        inputPhotos,
        userId,
        packageId,
      })
    )
  );
  
  return photos;
}
```

---

### Week 3: Basic Document Upload & Storage
**Deliverables**:
- [ ] Document upload interface
- [ ] File validation (PDF, JPG, PNG)
- [ ] R2 storage integration
- [ ] Basic document listing page

**Upload Component**:
```typescript
// frontend/components/DocumentUploader.tsx

interface DocumentUploaderProps {
  packageId: number;
  onUploadComplete: (docs: any[]) => void;
}

export function DocumentUploader({ packageId, onUploadComplete }: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const documentTypes = [
    { id: 'passport', label: 'Passport', icon: '🛂', required: true },
    { id: 'photo', label: 'Recent Photo', icon: '📸', required: true },
    { id: 'education', label: 'Educational Certificates', icon: '🎓', required: false },
    { id: 'employment', label: 'Employment Letter', icon: '💼', required: false },
    { id: 'bank_statement', label: 'Bank Statement', icon: '🏦', required: false },
    { id: 'marriage_cert', label: 'Marriage Certificate', icon: '💍', required: false },
    { id: 'birth_cert', label: 'Birth Certificate', icon: '👶', required: false },
    { id: 'sponsor_docs', label: 'Sponsor Documents', icon: '👔', required: false },
  ];
  
  async function handleUpload() {
    setUploading(true);
    
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    formData.append('packageId', packageId.toString());
    
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
    
    const uploaded = await response.json();
    onUploadComplete(uploaded);
    setUploading(false);
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {documentTypes.map(type => (
          <DocumentTypeCard
            key={type.id}
            type={type}
            onSelect={(file) => setFiles([...files, file])}
          />
        ))}
      </div>
      
      {files.length > 0 && (
        <div>
          <h3>Uploaded Documents ({files.length})</h3>
          <DocumentList files={files} onRemove={(idx) => {
            setFiles(files.filter((_, i) => i !== idx));
          }} />
          
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Continue'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Week 4: Basic Requirements Checklist
**Deliverables**:
- [ ] Static visa requirements database
- [ ] Requirements checklist generator
- [ ] Progress tracking UI
- [ ] Document-to-requirement mapping

**Requirements Database**:
```typescript
// backend/config/visa-requirements.ts

export const VISA_REQUIREMENTS = {
  uae_work_visa: {
    name: "UAE Work Visa",
    country: "United Arab Emirates",
    processingTime: "5-7 business days",
    validity: "2-3 years",
    
    mandatory: [
      {
        id: "passport",
        item: "Valid Passport",
        description: "Original passport with minimum 6 months validity",
        documentType: "passport",
        notes: "Ensure passport has at least 2 blank pages",
      },
      {
        id: "passport_copy",
        item: "Passport Copy",
        description: "Clear colored copy of passport bio page",
        documentType: "passport",
      },
      {
        id: "photo",
        item: "Recent Photograph",
        description: "Passport-sized photo with white background",
        documentType: "photo",
        specifications: "600x600 pixels, white background, formal attire",
      },
      {
        id: "education_attested",
        item: "Attested Educational Certificates",
        description: "Degree certificates attested by UAE embassy",
        documentType: "education",
        notes: "Must be attested in home country first, then by UAE embassy",
      },
      {
        id: "employment_contract",
        item: "Employment Contract",
        description: "Signed employment contract from UAE employer",
        documentType: "employment",
        notes: "Must include job title, salary, and contract duration",
      },
      {
        id: "medical_fitness",
        item: "Medical Fitness Certificate",
        description: "Issued by approved UAE medical center",
        documentType: "medical",
        notes: "Valid for 3 months from issue date",
      },
    ],
    
    optional: [
      {
        id: "police_clearance",
        item: "Police Clearance Certificate",
        description: "From country of residence",
        documentType: "police_clearance",
        notes: "Required for certain professions (teachers, healthcare)",
      },
      {
        id: "marriage_cert",
        item: "Marriage Certificate",
        description: "If sponsoring family members",
        documentType: "marriage_cert",
      },
    ],
    
    fees: {
      visaFee: "2000 AED",
      emiratesIdFee: "370 AED",
      medicalFee: "300-500 AED",
      total: "~2700-3000 AED",
    },
  },
  
  uae_tourist_visa: {
    name: "UAE Tourist Visa (30 days)",
    country: "United Arab Emirates",
    processingTime: "3-4 business days",
    validity: "60 days from issue, 30 days stay",
    
    mandatory: [
      {
        id: "passport",
        item: "Valid Passport",
        description: "Passport valid for at least 6 months",
        documentType: "passport",
      },
      {
        id: "passport_copy",
        item: "Passport Copy",
        description: "Clear colored copy of passport bio page",
        documentType: "passport",
      },
      {
        id: "photo",
        item: "Recent Photograph",
        description: "Passport-sized photo with white background",
        documentType: "photo",
      },
      {
        id: "flight_booking",
        item: "Flight Booking",
        description: "Confirmed round-trip flight reservation",
        documentType: "flight",
      },
      {
        id: "hotel_booking",
        item: "Hotel Reservation",
        description: "Confirmed hotel booking for duration of stay",
        documentType: "accommodation",
      },
    ],
    
    optional: [
      {
        id: "bank_statement",
        item: "Bank Statement",
        description: "Last 3 months bank statement",
        documentType: "bank_statement",
        notes: "May be required to prove financial capability",
      },
    ],
    
    fees: {
      visaFee: "250-350 AED",
      serviceFee: "50 AED",
      total: "~300-400 AED",
    },
  },
  
  schengen_tourist_visa: {
    name: "Schengen Tourist Visa",
    country: "Schengen Area (26 countries)",
    processingTime: "15 days (can be extended to 30-60 days)",
    validity: "90 days within 180 days",
    
    mandatory: [
      {
        id: "application_form",
        item: "Visa Application Form",
        description: "Completed and signed Schengen visa application",
        documentType: "form",
      },
      {
        id: "passport",
        item: "Valid Passport",
        description: "Passport valid for at least 3 months beyond intended stay",
        documentType: "passport",
        notes: "Must have been issued within last 10 years",
      },
      {
        id: "photos",
        item: "Two Photographs",
        description: "Recent passport photos (35mm x 45mm)",
        documentType: "photo",
        specifications: "826x1063 pixels, light gray background",
      },
      {
        id: "travel_insurance",
        item: "Travel Insurance",
        description: "Coverage of €30,000 for medical emergencies",
        documentType: "insurance",
      },
      {
        id: "flight_itinerary",
        item: "Flight Itinerary",
        description: "Round-trip flight reservation",
        documentType: "flight",
      },
      {
        id: "accommodation_proof",
        item: "Proof of Accommodation",
        description: "Hotel bookings or invitation letter",
        documentType: "accommodation",
      },
      {
        id: "financial_means",
        item: "Proof of Financial Means",
        description: "Bank statements (last 3-6 months)",
        documentType: "bank_statement",
        notes: "Minimum €50-60 per day of stay",
      },
      {
        id: "employment_proof",
        item: "Employment Certificate",
        description: "Letter from employer stating position and salary",
        documentType: "employment",
      },
    ],
    
    fees: {
      adultFee: "€80",
      childFee: "€40 (6-12 years)",
      serviceFee: "€20-30",
    },
  },
  
  // Add more visa types...
  saudi_work_visa: { /* ... */ },
  saudi_umrah_visa: { /* ... */ },
  us_tourist_visa: { /* ... */ },
  uk_visitor_visa: { /* ... */ },
};

// Function to generate checklist for specific visa
export function generateChecklist(
  visaType: string,
  nationality?: string
): any {
  const baseRequirements = VISA_REQUIREMENTS[visaType];
  
  if (!baseRequirements) {
    throw new Error(`Unknown visa type: ${visaType}`);
  }
  
  // Combine mandatory and optional
  const allRequirements = [
    ...baseRequirements.mandatory.map(r => ({ ...r, category: 'mandatory' })),
    ...baseRequirements.optional.map(r => ({ ...r, category: 'optional' })),
  ];
  
  return {
    visaInfo: {
      name: baseRequirements.name,
      country: baseRequirements.country,
      processingTime: baseRequirements.processingTime,
      validity: baseRequirements.validity,
    },
    requirements: allRequirements,
    fees: baseRequirements.fees,
  };
}
```

---

## PHASE 2: AI INTELLIGENCE (Weeks 5-8)
**Goal**: Add Gemini document extraction, LlamaParse, and basic RAG

### Week 5: Gemini Document Extraction
**Deliverables**:
- [ ] Integrate Gemini 2.5 Pro for document OCR
- [ ] Extract data from passports, certificates, forms
- [ ] Auto-populate user profile from extracted data
- [ ] Validation & error handling

**Document Extraction Service**:
```typescript
// backend/services/document-extractor.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ExtractedPassportData {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
}

export async function extractPassportData(
  imageUrl: string
): Promise<ExtractedPassportData> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro-vision" 
  });
  
  // Fetch image
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  const prompt = `
    You are an expert document processing AI. Extract all information from this passport bio page.
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "fullName": "SURNAME, Given Names",
      "passportNumber": "A12345678",
      "nationality": "Country",
      "dateOfBirth": "DD MMM YYYY",
      "placeOfBirth": "City, Country",
      "gender": "M or F",
      "issueDate": "DD MMM YYYY",
      "expiryDate": "DD MMM YYYY",
      "issuingAuthority": "Authority"
    }
    
    DO NOT include any markdown formatting or code blocks.
    DO NOT include any explanatory text.
    ONLY return the raw JSON object.
    
    If any field cannot be read clearly, use null for that field.
  `;
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: Buffer.from(buffer).toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
  ]);
  
  const text = result.response.text();
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  const extracted = JSON.parse(cleanedText);
  return extracted;
}

export async function extractEducationCertificate(
  imageUrl: string
): Promise<{
  institutionName: string;
  degreeName: string;
  major: string;
  graduationDate: string;
  studentName: string;
  gpa?: string;
}> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro-vision" 
  });
  
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  const prompt = `
    Extract information from this educational certificate/degree.
    
    Return ONLY a valid JSON object with this structure:
    {
      "institutionName": "University Name",
      "degreeName": "Bachelor of Science",
      "major": "Computer Science",
      "graduationDate": "June 2020",
      "studentName": "Full Name",
      "gpa": "3.8/4.0"
    }
    
    DO NOT include markdown or explanations. ONLY raw JSON.
  `;
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: Buffer.from(buffer).toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
  ]);
  
  const text = result.response.text();
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleanedText);
}

export async function extractEmploymentLetter(
  imageUrl: string
): Promise<{
  companyName: string;
  employeeName: string;
  position: string;
  salary?: string;
  joinDate: string;
  employmentType: string;
}> {
  // Similar implementation for employment letters
}

// Generic document extraction with custom schema
export async function extractDocumentData(
  imageUrl: string,
  schema: object,
  documentType: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro-vision" 
  });
  
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  const prompt = `
    Extract information from this ${documentType} document.
    
    Return ONLY a valid JSON object matching this schema:
    ${JSON.stringify(schema, null, 2)}
    
    DO NOT include markdown or explanations. ONLY raw JSON.
    If a field cannot be determined, use null.
  `;
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: Buffer.from(buffer).toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
  ]);
  
  const text = result.response.text();
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleanedText);
}
```

---

### Week 6: LlamaParse Integration
**Deliverables**:
- [ ] Set up LlamaParse API
- [ ] Parse PDF forms and documents
- [ ] Extract tables, text, structure
- [ ] Handle multi-page documents

**LlamaParse Service**:
```typescript
// backend/services/llamaparse.ts

import LlamaCloudServices from 'llama-cloud-services';

const llamaParse = new LlamaCloudServices.LlamaParse({
  apiKey: process.env.LLAMA_CLOUD_API_KEY!,
  resultType: 'markdown', // or 'json'
});

interface ParsedDocument {
  text: string;
  markdown: string;
  tables: any[];
  metadata: any;
}

export async function parsePDF(
  pdfUrl: string,
  options?: {
    parseMode?: 'fast' | 'premium';
    extractTables?: boolean;
    extractImages?: boolean;
  }
): Promise<ParsedDocument> {
  // Download PDF
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();
  
  // Parse with LlamaParse
  const parsed = await llamaParse.parse({
    file: Buffer.from(buffer),
    resultType: 'markdown',
    mode: options?.parseMode || 'fast',
    extractTables: options?.extractTables ?? true,
    extractImages: options?.extractImages ?? false,
  });
  
  return {
    text: parsed.text,
    markdown: parsed.markdown,
    tables: parsed.tables || [],
    metadata: parsed.metadata,
  };
}

// Parse visa application form
export async function parseVisaForm(
  formUrl: string
): Promise<{
  fields: { name: string; value: string; type: string }[];
  structure: any;
}> {
  const parsed = await parsePDF(formUrl, {
    parseMode: 'premium', // Use premium for forms
    extractTables: true,
  });
  
  // Use Gemini to extract form fields from parsed markdown
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  
  const prompt = `
    Analyze this parsed visa application form and extract all form fields.
    
    Parsed form content:
    ${parsed.markdown}
    
    Return a JSON object with this structure:
    {
      "fields": [
        {
          "name": "Full Name",
          "type": "text",
          "required": true,
          "value": null
        },
        {
          "name": "Date of Birth",
          "type": "date",
          "required": true,
          "value": null
        }
      ]
    }
    
    DO NOT include markdown. ONLY raw JSON.
  `;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  const extracted = JSON.parse(cleanedText);
  
  return {
    fields: extracted.fields,
    structure: parsed,
  };
}
```

---

### Week 7: LlamaIndex RAG Setup
**Deliverables**:
- [ ] Set up ChromaDB vector database
- [ ] Index visa requirement documents
- [ ] Build RAG retrieval pipeline
- [ ] Create Q&A endpoint

**RAG Pipeline**:
```typescript
// backend/services/rag-pipeline.ts

import { LlamaIndex } from 'llamaindex';
import { ChromaVectorStore } from '@llamaindex/vector-stores/chromadb';
import { OpenAIEmbedding } from '@llamaindex/embeddings/openai';
import { Gemini } from '@llamaindex/llms/gemini';

// Initialize vector store
const vectorStore = new ChromaVectorStore({
  collectionName: 'visa_knowledge',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
});

// Initialize LLM and embeddings
const llm = new Gemini({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-2.5-pro',
});

const embeddings = new OpenAIEmbedding({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'text-embedding-3-small',
});

// Index a document
export async function indexDocument(
  documentUrl: string,
  metadata: {
    country: string;
    visaType: string;
    documentName: string;
  }
): Promise<void> {
  // Parse PDF with LlamaParse
  const parsed = await parsePDF(documentUrl);
  
  // Split into chunks
  const chunks = splitIntoChunks(parsed.markdown, {
    chunkSize: 512,
    chunkOverlap: 50,
  });
  
  // Create embeddings
  const documents = chunks.map((chunk, idx) => ({
    text: chunk,
    metadata: {
      ...metadata,
      chunkIndex: idx,
      source: documentUrl,
    },
  }));
  
  // Add to vector store
  await vectorStore.add(documents);
  
  console.log(`Indexed ${chunks.length} chunks from ${metadata.documentName}`);
}

// Query RAG system
export async function queryVisa(
  question: string,
  context?: {
    country?: string;
    visaType?: string;
  }
): Promise<{
  answer: string;
  sources: Array<{
    text: string;
    metadata: any;
  }>;
}> {
  // Retrieve relevant documents
  const retrieved = await vectorStore.similaritySearch(question, {
    k: 5,
    filter: context ? {
      country: context.country,
      visaType: context.visaType,
    } : undefined,
  });
  
  // Build context from retrieved documents
  const contextText = retrieved
    .map((doc, idx) => `[${idx + 1}] ${doc.text}`)
    .join('\n\n');
  
  // Generate answer with Gemini
  const prompt = `
    You are a visa requirements expert. Answer the user's question based ONLY on the provided context.
    
    Context (from official visa documentation):
    ${contextText}
    
    Question: ${question}
    
    Instructions:
    - Answer clearly and concisely
    - Only use information from the provided context
    - If the context doesn't contain the answer, say "I don't have information about that"
    - Cite sources by using [1], [2], etc. to reference the context
    - Be helpful and specific
    
    Answer:
  `;
  
  const result = await llm.complete(prompt);
  
  return {
    answer: result.text,
    sources: retrieved.map(doc => ({
      text: doc.text,
      metadata: doc.metadata,
    })),
  };
}

// Chat with documents (maintains conversation history)
export async function chatWithDocuments(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: {
    country?: string;
    visaType?: string;
  }
): Promise<{
  response: string;
  sources: any[];
}> {
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage.role !== 'user') {
    throw new Error('Last message must be from user');
  }
  
  // Query with context
  const result = await queryVisa(lastMessage.content, context);
  
  return {
    response: result.answer,
    sources: result.sources,
  };
}

// Utility: Split text into chunks
function splitIntoChunks(
  text: string,
  options: { chunkSize: number; chunkOverlap: number }
): string[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: string[] = [];
  
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start += chunkSize - chunkOverlap;
  }
  
  return chunks;
}
```

**Index Visa Documents Script**:
```typescript
// backend/scripts/index-visa-docs.ts

import { indexDocument } from '../services/rag-pipeline';

const DOCUMENTS_TO_INDEX = [
  {
    url: 'https://r2.domain.com/knowledge_base/uae/work_visa_requirements.pdf',
    metadata: {
      country: 'uae',
      visaType: 'work_visa',
      documentName: 'UAE Work Visa Requirements Guide',
    },
  },
  {
    url: 'https://r2.domain.com/knowledge_base/uae/tourist_visa_guide.pdf',
    metadata: {
      country: 'uae',
      visaType: 'tourist_visa',
      documentName: 'UAE Tourist Visa Guide',
    },
  },
  {
    url: 'https://r2.domain.com/knowledge_base/schengen/visa_application.pdf',
    metadata: {
      country: 'schengen',
      visaType: 'tourist_visa',
      documentName: 'Schengen Visa Application Guide',
    },
  },
  // Add more documents...
];

async function indexAllDocuments() {
  for (const doc of DOCUMENTS_TO_INDEX) {
    console.log(`Indexing: ${doc.metadata.documentName}`);
    await indexDocument(doc.url, doc.metadata);
  }
  
  console.log('All documents indexed successfully!');
}

indexAllDocuments();
```

---

### Week 8: Interactive Chat Interface
**Deliverables**:
- [ ] Build chat UI component
- [ ] Connect to RAG backend
- [ ] Display sources/citations
- [ ] Save chat history

**Chat Interface**:
```typescript
// frontend/components/VisaChatbot.tsx

export function VisaChatbot({ 
  packageId, 
  visaContext 
}: { 
  packageId?: number;
  visaContext?: { country: string; visaType: string };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function sendMessage() {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat/visa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: visaContext,
        }),
      });
      
      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
      };
      
      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const suggestedQuestions = [
    "What documents do I need for a UAE work visa?",
    "How long does the visa process take?",
    "What are the photo requirements?",
    "Do I need to attest my degree?",
    "What is the visa fee?",
  ];
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold">Visa Requirements Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about visa requirements
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">
              Ask me about visa requirements, documents, or procedures
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about visa requirements..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={cn(
      "flex gap-3",
      message.role === 'user' ? "justify-end" : "justify-start"
    )}>
      {message.role === 'assistant' && (
        <Avatar className="w-8 h-8">
          <Bot className="w-5 h-5" />
        </Avatar>
      )}
      
      <div className={cn(
        "rounded-2xl px-4 py-3 max-w-[80%]",
        message.role === 'user' 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-semibold mb-2">Sources:</p>
            {message.sources.map((source, idx) => (
              <div key={idx} className="text-xs text-muted-foreground mb-1">
                [{idx + 1}] {source.metadata.documentName}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {message.role === 'user' && (
        <Avatar className="w-8 h-8">
          <User className="w-5 h-5" />
        </Avatar>
      )}
    </div>
  );
}
```

---

## PHASE 3: FORM AUTO-FILL (Weeks 9-10)
**Goal**: Integrate Instafill.ai for government form automation

### Week 9: Instafill.ai Integration
**Deliverables**:
- [ ] Set up Instafill.ai API
- [ ] Map extracted data to form fields
- [ ] Test with common visa forms (I-9, DS-160, etc.)
- [ ] Error handling & validation

**Instafill Service**:
```typescript
// backend/services/instafill.ts

interface FormFillRequest {
  formUrl: string; // URL to blank PDF form
  data: Record<string, any>; // Extracted data to fill
  formType?: string; // visa_application, sponsorship, etc.
}

export async function fillForm(
  request: FormFillRequest
): Promise<{
  filledFormUrl: string;
  fields: Array<{ name: string; value: any; filled: boolean }>;
}> {
  // Call Instafill.ai API
  const response = await fetch('https://api.instafill.ai/v1/fill', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INSTAFILL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      form_url: request.formUrl,
      data: request.data,
      validate: true,
    }),
  });
  
  const result = await response.json();
  
  // Upload filled form to R2
  const filledFormBuffer = await fetch(result.filled_form_url).then(r => r.arrayBuffer());
  const r2Key = `filled_forms/${Date.now()}_filled.pdf`;
  await uploadToR2(r2Key, Buffer.from(filledFormBuffer));
  
  return {
    filledFormUrl: getR2PublicUrl(r2Key),
    fields: result.fields,
  };
}

// Map extracted passport data to visa form fields
export function mapPassportToVisaForm(
  passportData: ExtractedPassportData,
  formType: string
): Record<string, any> {
  const mapping: Record<string, any> = {
    'Full Name': passportData.fullName,
    'Surname': passportData.fullName.split(',')[0],
    'Given Names': passportData.fullName.split(',')[1]?.trim(),
    'Passport Number': passportData.passportNumber,
    'Nationality': passportData.nationality,
    'Date of Birth': passportData.dateOfBirth,
    'Place of Birth': passportData.placeOfBirth,
    'Gender': passportData.gender === 'M' ? 'Male' : 'Female',
    'Passport Issue Date': passportData.issueDate,
    'Passport Expiry Date': passportData.expiryDate,
  };
  
  return mapping;
}
```

---

### Week 10: Form Library & Templates
**Deliverables**:
- [ ] Build form template library
- [ ] Pre-fill common forms
- [ ] Form validation
- [ ] Download filled forms

**Form Templates**:
```typescript
// backend/config/form-templates.ts

export const FORM_TEMPLATES = {
  uae_work_visa_application: {
    name: "UAE Work Visa Application Form",
    url: "https://r2.domain.com/forms/uae_work_visa_application.pdf",
    fields: {
      'Full Name': { type: 'text', source: 'passport.fullName' },
      'Passport Number': { type: 'text', source: 'passport.passportNumber' },
      'Nationality': { type: 'text', source: 'passport.nationality' },
      'Date of Birth': { type: 'date', source: 'passport.dateOfBirth' },
      'Place of Birth': { type: 'text', source: 'passport.placeOfBirth' },
      'Gender': { type: 'select', source: 'passport.gender' },
      'Employer Name': { type: 'text', source: 'employment.companyName' },
      'Job Title': { type: 'text', source: 'employment.position' },
      'Salary': { type: 'text', source: 'employment.salary' },
    },
  },
  
  uae_sponsorship_form: {
    name: "UAE Sponsorship Form",
    url: "https://r2.domain.com/forms/uae_sponsorship_form.pdf",
    fields: {
      'Sponsor Name': { type: 'text' },
      'Sponsor Emirates ID': { type: 'text' },
      'Beneficiary Name': { type: 'text', source: 'passport.fullName' },
      'Relationship': { type: 'select' },
    },
  },
  
  schengen_visa_application: {
    name: "Schengen Visa Application Form",
    url: "https://r2.domain.com/forms/schengen_visa_application.pdf",
    fields: {
      'Surname': { type: 'text', source: 'passport.surname' },
      'Given Names': { type: 'text', source: 'passport.givenNames' },
      'Date of Birth': { type: 'date', source: 'passport.dateOfBirth' },
      'Place of Birth': { type: 'text', source: 'passport.placeOfBirth' },
      'Current Nationality': { type: 'text', source: 'passport.nationality' },
      'Passport Number': { type: 'text', source: 'passport.passportNumber' },
      'Passport Issue Date': { type: 'date', source: 'passport.issueDate' },
      'Passport Expiry Date': { type: 'date', source: 'passport.expiryDate' },
    },
  },
};
```

---

## PHASE 4: TRANSLATION & POLISH (Weeks 11-12)
**Goal**: Add translation, completeness check, and final polish

### Week 11: Document Translation
**Deliverables**:
- [ ] Gemini-powered translation (Arabic ↔ English)
- [ ] Preserve formatting
- [ ] Translation quality check
- [ ] Side-by-side view

**Translation Service**:
```typescript
// backend/services/translator.ts

export async function translateDocument(
  documentUrl: string,
  sourceLang: string,
  targetLang: string,
  documentType: string
): Promise<{
  translatedUrl: string;
  originalUrl: string;
  sourceLang: string;
  targetLang: string;
}> {
  // Parse original document
  const parsed = await parsePDF(documentUrl);
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  
  const prompt = `
    Translate the following ${documentType} document from ${sourceLang} to ${targetLang}.
    
    CRITICAL REQUIREMENTS:
    - Maintain document structure (headings, paragraphs, lists)
    - Use formal/official tone appropriate for legal/immigration documents
    - Preserve all names, dates, and numbers exactly
    - Translate technical terms accurately
    - Keep formatting markers for headings, bold, etc.
    
    Original document:
    ${parsed.markdown}
    
    Return the translated version in markdown format.
  `;
  
  const result = await model.generateContent(prompt);
  const translatedMarkdown = result.response.text();
  
  // Convert markdown back to PDF
  const translatedPdf = await markdownToPDF(translatedMarkdown);
  
  // Upload to R2
  const r2Key = `translations/${Date.now()}_${targetLang}.pdf`;
  await uploadToR2(r2Key, translatedPdf);
  
  return {
    translatedUrl: getR2PublicUrl(r2Key),
    originalUrl: documentUrl,
    sourceLang,
    targetLang,
  };
}
```

---

### Week 12: Completeness Check & Final Polish
**Deliverables**:
- [ ] AI completeness verification
- [ ] Missing items detection
- [ ] Quality score (0-100)
- [ ] Final testing & bug fixes

**Completeness Checker**:
```typescript
// backend/services/completeness-checker.ts

export async function checkCompleteness(
  packageId: number
): Promise<{
  score: number; // 0-100
  complete: boolean;
  missingMandatory: string[];
  missingOptional: string[];
  recommendations: string[];
}> {
  const pkg = await getPackage(packageId);
  const requirements = generateChecklist(pkg.visaType);
  
  const mandatory = requirements.requirements.filter(r => r.category === 'mandatory');
  const optional = requirements.requirements.filter(r => r.category === 'optional');
  
  // Check which requirements are met
  const uploadedDocTypes = pkg.uploadedDocuments.map(d => d.type);
  
  const missingMandatory = mandatory
    .filter(r => !uploadedDocTypes.includes(r.documentType))
    .map(r => r.item);
  
  const missingOptional = optional
    .filter(r => !uploadedDocTypes.includes(r.documentType))
    .map(r => r.item);
  
  // Calculate score
  const mandatoryScore = ((mandatory.length - missingMandatory.length) / mandatory.length) * 70;
  const optionalScore = ((optional.length - missingOptional.length) / optional.length) * 30;
  const score = Math.round(mandatoryScore + optionalScore);
  
  // AI recommendations
  const recommendations = await generateRecommendations(
    pkg,
    missingMandatory,
    missingOptional
  );
  
  return {
    score,
    complete: missingMandatory.length === 0,
    missingMandatory,
    missingOptional,
    recommendations,
  };
}

async function generateRecommendations(
  pkg: any,
  missingMandatory: string[],
  missingOptional: string[]
): Promise<string[]> {
  if (missingMandatory.length === 0 && missingOptional.length === 0) {
    return ["All requirements met! You're ready to submit."];
  }
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  
  const prompt = `
    You are a visa application advisor. Provide helpful recommendations.
    
    Visa Type: ${pkg.visaType}
    Country: ${pkg.destinationCountry}
    
    Missing Mandatory Documents:
    ${missingMandatory.join('\n')}
    
    Missing Optional Documents:
    ${missingOptional.join('\n')}
    
    Provide 3-5 specific, actionable recommendations to complete the application.
    Be helpful and prioritize what's most important.
    
    Return as a JSON array of strings:
    ["recommendation 1", "recommendation 2", ...]
  `;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleanedText);
}
```

---

## 🎨 FRONTEND PAGES

### 1. HomePage - `/`
**Messaging**: "AI-Powered Visa Document Assistant"

```tsx
<Hero>
  <h1>Prepare Your Visa Application with AI</h1>
  <p>Visa photos, document extraction, form auto-fill, and expert Q&A - all in one place</p>
  <Button>Start Your Application</Button>
</Hero>

<Features>
  - 📸 Perfect Visa Photos (20+ countries)
  - 🤖 Smart Document Extraction
  - 📝 Auto-Fill Government Forms
  - 💬 Interactive Requirements Chat
  - 🌐 Arabic ↔ English Translation
  - ✅ Completeness Verification
</Features>

<HowItWorks>
  1. Upload your documents (passport, certificates)
  2. Choose your visa type and destination
  3. AI extracts data and fills forms
  4. Download ready-to-submit documents
</HowItWorks>

<Pricing>
  Basic ($29) | Professional ($99) | Premium ($299)
</Pricing>
```

---

### 2. Upload Page - `/upload`
**Steps**:
1. Choose visa type & destination
2. Upload documents (drag & drop)
3. Upload selfies for visa photos
4. Select plan
5. Checkout

---

### 3. Dashboard - `/dashboard`
**Shows**:
- Active visa packages
- Document upload status
- Completeness score
- Chat history
- Download ready documents

---

### 4. Package View - `/package/:id`
**Tabs**:
- **Documents**: Uploaded + extracted data
- **Visa Photos**: Generated photos for all formats
- **Forms**: Auto-filled forms ready to download
- **Translations**: Translated documents
- **Chat**: Q&A assistant
- **Checklist**: Requirements with progress

---

## 💰 PRICING & BUSINESS MODEL

### Plans
```typescript
export const PRICING_PLANS = {
  basic: {
    name: "Basic",
    price: 2900, // $29
    features: [
      "Visa-compliant photos (all formats)",
      "Document scanning & extraction",
      "Requirements checklist (1 visa type)",
      "Email support",
    ],
  },
  
  professional: {
    name: "Professional",
    price: 9900, // $99
    popular: true,
    features: [
      "Everything in Basic",
      "Form auto-fill (3 forms)",
      "Document translation (10 pages)",
      "Interactive Q&A chatbot",
      "Completeness verification",
      "Priority support",
    ],
  },
  
  premium: {
    name: "Premium",
    price: 29900, // $299
    features: [
      "Everything in Professional",
      "Unlimited forms & translations",
      "Licensed agent consultation (30 min)",
      "Document courier coordination",
      "Application tracking",
      "White-glove support",
    ],
  },
};
```

---

## 🔧 TECH STACK SUMMARY

### AI/ML
- **Gemini 2.5 Pro**: Image generation, document extraction, translation
- **LlamaParse**: PDF parsing (1000 pages/day free)
- **LlamaIndex**: RAG pipeline
- **Instafill.ai**: Form auto-fill
- **ChromaDB**: Vector database for RAG
- **OpenAI Embeddings**: Text embeddings

### Backend
- **Node.js + TypeScript**
- **Express.js**
- **PostgreSQL** (Railway)
- **Redis** (for job queue)
- **BullMQ** (background jobs)

### Frontend
- **React 19 + TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **shadcn/ui**

### Storage
- **Cloudflare R2** (documents, photos, forms)

### Payments
- **Stripe** (one-time payments)

---

## 📊 COST ESTIMATES (Monthly)

### AI Services (for 100 users/month)
- **Gemini API**: ~$50-100 (generous free tier)
- **LlamaParse**: $0 (free tier: 1000 pages/day)
- **Instafill.ai**: ~$50-100 (depends on usage)
- **OpenAI Embeddings**: ~$10-20
- **ChromaDB**: $0 (self-hosted)

### Infrastructure
- **Railway (PostgreSQL + Redis)**: $20-30
- **Cloudflare R2**: ~$5-10 (storage + bandwidth)
- **Frontend Hosting**: $0 (Cloudflare Pages free)

**Total MVP Cost**: ~$150-300/month

**At Scale (1000 users/month)**: ~$500-1000/month

---

## 🚀 DEPLOYMENT CHECKLIST

### Environment Variables
```bash
# AI Services
GEMINI_API_KEY=
LLAMA_CLOUD_API_KEY=
INSTAFILL_API_KEY=
OPENAI_API_KEY=

# Database
DATABASE_URL=
REDIS_URL=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
SESSION_SECRET=
FRONTEND_URL=
BACKEND_URL=
NODE_ENV=production
```

### Pre-Launch Tasks
- [ ] Index visa requirement documents (RAG)
- [ ] Upload form templates to R2
- [ ] Set up Stripe products
- [ ] Configure Redis for job queue
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Load test with sample documents
- [ ] Legal disclaimers on all pages

---

## 📈 SUCCESS METRICS

**Week 4** (Phase 1):
- [ ] Users can upload docs and get visa photos
- [ ] Requirements checklist generated

**Week 8** (Phase 2):
- [ ] Document extraction working (passport, certs)
- [ ] Chat Q&A giving accurate answers
- [ ] RAG retrieving relevant info

**Week 10** (Phase 3):
- [ ] Forms auto-filling correctly
- [ ] 90%+ field accuracy

**Week 12** (MVP Launch):
- [ ] Full workflow: upload → extract → fill → download
- [ ] Completeness score accurate
- [ ] Translation working
- [ ] First 10 paying customers

---

## 🔮 FUTURE ENHANCEMENTS (Post-MVP)

### Phase 5: Advanced Features
- Multi-applicant packages (families)
- Appointment booking integration
- Status tracking (application submitted, approved, etc.)
- Email/SMS reminders
- Mobile app

### Phase 6: Enterprise
- B2B for immigration agencies
- White-label solution
- Bulk processing (50+ applicants)
- Custom workflows
- API access

### Phase 7: Expansion
- More countries (Canada, Australia, etc.)
- Citizenship applications
- Document attestation tracking
- Integration with government portals

---

## ⚠️ CRITICAL DISCLAIMERS

**Add to every page**:
```
VisaDocs is a document preparation assistant. We do NOT:
- Provide immigration legal advice
- Guarantee visa approval
- Submit applications on your behalf
- Replace licensed immigration consultants

For legal advice, consult a licensed immigration lawyer.
```

---

## 📞 SUPPORT PLAN

### Tier 1: Email (Basic)
- Response within 24 hours
- General questions
- Technical issues

### Tier 2: Priority (Professional)
- Response within 2 hours
- Chat support
- Document review

### Tier 3: White Glove (Premium)
- Instant response
- Video calls
- Licensed agent consultation
- Concierge service

---

## 🎯 GO-TO-MARKET STRATEGY

### Launch Channels
1. **SEO**: "UAE visa requirements", "Schengen visa documents"
2. **Content**: Blog posts, requirement guides
3. **Partnerships**: Immigration consultants, typing centers
4. **Social**: LinkedIn, expat Facebook groups
5. **Paid Ads**: Google Ads for visa keywords

### Target Markets (Priority Order)
1. **UAE** (Dubai, Abu Dhabi) - Huge expat market
2. **Saudi Arabia** - Growing expat workforce
3. **Qatar** - World Cup aftermath
4. **Schengen** - Indian/Pakistani professionals
5. **USA** - H1B visa applicants

---

## 💡 KEY DIFFERENTIATORS

vs Traditional Services:
- ✅ 10x faster (hours vs weeks)
- ✅ 10x cheaper ($99 vs $1000+)
- ✅ 24/7 availability
- ✅ Instant chat support
- ✅ Preview before submit

vs DIY:
- ✅ No manual form filling
- ✅ No document format errors
- ✅ Completeness verification
- ✅ Expert Q&A
- ✅ Translation included

---

This implementation plan is ready to be added to your project and executed week by week. The tech stack is proven, costs are manageable, and the market is huge. 

**Next Steps**:
1. Set up API keys (Gemini, LlamaParse, Instafill)
2. Create database schema
3. Start with Week 1 tasks
4. Ship incrementally

Let me know if you want me to create any additional documentation (API specs, database migrations, deployment guides, etc.)!
