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
  unresolvedCount,
  clarificationCount,
  totalCount
}) => {
  const tabs = [
    {
      id: 'studio' as TabKey,
      label: 'Reconciliation Studio',
      icon: Table,
      badge: totalCount > 0 ? `${totalCount}` : undefined
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
      badgeVariant: 'amber'
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
      label: 'Model Benchmark',
      icon: Activity
    },
    {
      id: 'privacy' as TabKey,
      label: 'Privacy & Runtime',
      icon: ShieldCheck
    }
  ];

  return (
    <nav className="border-b border-slate-800 bg-[#11141f] px-6">
      <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto scrollbar-none py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-800/90 text-white border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                    tab.badgeVariant === 'amber'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
