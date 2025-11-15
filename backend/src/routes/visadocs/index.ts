import { Router } from 'express';
import packagesRouter from './packages';
import uploadRouter from './upload';
import chatRouter from './chat';
// Import other VisaDocs routers as they're created
// import formsRouter from './forms';
// import translateRouter from './translate';

const router = Router();

// Mount sub-routers
router.use('/packages', packagesRouter);
router.use('/upload', uploadRouter);
router.use('/chat', chatRouter);

// TODO: Add these routes as we implement them
// router.use('/forms', formsRouter);
// router.use('/translate', translateRouter);

export default router;
