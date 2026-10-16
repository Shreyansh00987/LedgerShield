import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Copy, 
  Download, 
  Check, 
  FileText, 
  AlertCircle,
  Sparkles,
  MessageSquare,
  Send,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { ClientInquiryPackage, Transaction } from '../types';
import { generateInquiry, fetchInquiryMarkdown } from '../api';

interface InquiryViewProps {
  sessionId: string;
  transactions: Transaction[];
}

export const InquiryView: React.FC<InquiryViewProps> = ({ sessionId, transactions }) => {
  const [clientName, setClientName] = useState('Northstar Electrical Services');
  const [inquiryPkg, setInquiryPkg] = useState<ClientInquiryPackage | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'markdown'>('cards');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const ambiguousCount = transactions.filter(t => t.status === 'needs_clarification' || !t.suggested_account_id).length;

  useEffect(() => {
    loadInquiry();
  }, [sessionId, clientName]);

  const loadInquiry = async () => {
    try {
      const pkg = await generateInquiry(sessionId, clientName);
      setInquiryPkg(pkg);
      const md = await fetchInquiryMarkdown(sessionId, clientName);
      setMarkdown(md);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LedgerShield_Client_Inquiry_${clientName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOptionSelect = (txId: string, opt: string) => {
    setSelectedAnswers(prev => ({ ...prev, [txId]: opt }));
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Client Inquiry Questionnaire Builder
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/50">
              {ambiguousCount} Questions Pending
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate clean, structured clarification questionnaires for clients with ambiguous receipts and card swipes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#141824] p-1 rounded-lg border border-slate-800 text-xs mr-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md transition ${viewMode === 'cards' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Interactive Cards
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              className={`px-3 py-1 rounded-md transition ${viewMode === 'markdown' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Raw Markdown
            </button>
          </div>

          <button
            onClick={handleCopy}
            disabled={!markdown}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!markdown}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#161c2a] hover:bg-[#1e2638] text-slate-200 border border-slate-700/80 text-xs font-medium transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .MD</span>
          </button>
        </div>
      </div>

      {/* Client Configuration Bar */}
      <div className="p-4 rounded-xl bg-[#0e111a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-sm">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Client Organization Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#141824] border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-300 max-w-md">
          <span className="font-semibold text-blue-200">How to use:</span> Copy and paste this directly into an email, Slack channel, or client portal. Clients simply tick the boxes and reply.
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'markdown' ? (
        <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-mono text-[11px]">Formatted Markdown Output</span>
            <span>{markdown.length} characters</span>
          </div>
          <pre className="p-4 rounded-xl bg-[#08090e] border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap select-all">
            {markdown}
          </pre>
        </div>
      ) : (
        /* Cards View */
        <div className="space-y-4">
          {inquiryPkg && inquiryPkg.items.length > 0 ? (
            inquiryPkg.items.map((item, idx) => {
              const selectedOpt = selectedAnswers[item.transaction_id];

              return (
                <div
                  key={item.transaction_id}
                  className="p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3.5 shadow-md"
                >
                  {/* Card Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-100 text-sm">
                        {item.normalized_merchant}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">
                        ({item.date})
                      </span>
                    </div>

                    <span className={`font-mono font-extrabold text-sm tabular-nums ${
                      item.amount > 0 ? 'text-emerald-400' : 'text-slate-100'
                    }`}>
                      {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
                    </span>
                  </div>

                  {/* Bank Feed Text */}
                  <div className="text-[11px] text-slate-400 font-mono bg-[#08090e] p-2.5 rounded-lg border border-slate-800">
                    Bank Memo: <span className="text-slate-200">{item.description}</span>
                  </div>

                  {/* Clarification Prompt & Options */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{item.question}</span>
                    </p>

                    {/* Interactive Multiple Choice Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {item.options.map((opt, oIdx) => {
                        const isChosen = selectedOpt === opt;

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleOptionSelect(item.transaction_id, opt)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center space-x-2.5 ${
                              isChosen
                                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 font-semibold shadow-sm'
                                : 'bg-[#141824] hover:bg-[#1a2030] border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isChosen ? 'border-cyan-400 bg-cyan-500 text-[#0c0f18]' : 'border-slate-600'
                            }`}>
                              {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="truncate">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-[#0e111a]">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className="font-bold text-slate-100 text-base">Reconciliation Complete</p>
              <p className="text-xs text-slate-400 mt-1">
                Zero ambiguous transactions require client clarification in this session.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
