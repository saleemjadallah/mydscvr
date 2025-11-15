import { Router } from 'express';
import { db } from '../../db';
import { chatSessions } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
  askJeffrey,
  askJeffreyQuick,
  getSuggestedQuestions,
  JeffreyMessage,
} from '../../services/jeffrey';

const router = Router();

// Middleware to require authentication (optional for Jeffrey - can be used by guests)
const optionalAuth = (_req: any, _res: any, next: any) => {
  // Jeffrey can be used by both authenticated and guest users
  next();
};

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// POST /api/visadocs/chat - Send a message to Jeffrey
router.post('/', optionalAuth, async (req: any, res: any) => {
  try {
    const {
      message,
      sessionId,
      visaContext,
      useSearch = true,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Get conversation history if sessionId provided
    let conversationHistory: JeffreyMessage[] = [];
    let dbSessionId = sessionId;

    if (sessionId && req.isAuthenticated() && req.user) {
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.id, parseInt(sessionId)),
            eq(chatSessions.userId, req.user.id)
          )
        );

      if (session && session.messages) {
        conversationHistory = session.messages as JeffreyMessage[];
      }
    }

    // Ask Jeffrey
    const { response, sources } = await askJeffrey(message, {
      visaContext,
      conversationHistory,
      useSearch,
    });

    // Create message objects
    const userMessage: JeffreyMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    const assistantMessage: JeffreyMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      sources,
    };

    // Update or create session if user is authenticated
    if (req.isAuthenticated() && req.user) {
      const updatedMessages = [...conversationHistory, userMessage, assistantMessage];

      if (dbSessionId) {
        // Update existing session
        await db
          .update(chatSessions)
          .set({
            messages: updatedMessages as any,
            updatedAt: new Date(),
          })
          .where(eq(chatSessions.id, parseInt(dbSessionId)));
      } else {
        // Create new session
        const [newSession] = await db
          .insert(chatSessions)
          .values({
            userId: req.user.id,
            packageId: visaContext?.packageId || null,
            visaContext: visaContext ? {
              country: visaContext.destinationCountry,
              visaType: visaContext.visaType,
            } : null,
            messages: updatedMessages as any,
          })
          .returning();

        dbSessionId = newSession.id;
      }
    }

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        sessionId: dbSessionId,
        conversationLength: conversationHistory.length + 2,
      },
    });
  } catch (error) {
    console.error('Error in Jeffrey chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
    });
  }
});

// POST /api/visadocs/chat/quick - Quick question (no session tracking)
router.post('/quick', optionalAuth, async (req, res) => {
  try {
    const { question, visaType, destinationCountry } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    const response = await askJeffreyQuick(question, visaType, destinationCountry);

    res.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error('Error in Jeffrey quick chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process question',
    });
  }
});

// GET /api/visadocs/chat/suggestions - Get suggested questions
router.get('/suggestions', optionalAuth, (req, res) => {
  const { stage, visaType, destinationCountry } = req.query;

  const suggestions = getSuggestedQuestions(
    stage as any,
    visaType as string,
    destinationCountry as string
  );

  res.json({
    success: true,
    data: {
      suggestions,
    },
  });
});

// GET /api/visadocs/chat/sessions - Get user's chat sessions (authenticated only)
router.get('/sessions', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    const sessions = await db
      .select({
        id: chatSessions.id,
        packageId: chatSessions.packageId,
        visaContext: chatSessions.visaContext,
        messageCount: chatSessions.messages,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
      })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));

    // Transform to include message count
    const sessionsWithCount = sessions.map(session => ({
      ...session,
      messageCount: Array.isArray(session.messageCount)
        ? (session.messageCount as any[]).length
        : 0,
    }));

    res.json({
      success: true,
      data: sessionsWithCount,
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat sessions',
    });
  }
});

// GET /api/visadocs/chat/sessions/:id - Get single chat session
router.get('/sessions/:id', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID',
      });
    }

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, userId)
        )
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat session',
    });
  }
});

// DELETE /api/visadocs/chat/sessions/:id - Delete chat session
router.delete('/sessions/:id', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID',
      });
    }

    // Verify ownership
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, userId)
        )
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    // Delete session
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.id, sessionId));

    res.json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat session',
    });
  }
});

// POST /api/visadocs/chat/sessions/:id/clear - Clear session messages (keep session)
router.post('/sessions/:id/clear', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID',
      });
    }

    // Verify ownership
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, userId)
        )
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    // Clear messages
    await db
      .update(chatSessions)
      .set({
        messages: [] as any,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId));

    res.json({
      success: true,
      message: 'Chat session cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat session',
    });
  }
});

export default router;
