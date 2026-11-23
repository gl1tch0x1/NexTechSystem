'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const pollInterval = options.pollInterval || 15000; // 15s poll
  const autoPoll = options.autoPoll !== false;
  const isHeartbeating = useRef(false);

  // Derive current user representation
  const currentUserEntry = useMemo<OnlineStaffUser | null>(() => {
    if (!user || !role || !ALLOWED_STAFF_ROLES.has(role)) return null;
    return {
      id: user.id || 'admin',
      userId: user.id || 'admin',
      name: user.name || (role === 'ADMIN' ? 'Administrator' : role === 'PRODUCT_EDITOR' ? 'Product Editor' : 'Reseller Partner'),
      email: user.email || '',
      username: user.username || (user.email ? user.email.split('@')[0] : 'admin'),
      role: role as 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER',
      avatar: user.avatar || '',
      currentPath: pathname || '/admin',
      lastSeen: Date.now(),
      status: 'ONLINE',
    };
  }, [user, role, pathname]);

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

        // Ensure current active user is always included in the list
        if (currentUserEntry) {
          const hasCurrent = list.some(
            u =>
              u.id === currentUserEntry.id ||
              u.userId === currentUserEntry.id ||
              (currentUserEntry.email && u.email?.toLowerCase() === currentUserEntry.email.toLowerCase())
          );
          if (!hasCurrent) {
            list.unshift(currentUserEntry);
          }
        }

        setOnlineStaff(list);
      }
    } catch {
      // Preserve current list on transient fetch failures
    } finally {
      setIsLoading(false);
    }
  }, [token, role, currentUserEntry]);

  // Initial heartbeat and periodic presence pulse
  useEffect(() => {
    if (!token || !role || !ALLOWED_STAFF_ROLES.has(role)) return;

    // Send initial heartbeat immediately
    sendHeartbeat();
    if (autoPoll && (role === 'ADMIN' || role === 'PRODUCT_EDITOR')) {
      fetchOnlineStaff();
    }

    // Heartbeat timer (every 20 seconds)
    const heartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    }, 20000);

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

  // Combine fetched staff with current user to guarantee presence is never 0 when logged in
  const combinedStaff = useMemo(() => {
    const list = [...onlineStaff];
    if (currentUserEntry) {
      const exists = list.some(
        s =>
          s.id === currentUserEntry.id ||
          s.userId === currentUserEntry.id ||
          (currentUserEntry.email && s.email?.toLowerCase() === currentUserEntry.email.toLowerCase())
      );
      if (!exists) {
        list.unshift(currentUserEntry);
      }
    }
    return list;
  }, [onlineStaff, currentUserEntry]);

  const effectiveCount = Math.max(combinedStaff.length, currentUserEntry ? 1 : 0);

  return {
    onlineStaff: combinedStaff,
    onlineCount: effectiveCount,
    isLoading,
    refreshPresence: fetchOnlineStaff,
    sendHeartbeat,
  };
}
