import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash2, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ServerOff,
  FileCheck
} from 'lucide-react';
import { HealthStatus } from '../types';
import { clearLocalData } from '../api';

interface PrivacyViewProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  onDataCleared: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  health,
  onRefreshHealth,
  onDataCleared
}) => {
  const [clearing, setClearing] = useState(false);
  const [clearedMsg, setClearedMsg] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearLocalData();
      setClearedMsg(true);
      setConfirmOpen(false);
      onDataCleared();
      setTimeout(() => setClearedMsg(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Privacy & Open-Weight Runtime Center
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
            Verified Local-First
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Full architectural transparency on financial data residency, network boundaries, and local open-weight model execution.
        </p>
      </div>

      {/* Verified Core Guarantee */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/20 to-[#0e111a] border border-emerald-800/40 space-y-4 shadow-lg shadow-emerald-950/10">
        <div className="flex items-center space-x-3 text-emerald-300 font-bold text-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">The LedgerShield Data Guarantee</p>
            <p className="text-xs text-emerald-400 font-normal">
              "Financial transaction records are processed locally and are not sent to an external AI API by the application's reconciliation workflow."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-200 p-2.5 rounded-xl bg-[#121622] border border-slate-800">
            <ServerOff className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>0 Outbound Remote AI API Calls</span>
          </div>
          <div className="flex items-center space-x-2.5 text-slate-200 p-2.5 rounded-xl bg-[#121622] border border-slate-800">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Local SQLite Embedded Persistence Only</span>
          </div>
          <div className="flex items-center space-x-2.5 text-slate-200 p-2.5 rounded-xl bg-[#121622] border border-slate-800">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>DDE & Spreadsheet Formula Injection Defense</span>
          </div>
          <div className="flex items-center space-x-2.5 text-slate-200 p-2.5 rounded-xl bg-[#121622] border border-slate-800">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audit Logs Exclude Transaction Amounts</span>
          </div>
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Model Engine Status */}
        <div className="p-6 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Model Runtime Engine</span>
            </h2>
            <button
              onClick={onRefreshHealth}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Refresh runtime health"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-500 font-sans">Provider:</span>
              <span className="text-slate-200 font-semibold">{health?.model_runtime.provider || 'Local Engine'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-500 font-sans">Target Model:</span>
              <span className="text-cyan-400 font-semibold">{health?.model_runtime.active_model || 'Gemma 2 2B Instruction'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-500 font-sans">Local Daemon:</span>
              <span className={health?.model_runtime.available ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {health?.model_runtime.available ? 'Connected (Ollama)' : 'Offline (Using Heuristic Subsystem)'}
              </span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="p-6 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Local Storage Specifications</span>
            </h2>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-500 font-sans">Database Engine:</span>
              <span className="text-slate-200 font-semibold">SQLite 3 (WAL Mode)</span>
            </div>
            <div className="py-1.5 border-b border-slate-800/80">
              <span className="text-slate-500 font-sans block mb-1">Local File Path:</span>
              <span className="text-slate-300 text-[10px] break-all bg-[#08090e] p-2 rounded-lg border border-slate-800 block">
                {health?.privacy.db_path || 'data/ledgershield.db'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Clear Data & Reset Action Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/20 to-[#0e111a] border border-rose-900/40 space-y-4">
        <div className="flex items-center space-x-2.5 text-rose-300 font-bold text-sm">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Local Data Purge</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Need to remove client financial records from this workstation after an engagement? This action wipes all local SQLite session tables, transactions, and audit records with one click.
        </p>

        {confirmOpen ? (
          <div className="p-4 bg-rose-950/70 rounded-xl border border-rose-800 space-y-3">
            <p className="text-xs font-bold text-rose-200">Are you sure? All local session records will be permanently erased.</p>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm"
              >
                {clearing ? 'Purging...' : 'Yes, Permanently Delete All'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 text-xs font-bold transition shadow-sm"
          >
            Purge All Local Records & Sessions
          </button>
        )}

        {clearedMsg && (
          <p className="text-xs text-emerald-400 font-bold pt-1">
            ✓ All local transaction records and sessions successfully deleted.
          </p>
        )}
      </div>

    </div>
  );
};
