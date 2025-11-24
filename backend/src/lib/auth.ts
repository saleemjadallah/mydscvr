import { Express, RequestHandler } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import connectPg from 'connect-pg-simple';
import { z } from 'zod';
import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { pool } from '../db/index.js';
import { verifyFirebaseToken, getFirebaseUser } from './firebase-admin.js';
import { sendWelcomeEmail } from './mail.js';
import {
  requestLoginOtp,
  verifyLoginOtp,
  requestRegistrationOtp,
  verifyRegistrationOtp,
} from './otp.js';

/**
 * Check if environment is production-like
 */
const isProductionLike =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

/**
 * Get session configuration with PostgreSQL store
 */
export function getSession() {
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool: pool,
    createTableIfMissing: true,
    ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    tableName: 'sessions',
    errorLog: (error: any) => {
      console.error('[Session Store Error]:', error);
    },
  });

  // Cookie configuration for cross-origin requests
  const cookieSecure = process.env.SESSION_COOKIE_SECURE === 'true' || isProductionLike;
  const cookieSameSite = process.env.SESSION_COOKIE_SAMESITE || (cookieSecure ? 'none' : 'lax');
  const cookieDomain = process.env.SESSION_COOKIE_DOMAIN || undefined;

  console.log(`[Session] Config - secure: ${cookieSecure}, sameSite: ${cookieSameSite}, domain: ${cookieDomain || 'not set'}`);

  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: cookieSecure, // true in production
      sameSite: cookieSameSite as any, // "none" for cross-origin
      domain: cookieDomain, // undefined for cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
    name: 'headshothub.sid', // Custom session cookie name
  });
}

/**
 * Setup Passport.js authentication strategies
 */
export function setupPassport() {
  // Local strategy for email/password
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const [user] = await db.select().from(users).where(eq(users.email, email));

          if (!user || !user.passwordHash) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Return user without sensitive fields
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          console.error('[Auth] Local strategy error:', error);
          return done(error);
        }
      }
    )
  );

  // Serialize user ID to session
  passport.serializeUser((user: any, cb) => {
    cb(null, user.id);
  });

  // Deserialize user from database
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));

      if (!user) {
        return cb(null, false);
      }

      // Return user without sensitive fields
      const { passwordHash, ...userWithoutPassword } = user;
      cb(null, userWithoutPassword);
    } catch (error) {
      console.error('[Auth] Deserialize error:', error);
      cb(error);
    }
  });
}

/**
 * Setup authentication routes and middleware
 */
export async function setupAuth(app: Express) {
  // Setup session
  app.use(getSession());

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup passport strategies
  setupPassport();

  // Validation schemas
  const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
  });

  const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  });

  const otpRequestSchema = z.object({
    email: z.string().email('Invalid email address'),
  });

  const otpVerifySchema = z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  });

  const googleAuthSchema = z.object({
    idToken: z.string().min(1, 'ID token is required'),
  });

  /**
   * POST /api/auth/register
   * Register a new user with email/password
   */
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body);

      // Check if user exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          firstName,
          lastName: lastName || '',
          authProvider: 'email',
        })
        .returning();

      console.log(`[Auth] User registered: ${email}`);

      // Send OTP for verification
      await requestRegistrationOtp(user.id, email, firstName);

      // Return user ID for verification step
      res.json({
        message: 'Registration successful. Please check your email for verification code.',
        userId: user.id,
        email: user.email,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message ?? 'Invalid request',
        });
      }
      console.error('[Auth] Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  /**
   * POST /api/auth/verify-registration
   * Verify email with OTP code after registration
   */
  app.post('/api/auth/verify-registration', async (req, res) => {
    try {
      const { email, code } = otpVerifySchema.parse(req.body);

      const user = await verifyRegistrationOtp(email, code);

      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired verification code' });
      }

      // Log user in
      req.login(user, async (err) => {
        if (err) {
          console.error('[Auth] Login after verification error:', err);
          return res.status(500).json({ error: 'Login failed after verification' });
        }

        // Save session explicitly
        req.session.save(async (saveErr) => {
          if (saveErr) {
            console.error('[Auth] Session save error:', saveErr);
          }

          // Send welcome email
          try {
            await sendWelcomeEmail(user.email, user.firstName);
          } catch (emailError) {
            console.error('[Auth] Welcome email error:', emailError);
          }

          console.log(`[Auth] User verified and logged in: ${email}`);
          res.json(user);
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message ?? 'Invalid request',
        });
      }
      console.error('[Auth] Verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email/password
   */
  app.post('/api/auth/login', (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message ?? 'Invalid request',
        });
      }
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('[Auth] Login error:', err);
        return res.status(500).json({ error: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid email or password' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('[Auth] Login session error:', loginErr);
          return res.status(500).json({ error: 'Login failed' });
        }

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[Auth] Session save error:', saveErr);
            return res.status(500).json({ error: 'Session save failed' });
          }

          console.log(`[Auth] User logged in: ${user.email}, sessionID: ${req.sessionID}`);
          res.json(user);
        });
      });
    })(req, res, next);
  });

  /**
   * POST /api/auth/request-otp
   * Request OTP for passwordless login
   */
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const { email } = otpRequestSchema.parse(req.body);

      await requestLoginOtp(email);

      // Always return success to avoid email enumeration
      res.json({
        message: 'If that email is registered, a login code has been sent.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message ?? 'Invalid request',
        });
      }
      console.error('[Auth] OTP request error:', error);
      res.status(500).json({ error: 'Failed to send login code' });
    }
  });

  /**
   * POST /api/auth/login-otp
   * Login with OTP code
   */
  app.post('/api/auth/login-otp', async (req, res) => {
    try {
      const { email, code } = otpVerifySchema.parse(req.body);

      const user = await verifyLoginOtp(email, code);

      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired login code' });
      }

      // Log user in
      req.login(user, (err) => {
        if (err) {
          console.error('[Auth] Login after OTP error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[Auth] Session save error:', saveErr);
          }

          console.log(`[Auth] User logged in via OTP: ${email}`);
          res.json(user);
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message ?? 'Invalid request',
        });
      }
      console.error('[Auth] OTP login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  /**
   * POST /api/auth/google
   * Login/register with Google OAuth (Firebase)
   */
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken } = googleAuthSchema.parse(req.body);

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(idToken);
      const firebaseUser = await getFirebaseUser(decodedToken.uid);

      if (!firebaseUser.email) {
        return res.status(400).json({ error: 'Email not provided by Google' });
      }

      // Check if user exists
      let [user] = await db.select().from(users).where(eq(users.email, firebaseUser.email));

      if (!user) {
        // Create new user with Google provider
        const nameParts = firebaseUser.displayName?.split(' ') || [];

        const [newUser] = await db
          .insert(users)
          .values({
            email: firebaseUser.email,
            firstName: nameParts[0] || firebaseUser.email.split('@')[0],
            lastName: nameParts.slice(1).join(' ') || '',
            profileImageUrl: firebaseUser.photoURL || null,
            authProvider: 'google',
            firebaseUid: firebaseUser.uid,
            passwordHash: null, // No password for Google users
          })
          .returning();

        user = newUser;

        console.log(`[Auth] New Google user created: ${user.email}`);

        // Send welcome email
        try {
          await sendWelcomeEmail(user.email, user.firstName);
        } catch (emailError) {
          console.error('[Auth] Welcome email error:', emailError);
        }
      } else {
        // Update existing user's Firebase UID if not set
        if (!user.firebaseUid && user.authProvider === 'google') {
          await db
            .update(users)
            .set({ firebaseUid: firebaseUser.uid })
            .where(eq(users.id, user.id));

          user.firebaseUid = firebaseUser.uid;
        }

        console.log(`[Auth] Existing Google user logged in: ${user.email}`);
      }

      // Log user in
      const { passwordHash, ...userWithoutPassword } = user;

      req.login(userWithoutPassword, (err) => {
        if (err) {
          console.error('[Auth] Login after Google auth error:', err);
          return res.status(500).json({ error: 'Login failed' });
        }

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('[Auth] Session save error:', saveErr);
          }

          res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message ?? 'Invalid request',
        });
      }
      console.error('[Auth] Google auth error:', error);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  app.post('/api/auth/logout', (req, res) => {
    const userEmail = (req.user as any)?.email;

    req.logout((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }

      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('[Auth] Session destroy error:', destroyErr);
        }

        if (userEmail) {
          console.log(`[Auth] User logged out: ${userEmail}`);
        }

        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  /**
   * GET /api/auth/me
   * Get current user
   */
  app.get('/api/auth/me', (req, res) => {
    const userEmail = (req.user as any)?.email || 'none';
    console.log(`[Auth] /api/auth/me - sessionID: ${req.sessionID}, user: ${userEmail}, authenticated: ${req.isAuthenticated()}`);

    if (!req.isAuthenticated()) {
      const sessionUser = (req.session as any)?.passport?.user;
      console.log(`[Auth] /api/auth/me returning 401 - session exists: ${!!req.session}, user in session: ${!!sessionUser}`);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(req.user);
  });

  console.log('[Auth] Authentication routes registered');
}

/**
 * Middleware to require authentication
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // Enhanced logging for debugging
  const userEmail = (req.user as any)?.email || 'none';
  console.log(`[Auth] Checking auth - path: ${req.path}, sessionID: ${req.sessionID}, user: ${userEmail}, authenticated: ${req.isAuthenticated()}`);

  if (req.isAuthenticated()) {
    return next();
  }

  console.warn(`[Auth] Unauthorized - path: ${req.path}, sessionID: ${req.sessionID}, cookies: ${JSON.stringify((req as any).cookies)}`);
  res.status(401).json({ error: 'Unauthorized' });
};

/**
 * Middleware to require authentication (alternative name for compatibility)
 */
export const requireAuth = isAuthenticated;
// @ts-nocheck
