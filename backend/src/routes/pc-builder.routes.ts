import { Router } from 'express';
import { pcBuilderController } from '../controllers/pc-builder.controller.js';

const router = Router();

router.get('/components', (req, res, next) => pcBuilderController.getComponents(req, res).catch(next));
router.post('/validate', (req, res, next) => pcBuilderController.validateCompatibility(req, res).catch(next));

export default router;
