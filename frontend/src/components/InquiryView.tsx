import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Copy, 
  Download, 
  Check, 
  FileText, 
  AlertCircle,
  Sparkles
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
  const [isLoading, setIsLoading] = useState(false);

  const ambiguousCount = transactions.filter(t => t.status === 'needs_clarification' || !t.suggested_account_id).length;

  useEffect(() => {
    loadInquiry();
  }, [sessionId, clientName]);

  const loadInquiry = async () => {
    setIsLoading(true);
    try {
      const pkg = await generateInquiry(sessionId, clientName);
      setInquiryPkg(pkg);
      const md = await fetchInquiryMarkdown(sessionId, clientName);
      setMarkdown(md);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Client Inquiry Builder</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-950/70 text-amber-300 border border-amber-800/40">
              {ambiguousCount} Items Needing Clarification
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate clean, professional questionnaires for clients to explain ambiguous receipts and card charges.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            disabled={!markdown}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!markdown}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Client Name Config */}
      <div className="p-4 rounded-lg bg-[#111420] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Client Name for Header
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Tip: Send this markdown list via email, Slack, or client portal. Clients can simply check the boxes and reply.
        </p>
      </div>

      {/* Inquiry Items Preview */}
      {inquiryPkg && inquiryPkg.items.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Inquiry Items Preview ({inquiryPkg.items.length})
          </h2>

          <div className="space-y-3">
            {inquiryPkg.items.map((item, idx) => (
              <div
                key={item.transaction_id}
                className="p-4 rounded-lg bg-[#111420] border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono font-semibold text-[11px] text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-100 text-sm">
                      {item.normalized_merchant}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      ({item.date})
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-sm tabular-nums ${
                    item.amount > 0 ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Bank Feed: <span className="text-slate-300">{item.description}</span>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-md border border-slate-800/60 space-y-2">
                  <p className="text-xs font-medium text-amber-300 flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.question}</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {item.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className="px-2.5 py-1.5 rounded bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 flex items-center space-x-2"
                      >
                        <span className="w-3.5 h-3.5 rounded border border-slate-600 inline-block"></span>
                        <span className="truncate">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-slate-800 rounded-xl bg-[#111420]">
          <Check className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <p className="font-semibold text-slate-200 text-sm">All Transactions Reconciled!</p>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no ambiguous transactions requiring client inquiry in this session.
          </p>
        </div>
      )}
    </div>
  );
};
