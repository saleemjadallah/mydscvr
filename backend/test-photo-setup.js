// Quick script to set up a test user with photo requirements
import { db } from './dist/db/index.js';
import { users } from './dist/db/schema.js';
import { eq } from 'drizzle-orm';

async function setupTestUser() {
  try {
    // Find or create a test user
    const testEmail = 'support@mydscvr.ai';

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, testEmail));

    if (existingUser) {
      // Update user with photo requirements
      const travelProfile = {
        destinationCountry: 'UAE',
        visaRequirements: {
          photoRequirements: {
            dimensions: '4.3cm x 5.5cm',
            background: 'White background',
            specifications: [
              'Face must be clearly visible and centered',
              'Neutral expression with mouth closed',
              'Eyes must be open and clearly visible',
              'No glasses with dark frames or glare',
              'Head covering allowed only for religious purposes',
              'Photo must be recent (within 6 months)',
              'High resolution and good quality',
              '70-80% of the frame should be the face'
            ]
          }
        }
      };

      await db.update(users)
        .set({ travelProfile })
        .where(eq(users.id, existingUser.id));

      console.log(`✅ Updated user ${testEmail} with photo requirements`);
      console.log('Travel Profile:', JSON.stringify(travelProfile, null, 2));
    } else {
      console.log(`❌ User ${testEmail} not found. Please register first.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupTestUser();