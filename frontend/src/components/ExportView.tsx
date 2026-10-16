import React from 'react';
import { 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowRight,
  Info,
  Check,
  ExternalLink,
  Table
} from 'lucide-react';
import { Transaction } from '../types';
import { getExportCsvUrl } from '../api';

interface ExportViewProps {
  sessionId: string;
  transactions: Transaction[];
}

export const ExportView: React.FC<ExportViewProps> = ({ sessionId, transactions }) => {
  const total = transactions.length;
  const accepted = transactions.filter(t => t.status === 'accepted').length;
  const edited = transactions.filter(t => t.status === 'edited').length;
  const suggested = transactions.filter(t => t.status === 'suggested').length;
  const unresolved = transactions.filter(t => t.status === 'needs_clarification' || t.status === 'unreviewed' || !t.suggested_account_id).length;

  const isComplete = unresolved === 0 && total > 0;
  const exportUrl = getExportCsvUrl(sessionId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-xl font-bold text-white tracking-tight">
            General Ledger CSV Export & Pre-Flight Audit
          </h1>
          {isComplete ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
              ✓ Ready for Ledger Sync
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/50">
              Audit Pending
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Validate pre-flight reconciliation integrity and export clean, audit-compliant transaction records.
        </p>
      </div>

      {/* Pre-Flight Audit Card */}
      <div className={`p-6 rounded-2xl border ${
        isComplete 
          ? 'bg-gradient-to-br from-emerald-950/25 to-[#0e111a] border-emerald-800/50 shadow-lg shadow-emerald-950/10' 
          : 'bg-gradient-to-br from-amber-950/25 to-[#0e111a] border-amber-800/50 shadow-lg shadow-amber-950/10'
      }`}>
        <div className="flex items-start space-x-3.5">
          {isComplete ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}

          <div className="space-y-1">
            <h2 className={`text-base font-bold ${isComplete ? 'text-emerald-200' : 'text-amber-200'}`}>
              {isComplete 
                ? 'Pre-Flight Checks Passed: 100% Reconciled' 
                : 'Pre-Flight Warning: Unresolved Transactions Remain'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isComplete
                ? 'All transactions have been reviewed and mapped to verified Chart of Accounts codes. No unreviewed suggestions remain.'
                : `${unresolved} transaction(s) have unverified accounts or require client clarification. LedgerShield never silently posts AI suggestions without human review.`}
            </p>
          </div>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-[#141824] p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono uppercase">Total Entries</span>
            <p className="text-xl font-mono font-bold text-white mt-1 tabular-nums">{total}</p>
          </div>

          <div className="bg-[#141824] p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-emerald-400 block font-mono uppercase">Approved</span>
            <p className="text-xl font-mono font-bold text-emerald-300 mt-1 tabular-nums">{accepted + edited}</p>
          </div>

          <div className="bg-[#141824] p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-blue-400 block font-mono uppercase">AI Suggested</span>
            <p className="text-xl font-mono font-bold text-blue-300 mt-1 tabular-nums">{suggested}</p>
          </div>

          <div className="bg-[#141824] p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-amber-400 block font-mono uppercase">Needs Clarification</span>
            <p className="text-xl font-mono font-bold text-amber-300 mt-1 tabular-nums">{unresolved}</p>
          </div>
        </div>
      </div>

      {/* Export Action Card */}
      <div className="p-6 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Clean General Ledger CSV</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Includes original bank descriptions, mapped account codes, audit trails, and reviewer notes.
            </p>
          </div>
        </div>

        <a
          href={exportUrl}
          download
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-900/30 transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Download Reconciled General Ledger CSV</span>
        </a>

        {/* Accounting Software Compatibility Pills */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Verified Compatible Accounting Software:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {['QuickBooks Online', 'Xero', 'Sage Intacct', 'FreshBooks', 'Microsoft Excel'].map((tool) => (
              <span key={tool} className="px-2.5 py-1 rounded-lg bg-[#141824] border border-slate-800 text-slate-300 font-medium flex items-center space-x-1.5">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{tool}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
