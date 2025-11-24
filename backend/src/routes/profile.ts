// @ts-nocheck

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import {
  userProfiles,
  passportProfiles,
  employmentProfiles,
  educationProfiles,
  familyProfiles,
  travelHistory,
  filledForms,
  formTemplates
} from '../db/schema-formfiller.js';
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
// USER PROFILE ENDPOINTS
// ===================================

// Get user's complete profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Get main profile
    const [profile] = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return res.json({
        success: true,
        data: null,
        message: 'No profile found. Please create one.'
      });
    }

    // Get passport info
    const passports = await db.select()
      .from(passportProfiles)
      .where(and(
        eq(passportProfiles.userId, userId),
        eq(passportProfiles.isActive, true)
      ));

    // Get employment history
    const employment = await db.select()
      .from(employmentProfiles)
      .where(eq(employmentProfiles.userId, userId))
      .orderBy(desc(employmentProfiles.isCurrent), desc(employmentProfiles.startDate));

    // Get education history
    const education = await db.select()
      .from(educationProfiles)
      .where(eq(educationProfiles.userId, userId))
      .orderBy(desc(educationProfiles.startDate));

    // Get family members
    const family = await db.select()
      .from(familyProfiles)
      .where(eq(familyProfiles.userId, userId));

    // Get travel history
    const travel = await db.select()
      .from(travelHistory)
      .where(eq(travelHistory.userId, userId))
      .orderBy(desc(travelHistory.entryDate))
      .limit(10); // Last 10 trips

    return res.json({
      success: true,
      data: {
        profile,
        passports,
        employment,
        education,
        family,
        travelHistory: travel
      }
    });
  } catch (error) {
    console.error('[Profile] Error fetching profile:', error);
    if (error instanceof Error) {
      console.error('[Profile] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile'
    });
  }
});

// Create or update main profile
router.post('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const profileData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    // Check if profile exists
    const [existing] = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    let profile;
    if (existing) {
      // Update existing profile
      [profile] = await db.update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.userId, userId))
        .returning();
    } else {
      // Create new profile
      [profile] = await db.insert(userProfiles)
        .values(profileData)
        .returning();
    }

    return res.json({
      success: true,
      data: profile,
      message: existing ? 'Profile updated successfully' : 'Profile created successfully'
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save profile'
    });
  }
});

// ===================================
// PASSPORT ENDPOINTS
// ===================================

// Add or update passport
router.post('/passport', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const passportData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const [passport] = await db.insert(passportProfiles)
      .values(passportData)
      .returning();

    return res.json({
      success: true,
      data: passport,
      message: 'Passport information saved successfully'
    });
  } catch (error) {
    console.error('Error saving passport:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save passport information'
    });
  }
});

// ===================================
// EMPLOYMENT ENDPOINTS
// ===================================

// Add employment record
router.post('/employment', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // If marking as current, unmark other current employment
    if (req.body.isCurrent) {
      await db.update(employmentProfiles)
        .set({ isCurrent: false })
        .where(and(
          eq(employmentProfiles.userId, userId),
          eq(employmentProfiles.isCurrent, true)
        ));
    }

    const employmentData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const [employment] = await db.insert(employmentProfiles)
      .values(employmentData)
      .returning();

    return res.json({
      success: true,
      data: employment,
      message: 'Employment record saved successfully'
    });
  } catch (error) {
    console.error('Error saving employment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save employment record'
    });
  }
});

// ===================================
// EDUCATION ENDPOINTS
// ===================================

// Add education record
router.post('/education', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const educationData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const [education] = await db.insert(educationProfiles)
      .values(educationData)
      .returning();

    return res.json({
      success: true,
      data: education,
      message: 'Education record saved successfully'
    });
  } catch (error) {
    console.error('Error saving education:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save education record'
    });
  }
});

// ===================================
// FAMILY ENDPOINTS
// ===================================

// Add family member
router.post('/family', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const familyData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const [familyMember] = await db.insert(familyProfiles)
      .values(familyData)
      .returning();

    return res.json({
      success: true,
      data: familyMember,
      message: 'Family member added successfully'
    });
  } catch (error) {
    console.error('Error adding family member:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add family member'
    });
  }
});

// ===================================
// TRAVEL HISTORY ENDPOINTS
// ===================================

