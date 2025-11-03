import { Resend } from "resend";
import assert from "node:assert";

const resend = new Resend(process.env.RESEND_API_KEY);

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

function ensureMailConfig() {
  assert(process.env.RESEND_API_KEY, "RESEND_API_KEY must be set");
  assert(process.env.RESEND_FROM_EMAIL, "RESEND_FROM_EMAIL must be set");
}

async function sendEmail(options: EmailOptions) {
  ensureMailConfig();

  const fromEmail = process.env.RESEND_FROM_EMAIL!;
  const firstRecipient = options.to[0]?.address || "unknown";

  console.log(`Sending email to ${firstRecipient} with subject: ${options.subject}`);

  // Using Resend's recommended destructured response pattern
  const { data, error } = await resend.emails.send({
    from: `MyDscvr Food <${fromEmail}>`,
    to: options.to.map((r) => r.address),
    subject: options.subject,
    html: options.htmlBody,
    text: options.textBody,
  });

  if (error) {
    console.error(`Resend error:`, error);
    throw new Error(`Failed to send email via Resend: ${JSON.stringify(error)}`);
  }

  console.log(`Email sent successfully to ${firstRecipient}. ID: ${data?.id}`);
  return data;
}

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const displayName = name?.trim() || "there";
  // Use R2-hosted logo for faster loading and reliability
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";

  const subject = "Welcome to MyDscvr Food!";
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MyDscvr Food</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); border-radius: 16px 16px 0 0;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 120px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">Welcome to MyDscvr Food!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">Welcome to <strong style="color: #FF8C42;">MyDscvr Food</strong> – we're excited to have you on board! 🎉</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">You can now start creating stunning dish imagery and managing your menu in minutes. Our AI-powered tools are ready to help you showcase your culinary creations beautifully.</p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #FFF5ED; border-left: 4px solid #FF8C42; border-radius: 8px;">
                    <p style="margin: 0; font-size: 15px; color: #2D3436;">
                      <strong style="color: #FF8C42;">Quick Tip:</strong> Start by uploading your first dish image and watch the magic happen!
                    </p>
                  </div>

                  <p style="margin: 0 0 20px; font-size: 16px;">If you ever need help, just reply to this email and our team will get back to you promptly.</p>

                  <p style="margin: 0 0 8px; font-size: 16px;">Cheers,</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    Made with care by <strong style="color: #FF8C42;">MyDscvr Food</strong>
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #8C9498;">
                    © ${new Date().getFullYear()} MyDscvr Food. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textBody = [
    `Hi ${displayName},`,
    "",
    "Welcome to MyDscvr Food – we're excited to have you on board!",
    "",
    "You can now start creating stunning dish imagery and managing your menu in minutes. Our AI-powered tools are ready to help you showcase your culinary creations beautifully.",
    "",
    "Quick Tip: Start by uploading your first dish image and watch the magic happen!",
    "",
    "If you ever need help, just reply to this email and our team will get back to you promptly.",
    "",
    "Cheers,",
    "The MyDscvr Food Team",
    "",
    `© ${new Date().getFullYear()} MyDscvr Food. All rights reserved.`,
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
  const displayName = name?.trim() || "there";
  // Use R2-hosted logo for faster loading and reliability
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";
  const expiryMinutes = process.env.OTP_CODE_EXPIRY_MINUTES || 10;

  const subject = "Your MyDscvr Food Login Code";
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Login Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 100px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #2D3436; letter-spacing: -0.5px;">Your Login Code</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 30px; font-size: 16px;">Here's your one-time login code to access your <strong style="color: #FF8C42;">MyDscvr Food</strong> account:</p>

                  <!-- OTP Code Box -->
                  <div style="margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%); border: 2px solid #FF8C42; border-radius: 12px; text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #636E72; text-transform: uppercase; letter-spacing: 1px;">Your Code</p>
                    <p style="margin: 0; font-size: 42px; font-weight: 800; color: #FF8C42; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                  </div>

                  <div style="margin: 30px 0; padding: 20px; background-color: #FFF5ED; border-left: 4px solid #FF8C42; border-radius: 8px;">
                    <p style="margin: 0; font-size: 15px; color: #2D3436;">
                      ⏱️ This code will expire in <strong style="color: #FF8C42;">${expiryMinutes} minutes</strong>.
                    </p>
                  </div>

                  <p style="margin: 0 0 20px; font-size: 14px; color: #636E72;">
                    If you didn't request this code, you can safely ignore this email. Your account remains secure.
                  </p>

                  <p style="margin: 30px 0 8px; font-size: 16px;">Best regards,</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    Secure login powered by <strong style="color: #FF8C42;">MyDscvr Food</strong>
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #8C9498;">
                    © ${new Date().getFullYear()} MyDscvr Food. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textBody = [
    `Hi ${displayName},`,
    "",
    "Here's your one-time login code to access your MyDscvr Food account:",
    "",
    `CODE: ${code}`,
    "",
    `This code will expire in ${expiryMinutes} minutes.`,
    "",
    "If you didn't request this code, you can safely ignore this email. Your account remains secure.",
    "",
    "Best regards,",
    "The MyDscvr Food Team",
    "",
    `© ${new Date().getFullYear()} MyDscvr Food. All rights reserved.`,
  ].join("\n");

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}
