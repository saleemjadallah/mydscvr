/**
 * Visa Research Service - Uses Perplexity AI to research visa requirements
 * This service enriches user onboarding data with detailed visa information
 */

import OpenAI from 'openai';

// Initialize Perplexity AI client
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
});

export interface TravelProfile {
  destinationCountry: string;
  travelPurpose: string;
  nationality: string;
  travelDates: { start: string; end: string };
  specialConcerns: string[];
}

export interface VisaRequirements {
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
}

export interface EnrichedTravelProfile extends TravelProfile {
  visaRequirements: VisaRequirements;
  lastUpdated: string;
}

const VISA_RESEARCH_PROMPT = `You are a visa requirements research assistant. Your job is to provide accurate, current visa requirement information based on the user's travel profile.

You MUST respond ONLY with valid JSON matching this exact structure (no markdown, no explanation, just JSON):
{
  "visaType": "string - the specific visa type needed (e.g., 'Schengen Tourist Visa', 'B1/B2 Visitor Visa', 'UAE Tourist Visa')",
  "processingTime": "string - typical processing time (e.g., '15-30 business days')",
  "requiredDocuments": ["array of strings - list each required document"],
  "photoRequirements": {
    "dimensions": "string - photo size (e.g., '2x2 inches', '35x45mm')",
    "background": "string - background color required",
    "specifications": ["array of strings - specific photo requirements"]
  },
  "fees": "string - visa fees and any additional costs",
  "validity": "string - how long the visa is valid for",
  "additionalNotes": ["array of strings - important notes, warnings, or tips specific to this nationality/destination combination"]
}

Important guidelines:
- Research current 2024-2025 visa requirements
- Be specific to the nationality and destination combination
- Include any special requirements or restrictions
- Note if visa-free travel is possible
- Highlight common pitfalls for this specific case
- Include attestation requirements if applicable
- Mention health insurance requirements if needed`;

/**
 * Research visa requirements using Perplexity AI
 */
