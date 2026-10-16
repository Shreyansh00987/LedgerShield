import React, { useState, useMemo } from 'react';
import { 
  Check, 
  X, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  HelpCircle, 
  ArrowUpDown,
  AlertCircle,
  Zap,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Transaction, Account, TransactionStatus } from '../types';
import { StatusBadge, SourceBadge } from './StatusBadge';

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  onUpdateTransaction: (id: string, updates: { suggested_account_id?: string | null; status?: TransactionStatus; human_note?: string }) => void;
  onBatchAction: (ids: string[], action: 'accept' | 'reject' | 'mark_clarification', accountId?: string) => void;
  onInspectTransaction: (tx: Transaction) => void;
  selectedTransactionId: string | null;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  accounts,
  onUpdateTransaction,
  onBatchAction,
  onInspectTransaction,
  selectedTransactionId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'confidence'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Metrics calculations
  const totalInflow = useMemo(() => {
    return transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalOutflow = useMemo(() => {
    return transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  }, [transactions]);

  const acceptedCount = useMemo(() => transactions.filter(t => t.status === 'accepted' || t.status === 'edited').length, [transactions]);
  const suggestedCount = useMemo(() => transactions.filter(t => t.status === 'suggested').length, [transactions]);
  const clarificationCount = useMemo(() => transactions.filter(t => t.status === 'needs_clarification').length, [transactions]);
  const totalCount = transactions.length;
  const progressPct = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  // High confidence items ready for 1-click batch accept
  const highConfidenceSuggested = useMemo(() => {
    return transactions.filter(t => t.status === 'suggested' && t.confidence >= 0.90 && t.suggested_account_id);
  }, [transactions]);

  // Filter & Sort
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.original_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.normalized_merchant.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'date') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [transactions, searchTerm, statusFilter, sortField, sortAsc]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatch = (action: 'accept' | 'reject' | 'mark_clarification') => {
    if (selectedIds.size === 0) return;
    onBatchAction(Array.from(selectedIds), action);
    setSelectedIds(new Set());
  };

  const handleAcceptAllHighConfidence = () => {
    const ids = highConfidenceSuggested.map(t => t.id);
    if (ids.length > 0) {
      onBatchAction(ids, 'accept');
    }
  };

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach(a => map.set(a.id, a));
    return map;
  }, [accounts]);

  const formatAmount = (amt: number) => {
    const isPositive = amt > 0;
    const formatted = Math.abs(amt).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return {
      text: `${isPositive ? '+' : '-'}$${formatted}`,
      isPositive
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#08090e]">
      
      {/* Financial Executive Summary Ribbon */}
      <div className="border-b border-slate-800/80 bg-[#0c0f18] px-6 py-3.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Total Flow */}
          <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-[#121622]/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Inflow</span>
              <p className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                +${totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Outflow */}
          <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-[#121622]/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Outflow</span>
              <p className="text-sm font-mono font-bold text-slate-100 tabular-nums">
                -${totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Reconcile Progress Meter */}
          <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-[#121622]/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Progress</span>
                <span className="text-cyan-300 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Clarification Queue */}
          <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-[#121622]/80 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Client Clarification</span>
              <p className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                {clarificationCount} items
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="border-b border-slate-800/80 bg-[#0e121c] px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search memo, vendor name, or transaction details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#141824] border border-slate-700/70 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Status Filter Chips with Counts */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All', count: totalCount },
            { id: 'needs_clarification', label: 'Clarification Needed', count: clarificationCount, highlight: true },
            { id: 'suggested', label: 'AI Suggested', count: suggestedCount },
            { id: 'accepted', label: 'Accepted', count: acceptedCount }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === f.id
                  ? 'bg-blue-600/20 text-blue-200 border border-blue-500/50 shadow-sm'
                  : 'bg-[#141824] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                f.highlight && f.count > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800/50' : 'bg-slate-800 text-slate-400'
              }`}>
                {f.count}
              </span>
            </button>
          ))}

          {/* Quick Accept High-Confidence (>90%) Button */}
          {highConfidenceSuggested.length > 0 && (
            <button
              onClick={handleAcceptAllHighConfidence}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60 text-xs font-semibold transition ml-2 shadow-sm"
              title="Batch-accept verified rule and high-confidence suggestions"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accept High Confidence ({highConfidenceSuggested.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border-b border-blue-800/50 px-6 py-2 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-blue-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{selectedIds.size} transactions selected for batch action</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBatch('accept')}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Selected</span>
            </button>
            <button
              onClick={() => handleBatch('mark_clarification')}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-sm transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Mark Needs Clarification</span>
            </button>
            <button
              onClick={() => handleBatch('reject')}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-sm transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main High-Density Accounting Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#0e121c] text-[11px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <th className="py-2.5 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredTransactions.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => { setSortField('date'); setSortAsc(!sortAsc); }}>
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Original Bank Memo</th>
              <th className="py-2.5 px-3">Cleaned Merchant</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200" onClick={() => { setSortField('amount'); setSortAsc(!sortAsc); }}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[240px]">Chart of Accounts Assignment</th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => { setSortField('confidence'); setSortAsc(!sortAsc); }}>
                <div className="flex items-center space-x-1">
                  <span>Match Source & Confidence</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Review Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-slate-300">No transactions match your filter criteria</p>
                  <p className="text-slate-500 text-xs mt-1">Try clearing your search query or selecting "All".</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const amt = formatAmount(tx.amount);
                const isSelectedRow = selectedTransactionId === tx.id;
                const isChecked = selectedIds.has(tx.id);

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors group ${
                      isSelectedRow
                        ? 'bg-blue-950/35 border-l-2 border-l-cyan-400'
                        : isChecked
                        ? 'bg-blue-950/25'
                        : 'hover:bg-[#121622]/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(tx.id)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {tx.date}
                    </td>

                    {/* Original Bank Memo */}
                    <td className="py-2.5 px-3 font-mono text-slate-300 max-w-xs truncate text-[11px]" title={tx.original_description}>
                      {tx.original_description}
                    </td>

                    {/* Cleaned Merchant */}
                    <td className="py-2.5 px-3 font-semibold text-slate-100">
                      {tx.normalized_merchant || '—'}
                    </td>

                    {/* Amount */}
                    <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                      amt.isPositive ? 'text-emerald-400' : 'text-slate-100'
                    }`}>
                      {amt.text}
                    </td>

                    {/* Account Assignment Dropdown */}
                    <td className="py-2.5 px-3">
                      <select
                        value={tx.suggested_account_id || ''}
                        onChange={(e) => {
                          const newAccountId = e.target.value || null;
                          onUpdateTransaction(tx.id, {
                            suggested_account_id: newAccountId,
                            status: newAccountId ? 'edited' : 'needs_clarification'
                          });
                        }}
                        className={`w-full py-1.5 px-2.5 rounded-lg text-xs border font-medium focus:outline-none transition cursor-pointer ${
                          tx.suggested_account_id
                            ? 'bg-[#121624] border-slate-700/80 text-slate-100 hover:border-slate-600 focus:border-blue-500'
                            : 'bg-amber-950/40 border-amber-800/60 text-amber-200 focus:border-amber-500'
                        }`}
                      >
                        <option value="">— Unresolved (Select Account) —</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.id} • {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Source & Confidence */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <SourceBadge source={tx.match_source} confidence={tx.confidence} />
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={tx.status} />
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5 opacity-90 group-hover:opacity-100">
                        {tx.status !== 'accepted' && tx.suggested_account_id && (
                          <button
                            onClick={() => onUpdateTransaction(tx.id, { status: 'accepted' })}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 transition transform active:scale-95 shadow-sm"
                            title="Approve suggestion"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {tx.status !== 'rejected' && (
                          <button
                            onClick={() => onUpdateTransaction(tx.id, { status: 'rejected' })}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition transform active:scale-95 shadow-sm"
                            title="Reject suggestion"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onInspectTransaction(tx)}
                          className="p-1.5 rounded-lg bg-[#161c2a] hover:bg-[#1e2638] text-slate-300 border border-slate-700/70 transition shadow-sm"
                          title="Inspect audit trail and rationale"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
