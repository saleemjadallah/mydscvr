import { Router } from 'express';
import { db, visaPackages } from '../../db/index.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Middleware to require authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// GET /api/visadocs/packages - Get all visa packages for current user
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    const packages = await db
      .select()
      .from(visaPackages)
      .where(eq(visaPackages.userId, userId))
      .orderBy(desc(visaPackages.createdAt));

    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error fetching visa packages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch visa packages' });
  }
});

// GET /api/visadocs/packages/:id - Get single visa package by ID
router.get('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const packageId = parseInt(req.params.id);

    if (isNaN(packageId)) {
      return res.status(400).json({ success: false, error: 'Invalid package ID' });
    }

    const [pkg] = await db
      .select()
      .from(visaPackages)
      .where(
        and(
          eq(visaPackages.id, packageId),
          eq(visaPackages.userId, userId)
        )
      );

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error fetching visa package:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch visa package' });
  }
});

// POST /api/visadocs/packages - Create new visa package
router.post('/', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const {
      visaType,
      destinationCountry,
      nationality,
      applicantName,
      plan
    } = req.body;

    // Validation
    if (!visaType || !destinationCountry || !plan) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: visaType, destinationCountry, plan'
      });
    }

    // Create package
    const [newPackage] = await db
      .insert(visaPackages)
      .values({
        userId,
        visaType,
        destinationCountry,
        nationality,
        applicantName,
        plan,
        amountPaid: 0, // Will be updated after payment
        status: 'in_progress',
        uploadedDocuments: [],
        visaPhotos: [],
        translatedDocuments: [],
        filledForms: [],
        requirements: [],
        missingItems: [],
      })
      .returning();

    res.status(201).json({ success: true, data: newPackage });
  } catch (error) {
    console.error('Error creating visa package:', error);
    res.status(500).json({ success: false, error: 'Failed to create visa package' });
  }
});

// PATCH /api/visadocs/packages/:id - Update visa package
router.patch('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const packageId = parseInt(req.params.id);

    if (isNaN(packageId)) {
      return res.status(400).json({ success: false, error: 'Invalid package ID' });
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(visaPackages)
      .where(
        and(
          eq(visaPackages.id, packageId),
          eq(visaPackages.userId, userId)
        )
      );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Update package
    const [updated] = await db
      .update(visaPackages)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(visaPackages.id, packageId))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating visa package:', error);
    res.status(500).json({ success: false, error: 'Failed to update visa package' });
  }
});

// DELETE /api/visadocs/packages/:id - Delete visa package
router.delete('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const packageId = parseInt(req.params.id);

    if (isNaN(packageId)) {
      return res.status(400).json({ success: false, error: 'Invalid package ID' });
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(visaPackages)
      .where(
        and(
          eq(visaPackages.id, packageId),
          eq(visaPackages.userId, userId)
        )
      );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // TODO: Delete associated files from R2 before deleting package

    await db
      .delete(visaPackages)
      .where(eq(visaPackages.id, packageId));

    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting visa package:', error);
    res.status(500).json({ success: false, error: 'Failed to delete visa package' });
  }
});

export default router;
