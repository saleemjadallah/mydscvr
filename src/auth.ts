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

const SALT_ROUNDS = 10;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool: pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
        return cb(new Error("User not found"));
      }
      const { passwordHash, ...userWithoutPassword } = user;
      cb(null, userWithoutPassword);
    } catch (error) {
      cb(error);
    }
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
            res.json(user);
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

            // Send welcome email after successful verification
            void sendWelcomeEmail({
              email: user.email!,
              name: user.firstName,
            }).catch((error) => {
              console.error("Failed to send welcome email:", error);
            });

            res.json(user);
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
        res.json(user);
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
  res.status(401).json({ message: "Unauthorized" });
};
