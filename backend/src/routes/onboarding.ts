/**
 * Onboarding Routes - Handle user onboarding flow with Jeffrey
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  enrichTravelProfile,
  generateRecommendations,
  TravelProfile,
} from '../services/visaResearch.js';

const router = Router();

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: () => void) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

/**
 * GET /api/onboarding/status
 * Check if user has completed onboarding
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;

    const [user] = await db
      .select({
        onboardingCompleted: users.onboardingCompleted,
        travelProfile: users.travelProfile,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        onboardingCompleted: user.onboardingCompleted === 1,
        travelProfile: user.travelProfile,
      },
    });
  } catch (error) {
    console.error('[Onboarding] Status check error:', error);
    return res.status(500).json({ success: false, error: 'Failed to check onboarding status' });
  }
});

/**
 * POST /api/onboarding/complete
 * Complete onboarding with travel profile data
 * This endpoint enriches the data with Perplexity AI research
 */
router.post('/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const travelProfile: TravelProfile = req.body;

    // Validate required fields
    if (!travelProfile.destinationCountry) {
      return res.status(400).json({ success: false, error: 'Destination country is required' });
    }
    if (!travelProfile.travelPurpose) {
      return res.status(400).json({ success: false, error: 'Travel purpose is required' });
    }
    if (!travelProfile.nationality) {
      return res.status(400).json({ success: false, error: 'Nationality is required' });
    }
    if (!travelProfile.travelDates?.start || !travelProfile.travelDates?.end) {
      return res.status(400).json({ success: false, error: 'Travel dates are required' });
    }

    // Enrich travel profile with Perplexity AI research
    console.log('[Onboarding] Researching visa requirements for:', travelProfile.destinationCountry);
    const enrichedProfile = await enrichTravelProfile(travelProfile);

    // Generate personalized recommendations
    const recommendations = generateRecommendations(enrichedProfile);

    // Update user record
    await db
      .update(users)
      .set({
        onboardingCompleted: 1,
        travelProfile: enrichedProfile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log('[Onboarding] Completed for user:', userId);

    return res.json({
      success: true,
      data: {
        travelProfile: enrichedProfile,
        recommendations,
        message: 'Onboarding completed successfully!',
      },
    });
  } catch (error) {
    console.error('[Onboarding] Completion error:', error);
    return res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
  }
});

/**
 * PUT /api/onboarding/profile
 * Update travel profile (for users who want to change their trip details)
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;
    const travelProfile: TravelProfile = req.body;

    // Enrich with new research
    const enrichedProfile = await enrichTravelProfile(travelProfile);
    const recommendations = generateRecommendations(enrichedProfile);

    // Update user record
    await db
      .update(users)
      .set({
        travelProfile: enrichedProfile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return res.json({
      success: true,
      data: {
        travelProfile: enrichedProfile,
        recommendations,
      },
    });
  } catch (error) {
    console.error('[Onboarding] Profile update error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update travel profile' });
  }
});

/**
 * POST /api/onboarding/skip
 * Skip onboarding (user can complete later)
 */
router.post('/skip', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;

    // Mark as skipped (still onboardingCompleted = 0, but we track they chose to skip)
    await db
      .update(users)
      .set({
        onboardingCompleted: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return res.json({
      success: true,
      message: 'Onboarding skipped. You can complete it later from your dashboard.',
    });
  } catch (error) {
    console.error('[Onboarding] Skip error:', error);
    return res.status(500).json({ success: false, error: 'Failed to skip onboarding' });
  }
});

/**
 * GET /api/onboarding/recommendations
 * Get recommendations based on current travel profile
 */
router.get('/recommendations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;

    const [user] = await db
      .select({
        travelProfile: users.travelProfile,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.travelProfile) {
      // Return default recommendations if no profile
      return res.json({
        success: true,
        data: {
          recommendations: [
            {
              priority: 'high',
              title: 'Complete Your Travel Profile',
              description: 'Let Jeffrey help you research visa requirements for your destination.',
              action: { label: 'Start Onboarding', href: '/app/onboarding' },
            },
            {
              priority: 'medium',
              title: 'Validate Documents',
              description: 'Upload and validate your documents to ensure they meet visa requirements.',
              action: { label: 'Validate Documents', href: '/app/validator' },
            },
            {
              priority: 'medium',
              title: 'Generate Visa Photos',
              description: 'Create professional photos that meet specific visa requirements.',
              action: { label: 'Generate Photos', href: '/app/photo-compliance' },
            },
          ],
        },
      });
    }

    // Generate recommendations based on profile
    const recommendations = generateRecommendations(user.travelProfile as any);

    return res.json({
      success: true,
      data: { recommendations },
    });
  } catch (error) {
    console.error('[Onboarding] Get recommendations error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

export default router;
