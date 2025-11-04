import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";
import { storage } from "./storage.js";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "./mail.js";
import { requestLoginOtp, verifyLoginOtp, requestRegistrationOtp, verifyRegistrationOtp } from "./otp.js";
import { z } from "zod";
import { verifyFirebaseToken, getFirebaseUser } from "./firebase-admin.js";

const SALT_ROUNDS = 10;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool: pool,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  sessionStore.on("connect", () => {
    console.log("[Session] Connected to Postgres session store");
  });

  sessionStore.on("disconnect", () => {
    console.warn("[Session] Disconnected from Postgres session store");
  });

  sessionStore.on("error", (error: unknown) => {
    console.error("[Session] Session store error:", error);
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("Missing SESSION_SECRET environment variable for session management");
  }

  const normalized = (value?: string | null) => (value ?? "").toLowerCase();
  const envCandidates = [
    normalized(process.env.DEPLOYMENT_ENV),
    normalized(process.env.NODE_ENV),
    normalized(process.env.RAILWAY_ENVIRONMENT),
  ];

  const productionSignals = new Set(["production", "prod", "preview", "staging"]);
  const isProductionLike = envCandidates.some((value) => productionSignals.has(value));

  const cookieSecure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : isProductionLike;

  const sameSiteOverride = normalized(process.env.SESSION_COOKIE_SAMESITE);
  const cookieSameSite =
    sameSiteOverride === "none" || sameSiteOverride === "lax" || sameSiteOverride === "strict"
      ? (sameSiteOverride as "none" | "lax" | "strict")
      : cookieSecure
        ? "none"
        : "lax";

  const cookieDomain = process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined;

  // CRITICAL: For cross-origin requests, domain must be undefined
  if (cookieDomain) {
    console.warn(
      `[Session] SESSION_COOKIE_DOMAIN is set to '${cookieDomain}'. ` +
      `This will prevent cross-origin session sharing between frontend and backend. ` +
      `For mydscvr.ai frontend with Railway backend, leave SESSION_COOKIE_DOMAIN unset.`
    );
  }

  console.log(
    `[Session] secure=${cookieSecure} sameSite=${cookieSameSite}` +
      (cookieDomain ? ` domain=${cookieDomain}` : " domain=undefined (cross-origin compatible)") +
      ` envCandidates=${envCandidates.filter(Boolean).join(",") || "unknown"}`
  );

  if (!cookieSecure && cookieSameSite !== "lax") {
    console.warn("[Session] Non-secure cookies should use sameSite=lax for cross-site safety");
  }

  if (!cookieSecure) {
    console.warn(
      "[Session] Session cookies are not marked secure. Cross-site requests will fail on modern browsers. " +
        "Set SESSION_COOKIE_SECURE=true or ensure NODE_ENV/DEPLOYMENT_ENV indicate production."
    );
  }

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      domain: cookieDomain,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);

          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await bcrypt.compare(password, user.passwordHash);

          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Don't include password hash in session
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => {
    cb(null, user.id);
  });

  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`[Auth] Session references missing user ${id}, returning anonymous user`);
        return cb(null, false);
      }
      const { passwordHash, ...userWithoutPassword } = user;
      cb(null, userWithoutPassword);
    } catch (error) {
      cb(error);
    }
  });

  // Clear stale sessions referencing users that no longer exist
  app.use((req, _res, next) => {
    try {
      const sessionUserId =
        typeof req.session === "object" && req.session !== null
          ? (req.session as any)?.passport?.user
          : undefined;

      if (!req.user && sessionUserId) {
        console.warn(`[Auth] Destroying stale session for user ${sessionUserId}`);
        if (typeof req.session?.destroy === "function") {
          return req.session.destroy((err) => {
            if (err) {
              console.error("[Auth] Failed to destroy stale session:", err);
            }
            next();
          });
        }
      }
    } catch (error) {
      console.error("[Auth] Stale session cleanup error:", error);
    }
    next();
  });

  // Register route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
      });

      // Send registration OTP instead of auto-logging in
      try {
        await requestRegistrationOtp(user.email!, user.id);
      } catch (otpError) {
        console.error("Registration OTP error:", otpError);

        // Surface useful diagnostics in non-production environments
        const message =
          process.env.NODE_ENV === "production"
            ? "Failed to send verification email. Please try again later or contact support."
            : `Failed to send verification email: ${otpError instanceof Error ? otpError.message : "Unknown error"}`;

        return res.status(500).json({ message });
      }

      // Return success without logging in
      res.json({
        message: "Registration successful. Please check your email for verification code.",
        email: user.email
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  const otpRequestSchema = z.object({
    email: z.string().email(),
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = otpRequestSchema.parse(req.body);
      await requestLoginOtp(email);
      res.json({ message: "If that email is registered, a login code has been sent." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request" });
      }
      console.error("OTP request error:", error);
      res.status(500).json({ message: "Failed to send login code" });
    }
  });

  const otpLoginSchema = z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/, "Invalid code"),
  });

  app.post("/api/auth/login-otp", (req, res, next) => {
    try {
      const { email, code } = otpLoginSchema.parse(req.body);

      verifyLoginOtp(email, code)
        .then((user) => {
          if (!user) {
            return res.status(401).json({ message: "Invalid or expired login code" });
          }

          req.login(user, (err) => {
            if (err) {
              console.error("OTP login session error:", err);
              return res.status(500).json({ message: "Login failed" });
            }
            
            // Explicitly save the session
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("[Auth] OTP session save failed:", saveErr);
                return res.status(500).json({ message: "Session save failed" });
              }
              
              res.json(user);
            });
          });
        })
        .catch((error) => {
          console.error("OTP login error:", error);
          res.status(500).json({ message: "Login failed" });
        });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request" });
      }
      return next(error);
    }
  });

  // Verify registration OTP
  app.post("/api/auth/verify-registration", (req, res, next) => {
    try {
      const { email, code } = otpLoginSchema.parse(req.body);

      verifyRegistrationOtp(email, code)
        .then((user) => {
          if (!user) {
            return res.status(401).json({ message: "Invalid or expired verification code" });
          }

          // Log the user in after successful verification
          req.login(user, (err) => {
            if (err) {
              console.error("Registration verification session error:", err);
              return res.status(500).json({ message: "Verification succeeded but login failed" });
            }

            // Explicitly save the session
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("[Auth] Registration session save failed:", saveErr);
                return res.status(500).json({ message: "Session save failed" });
              }
              
              // Send welcome email after successful verification
              void sendWelcomeEmail({
                email: user.email!,
                name: user.firstName,
              }).catch((error) => {
                console.error("Failed to send welcome email:", error);
              });

              res.json(user);
            });
          });
        })
        .catch((error) => {
          console.error("Registration verification error:", error);
          res.status(500).json({ message: "Verification failed" });
        });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request" });
      }
      return next(error);
    }
  });

  // Login route
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Explicitly save the session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[Auth] Session save failed:", saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          
          console.log(`[Auth] User ${user.id} logged in successfully`);
          res.json(user);
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Google Sign-In route
  const googleAuthSchema = z.object({
    idToken: z.string().min(1, "ID token is required"),
  });

  app.post("/api/auth/google", async (req, res, next) => {
    try {
      const { idToken } = googleAuthSchema.parse(req.body);

      // Verify the Firebase ID token
      const decodedToken = await verifyFirebaseToken(idToken);
      const firebaseUser = await getFirebaseUser(decodedToken.uid);

      if (!firebaseUser.email) {
        return res.status(400).json({ message: "Email not provided by Google account" });
      }

      // Check if user exists in our database
      let user = await storage.getUserByEmail(firebaseUser.email);

      if (!user) {
        // Extract first and last name from display name
        const nameParts = (firebaseUser.displayName || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create new user with Google provider info
        user = await storage.createUser({
          email: firebaseUser.email,
          firstName,
          lastName,
          profileImageUrl: firebaseUser.photoURL || undefined,
          authProvider: "google",
          firebaseUid: firebaseUser.uid,
          passwordHash: null, // No password for Google users
        });

        // Send welcome email for new users
        if (user.email) {
          try {
            await sendWelcomeEmail(user.email, user.firstName || "");
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
          }
        }
      } else if (firebaseUser.photoURL && !user.profileImageUrl) {
        // Update profile image if user doesn't have one
        await storage.updateUser(user.id, {
          profileImageUrl: firebaseUser.photoURL,
        });
        user.profileImageUrl = firebaseUser.photoURL;
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Google Sign-In session error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        // Explicitly save the session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[Auth] Google Sign-In session save failed:", saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }

          console.log(`[Auth] User ${user.id} logged in via Google successfully`);
          res.json(user);
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request" });
      }
      console.error("Google Sign-In error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Google Sign-In failed"
      });
    }
  });

  // Get current user route
  app.get("/api/auth/me", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Log unauthorized requests for debugging (can be removed in production)
  const userId = (req.user as any)?.id || 'none';
  console.warn(`[Auth] Unauthorized request - path: ${req.path}, sessionID: ${req.sessionID}, user: ${userId}`);
  
  res.status(401).json({ message: "Unauthorized" });
};
