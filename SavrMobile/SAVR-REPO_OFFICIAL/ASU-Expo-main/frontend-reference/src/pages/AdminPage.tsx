import React, { useEffect, useState } from 'react';
import api from '@/api';
import authService from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';
import { useLocation, Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';

// Eastern Time formatting helpers
const ET_TIMEZONE = 'America/Toronto';
function formatETDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const dt = new Date(value as any);
  if (isNaN(dt.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ET_TIMEZONE,
  }).format(dt);
}
function formatETDate(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const dt = new Date(value as any);
  if (isNaN(dt.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: ET_TIMEZONE,
  }).format(dt);
}

const Section: React.FC<{ title: string, open?: boolean, children: React.ReactNode }> = ({ title, open = false, children }) => {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <div className="border rounded-lg mb-3 bg-white overflow-visible">
      <button className="w-full flex items-center justify-between px-4 py-3 font-bold bg-gray-50" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="p-4 overflow-visible">
          {children}
        </div>
      )}
    </div>
  );
};

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [online, setOnline] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [excludeAdmins, setExcludeAdmins] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('adminExcludeAdmins');
      return v === '1' || v === 'true';
    } catch {
      return false;
    }
  });
  const fmt = (v: number | null | undefined) => v == null ? '—' : `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  // Authenticated CSV exports via axios (includes Authorization header)
  const exportCheapestStoresCsv = async () => {
    try {
      const url = `/admin/analytics/cheapest-stores?format=csv${excludeAdmins ? '&excludeAdmins=true' : ''}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      a.href = href;
      a.download = `cheapest_stores_${y}${m}${d}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.response?.data?.detail || 'Unable to export CSV right now.' });
    }
  };

  const exportStoreReliabilityCsv = async () => {
    try {
      const url = `/admin/analytics/store-reliability?format=csv&windowDays=30${excludeAdmins ? '&excludeAdmins=true' : ''}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      a.href = href;
      a.download = `store_reliability_${y}${m}${d}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.response?.data?.detail || 'Unable to export CSV right now.' });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const ov = await api.get(`/reports/overview${excludeAdmins ? '?excludeAdmins=true' : ''}`);
        setOverview(ov.data);
      } catch {}
      try {
        const ou = await api.get(`/admin/analytics/online-users?windowSeconds=60${excludeAdmins ? '&excludeAdmins=true' : ''}`);
        setOnline(ou.data);
        setIsAdmin(true); // admin endpoint succeeded
      } catch (e: any) {
        if (e?.response?.status === 403) {
          setIsAdmin(false);
          toast({ title: 'Unauthorized', description: 'You do not have admin access.'});
        }
      }
      try {
        const prof = await api.get('/auth/profile');
        if (typeof (prof.data as any)?.is_admin === 'boolean') {
          setIsAdmin(Boolean((prof.data as any)?.is_admin));
        }
      } catch {}
      setAdminLoading(false);
    };
    load();
    return () => {
      // No explicit dispose needed; presence manager uses page lifecycle
    };
  }, [excludeAdmins]);

  // Live-poll "Currently Online" so the KPI updates without manual refresh
  useEffect(() => {
    let timer: number | null = null;
    const poll = async () => {
      try {
        const ou = await api.get(`/admin/analytics/online-users?windowSeconds=60${excludeAdmins ? '&excludeAdmins=true' : ''}`);
        setOnline(ou.data);
      } catch {}
    };
    // Start immediate poll then continue every 15s
    poll();
    timer = window.setInterval(poll, 15000);
    return () => { if (timer) window.clearInterval(timer); };
  }, [excludeAdmins]);

  // Redirect non-admins
  const user = authService.getCurrentUser();
  const localIsAdmin = (user as any)?.is_admin === true;
  const effectiveAdmin = (isAdmin === null ? localIsAdmin : isAdmin === true);
  if (!effectiveAdmin) {
    return (<div className="p-6">{adminLoading ? 'Loading…' : 'Unauthorized'}</div>);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Administrator Portal</h1>
        <div className="flex items-center gap-3">
          <Link to="/admin/blog" className="border rounded px-3 py-1 text-sm font-medium hover:bg-gray-50">
            Blog Manager
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Switch
              checked={excludeAdmins}
              onCheckedChange={(checked) => {
                const next = Boolean(checked);
                setExcludeAdmins(next);
                try { localStorage.setItem('adminExcludeAdmins', next ? '1' : '0'); } catch {}
              }}
              aria-label="Exclude admin user data from dashboard"
            />
            <span>Exclude admin user data from dashboard</span>
          </div>
        </div>
      </div>

      <Section title="Dashboard" open>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">Total Users</div>
            <div className="text-2xl font-extrabold">{overview?.total_users ?? '—'}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">New Signups (This Month)</div>
            <div className="text-2xl font-extrabold">{overview?.new_signups_this_month ?? '—'}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">Visitors Today</div>
            <div className="text-2xl font-extrabold">{overview?.visitors_today ?? '—'}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">Currently Online</div>
            <div id="admin-kpi-online" className="text-2xl font-extrabold">{online?.distinct_users ?? '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">Total Lists</div>
            <div className="text-2xl font-extrabold">{overview?.total_grocery_lists ?? '—'}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">Total Savings (All Time)</div>
            <div className="text-2xl font-extrabold">{fmt(overview?.total_savings_amount)}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">Avg Savings / Active User</div>
            <div className="text-2xl font-extrabold">{fmt(overview?.average_savings_per_user)}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm">This Month's Savings</div>
            <div className="text-2xl font-extrabold">{fmt(overview?.this_month_savings)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 mt-3">
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm mb-2">Cheapest Stores</div>
            <CheapestStores excludeAdmins={excludeAdmins} />
            <div className="mt-2">
              <button className="text-sm underline" onClick={exportCheapestStoresCsv}>Export CSV</button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Searches">
        <SearchesCombined excludeAdmins={excludeAdmins} />
      </Section>

      <Section title="Stores">
        <div className="grid grid-cols-1 gap-3">
          <div className="border rounded-lg p-3">
            <div className="text-gray-600 text-sm mb-2">Store Reliability</div>
            <StoreReliability excludeAdmins={excludeAdmins} />
            <div className="mt-2">
              <button className="text-sm underline" onClick={exportStoreReliabilityCsv}>Export CSV</button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Users">
        <UsersPanel />
      </Section>

      <Section title="Settings">
        <BansPanel />
      </Section>
    </div>
  );
};

export default AdminPage;

const UsersPanel: React.FC = () => {
  const location = useLocation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [rows, setRows] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserLists, setSelectedUserLists] = useState<any[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUser, setSheetUser] = useState<any | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [userSort, setUserSort] = useState<{ key: 'username'|'status'|'online'|'last_login'|'login_count'|'lists_count'|'total_savings'; dir: 'asc'|'desc' }>({ key: 'username', dir: 'asc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('adminUsersPageSize');
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });

  useEffect(() => {
    if (openMenuUserId == null) return;
    const onDocClick = () => setOpenMenuUserId(null);
    const onKeyDown = (e: KeyboardEvent) => { if ((e as any).key === 'Escape') setOpenMenuUserId(null); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown as any);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown as any);
    };
  }, [openMenuUserId]);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('query', q);
      if (status !== 'all') params.set('status_filter', status);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const res = await api.get(`/admin/users?${params.toString()}`);
      
      // Safety checks for response data
      if (res.data && Array.isArray(res.data.users)) {
        setRows(res.data.users);
        setTotalUsers(res.data.total || 0);
      } else {
        setRows([]);
        setTotalUsers(0);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setRows([]);
      setTotalUsers(0);
      toast({ title: 'Error', description: 'Failed to load users. Please try again.' });
    }
  };

  // Auto-search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 1000);
    return () => clearTimeout(timer);
  }, [q, status]);

  // Load when page or pageSize changes
  useEffect(() => {
    load();
  }, [page, pageSize]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [q, status]);

  // Close any open row action menu when navigating to another route
  useEffect(() => {
    setOpenMenuUserId(null);
  }, [location.pathname]);

  // Default sorting: when filtering to Active, sort by Online desc; otherwise Username asc
  useEffect(() => {
    if (status === 'active') {
      setUserSort({ key: 'online', dir: 'desc' });
    } else {
      setUserSort({ key: 'username', dir: 'asc' });
    }
  }, [status]);

  const selectUser = async (userId: string) => {
    setOpenMenuUserId(null);
    setSelectedUserId(userId);
    setSelectedUserLists(null);
    try {
      const res = await api.get(`/admin/users/${userId}/lists`);
      setSelectedUserLists(res.data);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.detail || 'Failed to load lists' });
    }
  };

  const action = async (id: string, kind: string) => {
    const map: Record<string, string> = {
      reset: 'reset-password',
      deactivate: 'deactivate',
      reactivate: 'reactivate',
      force: 'force-logout',
      delete: '',
    };
    try {
      if (kind === 'delete') {
        if (!confirm('Delete this user and cascade their data?')) return;
        const reason = prompt('Optional reason for audit log (leave blank to skip)') || undefined;
        const url = reason ? `/admin/users/${id}?reason=${encodeURIComponent(reason)}` : `/admin/users/${id}`;
        await api.delete(url);
      } else {
        const reason = (kind === 'deactivate' || kind === 'force') ? (prompt('Optional reason for audit log (leave blank to skip)') || undefined) : undefined;
        await api.post(`/admin/users/${id}/${map[kind]}`, reason ? { reason } : undefined);
      }
      toast({ title: 'Success', description: 'Action completed.' });
      await load();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.response?.data?.detail || 'Request failed' });
    }
  };

  const setUserSortKey = (key: 'username'|'status'|'online'|'last_login'|'login_count'|'lists_count'|'total_savings') => {
    setUserSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };
  const userSortIndicator = (key: 'username'|'status'|'online'|'last_login'|'login_count'|'lists_count'|'total_savings') => (
    userSort.key === key ? (userSort.dir === 'asc' ? ' ▲' : ' ▼') : ''
  );
  const sortedUsers = (() => {
    // Safety check: ensure rows is an array
    if (!Array.isArray(rows)) {
      return [];
    }
    
    const dir = userSort.dir === 'asc' ? 1 : -1;
    const boolVal = (v: boolean | undefined | null) => (v ? 1 : 0);
    const tsVal = (v: string | null | undefined) => v ? new Date(v).getTime() : (userSort.dir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    return [...rows].sort((a, b) => {
      switch (userSort.key) {
        case 'username': {
          const av = (a.username || '').toLowerCase();
          const bv = (b.username || '').toLowerCase();
          return av.localeCompare(bv) * dir;
        }
        case 'status':
          return (boolVal(b.is_active) - boolVal(a.is_active)) * dir * -1; // active > inactive when desc
        case 'online':
          return (boolVal(a.is_online) - boolVal(b.is_online)) * dir;
        case 'last_login':
          return (tsVal(a.last_login_at) - tsVal(b.last_login_at)) * dir;
        case 'login_count':
          return ((a.login_count ?? 0) - (b.login_count ?? 0)) * dir;
        case 'lists_count':
          return ((a.lists_count ?? 0) - (b.lists_count ?? 0)) * dir;
        case 'total_savings':
          return ((a.total_savings ?? 0) - (b.total_savings ?? 0)) * dir;
        default:
          return 0;
      }
    });
  })();

  // Pagination calculations (now using server-side data)
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const currentPageUsers = sortedUsers; // Server already returns the current page
  const startIndex = totalUsers > 0 ? page * pageSize + 1 : 0;
  const endIndex = Math.min((page + 1) * pageSize, totalUsers);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    try {
      localStorage.setItem('adminUsersPageSize', String(newSize));
    } catch {}
  };

  const exportUsersCsv = async () => {
    // Export all filtered users (not just current page) - fetch all without pagination
    try {
      const params = new URLSearchParams();
      if (q) params.set('query', q);
      if (status !== 'all') params.set('status_filter', status);
      params.set('page', '0');
      params.set('pageSize', '999999'); // Get all users
      const res = await api.get(`/admin/users?${params.toString()}`);
      const allUsers = res.data.users;
      
      const lines: string[] = ["username,email,status,online,last_login,login_count,lists_count,total_savings"];
      for (const r of allUsers) {
        const username = (r.username || '').replace(/"/g, '""');
        const email = (r.email || '').replace(/"/g, '""');
        const status = r.is_active ? 'Active' : 'Inactive';
        const online = r.is_online ? 'Yes' : 'No';
        const lastLogin = formatETDateTime(r.last_login_at);
        const loginCount = r.login_count ?? 0;
        const listsCount = (r as any).lists_count ?? 0;
        const totalSavings = typeof (r as any).total_savings === 'number' ? (r as any).total_savings.toFixed(2) : '0.00';
        lines.push(`"${username}","${email}",${status},${online},"${lastLogin}",${loginCount},${listsCount},${totalSavings}`);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      a.href = href;
      a.download = `users_${y}${m}${d}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.response?.data?.detail || 'Unable to export CSV right now.' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="username or email" className="border rounded px-2 py-1" />
        <label className="text-sm font-medium">Status:</label>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="all">All Users</option>
          <option value="active">Active Users</option>
          <option value="inactive">Inactive Users (Suspended)</option>
        </select>
      </div>
      <div className="text-xs text-gray-500">
        Active users can log in. Inactive users are suspended and cannot authenticate.
      </div>
      {/* Desktop table */}
      <div className="hidden md:block border rounded">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('username')}>Username{userSortIndicator('username')}</th>
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('status')}>Status{userSortIndicator('status')}</th>
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('online')}>Online{userSortIndicator('online')}</th>
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('last_login')}>Last Login{userSortIndicator('last_login')}</th>
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('login_count')}>Login Count{userSortIndicator('login_count')}</th>
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('lists_count')}>Lists{userSortIndicator('lists_count')}</th>
              <th className="p-2 cursor-pointer select-none whitespace-nowrap" onClick={()=>setUserSortKey('total_savings')}>Total Savings{userSortIndicator('total_savings')}</th>
              <th className="p-2 w-8"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {currentPageUsers.map(r => (
              <tr key={r.id} className="border-t cursor-pointer" onClick={()=>selectUser(r.id)}>
                <td className="p-2">{r.username || '—'}</td>
                <td className="p-2">{r.is_active ? 'Active' : 'Inactive'}</td>
                <td className="p-2">
                  <span className={`inline-flex items-center gap-1 ${r.is_online ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${r.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    {r.is_online ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="p-2">{formatETDateTime(r.last_login_at)}</td>
                <td className="p-2">{r.login_count ?? 0}</td>
                <td className="p-2">{(r as any).lists_count ?? 0}</td>
                <td className="p-2">{typeof (r as any).total_savings === 'number' ? `$${(r as any).total_savings.toFixed(2)}` : '—'}</td>
                <td className="p-2">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={(e)=>{ e.stopPropagation(); setOpenMenuUserId(prev => prev === r.id ? null : r.id); }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                      aria-haspopup="menu"
                      aria-label="Actions"
                      aria-expanded={openMenuUserId === r.id}
                    >
                      ⋮
                    </button>
                    {openMenuUserId === r.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border rounded shadow z-10" role="menu" onClick={(e)=>e.stopPropagation()}>
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>{ e.stopPropagation(); action(r.id,'reset'); setOpenMenuUserId(null); }}>Reset Password</button>
                        {r.is_active ? (
                          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>{ e.stopPropagation(); action(r.id,'deactivate'); setOpenMenuUserId(null); }}>Deactivate</button>
                        ) : (
                          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>{ e.stopPropagation(); action(r.id,'reactivate'); setOpenMenuUserId(null); }}>Reactivate</button>
                        )}
                        <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={(e)=>{ e.stopPropagation(); action(r.id,'force'); setOpenMenuUserId(null); }}>Force Logout</button>
                        <button className="block w-full text-left px-3 py-2 hover:bg-red-50 text-red-600" onClick={(e)=>{ e.stopPropagation(); action(r.id,'delete'); setOpenMenuUserId(null); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls for desktop */}
      <div className="hidden md:flex flex-wrap items-center gap-2 mt-2">
        <button 
          onClick={() => setPage(p => Math.max(0, p - 1))} 
          disabled={page === 0}
          className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <div className="text-sm">Page {page + 1} of {totalPages}</div>
        <button 
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
          disabled={page >= totalPages - 1}
          className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
        <select 
          value={pageSize} 
          onChange={e => handlePageSizeChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="150">150</option>
        </select>
        <span className="text-sm">per page</span>
        <div className="flex-1" />
        <span className="text-sm text-gray-600">
          Showing {startIndex}-{endIndex} of {totalUsers} users
        </span>
        <button className="text-sm underline" onClick={exportUsersCsv}>Export CSV</button>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {currentPageUsers.map(r => (
          <div key={r.id} className="border rounded p-3">
            <div className="font-semibold">{r.username || r.email || '—'} <span className="text-gray-500 text-sm">({r.is_active ? 'Active' : 'Inactive'})</span></div>
            <div className="text-sm text-gray-600 mt-1">
              <div>Last login: {formatETDateTime(r.last_login_at)}</div>
              <div>Logins: {r.login_count ?? 0}</div>
              <div>Online: {r.is_online ? 'Yes' : 'No'}</div>
            </div>
            <div className="mt-2">
              <button
                className="border rounded px-3 py-1 w-full"
                onClick={() => { setSheetUser(r); setSheetOpen(true); }}
                aria-haspopup="dialog"
                aria-controls="user-actions-sheet"
              >
                Actions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls for mobile */}
      <div className="md:hidden space-y-2 mt-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))} 
            disabled={page === 0}
            className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ← Prev
          </button>
          <div className="text-sm flex-1 text-center">Page {page + 1} of {totalPages}</div>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
            disabled={page >= totalPages - 1}
            className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next →
          </button>
        </div>
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <select 
              value={pageSize} 
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="150">150</option>
            </select>
            <span className="text-sm">per page</span>
          </div>
          <button className="text-sm underline" onClick={exportUsersCsv}>Export CSV</button>
        </div>
        <div className="text-sm text-gray-600 text-center">
          Showing {startIndex}-{endIndex} of {totalUsers} users
        </div>
      </div>

      {/* Bottom Sheet for mobile actions */}
      {sheetOpen && sheetUser && (
        <div>
          <div className="fixed inset-0 bg-black/40" onClick={()=>setSheetOpen(false)} aria-hidden="true"></div>
          <div
            id="user-actions-sheet"
            role="dialog"
            aria-modal="true"
            className="fixed left-0 right-0 bottom-0 bg-white rounded-t-xl shadow-xl p-3 space-y-2"
          >
            <div className="font-semibold">User Actions</div>
            <button className="border rounded px-3 py-2 w-full text-left" onClick={()=>{ action(sheetUser.id,'reset'); setSheetOpen(false); }}>Reset Password</button>
            {sheetUser.is_active ? (
              <button className="border rounded px-3 py-2 w-full text-left" onClick={()=>{ action(sheetUser.id,'deactivate'); setSheetOpen(false); }}>Deactivate</button>
            ) : (
              <button className="border rounded px-3 py-2 w-full text-left" onClick={()=>{ action(sheetUser.id,'reactivate'); setSheetOpen(false); }}>Reactivate</button>
            )}
            <button className="border rounded px-3 py-2 w-full text-left" onClick={()=>{ action(sheetUser.id,'force'); setSheetOpen(false); }}>Force Logout</button>
            <button className="border rounded px-3 py-2 w-full text-left text-red-600 border-red-400" onClick={()=>{ action(sheetUser.id,'delete'); setSheetOpen(false); }}>Delete</button>
            <button className="border rounded px-3 py-2 w-full" onClick={()=>setSheetOpen(false)}>Close</button>
          </div>
        </div>
      )}
      {selectedUserId && selectedUserLists && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Selected User – Lists</div>
          <div className="border rounded">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="p-2">List Name</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Savings</th>
                  <th className="p-2">Least Expensive Store</th>
                </tr>
              </thead>
              <tbody>
                {(selectedUserLists || []).map(l => (
                  <tr key={l.id} className="border-t">
                    <td className="p-2">{l.name}</td>
                    <td className="p-2">{formatETDate(l.created_at)}</td>
                    <td className="p-2">{typeof l.savings === 'number' ? `$${l.savings.toFixed(2)}` : '—'}</td>
                    <td className="p-2">{l.least_expensive_store_name || '—'}</td>
                  </tr>
                ))}
                {selectedUserLists && selectedUserLists.length === 0 && (
                  <tr><td className="p-2" colSpan={4}>No lists</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const BansPanel: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [type, setType] = useState<'email'|'domain'>('domain');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    const res = await api.get('/admin/bans');
    setRows(res.data);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    await api.post('/admin/bans', { type, value, reason, notes });
    setValue(''); setReason(''); setNotes('');
    await load();
  };
  const remove = async (id: string) => {
    await api.delete(`/admin/bans/${id}`);
    await load();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={type} onChange={e=>setType(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="domain">domain</option>
          <option value="email">email</option>
        </select>
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="example.com or user@x.com" className="border rounded px-2 py-1" />
        <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="reason" className="border rounded px-2 py-1" />
        <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="notes" className="border rounded px-2 py-1" />
        <button onClick={add} className="border rounded px-3 py-1 bg-green-600 text-white">Add Ban</button>
      </div>
      <div className="border rounded">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-2">Type</th>
              <th className="p-2">Value</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.value}</td>
                <td className="p-2">{r.reason || '—'}</td>
                <td className="p-2">{formatETDateTime(r.created_at)}</td>
                <td className="p-2">
                  <button onClick={()=>remove(r.id)} className="border rounded px-2 py-1 text-red-600 border-red-400">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const CheapestStores: React.FC<{ excludeAdmins?: boolean }> = ({ excludeAdmins = false }) => {
  const [rows, setRows] = useState<{ store: string; wins?: number; lists?: number; win_rate: number; avg_list_price?: number }[]>([]);
  const [sort, setSort] = useState<{ key: 'store'|'wins'|'lists'|'win_rate'|'avg_list_price'; dir: 'asc'|'desc' }>({ key: 'win_rate', dir: 'desc' });
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/analytics/cheapest-stores?windowDays=30${excludeAdmins ? '&excludeAdmins=true' : ''}`);
        setRows(res.data);
      } catch {}
    })();
  }, [excludeAdmins]);
  const setSortKey = (key: 'store'|'wins'|'lists'|'win_rate'|'avg_list_price') => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };
  const sortIndicator = (key: 'store'|'wins'|'lists'|'win_rate'|'avg_list_price') => (
    sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
  );
  const sortedRows = (() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const getNum = (r: { [k: string]: any }, key: string) => {
      const v = r[key];
      return typeof v === 'number' ? v : (sort.dir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    };
    const getStr = (r: { store: string }) => (r.store || '').toLowerCase();
    return [...rows].sort((a, b) => {
      if (sort.key === 'store') return getStr(a).localeCompare(getStr(b)) * dir;
      return (getNum(a, sort.key) - getNum(b, sort.key)) * dir;
    });
  })();
  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="p-2 cursor-pointer select-none" onClick={()=>setSortKey('store')}>Store{sortIndicator('store')}</th>
            <th className="p-2 cursor-pointer select-none" onClick={()=>setSortKey('wins')}>Wins{sortIndicator('wins')}</th>
            <th className="p-2 cursor-pointer select-none" onClick={()=>setSortKey('lists')}>Lists{sortIndicator('lists')}</th>
            <th className="p-2 cursor-pointer select-none" onClick={()=>setSortKey('win_rate')}>Win-Rate{sortIndicator('win_rate')}</th>
            <th className="p-2 cursor-pointer select-none" onClick={()=>setSortKey('avg_list_price')}>Avg List Price{sortIndicator('avg_list_price')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r, i) => (
            <tr key={i} className="border-t"><td className="p-2">{r.store}</td><td className="p-2">{r.wins ?? 0}</td><td className="p-2">{r.lists ?? 0}</td><td className="p-2">{r.win_rate}%</td><td className="p-2">{r.avg_list_price ? `$${r.avg_list_price.toFixed(2)}` : '—'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const StoreReliability: React.FC<{ excludeAdmins?: boolean }> = ({ excludeAdmins = false }) => {
  const [data, setData] = useState<{ overall: { total: number; completed: number; success_rate: number }, per_store: { store: string; results: number }[] } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/analytics/store-reliability?windowDays=30${excludeAdmins ? '&excludeAdmins=true' : ''}`);
        setData(res.data);
      } catch {}
    })();
  }, [excludeAdmins]);
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Overall success rate: {data ? `${data.overall.success_rate.toFixed(1)}%` : '—'}</div>
      <div>
        <table className="w-full">
          <thead><tr className="text-left"><th className="p-2">Store</th><th className="p-2">Results Observed</th></tr></thead>
          <tbody>
            {data?.per_store?.map((r, i) => (
              <tr key={i} className="border-t"><td className="p-2">{r.store}</td><td className="p-2">{r.results}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Combined Searches table with sorting and pagination
const SearchesCombined: React.FC<{ excludeAdmins?: boolean }> = ({ excludeAdmins = false }) => {
  const [top, setTop] = useState<{ term: string; count: number }[]>([]);
  const [avg, setAvg] = useState<{ item: string; avg_price: number | null }[]>([]);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: 'item'|'count'|'avg_price'; dir: 'asc'|'desc' }>({ key: 'count', dir: 'desc' });
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('adminSearchesPageSize');
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          api.get(`/admin/analytics/top-searches?limit=1000${excludeAdmins ? '&excludeAdmins=true' : ''}`),
          api.get(`/admin/analytics/avg-item-prices${excludeAdmins ? '?excludeAdmins=true' : ''}`),
        ]);
        setTop(r1.data || []);
        setAvg(r2.data || []);
      } catch {}
    })();
  }, [excludeAdmins]);

  const merged = (() => {
    const avgMap = new Map<string, number | null>();
    for (const a of avg) avgMap.set((a.item || '').toLowerCase(), a.avg_price);
    return top.map(t => {
      const key = (t.term || '').toLowerCase();
      return { item: t.term, count: t.count, avg_price: avgMap.get(key) ?? null };
    });
  })();

  const sorted = [...merged].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (sort.key === 'item') return a.item.localeCompare(b.item) * dir;
    if (sort.key === 'count') return ((a.count ?? 0) - (b.count ?? 0)) * dir;
    const av = a.avg_price ?? -Infinity, bv = b.avg_price ?? -Infinity;
    return (av - bv) * dir;
  });

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const startIndex = totalItems > 0 ? page * pageSize + 1 : 0;
  const endIndex = Math.min((page + 1) * pageSize, totalItems);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    try {
      localStorage.setItem('adminSearchesPageSize', String(newSize));
    } catch {}
  };

  const setSortKey = (key: 'item'|'count'|'avg_price') => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const exportCsv = () => {
    // Export the full sorted dataset (not just current page)
    const lines: string[] = ["item,count,avg_price"]; 
    for (const r of sorted) {
      const price = r.avg_price != null ? r.avg_price.toFixed(2) : '';
      const escapedItem = (r.item || '').replace(/"/g, '""');
      // Quote the item field to be safe with commas
      lines.push(`"${escapedItem}",${r.count ?? 0},${price}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    a.href = href;
    a.download = `searches_combined_${y}${m}${d}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="text-gray-600 text-sm mb-2">Top Searches & Average Price per Item</div>
      <div>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-2 cursor-pointer" onClick={()=>setSortKey('item')}>Item</th>
              <th className="p-2 cursor-pointer" onClick={()=>setSortKey('count')}>Count</th>
              <th className="p-2 cursor-pointer" onClick={()=>setSortKey('avg_price')}>Avg Price</th>
            </tr>
          </thead>
          <tbody>
            {current.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.item}</td>
                <td className="p-2">{r.count}</td>
                <td className="p-2">{r.avg_price != null ? `$${r.avg_price.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <button 
          className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={() => setPage(p => Math.max(0, p - 1))} 
          disabled={page === 0}
        >
          ← Prev
        </button>
        <div className="text-sm">Page {page + 1} of {totalPages}</div>
        <button 
          className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
          disabled={page >= totalPages - 1}
        >
          Next →
        </button>
        <select 
          value={pageSize} 
          onChange={e => handlePageSizeChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="150">150</option>
        </select>
        <span className="text-sm">per page</span>
        <div className="flex-1" />
        <span className="text-sm text-gray-600">
          Showing {startIndex}-{endIndex} of {totalItems} items
        </span>
        <button className="text-sm underline" onClick={exportCsv}>Export CSV</button>
      </div>
    </div>
  );
};


