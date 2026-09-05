import { Router } from 'express';
import { walletController } from '../controllers/pc-builder.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, (req, res, next) => walletController.getWallet(req, res).catch(next));
router.post('/add-funds', authenticate, (req, res, next) => walletController.addFunds(req, res).catch(next));

export default router;
