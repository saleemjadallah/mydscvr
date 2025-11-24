// @ts-nocheck

import { Router } from 'express';
import multer from 'multer';
import { db, visaPackages } from '../../db/index.js';
import { eq, and } from 'drizzle-orm';
import { uploadToR2, generateR2Url } from '../../lib/storage.js';
import crypto from 'crypto';

const router = Router();

// Middleware to require authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20, // Max 20 files at once
  },
  fileFilter: (_req, file, cb) => {
    // Accept PDF, JPG, PNG, JPEG
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  },
});

// POST /api/visadocs/upload - Upload documents for a visa package
router.post('/', requireAuth, upload.array('documents', 20), async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const { packageId, documentTypes } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: 'Package ID is required'
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Verify package ownership
    const [pkg] = await db
      .select()
      .from(visaPackages)
      .where(
        and(
          eq(visaPackages.id, parseInt(packageId)),
          eq(visaPackages.userId, userId)
        )
      );

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Parse document types (sent as JSON string or array)
    let docTypes: string[] = [];
    try {
      docTypes = typeof documentTypes === 'string'
        ? JSON.parse(documentTypes)
        : documentTypes || [];
    } catch (e) {
      docTypes = [];
    }

    // Upload each file to R2
    const uploadedDocs = await Promise.all(
      files.map(async (file, index) => {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueId = crypto.randomBytes(16).toString('hex');
        const key = `uploads/${userId}/${packageId}/documents/${uniqueId}.${fileExtension}`;

        // Upload to R2
        await uploadToR2(key, file.buffer, file.mimetype);
        const r2Url = generateR2Url(key);

        return {
          type: docTypes[index] || 'other',
          originalName: file.originalname,
          r2Url,
          uploadedAt: new Date(),
          status: 'pending' as const,
        };
      })
    );

    // Update package with uploaded documents
    const existingDocs = pkg.uploadedDocuments || [];
    const updatedDocs = [...existingDocs, ...uploadedDocs];

    const [updated] = await db
      .update(visaPackages)
      .set({
        uploadedDocuments: updatedDocs as any,
        status: 'documents_uploaded',
        updatedAt: new Date(),
      })
      .where(eq(visaPackages.id, parseInt(packageId)))
      .returning();

    res.json({
      success: true,
      data: {
        package: updated,
        uploadedDocuments: uploadedDocs,
      },
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ success: false, error: 'Failed to upload documents' });
  }
});

// POST /api/visadocs/upload/photo - Upload selfies for visa photo generation
router.post('/photo', requireAuth, upload.array('photos', 5), async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const { packageId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: 'Package ID is required'
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photos uploaded'
      });
    }

    // Verify package ownership
    const [pkg] = await db
      .select()
      .from(visaPackages)
      .where(
        and(
          eq(visaPackages.id, parseInt(packageId)),
          eq(visaPackages.userId, userId)
        )
      );

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Upload each photo to R2
    const uploadedPhotos = await Promise.all(
      files.map(async (file) => {
        const uniqueId = crypto.randomBytes(16).toString('hex');
        const key = `uploads/${userId}/${packageId}/photos/${uniqueId}.jpg`;

        // Upload to R2
        await uploadToR2(key, file.buffer, 'image/jpeg');
        const r2Url = generateR2Url(key);

        return r2Url;
      })
    );

    res.json({
      success: true,
      data: {
        uploadedPhotos,
      },
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photos' });
  }
});

export default router;
// @ts-nocheck
