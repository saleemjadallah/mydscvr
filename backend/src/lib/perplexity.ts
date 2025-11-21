/**
 * Perplexity AI Integration for MYDSCVR Core Features
 *
 * Uses Perplexity's real-time search capabilities for:
 * - Travel itinerary generation with real hotels/flights
 * - Document validation requirements lookup
 * - Visa requirement intelligence
 *
 * MODEL CONFIGURATION (Updated Nov 2025):
 * - Primary: sonar-reasoning-pro (DeepSeek R1-based, best for complex reasoning + real-time search)
 * - Fallback: sonar-pro (Llama 3.3-based, stable and reliable)
 * - Override: Set PERPLEXITY_MODEL env var to use a different model
 *
 * BEST PRACTICES FOR TRAVEL ITINERARY:
 * - Use sonar-reasoning-pro for accurate, fact-based itinerary generation
 * - Lower temperature (0.3) for consistent, reliable results
 * - Higher max_tokens (8000) for detailed multi-day itineraries
 * - Gemini should only be used as fallback if Perplexity fails
 */

import OpenAI from 'openai';

// Initialize Perplexity AI client (uses OpenAI-compatible API)
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
});

// Allow overriding the model at runtime; default to the latest reasoning-capable model with a backwards-compatible fallback
// Updated Nov 2025: sonar-reasoning-pro is the most advanced model with DeepSeek R1 reasoning capabilities
// See: https://docs.perplexity.ai/getting-started/models/models/sonar-reasoning
const DEFAULT_PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL?.trim() || 'sonar-reasoning-pro';
const FALLBACK_PERPLEXITY_MODEL = 'sonar-pro'; // Llama 3.3-based fallback for stability

// ============================================
// TRAVEL ITINERARY GENERATION
// ============================================

interface TravelItineraryRequest {
  destination: string;
  countries: string[];
  duration: number;
  startDate: string;
  endDate: string;
  travelPurpose: string;
  budget: string;
}

interface DayItinerary {
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
    confirmationNumber: string;
  };
  transportation: {
    type: string;
    from: string;
    to: string;
    time: string;
    details: string;
  }[];
}

interface FlightDetails {
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
}

const extractJsonObject = (content: string) => {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Perplexity response');
  }

  return JSON.parse(jsonMatch[0]);
};

