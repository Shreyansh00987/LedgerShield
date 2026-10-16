import React, { useState, useEffect } from 'react';
import { Activity, Play, RefreshCw, CheckCircle2, TrendingUp, Zap, Clock, Shield } from 'lucide-react';
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
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Open-Weight AI Evaluation Benchmark</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-950/70 text-blue-300 border border-blue-800/40">
              Live Measured Metrics
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reproducible benchmark testing deterministic matching against local open-weight AI on synthetic business transactions.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running Benchmark...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Run Benchmark Now</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Comparative Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deterministic Rules Alone */}
            <div className="p-5 rounded-xl bg-[#111420] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Baseline: Deterministic Rules Only
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  Regex / Rules
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400 text-xs">Accuracy:</span>
                  <span className="text-2xl font-bold font-mono text-slate-200">
                    {result.metrics.deterministic_only.accuracy}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Matched Items:</span>
                  <span className="font-mono text-slate-200">
                    {result.metrics.deterministic_only.matched_count} / {result.dataset_size}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Review Required Rate:</span>
                  <span className="font-mono text-amber-300">
                    {result.metrics.deterministic_only.review_rate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Execution Latency:</span>
                  <span className="font-mono text-slate-400">
                    {result.metrics.deterministic_only.duration_ms} ms total
                  </span>
                </div>
              </div>
            </div>

            {/* Combined: Deterministic + Local AI */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/30 to-[#111420] border border-blue-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>LedgerShield Pipeline: Rules + Local AI</span>
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                  Combined
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400 text-xs">Accuracy:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {result.metrics.deterministic_plus_local_ai.accuracy}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 font-mono">
                      (+{result.metrics.deterministic_plus_local_ai.accuracy_gain_pct}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Matched Items:</span>
                  <span className="font-mono text-slate-200">
                    {result.metrics.deterministic_plus_local_ai.matched_count} / {result.dataset_size}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Remaining Review Rate:</span>
                  <span className="font-mono text-blue-300">
                    {result.metrics.deterministic_plus_local_ai.requires_review_rate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Avg Latency Per Item:</span>
                  <span className="font-mono text-slate-400">
                    {result.metrics.deterministic_plus_local_ai.avg_per_item_ms} ms / tx
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Environment Metadata */}
          <div className="p-4 rounded-xl bg-[#111420] border border-slate-800 space-y-3 text-xs">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evaluation Specifications & Privacy Audit</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Runtime Environment:</span>
                <span className="text-slate-200">{result.hardware_specs.runtime}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Inference Path:</span>
                <span className="text-slate-200">{result.hardware_specs.inference_path}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Model Engine:</span>
                <span className="text-slate-200">{result.hardware_specs.model_adapter}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
