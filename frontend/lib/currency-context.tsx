'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setActiveCurrency } from './utils';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rateAgainstAED: number;
  decimals: number;
  flag: string;
}

const DEFAULT_CURRENCIES: Record<string, CurrencyInfo> = {
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateAgainstAED: 1.0, decimals: 2, flag: '🇦🇪' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateAgainstAED: 0.2723, decimals: 2, flag: '🇺🇸' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rateAgainstAED: 1.0210, decimals: 2, flag: '🇸🇦' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateAgainstAED: 0.2341, decimals: 2, flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateAgainstAED: 0.2010, decimals: 2, flag: '🇬🇧' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', rateAgainstAED: 0.0841, decimals: 3, flag: '🇰🇼' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateAgainstAED: 25.85, decimals: 2, flag: '🇮🇳' },
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rateAgainstAED: 75.42, decimals: 2, flag: '🇵🇰' },
};

const FAWAZ_PRIMARY_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aed.json';
const FAWAZ_FALLBACK_API = 'https://latest.currency-api.pages.dev/v1/currencies/aed.json';

interface CurrencyContextType {
  currentCurrency: CurrencyInfo;
  availableCurrencies: CurrencyInfo[];
  setCurrency: (code: string) => void;
  formatPrice: (amountInAED: number, _optionalBaseCurrency?: string) => string;
  convertPrice: (amountInAED: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Record<string, CurrencyInfo>>(DEFAULT_CURRENCIES);
  const [selectedCode, setSelectedCode] = useState<string>('AED');

  // Helper to sync global utils and local storage
  const syncGlobalActive = useCallback((code: string, currentMap: Record<string, CurrencyInfo>) => {
    const active = currentMap[code] || currentMap.AED;
    setActiveCurrency({
      code: active.code,
      symbol: active.symbol,
      rate: active.rateAgainstAED,
      decimals: active.decimals,
    });
  }, []);

  useEffect(() => {
    // 1. Restore persisted selection from localStorage
    let initialCode = 'AED';
    try {
      const saved = localStorage.getItem('nextech_currency');
      if (saved && DEFAULT_CURRENCIES[saved]) {
        initialCode = saved;
        setSelectedCode(saved);
      }
    } catch {
      // Ignore
    }

    // 2. Fetch live real-time rates from backend or fawazahmed0/exchange-api
    const fetchRates = async () => {
      let aedRates: Record<string, number> | null = null;

      // Try internal backend first
      try {
        const res = await fetch('/api/currencies');
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.rates) {
            aedRates = json.data.rates;
          }
        }
      } catch {
        // Fallback to direct fawazahmed0/exchange-api
      }

      // If backend was not reached, query fawazahmed0/exchange-api directly
      if (!aedRates) {
        try {
          let res = await fetch(FAWAZ_PRIMARY_API);
          if (!res.ok) {
            res = await fetch(FAWAZ_FALLBACK_API);
          }
          if (res.ok) {
            const data = await res.json();
            if (data?.aed) {
              aedRates = data.aed;
            }
          }
        } catch (e) {
          console.warn('Could not reach exchange rate APIs, using fallback pegs:', e);
        }
      }

      if (aedRates) {
        setCurrencies(prev => {
          const updated = { ...prev };
          for (const [code, item] of Object.entries(updated)) {
            const lower = code.toLowerCase();
            const upper = code.toUpperCase();
            const rate = aedRates![lower] || aedRates![upper];
            if (typeof rate === 'number' && rate > 0) {
              updated[code] = {
                ...item,
                rateAgainstAED: Number(rate.toFixed(6)),
              };
            }
          }
          syncGlobalActive(initialCode, updated);
          return updated;
        });
      } else {
        syncGlobalActive(initialCode, DEFAULT_CURRENCIES);
      }
    };

    fetchRates();
  }, [syncGlobalActive]);

  const setCurrency = (code: string) => {
    if (currencies[code]) {
      setSelectedCode(code);
      syncGlobalActive(code, currencies);
    }
  };

  const currentCurrency = currencies[selectedCode] || currencies.AED;

  const convertPrice = (amountInAED: number): number => {
    const raw = (amountInAED || 0) * currentCurrency.rateAgainstAED;
    return Number(raw.toFixed(currentCurrency.decimals));
  };

  const formatPrice = (amountInAED: number): string => {
    const converted = convertPrice(amountInAED);
    return `${currentCurrency.symbol} ${converted.toLocaleString('en-US', {
      minimumFractionDigits: currentCurrency.decimals,
      maximumFractionDigits: currentCurrency.decimals,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        availableCurrencies: Object.values(currencies),
        setCurrency,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      currentCurrency: DEFAULT_CURRENCIES.AED,
      availableCurrencies: Object.values(DEFAULT_CURRENCIES),
      setCurrency: () => {},
      formatPrice: (amount: number, _opt?: string) => `AED ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      convertPrice: (amount: number) => amount || 0,
    };
  }
  return context;
}
