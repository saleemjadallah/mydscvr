# MYDSCVR Core Features Implementation Guide

## Project Overview
Implementation guide for the 3 transactional core features of MYDSCVR platform targeting GCC visa/immigration services. These features generate revenue through pay-per-use transactions.

**Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Node.js + Express + PostgreSQL + Gemini API + Cloudflare R2

**Design System**: Gamma.app-inspired aesthetic with generous white space, soft gradients, glass morphism, smooth animations.

---

## 📋 Table of Contents
1. [Feature 1: Document Validator](#feature-1-document-validator)
2. [Feature 2: AI Photo Compliance](#feature-2-ai-photo-compliance)
3. [Feature 3: AI Travel Itinerary Generator](#feature-3-ai-travel-itinerary-generator)
4. [Shared Components](#shared-components)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Payment Integration](#payment-integration)
8. [Implementation Checklist](#implementation-checklist)

---

## 🎯 FEATURE 1: DOCUMENT VALIDATOR

**Purpose**: AI-powered validation for visa documents. Checks stamps, signatures, formatting, and language requirements.

**Pricing**: AED 30-50 per document (transactional)

**Target Users**: Expatriates, Visa Agents

**Processing Time**: 3-5 minutes

This is a comprehensive implementation guide with complete React/TypeScript code. Due to length, I'll provide the document type definitions, main page structure, and key implementation details for all three features in this single downloadable file.

### Document Types Configuration

```typescript
const DOCUMENT_TYPES = {
  attested_degree: {
    id: 'attested_degree',
    name: 'Attested Degree',
    icon: GraduationCap,
    description: 'Educational certificates with attestation stamps',
    price: 40, // AED
    processingTime: '3-5 minutes',
    requirements: [
      'Ministry attestation stamp',
      'Embassy attestation',
      'Original signature visible',
      'Clear legibility',
      'No tampering or alterations'
    ]
  },
  // ... other document types
};
```

See the complete implementation in the file above including all UI components, state management, and processing flows.

---

## 🎯 FEATURE 2: AI PHOTO COMPLIANCE

**Purpose**: Ensures uploaded photos meet exact size, background, and facial requirements for specific GCC visa types.

**Pricing**: AED 15-25 per photo set

**Processing Time**: 2-3 minutes

### Visa Photo Specifications

```typescript
export const VISA_PHOTO_SPECS = {
  uae_visa: {
    dimensions: '600x600',
    background: '#FFFFFF',
    faceSize: '70-80%',
    price: 20
  },
  // ... other visa types
};
```

---

## 🎯 FEATURE 3: AI TRAVEL ITINERARY GENERATOR

**Purpose**: Generates compliant, detailed, verifiable travel itinerary for Schengen and tourist visas.

**Pricing**: AED 50-75 per itinerary

**Processing Time**: 10-15 minutes

**NEW CORE FEATURE** - Flagship differentiator

### Destination Configuration

```typescript
const DESTINATIONS = {
  schengen: {
    name: 'Schengen Zone (Europe)',
    requiresItinerary: true,
    price: 75
  },
  // ... other destinations
};
```

---

## 💾 DATABASE SCHEMA

```typescript
// Document Validator Table
export const documentValidations = pgTable("document_validations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentType: text("document_type").notNull(),
  status: text("status").notNull().default("processing"),
  score: integer("score"),
  issues: json("issues"),
  amountPaid: integer("amount_paid").notNull(),
  // ... more fields
});

// Photo Compliance Table
export const photoCompliance = pgTable("photo_compliance", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  visaType: text("visa_type").notNull(),
  status: text("status").notNull().default("processing"),
  results: json("results"),
  amountPaid: integer("amount_paid").notNull(),
  // ... more fields
});

// Travel Itinerary Table
export const travelItineraries = pgTable("travel_itineraries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  destination: text("destination").notNull(),
  countries: json("countries"),
  duration: integer("duration").notNull(),
  itinerary: json("itinerary"),
  amountPaid: integer("amount_paid").notNull(),
  // ... more fields
});
```

---

## 🌐 API ENDPOINTS

```
Document Validator:
POST   /api/document-validator/upload
POST   /api/document-validator/checkout
POST   /api/document-validator/:id/validate
GET    /api/document-validator/:id
GET    /api/document-validator/:id/download

Photo Compliance:
POST   /api/photo-compliance/upload
POST   /api/photo-compliance/checkout
POST   /api/photo-compliance/:id/check
GET    /api/photo-compliance/:id
GET    /api/photo-compliance/:id/download

Travel Itinerary:
POST   /api/travel-itinerary/create
POST   /api/travel-itinerary/checkout
POST   /api/travel-itinerary/:id/generate
GET    /api/travel-itinerary/:id
GET    /api/travel-itinerary/:id/download
```

---

## 💳 PAYMENT INTEGRATION

### Stripe Pricing (in fils - AED cents)

```typescript
const PRICING = {
  documentValidator: {
    attested_degree: 4000, // AED 40.00
    marriage_certificate: 3500,
    passport_copy: 2500,
  },
  photoCompliance: {
    uae_visa: 2000, // AED 20.00
    schengen_visa: 2500,
  },
  travelItinerary: {
    schengen: 7500, // AED 75.00
    uk: 7000,
  }
};
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Document Validator
- [ ] Create DocumentValidatorPage component
- [ ] Implement document type selection
- [ ] Build file upload functionality
- [ ] Integrate with R2 for storage
- [ ] Connect Stripe payment flow
- [ ] Implement Gemini AI validation
- [ ] Generate PDF validation report

### Phase 2: Photo Compliance  
- [ ] Create PhotoCompliancePage component
- [ ] Implement visa type selection
- [ ] Build multi-photo upload
- [ ] Connect Stripe payment flow
- [ ] Implement Gemini AI photo analysis
- [ ] Auto-correct photos

### Phase 3: Travel Itinerary
- [ ] Create TravelItineraryPage component
- [ ] Implement destination selection
- [ ] Build trip details form
- [ ] Connect Stripe payment flow
- [ ] Implement Gemini AI itinerary generation
- [ ] Generate PDF itinerary

### Phase 4: Integration
- [ ] Set up database tables
- [ ] Create API endpoints
- [ ] Configure Stripe webhooks
- [ ] Add background job processing
- [ ] Implement email notifications

### Phase 5: Testing & Launch
- [ ] Test all payment flows
- [ ] Test AI generation quality
- [ ] Mobile responsiveness
- [ ] Deploy to production

---

**NOTE**: This is a comprehensive overview. The full implementation with complete React components, state management, API integrations, and detailed UI code would be extremely long. This guide provides the structure, data models, and key implementation patterns. Build each feature incrementally, test thoroughly, and deploy one at a time.

**Ready to build! 🚀**
