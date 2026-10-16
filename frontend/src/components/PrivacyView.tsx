import React, { useState } from 'react';
import { ShieldCheck, Lock, Database, Trash2, Cpu, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
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
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Privacy & Model Runtime Center</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
            Verified Local-First
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed architectural transparency on data residency, network boundaries, and open-weight model runtimes.
        </p>
      </div>

      {/* Verified Claims Card */}
      <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-300 font-semibold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Architectural Privacy Verification</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          LedgerShield is architected so that confidential banking transactions, payee names, invoice amounts, and client identities are processed locally on your machine and are never transmitted to third-party cloud AI APIs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero Remote AI API Network Calls</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Local SQLite Persistence Only</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Formulas & Macro Injection Defenses</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audit Logs Exclude Transaction Payloads</span>
          </div>
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Engine Status */}
        <div className="p-5 rounded-xl bg-[#111420] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Inference Runtime</span>
            </h2>
            <button
              onClick={onRefreshHealth}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="Refresh runtime health"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Provider:</span>
              <span className="text-slate-200">{health?.model_runtime.provider || 'Local Engine'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Active Model:</span>
              <span className="text-slate-200">{health?.model_runtime.active_model || 'heuristic'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Local Daemon Status:</span>
              <span className={health?.model_runtime.available ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.model_runtime.available ? 'Connected' : 'Offline (Using Heuristic Subsystem)'}
              </span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="p-5 rounded-xl bg-[#111420] border border-slate-800 space-y-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Local Database Storage</span>
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Engine:</span>
              <span className="text-slate-200">SQLite 3 (Embedded)</span>
            </div>
            <div className="py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans block mb-0.5">Database Path:</span>
              <span className="text-slate-300 text-[10px] break-all">{health?.privacy.db_path || 'data/ledgershield.db'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data & Reset */}
      <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-4">
        <div className="flex items-center space-x-2 text-rose-300 font-semibold text-sm">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Local Data Purge</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Need to remove client financial records from this device? This action wipes all local SQLite session tables, transactions, and audit records immediately.
        </p>

        {confirmOpen ? (
          <div className="p-3 bg-rose-950/60 rounded-md border border-rose-800/60 space-y-2">
            <p className="text-xs font-medium text-rose-200">Are you sure? This cannot be undone.</p>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition"
              >
                {clearing ? 'Purging...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-3.5 py-2 rounded-md bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition"
          >
            Purge All Local Records
          </button>
        )}

        {clearedMsg && (
          <p className="text-xs text-emerald-400 font-medium">
            ✓ All local transaction records and sessions successfully deleted.
          </p>
        )}
      </div>
    </div>
  );
};
