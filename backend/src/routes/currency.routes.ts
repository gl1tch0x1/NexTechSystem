import { Router, Request, Response } from 'express';
import { CurrencyService, SUPPORTED_CURRENCIES } from '../services/currency.service.js';

const router = Router();

/**
 * GET /api/currencies
 * Returns all supported storefront currencies, exchange rates against AED, and symbols
 */
router.get('/', async (_req: Request, res: Response) => {
  const currencies = await CurrencyService.getCurrencies();
  res.json({
    success: true,
    data: {
      baseCurrency: 'AED',
      currencies,
      rates: Object.fromEntries(
        currencies.map(cur => [cur.code, cur.rateAgainstAED])
      ),
    },
  });
});

export default router;
