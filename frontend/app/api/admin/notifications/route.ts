import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  const fallbackData = {
    notifications: [],
    unreadCount: 0,
    actionRequiredCount: 0,
    criticalCount: 0,
    lastSyncedAt: new Date().toISOString(),
  };

  return proxyToBackend(request, '/admin/notifications', { fallbackData });
}
