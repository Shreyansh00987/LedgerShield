import React from 'react';
import { TransactionStatus, MatchSource } from '../types';

interface StatusBadgeProps {
  status: TransactionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'accepted':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
          Accepted
        </span>
      );
    case 'edited':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-cyan-400"></span>
          Edited
        </span>
      );
    case 'suggested':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-400"></span>
          Suggested
        </span>
      );
    case 'needs_clarification':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
          Needs Clarification
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
          Rejected
        </span>
      );
    case 'unreviewed':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Unreviewed
        </span>
      );
  }
};

interface SourceBadgeProps {
  source: MatchSource;
  confidence?: number;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, confidence }) => {
  const confText = confidence !== undefined ? ` ${(confidence * 100).toFixed(0)}%` : '';
  
  if (source === 'exact_rule') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/30" title="Deterministic rule match">
        Rule{confText}
      </span>
    );
  }
  if (source === 'historical_pattern') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-800/30" title="Historical approved pattern">
        History{confText}
      </span>
    );
  }
  if (source === 'local_ai') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-sky-950/40 text-sky-300 border border-sky-800/30" title="Local Open-Weight AI inference">
        Local AI{confText}
      </span>
    );
  }
  if (source === 'heuristic_fallback') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/30" title="Deterministic semantic fallback">
        Heuristic{confText}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
      Manual
    </span>
  );
};
