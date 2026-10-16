import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Database, Shield, Zap, Sparkles } from 'lucide-react';
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
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <span>Import Client Bank Statements</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
            Local Parsing Only
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload any standard bank statement CSV feed. Statements are parsed directly in the local backend with zero cloud transmission.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Upload Form (2 cols) */}
        <div className="md:col-span-2 space-y-5">
          
          {/* File Drag/Drop Box */}
          <div className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/70 rounded-2xl p-8 text-center bg-[#0e111a] hover:bg-[#111624] transition group cursor-pointer">
            <input
              type="file"
              accept=".csv"
              id="csvFileInput"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer block space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                <Upload className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">
                  {file ? file.name : 'Click to select bank statement CSV file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Chase, Bank of America, Wells Fargo, Stripe, Square, and custom formats
                </p>
              </div>
            </label>
          </div>

          {/* Session Name input */}
          {file && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Client / Engagement Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Acme Plumbing - September 2026"
                className="w-full p-2.5 bg-[#141824] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-3d w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-900/40 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isUploading ? 'Parsing & Normalizing...' : 'Import & Launch Studio'}</span>
            </button>
          )}

          {/* 1-Click Demo Shortcut Card */}
          <div className="card-3d p-5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Want to evaluate without uploading a CSV?</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Load the synthetic "Northstar Electrical Services" dataset (57 realistic contractor transactions).
                </p>
              </div>
            </div>
            <button
              onClick={onLoadDemo}
              className="btn-3d px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0"
            >
              Load Demo
            </button>
          </div>

        </div>

        {/* Sidebar: Active Chart of Accounts (1 col) */}
        <div className="card-3d rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Active Chart of Accounts
            </h2>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
              {accounts.length} Accounts
            </span>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {accounts.map(acc => (
              <div key={acc.id} className="p-2.5 rounded-xl bg-[#141824] border border-slate-800 text-xs space-y-1 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">{acc.id}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {acc.type}
                  </span>
                </div>
                <p className="font-semibold text-slate-200 truncate">{acc.name}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{acc.description}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-300 flex items-start space-x-2">
            <Shield className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span>Strict Schema Bound: AI is strictly prohibited from inventing account codes outside this list.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
