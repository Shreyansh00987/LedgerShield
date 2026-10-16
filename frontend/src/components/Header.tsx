import React from 'react';
import { Shield, Sparkles, Database, Play, RefreshCw, Lock } from 'lucide-react';
import { HealthStatus, SessionSummary } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onLoadDemo: () => void;
  onRunReconciliation: () => void;
  isReconciling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  sessions,
  currentSessionId,
  onSelectSession,
  onLoadDemo,
  onRunReconciliation,
  isReconciling
}) => {
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const isModelLive = health?.model_runtime.available ?? false;

  return (
    <header className="border-b border-slate-800 bg-[#0e111a] px-6 py-3.5 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-lg tracking-tight text-white">LedgerShield</span>
              <span className="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800/40">
                v1.0 Local
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">Reconcile confidently. Keep financial data local.</p>
          </div>
        </div>

        {/* Status Indicators & Session Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Privacy Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300" title="All financial transaction data processed locally on device">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Local-First</span>
            <span className="text-emerald-500">•</span>
            <span className="text-emerald-400/90 text-[11px]">0 Cloud AI Requests</span>
          </div>

          {/* Model Status Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/60 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isModelLive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-slate-200">
              {isModelLive ? health?.model_runtime.active_model : 'Local Heuristic Engine'}
            </span>
          </div>

          {/* Session Selector */}
          {sessions.length > 0 && (
            <select
              value={currentSessionId || ''}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.total_count} txs)
                </option>
              ))}
            </select>
          )}

          {/* Load Demo Button */}
          <button
            onClick={onLoadDemo}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Load Demo Data</span>
          </button>

          {/* Run Reconciliation Action */}
          {currentSessionId && (
            <button
              onClick={onRunReconciliation}
              disabled={isReconciling}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm disabled:opacity-50 transition"
            >
              {isReconciling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reconciling...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Reconciliation</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
