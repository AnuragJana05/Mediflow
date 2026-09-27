import React from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { AlertCircle, CheckCircle, Info, X, Zap } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWebSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const borderColors = {
          info: 'border-cyan-500/50 bg-slate-900/95 text-cyan-200',
          success: 'border-emerald-500/50 bg-slate-900/95 text-emerald-200',
          warning: 'border-amber-500/50 bg-slate-900/95 text-amber-200',
          critical: 'border-rose-500/80 bg-slate-950/95 text-rose-200 shadow-rose-950/50',
        }[toast.type];

        const Icon = {
          info: Info,
          success: CheckCircle,
          warning: AlertCircle,
          critical: Zap,
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-fade-in ${borderColors}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-slate-100 flex items-center justify-between">
                <span>{toast.title}</span>
                <span className="text-[10px] font-mono text-slate-400">Just now</span>
              </div>
              <div className="text-slate-300 mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
