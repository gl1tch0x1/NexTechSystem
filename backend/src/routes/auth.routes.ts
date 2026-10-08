import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply dedicated authentication rate limiter to all auth routes globally
// (do NOT re-apply per-route to avoid double-counting against the same limit)
router.use(authLimiter);

router.post('/register', (req, res, next) => authController.register(req, res).catch(next));
router.post('/login', (req, res, next) => authController.login(req, res).catch(next));
router.get('/login', (_req, res) => {
  res.json({
    success: true,
    message: 'NexTech Authentication Gateway Active. Submit a POST request with email and password to authenticate.',
  });
});
router.post('/google', (req, res, next) => authController.googleAuth(req, res).catch(next));
router.post('/logout', (req, res, next) => authController.logout(req, res).catch(next));
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res).catch(next));
router.put('/profile', authenticate, (req, res, next) => authController.updateProfile(req, res).catch(next));
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res).catch(next));
router.delete(['/account', '/delete-account'], authenticate, (req, res, next) => authController.deleteAccount(req, res).catch(next));

// Password Reset & OTP Authorization routes
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res).catch(next));
router.post('/verify-reset-otp', (req, res, next) => authController.verifyResetOtp(req, res).catch(next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res).catch(next));

// Multi-Factor Authentication routes
router.post('/mfa/setup', authenticate, (req, res, next) => authController.setupMfa(req, res).catch(next));
router.post('/mfa/verify', authenticate, (req, res, next) => authController.verifyAndEnableMfa(req, res).catch(next));
router.post('/mfa/disable', authenticate, (req, res, next) => authController.disableMfa(req, res).catch(next));

export default router;
