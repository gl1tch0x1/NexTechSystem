import { UserRole } from '../types/index.js';

export interface OnlineStaffSession {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER';
  avatar?: string;
  currentPath: string;
  lastSeen: number; // Unix timestamp in ms
  device?: string;
  status: 'ONLINE' | 'AWAY';
}

const ALLOWED_STAFF_ROLES: Set<UserRole> = new Set(['ADMIN', 'PRODUCT_EDITOR', 'RESELLER']);
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes timeout

export class PresenceService {
  private sessions = new Map<string, OnlineStaffSession>();

  constructor() {
    // Periodically prune stale sessions every 60 seconds
    setInterval(() => {
      this.pruneStale();
    }, 60 * 1000).unref();
  }

  /**
   * Record or update heartbeat for an authenticated staff member.
   * Only RESELLER, PRODUCT_EDITOR, and ADMIN roles are accepted. Customers are ignored.
   */
  recordHeartbeat(
    user: {
      id: string;
      name?: string;
      email: string;
      username?: string;
      role: UserRole;
      avatar?: string;
    },
    currentPath = '/admin',
    device = 'desktop'
  ): OnlineStaffSession | null {
    if (!user || !user.id || !ALLOWED_STAFF_ROLES.has(user.role)) {
      return null;
    }

    const now = Date.now();
    const existing = this.sessions.get(user.id);

    const session: OnlineStaffSession = {
      id: user.id,
      userId: user.id,
      name: user.name || (user.role === 'ADMIN' ? 'Administrator' : user.role === 'PRODUCT_EDITOR' ? 'Product Editor' : 'Reseller Partner'),
      email: user.email,
      username: user.username || (user.email ? user.email.split('@')[0] : 'staff'),
      role: user.role as 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER',
      avatar: user.avatar || existing?.avatar || '',
      currentPath: currentPath || existing?.currentPath || '/admin',
      lastSeen: now,
      device: device || existing?.device || 'desktop',
      status: 'ONLINE',
    };

    this.sessions.set(user.id, session);
    return session;
  }

  /**
   * Retrieve list of currently online staff and verified resellers.
   * Only includes ADMIN, PRODUCT_EDITOR, and RESELLER users active within the last 3 minutes.
   */
  getOnlineStaff(): OnlineStaffSession[] {
    const now = Date.now();
    const activeList: OnlineStaffSession[] = [];

    for (const [userId, session] of this.sessions.entries()) {
      const elapsed = now - session.lastSeen;
      if (elapsed <= ONLINE_THRESHOLD_MS) {
        // Mark as away if inactive for > 90 seconds, otherwise online
        const status = elapsed > 90 * 1000 ? 'AWAY' : 'ONLINE';
        activeList.push({ ...session, status });
      } else {
        // Clean up expired session
        this.sessions.delete(userId);
      }
    }

    // Sort: ADMINs first, then PRODUCT_EDITORs, then RESELLERs, then by most recently active
    const rolePriority: Record<string, number> = {
      ADMIN: 1,
      PRODUCT_EDITOR: 2,
      RESELLER: 3,
    };

    return activeList.sort((a, b) => {
      const pA = rolePriority[a.role] || 99;
      const pB = rolePriority[b.role] || 99;
      if (pA !== pB) return pA - pB;
      return b.lastSeen - a.lastSeen;
    });
  }

  /**
   * Explicitly remove a session on signout
   */
  removeSession(userId: string): void {
    if (userId) {
      this.sessions.delete(userId);
    }
  }

  private pruneStale(): void {
    const now = Date.now();
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastSeen > ONLINE_THRESHOLD_MS) {
        this.sessions.delete(userId);
      }
    }
  }
}

export const presenceService = new PresenceService();
