import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res, next) => authController.register(req, res).catch(next));
router.post('/login', (req, res, next) => authController.login(req, res).catch(next));
router.post('/google', (req, res, next) => authController.googleAuth(req, res).catch(next));
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res).catch(next));
router.put('/profile', authenticate, (req, res, next) => authController.updateProfile(req, res).catch(next));

export default router;
