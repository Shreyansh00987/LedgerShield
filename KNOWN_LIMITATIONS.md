# LedgerShield: Known Limitations & Constraints

In alignment with our engineering values of honesty, transparency, and architectural rigor, this document details current system boundaries, edge cases, and known limitations of LedgerShield v1.0.

---

## 1. Local Model Runtime Constraints

- **Hardware Dependency for Live LLMs:** While the local heuristic and deterministic subsystems execute near-instantaneously on any standard CPU, executing 9B+ parameter open-weight models (e.g. Gemma 2 9B) with full context requires at least 8GB to 16GB of unified memory or a dedicated GPU.
- **Ollama Prerequisite for Live LLM Mode:** To enable live open-weight model generation instead of the heuristic fallback, the user must install and run an Ollama daemon (`ollama run gemma2:2b`). LedgerShield provides a seamless, honest fallback to its domain semantic engine when Ollama is offline.
- **Confidence Calibration:** Confidence scores emitted by heuristic rules and models are algorithmic estimates (0.0 to 1.0) and should not be interpreted as statistically calibrated frequentist probabilities.

---

## 2. Ingestion & File Formats

- **CSV Format Only:** LedgerShield v1.0 ingests delimited CSV bank statements. Scanned PDF bank statements, image receipts, or paper statements must be converted to CSV or ingested via an optical character recognition (OCR) utility prior to import.
- **Single-Table Layouts:** Complex multi-table bank statements (e.g. statements containing checking, savings, and credit card summaries in disparate tables within a single CSV file) must be separated into single-account files prior to import.

---

## 3. Financial & Accounting Boundaries

- **Single Operating Currency per Session:** LedgerShield v1.0 standardizes on a single currency (default: USD) per reconciliation session. Multi-currency bank feeds requiring real-time FX rate conversions are not currently calculated.
- **No Direct General Ledger API Sync:** LedgerShield exports clean, audit-compliant CSVs formatted for import into QuickBooks Online, Xero, and Sage. Direct bi-directional API write-back into QuickBooks via OAuth is deliberately excluded in the MVP to maintain a zero-cloud-credential footprint.
- **No Direct Bank Plaid Aggregation:** Direct cloud scraping of bank credentials via Plaid or Yodlee is intentionally avoided in the MVP to eliminate cloud credential storage and third-party credential compromise risks.
- **Not Certified Tax Advice:** LedgerShield is a productivity assistant for professional bookkeepers; it does not produce certified tax filings or guarantee legal compliance.

---

## 4. Multi-User & Synchronization

- **Single-User Local Storage:** Persistent records reside in a local SQLite file (`data/ledgershield.db`). Concurrent multi-user editing across distributed networks requires separate workstation instances or network filesystem coordination.