export async function researchVisaRequirements(
  travelProfile: TravelProfile
): Promise<VisaRequirements> {
  const userQuery = `Research visa requirements for:
- Nationality/Passport: ${travelProfile.nationality}
- Destination Country: ${travelProfile.destinationCountry}
- Purpose of Travel: ${travelProfile.travelPurpose}
- Travel Dates: ${travelProfile.travelDates.start} to ${travelProfile.travelDates.end}
${travelProfile.specialConcerns.length > 0 ? `- Special Concerns: ${travelProfile.specialConcerns.join(', ')}` : ''}

Provide complete visa requirements including documents, photo specs, fees, and processing time.`;

  try {
    const completion = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-large-128k-online', // Use online model for real-time research
      messages: [
        {
          role: 'system',
          content: VISA_RESEARCH_PROMPT,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanedResponse = responseContent.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      const requirements = JSON.parse(cleanedResponse) as VisaRequirements;
      return requirements;
    } catch (parseError) {
      console.error('[VisaResearch] Failed to parse JSON response:', parseError);
      console.error('[VisaResearch] Raw response:', responseContent);

      // Return default requirements if parsing fails
      return getDefaultRequirements(travelProfile);
    }
  } catch (error) {
    console.error('[VisaResearch] Error calling Perplexity API:', error);
    return getDefaultRequirements(travelProfile);
  }
}

/**
 * Get default visa requirements as fallback
 */
function getDefaultRequirements(travelProfile: TravelProfile): VisaRequirements {
  const isSchengen = ['germany', 'france', 'italy', 'spain', 'netherlands', 'belgium', 'austria', 'greece', 'portugal', 'switzerland']
    .some(c => travelProfile.destinationCountry.toLowerCase().includes(c)) ||
    travelProfile.destinationCountry.toLowerCase().includes('schengen');

  const isUSA = travelProfile.destinationCountry.toLowerCase().includes('usa') ||
    travelProfile.destinationCountry.toLowerCase().includes('united states');

  const isUAE = travelProfile.destinationCountry.toLowerCase().includes('uae') ||
    travelProfile.destinationCountry.toLowerCase().includes('emirates');

  const isUK = travelProfile.destinationCountry.toLowerCase().includes('uk') ||
    travelProfile.destinationCountry.toLowerCase().includes('united kingdom') ||
    travelProfile.destinationCountry.toLowerCase().includes('britain');

  if (isSchengen) {
    return {
      visaType: 'Schengen Tourist Visa (Type C)',
      processingTime: '15-30 calendar days',
      requiredDocuments: [
        'Valid passport (6+ months validity, 2 blank pages)',
        'Completed Schengen visa application form',
        'Two recent passport-sized photos',
        'Travel health insurance (min €30,000 coverage)',
        'Flight reservation (round-trip)',
        'Hotel bookings or accommodation proof',
        'Bank statements (last 3-6 months)',
        'Employment letter or proof of income',
        'Travel itinerary',
        'Cover letter explaining travel purpose',
      ],
      photoRequirements: {
        dimensions: '35mm x 45mm',
        background: 'White or off-white',
        specifications: [
          'Recent photo (taken within last 6 months)',
          'Face must cover 70-80% of photo',
          'Neutral expression, mouth closed',
          'Eyes clearly visible, no glasses',
          'No head coverings (except religious)',
          'High quality, no shadows on face',
        ],
      },
      fees: '€80-90 for adults (varies by country)',
      validity: 'Up to 90 days within 180-day period',
      additionalNotes: [
        'Apply at embassy of main destination country',
        'Book appointment early during peak season',
        'Ensure sufficient funds (€50-100 per day recommended)',
        'Travel insurance must cover entire Schengen area',
        'Keep all original documents, not just copies',
      ],
    };
  }

  if (isUSA) {
    return {
      visaType: travelProfile.travelPurpose.toLowerCase().includes('business') ? 'B1 Business Visa' : 'B1/B2 Tourist/Business Visa',
      processingTime: '3-6 weeks (varies by embassy)',
      requiredDocuments: [
        'Valid passport (6+ months validity beyond travel dates)',
        'DS-160 application confirmation page',
        'Visa appointment confirmation',
        'Photo meeting US visa requirements',
        'Proof of financial stability',
        'Employment verification letter',
        'Travel itinerary',
        'Proof of ties to home country',
        'Previous US visas (if applicable)',
      ],
      photoRequirements: {
        dimensions: '2x2 inches (51mm x 51mm)',
        background: 'Plain white or off-white',
        specifications: [
          'Recent photo (taken within last 6 months)',
          'Full face visible, front view',
          'Eyes must be open and visible',
          'Neutral expression',
          'No glasses',
          'Digital photo: 600x600 to 1200x1200 pixels',
        ],
      },
      fees: '$185 USD (non-immigrant visa fee)',
      validity: 'Up to 10 years (multiple entry)',
      additionalNotes: [
        'Requires in-person interview at US Embassy',
        'Be prepared for questions about ties to home country',
        'Show strong financial and employment ties',
        'Previous visa refusals may affect application',
        'Consider ESTA if eligible for Visa Waiver Program',
      ],
    };
  }

  if (isUAE) {
    return {
      visaType: 'UAE Tourist Visa',
      processingTime: '3-5 business days',
      requiredDocuments: [
        'Valid passport (6+ months validity)',
        'Passport-sized photo',
        'Completed visa application form',
        'Flight reservation',
        'Hotel booking confirmation',
        'Bank statement (last 3 months)',
        'Travel insurance (recommended)',
      ],
      photoRequirements: {
        dimensions: '43mm x 55mm',
        background: 'White background',
        specifications: [
          'Recent photo (within last 3 months)',
          'Full face visible',
          'No head coverings (except religious)',
          'Clear, high-resolution image',
          'No shadows on face',
          '80% face coverage',
        ],
      },
      fees: 'AED 300-1000 (varies by duration)',
      validity: '30 days (extendable) or 90 days',
      additionalNotes: [
        'Can apply online through ICP portal',
        'Sponsor required for some nationalities',
        'Multiple entry visas available',
        'Overstay penalties are strict',
        'Some nationalities get visa on arrival',
      ],
    };
  }

  if (isUK) {
    return {
      visaType: 'UK Standard Visitor Visa',
      processingTime: '3-6 weeks',
      requiredDocuments: [
        'Valid passport',
        'Completed online application',
        'Passport photo',
        'Proof of accommodation',
        'Financial documents (6 months bank statements)',
        'Employment letter',
        'Travel itinerary',
        'Previous travel history',
      ],
      photoRequirements: {
        dimensions: '45mm x 35mm',
        background: 'Light grey or cream',
        specifications: [
          'Recent photo (within last month)',
          'Clear and in focus',
          'No shadows on face',
          'Full face visible',
          'Neutral expression',
          'Eyes open and visible',
        ],
      },
      fees: '£115 GBP (standard visitor visa)',
      validity: '6 months (up to 6 years available)',
      additionalNotes: [
        'Apply through official gov.uk website',
        'Biometrics appointment required',
        'Show strong ties to home country',
        'Demonstrate genuine tourist intent',
        'Consider priority service for faster processing',
      ],
    };
  }

  // Generic fallback
  return {
    visaType: `${travelProfile.travelPurpose} Visa`,
    processingTime: '2-4 weeks (varies)',
    requiredDocuments: [
      'Valid passport (6+ months validity)',
      'Visa application form',
      'Passport-sized photos',
      'Proof of accommodation',
      'Travel insurance',
      'Bank statements',
      'Flight reservations',
      'Employment/income proof',
    ],
    photoRequirements: {
      dimensions: 'Standard passport size',
      background: 'White or light colored',
      specifications: [
        'Recent photo',
        'Clear face visibility',
        'Neutral expression',
        'No glasses',
        'High quality image',
      ],
    },
    fees: 'Varies by country and visa type',
    validity: 'Varies by visa type',
    additionalNotes: [
      'Check specific embassy requirements',
      'Apply well in advance of travel date',
      'Keep copies of all documents',
      'Verify current requirements online',
    ],
  };
}

/**
 * Enrich travel profile with researched visa requirements
 */
export async function enrichTravelProfile(
  travelProfile: TravelProfile
): Promise<EnrichedTravelProfile> {
  const visaRequirements = await researchVisaRequirements(travelProfile);

  return {
    ...travelProfile,
    visaRequirements,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate personalized recommendations based on travel profile
 */
export function generateRecommendations(
  enrichedProfile: EnrichedTravelProfile
): {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: { label: string; href: string };
}[] {
  const recommendations: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: { label: string; href: string };
  }[] = [];

  // High priority: Document validation
  recommendations.push({
    priority: 'high',
    title: 'Validate Your Documents',
    description: `You'll need ${enrichedProfile.visaRequirements.requiredDocuments.length} documents for your ${enrichedProfile.visaRequirements.visaType}. Let's make sure they meet all requirements.`,
    action: { label: 'Start Validation', href: '/app/validator' },
  });

  // High priority: Photo compliance
  recommendations.push({
    priority: 'high',
    title: 'Generate Compliant Photos',
    description: `${enrichedProfile.destinationCountry} requires ${enrichedProfile.visaRequirements.photoRequirements.dimensions} photos with ${enrichedProfile.visaRequirements.photoRequirements.background} background.`,
    action: { label: 'Create Photos', href: '/app/photo-compliance' },
  });

  // Medium priority: Travel planning
  const startDate = new Date(enrichedProfile.travelDates.start);
  const endDate = new Date(enrichedProfile.travelDates.end);
  const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  recommendations.push({
    priority: 'medium',
    title: 'Plan Your Itinerary',
    description: `Create a ${tripDays}-day travel plan for ${enrichedProfile.destinationCountry}. A detailed itinerary strengthens your visa application.`,
    action: { label: 'Create Itinerary', href: '/app/travel-planner' },
  });

  // Medium priority: Form filling
  recommendations.push({
    priority: 'medium',
    title: 'Start Your Application Form',
    description: `Let AI auto-fill your ${enrichedProfile.visaRequirements.visaType} application with the information you've provided.`,
    action: { label: 'Fill Forms', href: '/app/form-filler' },
  });

  return recommendations;
}
