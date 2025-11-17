import { Router, Request, Response } from 'express';
import { db } from '../db';
import {
  userPreferences,
  countryValidationRules,
  formTemplates,
  userFormHistory,
  privacySettings
} from '../db/schema-formfiller-privacy';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// ===================================
// USER PREFERENCES ENDPOINTS (Privacy-First)
// ===================================

// Get user preferences (non-sensitive only)
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Get preferences
    const [preferences] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Get privacy settings
    const [privacy] = await db.select()
      .from(privacySettings)
      .where(eq(privacySettings.userId, userId))
      .limit(1);

    return res.json({
      success: true,
      data: {
        preferences: preferences || null,
        privacy: privacy || {
          allowPreferenceStorage: true,
          allowFormPatternAnalysis: true,
          allowAnonymousAnalytics: true
        },
        dataDisclosure: {
          whatWeStore: [
            'Your name (for formatting assistance)',
            'Your nationality and residence country (for date/phone formats)',
            'General profession category (not specific employer)',
            'Education level (not institution names)',
            'Your formatting preferences'
          ],
          whatWeDontStore: [
            'Passport or ID numbers',
            'Date of birth',
            'Specific addresses',
            'Phone numbers',
            'Employer names',
            'Financial information',
            'Travel history',
            'Family member details'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences'
    });
  }
});

// Save user preferences (non-sensitive only)
router.post('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Filter out any sensitive data that might be sent
    const allowedFields = [
      'firstName', 'middleName', 'lastName', 'namePrefix',
      'nationality', 'countryOfResidence', 'cityOfResidence', 'gender',
      'professionCategory', 'employmentStatus', 'educationLevel',
      'preferredDateFormat', 'preferredPhoneFormat', 'preferredLanguage', 'measurementSystem'
    ];

    const filteredData: any = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        filteredData[field] = req.body[field];
      }
    });

    const preferencesData = {
      ...filteredData,
      userId,
      updatedAt: new Date()
    };

    // Check if preferences exist
    const [existing] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    let preferences;
    if (existing) {
      // Update existing preferences
      [preferences] = await db.update(userPreferences)
        .set(preferencesData)
        .where(eq(userPreferences.userId, userId))
        .returning();
    } else {
      // Create new preferences
      [preferences] = await db.insert(userPreferences)
        .values(preferencesData)
        .returning();
    }

    return res.json({
      success: true,
      data: preferences,
      message: 'Preferences saved successfully'
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save preferences'
    });
  }
});

// ===================================
// VALIDATION ASSISTANCE ENDPOINTS
// ===================================

// Get validation rules for a country/visa type
router.get('/validation-rules/:country/:visaType', requireAuth, async (req: Request, res: Response) => {
  try {
    const { country, visaType } = req.params;

    const [rules] = await db.select()
      .from(countryValidationRules)
      .where(and(
        eq(countryValidationRules.country, country),
        eq(countryValidationRules.visaType, visaType),
        eq(countryValidationRules.isActive, true)
      ))
      .limit(1);

    if (!rules) {
      // Return generic rules if specific ones not found
      return res.json({
        success: true,
        data: {
          validationRules: {
            dateFormat: 'DD/MM/YYYY',
            phoneFormat: 'international',
            nameFormat: 'firstName_lastName',
            requiredFields: [],
            fieldCharacterLimits: {},
            rejectionReasons: []
          },
          commonMistakes: []
        }
      });
    }

    return res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch validation rules'
    });
  }
});

