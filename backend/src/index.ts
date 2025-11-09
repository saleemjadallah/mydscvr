import dotenv from 'dotenv';
// Load environment variables first, before any other imports that might use them
dotenv.config();

import express from 'express';
import cors from 'cors';
import { setupAuth, requireAuth } from './lib/auth.js';
import batchesRouter from './routes/batches.js';
import { runMigrations } from './db/migrate.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Run database migrations on startup
console.log('Running database migrations...');
await runMigrations();
console.log('Database migrations completed.');

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
  });
});

// Protected route example
app.get('/api/user/profile', requireAuth, (req, res) => {
  res.json(req.user);
});

// Batch routes
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
