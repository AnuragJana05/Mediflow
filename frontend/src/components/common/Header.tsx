import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { Activity, Bell, ChevronDown, Wifi, Shield, Stethoscope, HeartPulse, LogOut, KeyRound } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  activeAlertCount: number;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeAlertCount, onNavigate }) => {
  const { user, switchDemoRole, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const rolesConfig: Record<UserRole, { label: string; icon: any; color: string }> = {
    admin: { label: 'Administrator', icon: Shield, color: 'text-indigo-400 bg-indigo-950/80 border-indigo-700/50' },
    doctor: { label: 'Attending Physician', icon: Stethoscope, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700/50' },
    nurse: { label: 'Triage Nurse', icon: HeartPulse, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700/50' },
  };

  const currentRoleConfig = rolesConfig[user?.role || 'doctor'];
  const RoleIcon = currentRoleConfig.icon;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-[#0c1427]/90 backdrop-blur-md border-b border-slate-800/80 text-white">
      {/* Brand & Hospital Center */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0c1427] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">Medi<span className="text-cyan-400">Flow</span></span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase">OPS v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-medium">Smart Hospital Bed & Patient Allocation Command</p>
          </div>
        </div>

        {/* Live Telemetry Ping */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs">
          <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {isConnected ? 'LIVE TELEMETRY' : 'RECONNECTING'}
          </span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </div>
      </div>

      {/* Right Controls: Fast Role Switcher, Admin Portal Link & Alerts */}
      <div className="flex items-center gap-3">
        {/* Quick Admin Portal Button */}
        {user?.role !== 'admin' ? (
          <button
            onClick={() => onNavigate('admin-login')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/50 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition-all hover:border-indigo-400 shadow-sm"
            title="Go to Administrator Login Page"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin Portal</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-600/40 text-indigo-300 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>ADMINISTRATOR MODE</span>
          </div>
        )}

        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${currentRoleConfig.color} hover:brightness-110`}
            title="Fast Role Switcher & Account Operations"
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="font-semibold text-slate-100">{user?.name || 'Staff User'}</div>
              <div className="text-[10px] opacity-80">{currentRoleConfig.label}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Switch Role (Instant Demo)
              </div>
              
              <button
                onClick={() => { switchDemoRole('admin'); setDropdownOpen(false); }}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors ${user?.role === 'admin' ? 'bg-indigo-950/70 border border-indigo-500/50' : 'hover:bg-slate-800'}`}
              >
                <div className="p-1.5 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Dr. Sarah Chen</div>
                  <div className="text-[11px] text-slate-400">Hospital Administrator • COO</div>
                </div>
              </button>

              <button
                onClick={() => { switchDemoRole('doctor'); setDropdownOpen(false); }}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors mt-1 ${user?.role === 'doctor' ? 'bg-emerald-950/70 border border-emerald-500/50' : 'hover:bg-slate-800'}`}
              >
                <div className="p-1.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Dr. Marcus Smith, MD</div>
                  <div className="text-[11px] text-slate-400">Attending Physician / Doctor</div>
                </div>
              </button>

              <button
                onClick={() => { switchDemoRole('nurse'); setDropdownOpen(false); }}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 text-xs transition-colors mt-1 ${user?.role === 'nurse' ? 'bg-cyan-950/70 border border-cyan-500/50' : 'hover:bg-slate-800'}`}
              >
                <div className="p-1.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Clara Evans, BSN RN</div>
                  <div className="text-[11px] text-slate-400">Triage & Bed Flow Nurse</div>
                </div>
              </button>

              {/* Portal Navigation & Logout */}
              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                <button
                  onClick={() => { onNavigate('admin-login'); setDropdownOpen(false); }}
                  className="w-full text-left p-2 rounded-lg flex items-center gap-2.5 text-xs text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold">Administrator Login Portal</div>
                    <div className="text-[10px] text-slate-400">Dedicated 2FA Executive Login Page</div>
                  </div>
                </button>

                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full text-left p-2 rounded-lg flex items-center gap-2.5 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold">Sign Out Current Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alerts Center Notification Button */}
        <button
          onClick={() => onNavigate('alerts')}
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Hospital Alerts Center"
        >
          <Bell className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold border-2 border-[#0c1427] animate-pulse">
              {activeAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
