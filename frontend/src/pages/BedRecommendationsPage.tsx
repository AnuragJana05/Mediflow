import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RecommendationResponse, Patient, BedMatchItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  User,
  Wind,
  Activity,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface BedRecommendationsPageProps {
  initialPatientId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const BedRecommendationsPage: React.FC<BedRecommendationsPageProps> = ({
  initialPatientId,
  onNavigate
}) => {
  const { user, canApprove } = useAuth();
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || 'P-1024');
  const [recData, setRecData] = useState<RecommendationResponse | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Approval Modal State
  const [approvalBed, setApprovalBed] = useState<BedMatchItem | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('Clinician confirmed clinical resource compatibility and patient placement.');
  const [isApproving, setIsApproving] = useState(false);

  // Reject Modal State
  const [rejectBed, setRejectBed] = useState<BedMatchItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Alternative clinical ward preferred by attending team.');
  const [isRejecting, setIsRejecting] = useState(false);

  // Fetch waiting patients list
  useEffect(() => {
    const fetchWaiting = async () => {
      try {
        const pts = await api.getPatients();
        const waiting = pts.filter(p => ['Waiting', 'Awaiting Bed', 'Under Assessment'].includes(p.current_status));
        setWaitingPatients(waiting);
        if (!initialPatientId && waiting.length > 0) {
          // If hero demo patient P-1024 exists, select it, otherwise first waiting
          const p1024 = waiting.find(p => p.id === 'P-1024');
          setSelectedPatientId(p1024 ? p1024.id : waiting[0].id);
        }
      } catch (err) {
        console.error('Failed to load waiting patients:', err);
      }
    };
    fetchWaiting();
  }, [initialPatientId]);

  // Fetch recommendation data when selectedPatientId changes
  const fetchRecommendations = async () => {
    if (!selectedPatientId) return;
    setIsLoading(true);
    try {
      const [rec, pt] = await Promise.all([
        api.getRecommendations(selectedPatientId),
        api.getPatient(selectedPatientId)
      ]);
      setRecData(rec);
      setSelectedPatient(pt);
    } catch (err) {
      console.error('Failed to get bed recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedPatientId]);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalBed || !selectedPatient) return;
    setIsApproving(true);
    try {
      await api.approveRecommendation(selectedPatient.id, approvalBed.bed_id, approvalNotes);
      setApprovalBed(null);
      alert(`Success: Bed ${approvalBed.bed_id} successfully allocated to ${selectedPatient.name} by ${user?.name}. Operational dashboard updated.`);
      onNavigate('dashboard');
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectBed || !selectedPatient) return;
    setIsRejecting(true);
    try {
      await api.rejectRecommendation(selectedPatient.id, rejectBed.bed_id, rejectReason);
      setRejectBed(null);
      await fetchRecommendations();
    } catch (err: any) {
      alert(`Reject failed: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DisclaimerBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <span>Smart Bed Matching & Allocation Engine</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700">
                  Explainable AI
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Deterministic compatibility scoring based on clinical vitals, equipment needs, isolation protocols, and ward suitability.
              </p>
            </div>
          </div>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap font-medium">Select Waiting Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/50 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-400 shadow-lg shadow-purple-950/50"
          >
            {waitingPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.name} ({p.priority} Acuity • {p.department_requirement})
              </option>
            ))}
          </select>

          <button
            onClick={fetchRecommendations}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Recalculate Matches"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PATIENT SUMMARY CARD (As specified in PRD Section 9) */}
      {selectedPatient && (
        <div className="glass-panel p-5 rounded-2xl border-purple-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Patient Assessment Summary
            </span>
            <PriorityBadge priority={selectedPatient.priority} size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-3.5 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Patient Identity</span>
              <div className="font-bold text-slate-100 text-sm">{selectedPatient.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{selectedPatient.id} • {selectedPatient.age}y {selectedPatient.gender}</div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Target Department</span>
              <div className="font-bold text-cyan-300 text-sm">{selectedPatient.department_requirement}</div>
              <div className="text-[11px] text-slate-400">Mobility: {selectedPatient.mobility_requirement}</div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Oxygen Requirement</span>
              <div className="font-bold text-slate-100 text-sm flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>{selectedPatient.oxygen_requirement}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">SpO2: <strong className={selectedPatient.spo2 < 90 ? 'text-rose-400' : 'text-slate-200'}>{selectedPatient.spo2}%</strong></div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Required Hardware / Isolation</span>
              <div className="font-bold text-slate-200 text-xs truncate" title={selectedPatient.required_equipment}>
                {selectedPatient.required_equipment || 'Standard monitoring'}
              </div>
              <div className="text-[11px] text-purple-300">
                Isolation: {selectedPatient.isolation_requirement}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Clinical Presentation</span>
              <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed" title={selectedPatient.symptoms}>
                {selectedPatient.symptoms}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SMART MATCHING RESULTS SECTION */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-slate-400 text-xs font-mono">Evaluating candidate beds against clinical requirements...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: RECOMMENDED COMPATIBLE BEDS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Recommended Available Beds</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
                  {recData?.recommendations.length || 0} Matches
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Ranked by Operational Compatibility Score</span>
            </div>

            {recData?.recommendations.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">No Currently Available Beds Fully Match Requirements</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  All compatible beds may currently be occupied, under cleaning, or undergoing maintenance. See unavailable alternatives below.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recData?.recommendations.map((bed, index) => {
                  const isTop = index === 0;

                  return (
                    <div
                      key={bed.bed_id}
                      className={`glass-panel p-5 rounded-2xl border transition-all ${
                        isTop
                          ? 'border-purple-500/70 bg-gradient-to-r from-purple-950/20 via-slate-900/60 to-slate-900/80 shadow-xl shadow-purple-950/30'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl font-mono font-bold text-base border ${
                            isTop
                              ? 'bg-purple-950 text-purple-200 border-purple-600'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}>
                            {bed.bed_id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-sm">{bed.room}</span>
                              <span className="text-slate-400 text-xs">• {bed.ward_name} ({bed.department_name})</span>
                              {isTop && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/80 text-purple-200 border border-purple-500 uppercase tracking-wider">
                                  Top Recommendation
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{bed.floor} • Type: {bed.bed_type}</div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold font-mono text-emerald-400">
                              {bed.compatibility_score}%
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">Compatibility</div>
                          </div>

                          <StatusBadge status={bed.status} size="sm" />
                        </div>
                      </div>

                      {/* Contributing Reasons & Factors Checklist */}
                      <div className="py-3 space-y-1.5 text-xs">
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
                          Compatibility Factors Verified by Engine:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bed.reasons.map((reason, rIdx) => (
                            <div key={rIdx} className="flex items-center gap-2 text-slate-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-[11px]">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hardware Badges */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                          {bed.has_oxygen && <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">O₂ Port</span>}
                          {bed.has_ventilator && <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Ventilator</span>}
                          {bed.has_cardiac_monitor && <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">ECG Monitor</span>}
                          {bed.has_isolation && <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">Isolation</span>}
                        </div>

                        {/* Human Approval Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRejectBed(bed)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>

                          {canApprove ? (
                            <button
                              onClick={() => setApprovalBed(bed)}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve Allocation</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Doctor approval required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side Column: UNAVAILABLE / REJECTED ALTERNATIVES & REASONS */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Incompatible / Unavailable Beds</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 font-mono">
                  {recData?.unavailable_alternatives.length || 0}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Inspected and rejected by constraint solver</p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
              {recData?.unavailable_alternatives.map((alt) => (
                <div
                  key={alt.bed_id}
                  className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2 text-xs opacity-85 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-300">{alt.bed_id}</span>
                      <span className="text-[11px] text-slate-400">• {alt.department_name}</span>
                    </div>
                    <StatusBadge status={alt.status} size="sm" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold block">
                      Rejection Reason:
                    </span>
                    {alt.rejection_reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOCTOR APPROVE ALLOCATION (PRD Section 9 & 10) */}
      {approvalBed && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-emerald-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Confirm Bed Allocation</h3>
                  <p className="text-xs text-slate-400">Authorized clinician signature required</p>
                </div>
              </div>
              <button onClick={() => setApprovalBed(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-bold text-slate-100">{selectedPatient.name} ({selectedPatient.id})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Allocated Bed:</span>
                  <span className="font-bold text-emerald-400 font-mono">{approvalBed.bed_id} ({approvalBed.room})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department / Ward:</span>
                  <span className="text-slate-200">{approvalBed.department_name} • {approvalBed.ward_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Compatibility Score:</span>
                  <span className="font-bold font-mono text-emerald-400">{approvalBed.compatibility_score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Authorizing Clinician:</span>
                  <span className="text-purple-300 font-semibold">{user?.name} ({user?.role})</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinical Placement Order Notes</label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-600/30 text-[11px] text-emerald-300 leading-relaxed">
                By approving this recommendation, Bed {approvalBed.bed_id} will immediately transition from <strong>Available</strong> to <strong>Occupied</strong> across the hospital command center and Patient {selectedPatient.id} status will be updated to <strong>Admitted</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setApprovalBed(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/30"
                >
                  {isApproving ? 'Authorizing...' : 'Authorize Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT RECOMMENDATION */}
      {rejectBed && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Reject Recommendation for {rejectBed.bed_id}</h3>
                <p className="text-xs text-slate-400">Record reason for clinician rejection</p>
              </div>
              <button onClick={() => setRejectBed(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectBed(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  {isRejecting ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
