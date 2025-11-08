import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRecipient {
  address: string;
  name?: string;
}

interface EmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Core email sending function using Resend
 */
export async function sendEmail(options: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured. Email not sent.');
    return;
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('[Email] RESEND_FROM_EMAIL not configured. Cannot send email.');
    throw new Error('Email configuration incomplete');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `HeadShotHub <${process.env.RESEND_FROM_EMAIL}>`,
      to: options.to.map((r) => r.address),
      subject: options.subject,
      html: options.htmlBody,
      text: options.textBody,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      throw new Error(`Failed to send email via Resend: ${JSON.stringify(error)}`);
    }

    console.log(`[Email] Sent successfully to ${options.to[0].address} - ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    throw error;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const subject = 'Welcome to HeadShotHub!';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to HeadShotHub</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">HeadShotHub</h1>
                  <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">Professional AI Headshots</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; color: #1e293b;">
                  <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 24px;">Welcome, ${name}!</h2>

                  <p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 16px;">
                    Thank you for joining HeadShotHub. We're excited to help you create professional headshots that make a great first impression.
                  </p>

                  <p style="margin: 0 0 24px 0; line-height: 1.6; font-size: 16px;">
                    Here's how to get started:
                  </p>

                  <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
                    <ol style="margin: 0; padding-left: 20px; color: #334155;">
                      <li style="margin-bottom: 12px; line-height: 1.6;">
                        <strong>Upload 12-20 photos</strong> of yourself in different settings and angles
                      </li>
                      <li style="margin-bottom: 12px; line-height: 1.6;">
                        <strong>Choose your plan</strong> - Basic, Professional, or Executive
                      </li>
                      <li style="margin-bottom: 12px; line-height: 1.6;">
                        <strong>Select style templates</strong> optimized for LinkedIn, corporate sites, and more
                      </li>
                      <li style="margin-bottom: 0; line-height: 1.6;">
                        <strong>Receive your headshots</strong> within 1-3 hours
                      </li>
                    </ol>
                  </div>

                  <table role="presentation" style="margin: 0 0 24px 0;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.FRONTEND_URL}/upload" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Get Started Now
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 16px;">
                    If you have any questions, our support team is here to help at
                    <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="color: #3b82f6; text-decoration: none;">${process.env.RESEND_FROM_EMAIL}</a>
                  </p>

                  <p style="margin: 0; line-height: 1.6; font-size: 16px;">
                    Best regards,<br>
                    <strong>The HeadShotHub Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                    © ${new Date().getFullYear()} HeadShotHub. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    Professional AI-generated headshots for your personal brand
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

  const textBody = `
Welcome to HeadShotHub, ${name}!

Thank you for joining HeadShotHub. We're excited to help you create professional headshots that make a great first impression.

Here's how to get started:
1. Upload 12-20 photos of yourself in different settings and angles
2. Choose your plan - Basic, Professional, or Executive
3. Select style templates optimized for LinkedIn, corporate sites, and more
4. Receive your headshots within 1-3 hours

Get started now: ${process.env.FRONTEND_URL}/upload

If you have any questions, our support team is here to help at ${process.env.RESEND_FROM_EMAIL}

Best regards,
The HeadShotHub Team
  `.trim();

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Send OTP code via email
 */
export async function sendOtpEmail({ email, name, code }: { email: string; name: string; code: string }) {
  const expiryMinutes = process.env.OTP_CODE_EXPIRY_MINUTES || '10';
  const subject = `Your HeadShotHub verification code: ${code}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">HeadShotHub</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; color: #1e293b; text-align: center;">
                  <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 24px;">Hi ${name},</h2>

                  <p style="margin: 0 0 30px 0; line-height: 1.6; font-size: 16px;">
                    Your verification code is:
                  </p>

                  <div style="background-color: #f1f5f9; border: 2px solid #3b82f6; border-radius: 8px; padding: 30px; margin: 0 0 30px 0;">
                    <div style="font-size: 48px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </div>

                  <p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 16px;">
                    This code will expire in <strong>${expiryMinutes} minutes</strong>.
                  </p>

                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0 0 0; text-align: left; border-radius: 4px;">
                    <p style="margin: 0; line-height: 1.6; font-size: 14px; color: #92400e;">
                      <strong>Security note:</strong> If you didn't request this code, please ignore this email. Never share your verification code with anyone.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                    © ${new Date().getFullYear()} HeadShotHub. All rights reserved.
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

  const textBody = `
Hi ${name},

Your HeadShotHub verification code is: ${code}

This code will expire in ${expiryMinutes} minutes.

Security note: If you didn't request this code, please ignore this email. Never share your verification code with anyone.

© ${new Date().getFullYear()} HeadShotHub. All rights reserved.
  `.trim();

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Send batch completion email
 */
export async function sendBatchCompletionEmail({
  email,
  name,
  batchId,
  headshotCount,
  plan,
}: {
  email: string;
  name: string;
  batchId: number;
  headshotCount: number;
  plan: string;
}) {
  const subject = 'Your HeadShotHub photos are ready!';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Headshots Are Ready</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">✨ Your Headshots Are Ready!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; color: #1e293b;">
                  <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 24px;">Great news, ${name}!</h2>

                  <p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 16px;">
                    Your <strong>${plan}</strong> plan headshots have been generated successfully. We've created <strong>${headshotCount} professional headshots</strong> optimized for various platforms.
                  </p>

                  <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
                    <p style="margin: 0; line-height: 1.6; font-size: 16px; color: #064e3b;">
                      <strong>What's included:</strong><br>
                      • Platform-optimized headshots (LinkedIn, corporate, social media, etc.)<br>
                      • Multiple style variations<br>
                      • High-resolution downloads<br>
                      • Professional lighting and backgrounds
                    </p>
                  </div>

                  <table role="presentation" style="margin: 24px 0;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          View Your Headshots
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 16px 0; line-height: 1.6; font-size: 16px;">
                    Not satisfied with a particular shot? You can request edits for background or outfit changes right from your dashboard.
                  </p>

                  <p style="margin: 0; line-height: 1.6; font-size: 16px;">
                    Best regards,<br>
                    <strong>The HeadShotHub Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                    © ${new Date().getFullYear()} HeadShotHub. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    Batch ID: #${batchId}
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

  const textBody = `
Great news, ${name}!

Your ${plan} plan headshots have been generated successfully. We've created ${headshotCount} professional headshots optimized for various platforms.

What's included:
• Platform-optimized headshots (LinkedIn, corporate, social media, etc.)
• Multiple style variations
• High-resolution downloads
• Professional lighting and backgrounds

View your headshots: ${process.env.FRONTEND_URL}/dashboard

Not satisfied with a particular shot? You can request edits for background or outfit changes right from your dashboard.

Best regards,
The HeadShotHub Team

Batch ID: #${batchId}
  `.trim();

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Send batch payment confirmation email
 */
export async function sendPaymentConfirmationEmail({
  email,
  name,
  plan,
  amount,
}: {
  email: string;
  name: string;
  plan: string;
  amount: number;
}) {
  const subject = 'Payment received - Generating your headshots!';
  const amountFormatted = (amount / 100).toFixed(2);

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Payment Received!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; color: #1e293b;">
                  <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 24px;">Thank you, ${name}!</h2>

                  <p style="margin: 0 0 24px 0; line-height: 1.6; font-size: 16px;">
                    We've received your payment and started generating your professional headshots. You'll receive an email notification when they're ready (typically within 1-3 hours).
                  </p>

                  <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plan:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; text-align: right;">${plan}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid:</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 16px; font-weight: 600; text-align: right;">$${amountFormatted}</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 16px;">
                    You can track your order status from your dashboard.
                  </p>

                  <table role="presentation" style="margin: 0 0 24px 0;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          View Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; line-height: 1.6; font-size: 16px;">
                    Best regards,<br>
                    <strong>The HeadShotHub Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                    © ${new Date().getFullYear()} HeadShotHub. All rights reserved.
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

  const textBody = `
Thank you, ${name}!

We've received your payment and started generating your professional headshots. You'll receive an email notification when they're ready (typically within 1-3 hours).

Order Details:
Plan: ${plan}
Amount Paid: $${amountFormatted}

You can track your order status from your dashboard: ${process.env.FRONTEND_URL}/dashboard

Best regards,
The HeadShotHub Team
  `.trim();

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}
