import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bed, BedStatus, Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Grid,
  BedDouble,
  RefreshCw,
  Wind,
  Activity,
  Shield,
  Layers,
  X,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HospitalBedMapPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HospitalBedMapPage: React.FC<HospitalBedMapPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeDeptTab, setActiveDeptTab] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBeds = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBeds();
      setBeds(data);
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const handleBedClick = async (bed: Bed) => {
    setSelectedBed(bed);
    setSelectedPatient(null);
    if (bed.current_patient_id) {
      try {
        const pt = await api.getPatient(bed.current_patient_id);
        setSelectedPatient(pt);
      } catch (err) {
        console.error('Failed to load patient details:', err);
      }
    }
  };

  const handleQuickStatus = async (status: BedStatus) => {
    if (!selectedBed) return;
    try {
      await api.updateBedStatus(selectedBed.id, status);
      await fetchBeds();
      const updated = await api.getBed(selectedBed.id);
      setSelectedBed(updated);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleRelease = async () => {
    if (!selectedBed) return;
    try {
      await api.releaseBed(selectedBed.id, 'Cleaning');
      await fetchBeds();
      setSelectedBed(null);
      setSelectedPatient(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Group beds by department
  const departments = [
    { code: 'ICU', name: 'Intensive Care Unit (ICU)', floor: '3rd Floor' },
    { code: 'ED', name: 'Emergency Medicine (ED)', floor: 'Ground Floor' },
    { code: 'CCU', name: 'Coronary Care Unit (CCU)', floor: '2nd Floor' },
    { code: 'ISO', name: 'Negative Pressure Isolation (ISO)', floor: '4th Floor' },
    { code: 'GW', name: 'General Inpatient Ward (GW)', floor: '1st Floor' },
    { code: 'SURG', name: 'Surgical Recovery Ward (SURG)', floor: '2nd Floor' },
  ];

  const getStatusColorConfig = (status: BedStatus) => {
    switch (status) {
      case 'Available':
        return {
          bg: 'bg-emerald-950/40 hover:bg-emerald-950/60',
          border: 'border-emerald-500/50 hover:border-emerald-400',
          dot: 'bg-emerald-400',
          text: 'text-emerald-300',
          symbol: '🟢',
        };
      case 'Occupied':
        return {
          bg: 'bg-rose-950/40 hover:bg-rose-950/60',
          border: 'border-rose-500/50 hover:border-rose-400',
          dot: 'bg-rose-500',
          text: 'text-rose-300',
          symbol: '🔴',
        };
      case 'Cleaning':
        return {
          bg: 'bg-amber-950/40 hover:bg-amber-950/60',
          border: 'border-amber-500/50 hover:border-amber-400',
          dot: 'bg-amber-400',
          text: 'text-amber-300',
          symbol: '🟡',
        };
      case 'Reserved':
        return {
          bg: 'bg-sky-950/40 hover:bg-sky-950/60',
          border: 'border-sky-500/50 hover:border-sky-400',
          dot: 'bg-sky-400',
          text: 'text-sky-300',
          symbol: '🔵',
        };
      case 'Maintenance':
      default:
        return {
          bg: 'bg-slate-900/60 hover:bg-slate-900',
          border: 'border-slate-700/60 hover:border-slate-500',
          dot: 'bg-slate-400',
          text: 'text-slate-300',
          symbol: '⚪',
        };
    }
  };

  const displayedDepts = activeDeptTab === 'ALL'
    ? departments
    : departments.filter(d => d.code === activeDeptTab);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Grid className="w-6 h-6 text-cyan-400" />
            <span>Interactive Hospital Bed Map</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Visual topological representation of all hospital departments, wards, and bed status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBeds}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Map</span>
          </button>
        </div>
      </div>

      {/* Accessible Status Color Legend */}
      <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <span className="text-slate-400 font-semibold uppercase text-[11px]">Legend:</span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-950" />
            <span>Available (🟢)</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-950" />
            <span>Occupied (🔴)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-950" />
            <span>Cleaning / Pending (🟡)</span>
          </span>
          <span className="flex items-center gap-1.5 text-sky-300">
            <span className="w-3 h-3 rounded-full bg-sky-400 ring-2 ring-sky-950" />
            <span>Reserved (🔵)</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-500 ring-2 ring-slate-900" />
            <span>Maintenance (⚪)</span>
          </span>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveDeptTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
            activeDeptTab === 'ALL'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          All Wings ({beds.length})
        </button>
        {departments.map((d) => {
          const deptBeds = beds.filter(b => b.department_code === d.code);
          const avail = deptBeds.filter(b => b.status === 'Available').length;
          return (
            <button
              key={d.code}
              onClick={() => setActiveDeptTab(d.code)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                activeDeptTab === d.code
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>{d.code}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${avail > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {avail}/{deptBeds.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Department Bed Map Sections */}
      <div className="space-y-6">
        {displayedDepts.map((dept) => {
          const deptBeds = beds.filter(b => b.department_code === dept.code);
          if (deptBeds.length === 0) return null;

          const total = deptBeds.length;
          const available = deptBeds.filter(b => b.status === 'Available').length;
          const occupied = deptBeds.filter(b => b.status === 'Occupied').length;
          const cleaning = deptBeds.filter(b => b.status === 'Cleaning').length;

          return (
            <div key={dept.code} className="glass-panel p-5 rounded-2xl space-y-4">
              {/* Department Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-100">{dept.name}</h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {dept.floor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {available} Available • {occupied} Occupied • {cleaning} Cleaning
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-mono text-slate-400">
                    Capacity Load: <strong className={occupied / total >= 0.8 ? 'text-rose-400' : 'text-emerald-400'}>{Math.round((occupied / total) * 100)}%</strong>
                  </div>
                </div>
              </div>

              {/* Bed Grid Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {deptBeds.map((bed) => {
                  const cfg = getStatusColorConfig(bed.status);
                  const isSelected = selectedBed?.id === bed.id;

                  return (
                    <div
                      key={bed.id}
                      onClick={() => handleBedClick(bed)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all relative group flex flex-col justify-between min-h-[92px] ${
                        cfg.bg
                      } ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 border-cyan-400 scale-[1.02]'
                          : cfg.border
                      }`}
                    >
                      {/* Top: Bed ID & Status Dot */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {bed.id}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${bed.status === 'Available' ? 'animate-pulse' : ''}`} />
                        </div>
                      </div>

                      {/* Middle: Patient or Status Label */}
                      <div className="my-1.5">
                        {bed.current_patient_name ? (
                          <div className="text-xs font-semibold text-slate-200 truncate">
                            {bed.current_patient_name}
                          </div>
                        ) : (
                          <div className={`text-[11px] font-medium ${cfg.text}`}>
                            {bed.status}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate">{bed.room}</div>
                      </div>

                      {/* Bottom: Equipment icons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/40 text-[10px] text-slate-400">
                        {bed.has_ventilator && <span title="Ventilator Equipped"><Wind className="w-3 h-3 text-indigo-400" /></span>}
                        {bed.has_cardiac_monitor && <span title="Cardiac Monitor Equipped"><Activity className="w-3 h-3 text-rose-400" /></span>}
                        {bed.has_isolation && <span title="Isolation Ready"><Shield className="w-3 h-3 text-purple-400" /></span>}
                        {bed.has_oxygen && <span className="text-[9px] font-mono text-sky-400" title="Oxygen Supply">O₂</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Details Drawer / Modal when a bed is selected */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-700 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <BedDouble className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-lg font-mono">{selectedBed.id}</h3>
                    <StatusBadge status={selectedBed.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400">{selectedBed.room} • {selectedBed.ward_name} ({selectedBed.department_name})</p>
                </div>
              </div>

              <button onClick={() => setSelectedBed(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Patient Section if Occupied */}
            {selectedBed.status === 'Occupied' && selectedPatient && (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-slate-200 text-sm">{selectedPatient.name}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{selectedPatient.id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-300 font-semibold text-[10px]">
                    {selectedPatient.priority} Priority
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                  <div className="bg-slate-900/60 p-2 rounded-lg">SpO2: <strong className={selectedPatient.spo2 < 90 ? 'text-rose-400' : 'text-slate-100'}>{selectedPatient.spo2}%</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">HR: <strong>{selectedPatient.heart_rate} bpm</strong></div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">BP: <strong>{selectedPatient.blood_pressure_sys}/{selectedPatient.blood_pressure_dia}</strong></div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Symptoms: {selectedPatient.symptoms}
                </div>
              </div>
            )}

            {/* Equipment capabilities */}
            <div className="text-xs space-y-2">
              <span className="font-semibold text-slate-300">Hardware & Medical Capabilities:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${selectedBed.has_oxygen ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>Central Oxygen Supply: {selectedBed.has_oxygen ? 'Verified' : 'None'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${selectedBed.has_ventilator ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>Ventilator: {selectedBed.has_ventilator ? 'Equipped' : 'Not Equipped'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${selectedBed.has_cardiac_monitor ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>Cardiac Telemetry: {selectedBed.has_cardiac_monitor ? 'Active' : 'None'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${selectedBed.has_isolation ? 'bg-purple-400' : 'bg-slate-600'}`} />
                  <span>Isolation Suite: {selectedBed.has_isolation ? 'Negative Pressure' : 'Standard'}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {selectedBed.status === 'Occupied' ? (
                  <button
                    onClick={handleRelease}
                    className="px-3 py-1.5 rounded-xl bg-amber-950 text-amber-300 border border-amber-600/50 hover:bg-amber-900/50 font-medium"
                  >
                    Release & Mark Cleaning
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleQuickStatus('Available')}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900/50"
                    >
                      Set Available
                    </button>
                    <button
                      onClick={() => handleQuickStatus('Cleaning')}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-950 text-amber-300 border border-amber-600/50 hover:bg-amber-900/50"
                    >
                      Mark Cleaning
                    </button>
                    <button
                      onClick={() => handleQuickStatus('Maintenance')}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                    >
                      Maintenance
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedBed(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
