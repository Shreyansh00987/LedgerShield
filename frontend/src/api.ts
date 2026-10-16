import {
  HealthStatus,
  SessionSummary,
  Transaction,
  Account,
  Rule,
  ClientInquiryPackage,
  BenchmarkResult
} from './types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function loadDemoSession(): Promise<{ session_id: string; name: string; transaction_count: number }> {
  const res = await fetch(`${API_BASE}/demo/load`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load demo session');
  return res.json();
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchTransactions(
  sessionId: string,
  status?: string,
  search?: string
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (search) params.append('search', search);
  
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/transactions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function runReconciliation(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/reconcile`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run reconciliation');
  return res.json();
}

export async function updateTransaction(
  id: string,
  data: { suggested_account_id?: string | null; status?: string; human_note?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update transaction');
  return res.json();
}

export async function batchAction(
  transactionIds: string[],
  action: 'accept' | 'reject' | 'mark_clarification',
  accountId?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/transactions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_ids: transactionIds,
      action,
      account_id: accountId
    })
  });
  if (!res.ok) throw new Error('Failed to execute batch action');
  return res.json();
}

export async function fetchChartOfAccounts(sessionId: string): Promise<Account[]> {
  const res = await fetch(`${API_BASE}/chart-of-accounts?session_id=${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch Chart of Accounts');
  return res.json();
}

export async function saveChartOfAccounts(sessionId: string, accounts: Account[]): Promise<any> {
  const res = await fetch(`${API_BASE}/chart-of-accounts?session_id=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accounts)
  });
  if (!res.ok) throw new Error('Failed to save Chart of Accounts');
  return res.json();
}

export async function fetchRules(): Promise<Rule[]> {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

export async function createRule(pattern: string, accountId: string, description: string = ''): Promise<Rule> {
  const formData = new FormData();
  formData.append('pattern', pattern);
  formData.append('account_id', accountId);
  formData.append('description', description);
  
  const res = await fetch(`${API_BASE}/rules`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to create rule');
  return res.json();
}

export async function generateInquiry(sessionId: string, clientName: string = 'Client'): Promise<ClientInquiryPackage> {
  const res = await fetch(`${API_BASE}/inquiry/generate?session_id=${sessionId}&client_name=${encodeURIComponent(clientName)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate inquiry');
  return res.json();
}

export async function fetchInquiryMarkdown(sessionId: string, clientName: string = 'Client'): Promise<string> {
  const res = await fetch(`${API_BASE}/inquiry/markdown?session_id=${sessionId}&client_name=${encodeURIComponent(clientName)}`);
  if (!res.ok) throw new Error('Failed to fetch inquiry markdown');
  return res.text();
}

export function getExportCsvUrl(sessionId: string): string {
  return `${API_BASE}/sessions/${sessionId}/export`;
}

export async function runEvaluation(): Promise<BenchmarkResult> {
  const res = await fetch(`${API_BASE}/evaluation/run`);
  if (!res.ok) throw new Error('Failed to run evaluation benchmark');
  return res.json();
}

export async function clearLocalData(): Promise<any> {
  const res = await fetch(`${API_BASE}/privacy/clear-data`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear local data');
  return res.json();
}

export async function uploadCsv(file: File, sessionName?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  if (sessionName) formData.append('session_name', sessionName);
  
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload CSV');
  return res.json();
}
