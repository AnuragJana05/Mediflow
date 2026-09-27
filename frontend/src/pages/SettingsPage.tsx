import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Settings,
  Shield,
  Server,
  FileCode,
  CheckCircle2,
  Database,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <DisclaimerBanner compact />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>System Settings & Hospital Profile</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Operations parameters, clinical capacity thresholds, role access boundaries, and API integration endpoints.
        </p>
      </div>

      {/* Hospital Profile Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Facility Profile & Node Configuration</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Facility Name</span>
            <div className="font-bold text-slate-200 text-sm mt-1">MediFlow Memorial Medical Center</div>
            <span className="text-[10px] text-slate-500 font-mono">Node ID: MEDI-CORE-01</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">System Status</span>
            <div className="font-bold text-emerald-400 text-sm mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full Operational Capacity</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Version 1.0.0 (Release)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">FastAPI Backend Docs</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-cyan-400 hover:text-cyan-300 text-sm mt-1 flex items-center gap-1"
            >
              <span>Interactive Swagger API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-[10px] text-slate-500 font-mono">OpenAPI Specification 3.1</span>
          </div>
        </div>
      </div>

      {/* Role-Based Permissions Reference Matrix */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
        </h2>
        <p className="text-xs text-slate-400">
          Enforced per PRD specifications across all backend REST endpoints and frontend routing.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">System Permission / Action</th>
                <th className="py-2.5 px-3 text-center">Administrator</th>
                <th className="py-2.5 px-3 text-center">Doctor / Attending</th>
                <th className="py-2.5 px-3 text-center">Triage Nurse / Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">View Operations Dashboard & Bed Map</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Intake & Register New Patients</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Run Smart Bed Matching Engine</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Approve / Authorize Bed Allocation</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-slate-500">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Override Triage Priority with Justification</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-slate-500">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Update Bed Status (Cleaning, Ready, Maintenance)</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Add New Hospital Beds & Manage Departments</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-slate-500">NO</td>
                <td className="text-center text-slate-500">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-sans">Trigger Mass-Casualty Surge Simulation</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-emerald-400 font-bold">YES</td>
                <td className="text-center text-slate-500">NO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety & Ethics Disclaimer */}
      <div className="glass-panel p-5 rounded-2xl border-cyan-800/40 text-xs text-slate-300 space-y-2">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Product Boundaries & Synthetic Data Privacy Notice</span>
        </h3>
        <p className="text-slate-400 leading-relaxed">
          MediFlow is designed solely with synthetic simulation data. No real protected health information (PHI) or personal patient identifiers are collected or stored. Bed recommendations and priority classifications are operational decision-support recommendations; final care determinations remain strictly with licensed clinical practitioners.
        </p>
      </div>
    </div>
  );
};