// Validate form fields (no data storage)
router.post('/validate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { country, visaType, fields } = req.body;

    // Get validation rules
    const [rules] = await db.select()
      .from(countryValidationRules)
      .where(and(
        eq(countryValidationRules.country, country),
        eq(countryValidationRules.visaType, visaType),
        eq(countryValidationRules.isActive, true)
      ))
      .limit(1);

    const validationErrors: any[] = [];
    const validationWarnings: any[] = [];

    if (rules && rules.validationRules) {
      const { requiredFields, fieldCharacterLimits, dateFormat, phoneFormat } = rules.validationRules;

      // Check required fields
      requiredFields.forEach(requiredField => {
        const field = fields.find((f: any) => f.name === requiredField);
        if (!field || !field.value) {
          validationErrors.push({
            fieldId: requiredField,
            message: `${requiredField} is required`,
            severity: 'error'
          });
        }
      });

      // Check character limits
      Object.entries(fieldCharacterLimits).forEach(([fieldName, limit]) => {
        const field = fields.find((f: any) => f.name === fieldName);
        if (field && field.value && field.value.length > limit) {
          validationErrors.push({
            fieldId: fieldName,
            message: `${fieldName} exceeds ${limit} character limit`,
            severity: 'error'
          });
        }
      });

      // Check common mistakes
      if (rules.commonMistakes) {
        rules.commonMistakes.forEach(mistake => {
          validationWarnings.push({
            message: mistake.mistake,
            correction: mistake.correction,
            severity: mistake.severity
          });
        });
      }
    }

    // Record form usage (metadata only, no data)
    await db.insert(userFormHistory)
      .values({
        userId: req.user?.id!,
        country,
        visaType,
        formName: req.body.formName || 'Unknown',
        startedAt: new Date(),
        totalFields: fields.length,
        validFields: fields.length - validationErrors.length,
        errorsFound: validationErrors.length,
        warningsFound: validationWarnings.length,
        validationHelped: {
          formatErrors: validationErrors.filter(e => e.message.includes('format')).length,
          missingFields: validationErrors.filter(e => e.message.includes('required')).length,
          characterLimitErrors: validationErrors.filter(e => e.message.includes('character')).length
        }
      });

    return res.json({
      success: true,
      data: {
        validationErrors,
        validationWarnings,
        isValid: validationErrors.length === 0,
        summary: {
          totalErrors: validationErrors.length,
          totalWarnings: validationWarnings.length,
          completionPercentage: Math.round(((fields.length - validationErrors.length) / fields.length) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Error validating form:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate form'
    });
  }
});

// ===================================
// FORMAT ASSISTANCE ENDPOINTS
// ===================================

// Format assistance (helps without storing data)
router.post('/format-assist', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fieldType, value, country } = req.body;

    // Get user preferences
    const [preferences] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId!))
      .limit(1);

    let formattedValue = value;
    let formatHint = '';

    switch (fieldType) {
      case 'date':
        const preferredFormat = preferences?.preferredDateFormat || 'DD/MM/YYYY';
        formatHint = `Format as ${preferredFormat}`;
        // Don't actually format the date, just provide the hint
        break;

      case 'phone':
        const countryCode = preferences?.preferredPhoneFormat || '+1';
        formatHint = `Include country code (${countryCode})`;
        break;

      case 'name':
        // Capitalize properly
        formattedValue = value
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        formatHint = 'Names auto-capitalized';
        break;

      default:
        break;
    }

    return res.json({
      success: true,
      data: {
        originalValue: value,
        formattedValue,
        formatHint,
        userPreference: preferences?.preferredDateFormat || preferences?.preferredPhoneFormat
      }
    });
  } catch (error) {
    console.error('Error with format assistance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to provide format assistance'
    });
  }
});

// ===================================
// PRIVACY CONTROL ENDPOINTS
// ===================================

// Update privacy settings
router.post('/privacy', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const privacyData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const [existing] = await db.select()
      .from(privacySettings)
      .where(eq(privacySettings.userId, userId))
      .limit(1);

    let privacy;
    if (existing) {
      [privacy] = await db.update(privacySettings)
        .set(privacyData)
        .where(eq(privacySettings.userId, userId))
        .returning();
    } else {
      [privacy] = await db.insert(privacySettings)
        .values(privacyData)
        .returning();
    }

    return res.json({
      success: true,
      data: privacy,
      message: 'Privacy settings updated'
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings'
    });
  }
});

// Delete all user data
router.delete('/delete-all-data', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Delete all user data from our tables
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    await db.delete(userFormHistory).where(eq(userFormHistory.userId, userId));
    await db.delete(privacySettings).where(eq(privacySettings.userId, userId));

    return res.json({
      success: true,
      message: 'All your preference data has been deleted'
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user data'
    });
  }
});

export default router;