/**
 * Visa Workflow Service
 *
 * Manages the workflow of guiding users through the 4 core VisaAssist services:
 * 1. AI Form Filler (AED 75)
 * 2. Document Validator (AED 40)
 * 3. AI Photo Compliance (AED 20)
 * 4. AI Travel Itinerary Generator (AED 125)
 */

import { askJeffrey } from './jeffrey';

export interface VisaRequirements {
  visaType: string;
  destinationCountry: string;
  nationality?: string;
  purposeOfTravel?: string;
  duration?: string;

  // Inferred requirements
  needsFormFilling?: boolean;
  needsDocumentValidation?: boolean;
  needsPhotoCompliance?: boolean;
  needsTravelItinerary?: boolean;

  // Additional context
  specificForms?: string[];
  requiredDocuments?: string[];
  photoSpecifications?: string;
  estimatedCost?: number;
}

export interface ServiceRecommendation {
  serviceId: 'form_filler' | 'document_validator' | 'photo_compliance' | 'travel_itinerary';
  serviceName: string;
  recommended: boolean;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  price: number;
  description: string;
}

export interface VisaWorkflow {
  requirements: VisaRequirements;
  recommendedServices: ServiceRecommendation[];
  totalEstimatedCost: number;
  nextSteps: string[];
  perplexityResearch?: string;
}

/**
 * Extract visa requirements from user conversation with Jeffrey
 */
export async function extractVisaRequirements(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<VisaRequirements | null> {
  // Build a prompt to extract structured data
  const extractionPrompt = `Based on this conversation, extract the visa requirements in JSON format.
Look for:
- Visa type (tourist, work, student, family, etc.)
- Destination country
- User's nationality
- Purpose of travel
- Duration of stay

Conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Return ONLY a JSON object with these fields: visaType, destinationCountry, nationality, purposeOfTravel, duration.
If any field is not mentioned, omit it or set to null.`;

  try {
    const result = await askJeffrey(extractionPrompt, {
      useSearch: false, // Don't need search for extraction
      conversationHistory: [],
    });

    // Parse the JSON from Jeffrey's response
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return extracted as VisaRequirements;
    }

    return null;
  } catch (error) {
    console.error('[Visa Workflow] Error extracting requirements:', error);
    return null;
  }
}

/**
 * Use Perplexity to research comprehensive visa requirements
 */
export async function researchVisaRequirements(
  visaType: string,
  destinationCountry: string,
  nationality?: string
): Promise<string> {
  const researchPrompt = `I need detailed, current information about ${visaType} visa requirements for ${destinationCountry}${nationality ? ` for ${nationality} nationals` : ''}.

Please provide:
1. **Required Documents** - Complete list with specifications
2. **Application Forms** - Which forms need to be filled
3. **Photo Requirements** - Exact specifications (size, background, etc.)
4. **Supporting Documents** - Bank statements, hotel bookings, travel itinerary requirements
5. **Processing Time** - Typical duration
6. **Fees** - Official costs
7. **Common Rejection Reasons** - What to avoid

Focus on official, up-to-date information from government sources.`;

  try {
    const result = await askJeffrey(researchPrompt, {
      useSearch: true, // Enable Perplexity's real-time search
      visaContext: {
        visaType,
        destinationCountry,
        nationality,
        stage: 'initial',
      },
    });

    return result.response;
  } catch (error) {
    console.error('[Visa Workflow] Error researching requirements:', error);
    return 'Unable to fetch visa requirements at this time.';
  }
}

/**
 * Determine which services are needed based on visa requirements
 */
