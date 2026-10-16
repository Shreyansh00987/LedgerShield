import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  BookmarkPlus, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Transaction, Account, TransactionStatus } from '../types';
import { StatusBadge, SourceBadge } from './StatusBadge';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  accounts: Account[];
  onClose: () => void;
  onUpdate: (id: string, updates: { suggested_account_id?: string | null; status?: TransactionStatus; human_note?: string }) => void;
  onCreateRule: (pattern: string, accountId: string, description: string) => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  accounts,
  onClose,
  onUpdate,
  onCreateRule
}) => {
  if (!transaction) return null;

  const [note, setNote] = useState(transaction.human_note || '');
  const [selectedAccountId, setSelectedAccountId] = useState(transaction.suggested_account_id || '');
  const [ruleSaved, setRuleSaved] = useState(false);

  const matchedAccount = accounts.find(a => a.id === (selectedAccountId || transaction.suggested_account_id));

  const handleSaveNote = () => {
    onUpdate(transaction.id, {
      human_note: note,
      suggested_account_id: selectedAccountId || null
    });
  };

  const handleCreateRule = () => {
    if (!transaction.normalized_merchant || !selectedAccountId) return;
    onCreateRule(
      transaction.normalized_merchant,
      selectedAccountId,
      `Auto-categorize payments to ${transaction.normalized_merchant}`
    );
    setRuleSaved(true);
    setTimeout(() => setRuleSaved(false), 3000);
  };

  // Quick preset accounts for trade contractors
  const quickPresets = ['5010', '6020', '6060', '6070', '4010'];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0e111a] border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-[#121622]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Audit Inspector</h2>
            <p className="text-[11px] text-slate-400 font-mono">Reference: {transaction.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
        
        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-[#141824] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Transaction Date</span>
            <span className="font-mono text-slate-200 font-semibold">{transaction.date}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Amount</span>
            <span className={`font-mono font-bold text-base tabular-nums ${
              transaction.amount > 0 ? 'text-emerald-400' : 'text-slate-100'
            }`}>
              {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)} {transaction.currency}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 text-xs">Review Status</span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* Normalization Audit Trail */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Bank Feed Normalization</span>
          </h3>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Raw Bank Line</label>
              <div className="p-2.5 rounded-lg bg-[#08090e] border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
                {transaction.original_description}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Extracted Merchant Identifier</label>
              <div className="p-2.5 rounded-lg bg-[#08090e] border border-slate-800 font-semibold text-slate-100">
                {transaction.normalized_merchant || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning & Evidence */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inference Rationale & Evidence</span>
            </h3>
            <SourceBadge source={transaction.match_source} confidence={transaction.confidence} />
          </div>

          <div className="p-3.5 rounded-xl bg-[#141824] border border-slate-800 space-y-2.5">
            <div>
              <span className="text-[11px] text-slate-500 block">Explanation:</span>
              <p className="mt-0.5 text-slate-100 text-xs leading-relaxed font-medium">
                {transaction.explanation || 'No automated explanation generated.'}
              </p>
            </div>
            {transaction.evidence && (
              <div>
                <span className="text-[11px] text-slate-500 block">Observed Evidence:</span>
                <p className="mt-0.5 text-slate-300 text-[11px] font-mono bg-[#08090e] p-2 rounded border border-slate-800/80">
                  {transaction.evidence}
                </p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Confidence Score:</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.round(transaction.confidence * 100)}%` }}
                  ></div>
                </div>
                <span className="font-mono font-bold text-cyan-300">
                  {(transaction.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            * Algorithmic confidence estimate generated by local logic, not a calibrated legal probability.
          </p>
        </div>

        {/* Missing Info Alert */}
        {transaction.missing_information && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clarification Required from Client</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {transaction.missing_information}
            </p>
          </div>
        )}

        {/* Account Assignment & Quick Presets */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Chart of Accounts Assignment
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full p-2.5 bg-[#141824] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="">— Unassigned / Unresolved —</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.id} • {acc.name} ({acc.type})
              </option>
            ))}
          </select>

          {/* Quick Click Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickPresets.map(accId => {
              const acc = accounts.find(a => a.id === accId);
              if (!acc) return null;
              return (
                <button
                  key={accId}
                  onClick={() => setSelectedAccountId(accId)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition ${
                    selectedAccountId === accId
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-[#141824] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {acc.id} {acc.name.split('-')[0].trim()}
                </button>
              );
            })}
          </div>

          {matchedAccount && (
            <p className="text-[11px] text-slate-400 pt-1 italic">
              {matchedAccount.description}
            </p>
          )}
        </div>

        {/* Remember as Reusable Rule */}
        {transaction.normalized_merchant && selectedAccountId && (
          <div className="pt-2">
            <button
              onClick={handleCreateRule}
              disabled={ruleSaved}
              className="w-full py-2.5 px-3 rounded-lg bg-[#182030] hover:bg-[#1e283d] text-blue-200 border border-blue-700/60 flex items-center justify-center space-x-2 text-xs font-semibold transition shadow-sm"
            >
              <BookmarkPlus className="w-4 h-4 text-blue-400" />
              <span>
                {ruleSaved ? '✓ Rule Persisted in SQLite!' : `Remember Rule for "${transaction.normalized_merchant}"`}
              </span>
            </button>
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Future statements will auto-match this merchant to Account {selectedAccountId}.
            </p>
          </div>
        )}

        {/* Auditor Notes */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Auditor Internal Notes
          </label>
          <textarea
            rows={2}
            placeholder="Add reviewer notes or client response details..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2.5 bg-[#141824] border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSaveNote}
            className="px-3 py-1.5 rounded-lg bg-[#161c2a] hover:bg-[#1e2638] text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            Save Note
          </button>
        </div>

      </div>

      {/* Footer Controls */}
      <div className="border-t border-slate-800 p-4 bg-[#121622] flex items-center justify-between gap-2.5">
        <button
          onClick={() => {
            onUpdate(transaction.id, {
              status: 'accepted',
              suggested_account_id: selectedAccountId || transaction.suggested_account_id
            });
            onClose();
          }}
          disabled={!selectedAccountId && !transaction.suggested_account_id}
          className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-40 transition shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Approve Transaction</span>
        </button>

        <button
          onClick={() => {
            onUpdate(transaction.id, { status: 'needs_clarification' });
            onClose();
          }}
          className="py-2.5 px-3 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 font-medium text-xs flex items-center justify-center space-x-1 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Clarify</span>
        </button>

        <button
          onClick={() => {
            onUpdate(transaction.id, { status: 'rejected' });
            onClose();
          }}
          className="py-2.5 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-medium text-xs flex items-center justify-center space-x-1 transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
      </div>

    </div>
  );
};
