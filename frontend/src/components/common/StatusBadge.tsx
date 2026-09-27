import React from 'react';
import { BedStatus } from '../../types';
import { CheckCircle2, UserCheck, Sparkles, Lock, Wrench } from 'lucide-react';

interface StatusBadgeProps {
  status: BedStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  switch (status) {
    case 'Available':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Available</span>
        </span>
      );
    case 'Occupied':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-300 ${sizeClasses}`}>
          <UserCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Occupied</span>
        </span>
      );
    case 'Cleaning':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-300 ${sizeClasses}`}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Cleaning</span>
        </span>
      );
    case 'Reserved':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-sky-950/70 border border-sky-500/50 text-sky-300 ${sizeClasses}`}>
          <Lock className="w-3.5 h-3.5 text-sky-400" />
          <span>Reserved</span>
        </span>
      );
    case 'Maintenance':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-800/80 border border-slate-600/50 text-slate-300 ${sizeClasses}`}>
          <Wrench className="w-3.5 h-3.5 text-slate-400" />
          <span>Maintenance</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};
