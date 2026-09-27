import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardSummary, Patient, AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  BedDouble,
  Users,
  AlertTriangle,
  Clock,
  Activity,
  ArrowUpRight,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Cpu
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { lastEvent } = useWebSocket();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const [sumData, ptsData, logsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getPatients({ status: 'Awaiting Bed' }),
        api.getAuditLogs({ limit: 6 })
      ]);
      setSummary(sumData);
      setWaitingPatients(ptsData);
      setRecentLogs(logsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh when WebSocket fires relevant operational events
  useEffect(() => {
    if (lastEvent) {
      fetchDashboardData();
    }
  }, [lastEvent]);

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm font-mono">Loading Real-Time Hospital Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Disclaimer */}
      <DisclaimerBanner />

      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight flex items-center gap-3">
            Hospital Operations Command Center
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
              Live Real-Time
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Centralized capacity visibility, triage urgency detection, and automated compatible bed allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('patients', { openRegister: true })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-xs shadow-lg shadow-cyan-600/20 hover:brightness-110 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Intake Patient</span>
          </button>

          <button
            onClick={() => onNavigate('simulation')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-300 font-medium text-xs hover:bg-amber-900/50 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Surge Simulator</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Beds */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Beds</span>
            <BedDouble className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{summary?.total_beds || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{summary?.available_beds || 0}</span> available now
          </div>
        </div>

        {/* Available Beds */}
        <div className="glass-card p-4 rounded-2xl border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">{summary?.available_beds || 0}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Ready for allocation
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="glass-card p-4 rounded-2xl border-rose-500/30 bg-rose-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Occupied</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300">{summary?.occupied_beds || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.overall_occupancy_rate}% total capacity
          </div>
        </div>

        {/* Cleaning Beds */}
        <div className="glass-card p-4 rounded-2xl border-amber-500/30 bg-amber-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">In Cleaning</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{summary?.cleaning_beds || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sanitization in progress
          </div>
        </div>

        {/* Waiting Patients */}
        <div className="glass-card p-4 rounded-2xl border-cyan-500/30 bg-cyan-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Waiting Queue</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">{summary?.waiting_patients || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-red-400 font-bold">{summary?.critical_patients_waiting || 0} critical</span>
          </div>
        </div>

        {/* Average Wait Time */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Avg Wait</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{summary?.average_wait_time_minutes || 0}m</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Target &lt; 30m
          </div>
        </div>
      </div>

      {/* Middle Section: Department Occupancy Progress & High-Priority Waiting Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Utilization Breakdown */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">Department Occupancy & Capacity Pressure</h2>
              <p className="text-xs text-slate-400">Real-time status across acute and intensive care wings</p>
            </div>
            <button
              onClick={() => onNavigate('bed-map')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Interactive Bed Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {summary?.departments.map((dept) => {
              const isHigh = dept.occupancy_rate >= 80;
              const isCrit = dept.occupancy_rate >= 90;
              const barColor = isCrit
                ? 'bg-rose-500'
                : isHigh
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              return (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-xs">{dept.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {dept.code}
                      </span>
                    </div>
                    <span className={`text-xs font-bold font-mono ${isCrit ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {dept.occupancy_rate}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(dept.occupancy_rate, 100)}%` }}
                    />
                  </div>

                  {/* Bed Breakdown pills */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400 font-medium">{dept.available_beds} Available</span>
                    <span>{dept.occupied_beds} Occupied</span>
                    {dept.cleaning_beds > 0 && <span className="text-amber-400">{dept.cleaning_beds} Clean</span>}
                    <span>{dept.total_beds} Total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Patients Waiting for Bed */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Patients Awaiting Bed
                  {waitingPatients.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                      {waitingPatients.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">Prioritized by clinical acuity & triage assessment</p>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {waitingPatients.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                  All waiting patients have been allocated!
                </div>
              ) : (
                waitingPatients.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs group-hover:text-cyan-300 transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{p.id}</span>
                        <PriorityBadge priority={p.priority} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.age}y {p.gender} • Dept: <span className="text-slate-300">{p.department_requirement}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[210px]">
                        SpO2: <span className={p.spo2 < 90 ? 'text-red-400 font-bold' : 'text-slate-200'}>{p.spo2}%</span> • O2: {p.oxygen_requirement}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('recommendations', { patientId: p.id })}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-[11px] shadow-md shadow-purple-600/20 flex items-center gap-1.5 shrink-0 transition-transform group-hover:scale-105"
                      title="Run Smart Matching Engine for this Patient"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Match Bed</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('patients')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 text-center transition-colors"
          >
            View Full Patient Triage Queue &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Section: Recent Audit Feed & Operational Summary */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Recent Operational Activity & Allocations</h2>
            <p className="text-xs text-slate-400">Auditable trace of triage assessments, doctor overrides, and admissions</p>
          </div>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            View Complete Audit Log &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-mono text-[10px] font-semibold text-cyan-400">{log.action}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-300 leading-snug line-clamp-2">{log.details || `${log.action} on ${log.entity} ${log.entity_id}`}</p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/50">
                <span>By: <strong className="text-slate-300">{log.user_name}</strong></span>
                <span className="capitalize text-slate-400">{log.user_role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
