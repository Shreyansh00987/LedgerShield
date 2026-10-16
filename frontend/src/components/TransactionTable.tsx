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
  AlertCircle
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
    <div className="flex flex-col h-full bg-[#0d0f17]">
      {/* Controls & Filters Bar */}
      <div className="border-b border-slate-800 bg-[#121520] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search original description or merchant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'needs_clarification', label: 'Clarification Needed' },
            { id: 'suggested', label: 'Suggested' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'unreviewed', label: 'Unreviewed' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                statusFilter === f.id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-950/70 border-b border-blue-800/50 px-4 py-2 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-blue-200 font-medium">
            <span>{selectedIds.size} transactions selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBatch('accept')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Selected</span>
            </button>
            <button
              onClick={() => handleBatch('mark_clarification')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-sm transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask Client</span>
            </button>
            <button
              onClick={() => handleBatch('reject')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-sm transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Dense Transaction Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#10131d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-2.5 px-3 w-10 text-center">
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
              <th className="py-2.5 px-3">Original Description</th>
              <th className="py-2.5 px-3">Normalized Merchant</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200" onClick={() => { setSortField('amount'); setSortAsc(!sortAsc); }}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[220px]">Chart of Accounts Mapping</th>
              <th className="py-2.5 px-3">Confidence & Source</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  <p className="font-medium">No transactions found</p>
                  <p className="text-slate-600 text-xs mt-1">Try adjusting search or status filters</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const amt = formatAmount(tx.amount);
                const isSelectedRow = selectedTransactionId === tx.id;
                const isChecked = selectedIds.has(tx.id);
                const currentAccount = tx.suggested_account_id ? accountMap.get(tx.suggested_account_id) : null;

                return (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${
                      isSelectedRow
                        ? 'bg-blue-950/30 border-l-2 border-l-blue-500'
                        : isChecked
                        ? 'bg-blue-950/20'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(tx.id)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Original Description */}
                    <td className="py-2 px-3 font-mono text-slate-300 max-w-xs truncate" title={tx.original_description}>
                      {tx.original_description}
                    </td>

                    {/* Normalized Merchant */}
                    <td className="py-2 px-3 font-medium text-slate-200">
                      {tx.normalized_merchant || '—'}
                    </td>

                    {/* Amount */}
                    <td className={`py-2 px-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                      amt.isPositive ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {amt.text}
                    </td>

                    {/* Account Selector */}
                    <td className="py-2 px-3">
                      <select
                        value={tx.suggested_account_id || ''}
                        onChange={(e) => {
                          const newAccountId = e.target.value || null;
                          onUpdateTransaction(tx.id, {
                            suggested_account_id: newAccountId,
                            status: newAccountId ? 'edited' : 'needs_clarification'
                          });
                        }}
                        className={`w-full py-1 px-2 rounded text-xs border font-medium focus:outline-none transition ${
                          tx.suggested_account_id
                            ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'
                            : 'bg-amber-950/40 border-amber-800/50 text-amber-300 focus:border-amber-500'
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
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <SourceBadge source={tx.match_source} confidence={tx.confidence} />
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <StatusBadge status={tx.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {tx.status !== 'accepted' && tx.suggested_account_id && (
                          <button
                            onClick={() => onUpdateTransaction(tx.id, { status: 'accepted' })}
                            className="p-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40 transition"
                            title="Accept suggestion"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {tx.status !== 'rejected' && (
                          <button
                            onClick={() => onUpdateTransaction(tx.id, { status: 'rejected' })}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 transition"
                            title="Reject suggestion"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onInspectTransaction(tx)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Inspect details and audit trail"
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
