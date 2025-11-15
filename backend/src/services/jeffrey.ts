/**
 * Jeffrey - AI Visa Helper powered by Perplexity AI
 *
 * Jeffrey is an expert visa consultant AI that helps users throughout their
 * visa application journey. He has deep knowledge of immigration requirements
 * for UAE, GCC, Schengen, USA, and other countries.
 */

import OpenAI from 'openai';

// Initialize Perplexity AI client (uses OpenAI-compatible API)
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
});

// Jeffrey's personality and expertise
const JEFFREY_SYSTEM_PROMPT = `You are Jeffrey, a friendly and knowledgeable AI visa consultant assistant for VisaDocs.

## Your Role
You help users navigate the complex world of visa applications with warmth, clarity, and expertise. You're patient, encouraging, and always provide accurate, up-to-date information.

## Your Expertise
- **UAE Visas**: Work permits, tourist visas, residence visas, family visas, Golden Visa
- **GCC Countries**: Saudi Arabia, Qatar, Oman, Bahrain, Kuwait visa requirements
- **Schengen Visas**: Tourist, business, student visas for 26 European countries
- **USA Visas**: H1B, B1/B2, F1, J1, and other visa types
- **UK, Canada, Australia**: Immigration and visitor visa requirements
- **Document Requirements**: Passport specifications, photo requirements, attestation procedures
- **Processing Times**: Realistic timelines for different visa types
- **Common Issues**: Rejection reasons, appeals, and how to avoid mistakes

## Your Personality
- **Friendly**: Use a warm, conversational tone. Address users directly.
- **Professional**: Maintain credibility with accurate information.
- **Encouraging**: Visa applications can be stressful - be supportive and positive.
- **Clear**: Explain complex requirements in simple, actionable steps.
- **Honest**: If you don't know something, admit it. Never guess on legal matters.

## Your Approach
1. **Ask clarifying questions** when the user's situation is unclear
2. **Provide specific, actionable advice** not generic information
3. **Use bullet points** for lists and requirements
4. **Include relevant details** like fees, processing times, validity periods
5. **Cite sources** when possible (e.g., "According to USCIS guidelines...")
6. **Warn about common pitfalls** and mistakes to avoid
7. **Be culturally sensitive** especially for Middle Eastern visa requirements

## Important Guidelines
- **Always add disclaimers** for legal advice: "I'm an AI assistant, not a licensed immigration lawyer. For legal advice, consult a licensed professional."
- **Stay current**: Use your real-time search capabilities to verify information
- **Be specific**: Instead of "bring documents", say "bring your original passport with 6+ months validity, 2 passport photos, bank statements from last 3 months"
- **Context matters**: Consider the user's nationality, destination, and visa type

## Example Interactions
User: "What documents do I need for a UAE work visa?"
Jeffrey: "Great question! For a UAE work visa, you'll need:

**Essential Documents:**
- Original passport (minimum 6 months validity)
- Passport-sized photo (white background, 600x600px)
- Attested educational certificates (degree must be attested by UAE embassy)
- Employment contract from UAE sponsor
- Medical fitness certificate (valid 3 months)

**Processing:** Typically 5-7 business days once all documents are submitted.
**Cost:** Approximately 2,700-3,000 AED including visa fee, Emirates ID, and medical.

Your nationality can affect requirements. May I ask where you're from to give you more specific guidance?

📌 Note: I'm an AI assistant. For legal advice specific to your situation, consult a licensed immigration consultant."

User: "How long does a Schengen visa take?"
Jeffrey: "Schengen visa processing typically takes **15 calendar days** from your appointment, but can extend to 30-60 days in some cases.

**Timeline Breakdown:**
- Application submission: Day 0 (at consulate/VFS)
- Standard processing: 15 days
- Peak season delays: Up to 30 days
- Special cases: Up to 60 days

**Pro Tips:**
✓ Apply 3-6 months before your trip (ideal timing)
✓ Avoid December/June-August (peak seasons)
✓ Book your appointment early - slots fill fast
✓ Have all documents ready to avoid delays

Which Schengen country are you applying to? Some consulates are faster than others! 😊"

Remember: You're here to make visa applications less stressful and more successful. Be the helpful friend who happens to be an immigration expert!`;

// Context-aware prompts for different stages
const STAGE_CONTEXTS = {
  initial: `The user is just starting their visa application journey. Help them understand what they need to get started.`,

  document_upload: `The user is uploading documents. Help them understand what documents are required, how to prepare them (attestation, translation, etc.), and photo specifications.`,

  photo_generation: `The user is generating visa photos. Explain photo requirements for different countries, what makes a compliant photo, and common rejection reasons.`,

  form_filling: `The user is filling out visa application forms. Help them understand specific fields, provide examples, and warn about common mistakes.`,

  review: `The user is reviewing their application before submission. Help them do a final check, verify completeness, and prepare for next steps.`,

  submitted: `The user has submitted their application. Help them understand processing times, tracking methods, and what to do while waiting.`,
};

export interface JeffreyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    title: string;
    url: string;
  }[];
}

export interface JeffreyChatOptions {
  visaContext?: {
    visaType?: string;
    destinationCountry?: string;
    nationality?: string;
    stage?: keyof typeof STAGE_CONTEXTS;
  };
  conversationHistory?: JeffreyMessage[];
  useSearch?: boolean; // Enable Perplexity's real-time search
}

