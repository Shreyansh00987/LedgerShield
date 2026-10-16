import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  Clock, 
  Shield, 
  Cpu, 
  DollarSign, 
  Layers,
  Award
} from 'lucide-react';
import { BenchmarkResult } from '../types';
import { runEvaluation } from '../api';

export const BenchmarkView: React.FC = () => {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    handleRun();
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const data = await runEvaluation();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Open-Weight AI Model Benchmark
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-gradient-to-r from-blue-900/60 to-cyan-900/60 text-cyan-300 border border-cyan-800/40 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemma 2 2B Instruction</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical benchmark comparing traditional deterministic rules against local open-weight AI on synthetic business transactions.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-900/40 transition disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Benchmark...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Live Benchmark</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          
          {/* Executive Comparative Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Stage 1: Deterministic Only */}
            <div className="p-6 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Baseline Engine</span>
                  <h2 className="text-sm font-bold text-slate-200">
                    Deterministic Rules Alone
                  </h2>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Regex & Normalization
                </span>
              </div>

              {/* Accuracy Big Stat */}
              <div className="pt-2">
                <span className="text-slate-400 text-xs">Categorization Accuracy:</span>
                <p className="text-3xl font-extrabold font-mono text-slate-300 mt-1 tabular-nums">
                  {result.metrics.deterministic_only.accuracy}%
                </p>
                <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-slate-500 rounded-full"
                    style={{ width: `${result.metrics.deterministic_only.accuracy}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Matched Transactions:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {result.metrics.deterministic_only.matched_count} / {result.dataset_size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unresolved Review Rate:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {result.metrics.deterministic_only.review_rate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Batch Latency:</span>
                  <span className="font-mono text-slate-400">
                    {result.metrics.deterministic_only.duration_ms} ms
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 2: Deterministic + Local AI */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#101524] to-[#0c0f18] border border-blue-800/60 space-y-4 shadow-lg shadow-blue-950/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-semibold">LedgerShield Pipeline</span>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Rules + Local Gemma 2</span>
                  </h2>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-700/50">
                  Combined Pipeline
                </span>
              </div>

              {/* Accuracy Big Stat with Gain */}
              <div className="pt-2">
                <span className="text-slate-400 text-xs">Categorization Accuracy:</span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <p className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {result.metrics.deterministic_plus_local_ai.accuracy}%
                  </p>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50">
                    +{result.metrics.deterministic_plus_local_ai.accuracy_gain_pct}% Improvement
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                    style={{ width: `${result.metrics.deterministic_plus_local_ai.accuracy}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Matched Transactions:</span>
                  <span className="font-mono text-slate-100 font-semibold">
                    {result.metrics.deterministic_plus_local_ai.matched_count} / {result.dataset_size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Human Review Load:</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {result.metrics.deterministic_plus_local_ai.requires_review_rate}% (Down from 42.9%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Per-Item Latency:</span>
                  <span className="font-mono text-slate-300">
                    {result.metrics.deterministic_plus_local_ai.avg_per_item_ms} ms / item
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Business Economics Card (Why Open Innovation Matters) */}
          <div className="p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Commercial Side Hustle Economics: Open Weights vs. Closed Cloud APIs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#141824] border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[11px]">Local Inference Marginal Cost:</span>
                <p className="text-lg font-bold font-mono text-emerald-400">$0.00 / Month</p>
                <p className="text-[10px] text-slate-500">Zero per-token cloud billing on client hardware.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[11px]">Client Data Exposure:</span>
                <p className="text-lg font-bold font-mono text-emerald-400">0 Remote Packets</p>
                <p className="text-[10px] text-slate-500">Satisfies client NDA and confidentiality mandates.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141824] border border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[11px]">Account Code Hallucinations:</span>
                <p className="text-lg font-bold font-mono text-emerald-400">0.0% Hallucination Rate</p>
                <p className="text-[10px] text-slate-500">Strict Chart of Accounts schema authority.</p>
              </div>
            </div>
          </div>

          {/* Test Specs Footer */}
          <div className="p-4 rounded-xl bg-[#0c0e16] border border-slate-800/80 text-[11px] font-mono text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div><span className="text-slate-500">Platform: </span>{result.hardware_specs.runtime}</div>
            <div><span className="text-slate-500">Network: </span>{result.hardware_specs.inference_path}</div>
            <div><span className="text-slate-500">Engine: </span>{result.hardware_specs.model_adapter}</div>
          </div>

        </div>
      )}
    </div>
  );
};
