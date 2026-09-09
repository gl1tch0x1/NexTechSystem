import { Router, Request, Response } from 'express';
import { VatService } from '../services/vat.service.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

/**
 * GET /api/vat/summary
 * Returns UAE FTA VAT 201 periodic audit summary (Requires ADMIN authorization)
 */
router.get('/summary', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { periodStart, periodEnd } = req.query;
    const summary = await VatService.getVatReturnSummary(
      periodStart as string | undefined,
      periodEnd as string | undefined
    );
    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Could not calculate VAT summary',
    });
  }
});

export default router;
