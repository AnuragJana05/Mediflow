import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Patient, PriorityLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  User,
  ArrowLeft,
  Cpu,
  Edit3,
  Heart,
  Activity,
  Wind,
  Shield,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  X
} from 'lucide-react';

interface PatientDetailsPageProps {
  patientId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const PatientDetailsPage: React.FC<PatientDetailsPageProps> = ({
  patientId,
  onNavigate
}) => {
  const { user, canOverridePriority } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>('High');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatient = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPatient(patientId);
      setPatient(data);
      setOverridePriority(data.priority);
    } catch (err) {
      console.error('Failed to load patient:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('A clinical justification reason is required for priority override.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.overridePriority(patientId, overridePriority, overrideReason);
      setShowOverrideModal(false);
      setOverrideReason('');
      await fetchPatient();
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isWaiting = ['Waiting', 'Awaiting Bed', 'Under Assessment'].includes(patient.current_status);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <DisclaimerBanner compact />

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('patients')}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patients Directory</span>
        </button>

        <div className="flex items-center gap-3">
          {isWaiting && (
            <button
              onClick={() => onNavigate('recommendations', { patientId: patient.id })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-purple-600/30 hover:brightness-110"
            >
              <Cpu className="w-4 h-4" />
              <span>Smart Bed Matching Engine &rarr;</span>
            </button>
          )}

          {canOverridePriority && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 text-xs font-medium"
            >
              <Edit3 className="w-4 h-4" />
              <span>Override Priority</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-100">{patient.name}</h1>
                <PriorityBadge priority={patient.priority} size="md" />
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="font-mono">{patient.id}</span>
                <span>•</span>
                <span>{patient.age} years old ({patient.gender})</span>
                <span>•</span>
                <span>Target Dept: <strong className="text-slate-200">{patient.department_requirement}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Operational Status:</span>
              <span className="font-bold text-slate-100 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {patient.current_status}
              </span>
            </div>
            {patient.assigned_bed_id && (
              <div className="text-cyan-400 font-mono text-[11px]">
                Allocated to Bed {patient.assigned_bed_id} ({patient.assigned_bed_room || ''})
              </div>
            )}
            <div className="text-slate-400 text-[11px]">
              Arrived: {new Date(patient.arrival_time).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Doctor Override Justification Banner if Overridden */}
        {patient.priority_override_reason && (
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-600/40 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-purple-200">Doctor Priority Override Active</div>
              <p className="text-purple-300 mt-0.5">{patient.priority_override_reason}</p>
            </div>
          </div>
        )}

        {/* Symptoms Statement */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-semibold text-slate-300 block mb-1 uppercase tracking-wider text-[10px] font-mono">Presenting Clinical History & Symptoms</span>
          <p className="text-slate-200 leading-relaxed text-sm">{patient.symptoms}</p>
        </div>
      </div>

      {/* Vitals Grid & Triage Explainability Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physiological Vitals Box */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Intake Physiological Vitals</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Validated Triage Records</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">SpO2 (Oxygen)</span>
              <div className={`text-xl font-bold font-mono mt-1 ${patient.spo2 < 90 ? 'text-rose-400' : 'text-slate-100'}`}>
                {patient.spo2}%
              </div>
              <span className="text-[10px] text-slate-400">{patient.spo2 < 90 ? 'Critical hypoxemia' : 'Normal range'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Heart Rate</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {patient.heart_rate} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <span className="text-[10px] text-slate-400">{patient.heart_rate > 100 ? 'Tachycardia' : 'Stable'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Blood Pressure</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {patient.blood_pressure_sys}/{patient.blood_pressure_dia}
              </div>
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Body Temp</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {patient.temperature.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <span className="text-[10px] text-slate-400">{patient.temperature >= 38.0 ? 'Pyrexia' : 'Normothermic'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Oxygen Support</span>
              <div className="text-sm font-bold text-cyan-400 mt-1">
                {patient.oxygen_requirement}
              </div>
              <span className="text-[10px] text-slate-400">Clinical airway need</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Mobility & Stretcher</span>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {patient.mobility_requirement}
              </div>
              <span className="text-[10px] text-slate-400">Transport protocol</span>
            </div>
          </div>
        </div>

        {/* Triage Decision-Support Engine Factors */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>Triage Classification Factors</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              AI Decision Support
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-400 text-xs">
              The priority assessment algorithm evaluated the following contributing factors:
            </p>

            {patient.triage_factors && patient.triage_factors.length > 0 ? (
              <div className="space-y-2">
                {patient.triage_factors.map((factor: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5 text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-400">
                Baseline physiological scoring within safe bounds.
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-400 mt-3">
              <strong className="text-slate-300">Operational Disclaimer:</strong> MediFlow priority suggestions are designed for rapid operational workflow ranking and do not replace attending physician clinical judgment.
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Doctor Override */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-purple-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Clinician Priority Override</h3>
                <p className="text-xs text-slate-400">Attending physician authorization with mandatory justification</p>
              </div>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Select Overridden Priority Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Critical', 'High', 'Medium', 'Low'] as PriorityLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setOverridePriority(lvl)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        overridePriority === lvl
                          ? 'border-purple-500 bg-purple-950/70 text-purple-200 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinical Rationale / Justification *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Patient exhibiting subtle neurological deterioration not fully captured by baseline vitals."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/30"
                >
                  {isSubmitting ? 'Recording...' : 'Record Priority Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
