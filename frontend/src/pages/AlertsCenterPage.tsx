import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Alert } from '../types';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Bell,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';

interface AlertsCenterPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AlertsCenterPage: React.FC<AlertsCenterPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAlerts({
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      await fetchAlerts();
    } catch (err: any) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'Active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'Acknowledged');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DisclaimerBanner compact />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Bell className="w-6 h-6 text-rose-400" />
            <span>Hospital Operations Alert Center</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time threshold surveillance for ICU saturation, critical patient waiting times, and asset deficits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Alerts</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Info">Info</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Acknowledged">Acknowledged</option>
          </select>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-rose-400 font-bold">{activeAlerts.length} Active Alerts</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{acknowledgedAlerts.length} Acknowledged</span>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3.5">
        {alerts.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No Operations Alerts Triggered</h3>
            <p className="text-xs text-slate-400">Hospital capacity thresholds and waiting queues are within normal operating parameters.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCrit = alert.severity === 'Critical';
            const isHigh = alert.severity === 'High';
            const isActive = alert.status === 'Active';

            const borderStyle = isCrit
              ? 'border-rose-600/70 bg-rose-950/20 shadow-lg shadow-rose-950/20'
              : isHigh
              ? 'border-orange-600/60 bg-orange-950/20'
              : 'border-slate-800 bg-slate-900/60';

            return (
              <div
                key={alert.id}
                className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderStyle}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                      isCrit ? 'bg-rose-950 text-rose-300 border border-rose-600 animate-pulse' : isHigh ? 'bg-orange-950 text-orange-300 border border-orange-600' : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {alert.severity} Acuity
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      {alert.type}
                    </span>

                    {alert.department && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {alert.department}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base">{alert.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{alert.message}</p>

                  {alert.acknowledged_at && (
                    <div className="text-[11px] text-slate-400 font-mono pt-1">
                      Acknowledged by {alert.acknowledged_by_name || 'Staff'} at {new Date(alert.acknowledged_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isActive ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
