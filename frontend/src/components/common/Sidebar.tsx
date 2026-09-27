import React from 'react';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Grid,
  Cpu,
  Bell,
  BarChart3,
  Zap,
  ClipboardList,
  Settings,
  ChevronRight,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  activeAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertCount = 0
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'patients', label: 'Patient Queue & Intake', icon: Users, badge: null },
    { id: 'beds', label: 'Bed Inventory & Status', icon: BedDouble, badge: null },
    { id: 'bed-map', label: 'Visual Bed Map', icon: Grid, badge: 'Live' },
    { id: 'recommendations', label: 'Smart Bed Matching', icon: Cpu, badge: 'AI Engine' },
    { id: 'alerts', label: 'Alerts Center', icon: Bell, badge: activeAlertCount > 0 ? `${activeAlertCount}` : null, isAlert: true },
    { id: 'analytics', label: 'Capacity Analytics', icon: BarChart3, badge: null },
    { id: 'simulation', label: 'Surge Simulator', icon: Zap, badge: 'Surge', highlight: true },
    { id: 'audit-logs', label: 'Audit Trail', icon: ClipboardList, badge: null },
    { id: 'settings', label: 'Hospital Config', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#0a1020]/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)]">
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Hospital Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/40 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                  : item.highlight
                  ? 'text-amber-300 hover:bg-amber-950/30 hover:text-amber-200 border border-amber-900/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-cyan-400'
                      : item.highlight
                      ? 'text-amber-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                    item.isAlert && activeAlertCount > 0
                      ? 'bg-rose-500 text-white animate-pulse'
                      : item.id === 'recommendations'
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                      : item.highlight
                      ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Staff footer card */}
      <div className="p-3 m-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="font-mono text-[10px] uppercase">Active Session</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="font-medium text-slate-200 truncate">{user?.name}</div>
        <div className="text-[11px] text-cyan-400 font-mono capitalize">{user?.role} Access</div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => onNavigate('admin-login')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            title="Administrator Login Portal"
          >
            <Shield className="w-3 h-3" />
            <span>Admin Portal</span>
          </button>
          <button
            onClick={logout}
            className="text-[11px] text-slate-500 hover:text-rose-400 font-medium flex items-center gap-1 transition-colors"
            title="Sign out of current account"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
