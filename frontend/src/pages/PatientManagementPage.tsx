import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Patient, PriorityLevel, PatientStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Cpu,
  RefreshCw,
  Clock,
  Heart,
  Activity,
  Wind,
  Shield,
  X,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PatientManagementPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialOpenRegister?: boolean;
}

export const PatientManagementPage: React.FC<PatientManagementPageProps> = ({
  onNavigate,
  initialOpenRegister = false
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(initialOpenRegister);
  const [formData, setFormData] = useState({
    name: '',
    age: 45,
    gender: 'Male',
    contact: '+1 (555) 000-0000',
    emergency_contact: 'Family: +1 (555) 000-0001',
    symptoms: '',
    oxygen_requirement: 'None',
    heart_rate: 78,
    spo2: 97,
    blood_pressure_sys: 120,
    blood_pressure_dia: 80,
    temperature: 37.0,
    mobility_requirement: 'Ambulatory',
    isolation_requirement: 'None',
    required_equipment: '',
    department_requirement: 'General Ward'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live preview of triage assessment based on current form inputs
  const calculateLiveTriagePreview = () => {
    let score = 0;
    const factors: string[] = [];
    const sym = formData.symptoms.toLowerCase();

    if (formData.spo2 < 88) {
      score += 40;
      factors.push(`Severe Hypoxemia: SpO2 ${formData.spo2}% (<88%)`);
    } else if (formData.spo2 < 92) {
      score += 30;
      factors.push(`Hypoxemia: SpO2 ${formData.spo2}% (<92%)`);
    } else if (formData.spo2 < 95) {
      score += 15;
      factors.push(`Borderline SpO2 ${formData.spo2}%`);
    }

    if (formData.oxygen_requirement === 'Invasive') {
      score += 45;
      factors.push('Invasive mechanical ventilation required');
    } else if (formData.oxygen_requirement === 'High Flow') {
      score += 25;
      factors.push('High-flow oxygen therapy required');
    }

    if (formData.heart_rate > 130 || formData.heart_rate < 45) {
      score += 35;
      factors.push(`Severe heart rate anomaly: ${formData.heart_rate} bpm`);
    } else if (formData.heart_rate > 110) {
      score += 15;
      factors.push(`Tachycardia: ${formData.heart_rate} bpm`);
    }

    if (formData.blood_pressure_sys < 85 || formData.blood_pressure_sys > 200) {
      score += 35;
      factors.push(`Severe BP anomaly: ${formData.blood_pressure_sys}/${formData.blood_pressure_dia}`);
    }

    if (formData.temperature >= 39.5) {
      score += 20;
      factors.push(`Severe hyperthermia: ${formData.temperature}°C`);
    }

    if (sym.includes('arrest') || sym.includes('unresponsive') || sym.includes('respiratory failure') || sym.includes('severe trauma') || sym.includes('cyanosis')) {
      score += 35;
      factors.push('Critical symptom trigger present');
    } else if (sym.includes('chest pain') || sym.includes('shortness of breath') || sym.includes('sepsis')) {
      score += 20;
      factors.push('Urgent high-acuity symptom trigger');
    }

    let priority: PriorityLevel = 'Low';
    if (score >= 45 || formData.spo2 < 90 || formData.oxygen_requirement === 'Invasive') {
      priority = 'Critical';
    } else if (score >= 25 || formData.spo2 < 94 || formData.oxygen_requirement === 'High Flow') {
      priority = 'High';
    } else if (score >= 12) {
      priority = 'Medium';
    }

    return { priority, factors, score };
  };

  const triagePreview = calculateLiveTriagePreview();

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPatients({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        department: deptFilter !== 'ALL' ? deptFilter : undefined,
        search: searchTerm || undefined
      });
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [statusFilter, priorityFilter, deptFilter, searchTerm]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newPt = await api.registerPatient(formData);
      setShowRegisterModal(false);
      await fetchPatients();
      // If critical or high, prompt user to match bed right away!
      if (newPt.priority === 'Critical' || newPt.priority === 'High') {
        if (confirm(`Patient registered as ${newPt.priority}! Open Smart Bed Matching engine now?`)) {
          onNavigate('recommendations', { patientId: newPt.id });
        }
      }
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischarge = async (id: string) => {
    if (!confirm(`Confirm discharge for patient ${id}? Assigned bed will transition to cleaning.`)) return;
    try {
      await api.dischargePatient(id);
      await fetchPatients();
    } catch (err: any) {
      alert(`Discharge failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DisclaimerBanner compact />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Patient Flow, Triage & Queue Management</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Clinical intake, deterministic physiological priority assessment, and ward assignment tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Intake New Patient</span>
          </button>

          <button
            onClick={fetchPatients}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, ID, Symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Waiting">Waiting</option>
            <option value="Under Assessment">Under Assessment</option>
            <option value="Awaiting Bed">Awaiting Bed</option>
            <option value="Admitted">Admitted</option>
            <option value="Discharged">Discharged</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Acuity Priorities</option>
            <option value="Critical">Critical (Immediate)</option>
            <option value="High">High (Urgent)</option>
            <option value="Medium">Medium (Semi-urgent)</option>
            <option value="Low">Low (Non-urgent)</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="ICU">ICU</option>
            <option value="Emergency">Emergency</option>
            <option value="Cardiology">Cardiology</option>
            <option value="General Ward">General Ward</option>
            <option value="Isolation">Isolation</option>
            <option value="Surgical Recovery">Surgical Recovery</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Showing {patients.length} Patient Records
        </span>
      </div>

      {/* Patient Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Patient / ID</th>
                <th className="py-3.5 px-4">Priority / Triage</th>
                <th className="py-3.5 px-4">Status & Location</th>
                <th className="py-3.5 px-4">Key Physiological Vitals</th>
                <th className="py-3.5 px-4">Requirements & O₂</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {patients.map((pt) => {
                const isWaiting = ['Waiting', 'Awaiting Bed', 'Under Assessment'].includes(pt.current_status);
                return (
                  <tr key={pt.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Patient Name / ID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 text-sm hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('patient-details', { patientId: pt.id })}>
                        {pt.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {pt.id} • {pt.age}y {pt.gender} • Dept: {pt.department_requirement}
                      </div>
                    </td>

                    {/* Priority & Triage */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={pt.priority} size="sm" />
                        {pt.priority_override_reason && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 text-[9px] font-mono" title={`Overridden: ${pt.priority_override_reason}`}>
                            MD Override
                          </span>
                        )}
                      </div>
                      {pt.triage_factors && pt.triage_factors.length > 0 && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-1" title={pt.triage_factors.join('; ')}>
                          {pt.triage_factors[0]}
                        </div>
                      )}
                    </td>

                    {/* Status & Assigned Bed */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {pt.current_status}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                        {pt.assigned_bed_id ? `Bed: ${pt.assigned_bed_id}` : 'Queueing for Bed'}
                      </div>
                    </td>

                    {/* Vitals */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded ${pt.spo2 < 90 ? 'bg-red-950 text-red-300 font-bold border border-red-700' : 'bg-slate-800 text-slate-300'}`}>
                          SpO2: {pt.spo2}%
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          HR: {pt.heart_rate}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          BP: {pt.blood_pressure_sys}/{pt.blood_pressure_dia}
                        </span>
                      </div>
                    </td>

                    {/* Requirements */}
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-300 font-medium">
                        O₂: <span className={pt.oxygen_requirement !== 'None' ? 'text-cyan-400 font-bold' : 'text-slate-400'}>{pt.oxygen_requirement}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {pt.required_equipment || 'Standard Monitoring'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isWaiting && (
                          <button
                            onClick={() => onNavigate('recommendations', { patientId: pt.id })}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-[11px] flex items-center gap-1 shadow-md shadow-purple-600/20 hover:brightness-110"
                            title="Find & Recommend Compatible Bed"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            <span>Match Bed</span>
                          </button>
                        )}

                        {pt.current_status === 'Admitted' && (
                          <button
                            onClick={() => handleDischarge(pt.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 border border-amber-600/50 text-amber-300 hover:bg-amber-900/50 text-[11px] font-medium"
                          >
                            Discharge
                          </button>
                        )}

                        <button
                          onClick={() => onNavigate('patient-details', { patientId: pt.id })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="View Clinical Chart"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Intake / Register Patient with Live Triage Preview */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-slate-700 shadow-2xl my-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <span>Clinical Patient Intake & Triage Assessment</span>
                </h3>
                <p className="text-xs text-slate-400">Deterministic physiological triage engine will classify acuity</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={125}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Presenting Clinical Symptoms *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Acute severe dyspnea, cyanosis, history of cardiac failure, unresponsive"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              {/* Vitals Grid */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-semibold text-cyan-400 font-mono text-[11px] uppercase tracking-wider block">
                  Physiological Vitals Intake
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      required
                      min={50}
                      max={100}
                      value={formData.spo2}
                      onChange={(e) => setFormData({ ...formData, spo2: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      required
                      min={20}
                      max={240}
                      value={formData.heart_rate}
                      onChange={(e) => setFormData({ ...formData, heart_rate: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">BP Sys (mmHg)</label>
                    <input
                      type="number"
                      required
                      min={40}
                      max={260}
                      value={formData.blood_pressure_sys}
                      onChange={(e) => setFormData({ ...formData, blood_pressure_sys: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">BP Dia (mmHg)</label>
                    <input
                      type="number"
                      required
                      min={20}
                      max={160}
                      value={formData.blood_pressure_dia}
                      onChange={(e) => setFormData({ ...formData, blood_pressure_dia: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      min={30}
                      max={45}
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Oxygen Support Required</label>
                  <select
                    value={formData.oxygen_requirement}
                    onChange={(e) => setFormData({ ...formData, oxygen_requirement: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="None">None (Room Air)</option>
                    <option value="Low Flow">Low Flow (Nasal Cannula)</option>
                    <option value="High Flow">High Flow (HFNC / NRB)</option>
                    <option value="Invasive">Invasive Mechanical Ventilation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Isolation Protocol</label>
                  <select
                    value={formData.isolation_requirement}
                    onChange={(e) => setFormData({ ...formData, isolation_requirement: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="None">None</option>
                    <option value="Airborne">Airborne Isolation</option>
                    <option value="Droplet">Droplet Precautions</option>
                    <option value="Contact">Contact Isolation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Department</label>
                  <select
                    value={formData.department_requirement}
                    onChange={(e) => setFormData({ ...formData, department_requirement: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                    <option value="Emergency">Emergency Medicine</option>
                    <option value="Cardiology">Cardiology (CCU)</option>
                    <option value="General Ward">General Medical Ward</option>
                    <option value="Isolation">Isolation Suites</option>
                    <option value="Surgical Recovery">Surgical Recovery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Additional Required Hardware</label>
                <input
                  type="text"
                  placeholder="e.g. Ventilator, Cardiac Monitor, Infusion Pump"
                  value={formData.required_equipment}
                  onChange={(e) => setFormData({ ...formData, required_equipment: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              {/* LIVE TRIAGE PREVIEW BOX */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-600/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Live Triage Engine Assessment
                  </span>
                  <PriorityBadge priority={triagePreview.priority} size="sm" />
                </div>
                <div className="text-[11px] text-slate-300">
                  Calculated Acuity Severity: <strong className="text-white font-mono">{triagePreview.score}/100</strong>
                </div>
                {triagePreview.factors.length > 0 && (
                  <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-0.5">
                    {triagePreview.factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-600/30"
                >
                  {isSubmitting ? 'Registering...' : 'Register & Run Triage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
