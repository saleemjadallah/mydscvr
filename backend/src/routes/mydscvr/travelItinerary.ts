import { Router, Request, Response } from 'express';
import { db } from '../../db/index.js';
import { travelItineraries } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateTravelItinerary } from '../../lib/perplexity.js';
import { generateTravelItineraryPDF } from '../../lib/pdfGenerator.js';

const router = Router();

// Extend Request type to include user
interface AuthedRequest extends Request {
  user?: any;
}

const calculateTripDuration = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = end.getTime() - start.getTime();
  // Ensure at least 1 day duration and cap at 30 to avoid runaway prompts
  return Math.min(Math.max(Math.ceil(diffInMs / (1000 * 60 * 60 * 24)), 1), 30);
};

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

// POST /api/travel-itinerary/create
// Create travel itinerary request
router.post('/create', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { destination, countries, duration, startDate, travelPurpose, budget } = req.body;

    if (!destination || !duration || !startDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + duration);

    res.json({
      success: true,
      data: {
        destination,
        countries,
        duration,
        startDate: start,
        endDate: end,
        travelPurpose,
        budget,
      },
    });
  } catch (error) {
    console.error('[Travel Itinerary] Create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create itinerary request' });
  }
});

// POST /api/travel-itinerary/preview
// Generate a Perplexity-powered itinerary without persisting it
router.post('/preview', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const {
      destination,
      countries = [],
      startDate,
      endDate,
      travelPurpose,
      budget = 'medium',
    } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const duration = calculateTripDuration(startDate, endDate);
    if (!duration) {
      return res.status(400).json({ success: false, error: 'Invalid travel dates' });
    }

    const generated = await generateTravelItinerary({
      destination,
      countries,
      duration,
      startDate,
      endDate,
      travelPurpose: travelPurpose || 'tourism',
      budget: budget || 'medium',
    });

    return res.json({
      success: true,
      data: generated,
    });
  } catch (error) {
    console.error('[Travel Itinerary] Preview generation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate itinerary preview' });
  }
});

// POST /api/travel-itinerary/checkout
// Create Stripe checkout session for itinerary generation
router.post('/checkout', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { destination, countries, duration, startDate, travelPurpose, budget } = req.body;
    const userId = req.user?.id;

    if (!destination || !duration || !startDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + duration);

    // Pricing based on destination (in fils - AED cents)
    const pricing: { [key: string]: number } = {
      schengen: 12500, // AED 125
      uk: 10000, // AED 100
      us: 10000, // AED 100
      canada: 10000, // AED 100
    };

    const price = pricing[destination] || 10000;

    // TODO: Implement Stripe checkout session creation
    // For now, create itinerary record with processing status
    const [itinerary] = await db
      .insert(travelItineraries)
      .values({
        userId: userId!,
        destination,
        countries: countries || [],
        duration,
        startDate: start,
        endDate: end,
        travelPurpose: travelPurpose || 'tourism',
        budget: budget || 'medium',
        status: 'processing',
        amountPaid: price,
      })
      .returning();

    res.json({
      success: true,
      data: {
        itineraryId: itinerary.id,
        checkoutUrl: '/processing', // Placeholder
      },
    });
  } catch (error) {
    console.error('[Travel Itinerary] Checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
});

// POST /api/travel-itinerary/:id/generate
// Trigger itinerary generation (called after payment)
router.post('/:id/generate', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const itineraryId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [itinerary] = await db
      .select()
      .from(travelItineraries)
      .where(eq(travelItineraries.id, itineraryId))
      .limit(1);

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    if (itinerary.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const startTime = Date.now();

    // Generate itinerary using Perplexity AI with real-world data
    console.log('[Travel Itinerary] Generating itinerary with Perplexity AI...');

    const generatedData = await generateTravelItinerary({
      destination: itinerary.destination,
      countries: (itinerary.countries as string[]) || [],
      duration: itinerary.duration,
      startDate: itinerary.startDate?.toISOString().split('T')[0] || '',
      endDate: itinerary.endDate?.toISOString().split('T')[0] || '',
      travelPurpose: itinerary.travelPurpose || 'tourism',
      budget: itinerary.budget || 'medium',
    });

    const processingTime = Math.round((Date.now() - startTime) / 60000); // in minutes

    // Generate PDF itinerary
    console.log('[Travel Itinerary] Generating PDF itinerary...');
    const pdfUrl = await generateTravelItineraryPDF(itineraryId, userId!, {
      destination: itinerary.destination,
      countries: (itinerary.countries as string[]) || [],
      duration: itinerary.duration,
      startDate: itinerary.startDate?.toISOString().split('T')[0] || '',
      endDate: itinerary.endDate?.toISOString().split('T')[0] || '',
      travelPurpose: itinerary.travelPurpose || 'tourism',
      budget: itinerary.budget || 'medium',
      itinerary: generatedData.itinerary,
      flightDetails: generatedData.flightDetails,
    });

    // Update database with generated itinerary
    await db
      .update(travelItineraries)
      .set({
        status: 'completed',
        itinerary: generatedData.itinerary,
        flightDetails: generatedData.flightDetails,
        itineraryPdfUrl: pdfUrl,
        completedAt: new Date(),
        processingTimeMinutes: processingTime || 1,
      })
      .where(eq(travelItineraries.id, itineraryId));

    console.log(`[Travel Itinerary] Generated successfully in ${processingTime} minutes`);

    res.json({
      success: true,
      data: {
        message: 'Itinerary generated successfully',
        itinerary: generatedData.itinerary,
        flightDetails: generatedData.flightDetails,
      },
    });
  } catch (error) {
    console.error('[Travel Itinerary] Generate error:', error);

    // Update status to failed
    const itineraryId = parseInt(req.params.id);
    await db
      .update(travelItineraries)
      .set({ status: 'failed' })
      .where(eq(travelItineraries.id, itineraryId));

    res.status(500).json({ success: false, error: 'Failed to generate itinerary' });
  }
});

// GET /api/travel-itinerary/:id
// Get itinerary details
router.get('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const itineraryId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [itinerary] = await db
      .select()
      .from(travelItineraries)
      .where(eq(travelItineraries.id, itineraryId))
      .limit(1);

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    if (itinerary.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    console.error('[Travel Itinerary] Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get itinerary' });
  }
});

// GET /api/travel-itinerary/:id/download
// Download itinerary PDF
router.get('/:id/download', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const itineraryId = parseInt(req.params.id);
    const userId = req.user?.id;

    const [itinerary] = await db
      .select()
      .from(travelItineraries)
      .where(eq(travelItineraries.id, itineraryId))
      .limit(1);

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    if (itinerary.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!itinerary.itineraryPdfUrl) {
      return res.status(404).json({ success: false, error: 'PDF not available yet' });
    }

    // TODO: Generate signed download URL or redirect to R2 URL
    res.json({
      success: true,
      data: { downloadUrl: itinerary.itineraryPdfUrl },
    });
  } catch (error) {
    console.error('[Travel Itinerary] Download error:', error);
    res.status(500).json({ success: false, error: 'Failed to download itinerary' });
  }
});

export default router;
