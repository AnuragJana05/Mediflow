import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  Layers,
  RefreshCw,
  ArrowUpRight,
  Flame
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'custom'>('today');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnalytics(period);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1">
          <p className="font-bold font-mono text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-mono text-[11px]">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DisclaimerBanner compact />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Hospital Operational Capacity Analytics</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Historical bed occupancy dynamics, emergency department load, admission/discharge ratios, and turnover efficiency.
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {(['today', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Turnover Metrics Bar */}
      {analyticsData?.turnover_metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block">Bed Turnover Velocity</span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {analyticsData.turnover_metrics.bed_turnover_rate}
            </div>
            <span className="text-[10px] text-slate-500">Facility-wide benchmark</span>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block">Average Sanitization Cycle</span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {analyticsData.turnover_metrics.cleaning_cycle_avg}
            </div>
            <span className="text-[10px] text-slate-500">Discharge to Available</span>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block">Hourly Admission Velocity</span>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
              {analyticsData.turnover_metrics.admission_rate_hourly}
            </div>
            <span className="text-[10px] text-slate-500">Mean inflow intake rate</span>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <span className="text-slate-400 text-[11px] block">Critical Escalation Rate</span>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">
              {analyticsData.turnover_metrics.critical_escalation_rate}
            </div>
            <span className="text-[10px] text-slate-500">Step-up transfers to ICU</span>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bed Occupancy Trends Over Time */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Hospital Bed Occupancy Trends (%)</h3>
              <p className="text-[11px] text-slate-400">Overall hospital vs Intensive Care (ICU) load</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">Live Timeline</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData?.occupancy_history || []}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIcu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[40, 100]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="overall" name="Overall Hospital %" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorOverall)" />
                <Area type="monotone" dataKey="icu" name="ICU Acuity %" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIcu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Utilization Breakdown */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Department Resource Utilization (%)</h3>
              <p className="text-[11px] text-slate-400">Current bed occupancy grouped by clinical service</p>
            </div>
            <span className="text-xs font-mono text-purple-400 font-semibold">Service Load</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.department_utilization || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Utilization']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="utilization" name="Occupancy %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Average Waiting Time by Priority Acuity */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Average Waiting Time to Bed Allocation (Minutes)</h3>
              <p className="text-[11px] text-slate-400">Measured from triage arrival to bed confirmation</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">SLA Targets</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.wait_time_by_priority || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="priority" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} min`, 'Avg Wait']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="average_minutes" name="Actual Minutes" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                <Bar dataKey="target_minutes" name="SLA Target" fill="#334155" radius={[0, 6, 6, 0]} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: 24-Hour Peak Load Inflow Pressure Distribution */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">24-Hour Peak Hospital Inflow & Outflow Index</h3>
              <p className="text-[11px] text-slate-400">Diurnal patient arrival and discharge curve</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold">Peak Curve</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.peak_load_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="inflow" name="Admissions Inflow" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Discharges Outflow" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
