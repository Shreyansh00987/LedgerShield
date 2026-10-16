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
  AlertTriangle 
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

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111420] border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between bg-[#151926]">
        <div>
          <h2 className="text-sm font-semibold text-white">Transaction Inspector</h2>
          <p className="text-[11px] text-slate-400 font-mono">ID: {transaction.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
        {/* Core Amounts & Status */}
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Transaction Date</span>
            <span className="font-mono text-slate-200">{transaction.date}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Amount</span>
            <span className={`font-mono font-bold text-sm tabular-nums ${
              transaction.amount > 0 ? 'text-emerald-400' : 'text-slate-100'
            }`}>
              {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)} {transaction.currency}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-slate-400">Current Status</span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* Original Bank Feed Data vs Normalization */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Bank Feed Processing
          </h3>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-slate-500">Raw Bank Description</label>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                {transaction.original_description}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500">Normalized Merchant</label>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-medium text-slate-200">
                {transaction.normalized_merchant || 'None detected'}
              </div>
            </div>
          </div>
        </div>

        {/* Classification Rationale & Evidence */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Reconciliation Rationale
            </h3>
            <SourceBadge source={transaction.match_source} confidence={transaction.confidence} />
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div>
              <span className="text-[11px] text-slate-500">Audit Explanation:</span>
              <p className="mt-0.5 text-slate-200 text-xs leading-relaxed">
                {transaction.explanation || 'No automated explanation generated.'}
              </p>
            </div>
            {transaction.evidence && (
              <div>
                <span className="text-[11px] text-slate-500">Observed Evidence:</span>
                <p className="mt-0.5 text-slate-400 text-[11px] font-mono">
                  {transaction.evidence}
                </p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Confidence Estimate:</span>
              <span className="font-mono font-semibold text-blue-300">
                {(transaction.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            * Confidence is an automated heuristic estimate, not a calibrated legal or accounting probability.
          </p>
        </div>

        {/* Missing Info Warning */}
        {transaction.missing_information && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 space-y-1">
            <div className="flex items-center space-x-1.5 font-medium text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Clarification Required</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {transaction.missing_information}
            </p>
          </div>
        )}

        {/* Account Mapping Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Assigned Chart of Accounts Code
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">— Unassigned / Unresolved —</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.id} • {acc.name} ({acc.type})
              </option>
            ))}
          </select>
          {matchedAccount && (
            <p className="text-[11px] text-slate-400">
              {matchedAccount.description}
            </p>
          )}
        </div>

        {/* Create Reusable Rule Action */}
        {transaction.normalized_merchant && selectedAccountId && (
          <div className="pt-2">
            <button
              onClick={handleCreateRule}
              disabled={ruleSaved}
              className="w-full py-2 px-3 rounded-md bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/50 flex items-center justify-center space-x-2 text-xs font-medium transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {ruleSaved ? 'Rule Persisted Locally!' : `Remember Rule for "${transaction.normalized_merchant}"`}
              </span>
            </button>
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Future transactions from this merchant will match Account {selectedAccountId} automatically.
            </p>
          </div>
        )}

        {/* Auditor Notes */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Auditor & Client Note
          </label>
          <textarea
            rows={3}
            placeholder="Add internal review note or client answer..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSaveNote}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            Save Note & Account
          </button>
        </div>
      </div>

      {/* Footer Decisions Bar */}
      <div className="border-t border-slate-800 p-4 bg-[#151926] flex items-center justify-between gap-2">
        <button
          onClick={() => {
            onUpdate(transaction.id, {
              status: 'accepted',
              suggested_account_id: selectedAccountId || transaction.suggested_account_id
            });
            onClose();
          }}
          disabled={!selectedAccountId && !transaction.suggested_account_id}
          className="flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 disabled:opacity-40 transition"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Approve Entry</span>
        </button>

        <button
          onClick={() => {
            onUpdate(transaction.id, { status: 'needs_clarification' });
            onClose();
          }}
          className="py-2 px-3 rounded-md bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-700/50 font-medium text-xs flex items-center justify-center space-x-1 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Ask Client</span>
        </button>

        <button
          onClick={() => {
            onUpdate(transaction.id, { status: 'rejected' });
            onClose();
          }}
          className="py-2 px-3 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-700/50 font-medium text-xs flex items-center justify-center space-x-1 transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
};
