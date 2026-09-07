import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { apiLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply rate limiter
router.use(apiLimiter);

// Public dynamic content endpoints
router.get('/homepage', contentController.getHomePageContent);
router.get('/hero', contentController.getHeroHighlights);
router.get('/hero-highlights', contentController.getHeroHighlights);
router.get('/solutions', contentController.getSolutions);
router.get('/benchmarks', contentController.getBenchmarks);
router.get('/testimonials', contentController.getTestimonials);
router.get('/features', contentController.getFeatures);
router.get('/builder-presets', contentController.getBuilderPresets);

export default router;

