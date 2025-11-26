# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyDscvr-Edu (K-6 AI Tutor) is an AI-powered educational platform designed for K-6 students. The platform features Jeffrey, a friendly AI tutor that helps students learn by processing uploaded lesson content (PDFs, images, YouTube videos) and providing interactive, contextual assistance through a chat interface.

**Key Features:**
- Upload and process educational content (PDFs, images, YouTube links)
- Interactive chat with Jeffrey, the AI tutor
- Lesson viewing with structured content display
- Flashcard and quiz generation
- Study guide creation
- Context-aware learning assistance

**Tech Stack:**
- **Frontend**: React 18 + Vite + Tailwind CSS
- **AI**: Google Gemini API (currently mocked for development)
- **State Management**: React Context API (LessonContext)
- **Routing**: React Router v7
- **UI Libraries**: Framer Motion, Lucide React
- **File Processing**: PDF.js, react-dropzone
- **Face-Swap Service**: Python/Flask microservice (separate service)

## Development Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Face-Swap Service (`face-swap-service/`)
```bash
cd face-swap-service
pip install -r requirements.txt
python app.py        # Start service (http://localhost:5000)
```

### Development Workflow
1. Start frontend: `cd frontend && npm run dev`
2. Frontend runs on port 5173
3. For face-swap service (if needed): `cd face-swap-service && python app.py` (port 5000)

## Architecture

### Monorepo Structure
```
MyDscvr-Edu/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── pages/        # Route components (HomePage, StudyPage)
│   │   ├── components/   # Reusable UI components
│   │   │   ├── Avatar/    # Jeffrey avatar component
│   │   │   ├── Chat/      # ChatInterface component
│   │   │   ├── Layout/    # MainLayout component
│   │   │   ├── Lesson/    # LessonView component
│   │   │   └── Upload/    # Upload components (Modal, Dropzone, etc.)
│   │   ├── context/       # React Context (LessonContext)
│   │   ├── hooks/         # Custom hooks (useGemini, useLessonProcessor)
│   │   ├── services/      # API services (geminiService)
│   │   └── utils/         # Utility functions (fileProcessors, youtubeUtils)
│   ├── dist/              # Production build output
│   └── package.json
│
├── face-swap-service/     # Python Flask microservice
│   ├── app.py             # Flask application
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Docker configuration
│
├── backend/               # Backend (not yet implemented)
│
└── Docs/                  # Project documentation
```

### Application Flow

```
User Journey:
1. HomePage → Landing page with features and CTA
2. StudyPage → Main learning interface
   ├── Upload Modal → User uploads content (PDF/image/YouTube)
   ├── Processing → Content processed with Gemini AI
   ├── Lesson View → Structured lesson display (left side)
   └── Chat Interface → Interactive chat with Jeffrey (right side)
```

### State Management (LessonContext)

The `LessonContext` manages:
- **Current Lesson**: Active lesson being viewed
- **Lessons Array**: All uploaded lessons
- **Processing State**: Upload/processing progress
- **Error Handling**: Error states and messages

**Key Actions:**
- `startProcessing()` - Begin upload/processing
- `addLesson(lesson)` - Add new lesson to context
- `setCurrentLesson(lessonId)` - Switch active lesson
- `updateProgress(progress)` - Update processing progress
- `setProcessingStage(stage)` - Update processing stage

### Component Architecture

**Pages:**
- `HomePage.jsx` - Landing page with hero, features, and CTA
- `StudyPage.jsx` - Main study interface with lesson view and chat

**Components:**
- `LessonView` - Displays structured lesson content (summary, chapters, key points)
- `ChatInterface` - Interactive chat with Jeffrey (AI tutor)
- `UploadModal` - Main upload interface
- `FileDropzone` - Drag & drop file upload
- `YouTubeInput` - YouTube URL input and processing
- `ProcessingAnimation` - Loading states during processing
- `UploadButton` - Trigger button for upload modal
- `Jeffrey` - Avatar component for the AI tutor
- `MainLayout` - Layout wrapper for study page

### AI Integration (Google Gemini)

**Current Status:** Mocked for frontend development

**Service:** `frontend/src/services/geminiService.js`
- Currently uses mock implementations with delays
- Production implementation will use `@google/generative-ai` package
- Functions:
  - `processWithGemini(text, task)` - Main processing function
  - `generateFlashcards(text, count)` - Generate flashcards
  - `generateQuiz(text, count)` - Generate quiz questions

**Tasks Supported:**
- `analyze` - Analyze lesson content
- `study_guide` - Create study guide
- `question` - Answer questions about content

**Hooks:**
- `useGemini.js` - Hook for Gemini API interactions
- `useLessonProcessor.js` - Hook for processing uploaded content

### File Processing

**Supported Formats:**
- PDF files (via PDF.js)
- Image files (JPG, PNG, etc.)
- YouTube URLs (extract transcript/video info)

**Processing Pipeline:**
1. User uploads file/URL
2. File validated (type, size)
3. Content extracted (text from PDF, image OCR, YouTube transcript)
4. Content sent to Gemini for analysis
5. Structured lesson data created
6. Lesson added to context
7. User can interact with lesson via chat

