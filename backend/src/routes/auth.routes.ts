import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply dedicated authentication rate limiter
router.use(authLimiter);

router.post('/register', authLimiter, (req, res, next) => authController.register(req, res).catch(next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res).catch(next));
router.get('/login', (req, res) => {
  res.json({
    success: true,
    message: 'NexTech Authentication Gateway Active. Submit a POST request with email and password to authenticate.',
  });
});
router.post('/google', authLimiter, (req, res, next) => authController.googleAuth(req, res).catch(next));
router.get('/me', authLimiter, authenticate, (req, res, next) => authController.getCurrentUser(req, res).catch(next));
router.put('/profile', authLimiter, authenticate, (req, res, next) => authController.updateProfile(req, res).catch(next));

export default router;

