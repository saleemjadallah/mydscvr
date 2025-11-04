# Stripe Subscription Email Notifications

This document describes the email notification system integrated with Stripe subscription events for MyDscvr Food.

## Overview

The system automatically sends professional, branded email notifications to users when subscription-related events occur through Stripe webhooks.

## Email Templates

### 1. Subscription Confirmation Email
- **Trigger**: When a new subscription is created or payment succeeds
- **Webhook Events**: `invoice.payment_succeeded` (with `subscription_create`), `customer.subscription.updated` (new subscription)
- **Content**: Welcome message, plan features, next billing date, dashboard link
- **Branding**: Orange gradient header with success messaging

### 2. Subscription Cancelled Email
- **Trigger**: When a subscription is cancelled
- **Webhook Event**: `customer.subscription.deleted`
- **Content**: Cancellation confirmation, access end date, option to reactivate
- **Branding**: Neutral header with informative tone

### 3. Payment Failed Email
- **Trigger**: When a payment attempt fails
- **Webhook Event**: `invoice.payment_failed`
- **Content**: Failure notification, retry date, update payment method CTA
- **Branding**: Red alert header for urgency

### 4. Subscription Updated Email
- **Trigger**: When subscription tier changes (upgrade/downgrade)
- **Webhook Event**: `customer.subscription.updated` (with tier change)
- **Content**: Plan comparison, new features, effective date
- **Branding**: Green header for upgrades, orange for downgrades

### 5. Payment Reminder Email
- **Trigger**: Manual trigger (can be scheduled)
- **Content**: Upcoming payment details, due date, manage billing link
- **Branding**: Standard orange branding

## Implementation Details

### File Structure
```
backend/
├── src/
│   ├── mail.ts                    # Base email sending functions (OTP, Welcome)
│   ├── subscriptionEmails.ts      # Subscription-specific email templates
│   └── routes.ts                  # Webhook handlers with email integration
└── test-subscription-emails.js    # Email testing script
```

### Key Components

#### 1. Email Service (mail.ts)
- Uses Resend API for email delivery
- Provides base `sendEmail` function
- Includes welcome and OTP email templates

#### 2. Subscription Email Templates (subscriptionEmails.ts)
- All subscription-related email templates
- Consistent branding with MyDscvr Food design
- HTML and plain text versions for compatibility
- Logo hosted on R2 CDN for reliability

#### 3. Webhook Integration (routes.ts)
Handles Stripe webhook events and triggers appropriate emails:

```javascript
// Example webhook handler
app.post("/api/stripe/webhook", async (req, res) => {
  // Verify webhook signature
  // Process event type
  // Send appropriate email
});
```

### Webhook Event Handling

| Stripe Event | Action | Email Sent |
|-------------|--------|------------|
| `invoice.payment_succeeded` | Create/renew subscription | Subscription Confirmation |
| `customer.subscription.deleted` | Cancel subscription | Subscription Cancelled |
| `customer.subscription.updated` | Update subscription | Subscription Updated (if tier changed) |
| `invoice.payment_failed` | Payment failure | Payment Failed |

### Environment Variables

Required environment variables for email functionality:
```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@mydscvr.ai

# Stripe Configuration
STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Testing

### Manual Testing
Run the test script to send all email templates to a test address:

```bash
# Set test email
export TEST_EMAIL=your-email@example.com

# Run tests
node test-subscription-emails.js
```

### Webhook Testing
Use Stripe CLI to test webhook events locally:

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

## Email Design Guidelines

### Brand Colors
- Primary Orange: `#FF8C42`
- Secondary Orange: `#FF6B0A`
- Background Cream: `#FFF8F0`
- Text Dark: `#2D3436`
- Text Light: `#636E72`

### Typography
- Font Family: Inter, system fonts fallback
- Headers: 24-28px, bold
- Body: 16px, regular
- Small text: 14px

### Layout
- Max width: 600px
- Mobile-responsive tables
- Centered alignment
- Rounded corners (16px)

## Monitoring

### Email Delivery
- Check Resend dashboard for delivery status
- Monitor webhook logs for email send failures
- Failed emails are logged but don't break webhook processing

### Error Handling
- Email failures are caught and logged
- Webhook processing continues even if email fails
- User data validation before sending emails

## Future Enhancements

1. **Scheduled Reminders**
   - Payment due in 7 days
   - Trial expiration warnings
   - Usage limit alerts

2. **Analytics**
   - Track email open rates
   - Monitor click-through rates
   - A/B test email content

3. **Personalization**
   - Usage statistics in emails
   - Personalized recommendations
   - Milestone celebrations

4. **Localization**
   - Multi-language support
   - Regional date/time formatting
   - Currency localization

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Verify RESEND_API_KEY is set correctly
   - Check RESEND_FROM_EMAIL is verified domain
   - Review Resend dashboard for errors

2. **Webhook events not triggering emails**
   - Verify STRIPE_WEBHOOK_SECRET is correct
   - Check webhook signature validation
   - Ensure user has valid email address

3. **Email formatting issues**
   - Test in multiple email clients
   - Verify image URLs are accessible
   - Check HTML/CSS compatibility

## Support

For issues or questions about the email system:
- Check Resend documentation: https://resend.com/docs
- Review Stripe webhook docs: https://stripe.com/docs/webhooks
- Contact support@mydscvr.ai