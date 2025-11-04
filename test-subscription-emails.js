#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Import email functions
import {
  sendSubscriptionConfirmationEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
  sendSubscriptionUpdatedEmail,
  sendPaymentReminderEmail,
} from './dist/subscriptionEmails.js';

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_NAME = 'Test User';

async function testEmails() {
  console.log('🧪 Testing subscription email templates...\n');
  console.log(`Sending test emails to: ${TEST_EMAIL}\n`);

  try {
    // Test 1: Subscription Confirmation
    console.log('1. Testing subscription confirmation email...');
    await sendSubscriptionConfirmationEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      tier: 'pro',
      billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
    console.log('✅ Subscription confirmation email sent\n');

    // Test 2: Subscription Cancelled
    console.log('2. Testing subscription cancelled email...');
    await sendSubscriptionCancelledEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      tier: 'pro',
      cancelledAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
    console.log('✅ Subscription cancelled email sent\n');

    // Test 3: Payment Failed
    console.log('3. Testing payment failed email...');
    await sendPaymentFailedEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      tier: 'starter',
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    });
    console.log('✅ Payment failed email sent\n');

    // Test 4: Subscription Updated (Upgrade)
    console.log('4. Testing subscription upgraded email...');
    await sendSubscriptionUpdatedEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      oldTier: 'starter',
      newTier: 'pro',
      effectiveDate: new Date(),
    });
    console.log('✅ Subscription upgraded email sent\n');

    // Test 5: Subscription Updated (Downgrade)
    console.log('5. Testing subscription downgraded email...');
    await sendSubscriptionUpdatedEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      oldTier: 'pro',
      newTier: 'starter',
      effectiveDate: new Date(),
    });
    console.log('✅ Subscription downgraded email sent\n');

    // Test 6: Payment Reminder
    console.log('6. Testing payment reminder email...');
    await sendPaymentReminderEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      tier: 'pro',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      amount: 299, // AED 299
    });
    console.log('✅ Payment reminder email sent\n');

    console.log('🎉 All test emails sent successfully!');
    console.log(`Check ${TEST_EMAIL} inbox to verify the emails.`);
  } catch (error) {
    console.error('❌ Error sending test emails:', error);
    process.exit(1);
  }
}

// Run tests
testEmails().catch(console.error);