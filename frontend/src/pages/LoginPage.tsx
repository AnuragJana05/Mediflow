import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, Stethoscope, HeartPulse, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToAdminLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToAdminLogin }) => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('dr.smith@mediflow.health');
  const [password, setPassword] = useState('doctor123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await switchDemoRole(role);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 mb-1">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Medi<span className="text-cyan-400">Flow</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Smart Hospital Bed & Patient Allocation Operations Platform
          </p>
        </div>

        {/* Login Form Box */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Staff Authentication
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              JWT Secured
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/50 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Hospital Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Instant 1-Click Demo Roles:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-center transition-colors flex flex-col items-center gap-1"
              >
                <Shield className="w-4 h-4" />
                <span className="font-semibold text-[11px]">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('doctor')}
                className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-center transition-colors flex flex-col items-center gap-1"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="font-semibold text-[11px]">Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('nurse')}
                className="p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-700/50 text-cyan-300 text-center transition-colors flex flex-col items-center gap-1"
              >
                <HeartPulse className="w-4 h-4" />
                <span className="font-semibold text-[11px]">Nurse</span>
              </button>
            </div>

            {/* Dedicated Administrator Portal Link */}
            {onNavigateToAdminLogin && (
              <button
                type="button"
                onClick={onNavigateToAdminLogin}
                className="w-full mt-3 p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/60 text-indigo-300 flex items-center justify-between text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Hospital Administrator & Executive Portal</span>
                </div>
                <span className="text-[11px] text-indigo-400 font-mono">Sign In &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Prototype safety reminder */}
        <p className="text-center text-[11px] text-slate-500 max-w-xs mx-auto">
          Operational decision-support prototype. Medical recommendations require qualified staff verification.
        </p>
      </div>
    </div>
  );
};
