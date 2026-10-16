import React from 'react';
import { 
  Shield, 
  Sparkles, 
  Database, 
  Play, 
  RefreshCw, 
  Lock, 
  Cpu, 
  Award,
  ChevronDown
} from 'lucide-react';
import { HealthStatus, SessionSummary } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onLoadDemo: () => void;
  onRunReconciliation: () => void;
  isReconciling: boolean;
  onOpenVault?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  sessions,
  currentSessionId,
  onSelectSession,
  onLoadDemo,
  onRunReconciliation,
  isReconciling,
  onOpenVault
}) => {
  const isModelLive = health?.model_runtime.available ?? false;
  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <header className="border-b border-slate-800/80 bg-[#0c0f18]/95 backdrop-blur-md px-6 py-3 sticky top-0 z-30 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/25 to-cyan-500/15 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-900/30">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c0f18] animate-pulse" title="Local engine active"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white bg-clip-text">
                LedgerShield
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-950/80 text-blue-300 border border-blue-800/50">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Gemma 2 Powered</span>
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/40 text-amber-300 border border-amber-800/30">
                <Award className="w-3 h-3 text-amber-400" />
                <span>Side Hustle 2026</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">
              Reconcile confidently. Keep financial data local.
            </p>
          </div>
        </div>

        {/* Runtime Diagnostics & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Interactive 3D Spatial Vault Button */}
          {onOpenVault && (
            <button
              onClick={onOpenVault}
              className="btn-3d flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-700/50 text-xs text-cyan-300 font-semibold cursor-pointer"
              title="Explore interactive 3D local privacy architecture vault"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Spatial Vault</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          )}

          {/* Privacy Verification Pill */}
          <div 
            onClick={onOpenVault}
            className="badge-3d flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 shadow-sm cursor-pointer hover:border-emerald-500/50 transition"
            title="All financial transaction data processed locally on device - Zero remote AI calls (Click to inspect)"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[11px]">100% Local</span>
            <span className="text-emerald-500/70">•</span>
            <span className="text-emerald-400/90 text-[11px] font-mono">0 Cloud Packets</span>
          </div>

          {/* Model Engine Status */}
          <div className="badge-3d flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#141824] border border-slate-700/60 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isModelLive ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`}></span>
            <span className="text-slate-400 text-[11px]">Engine:</span>
            <span className="font-mono text-slate-100 font-medium text-[11px]">
              {isModelLive ? (health?.model_runtime.active_model || 'Gemma 2 2B') : 'Local Heuristic Engine'}
            </span>
          </div>

          {/* Session Selector */}
          {sessions.length > 0 && (
            <div className="relative">
              <select
                value={currentSessionId || ''}
                onChange={(e) => onSelectSession(e.target.value)}
                className="appearance-none bg-[#141824] border border-slate-700/80 text-xs text-slate-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-500 font-medium cursor-pointer hover:border-slate-600 transition"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.total_count} txs)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Quick Demo Data Loader */}
          <button
            onClick={onLoadDemo}
            className="btn-3d inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161c2a] hover:bg-[#1e2638] text-slate-200 border border-slate-700/70 hover:border-blue-500/50 transition"
            title="Load Northstar Electrical Services synthetic demo transactions"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Demo Data</span>
          </button>

          {/* Primary Reconciliation Trigger */}
          {currentSessionId && (
            <button
              onClick={onRunReconciliation}
              disabled={isReconciling}
              className="btn-3d inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-900/40 disabled:opacity-50 transition"
            >
              {isReconciling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reconciling with AI...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
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
