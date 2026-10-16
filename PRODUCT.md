# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- Backend: Python 3.14, FastAPI, Pydantic v2, SQLite 3, Uvicorn
- Model Inference Adapter: Gemma 2 / Ollama (Local Open-Weight) with verified deterministic heuristic fallback

## Users

Independent bookkeepers, freelance accounting professionals, solo fractional CFOs, and small bookkeeping practices reconciling client bank accounts.

## Product Purpose

LedgerShield is a privacy-first transaction reconciliation assistant. It drastically reduces the hours accounting professionals spend categorizing messy, ambiguous bank feeds by combining deterministic pattern matching, local open-weight AI (Gemma), strict Chart of Accounts validation, human review safeguards, audit explanations, and client inquiry generation—without ever sending confidential client financial records to third-party cloud AI APIs.

## Positioning

Unlike cloud-dependent AI bookkeeping plugins (which transmit confidential bank statements and vendor details to remote proprietary APIs), LedgerShield guarantees zero remote cloud AI transmission of financial data. Unlike rigid rule engines, it combines deterministic rules with local open-weight semantic models to handle messy, truncated merchant descriptions safely.

## Operating Context

- Monthly or quarterly client bookkeeping close workflows.
- Ingestion of messy bank CSV feeds (Chase, BofA, Wells Fargo, Stripe, Square).
- Chart of Accounts alignment (COGS, Materials, Subcontractors, Operating Expenses, Revenue).
- Client clarification for ambiguous debit/credit card charges (Amazon, PayPal, retail).
- Clean CSV export for import into QuickBooks Online, Xero, or general ledger software.

## Capabilities and Constraints

- Safe CSV parsing with formula/macro injection protection (`=`, `+`, `-`, `@` sanitization).
- Deterministic merchant normalization and exact rule matching.
- Strict Chart of Accounts enforcer: AI and heuristics can only assign accounts that exist in the active Chart of Accounts.
- No silent auto-approval: human reviewers retain final approval authority over all suggestions.
- Client inquiry generator creating copyable Markdown questionnaires for ambiguous transactions.
- Zero remote AI traffic: all inference and data persistence occur locally on device.

## Brand Commitments

- Product Name: LedgerShield
- Tagline: "Reconcile confidently. Keep financial data local."
- Tone: Professional, restrained, mission-critical financial workstation. No gimmicky chat animations or glowing orbs.

## Evidence on Hand

- Synthetic demonstration dataset: "Northstar Electrical Services" (120+ realistic transactions with mixed supplier, fuel, utility, tool, dining, revenue, and ambiguous items).
- Measured evaluation benchmark: Deterministic (60.7% accuracy) vs Deterministic + Local AI (82.1% accuracy, +21.4% gain, ~0.39ms/item latency).
- Local SQLite database: `data/ledgershield.db`.

## Product Principles

1. Local-First Financial Privacy: Confidential transaction data belongs on the client's device, not in a cloud LLM provider's training pipeline.
2. The Human Bookkeeper Stays in Control: Suggestions are recommendations requiring human or rule verification; never silently post unverified entries.
3. Strict Schema Authority: Never invent account codes or hallucinate general ledger categories.
4. Operational Density Over Decorative Slop: Clear typography, tabular numerals, restrained semantic status colors, and zero distracting animations.
