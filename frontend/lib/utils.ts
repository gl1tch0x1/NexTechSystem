import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ActiveCurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  decimals: number;
}

let activeCurrency: ActiveCurrencyConfig = {
  code: 'AED',
  symbol: 'AED',
  rate: 1.0,
  decimals: 2,
};

/**
 * Updates global active currency state and notifies browser listeners
 */
export function setActiveCurrency(config: ActiveCurrencyConfig) {
  activeCurrency = config;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('nextech_currency', config.code);
      localStorage.setItem('nextech_currency_rate', String(config.rate));
      localStorage.setItem('nextech_currency_symbol', config.symbol);
      localStorage.setItem('nextech_currency_decimals', String(config.decimals));
      window.dispatchEvent(new CustomEvent('nextech_currency_change', { detail: config }));
    } catch {
      // Ignore localStorage errors
    }
  }
}

/**
 * Gets the current active currency configuration (from memory or persisted storage)
 */
export function getActiveCurrency(): ActiveCurrencyConfig {
  if (typeof window !== 'undefined') {
    try {
      const code = localStorage.getItem('nextech_currency');
      const rate = Number(localStorage.getItem('nextech_currency_rate'));
      const symbol = localStorage.getItem('nextech_currency_symbol');
      const decimals = Number(localStorage.getItem('nextech_currency_decimals'));
      if (code && !isNaN(rate) && rate > 0) {
        activeCurrency = {
          code,
          symbol: symbol || code,
          rate,
          decimals: isNaN(decimals) ? 2 : decimals,
        };
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return activeCurrency;
}

/**
 * Dynamically formats price converted from AED into active storefront currency
 * @param amount Number in base currency (default: AED)
 * @param baseCurrency Source currency of the amount (default: AED)
 */
export function formatPrice(amount: number, baseCurrency = 'AED'): string {
  const current = getActiveCurrency();
  const num = amount || 0;
  
  // Convert from base currency (AED) using live exchange rate
  let convertedAmount = num;
  if (!baseCurrency || baseCurrency.toUpperCase() === 'AED') {
    convertedAmount = num * current.rate;
  }

  return `${current.symbol} ${convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: current.decimals,
    maximumFractionDigits: current.decimals,
  })}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