export function determineRequiredServices(
  requirements: VisaRequirements,
  researchResults: string
): ServiceRecommendation[] {
  const recommendations: ServiceRecommendation[] = [];

  // Service 1: AI Form Filler
  const needsFormFilling =
    researchResults.toLowerCase().includes('application form') ||
    researchResults.toLowerCase().includes('visa form') ||
    requirements.specificForms && requirements.specificForms.length > 0;

  recommendations.push({
    serviceId: 'form_filler',
    serviceName: 'AI Form Filler',
    recommended: needsFormFilling,
    priority: needsFormFilling ? 'high' : 'low',
    reason: needsFormFilling
      ? 'Your visa application requires completing official government forms'
      : 'May not be needed for this visa type',
    price: 75,
    description: 'Upload your passport/documents and AI auto-fills complex government forms',
  });

  // Service 2: Document Validator
  const needsValidation =
    researchResults.toLowerCase().includes('attest') ||
    researchResults.toLowerCase().includes('certificate') ||
    researchResults.toLowerCase().includes('degree') ||
    researchResults.toLowerCase().includes('marriage certificate');

  recommendations.push({
    serviceId: 'document_validator',
    serviceName: 'Document Validator',
    recommended: needsValidation,
    priority: needsValidation ? 'high' : 'medium',
    reason: needsValidation
      ? 'Your documents require attestation and validation'
      : 'Recommended to ensure document compliance',
    price: 40,
    description: 'AI checks for required stamps, signatures, and formatting compliance',
  });

  // Service 3: AI Photo Compliance
  const needsPhoto =
    researchResults.toLowerCase().includes('photo') ||
    researchResults.toLowerCase().includes('photograph') ||
    researchResults.toLowerCase().includes('picture');

  recommendations.push({
    serviceId: 'photo_compliance',
    serviceName: 'AI Photo Compliance',
    recommended: needsPhoto,
    priority: needsPhoto ? 'high' : 'medium',
    reason: needsPhoto
      ? 'Visa photos must meet exact size and background requirements'
      : 'Standard requirement for most visas',
    price: 20,
    description: 'Ensures photos meet exact GCC visa specifications',
  });

  // Service 4: AI Travel Itinerary Generator
  const needsItinerary =
    requirements.visaType?.toLowerCase().includes('tourist') ||
    requirements.visaType?.toLowerCase().includes('visit') ||
    requirements.visaType?.toLowerCase().includes('schengen') ||
    researchResults.toLowerCase().includes('travel itinerary') ||
    researchResults.toLowerCase().includes('hotel booking') ||
    researchResults.toLowerCase().includes('flight confirmation');

  recommendations.push({
    serviceId: 'travel_itinerary',
    serviceName: 'AI Travel Itinerary Generator',
    recommended: needsItinerary,
    priority: needsItinerary ? 'high' : 'low',
    reason: needsItinerary
      ? 'Tourist/Schengen visas require detailed travel itineraries'
      : 'Not typically required for work/residence visas',
    price: 125,
    description: 'Generates compliant travel itinerary with flights, hotels, and activities',
  });

  // Sort by priority (high > medium > low)
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Create a complete visa workflow based on user requirements
 */
export async function createVisaWorkflow(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<VisaWorkflow | null> {
  try {
    // Step 1: Extract requirements from conversation
    const requirements = await extractVisaRequirements(conversationHistory);

    if (!requirements || !requirements.visaType || !requirements.destinationCountry) {
      return null; // Need more information
    }

    // Step 2: Research comprehensive requirements using Perplexity
    const researchResults = await researchVisaRequirements(
      requirements.visaType,
      requirements.destinationCountry,
      requirements.nationality
    );

    // Step 3: Determine which services are needed
    const recommendedServices = determineRequiredServices(requirements, researchResults);

    // Step 4: Calculate total estimated cost (only for recommended services)
    const totalEstimatedCost = recommendedServices
      .filter(s => s.recommended)
      .reduce((sum, s) => sum + s.price, 0);

    // Step 5: Generate next steps
    const nextSteps: string[] = [];
    const highPriorityServices = recommendedServices.filter(s => s.priority === 'high' && s.recommended);

    if (highPriorityServices.length > 0) {
      nextSteps.push(`Start with these essential services: ${highPriorityServices.map(s => s.serviceName).join(', ')}`);
    }

    nextSteps.push('Review the detailed requirements provided by Jeffrey');
    nextSteps.push('Gather all required documents');

    if (recommendedServices.find(s => s.serviceId === 'form_filler' && s.recommended)) {
      nextSteps.push('Use AI Form Filler to complete government forms');
    }

    if (recommendedServices.find(s => s.serviceId === 'document_validator' && s.recommended)) {
      nextSteps.push('Validate your documents for compliance');
    }

    if (recommendedServices.find(s => s.serviceId === 'photo_compliance' && s.recommended)) {
      nextSteps.push('Generate compliant visa photos');
    }

    if (recommendedServices.find(s => s.serviceId === 'travel_itinerary' && s.recommended)) {
      nextSteps.push('Generate your travel itinerary');
    }

    nextSteps.push('Submit your application with confidence');

    return {
      requirements,
      recommendedServices,
      totalEstimatedCost,
      nextSteps,
      perplexityResearch: researchResults,
    };
  } catch (error) {
    console.error('[Visa Workflow] Error creating workflow:', error);
    return null;
  }
}

/**
 * Generate a friendly summary message for the user
 */
export function generateWorkflowSummary(workflow: VisaWorkflow): string {
  const { requirements, recommendedServices, totalEstimatedCost, nextSteps } = workflow;

  const recommendedList = recommendedServices
    .filter(s => s.recommended)
    .map(s => `✓ **${s.serviceName}** (AED ${s.price}) - ${s.reason}`)
    .join('\n');

  const optionalList = recommendedServices
    .filter(s => !s.recommended)
    .map(s => `  ${s.serviceName} (AED ${s.price}) - ${s.reason}`)
    .join('\n');

  return `Great! Based on your **${requirements.visaType}** visa application for **${requirements.destinationCountry}**, here's what I recommend:

## 🎯 Recommended Services

${recommendedList}

${optionalList ? `\n## Optional Services\n\n${optionalList}\n` : ''}

## 💰 Estimated Total Cost
**AED ${totalEstimatedCost}** for all recommended services

## 📋 Your Next Steps

${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 📚 Detailed Requirements

${workflow.perplexityResearch}

---

Would you like me to help you get started with any of these services? Just let me know which one you'd like to begin with! 😊`;
}