// Add travel record
router.post('/travel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const travelData = {
      ...req.body,
      userId
    };

    const [travel] = await db.insert(travelHistory)
      .values(travelData)
      .returning();

    return res.json({
      success: true,
      data: travel,
      message: 'Travel record added successfully'
    });
  } catch (error) {
    console.error('Error adding travel record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add travel record'
    });
  }
});

// ===================================
// FORM AUTO-FILL ENDPOINT
// ===================================

// Get auto-fill data for a form
router.post('/autofill', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const { country, visaType, fields } = req.body;

    // Get user's complete profile data
    const [profile] = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const [passport] = await db.select()
      .from(passportProfiles)
      .where(and(
        eq(passportProfiles.userId, userId),
        eq(passportProfiles.isActive, true)
      ))
      .limit(1);

    const [currentEmployment] = await db.select()
      .from(employmentProfiles)
      .where(and(
        eq(employmentProfiles.userId, userId),
        eq(employmentProfiles.isCurrent, true)
      ))
      .limit(1);

    const [latestEducation] = await db.select()
      .from(educationProfiles)
      .where(eq(educationProfiles.userId, userId))
      .orderBy(desc(educationProfiles.startDate))
      .limit(1);

    // Get form template if exists
    const [template] = await db.select()
      .from(formTemplates)
      .where(and(
        eq(formTemplates.country, country),
        eq(formTemplates.visaType, visaType),
        eq(formTemplates.isActive, true)
      ))
      .limit(1);

    // Map fields to profile data
    const autoFillData: Record<string, any> = {};
    const validationErrors: any[] = [];

    // Smart mapping logic
    const fieldMapping: Record<string, () => any> = {
      // Personal Information
      'firstName': () => profile?.firstName,
      'first_name': () => profile?.firstName,
      'givenName': () => profile?.firstName,
      'given_name': () => profile?.firstName,

      'lastName': () => profile?.lastName,
      'last_name': () => profile?.lastName,
      'familyName': () => profile?.lastName,
      'family_name': () => profile?.lastName,
      'surname': () => profile?.lastName,

      'middleName': () => profile?.middleName,
      'middle_name': () => profile?.middleName,

      'dateOfBirth': () => profile?.dateOfBirth,
      'date_of_birth': () => profile?.dateOfBirth,
      'dob': () => profile?.dateOfBirth,
      'birthDate': () => profile?.dateOfBirth,

      'placeOfBirth': () => profile?.placeOfBirth,
      'place_of_birth': () => profile?.placeOfBirth,
      'birthPlace': () => profile?.placeOfBirth,

      'countryOfBirth': () => profile?.countryOfBirth,
      'country_of_birth': () => profile?.countryOfBirth,
      'birthCountry': () => profile?.countryOfBirth,

      'nationality': () => profile?.nationality,
      'citizenship': () => profile?.nationality,

      'gender': () => profile?.gender,
      'sex': () => profile?.gender,

      'maritalStatus': () => profile?.maritalStatus,
      'marital_status': () => profile?.maritalStatus,

      // Contact Information
      'email': () => profile?.email,
      'emailAddress': () => profile?.email,
      'email_address': () => profile?.email,

      'phone': () => profile?.phone,
      'telephone': () => profile?.phone,
      'phoneNumber': () => profile?.phone,
      'phone_number': () => profile?.phone,
      'mobile': () => profile?.phone,

      // Address
      'currentAddress': () => profile?.currentAddress ?
        `${profile.currentAddress.street}${profile.currentAddress.apartment ? `, ${profile.currentAddress.apartment}` : ''}, ${profile.currentAddress.city}, ${profile.currentAddress.state || ''} ${profile.currentAddress.postalCode}, ${profile.currentAddress.country}` : '',
      'address': () => profile?.currentAddress ?
        `${profile.currentAddress.street}${profile.currentAddress.apartment ? `, ${profile.currentAddress.apartment}` : ''}` : '',
      'street': () => profile?.currentAddress?.street,
      'city': () => profile?.currentAddress?.city,
      'state': () => profile?.currentAddress?.state,
      'country': () => profile?.currentAddress?.country,
      'postalCode': () => profile?.currentAddress?.postalCode,
      'postal_code': () => profile?.currentAddress?.postalCode,
      'zipCode': () => profile?.currentAddress?.postalCode,
      'zip_code': () => profile?.currentAddress?.postalCode,

      // Passport Information
      'passportNumber': () => passport?.passportNumber,
      'passport_number': () => passport?.passportNumber,
      'passportNo': () => passport?.passportNumber,

      'passportIssueDate': () => passport?.issueDate,
      'passport_issue_date': () => passport?.issueDate,
      'passportIssuedDate': () => passport?.issueDate,

      'passportExpiryDate': () => passport?.expiryDate,
      'passport_expiry_date': () => passport?.expiryDate,
      'passportExpiry': () => passport?.expiryDate,

      'passportIssuingCountry': () => passport?.issuingCountry,
      'passport_issuing_country': () => passport?.issuingCountry,

      'passportPlaceOfIssue': () => passport?.placeOfIssue,
      'passport_place_of_issue': () => passport?.placeOfIssue,

      // Employment Information
      'employerName': () => currentEmployment?.employerName,
      'employer_name': () => currentEmployment?.employerName,
      'employer': () => currentEmployment?.employerName,
      'company': () => currentEmployment?.employerName,

      'jobTitle': () => currentEmployment?.jobTitle,
      'job_title': () => currentEmployment?.jobTitle,
      'occupation': () => currentEmployment?.jobTitle,
      'position': () => currentEmployment?.jobTitle,

      'employerAddress': () => currentEmployment?.employerAddress ?
        `${currentEmployment.employerAddress.street}, ${currentEmployment.employerAddress.city}, ${currentEmployment.employerAddress.state || ''} ${currentEmployment.employerAddress.postalCode}, ${currentEmployment.employerAddress.country}` : '',
      'employer_address': () => currentEmployment?.employerAddress ?
        `${currentEmployment.employerAddress.street}, ${currentEmployment.employerAddress.city}, ${currentEmployment.employerAddress.state || ''} ${currentEmployment.employerAddress.postalCode}, ${currentEmployment.employerAddress.country}` : '',

      'employerPhone': () => currentEmployment?.employerPhone,
      'employer_phone': () => currentEmployment?.employerPhone,

      'salary': () => currentEmployment?.monthlySalary,
      'monthlySalary': () => currentEmployment?.monthlySalary,
      'monthly_salary': () => currentEmployment?.monthlySalary,

      // Education Information
      'educationLevel': () => latestEducation?.degree,
      'education_level': () => latestEducation?.degree,
      'degree': () => latestEducation?.degree,
      'qualification': () => latestEducation?.degree,

      'institution': () => latestEducation?.institutionName,
      'university': () => latestEducation?.institutionName,
      'school': () => latestEducation?.institutionName,
      'college': () => latestEducation?.institutionName,
    };

    // Process each field
    for (const field of fields) {
      const mappingFunc = fieldMapping[field.name] || fieldMapping[field.id];
      if (mappingFunc) {
        const value = mappingFunc();
        if (value !== undefined && value !== null) {
          autoFillData[field.id] = {
            value: String(value),
            source: 'profile',
            confidence: 0.9
          };
        }
      }
    }

    // Validation checks
    if (passport && template?.validationRules?.passportValidityMonths) {
      const expiryDate = new Date(passport.expiryDate);
      const requiredValidityDate = new Date();
      requiredValidityDate.setMonth(requiredValidityDate.getMonth() + template.validationRules.passportValidityMonths);

      if (expiryDate < requiredValidityDate) {
        validationErrors.push({
          field: 'passport',
          error: `Passport expires in less than ${template.validationRules.passportValidityMonths} months. ${country} requires at least ${template.validationRules.passportValidityMonths} months validity.`,
          severity: 'error'
        });
      }
    }

    return res.json({
      success: true,
      data: {
        autoFillData,
        validationErrors,
        completionRate: Math.round((Object.keys(autoFillData).length / fields.length) * 100)
      }
    });
  } catch (error) {
    console.error('Error generating autofill data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate autofill data'
    });
  }
});

// ===================================
// FORM HISTORY ENDPOINTS
// ===================================

// Save filled form
router.post('/forms/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const formData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const [form] = await db.insert(filledForms)
      .values(formData)
      .returning();

    return res.json({
      success: true,
      data: form,
      message: 'Form saved successfully'
    });
  } catch (error) {
    console.error('Error saving form:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save form'
    });
  }
});

// Get form history
router.get('/forms/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string })?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const forms = await db.select()
      .from(filledForms)
      .where(eq(filledForms.userId, userId))
      .orderBy(desc(filledForms.updatedAt))
      .limit(20);

    return res.json({
      success: true,
      data: forms
    });
  } catch (error) {
    console.error('Error fetching form history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch form history'
    });
  }
});

export default router;
// @ts-nocheck