export async function generateTravelItinerary(request: TravelItineraryRequest): Promise<{
  itinerary: DayItinerary[];
  flightDetails: FlightDetails;
}> {
  const systemPrompt = `You are a professional travel planning AI that generates realistic, verifiable travel itineraries for visa applications.

Your itineraries must:
- Use REAL hotel names and addresses that exist in the destination
- Include REALISTIC flight routes with actual airlines operating those routes
- Plan daily activities that align with the stated travel purpose
- Be consistent with the budget level (low/medium/high)
- Include appropriate travel times between locations
- Be suitable for visa application documentation

Important: Generate confirmation numbers in realistic formats (e.g., CONF-ABC123456).`;

  const userPrompt = `Generate a detailed ${request.duration}-day travel itinerary for ${request.destination}.

**Trip Details:**
- Countries to visit: ${request.countries.join(', ') || 'Main destination only'}
- Start Date: ${request.startDate}
- End Date: ${request.endDate}
- Travel Purpose: ${request.travelPurpose}
- Budget Level: ${request.budget}
- Departure from: Dubai, UAE (DXB)

**Requirements:**
1. Generate realistic flight details (outbound and return) with actual airline routes
2. For each day, provide:
   - Morning, afternoon, and evening activities with specific locations
   - Hotel accommodation with real hotel name and address
   - Any inter-city transportation needed
3. Hotels should match the budget level:
   - Low: 3-star hotels, budget chains
   - Medium: 4-star hotels, business hotels
   - High: 5-star hotels, luxury properties
4. Activities should be:
   - Tourism: Tourist attractions, museums, landmarks, local experiences
   - Business: Conference venues, business districts, networking events
   - Family Visit: Mix of family activities and local exploration

Return the response as a valid JSON object with this structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "2024-01-15",
      "city": "Paris",
      "country": "France",
      "activities": [
        {
          "time": "09:00",
          "activity": "Visit Eiffel Tower",
          "location": "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
          "description": "Morning visit to the iconic Eiffel Tower with pre-booked tickets"
        }
      ],
      "accommodation": {
        "name": "Hotel Example Paris",
        "address": "123 Rue Example, 75001 Paris, France",
        "checkIn": "15:00",
        "checkOut": "11:00",
        "confirmationNumber": "CONF-PAR123456"
      },
      "transportation": []
    }
  ],
  "flightDetails": {
    "outbound": {
      "airline": "Emirates",
      "flightNumber": "EK073",
      "departure": { "airport": "DXB", "time": "08:45", "date": "2024-01-15" },
      "arrival": { "airport": "CDG", "time": "13:35", "date": "2024-01-15" }
    },
    "return": {
      "airline": "Emirates",
      "flightNumber": "EK074",
      "departure": { "airport": "CDG", "time": "22:30", "date": "2024-01-20" },
      "arrival": { "airport": "DXB", "time": "07:15", "date": "2024-01-21" }
    }
  }
}`;

  try {
    const invokeModel = async (model: string) => {
      const response = await perplexity.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual itinerary generation
        top_p: 0.9,
        max_tokens: 8000, // Increased for detailed multi-day itineraries
      });

      const content = (response.choices[0]?.message?.content as string) || '';
      const result = extractJsonObject(content);
      return {
        itinerary: result.itinerary,
        flightDetails: result.flightDetails,
      };
    };

    try {
      return await invokeModel(DEFAULT_PERPLEXITY_MODEL);
    } catch (primaryError) {
      // Attempt a fallback model if the default fails
      console.warn(`[Perplexity] Primary model "${DEFAULT_PERPLEXITY_MODEL}" failed, attempting fallback "${FALLBACK_PERPLEXITY_MODEL}".`, primaryError);
      if (DEFAULT_PERPLEXITY_MODEL !== FALLBACK_PERPLEXITY_MODEL) {
        return await invokeModel(FALLBACK_PERPLEXITY_MODEL);
      }
      throw primaryError;
    }
  } catch (error) {
    console.error('[Perplexity] Travel itinerary generation error:', error);
    throw error;
  }
}

// ============================================
// DOCUMENT VALIDATION INTELLIGENCE
// ============================================

interface DocumentRequirements {
  requiredElements: string[];
  commonIssues: string[];
  validationCriteria: {
    attestation: string;
    format: string;
    expiry: string;
    language: string;
  };
  countrySpecificNotes: string;
}

