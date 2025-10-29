import assert from "node:assert";

const {
  ZEPTO_MAIL_BASE_URL,
  ZEPTO_MAIL_API_TOKEN,
  ZEPTO_MAIL_FROM_EMAIL,
  ZEPTO_MAIL_FROM_NAME,
  ZEPTO_MAIL_BOUNCE_EMAIL,
} = process.env;

function ensureMailConfig() {
  assert(ZEPTO_MAIL_API_TOKEN, "ZEPTO_MAIL_API_TOKEN must be set");
  assert(ZEPTO_MAIL_FROM_EMAIL, "ZEPTO_MAIL_FROM_EMAIL must be set");
}

interface Recipient {
  address: string;
  name?: string | null;
}

interface EmailOptions {
  to: Recipient[];
  subject: string;
  htmlBody: string;
  textBody: string;
}

const DEFAULT_BASE_URL = "https://api.zeptomail.com";

async function sendEmail(options: EmailOptions) {
  ensureMailConfig();

  const baseUrl = (ZEPTO_MAIL_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = `${baseUrl}/v1.0/email`;

  const payload = {
    bounce_address: ZEPTO_MAIL_BOUNCE_EMAIL || ZEPTO_MAIL_FROM_EMAIL,
    from: {
      address: ZEPTO_MAIL_FROM_EMAIL,
      name: ZEPTO_MAIL_FROM_NAME || "MyDscvr Food",
    },
    to: options.to.map((recipient) => ({
      email_address: {
        address: recipient.address,
        name: recipient.name ?? undefined,
      },
    })),
    subject: options.subject,
    htmlbody: options.htmlBody,
    textbody: options.textBody,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Zoho-enczapikey ${ZEPTO_MAIL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to send Zepto Mail email: ${response.status} ${response.statusText} :: ${errorBody}`,
    );
  }
}

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const displayName = name?.trim() || "there";

  const subject = "Welcome to MyDscvr Food!";
  const htmlBody = `
    <p>Hi ${displayName},</p>
    <p>Welcome to MyDscvr Food – we&apos;re excited to have you.</p>
    <p>You can now start generating beautiful dish imagery and managing your menu in minutes.</p>
    <p>If you ever need help, just reply to this email and our team will get back to you.</p>
    <p>Cheers,<br/>The MyDscvr Food Team</p>
  `;
  const textBody = [
    `Hi ${displayName},`,
    "",
    "Welcome to MyDscvr Food – we're excited to have you.",
    "You can now start generating beautiful dish imagery and managing your menu in minutes.",
    "If you ever need help, just reply to this email and our team will get back to you.",
    "",
    "Cheers,",
    "The MyDscvr Food Team",
  ].join("\n");

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}

export async function sendOtpEmail({
  email,
  name,
  code,
}: {
  email: string;
  name?: string | null;
  code: string;
}) {
  const subject = "Your MyDscvr Food login code";
  const htmlBody = `
    <p>Hi ${name?.trim() || "there"},</p>
    <p>Your one-time login code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 6px;">${code}</p>
    <p>This code will expire in ${process.env.OTP_CODE_EXPIRY_MINUTES || 10} minutes.</p>
    <p>If you did not request this code, you can safely ignore this email.</p>
    <p>— The MyDscvr Food Team</p>
  `;

  const textBody = [
    `Hi ${name?.trim() || "there"},`,
    "",
    `Your one-time login code is: ${code}`,
    "",
    `This code will expire in ${process.env.OTP_CODE_EXPIRY_MINUTES || 10} minutes.`,
    "",
    "If you did not request this code, you can safely ignore this email.",
    "",
    "— The MyDscvr Food Team",
  ].join("\n");

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}