**Utilities:**
- `fileProcessors.js` - File processing utilities
- `youtubeUtils.js` - YouTube URL parsing and validation

### Styling

**Design System:**
- **Colors**: Custom Tailwind colors (nanobanana-blue, nanobanana-yellow, nanobanana-green)
- **Typography**: Comic-style fonts for playful, kid-friendly design
- **Components**: Bold borders, shadows, rounded corners
- **Animations**: Framer Motion for smooth interactions

**Tailwind Config:**
- Custom color palette defined in `tailwind.config.js`
- PostCSS configured for processing

## Key Integration Points

### Upload Flow
1. User clicks upload button → `UploadModal` opens
2. User selects file/URL → `FileDropzone` or `YouTubeInput`
3. File validated → Processing starts
4. Content extracted → Sent to Gemini
5. Lesson created → Added to `LessonContext`
6. User can view lesson and chat with Jeffrey

### Chat Interface
- Context-aware: Jeffrey knows about current lesson
- Uses lesson content to provide relevant answers
- Maintains conversation history
- Can generate flashcards, quizzes, study guides

### Lesson Display
- Shows structured content: summary, chapters, key points, vocabulary
- Interactive elements for navigation
- Responsive layout (lesson on left, chat on right)

## Important Architectural Notes

### Environment Variables
Frontend requires:
- `VITE_API_URL` - Backend API URL (when backend is implemented)
- `VITE_GEMINI_API_KEY` - Google Gemini API key (for production)

### Current Implementation Status
- ✅ Frontend UI components
- ✅ Upload flow (file/YouTube)
- ✅ Lesson context management
- ✅ Chat interface UI
- ✅ Lesson view display
- ⏳ Gemini API integration (mocked, needs production implementation)
- ⏳ Backend API (not yet implemented)
- ⏳ User authentication (not yet implemented)
- ⏳ Database/storage (not yet implemented)

### Mock vs Production

**Current (Development):**
- Gemini API calls are mocked with delays
- No backend API
- All state managed in frontend context
- No persistence (lessons lost on refresh)

**Production (Future):**
- Real Gemini API integration
- Backend API for processing
- Database for lesson persistence
- User authentication
- File storage (Cloudflare R2)

## Cloudflare R2 Storage

**CDN URL:** `https://cdn.mydscvr.ai`

**Buckets:**
- **mydscvr-eduk6-uploads** (`/uploads/`): Stores files uploaded by parents/students (PDFs, lesson images, profile avatars)
- **mydscvr-eduk6-ai-content** (`/ai/`): Stores AI-generated content from Gemini (images, videos, audio for lessons)
- **mydscvr-eduk6-static** (`/static/`): Stores app assets like mascot images, badges, sounds, and UI graphics

**Backend Storage Service:** `backend/src/services/storageService.ts`
- Presigned URL generation for direct uploads
- COPPA-compliant family/child data hierarchy
- Path structure: `families/{familyId}/{childId}/lessons/{lessonId}/`

## Development Guidelines

### Adding New Components
1. Create component in appropriate directory (`components/`)
2. Follow existing styling patterns (Tailwind + custom colors)
3. Use Framer Motion for animations
4. Ensure responsive design (mobile-friendly)

### Adding New Features
1. Update `LessonContext` if state management needed
2. Add to appropriate service/hook
3. Update UI components as needed
4. Test upload flow if file-related

### File Upload
- Use `react-dropzone` for drag & drop
- Validate file types and sizes
- Show processing animation during upload
- Handle errors gracefully

### Chat Interface
- Maintain conversation context
- Reference current lesson when answering
- Use Jeffrey avatar for visual consistency
- Support markdown formatting in responses

## Deployment

### Frontend
- **Platform**: Cloudflare Pages or Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Environment Variables**: Set in deployment platform

### Face-Swap Service
- **Platform**: Railway or similar
- **Docker**: Use provided Dockerfile
- **Port**: 5000 (or set via PORT env var)

## Reference Documentation

For detailed information, see:
- `Docs/UPLOAD_FLOW_IMPLEMENTATION_PLAN.md` - Complete upload flow documentation
- `Docs/JEFFREY_AI_ASSISTANT.md` - Jeffrey AI assistant details
- `Docs/PROJECT_OVERVIEW.md` - Project overview (may reference other projects)
- `frontend/UPLOAD_FLOW_IMPLEMENTATION_PLAN.md` - Frontend-specific upload flow

## Common Patterns

### Using LessonContext
```javascript
import { useLessonContext } from '../context/LessonContext';

function MyComponent() {
    const { currentLesson, addLesson, startProcessing } = useLessonContext();
    // Use context values and actions
}
```

### File Upload Pattern
```javascript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
        // Process files
    },
    accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.png']
    }
});
```

### Chat Message Format
```javascript
{
    id: 'msg-123',
    role: 'user' | 'assistant',
    content: 'Message text',
    timestamp: '2024-01-01T00:00:00Z'
}
```

## Notes

- The face-swap service appears to be from a different project (HeadShotHub) but is included in this repo
- Backend directory exists but is empty - backend implementation is future work
- Current focus is on frontend development with mocked AI services
- Production deployment will require backend API and database setup
