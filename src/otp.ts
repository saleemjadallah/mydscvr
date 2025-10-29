import crypto from "node:crypto";
import { storage } from "./storage.js";
import { sendOtpEmail } from "./mail.js";

const OTP_LENGTH = 6;
const DEFAULT_EXPIRY_MINUTES = 10;

function generateNumericOtp(length: number) {
  const max = 10 ** length;
  const code = crypto.randomInt(0, max).toString().padStart(length, "0");
  return code;
}

function getExpiryDate() {
  const minutes =
    Number.parseInt(process.env.OTP_CODE_EXPIRY_MINUTES ?? "", 10) ||
    DEFAULT_EXPIRY_MINUTES;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  return expiresAt;
}

export async function requestLoginOtp(email: string) {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    // Avoid leaking which emails exist; pretend we sent the OTP.
    return;
  }

  const code = generateNumericOtp(OTP_LENGTH);
  const expiresAt = getExpiryDate();

  await storage.deleteOtpCodesForUser(user.id, "login");
  await storage.createOtpCode({
    userId: user.id,
    purpose: "login",
    code,
    expiresAt,
  });

  await sendOtpEmail({
    email: user.email!,
    name: user.firstName,
    code,
  });
}

export async function verifyLoginOtp(email: string, code: string) {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return null;
  }

  const otp = await storage.findOtpCode(user.id, "login", code);
  if (!otp) {
    return null;
  }

  if (otp.expiresAt < new Date()) {
    await storage.deleteOtpCodesForUser(user.id, "login");
    return null;
  }

  await storage.deleteOtpCodesForUser(user.id, "login");
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function requestRegistrationOtp(email: string, userId: string) {
  const code = generateNumericOtp(OTP_LENGTH);
  const expiresAt = getExpiryDate();

  await storage.deleteOtpCodesForUser(userId, "registration");
  await storage.createOtpCode({
    userId,
    purpose: "registration",
    code,
    expiresAt,
  });

  await sendOtpEmail({
    email,
    name: null,
    code,
  });
}

export async function verifyRegistrationOtp(email: string, code: string) {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return null;
  }

  const otp = await storage.findOtpCode(user.id, "registration", code);
  if (!otp) {
    return null;
  }

  if (otp.expiresAt < new Date()) {
    await storage.deleteOtpCodesForUser(user.id, "registration");
    return null;
  }

  await storage.deleteOtpCodesForUser(user.id, "registration");
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
