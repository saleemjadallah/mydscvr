import { Router } from 'express';
import multer from 'multer';
import { generateCompliantPhoto } from '../lib/photoGenerator.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

router.post('/process-compliance', upload.single('photo'), async (req: any, res) => {
  console.log('[Photo Compliance] Received request');

  if (!req.file) {
    return res.status(400).json({ error: 'No photo uploaded.' });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  console.log('[Photo Compliance] User ID:', userId);
  console.log('[Photo Compliance] File:', req.file.originalname, req.file.size);

  try {
    // Fetch user's travel profile with photo requirements from Jeffrey's analysis
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.travelProfile) {
      return res.status(400).json({
        error: 'Please complete onboarding first to get visa requirements from Jeffrey'
      });
    }

    const photoRequirements = user.travelProfile.visaRequirements?.photoRequirements;

    if (!photoRequirements) {
      return res.status(400).json({
        error: 'No photo requirements found. Please complete onboarding to get requirements from Jeffrey.'
      });
    }

    console.log('[Photo Compliance] Using requirements from user profile:', photoRequirements);

    const processedPhotoUrl = await generateCompliantPhoto(
      req.file.buffer,
      photoRequirements,
      userId
    );

    // Align response with ApiResponse<T> shape expected by the frontend
    res.json({
      success: true,
      data: {
        message: 'Photo processed successfully.',
        originalFileName: req.file.originalname,
        requirements: photoRequirements,
        processedPhotoUrl: processedPhotoUrl,
      },
    });
  } catch (error: any) {
    console.error('[Photo Compliance] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process photo with AI model.',
      details: error.message
    });
  }
});

export default router;
