'use client';

import { useState, useEffect } from 'react';
import { StoreSettings } from '@/types';

let cachedSettings: StoreSettings | null = null;
let fetchPromise: Promise<StoreSettings | null> | null = null;

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(cachedSettings);
  const [loading, setLoading] = useState<boolean>(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/api/content/settings')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch settings from database');
          const json = await res.json();
          const data: StoreSettings = json.data || json;
          cachedSettings = data;
          return data;
        })
        .catch((err) => {
          console.warn('[useStoreSettings] Notice: Fetching store settings from database:', err.message);
          return null;
        });
    }

    fetchPromise.then((data) => {
      if (data) {
        setSettings(data);
      }
      setLoading(false);
    });
  }, []);

  return {
    settings,
    loading,
    whatsappNumber: settings?.whatsappNumber || settings?.supportPhone?.replace(/[^0-9]/g, '') || '',
    inquiryEmail: settings?.inquiryEmail || settings?.supportEmail || '',
    storeName: settings?.storeName || '',
    supportPhone: settings?.supportPhone || '',
    supportEmail: settings?.supportEmail || '',
  };
}

