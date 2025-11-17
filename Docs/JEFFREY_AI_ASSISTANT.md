# Jeffrey - AI Visa Assistant 🤖

**Powered by Perplexity AI**

Jeffrey is an intelligent visa consultant AI assistant that helps users throughout their entire visa application journey. He's available 24/7 to answer questions, provide guidance, and offer expert advice on visa requirements for UAE, GCC countries, Schengen, USA, and more.

---

## ✨ Features

### 🧠 **Expert Knowledge**
- **UAE Visas**: Work permits, tourist visas, residence visas, Golden Visa
- **GCC Countries**: Saudi Arabia, Qatar, Oman, Bahrain, Kuwait
- **Schengen**: All 26 European countries
- **USA**: H1B, B1/B2, F1, J1, and more
- **Other Regions**: UK, Canada, Australia, India

### 💬 **Conversational AI**
- Natural, friendly conversation
- Context-aware responses
- Remembers conversation history
- Asks clarifying questions when needed

### 🔍 **Real-Time Search**
- Uses Perplexity's online search capabilities
- Provides up-to-date visa information
- Cites sources when available
- Verifies information from official government sources

### 🎯 **Stage-Aware Assistance**
Jeffrey adapts his responses based on where you are in the process:
- **Initial**: Getting started, understanding requirements
- **Document Upload**: Preparing and uploading documents
- **Photo Generation**: Meeting visa photo specifications
- **Form Filling**: Completing application forms correctly
- **Review**: Final checks before submission
- **Submitted**: Tracking and waiting for approval

---

## 🚀 Setup Instructions

### 1. Get Perplexity API Key

1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Copy your API key

### 2. Add to Environment Variables

Add the following to your `/Users/saleemjadallah/Desktop/MyDscvr-Headshot/backend/.env` file:

```bash
# Perplexity AI API (for Jeffrey visa assistant)
PERPLEXITY_API_KEY=your-perplexity-api-key-here
```

### 3. Restart Backend Server

```bash
cd backend
npm run dev
```

---

## 📡 API Endpoints

### **POST** `/api/visadocs/chat`
Send a message to Jeffrey and get a response.

**Request Body:**
```json
{
  "message": "What documents do I need for a UAE work visa?",
  "sessionId": 123,
  "visaContext": {
    "visaType": "work_visa",
    "destinationCountry": "uae",
    "nationality": "india",
    "stage": "initial",
    "packageId": 456
  },
  "useSearch": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "role": "assistant",
      "content": "Great question! For a UAE work visa, you'll need...",
      "timestamp": "2025-11-15T10:30:00.000Z",
      "sources": [
        {
          "title": "UAE Government Official Portal",
          "url": "https://u.ae/en/information-and-services/visa-and-emirates-id"
        }
      ]
    },
    "sessionId": 123,
    "conversationLength": 4
  }
}
```

### **POST** `/api/visadocs/chat/quick`
Quick question without session tracking (faster).

**Request Body:**
```json
{
  "question": "How long does a Schengen visa take?",
  "visaType": "tourist_visa",
  "destinationCountry": "schengen"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Schengen visa processing typically takes 15 calendar days..."
  }
}
```

### **GET** `/api/visadocs/chat/suggestions`
Get suggested questions based on context.

**Query Parameters:**
- `stage`: initial, document_upload, photo_generation, form_filling, review, submitted
- `visaType`: work_visa, tourist_visa, etc.
- `destinationCountry`: uae, schengen, usa, etc.

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "What documents do I need for my visa application?",
      "How long does the visa process take?",
      "What are the photo requirements?"
    ]
  }
}
```

### **GET** `/api/visadocs/chat/sessions`
Get all chat sessions for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "packageId": 456,
      "visaContext": {
        "country": "uae",
        "visaType": "work_visa"
      },
      "messageCount": 12,
      "createdAt": "2025-11-15T10:00:00.000Z",
      "updatedAt": "2025-11-15T10:30:00.000Z"
    }
  ]
}
```

### **GET** `/api/visadocs/chat/sessions/:id`
Get specific chat session with all messages.

### **DELETE** `/api/visadocs/chat/sessions/:id`
Delete a chat session.

### **POST** `/api/visadocs/chat/sessions/:id/clear`
Clear all messages in a session (keeps session).

---

## 🎨 Frontend Components

### **JeffreyChat**
Full-featured chat component with conversation history.

```tsx
import { JeffreyChat } from '@/components/visadocs/JeffreyChat';

<JeffreyChat
  visaContext={{
    visaType: 'work_visa',
    destinationCountry: 'uae',
    nationality: 'india',
    stage: 'document_upload',
    packageId: 123
  }}
  minimized={false}
  onMinimize={() => setMinimized(true)}
/>
```

