import React, { useState } from 'react';
import { api } from '../services/api';
import { SurgeSimulationResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Zap,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Users,
  BedDouble,
  Activity,
  Flame,
  CheckCircle2,
  Wind,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface SurgeSimulatorPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const SurgeSimulatorPage: React.FC<SurgeSimulatorPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isDoctor } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState('highway_collision');
  const [patientCount, setPatientCount] = useState(14);
  const [criticalRatio, setCriticalRatio] = useState(0.5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [surgeResult, setSurgeResult] = useState<SurgeSimulationResponse | null>(null);

  const scenarios = [
    {
      id: 'highway_collision',
      title: 'Mass Casualty: Multi-Vehicle Interstate Collision',
      badge: 'Trauma & ED Spike',
      description: 'High-impact 6-vehicle pileup involving an intercity bus. 14+ incoming acute trauma, thoracic injury, and neurotrauma cases.',
      dept: 'Emergency & Surgery Focus',
      defaultCount: 14,
      defaultRatio: 0.5,
      color: 'border-red-500/40 bg-red-950/20'
    },
    {
      id: 'chemical_hazard',
      title: 'Industrial Toxic Vapor Chemical Explosion',
      badge: 'Respiratory & ICU Crisis',
      description: 'Catastrophic anhydrous ammonia container breach at chemical facility. Inflow of acute pulmonary edema, chemical burns, and severe bronchospasm.',
      dept: 'ICU & Ventilators Focus',
      defaultCount: 18,
      defaultRatio: 0.6,
      color: 'border-amber-500/40 bg-amber-950/20'
    },
    {
      id: 'epidemic_spike',
      title: 'Community Viral Respiratory Outbreak Spike',
      badge: 'Isolation & High Oxygen',
      description: 'Super-spreader winter influenza / acute viral surge presenting with rapid respiratory compromise requiring droplet isolation suites.',
      dept: 'Isolation & Inpatient Focus',
      defaultCount: 20,
      defaultRatio: 0.35,
      color: 'border-purple-500/40 bg-purple-950/20'
    }
  ];

  const handleSelectScenario = (sc: any) => {
    setSelectedScenario(sc.id);
    setPatientCount(sc.defaultCount);
    setCriticalRatio(sc.defaultRatio);
  };

  const handleTriggerSurge = async () => {
    setIsSimulating(true);
    try {
      const res = await api.triggerSurge(selectedScenario, patientCount, criticalRatio);
      setSurgeResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Revert surge simulation and restore baseline hospital capacity?')) return;
    setIsResetting(true);
    try {
      await api.resetSurge();
      setSurgeResult(null);
      alert('Simulation reset successfully! All synthetic simulation records purged and baseline beds restored.');
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const getCapacityMeterColor = (val: number) => {
    if (val >= 90) return 'from-rose-600 to-red-600 text-rose-300';
    if (val >= 80) return 'from-amber-500 to-orange-600 text-amber-300';
    return 'from-emerald-500 to-teal-600 text-emerald-300';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DisclaimerBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-400" />
            <span>Mass-Casualty Incident & Surge Event Simulator</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Stress-test hospital bed capacity, automated triage routing, and resource bottleneck alerts with reversible synthetic surge scenarios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {surgeResult && (
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-md transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Simulation'}</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('dashboard')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            Command Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${sc.color} ${
                isSelected ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.02] shadow-xl shadow-amber-950/40' : 'hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-slate-900/90 text-amber-300 border border-slate-800">
                    {sc.badge}
                  </span>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-100 mb-1.5">{sc.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{sc.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{sc.dept}</span>
                <span className="font-semibold text-slate-200">~{sc.defaultCount} Patients</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Control Center Box */}
      <div className="glass-panel p-6 rounded-2xl border-amber-500/40 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Simulation Incident Parameters</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Safe Sandbox Mode
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated patients are tagged and isolated from baseline clinical records.
            </p>
          </div>

          <button
            onClick={handleTriggerSurge}
            disabled={isSimulating}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-5 h-5 ${isSimulating ? 'animate-bounce' : ''}`} />
            <span>{isSimulating ? 'Injecting Surge Load...' : 'SIMULATE SURGE EVENT'}</span>
          </button>
        </div>

        {/* Sliders for count and critical ratio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Incoming Synthetic Patient Batch Size:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{patientCount} Patients</span>
            </div>
            <input
              type="range"
              min={6}
              max={28}
              value={patientCount}
              onChange={(e) => setPatientCount(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>6 (Minor Surge)</span>
              <span>18 (Major Disaster)</span>
              <span>28 (Catastrophic)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Critical Acuity Ratio (Ventilator/ICU Demand):</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{Math.round(criticalRatio * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={0.8}
              step={0.05}
              value={criticalRatio}
              onChange={(e) => setCriticalRatio(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>20% (Mainly Ambulatory)</span>
              <span>50% (Balanced)</span>
              <span>80% (Critical Intensive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SURGE TELEMETRY REPORT DASHBOARD (Visible once triggered) */}
      {surgeResult && (
        <div className="space-y-5 animate-fade-in">
          {/* Visual Hospital Capacity Pressure Indicator */}
          <div className="glass-panel p-6 rounded-2xl border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-slate-900/80 to-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block">
                  Hospital Capacity Pressure Meter
                </span>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>Status:</span>
                  <span className="text-rose-400 uppercase tracking-wide">{surgeResult.capacity_status}</span>
                </h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold font-mono text-rose-400">
                  {surgeResult.overall_hospital_capacity_after}%
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Overall Facility Utilization</span>
              </div>
            </div>

            {/* Thick Progress bar with warning markers */}
            <div className="w-full h-4 rounded-full bg-slate-950 p-0.5 border border-slate-800 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 transition-all duration-700"
                style={{ width: `${Math.min(surgeResult.overall_hospital_capacity_after, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>0% Normal Baseline</span>
              <span>75% High Inflow</span>
              <span>85% Severe Saturation</span>
              <span className="text-rose-400 font-bold">100% Full Capacity</span>
            </div>
          </div>

          {/* Surge Impact KPI Grid (PRD Section 13) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="glass-card p-4 rounded-2xl border-amber-500/30">
              <span className="text-[11px] text-slate-400 font-mono block">Incoming Surge Patients</span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                +{surgeResult.incoming_patients_count}
              </div>
              <span className="text-[10px] text-slate-400">Simulated batch ingested</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border-rose-500/30">
              <span className="text-[11px] text-slate-400 font-mono block">Critical Acuity Patients</span>
              <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
                {surgeResult.critical_patients_added}
              </div>
              <span className="text-[10px] text-slate-400">Immediate resuscitation needed</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border-purple-500/30">
              <span className="text-[11px] text-slate-400 font-mono block">ICU Saturation Level</span>
              <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
                {surgeResult.icu_utilization_after}%
              </div>
              <span className="text-[10px] text-slate-400">Intensive Care pressure</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border-cyan-500/30">
              <span className="text-[11px] text-slate-400 font-mono block">Estimated Average Waiting</span>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                ~{surgeResult.estimated_waiting_time_minutes}m
              </div>
              <span className="text-[10px] text-slate-400">Spike due to triage bottleneck</span>
            </div>
          </div>

          {/* Triggered Alerts & Resource Shortages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Triggered Operations Surge Alerts</span>
              </h3>
              <div className="space-y-2">
                {surgeResult.alerts_triggered.map((alertText: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-950/20 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{alertText}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Wind className="w-4 h-4 text-amber-400" />
                <span>Identified Resource & Hardware Shortages</span>
              </h3>
              <div className="space-y-2">
                {surgeResult.resource_shortages.map((resText: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{resText}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
