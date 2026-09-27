import React from 'react';
import { Info } from 'lucide-react';

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-400 text-xs">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Decision-Support Prototype • Does not replace clinical diagnosis • Qualified staff verification mandatory.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/80 border border-cyan-900/40 rounded-xl text-slate-300 text-xs shadow-inner">
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-200">Clinical Operations Decision Support Notice: </span>
          <span className="text-slate-400">MediFlow provides deterministic optimization & triage prioritization aids for hospital staff. Final patient admission and allocation decisions remain under clinician authorization.</span>
        </div>
      </div>
      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400 border border-slate-700">PRD 1.0 Compliance</span>
    </div>
  );
};
