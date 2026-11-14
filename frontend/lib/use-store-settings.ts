'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StoreSettings } from '@/types';
import type { HeaderNotification } from '@/components/layout/TopAnnouncementBar';

type ExtendedSettings = StoreSettings & {
  headerNotifications?: HeaderNotification[];
  notificationRotationSeconds?: number;
};

let cachedSettings: ExtendedSettings | null = null;
let fetchPromise: Promise<ExtendedSettings | null> | null = null;

export function useStoreSettings() {
  const [settings, setSettings] = useState<ExtendedSettings | null>(cachedSettings);
  const [loading, setLoading] = useState<boolean>(!cachedSettings);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/content/settings', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch settings from database');
      const json = await res.json();
      const data: StoreSettings = json.data || json;
      cachedSettings = data;
      setSettings(data);
      return data;
    } catch (err: any) {
      console.warn('[useStoreSettings] Notice: Fetching store settings from database:', err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
    } else {
      if (!fetchPromise) {
        fetchPromise = fetchSettings();
      }
      fetchPromise.then((data) => {
        if (data) {
          setSettings(data);
        }
        setLoading(false);
      });
    }

    // Listen for custom settings update events to sync instantly across components
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        cachedSettings = e.detail;
        setSettings(e.detail);
      } else {
        fetchSettings();
      }
    };

    window.addEventListener('store-settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('store-settings-updated', handleSettingsUpdated);
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    whatsappNumber: settings?.whatsappNumber || settings?.supportPhone?.replace(/[^0-9]/g, '') || '',
    inquiryEmail: settings?.inquiryEmail || settings?.supportEmail || '',
    storeName: settings?.storeName || '',
    supportPhone: settings?.supportPhone || '',
    supportEmail: settings?.supportEmail || '',
    isAnnouncementActive: settings?.isAnnouncementActive ?? true,
    announcementText: settings?.announcementText || '',
    headerNotifications: settings?.headerNotifications || [],
    notificationRotationSeconds: settings?.notificationRotationSeconds || 5,
    refreshSettings: fetchSettings,
  };
}

