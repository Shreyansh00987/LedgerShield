import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { TransactionTable } from './components/TransactionTable';
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer';
import { ImportView } from './components/ImportView';
import { InquiryView } from './components/InquiryView';
import { ExportView } from './components/ExportView';
import { RulesView } from './components/RulesView';
import { BenchmarkView } from './components/BenchmarkView';
import { PrivacyView } from './components/PrivacyView';
import { SpatialVault } from './components/SpatialVault';
import { X } from 'lucide-react';
import { 
  HealthStatus, 
  SessionSummary, 
  Transaction, 
  Account, 
  TransactionStatus 
} from './types';
import { 
  fetchHealth, 
  fetchSessions, 
  fetchTransactions, 
  fetchChartOfAccounts, 
  loadDemoSession, 
  runReconciliation, 
  updateTransaction, 
  batchAction, 
  createRule 
} from './api';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentTab, setCurrentTab] = useState<TabKey>('studio');
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setIsLoading(true);
    try {
      const [hData, sData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchSessions().catch(() => [])
      ]);
      setHealth(hData);
      setSessions(sData);

      if (sData.length > 0) {
        setCurrentSessionId(sData[0].id);
      } else {
        // Auto-load demo on first launch for instant live experience!
        const demoRes = await loadDemoSession();
        const updatedSessions = await fetchSessions();
        setSessions(updatedSessions);
        setCurrentSessionId(demoRes.session_id);
      }
    } catch (e) {
      console.error('Initialization error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load session data when currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) return;
    loadSessionData(currentSessionId);
  }, [currentSessionId]);

  const loadSessionData = async (sessionId: string) => {
    try {
      const [txs, accs] = await Promise.all([
        fetchTransactions(sessionId),
        fetchChartOfAccounts(sessionId)
      ]);
      setTransactions(txs);
      setAccounts(accs);
      
      // Update inspectingTx if open
      if (inspectingTx) {
        const found = txs.find(t => t.id === inspectingTx.id);
        if (found) setInspectingTx(found);
      }
    } catch (e) {
      console.error('Failed to load session data:', e);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const res = await loadDemoSession();
      const updatedSessions = await fetchSessions();
      setSessions(updatedSessions);
      setCurrentSessionId(res.session_id);
      setCurrentTab('studio');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    if (!currentSessionId) return;
    setIsReconciling(true);
    try {
      await runReconciliation(currentSessionId);
      await loadSessionData(currentSessionId);
      const updatedSessions = await fetchSessions();
      setSessions(updatedSessions);
    } catch (e) {
      console.error('Reconciliation error:', e);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleUpdateTransaction = async (
    id: string,
    updates: { suggested_account_id?: string | null; status?: TransactionStatus; human_note?: string }
  ) => {
    // Optimistic UI update
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          suggested_account_id: updates.suggested_account_id !== undefined ? updates.suggested_account_id : t.suggested_account_id,
          status: updates.status || t.status,
          human_note: updates.human_note !== undefined ? updates.human_note : t.human_note
        };
      }
      return t;
    }));

    try {
      await updateTransaction(id, updates);
      if (currentSessionId) {
        const updatedSessions = await fetchSessions();
        setSessions(updatedSessions);
      }
    } catch (e) {
      console.error(e);
      // Revert if error
      if (currentSessionId) loadSessionData(currentSessionId);
    }
  };

  const handleBatchAction = async (
    ids: string[],
    action: 'accept' | 'reject' | 'mark_clarification',
    accountId?: string
  ) => {
    try {
      await batchAction(ids, action, accountId);
      if (currentSessionId) {
        await loadSessionData(currentSessionId);
        const updatedSessions = await fetchSessions();
        setSessions(updatedSessions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (pattern: string, accountId: string, description: string) => {
    try {
      await createRule(pattern, accountId, description);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportSuccess = async (sessionId: string) => {
    const updatedSessions = await fetchSessions();
    setSessions(updatedSessions);
    setCurrentSessionId(sessionId);
    setCurrentTab('studio');
  };

  const handleDataCleared = async () => {
    setSessions([]);
    setCurrentSessionId(null);
    setTransactions([]);
    setInspectingTx(null);
  };

  // Counters
  const unresolvedCount = transactions.filter(t => t.status === 'needs_clarification' || !t.suggested_account_id).length;
  const clarificationCount = transactions.filter(t => t.status === 'needs_clarification').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d14] text-slate-100 font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Header */}
      <Header
        health={health}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onLoadDemo={handleLoadDemo}
        onRunReconciliation={handleRunReconciliation}
        isReconciling={isReconciling}
        onOpenVault={() => setIsVaultModalOpen(true)}
      />

      {/* Primary Navigation Tabs */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unresolvedCount={unresolvedCount}
        clarificationCount={clarificationCount}
        totalCount={transactions.length}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'studio' && (
          <TransactionTable
            transactions={transactions}
            accounts={accounts}
            onUpdateTransaction={handleUpdateTransaction}
            onBatchAction={handleBatchAction}
            onInspectTransaction={(tx) => setInspectingTx(tx)}
            selectedTransactionId={inspectingTx?.id || null}
          />
        )}

        {currentTab === 'import' && (
          <ImportView
            accounts={accounts}
            onImportSuccess={handleImportSuccess}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {currentTab === 'inquiry' && currentSessionId && (
          <InquiryView
            sessionId={currentSessionId}
            transactions={transactions}
          />
        )}

        {currentTab === 'export' && currentSessionId && (
          <ExportView
            sessionId={currentSessionId}
            transactions={transactions}
          />
        )}

        {currentTab === 'rules' && (
          <RulesView accounts={accounts} />
        )}

        {currentTab === 'benchmark' && (
          <BenchmarkView />
        )}

        {currentTab === 'privacy' && (
          <PrivacyView
            health={health}
            onRefreshHealth={async () => {
              const h = await fetchHealth();
              setHealth(h);
            }}
            onDataCleared={handleDataCleared}
          />
        )}
      </main>

      {/* Detail Slide-over Inspector */}
      <TransactionDetailDrawer
        transaction={inspectingTx}
        accounts={accounts}
        onClose={() => setInspectingTx(null)}
        onUpdate={handleUpdateTransaction}
        onCreateRule={handleCreateRule}
      />

      {/* Interactive 3D Spatial Vault Modal */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0d1019] border border-cyan-800/60 shadow-2xl shadow-cyan-950/40 p-2 sm:p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsVaultModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-400 hover:text-white border border-slate-700/80 transition"
              title="Close 3D Vault Inspector"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2 sm:p-4">
              <SpatialVault isModelLive={health?.model_runtime.available ?? false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
