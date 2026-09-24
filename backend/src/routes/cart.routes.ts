import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply rate limiter
router.use(apiLimiter);

router.post('/calculate', optionalAuthenticate, (req, res, next) => cartController.calculateCart(req, res).catch(next));
router.post('/coupon/validate', (req, res, next) => cartController.validateCoupon(req, res).catch(next));

export default router;

