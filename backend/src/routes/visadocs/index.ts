import { Router } from 'express';
import packagesRouter from './packages.js';
import uploadRouter from './upload.js';
import chatRouter from './chat.js';
import visaFormsRouter from '../visaForms.js';
// Import other VisaDocs routers as they're created
// import translateRouter from './translate';

const router = Router();

// Mount sub-routers
router.use('/packages', packagesRouter);
router.use('/upload', uploadRouter);
router.use('/chat', chatRouter);
router.use('/forms', visaFormsRouter);

// TODO: Add these routes as we implement them
// router.use('/translate', translateRouter);

export default router;
