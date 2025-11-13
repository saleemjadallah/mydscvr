import dotenv from 'dotenv';
// Load environment variables first, before any other imports that might use them
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import { setupAuth, requireAuth } from './lib/auth.js';
import batchesRouter from './routes/batches.js';
import { ensureTables } from './db/ensureTables.js';
import { uploadBuffer, optimizeUploadedImage } from './lib/storage.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure database tables exist on startup
console.log('Checking database tables...');
await ensureTables();
console.log('Database tables ready.');

// Parse allowed origins from environment (comma-separated)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

// CORS configuration (must be BEFORE body parsing for Stripe webhooks)
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  })
);

// Cookie parsing middleware (must be before session)
app.use(cookieParser());

// Body parsing middleware
// IMPORTANT: Preserve raw body for Stripe webhook signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf; // Save raw buffer for Stripe
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Setup authentication (session + passport + routes)
await setupAuth(app);

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'HeadShotHub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
  });
});

// Debug endpoint to check session configuration
app.get('/api/debug/session', (req: any, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      host: req.headers.host,
    },
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    sessionConfig: {
      secure: process.env.SESSION_COOKIE_SECURE,
      sameSite: process.env.SESSION_COOKIE_SAMESITE,
      domain: process.env.SESSION_COOKIE_DOMAIN,
    }
  });
});

// Test session creation
app.post('/api/debug/test-session', (req: any, res) => {
  req.session.testValue = 'session-test-' + Date.now();
  req.session.save((err: any) => {
    if (err) {
      console.error('[Session Test] Save error:', err);
      return res.status(500).json({
        error: 'Session save failed',
        details: err.message
      });
    }
    res.json({
      message: 'Session created',
      sessionID: req.sessionID,
      testValue: req.session.testValue,
      cookie: req.session.cookie
    });
  });
});

// Protected route example
app.get('/api/user/profile', requireAuth, (req, res) => {
  res.json(req.user);
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 20,
    fileSize: 15 * 1024 * 1024, // 15MB per photo
  },
});

// Direct upload endpoint - simpler implementation
app.post('/api/upload', requireAuth, upload.array('photos', 20), async (req: any, res) => {
  try {
    const files = (req.files || []) as Express.Multer.File[];

    if (!files.length) {
      return res.status(400).json({ success: false, error: 'No photos uploaded' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const uploadPrefix = `session-${Date.now()}-${crypto.randomUUID()}`;
    const uploadedUrls: string[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ success: false, error: 'Only image uploads are allowed' });
      }

      // Optimize image
      const processedBuffer = await optimizeUploadedImage(file.buffer);

      // Upload to R2
      const key = `uploads/${userId}/${uploadPrefix}/${index}.jpg`;
      const url = await uploadBuffer(processedBuffer, key, 'image/jpeg');
      uploadedUrls.push(url);
    }

    return res.json({ success: true, data: uploadedUrls });
  } catch (error) {
    console.error('[Upload] Failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload photos' });
  }
});

// Batch routes (keeping for backward compatibility)
app.use('/api/batches', batchesRouter);

// Stripe checkout routes (TODO - implement Stripe integration)
app.post('/api/checkout/create-session', requireAuth, async (_req, res) => {
  res.json({ message: 'Create checkout session - TODO' });
});

// Stripe webhook (TODO - implement webhook handler)
// NOTE: This must come BEFORE other routes to access raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (_req, res) => {
  res.json({ received: true });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ HeadShotHub API running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔐 Session store: PostgreSQL`);
});
