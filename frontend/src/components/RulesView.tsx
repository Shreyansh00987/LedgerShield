import React, { useState, useEffect } from 'react';
import { Sliders, Plus, BookmarkCheck, Shield, Sparkles } from 'lucide-react';
import { Rule, Account } from '../types';
import { fetchRules, createRule } from '../api';

interface RulesViewProps {
  accounts: Account[];
}

export const RulesView: React.FC<RulesViewProps> = ({ accounts }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [pattern, setPattern] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await fetchRules();
      setRules(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim() || !accountId) return;
    setIsSubmitting(true);
    try {
      await createRule(pattern, accountId, description);
      setPattern('');
      setDescription('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      await loadRules();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountMap = new Map(accounts.map(a => [a.id, a]));

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Deterministic Rules & Automation</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-purple-950/70 text-purple-300 border border-purple-800/40">
            {rules.length} Active Rules
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deterministic matching takes precedence before invoking open-weight AI. Rules are persisted locally in SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rules Table (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Configured Rules
          </h2>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#111420]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141824] text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-2.5 px-3">Pattern</th>
                  <th className="py-2.5 px-3">Target Account</th>
                  <th className="py-2.5 px-3">Origin</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rules.map((r) => {
                  const acc = accountMap.get(r.account_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-900/50">
                      <td className="py-2 px-3 font-mono font-semibold text-purple-300">
                        {r.pattern}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-slate-400 mr-1.5">{r.account_id}</span>
                        <span className="text-slate-200">{acc ? acc.name : r.account_id}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          r.created_by === 'user_learned'
                            ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.created_by === 'user_learned' ? 'Learned' : 'System'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                        {r.description || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Rule Form (1 col) */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Create Custom Rule
          </h2>

          <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-[#111420] border border-slate-800 space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Merchant Substring / Regex
              </label>
              <input
                type="text"
                placeholder="e.g. SPECIALTY WIRE CO"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                required
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 uppercase focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Target Chart of Accounts
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.id} • {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Rule Notes / Vendor Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Local electrical distributor for job materials"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {successMsg && (
              <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Rule saved to local database!</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !pattern.trim()}
              className="w-full py-2 px-3 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Deterministic Rule</span>
            </button>
          </form>

          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-slate-300">How LedgerShield Learns:</p>
            <p>
              When bookkeepers approve corrected transactions in the Studio, LedgerShield creates auditable deterministic patterns rather than fine-tuning a black-box model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
