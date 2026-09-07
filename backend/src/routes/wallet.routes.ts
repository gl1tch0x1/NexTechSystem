import { Router } from 'express';
import { walletController } from '../controllers/pc-builder.controller.js';
import { authenticate } from '../middleware/auth.js';
import { walletLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply dedicated financial rate limiter
router.use(walletLimiter);

router.get('/', walletLimiter, authenticate, (req, res, next) => walletController.getWallet(req, res).catch(next));
router.post('/add-funds', walletLimiter, authenticate, (req, res, next) => walletController.addFunds(req, res).catch(next));

export default router;

