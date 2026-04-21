import api from '@/api';

const STORAGE_KEY = 'presence_session_id';
const CHANNEL_NAME = 'presence';

function getSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    try {
      // @ts-ignore
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // @ts-ignore
        id = crypto.randomUUID();
      } else {
        // Fallback UUID v4-ish
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
    } catch {
      id = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    }
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

function hasToken(): boolean {
  try {
    return !!localStorage.getItem('token');
  } catch {
    return false;
  }
}

export class PresenceManager {
  private bc: BroadcastChannel;
  private isLeader = false;
  private started = false;
  private tokenWatchTimer: number | null = null;
  // No timer field needed; we don't read it
  private pageResolver: () => string;

  constructor(getCurrentPath: () => string) {
    // Initialize channel if supported
    // @ts-ignore
    if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
      this.bc = new BroadcastChannel(CHANNEL_NAME);
      this.initLeaderElection();
    } else {
      // Fallback: no leader election, start heartbeats directly
      // @ts-ignore
      this.bc = undefined as any;
      this.isLeader = true;
      this.startHeartbeat();
    }
    this.pageResolver = getCurrentPath;
    this.bindVisibilityHandlers();
    // Safety: ensure heartbeat starts within a few seconds regardless of election
    setTimeout(() => {
      if (!this.started) {
        this.isLeader = true;
        this.startHeartbeat();
      }
    }, 3000);
  }

  private initLeaderElection() {
    const announce = () => this.bc.postMessage({ type: 'ping', ts: Date.now() });
    let lastSeen = Date.now();
    this.bc.onmessage = (ev) => {
      const msg = ev.data;
      if (msg?.type === 'ping') {
        lastSeen = Date.now();
      }
    };
    // If no pings for >1500ms, assume leadership
    setInterval(() => {
      if (Date.now() - lastSeen > 1500 && !this.isLeader) {
        this.isLeader = true;
        this.startHeartbeat();
      }
      announce();
    }, 1000);
  }

  private startHeartbeat() {
    if (this.started) return;
    // If not authenticated yet, watch for token then start
    if (!hasToken()) {
      if (this.tokenWatchTimer == null) {
        this.tokenWatchTimer = window.setInterval(() => {
          if (hasToken()) {
            if (this.tokenWatchTimer) window.clearInterval(this.tokenWatchTimer);
            this.tokenWatchTimer = null;
            this.startHeartbeat();
          }
        }, 1000);
      }
      return;
    }
    this.started = true;
    const send = async () => {
      try {
        await api.post('/presence/heartbeat', {
          session_id: getSessionId(),
          page: this.pageResolver(),
        });
      } catch (e) {
        console.warn('Presence heartbeat failed');
      }
    };
    send();
    window.setInterval(send, 10000); // 10s heartbeat
    // Poll admin online users KPI if present on page
    const kpiEl = document.getElementById('admin-kpi-online');
    if (kpiEl) {
      const poll = async () => {
        try {
          const res = await api.get('/admin/analytics/online-users?windowSeconds=60');
          const n = res.data?.distinct_users ?? '—';
          (kpiEl as any).innerText = String(n);
        } catch {}
      };
      poll();
      window.setInterval(poll, 30000);
    }
  }

  private async sendLeave() {
    try {
      if (!hasToken()) return; // Skip when unauthenticated
      const body = JSON.stringify({ session_id: getSessionId() });
      const url = (import.meta.env.VITE_API_URL || '/api') + '/presence/leave';
      if ('sendBeacon' in navigator) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        await api.post('/presence/leave', { session_id: getSessionId() });
      }
    } catch {}
  }

  private bindVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.isLeader) this.startHeartbeat();
      } else {
        // When hidden, proactively mark as not visible
        this.sendLeave();
      }
    });
    window.addEventListener('beforeunload', () => {
      this.sendLeave();
    });
  }
}