### **JeffreyChatWidget**
Floating chat widget that can be used anywhere.

```tsx
import { JeffreyChatWidget } from '@/components/visadocs/JeffreyChatWidget';

// Floating widget (minimizable)
<JeffreyChatWidget
  visaContext={{
    visaType: 'work_visa',
    destinationCountry: 'uae',
    stage: 'initial'
  }}
/>

// Always open (for dedicated chat page)
<JeffreyChatWidget
  visaContext={{...}}
  alwaysOpen={true}
/>
```

---

## 💡 Usage Examples

### Example 1: On Landing Page
```tsx
// Show floating widget for visitors
<JeffreyChatWidget />
```

### Example 2: During Document Upload
```tsx
<JeffreyChatWidget
  visaContext={{
    visaType: 'work_visa',
    destinationCountry: 'uae',
    stage: 'document_upload',
    packageId: currentPackage.id
  }}
/>
```

### Example 3: Dedicated Chat Page
```tsx
function ChatPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Chat with Jeffrey</h1>
      <JeffreyChatWidget alwaysOpen={true} />
    </div>
  );
}
```

---

## 🎯 Jeffrey's Personality

Jeffrey is designed to be:
- **Friendly**: Warm, conversational tone
- **Professional**: Credible, accurate information
- **Encouraging**: Supportive during stressful process
- **Clear**: Simple, actionable advice
- **Honest**: Admits when unsure, recommends legal counsel

### Sample Interaction

**User**: "What documents do I need for a UAE work visa?"

**Jeffrey**: "Great question! For a UAE work visa, you'll need:

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

---

## 🔐 Security & Privacy

- **Session-based**: Authenticated users get persistent sessions
- **Guest mode**: Non-authenticated users can still ask questions
- **No PII storage**: Jeffrey doesn't store sensitive personal information
- **Disclaimers**: Always includes legal disclaimer

---

## 🚧 Current Limitations

- **Not a lawyer**: Jeffrey provides information, not legal advice
- **Accuracy**: While powered by Perplexity's real-time search, information should be verified
- **Context limit**: Conversation history limited to last 10 messages
- **Rate limits**: Perplexity API has rate limits (check your plan)

---

## 📊 Perplexity AI Models Used

### **llama-3.1-sonar-large-128k-online**
- **Used for**: Main chat responses
- **Features**: Real-time web search, up-to-date information
- **Context**: 128k tokens
- **Speed**: Moderate (includes search time)

### **llama-3.1-sonar-large-128k-chat**
- **Used for**: Quick questions (no search)
- **Features**: Faster responses, no web search
- **Context**: 128k tokens
- **Speed**: Fast

---

## 🎨 Customization

### Modify Jeffrey's Personality

Edit `/backend/src/services/jeffrey.ts`:

```typescript
const JEFFREY_SYSTEM_PROMPT = `
You are Jeffrey, a friendly visa consultant...
// Customize personality here
`;
```

### Add New Visa Types

Edit stage contexts in `jeffrey.ts`:

```typescript
const STAGE_CONTEXTS = {
  custom_stage: `Help users with custom stage...`,
};
```

### Change Suggested Questions

Edit `getSuggestedQuestions()` function in `jeffrey.ts`.

---

## 📈 Future Enhancements

- [ ] **Voice Input**: Add speech-to-text for questions
- [ ] **Multilingual**: Support Arabic, Hindi, Urdu
- [ ] **Document Upload**: Analyze uploaded documents in chat
- [ ] **Form Prefill**: Auto-fill forms based on chat
- [ ] **Smart Notifications**: Proactive tips based on stage
- [ ] **Video Guides**: Link to video tutorials
- [ ] **Live Agent Handoff**: Transfer to human agent for Premium users

---

## 🆘 Troubleshooting

### Jeffrey not responding
1. Check Perplexity API key is set in `.env`
2. Verify backend server is running
3. Check browser console for errors
4. Check Perplexity API rate limits

### Slow responses
1. Use `useSearch: false` for faster responses (no real-time search)
2. Check internet connection
3. Verify Perplexity API status

### Inaccurate information
1. Jeffrey uses real-time search, but AI can make mistakes
2. Always verify critical information with official sources
3. Include disclaimer in responses

---

## 📞 Support

For issues with Jeffrey:
1. Check this documentation
2. Review Perplexity AI docs: https://docs.perplexity.ai
3. Open an issue on GitHub
4. Contact support team

---

**Built with ❤️ using Perplexity AI**
