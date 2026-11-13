'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { usePathname } from 'next/navigation';

export interface OnlineStaffUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER';
  avatar?: string;
  currentPath: string;
  lastSeen: number | string;
  status: 'ONLINE' | 'AWAY';
}

const ALLOWED_STAFF_ROLES = new Set(['ADMIN', 'PRODUCT_EDITOR', 'RESELLER']);

export function useStaffPresence(options: { pollInterval?: number; autoPoll?: boolean } = {}) {
  const { user, role, token } = useAuth();
  const pathname = usePathname();
  const [onlineStaff, setOnlineStaff] = useState<OnlineStaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollInterval = options.pollInterval || 20000; // 20s
  const autoPoll = options.autoPoll !== false;
  const isHeartbeating = useRef(false);

  // Send a heartbeat ping to register presence
  const sendHeartbeat = useCallback(async () => {
    if (!token || !user || !role || !ALLOWED_STAFF_ROLES.has(role)) return;
    if (isHeartbeating.current) return;

    try {
      isHeartbeating.current = true;
      const device =
        typeof window !== 'undefined' && window.innerWidth < 768
          ? 'mobile'
          : typeof window !== 'undefined' && window.innerWidth < 1024
          ? 'tablet'
          : 'desktop';

      await fetch('/api/admin/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPath: pathname || '/admin',
          device,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role,
            avatar: user.avatar,
          },
        }),
      });
    } catch {
      // Quiet fail on network glitches
    } finally {
      isHeartbeating.current = false;
    }
  }, [token, user, role, pathname]);

  // Fetch all currently online staff members
  const fetchOnlineStaff = useCallback(async () => {
    if (!token || !role || (role !== 'ADMIN' && role !== 'PRODUCT_EDITOR')) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/presence', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        const list: OnlineStaffUser[] = Array.isArray(json?.data) ? json.data : [];

        // Ensure current active user is included in the list
        if (user && ALLOWED_STAFF_ROLES.has(role)) {
          const hasCurrent = list.some(
            u => u.id === user.id || u.userId === user.id || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
          );
          if (!hasCurrent) {
            list.unshift({
              id: user.id,
              userId: user.id,
              name: user.name || (role === 'ADMIN' ? 'Administrator' : 'Product Editor'),
              email: user.email || '',
              username: user.username || 'admin',
              role: role as 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER',
              avatar: user.avatar || '',
              currentPath: pathname || '/admin',
              lastSeen: Date.now(),
              status: 'ONLINE',
            });
          }
        }

        setOnlineStaff(list);
      }
    } catch {
      // Preserve current list on transient fetch failures
    } finally {
      setIsLoading(false);
    }
  }, [token, role, user, pathname]);

  // Initial heartbeat and periodic presence pulse
  useEffect(() => {
    if (!token || !role || !ALLOWED_STAFF_ROLES.has(role)) return;

    // Send initial heartbeat
    sendHeartbeat();
    if (autoPoll && (role === 'ADMIN' || role === 'PRODUCT_EDITOR')) {
      fetchOnlineStaff();
    }

    // Heartbeat timer (every 30 seconds)
    const heartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    }, 30000);

    // Staff roster polling timer
    let pollTimer: NodeJS.Timeout | null = null;
    if (autoPoll && (role === 'ADMIN' || role === 'PRODUCT_EDITOR')) {
      pollTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchOnlineStaff();
        }
      }, pollInterval);
    }

    // Window focus / visibility listener to wake up immediately
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        if (autoPoll && (role === 'ADMIN' || role === 'PRODUCT_EDITOR')) {
          fetchOnlineStaff();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatTimer);
      if (pollTimer) clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [token, role, autoPoll, pollInterval, sendHeartbeat, fetchOnlineStaff]);

  return {
    onlineStaff,
    onlineCount: onlineStaff.length,
    isLoading,
    refreshPresence: fetchOnlineStaff,
    sendHeartbeat,
  };
}
