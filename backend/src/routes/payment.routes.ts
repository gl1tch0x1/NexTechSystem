import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { orderLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Webhook endpoints (called asynchronously by Tamara & Tabby servers)
router.post('/tamara/webhook', (req, res) => paymentController.handleTamaraWebhook(req, res));
router.post('/tabby/webhook', (req, res) => paymentController.handleTabbyWebhook(req, res));

// Authenticated customer/client endpoints
router.post('/initiate', orderLimiter, authenticate, (req, res) =>
  paymentController.initiatePaymentSession(req, res)
);

router.get('/status/:orderId', authenticate, (req, res) =>
  paymentController.getPaymentStatus(req, res)
);

router.post('/verify', authenticate, (req, res) =>
  paymentController.verifyPayment(req, res)
);

export default router;
