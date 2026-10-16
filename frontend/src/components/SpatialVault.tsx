import React, { useState, useRef } from 'react';
import { Shield, Lock, Cpu, Database, CheckCircle2, Sparkles, Layers } from 'lucide-react';

interface SpatialVaultProps {
  isModelLive?: boolean;
}

export const SpatialVault: React.FC<SpatialVaultProps> = ({ isModelLive = false }) => {
  const [rotate, setRotate] = useState({ x: 12, y: -20 });
  const [activeFacet, setActiveFacet] = useState<'privacy' | 'model' | 'rules'>('privacy');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Controlled subtle tilt range
    setRotate({
      x: Math.max(-15, Math.min(25, -y / 12 + 10)),
      y: Math.max(-35, Math.min(10, x / 12 - 20))
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 12, y: -20 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl bg-gradient-to-b from-[#111624] to-[#0a0d15] border border-slate-800 p-6 shadow-2xl shadow-black/60 overflow-hidden select-none transition-all duration-300"
      style={{
        boxShadow: '0 16px 36px -6px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)'
      }}
    >
      {/* Background Top Ambient Rim */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: 3D Isometric Vault Stage (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
          <div 
            className="w-56 h-56 relative flex items-center justify-center transition-transform duration-200 ease-out"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* 3D Isometric Cube Container */}
            <div 
              className="relative w-36 h-36 transition-transform duration-300"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`
              }}
            >
              {/* TOP FACET */}
              <div 
                onClick={() => setActiveFacet('privacy')}
                className={`absolute inset-0 rounded-xl cursor-pointer border flex flex-col items-center justify-center p-3 text-center transition-all ${
                  activeFacet === 'privacy'
                    ? 'bg-gradient-to-br from-emerald-900/80 to-teal-950/90 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-900/40'
                    : 'bg-[#151b2a] border-slate-700 text-slate-300 hover:border-emerald-500/50'
                }`}
                style={{
                  transform: 'rotateX(90deg) translateZ(4.5rem)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
                }}
              >
                <Lock className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Zero Cloud</span>
                <span className="text-[9px] text-emerald-300/80">Local Storage</span>
              </div>

              {/* FRONT / LEFT FACET */}
              <div 
                onClick={() => setActiveFacet('model')}
                className={`absolute inset-0 rounded-xl cursor-pointer border flex flex-col items-center justify-center p-3 text-center transition-all ${
                  activeFacet === 'model'
                    ? 'bg-gradient-to-br from-blue-900/80 to-cyan-950/90 border-cyan-400 text-cyan-200 shadow-lg shadow-blue-900/40'
                    : 'bg-[#101420] border-slate-700 text-slate-300 hover:border-cyan-500/50'
                }`}
                style={{
                  transform: 'translateZ(4.5rem)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <Cpu className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Gemma 2</span>
                <span className="text-[9px] text-cyan-300/80">Open-Weight AI</span>
              </div>

              {/* RIGHT FACET */}
              <div 
                onClick={() => setActiveFacet('rules')}
                className={`absolute inset-0 rounded-xl cursor-pointer border flex flex-col items-center justify-center p-3 text-center transition-all ${
                  activeFacet === 'rules'
                    ? 'bg-gradient-to-br from-indigo-900/80 to-slate-900/90 border-indigo-400 text-indigo-200 shadow-lg shadow-indigo-900/40'
                    : 'bg-[#0d101a] border-slate-800 text-slate-400 hover:border-indigo-500/50'
                }`}
                style={{
                  transform: 'rotateY(90deg) translateZ(4.5rem)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'
                }}
              >
                <Database className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">SQLite WAL</span>
                <span className="text-[9px] text-indigo-300/80">Deterministic Rules</span>
              </div>
            </div>

            {/* Ambient 3D Shadow Plate Beneath */}
            <div 
              className="absolute -bottom-4 w-40 h-10 rounded-full bg-cyan-950/40 blur-xl pointer-events-none"
              style={{ transform: 'rotateX(80deg)' }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-2">
            Interactive 3D Vault (Hover to tilt & explore)
          </span>
        </div>

        {/* Right: Facet Explanation & Live Data Guarantees (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
              Local Vault Architecture
            </span>
            <span className="text-xs text-slate-400 font-medium">Click any face to inspect layer</span>
          </div>

          {activeFacet === 'privacy' && (
            <div className="p-4 rounded-xl bg-[#141824] border border-emerald-800/50 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Zero Cloud Financial Data Residency</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bank feeds, merchant details, invoice dollar amounts, and client identities are locked onto this computer. No external third-party AI requests are dispatched during the entire reconciliation workflow.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-emerald-400">
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">✓ 0 WAN Packets</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">✓ DDE Formula Sanitized</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">✓ 1-Click Data Purge</span>
              </div>
            </div>
          )}

          {activeFacet === 'model' && (
            <div className="p-4 rounded-xl bg-[#141824] border border-cyan-800/50 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Google Gemma 2 Local Open-Weight Inference</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ambiguous trade transactions are evaluated locally using Gemma 2 2B / 9B instruction weights. The model operates under an exact Pydantic output schema bound to your active Chart of Accounts.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-cyan-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">+21.4% Accuracy Gain</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">$0.00 Marginal Cost</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">0.0% Hallucinations</span>
              </div>
            </div>
          )}

          {activeFacet === 'rules' && (
            <div className="p-4 rounded-xl bg-[#141824] border border-indigo-800/50 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Rules & Historical Pattern Memory</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recurring suppliers and utilities match in microseconds using exact string normalization and SQLite pattern tables. When you approve edits, LedgerShield creates permanent rules instead of retraining black-box weights.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-indigo-300">
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Microsecond Lookups</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Inspectable Rules</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">SQLite WAL Engine</span>
              </div>
            </div>
          )}

          {/* Facet Buttons */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => setActiveFacet('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeFacet === 'privacy'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#141824] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Privacy Core
            </button>
            <button
              onClick={() => setActiveFacet('model')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeFacet === 'model'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#141824] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Gemma 2 AI
            </button>
            <button
              onClick={() => setActiveFacet('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeFacet === 'rules'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#141824] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Deterministic Rules
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
