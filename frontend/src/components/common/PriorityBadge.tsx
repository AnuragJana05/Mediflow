import React from 'react';
import { PriorityLevel } from '../../types';
import { AlertTriangle, Flame, Clock, ShieldCheck } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  switch (priority) {
    case 'Critical':
      return (
        <span className={`inline-flex items-center font-bold tracking-wide uppercase rounded-full bg-red-950/80 border border-red-500/80 text-red-200 shadow-sm shadow-red-900/50 ${sizeClasses}`}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-0.5" />
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>Critical</span>
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-orange-950/70 border border-orange-500/60 text-orange-200 ${sizeClasses}`}>
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>High</span>
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-950/60 border border-amber-500/50 text-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Low</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-800 text-slate-300 ${sizeClasses}`}>
          <span>{priority}</span>
        </span>
      );
  }
};
