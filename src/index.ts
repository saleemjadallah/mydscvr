import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerRoutes } from "./routes.js";

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const defaultAllowedOrigins = [
  "https://mydscvr.ai",
  "https://www.mydscvr.ai",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins;

const normalizeOrigin = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/\/$/, "");

const allowedOrigins = configuredOrigins.map(normalizeOrigin);

console.log("[CORS] Allowed origins:", allowedOrigins);

// Use a simpler CORS configuration that explicitly lists origins
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('[CORS] No origin header - allowing request');
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    console.log(`[CORS] Request from origin: ${origin} (normalized: ${normalizedOrigin})`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);

    // Check if the origin is allowed
    if (allowedOrigins.includes(normalizedOrigin)) {
      console.log(`[CORS] ✓ Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      console.warn(`[CORS] ✗ Origin ${origin} is NOT allowed`);
      // For debugging, temporarily allow but log warning
      callback(null, true);
      console.warn(`[CORS] WARNING: Temporarily allowing ${origin} for debugging`);
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cookie',
  exposedHeaders: 'Set-Cookie',
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors());

// Fallback CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
    }
  }
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Parse JSON with raw body for Stripe webhooks
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS diagnostic endpoint (public, no auth required)
app.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin || 'No origin header';
  const normalizedOrigin = origin !== 'No origin header' ? normalizeOrigin(origin) : 'N/A';

  // Manually set CORS headers for this endpoint
  if (origin !== 'No origin header') {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    request: {
      origin: origin,
      normalizedOrigin: normalizedOrigin,
      headers: req.headers
    },
    server: {
      allowedOrigins: allowedOrigins,
      configuredFromEnv: !!process.env.ALLOWED_ORIGINS,
      envValue: process.env.ALLOWED_ORIGINS || 'Not set',
      isOriginAllowed: origin !== 'No origin header' && allowedOrigins.includes(normalizedOrigin),
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || 5000
    }
  });
});

// Simple ping endpoint for testing
app.get('/api/ping', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.json({
    pong: true,
    timestamp: new Date().toISOString(),
    origin: origin || 'No origin'
  });
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`Backend server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();