/**
 * Ask Jeffrey a question and get an AI-powered response
 */
export async function askJeffrey(
  userMessage: string,
  options: JeffreyChatOptions = {}
): Promise<{
  response: string;
  sources?: { title: string; url: string }[];
}> {
  const {
    visaContext,
    conversationHistory = [],
    useSearch = true,
  } = options;

  // Build context string from visa context
  let contextString = '';
  if (visaContext) {
    const parts: string[] = [];
    if (visaContext.visaType) parts.push(`Visa Type: ${visaContext.visaType}`);
    if (visaContext.destinationCountry) parts.push(`Destination: ${visaContext.destinationCountry}`);
    if (visaContext.nationality) parts.push(`User Nationality: ${visaContext.nationality}`);
    if (visaContext.stage) {
      parts.push(`Stage: ${visaContext.stage}`);
      parts.push(STAGE_CONTEXTS[visaContext.stage]);
    }

    if (parts.length > 0) {
      contextString = `\n\n**Current Context:**\n${parts.join('\n')}`;
    }
  }

  // Build conversation messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: JEFFREY_SYSTEM_PROMPT + contextString,
    },
  ];

  // Add conversation history (last 10 messages to avoid token limits)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  try {
    // Use Perplexity's sonar model with online search capabilities
    const completion = await perplexity.chat.completions.create({
      model: useSearch
        ? 'llama-3.1-sonar-large-128k-online' // With real-time search
        : 'llama-3.1-sonar-large-128k-chat',  // Without search (faster)
      messages,
      temperature: 0.7, // Balanced creativity and accuracy
      max_tokens: 1000,
      top_p: 0.9,
    });

    const responseContent = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Extract sources if available (Perplexity provides citations)
    const sources: { title: string; url: string }[] = [];
    // Note: Perplexity API may include citations in the response
    // You can parse them if they're structured in the response

    return {
      response: responseContent,
      sources,
    };
  } catch (error) {
    console.error('[Jeffrey] Error calling Perplexity API:', error);

    // Fallback response
    return {
      response: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or if you need immediate help, consider contacting our support team. 🙏",
      sources: [],
    };
  }
}

/**
 * Get a quick answer for common visa questions (optimized for speed)
 */
export async function askJeffreyQuick(
  question: string,
  visaType?: string,
  destinationCountry?: string
): Promise<string> {
  let context = '';
  if (visaType || destinationCountry) {
    context = `\n\nContext: ${visaType ? `Visa type: ${visaType}` : ''} ${destinationCountry ? `Destination: ${destinationCountry}` : ''}`;
  }

  const messages = [
    {
      role: 'system' as const,
      content: JEFFREY_SYSTEM_PROMPT + '\n\nProvide concise, helpful answers. Keep responses under 200 words.',
    },
    {
      role: 'user' as const,
      content: question + context,
    },
  ];

  try {
    const completion = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-large-128k-chat', // Faster without search
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || 'Sorry, I could not answer that question.';
  } catch (error) {
    console.error('[Jeffrey Quick] Error:', error);
    return "I'm having trouble right now. Please try again in a moment.";
  }
}

/**
 * Get suggested questions based on context
 */
export function getSuggestedQuestions(
  stage?: keyof typeof STAGE_CONTEXTS,
  visaType?: string,
  destinationCountry?: string
): string[] {
  // Default general questions
  const defaultQuestions = [
    "What documents do I need for my visa application?",
    "How long does the visa process take?",
    "What are the photo requirements?",
    "How much does it cost?",
    "Can I track my application status?",
  ];

  // Stage-specific questions
  const stageQuestions: Record<string, string[]> = {
    initial: [
      `What are the requirements for a ${visaType || 'visa'} in ${destinationCountry || 'this country'}?`,
      "How do I get started with my application?",
      "What documents need to be attested?",
      "How long is the processing time?",
    ],
    document_upload: [
      "What format should my documents be in?",
      "Do I need to translate my documents?",
      "How do I get my degree attested?",
      "What if my passport expires soon?",
    ],
    photo_generation: [
      "What are the photo specifications?",
      "Can I wear glasses in my visa photo?",
      "What background color is required?",
      "Why do visa photos get rejected?",
    ],
    form_filling: [
      "What should I write in the 'purpose of visit' field?",
      "How do I fill out the sponsor information?",
      "What if I don't have all the information?",
      "Common mistakes to avoid in forms?",
    ],
    review: [
      "Is my application complete?",
      "What are common reasons for rejection?",
      "What happens after I submit?",
      "How do I track my application?",
    ],
    submitted: [
      "How long until I get a decision?",
      "How do I track my application?",
      "What if my visa is rejected?",
      "Can I expedite the process?",
    ],
  };

  if (stage && stageQuestions[stage]) {
    return stageQuestions[stage];
  }

  return defaultQuestions;
}

/**
 * Format Jeffrey's response with helpful styling
 */
export function formatJeffreyResponse(response: string): {
  text: string;
  hasLists: boolean;
  hasWarnings: boolean;
  hasProTips: boolean;
} {
  const hasLists = response.includes('**') || response.includes('•') || response.includes('-');
  const hasWarnings = response.includes('⚠️') || response.includes('Important:');
  const hasProTips = response.includes('Pro Tip') || response.includes('✓');

  return {
    text: response,
    hasLists,
    hasWarnings,
    hasProTips,
  };
}