export async function getDocumentRequirements(
  documentType: string,
  targetCountry: string = 'UAE'
): Promise<DocumentRequirements> {
  const systemPrompt = `You are an expert in visa and immigration document requirements for ${targetCountry}.
Provide accurate, current information about document validation requirements.`;

  const userPrompt = `What are the exact requirements for a ${documentType} to be accepted for ${targetCountry} visa applications?

Please provide:
1. Required elements that must be present (stamps, signatures, seals, etc.)
2. Common issues that cause document rejection
3. Specific validation criteria for:
   - Attestation requirements (which authorities, order of attestation)
   - Format requirements (size, language, legibility)
   - Expiry/validity requirements
   - Language requirements (translation needs)
4. Any country-specific notes for documents from different nationalities

Return as JSON:
{
  "requiredElements": ["list of required elements"],
  "commonIssues": ["list of common rejection reasons"],
  "validationCriteria": {
    "attestation": "detailed attestation requirements",
    "format": "format requirements",
    "expiry": "validity/expiry rules",
    "language": "language and translation requirements"
  },
  "countrySpecificNotes": "important country-specific information"
}`;

  try {
    const response = await perplexity.chat.completions.create({
      model: 'sonar-pro', // Llama 3.3-based model with real-time web search
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Perplexity response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[Perplexity] Document requirements lookup error:', error);
    throw error;
  }
}

// ============================================
// DOCUMENT VALIDATION ANALYSIS
// ============================================

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  recommendation: string;
}

export async function analyzeDocumentCompliance(
  documentType: string,
  extractedText: string,
  imageAnalysis?: string
): Promise<{
  score: number;
  issues: ValidationIssue[];
  validationReport: {
    attestationCheck: { passed: boolean; details: string };
    signatureCheck: { passed: boolean; details: string };
    formatCheck: { passed: boolean; details: string };
    expiryCheck: { passed: boolean; details: string };
    legibilityCheck: { passed: boolean; details: string };
  };
}> {
  const systemPrompt = `You are an expert document validator for visa applications.
Analyze the provided document information and check for compliance issues.
Be thorough but fair - flag real issues, not minor formatting concerns.`;

  const userPrompt = `Analyze this ${documentType} for visa application compliance.

**Extracted Text:**
${extractedText}

**Image Analysis Notes:**
${imageAnalysis || 'No image analysis available'}

**Check for:**
1. Attestation stamps and seals (Ministry, Embassy, Notary)
2. Official signatures and authorizations
3. Document format and legibility
4. Expiry dates and validity
5. Translation requirements
6. Tampering or alterations

**Scoring:**
- 90-100: Excellent, ready for submission
- 70-89: Good, minor issues
- 50-69: Fair, some issues need attention
- Below 50: Poor, significant issues

Return as JSON:
{
  "score": 85,
  "issues": [
    {
      "severity": "warning",
      "category": "attestation",
      "description": "Embassy attestation date is over 6 months old",
      "recommendation": "Check if your target country requires recent attestation"
    }
  ],
  "validationReport": {
    "attestationCheck": {
      "passed": true,
      "details": "Ministry and Embassy attestation stamps visible"
    },
    "signatureCheck": {
      "passed": true,
      "details": "Original signature present and clear"
    },
    "formatCheck": {
      "passed": true,
      "details": "Document is properly formatted and organized"
    },
    "expiryCheck": {
      "passed": false,
      "details": "Certificate validity needs to be verified"
    },
    "legibilityCheck": {
      "passed": true,
      "details": "All text is clearly readable"
    }
  }
}`;

  try {
    const response = await perplexity.chat.completions.create({
      model: 'sonar-pro', // Llama 3.3-based model with real-time web search
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Perplexity response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[Perplexity] Document compliance analysis error:', error);
    throw error;
  }
}

// ============================================
// VISA PHOTO REQUIREMENTS
// ============================================

export async function getPhotoRequirements(visaType: string): Promise<{
  dimensions: string;
  background: string;
  faceSize: string;
  additionalRequirements: string[];
  commonRejectionReasons: string[];
}> {
  const systemPrompt = `You are an expert on visa photo requirements.
Provide accurate, current specifications for different visa types.`;

  const userPrompt = `What are the exact photo requirements for ${visaType}?

Provide:
1. Exact dimensions (in mm and pixels)
2. Background color requirements
3. Face size percentage
4. Additional requirements (glasses, headwear, expression, etc.)
5. Common rejection reasons for this visa type

Return as JSON:
{
  "dimensions": "35x45mm (600x800px)",
  "background": "White (#FFFFFF)",
  "faceSize": "70-80% of frame",
  "additionalRequirements": ["requirement1", "requirement2"],
  "commonRejectionReasons": ["reason1", "reason2"]
}`;

  try {
    const response = await perplexity.chat.completions.create({
      model: 'sonar-pro', // Llama 3.3-based model with real-time web search
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Perplexity response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[Perplexity] Photo requirements lookup error:', error);
    throw error;
  }
}
