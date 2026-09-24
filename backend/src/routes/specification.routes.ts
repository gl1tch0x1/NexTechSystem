import { Router, Request, Response } from 'express';
import { SPECIFICATION_FIELDS, SPECIFICATION_PRESETS } from '../constants/specifications.js';

const router = Router();

/**
 * GET /api/specifications
 * Returns all standardized hardware specification fields and taxonomy presets
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      fields: SPECIFICATION_FIELDS,
      presets: SPECIFICATION_PRESETS,
    },
  });
});

/**
 * GET /api/specifications/presets
 * Returns only the specification preset dictionary
 */
router.get('/presets', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: SPECIFICATION_PRESETS,
  });
});

/**
 * GET /api/specifications/fields
 * Returns all allowed specification field keys
 */
router.get('/fields', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: SPECIFICATION_FIELDS,
  });
});

export default router;
