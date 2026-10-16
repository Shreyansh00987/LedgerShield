# LedgerShield System Architecture

## 1. System Philosophy & Design Principles

LedgerShield is engineered under five fundamental architectural invariants:

1. **Local-First Financial Privacy:** Bank transaction feeds and business accounting ledgers contain highly confidential data (vendor names, customer identities, payment volumes, owner drawings). No transaction record is ever transmitted to a third-party cloud AI API.
2. **Deterministic Precedence:** Deterministic normalization, regex rules, and historical approved patterns always execute prior to model inference. What can be solved accurately with rules must not burn model latency.
3. **Strict Schema Enforceability:** Neither AI nor heuristics are permitted to hallucinate Chart of Accounts codes. All outputs are strictly validated against the active session's Chart of Accounts; invalid codes are rejected and flagged for human review.
4. **Human Final Authority:** AI suggestions are explicitly marked as `suggested` with confidence estimates and evidence. The application never silently treats an automated suggestion as an approved ledger entry.
5. **Operational Information Density:** UI layout follows the Impeccable "Operate" standard: high scanability, tabular numerals, consistent semantic status tokens, and zero distracting animations.

---

## 2. Component Architecture

```
+-------------------------------------------------------------------------+
|                        LEDGERSHIELD WORKSTATION                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  FRONTEND LAYER (React 19 + TypeScript + Vite + Tailwind CSS v4)        |
|  ├── Reconciliation Studio (Dense Table, Filters, Multi-Row Batch)      |
|  ├── Transaction Inspector Drawer (Rationale, Normalization, Rules)     |
|  ├── Client Inquiry Builder (Interactive Question & Option Formatter)  |
|  ├── Import & Mapping Studio (CSV Upload, Preview, Column Mapper)       |
|  ├── Export & Completion (Pre-Flight Audit Checks, CSV Downloader)      |
|  ├── Rules Manager (System Rules & User-Learned SQLite Rules)           |
|  ├── Live Model Benchmark (Comparative Evaluation Harness)              |
|  └── Privacy Center (Network Diagnostics, Local Data Purge)             |
|                                                                         |
+---------------------------------▲---------------------------------------+
                                  │ JSON API (FastAPI Proxy / Vite)
+---------------------------------▼---------------------------------------+
|  BACKEND LAYER (Python 3.14 + FastAPI + Pydantic v2)                    |
|                                                                         |
|  ├── CSV Parser & Sanitizer                                             |
|  │   ├── Formula Injection Protection ('=', '+', '-', '@' escape)       |
|  │   ├── Auto-Column Detection (Date, Description, Amount, Debit/Credit)|
|  │   └── Duplicate Row Detection & Invalidation                         |
|  │                                                                      |
|  ├── Deterministic Matching Engine                                      |
|  │   ├── Merchant Normalization (Strips prefixes: SQ*, TST*, PAYPAL*)   |
|  │   ├── Suffix Stripping (Store #s, Terminal IDs, Zip codes)           |
|  │   ├── Exact & Substring Rule Lookup (System + User-Learned)          |
|  │   └── Historical Pattern Matcher (Counts previously approved txs)    |
|  │                                                                      |
|  ├── Open-Weight AI Inference Adapter                                   |
|  │   ├── Gemma 2 via Local Ollama Daemon (localhost:11434)              |
|  │   ├── Local OpenAI-compatible Daemon (LM Studio / llama.cpp)         |
|  │   ├── Semantic Heuristic Engine (Offline Deterministic Fallback)     |
|  │   └── Strict Output Schema Enforcer (JSON Validation & Bounds)       |
|  │                                                                      |
|  ├── Chart of Accounts Validator                                        |
|  │   ├── Account ID Existence Enforcement                               |
|  │   └── Trade Contractor & Small Business Templates                    |
|  │                                                                      |
|  ├── Client Inquiry Generator                                           |
|  │   ├── Contextual Question Engine (Marketplaces, Transfers, Meals)    |
|  │   └── Markdown / Plaintext Formatter                                 |
|  │                                                                      |
|  └── Export Service                                                     |
|      ├── Pre-Flight Reconciliation Integrity Validator                  |
|      └── Clean General Ledger CSV Generator                             |
|                                                                         |
|  PERSISTENCE LAYER (Embedded SQLite 3)                                  |
|  ├── File: data/ledgershield.db                                         |
|  ├── PRAGMA journal_mode=WAL (Concurrent Readers & Writers)             |
|  ├── Tables: sessions, accounts, transactions, rules, audit_logs        |
|  └── Audit Logs Redaction (Excludes confidential financial amounts)     |
+-------------------------------------------------------------------------+
```

---

## 3. Data Pipeline Lifecycle

```
[ Bank Statement CSV ]
       │
       ▼
(1. Ingestion & Validation) ──► Check size (<10MB), strip Excel macro triggers, validate dates
       │
       ▼
(2. Normalization)          ──► Clean prefixes ("SQ *", "TST*", "CHECKCARD"), store IDs, state/zip
       │
       ▼
(3. Deterministic Match)    ──► Check exact rules & historical approved entries
       ├───────────────────────► MATCH FOUND (Confidence: 0.90–0.99) ──► Status: "Suggested"
       │
       ▼ (No Rule Match)
(4. Local AI Inference)     ──► Gemma 2 / Heuristic Engine evaluates context against CoA
       ├───────────────────────► VALID COA CODE ──► Status: "Suggested" (with rationale & evidence)
       │
       └───────────────────────► AMBIGUOUS / UNKNOWN ──► Status: "Needs Clarification"
       │
       ▼
(5. Human Review Studio)    ──► Bookkeeper reviews: One-click Accept, Inline Edit, Reject
       ├───────────────────────► User accepts with edit ──► Prompt to save as reusable rule!
       │
       ▼
(6. Client Inquiry Builder) ──► Filter "Needs Clarification" ──► Generate Markdown Questionnaire
       │
       ▼
(7. Clean CSV Export)       ──► Pre-flight check (warns if unresolved) ──► Download Ledger CSV
```

---

## 4. Key Security & Privacy Safeguards

1. **Local-First Boundary:** All API calls originate and terminate on `localhost` (`127.0.0.1`). No transaction fields are dispatched across WAN networks.
2. **Formula Injection Sanitization:** CSV parser inspects cell inputs. Any cell starting with `=, +, -, @` is sanitized with a leading single quote (`'`) to neutralize DDE / spreadsheet formula injection attacks when exported to Excel.
3. **Audit Log Privacy:** Operational audit records in SQLite record action names and record counts, strictly omitting raw customer merchant strings and dollar values.
4. **Data Purge Capability:** Built-in atomic database wipe resets all session and transaction tables upon bookkeeper command.
