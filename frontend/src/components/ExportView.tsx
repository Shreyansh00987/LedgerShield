import React from 'react';
import { 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowRight,
  Info
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
  const rejected = transactions.filter(t => t.status === 'rejected').length;

  const isComplete = unresolved === 0 && total > 0;
  const exportUrl = getExportCsvUrl(sessionId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Export Reconciled Transactions</span>
          {isComplete ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
              100% Reconciled
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-950/70 text-amber-300 border border-amber-800/40">
              Audit In Progress
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review pre-flight validation status and download clean, audit-compliant transaction records.
        </p>
      </div>

      {/* Pre-Flight Audit Status Card */}
      <div className={`p-5 rounded-xl border ${
        isComplete 
          ? 'bg-emerald-950/20 border-emerald-800/40' 
          : 'bg-amber-950/20 border-amber-800/40'
      }`}>
        <div className="flex items-start space-x-3">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h2 className={`text-sm font-semibold ${isComplete ? 'text-emerald-200' : 'text-amber-200'}`}>
              {isComplete 
                ? 'Pre-Flight Checks Passed: Ready for Ledger Export' 
                : 'Attention: Unresolved Transactions Remain'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isComplete
                ? 'All transactions have been verified by a human reviewer or verified rule. No unverified suggestions remain.'
                : `${unresolved} transaction(s) have not been categorized or require client clarification. LedgerShield never silently treats AI suggestions as approved entries.`}
            </p>
          </div>
        </div>

        {/* Breakdown Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/60">
          <div className="bg-[#121520] p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400">Total Entries</span>
            <p className="text-base font-mono font-bold text-white mt-0.5">{total}</p>
          </div>
          <div className="bg-[#121520] p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-emerald-400">Approved & Edited</span>
            <p className="text-base font-mono font-bold text-emerald-300 mt-0.5">{accepted + edited}</p>
          </div>
          <div className="bg-[#121520] p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-blue-400">Pending Suggestions</span>
            <p className="text-base font-mono font-bold text-blue-300 mt-0.5">{suggested}</p>
          </div>
          <div className="bg-[#121520] p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-amber-400">Needs Clarification</span>
            <p className="text-base font-mono font-bold text-amber-300 mt-0.5">{unresolved}</p>
          </div>
        </div>
      </div>

      {/* Export Action Card */}
      <div className="p-6 rounded-xl bg-[#111420] border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3">
          <FileSpreadsheet className="w-7 h-7 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Clean Reconciliation CSV</h3>
            <p className="text-xs text-slate-400">
              Includes original bank descriptions, mapped account codes, human audit notes, and confidence metadata.
            </p>
          </div>
        </div>

        <a
          href={exportUrl}
          download
          className="w-full py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download Reconciled CSV File</span>
        </a>

        {/* Compatibility Details */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Compatible with QuickBooks Online, Xero, Sage Intacct, and Excel</span>
          <span>UTF-8 Encoded • Safe Formula Sanitized</span>
        </div>
      </div>
    </div>
  );
};
