export type TransactionStatus = 
  | 'unreviewed' 
  | 'suggested' 
  | 'accepted' 
  | 'edited' 
  | 'rejected' 
  | 'needs_clarification';

export type MatchSource = 
  | 'exact_rule' 
  | 'historical_pattern' 
  | 'local_ai' 
  | 'heuristic_fallback' 
  | 'manual';

export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description: string;
  typical_merchants: string[];
}

export interface Transaction {
  id: string;
  date: string;
  original_description: string;
  normalized_merchant: string;
  amount: number;
  currency: string;
  suggested_account_id?: string | null;
  confidence: number;
  match_source: MatchSource;
  status: TransactionStatus;
  explanation: string;
  evidence: string;
  requires_review: boolean;
  missing_information?: string | null;
  human_note?: string | null;
  reviewed_at?: string | null;
}

export interface Rule {
  id: string;
  pattern: string;
  account_id: string;
  is_exact: boolean;
  created_by: 'system' | 'user_learned';
  description: string;
}

export interface SessionSummary {
  id: string;
  name: string;
  created_at: string;
  total_count: number;
  unreviewed_count: number;
  accepted_count: number;
  edited_count: number;
  rejected_count: number;
  needs_clarification_count: number;
  auto_matched_count: number;
}

export interface ClientInquiryItem {
  transaction_id: string;
  date: string;
  amount: number;
  description: string;
  normalized_merchant: string;
  suggested_account?: string | null;
  question: string;
  options: string[];
  client_response?: string | null;
}

export interface ClientInquiryPackage {
  client_name: string;
  period: string;
  items: ClientInquiryItem[];
  custom_message?: string | null;
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  privacy: {
    mode: string;
    remote_ai_traffic: boolean;
    database: string;
    db_path: string;
  };
  model_runtime: {
    available: boolean;
    provider: string;
    models: string[];
    active_model: string;
  };
}

export interface BenchmarkMetrics {
  accuracy: number;
  matched_count: number;
  unresolved_count?: number;
  review_rate?: number;
  requires_review_rate?: number;
  duration_ms: number;
  avg_per_item_ms: number;
  accuracy_gain_pct?: number;
}

export interface BenchmarkResult {
  dataset_size: number;
  metrics: {
    deterministic_only: BenchmarkMetrics;
    deterministic_plus_local_ai: BenchmarkMetrics;
  };
  hardware_specs: {
    runtime: string;
    inference_path: string;
    model_adapter: string;
  };
}
