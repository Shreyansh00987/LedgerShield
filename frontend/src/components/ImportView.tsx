import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Database, Shield } from 'lucide-react';
import { uploadCsv } from '../api';
import { Account } from '../types';

interface ImportViewProps {
  accounts: Account[];
  onImportSuccess: (sessionId: string) => void;
  onLoadDemo: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  accounts,
  onImportSuccess,
  onLoadDemo
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      if (!sessionName) {
        setSessionName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadCsv(file, sessionName || file.name);
      if (res.success) {
        onImportSuccess(res.session_id);
      } else {
        setError(res.diagnostics?.error || 'Failed to parse CSV file');
      }
    } catch (err: any) {
      setError(err.message || 'Import error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-150">
      {/* Intro Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight">Import Bank Transactions</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload any standard bank CSV export. All processing occurs locally on your machine with zero external AI transmission.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Form (2 cols) */}
        <div className="md:col-span-2 space-y-5">
          {/* File Drag/Drop Box */}
          <div className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/70 rounded-xl p-8 text-center bg-[#101420] transition">
            <input
              type="file"
              accept=".csv"
              id="csvFileInput"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer block">
              <Upload className="w-10 h-10 mx-auto text-blue-400 mb-3" />
              <p className="text-sm font-medium text-slate-200">
                {file ? file.name : 'Click to select bank statement CSV file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Chase, Bank of America, Wells Fargo, Stripe, Square, and custom formats
              </p>
            </label>
          </div>

          {/* Session Name input */}
          {file && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Client / Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Acme Plumbing - September 2026"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isUploading ? 'Parsing & Normalizing...' : 'Import & Begin Reconciliation'}</span>
            </button>
          )}

          {/* Demo Data Quick Alternative */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-blue-950/70 border border-blue-800/40 flex items-center justify-center text-blue-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Want to test without a CSV?</p>
                <p className="text-[11px] text-slate-400">Load "Northstar Electrical Services" synthetic demonstration dataset.</p>
              </div>
            </div>
            <button
              onClick={onLoadDemo}
              className="px-3 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition"
            >
              Load Demo
            </button>
          </div>
        </div>

        {/* Sidebar: Active Chart of Accounts (1 col) */}
        <div className="border border-slate-800 rounded-xl bg-[#111420] p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Active Chart of Accounts
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {accounts.length} Accounts
            </span>
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {accounts.map(acc => (
              <div key={acc.id} className="p-2 rounded bg-slate-900/70 border border-slate-800/60 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-400 font-semibold">{acc.id}</span>
                  <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-800 text-slate-400">
                    {acc.type}
                  </span>
                </div>
                <p className="font-medium text-slate-200 truncate">{acc.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{acc.description}</p>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-300 flex items-start space-x-2">
            <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Strict Validation: Suggestions are strictly restricted to these valid accounts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
