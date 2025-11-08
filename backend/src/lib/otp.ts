import crypto from 'crypto';
import { db } from '../db/index.js';
import { otpCodes, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { sendOtpEmail } from './mail.js';

/**
 * Generate a random numeric OTP code
 * @param length - Length of the code (default: 6)
 * @returns Numeric OTP string
 */
function generateNumericOtp(length: number = 6): string {
  const max = 10 ** length;
  const code = crypto.randomInt(0, max).toString();
  return code.padStart(length, '0');
}

/**
 * Get OTP expiry date based on environment configuration
 * @returns Expiry timestamp
 */
function getExpiryDate(): Date {
  const minutes = Number.parseInt(process.env.OTP_CODE_EXPIRY_MINUTES ?? '', 10) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Request a login OTP for an existing user
 * @param email - User email address
 */
export async function requestLoginOtp(email: string): Promise<void> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Don't leak which emails exist
  if (!user) {
    console.log(`[OTP] Login OTP requested for non-existent email: ${email}`);
    return;
  }

  // Check if user uses password auth (not Google OAuth)
  if (user.authProvider !== 'email') {
    console.log(`[OTP] Cannot send login OTP to ${email} - uses ${user.authProvider} auth`);
    return;
  }

  // Generate OTP code
  const code = generateNumericOtp(6);
  const expiresAt = getExpiryDate();

  // Delete any existing login OTP codes for this user
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.purpose, 'login')
      )
    );

  // Create new OTP code
  await db.insert(otpCodes).values({
    userId: user.id,
    purpose: 'login',
    code,
    expiresAt,
  });

  // Send OTP email
  await sendOtpEmail({
    email: user.email,
    name: user.firstName,
    code,
  });

  console.log(`[OTP] Login OTP sent to ${email}`);
}

/**
 * Verify a login OTP code
 * @param email - User email address
 * @param code - OTP code to verify
 * @returns User object if valid, null if invalid
 */
export async function verifyLoginOtp(email: string, code: string): Promise<any> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log(`[OTP] Login OTP verification failed - user not found: ${email}`);
    return null;
  }

  // Find OTP code
  const [otpRecord] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.purpose, 'login'),
        eq(otpCodes.code, code)
      )
    )
    .limit(1);

  // Check if OTP exists and is not expired
  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    console.log(`[OTP] Login OTP verification failed - invalid or expired: ${email}`);

    // Clean up expired codes
    await db
      .delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.purpose, 'login')
        )
      );

    return null;
  }

  // OTP is valid - delete it
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.purpose, 'login')
      )
    );

  console.log(`[OTP] Login OTP verified successfully for ${email}`);

  // Return user without sensitive fields
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Request a registration OTP for a new user
 * @param userId - User ID
 * @param email - User email address
 * @param name - User first name
 */
export async function requestRegistrationOtp(userId: string, email: string, name: string): Promise<void> {
  // Generate OTP code
  const code = generateNumericOtp(6);
  const expiresAt = getExpiryDate();

  // Delete any existing registration OTP codes for this user
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.purpose, 'registration')
      )
    );

  // Create new OTP code
  await db.insert(otpCodes).values({
    userId,
    purpose: 'registration',
    code,
    expiresAt,
  });

  // Send OTP email
  await sendOtpEmail({
    email,
    name,
    code,
  });

  console.log(`[OTP] Registration OTP sent to ${email}`);
}

/**
 * Verify a registration OTP code
 * @param email - User email address
 * @param code - OTP code to verify
 * @returns User object if valid, null if invalid
 */
export async function verifyRegistrationOtp(email: string, code: string): Promise<any> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log(`[OTP] Registration OTP verification failed - user not found: ${email}`);
    return null;
  }

  // Find OTP code
  const [otpRecord] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.purpose, 'registration'),
        eq(otpCodes.code, code)
      )
    )
    .limit(1);

  // Check if OTP exists and is not expired
  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    console.log(`[OTP] Registration OTP verification failed - invalid or expired: ${email}`);

    // Clean up expired codes
    await db
      .delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, user.id),
          eq(otpCodes.purpose, 'registration')
        )
      );

    return null;
  }

  // OTP is valid - delete it
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.purpose, 'registration')
      )
    );

  console.log(`[OTP] Registration OTP verified successfully for ${email}`);

  // Return user without sensitive fields
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Delete all OTP codes for a user
 * @param userId - User ID
 * @param purpose - Optional purpose filter
 */
export async function deleteOtpCodesForUser(userId: string, purpose?: 'login' | 'registration'): Promise<void> {
  if (purpose) {
    await db
      .delete(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.purpose, purpose)
        )
      );
  } else {
    await db
      .delete(otpCodes)
      .where(eq(otpCodes.userId, userId));
  }
}

/**
 * Clean up expired OTP codes (should be run periodically)
 */
export async function cleanupExpiredOtpCodes(): Promise<void> {
  const now = new Date();

  const result = await db
    .delete(otpCodes)
    .where(eq(otpCodes.expiresAt, now));

  console.log(`[OTP] Cleaned up expired OTP codes`);
}
