import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/api';

// ── Metric definitions ──────────────────────────────────────────────────────

type MetricKey =
  | 'user_growth'
  | 'dau'
  | 'signups'
  | 'logins'
  | 'retention_45d'
  | 'price_checks'
  | 'savings'
  | 'lists'
  | 'chat_sessions'
  | 'landing_visits'
  | 'funnel';

interface MetricDef {
  key: MetricKey;
  label: string;
  description: string;
  chartType: 'area' | 'bar' | 'funnel';
  valuePrefix?: string;
  color: string;
}

const METRICS: MetricDef[] = [
  { key: 'user_growth',    label: 'User Growth',     description: 'Cumulative registered users',          chartType: 'area',   color: '#16a34a' },
  { key: 'dau',            label: 'Active Users',    description: 'Unique users per period',              chartType: 'bar',    color: '#2563eb' },
  { key: 'signups',        label: 'Signups',         description: 'New registrations per period',         chartType: 'bar',    color: '#8b5cf6' },
  { key: 'logins',         label: 'Logins',          description: 'Total login events per period',        chartType: 'bar',    color: '#0d9488' },
  { key: 'retention_45d',  label: 'Retention',       description: 'Users with 2+ logins in 45 days',     chartType: 'area',   color: '#ea580c' },
  { key: 'price_checks',   label: 'Price Checks',    description: 'Price check sessions per period',      chartType: 'bar',    color: '#0891b2' },
  { key: 'savings',        label: 'Savings',         description: 'Total savings generated per period',   chartType: 'area',   valuePrefix: '$', color: '#16a34a' },
  { key: 'lists',          label: 'Lists Created',   description: 'New grocery lists per period',         chartType: 'bar',    color: '#d97706' },
  { key: 'chat_sessions',  label: 'Chat Sessions',   description: 'AI conversations started per period',  chartType: 'bar',    color: '#7c3aed' },
  { key: 'landing_visits', label: 'Landing Visits',  description: 'Unique anonymous landing page visits', chartType: 'bar',    color: '#64748b' },
  { key: 'funnel',         label: 'Funnel',          description: 'Visit → Signup → List → Price Check',  chartType: 'funnel', color: '#16a34a' },
];

type Granularity = 'daily' | 'weekly' | 'monthly';
type RangeKey = '7' | '30' | '90' | '365';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7',   label: '7d' },
  { key: '30',  label: '30d' },
  { key: '90',  label: '90d' },
  { key: '365', label: '1y' },
];

const GRANS: { key: Granularity; label: string }[] = [
  { key: 'daily',   label: 'Day' },
  { key: 'weekly',  label: 'Week' },
  { key: 'monthly', label: 'Month' },
];

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  excludeAdmins: boolean;
}

const AdminAnalyticsChart: React.FC<Props> = ({ excludeAdmins }) => {
  const [metric, setMetric] = useState<MetricKey>('user_growth');
  const [gran, setGran] = useState<Granularity>('daily');
  const [range, setRange] = useState<RangeKey>('30');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const def = METRICS.find(m => m.key === metric)!;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (metric === 'funnel') {
        const res = await api.get(`/admin/analytics/funnel?days=${range}${excludeAdmins ? '&excludeAdmins=true' : ''}`);
        setData(res.data.steps || []);
      } else {
        const res = await api.get(
          `/admin/analytics/timeseries?metric=${metric}&granularity=${gran}&days=${range}${excludeAdmins ? '&excludeAdmins=true' : ''}`
        );
        setData(res.data || []);
      }
    } catch {
      setData([]);
    }
    setLoading(false);
  }, [metric, gran, range, excludeAdmins]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Format date labels
  const formatDate = (val: string) => {
    if (!val) return '';
    // Monthly: "2025-01" → "Jan 25"
    if (val.length === 7) {
      const [y, m] = val.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[parseInt(m, 10) - 1]} '${y.slice(2)}`;
    }
    // Daily/weekly: "2025-01-15" → "Jan 15"
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return val;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatValue = (v: number) => {
    if (def.valuePrefix === '$') return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return v.toLocaleString();
  };

  // Compute summary stat
  const summaryValue = (() => {
    if (!data.length) return '—';
    if (metric === 'funnel') {
      const first = (data as any)[0]?.value ?? 0;
      return first.toLocaleString();
    }
    if (metric === 'user_growth' || metric === 'retention_45d') {
      // Show latest value
      const last = data[data.length - 1]?.value ?? 0;
      return formatValue(last);
    }
    // Sum for additive metrics
    const total = data.reduce((s: number, d: any) => s + (d.value || 0), 0);
    return formatValue(total);
  })();

  const summaryLabel = (() => {
    if (metric === 'user_growth') return 'total users';
    if (metric === 'retention_45d') return 'retained users (latest)';
    if (metric === 'funnel') return `in last ${range}d`;
    return `in last ${range}d`;
  })();

  return (
    <div className="space-y-4">
      {/* ── Metric selector ── */}
      <div className="flex flex-wrap gap-1.5">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150
              ${metric === m.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{def.description}</div>
          {summaryValue && (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold tracking-tight">{summaryValue}</span>
              <span className="text-xs text-gray-400">{summaryLabel}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
            {/* Granularity — not applicable to funnel */}
            {metric !== 'funnel' && (
            <div className="flex rounded-md border border-gray-200 overflow-hidden">
              {GRANS.map(g => (
                <button
                  key={g.key}
                  onClick={() => setGran(g.key)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    gran === g.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            )}
            {/* Range */}
            <div className="flex rounded-md border border-gray-200 overflow-hidden">
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    range === r.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
      </div>

      {/* ── Chart area ── */}
      <div className="h-[280px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
        ) : metric === 'funnel' ? (
          <FunnelChart data={data} color={def.color} />
        ) : def.chartType === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={def.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={def.color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => def.valuePrefix === '$' ? `$${v}` : v.toLocaleString()}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                labelFormatter={(label: any) => formatDate(String(label))}
                formatter={(v: any) => [formatValue(Number(v)), def.label]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={def.color}
                strokeWidth={2}
                fill={`url(#grad-${metric})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => v.toLocaleString()}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                labelFormatter={(label: any) => formatDate(String(label))}
                formatter={(v: any) => [formatValue(Number(v)), def.label]}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              />
              <Bar
                dataKey="value"
                fill={def.color}
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ── Funnel sub-chart ─────────────────────────────────────────────────────────

const FUNNEL_COLORS = ['#16a34a', '#2563eb', '#8b5cf6', '#ea580c'];

const FunnelChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="h-full flex items-end gap-3 px-2 pb-6 pt-2">
      {data.map((step, i) => {
        const pct = max > 0 ? (step.value / max) * 100 : 0;
        const convRate = i > 0 && data[i - 1].value > 0
          ? ((step.value / data[i - 1].value) * 100).toFixed(0)
          : null;
        return (
          <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            {/* Conversion rate arrow */}
            {convRate !== null && (
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">
                {convRate}%
              </div>
            )}
            {/* Value */}
            <div className="text-sm font-bold" style={{ color: FUNNEL_COLORS[i] || '#64748b' }}>
              {step.value.toLocaleString()}
            </div>
            {/* Bar */}
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${Math.max(pct, 4)}%`,
                backgroundColor: FUNNEL_COLORS[i] || '#64748b',
                opacity: 0.8,
              }}
            />
            {/* Label */}
            <div className="text-[11px] text-gray-500 text-center leading-tight mt-1">
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminAnalyticsChart;
