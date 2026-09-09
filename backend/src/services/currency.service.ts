export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateAgainstAED: number; // 1 AED = X Currency
  decimals: number;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyRate> = {
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    rateAgainstAED: 1.0,
    decimals: 2,
    flag: '🇦🇪',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rateAgainstAED: 0.2723,
    decimals: 2,
    flag: '🇺🇸',
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    rateAgainstAED: 1.0210,
    decimals: 2,
    flag: '🇸🇦',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateAgainstAED: 0.2341,
    decimals: 2,
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rateAgainstAED: 0.2010,
    decimals: 2,
    flag: '🇬🇧',
  },
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'KWD',
    rateAgainstAED: 0.0841,
    decimals: 3,
    flag: '🇰🇼',
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    rateAgainstAED: 25.85,
    decimals: 2,
    flag: '🇮🇳',
  },
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    rateAgainstAED: 75.42,
    decimals: 2,
    flag: '🇵🇰',
  },
};

export class CurrencyService {
  private static lastFetched: number = 0;
  private static readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly PRIMARY_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aed.json';
  private static readonly FALLBACK_API = 'https://latest.currency-api.pages.dev/v1/currencies/aed.json';

  /**
   * Fetches latest exchange rates from fawazahmed0/exchange-api
   */
  public static async refreshRatesFromApi(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetched < this.CACHE_TTL_MS) {
      return; // Cache still valid
    }

    try {
      let res: any;
      try {
        res = await fetch(this.PRIMARY_API, { signal: AbortSignal.timeout(4000) });
      } catch {
        res = await fetch(this.FALLBACK_API, { signal: AbortSignal.timeout(4000) });
      }

      if (res && res.ok) {
        const data = await res.json();
        const aedRates = data?.aed;
        if (aedRates && typeof aedRates === 'object') {
          for (const [code, info] of Object.entries(SUPPORTED_CURRENCIES)) {
            const lowerCode = code.toLowerCase();
            if (aedRates[lowerCode] && typeof aedRates[lowerCode] === 'number') {
              info.rateAgainstAED = Number(aedRates[lowerCode].toFixed(6));
            }
          }
          this.lastFetched = now;
          console.log(`[CurrencyService] Live rates synchronized from fawazahmed0/exchange-api (USD: ${SUPPORTED_CURRENCIES.USD.rateAgainstAED}, EUR: ${SUPPORTED_CURRENCIES.EUR.rateAgainstAED}, SAR: ${SUPPORTED_CURRENCIES.SAR.rateAgainstAED})`);
        }
      }
    } catch (err: any) {
      console.warn('[CurrencyService] Failed to refresh live rates, using fallback rates:', err?.message);
    }
  }

  public static async getCurrencies(): Promise<CurrencyRate[]> {
    await this.refreshRatesFromApi();
    return Object.values(SUPPORTED_CURRENCIES);
  }

  public static convertFromAED(amountInAED: number, targetCurrency: string): number {
    const currency = SUPPORTED_CURRENCIES[targetCurrency.toUpperCase()] || SUPPORTED_CURRENCIES.AED;
    return Number((amountInAED * currency.rateAgainstAED).toFixed(currency.decimals));
  }

  public static convertToAED(amountInTarget: number, sourceCurrency: string): number {
    const currency = SUPPORTED_CURRENCIES[sourceCurrency.toUpperCase()] || SUPPORTED_CURRENCIES.AED;
    return Number((amountInTarget / currency.rateAgainstAED).toFixed(2));
  }
}

// Initial async fetch on startup
CurrencyService.refreshRatesFromApi().catch(() => {});
