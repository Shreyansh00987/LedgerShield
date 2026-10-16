import React from 'react';
import { 
  Table, 
  Upload, 
  HelpCircle, 
  Download, 
  Sliders, 
  Activity, 
  ShieldCheck 
} from 'lucide-react';

export type TabKey = 'studio' | 'import' | 'inquiry' | 'export' | 'rules' | 'benchmark' | 'privacy';

interface NavigationProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unresolvedCount: number;
  clarificationCount: number;
  totalCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  clarificationCount,
  totalCount
}) => {
  const tabs = [
    {
      id: 'studio' as TabKey,
      label: 'Reconciliation Studio',
      icon: Table,
      badge: totalCount > 0 ? `${totalCount}` : undefined,
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800/40'
    },
    {
      id: 'import' as TabKey,
      label: 'Import & Mapping',
      icon: Upload
    },
    {
      id: 'inquiry' as TabKey,
      label: 'Client Inquiry Builder',
      icon: HelpCircle,
      badge: clarificationCount > 0 ? `${clarificationCount}` : undefined,
      badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-800/60'
    },
    {
      id: 'export' as TabKey,
      label: 'Export & Audit',
      icon: Download
    },
    {
      id: 'rules' as TabKey,
      label: 'Rules & Automation',
      icon: Sliders
    },
    {
      id: 'benchmark' as TabKey,
      label: 'Gemma Benchmark',
      icon: Activity
    },
    {
      id: 'privacy' as TabKey,
      label: 'Privacy & Runtime',
      icon: ShieldCheck
    }
  ];

  return (
    <nav className="border-b border-slate-800/80 bg-[#0a0d15] px-6">
      <div className="max-w-7xl mx-auto flex space-x-1.5 overflow-x-auto scrollbar-none py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#161c2a] text-white border border-slate-700/80 shadow-sm shadow-black/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622]/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className={isActive ? 'font-semibold text-slate-100' : 'font-normal'}>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold border ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
