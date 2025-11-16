import { Router } from 'express';
import documentValidatorRouter from './documentValidator.js';
import photoComplianceRouter from './photoCompliance.js';
import travelItineraryRouter from './travelItinerary.js';

const router = Router();

// MYDSCVR Core Features Routes
router.use('/document-validator', documentValidatorRouter);
router.use('/photo-compliance', photoComplianceRouter);
router.use('/travel-itinerary', travelItineraryRouter);

export default router;
