import { sendEmail } from "./mail.js";

// Subscription Email Templates

export async function sendSubscriptionConfirmationEmail({
  email,
  name,
  tier,
  billingPeriodEnd,
}: {
  email: string;
  name?: string | null;
  tier: string;
  billingPeriodEnd: Date;
}) {
  const displayName = name?.trim() || "there";
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";
  const formattedDate = billingPeriodEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Tier-specific features
  const tierFeatures: Record<string, string[]> = {
    starter: ["Up to 20 dishes per month", "3 images per dish", "10 image enhancements"],
    pro: ["Up to 50 dishes per month", "5 images per dish", "25 image enhancements", "Priority support"],
    enterprise: ["Unlimited dishes", "Unlimited images", "Unlimited enhancements", "Dedicated support"],
  };

  const features = tierFeatures[tier.toLowerCase()] || tierFeatures.starter;

  const subject = `Welcome to MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`;
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); border-radius: 16px 16px 0 0;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 100px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">Subscription Confirmed! 🎉</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">
                    Thank you for subscribing to <strong style="color: #FF8C42;">MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong>!
                    Your subscription is now active and you have full access to all the features.
                  </p>

                  <!-- Plan Details Box -->
                  <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%); border-radius: 12px; border: 1px solid #FFD4B3;">
                    <h2 style="margin: 0 0 15px; font-size: 20px; font-weight: 600; color: #FF8C42;">Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Includes:</h2>
                    <ul style="margin: 0; padding-left: 20px; color: #2D3436;">
                      ${features.map(feature => `<li style="margin-bottom: 8px;">${feature}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="margin: 25px 0; padding: 15px; background-color: #F8F9FA; border-left: 4px solid #28A745; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #2D3436;">
                      <strong>Next billing date:</strong> ${formattedDate}
                    </p>
                  </div>

                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    Ready to start creating amazing dish imagery? Log in to your dashboard and begin showcasing your culinary creations!
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mydscvr.ai/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
                  </div>

                  <p style="margin: 30px 0 8px; font-size: 16px;">Happy creating!</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    Need to manage your subscription? Visit your <a href="https://mydscvr.ai/settings" style="color: #FF8C42; text-decoration: none;">account settings</a>
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
    `Thank you for subscribing to MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
    "Your subscription is now active and you have full access to all the features.",
    "",
    `Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Includes:`,
    ...features.map(f => `• ${f}`),
    "",
    `Next billing date: ${formattedDate}`,
    "",
    "Ready to start creating amazing dish imagery? Log in to your dashboard and begin showcasing your culinary creations!",
    "",
    "Happy creating!",
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

export async function sendSubscriptionCancelledEmail({
  email,
  name,
  tier,
  cancelledAt,
  endsAt,
}: {
  email: string;
  name?: string | null;
  tier: string;
  cancelledAt: Date;
  endsAt: Date;
}) {
  const displayName = name?.trim() || "there";
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";
  const formattedEndDate = endsAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const subject = "Your MyDscvr Food subscription has been cancelled";
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Cancelled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 100px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2D3436; letter-spacing: -0.5px;">Subscription Cancelled</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">
                    We've successfully cancelled your <strong>${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> subscription as requested.
                  </p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #FFF5ED; border-left: 4px solid #FF8C42; border-radius: 8px;">
                    <p style="margin: 0 0 10px; font-size: 15px; color: #2D3436;">
                      <strong>Important:</strong> You'll continue to have access to your ${tier} features until <strong style="color: #FF8C42;">${formattedEndDate}</strong>.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #636E72;">
                      After this date, your account will revert to the free trial limits.
                    </p>
                  </div>

                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    We're sorry to see you go! If there's anything we could have done better, we'd love to hear your feedback.
                  </p>

                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    Changed your mind? You can reactivate your subscription anytime from your account settings.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mydscvr.ai/settings" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Manage Subscription</a>
                  </div>

                  <p style="margin: 30px 0 8px; font-size: 16px;">Best regards,</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    We hope to see you again soon!
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
    `We've successfully cancelled your ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription as requested.`,
    "",
    `Important: You'll continue to have access to your ${tier} features until ${formattedEndDate}.`,
    "After this date, your account will revert to the free trial limits.",
    "",
    "We're sorry to see you go! If there's anything we could have done better, we'd love to hear your feedback.",
    "",
    "Changed your mind? You can reactivate your subscription anytime from your account settings.",
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

export async function sendPaymentFailedEmail({
  email,
  name,
  tier,
  retryDate,
}: {
  email: string;
  name?: string | null;
  tier: string;
  retryDate?: Date;
}) {
  const displayName = name?.trim() || "there";
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";
  const formattedRetryDate = retryDate?.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const subject = "Payment Failed - Action Required";
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 100px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #DC3545; letter-spacing: -0.5px;">Payment Failed</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">
                    We were unable to process the payment for your <strong style="color: #FF8C42;">MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> subscription.
                  </p>

                  <div style="margin: 30px 0; padding: 20px; background-color: #FFF5F5; border-left: 4px solid #DC3545; border-radius: 8px;">
                    <p style="margin: 0 0 10px; font-size: 15px; color: #2D3436;">
                      <strong>What happens next?</strong>
                    </p>
                    <ul style="margin: 10px 0 0; padding-left: 20px; color: #636E72; font-size: 14px;">
                      ${formattedRetryDate ? `<li>We'll automatically retry on ${formattedRetryDate}</li>` : ''}
                      <li>Your subscription remains active during the retry period</li>
                      <li>Update your payment method to avoid service interruption</li>
                    </ul>
                  </div>

                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    To ensure uninterrupted access to your MyDscvr Food features, please update your payment information as soon as possible.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mydscvr.ai/settings" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Update Payment Method</a>
                  </div>

                  <p style="margin: 25px 0 20px; font-size: 14px; color: #636E72;">
                    If you believe this is an error or need assistance, please don't hesitate to contact our support team.
                  </p>

                  <p style="margin: 30px 0 8px; font-size: 16px;">Best regards,</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    Need help? <a href="mailto:support@mydscvr.ai" style="color: #FF8C42; text-decoration: none;">Contact Support</a>
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
    `We were unable to process the payment for your MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription.`,
    "",
    "What happens next?",
    formattedRetryDate ? `• We'll automatically retry on ${formattedRetryDate}` : '',
    "• Your subscription remains active during the retry period",
    "• Update your payment method to avoid service interruption",
    "",
    "To ensure uninterrupted access to your MyDscvr Food features, please update your payment information as soon as possible.",
    "",
    "Visit https://mydscvr.ai/settings to update your payment method.",
    "",
    "If you believe this is an error or need assistance, please don't hesitate to contact our support team.",
    "",
    "Best regards,",
    "The MyDscvr Food Team",
    "",
    `© ${new Date().getFullYear()} MyDscvr Food. All rights reserved.`,
  ].join("\n").replace(/\n\n+/g, "\n\n"); // Remove any empty lines from missing retry date

  await sendEmail({
    to: [{ address: email, name }],
    subject,
    htmlBody,
    textBody,
  });
}

export async function sendSubscriptionUpdatedEmail({
  email,
  name,
  oldTier,
  newTier,
  effectiveDate,
}: {
  email: string;
  name?: string | null;
  oldTier: string;
  newTier: string;
  effectiveDate: Date;
}) {
  const displayName = name?.trim() || "there";
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";
  const isUpgrade = newTier === 'enterprise' || (newTier === 'pro' && oldTier === 'starter');
  const formattedDate = effectiveDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Tier-specific features
  const tierFeatures: Record<string, string[]> = {
    starter: ["Up to 20 dishes per month", "3 images per dish", "10 image enhancements"],
    pro: ["Up to 50 dishes per month", "5 images per dish", "25 image enhancements", "Priority support"],
    enterprise: ["Unlimited dishes", "Unlimited images", "Unlimited enhancements", "Dedicated support"],
  };

  const newFeatures = tierFeatures[newTier.toLowerCase()] || tierFeatures.starter;

  const subject = isUpgrade
    ? `🎉 Your plan has been upgraded to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`
    : `Your plan has been changed to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Updated</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, ${isUpgrade ? '#28A745' : '#FF8C42'} 0%, ${isUpgrade ? '#20C997' : '#FF6B0A'} 100%); border-radius: 16px 16px 0 0;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 100px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                    ${isUpgrade ? 'Plan Upgraded! 🚀' : 'Plan Updated'}
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">
                    Your MyDscvr Food subscription has been ${isUpgrade ? 'upgraded' : 'changed'} from
                    <strong>${oldTier.charAt(0).toUpperCase() + oldTier.slice(1)}</strong> to
                    <strong style="color: #FF8C42;">${newTier.charAt(0).toUpperCase() + newTier.slice(1)}</strong>!
                  </p>

                  <!-- New Features Box -->
                  <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%); border-radius: 12px; border: 1px solid #FFD4B3;">
                    <h2 style="margin: 0 0 15px; font-size: 20px; font-weight: 600; color: #FF8C42;">
                      Your ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} Plan Includes:
                    </h2>
                    <ul style="margin: 0; padding-left: 20px; color: #2D3436;">
                      ${newFeatures.map(feature => `<li style="margin-bottom: 8px;">${feature}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="margin: 25px 0; padding: 15px; background-color: #F8F9FA; border-left: 4px solid ${isUpgrade ? '#28A745' : '#FF8C42'}; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #2D3436;">
                      <strong>Effective from:</strong> ${formattedDate}
                    </p>
                  </div>

                  ${isUpgrade ? `
                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    Enjoy your enhanced features! You now have access to more resources to create stunning dish imagery and grow your business.
                  </p>
                  ` : `
                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    Your plan has been adjusted to better match your needs. All your existing content remains safe and accessible.
                  </p>
                  `}

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mydscvr.ai/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Explore Your Features</a>
                  </div>

                  <p style="margin: 30px 0 8px; font-size: 16px;">Happy creating!</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    Questions? Visit your <a href="https://mydscvr.ai/settings" style="color: #FF8C42; text-decoration: none;">account settings</a>
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
    `Your MyDscvr Food subscription has been ${isUpgrade ? 'upgraded' : 'changed'} from ${oldTier.charAt(0).toUpperCase() + oldTier.slice(1)} to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`,
    "",
    `Your ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} Plan Includes:`,
    ...newFeatures.map(f => `• ${f}`),
    "",
    `Effective from: ${formattedDate}`,
    "",
    isUpgrade
      ? "Enjoy your enhanced features! You now have access to more resources to create stunning dish imagery and grow your business."
      : "Your plan has been adjusted to better match your needs. All your existing content remains safe and accessible.",
    "",
    "Happy creating!",
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

export async function sendPaymentReminderEmail({
  email,
  name,
  tier,
  dueDate,
  amount,
}: {
  email: string;
  name?: string | null;
  tier: string;
  dueDate: Date;
  amount?: number;
}) {
  const displayName = name?.trim() || "there";
  const logoUrl = "https://images.mydscvr.ai/branding/logo-transparent.png";
  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedAmount = amount ? `AED ${amount.toFixed(2)}` : 'your subscription amount';

  const subject = "Payment Reminder - MyDscvr Food Subscription";
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FFF8F0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF8F0;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 52, 54, 0.08);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px;">
                  <img src="${logoUrl}" alt="MyDscvr Food Logo" style="width: 100px; height: auto; display: block; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2D3436; letter-spacing: -0.5px;">Payment Reminder</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px; color: #2D3436; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px; font-size: 16px;">Hi ${displayName},</p>

                  <p style="margin: 0 0 20px; font-size: 16px;">
                    This is a friendly reminder that your <strong style="color: #FF8C42;">MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong>
                    subscription payment is coming up soon.
                  </p>

                  <!-- Payment Details Box -->
                  <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%); border-radius: 12px; border: 1px solid #FFD4B3;">
                    <h2 style="margin: 0 0 15px; font-size: 18px; font-weight: 600; color: #FF8C42;">Payment Details</h2>
                    <p style="margin: 0 0 8px; font-size: 15px; color: #2D3436;">
                      <strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 15px; color: #2D3436;">
                      <strong>Amount:</strong> ${formattedAmount}
                    </p>
                    <p style="margin: 0; font-size: 15px; color: #2D3436;">
                      <strong>Due Date:</strong> ${formattedDueDate}
                    </p>
                  </div>

                  <p style="margin: 25px 0 20px; font-size: 16px;">
                    No action is needed if your payment method is up to date. We'll automatically process the payment on the due date.
                  </p>

                  <p style="margin: 25px 0 20px; font-size: 14px; color: #636E72;">
                    Need to update your payment information? You can do so anytime in your account settings.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mydscvr.ai/settings" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF8C42 0%, #FF6B0A 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Manage Billing</a>
                  </div>

                  <p style="margin: 30px 0 8px; font-size: 16px;">Thank you for being a valued member!</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF8C42;">The MyDscvr Food Team</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #FFF5ED; border-radius: 0 0 16px 16px; text-align: center;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #636E72;">
                    Questions about billing? <a href="mailto:support@mydscvr.ai" style="color: #FF8C42; text-decoration: none;">Contact Support</a>
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
    `This is a friendly reminder that your MyDscvr Food ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription payment is coming up soon.`,
    "",
    "Payment Details:",
    `• Plan: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
    `• Amount: ${formattedAmount}`,
    `• Due Date: ${formattedDueDate}`,
    "",
    "No action is needed if your payment method is up to date. We'll automatically process the payment on the due date.",
    "",
    "Need to update your payment information? Visit https://mydscvr.ai/settings",
    "",
    "Thank you for being a valued member!",
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