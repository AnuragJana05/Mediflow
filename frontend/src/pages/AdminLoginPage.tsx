import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Stethoscope,
  Activity,
  Server,
  FileCheck
} from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onSwitchToStaffLogin: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onSwitchToStaffLogin
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@mediflow.health');
  const [password, setPassword] = useState('admin123');
  const [securityPin, setSecurityPin] = useState('948210');
  const [require2FA, setRequire2FA] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Verify 2FA PIN format if enabled
    if (require2FA && securityPin.length < 4) {
      setError('Please provide a valid 6-digit Administrator Security PIN.');
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login('admin@mediflow.health', 'admin123');
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Administrator login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header Branding with Executive Emblem */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-700 text-white shadow-2xl shadow-indigo-600/30 ring-1 ring-white/20 mb-1">
            <Shield className="w-9 h-9" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              Medi<span className="text-indigo-400">Flow</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 uppercase">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Hospital Executive Operations & Resource Governance System
          </p>
        </div>

        {/* Security Clearance Notice Banner */}
        <div className="glass-panel p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 text-xs flex items-center justify-between gap-3 text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Restricted Access: <strong>Tier-1 Administrative & COO Clearance Only</strong></span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 uppercase">
            MFA Active
          </span>
        </div>

        {/* Form Container */}
        <div className="glass-panel p-7 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-5 bg-[#0b1020]/90">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div>
              <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>Executive Authentication</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Enter hospital administrator credentials and security key</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TLS 1.3 SECURE</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/50 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Administrator Hospital Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@mediflow.health"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Master Administrative Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* 2FA / Security PIN */}
            {require2FA && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>2FA Security Token / PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSecurityPin('948210')}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    Auto-Fill Demo Token
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="948210"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-indigo-300 font-mono tracking-widest text-center text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Shield className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying Credentials...' : 'Authenticate as Administrator'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Quick Demo Pre-Fill Action */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Pre-Configured Executive Demo Account:
              </span>
              <span className="text-[10px] font-mono text-slate-400">COO Tier</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <div className="font-bold text-slate-200">Dr. Sarah Chen</div>
                <div className="text-[11px] text-slate-400">Hospital Administrator • COO</div>
              </div>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1"
              >
                <span>1-Click Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Switch to Clinical Staff Login */}
          <div className="pt-2 text-center border-t border-slate-800/80">
            <button
              type="button"
              onClick={onSwitchToStaffLogin}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              <span>Looking for Clinical Staff Login (Doctors & Nurses)? Click here &rarr;</span>
            </button>
          </div>
        </div>

        {/* Audit Warning */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <FileCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong>Operational Governance Warning:</strong> All actions performed via this administrative session (bed inventory changes, department parameter updates, surge simulations, and user provisioning) are logged permanently in the MediFlow immutable audit log.
          </p>
        </div>
      </div>
    </div>
  );
};
