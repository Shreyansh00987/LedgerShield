# 🛡️ LedgerShield

<div align="center">

### Reconcile Confidently. Keep Financial Data Local.

[![Render](https://img.shields.io/badge/Render-Live%20Demo%20Active-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://ledgershield-dcqj.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Shreyansh00987/LedgerShield)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](LICENSE)
[![Model](https://img.shields.io/badge/Local%20AI-Gemma%202%202B-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20First-10B981?style=for-the-badge)](PRIVACY.md)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-1%3A16%20Walkthrough-red?style=for-the-badge&logo=youtube&logoColor=white)](LedgerShield_Demo_Walkthrough.mp4)

---

### 🌐 **Live Cloud Demo on Render:**
### 👉 [https://ledgershield-dcqj.onrender.com](https://ledgershield-dcqj.onrender.com) 👈

🎥 **Watch 76s Walkthrough Demo Video (with Neural AI Voice):** [LedgerShield_Demo_Walkthrough.mp4](LedgerShield_Demo_Walkthrough.mp4)

*Full 3D interactive React UI, deterministic reconciliation, client inquiry generator, and benchmark evaluator hosted live on Render.*

---

</div>

LedgerShield is a privacy-first transaction reconciliation assistant designed for independent bookkeepers, solo accounting professionals, freelance fractional CFOs, and small accounting practices.

It streamlines the monthly reconciliation of messy, ambiguous bank transaction feeds by uniting **deterministic pattern matching**, **local open-weight AI (Gemma)**, **Chart of Accounts schema enforcement**, **human-in-the-loop review**, **client inquiry generation**, and **clean general ledger exports**—with the non-negotiable architectural guarantee that confidential financial records never leave the user's device.

---

## The Problem

Independent bookkeepers spend 15–25 hours per client every month manually deciphering truncated, messy bank transaction descriptions (e.g. `AMZN MKTP US*2K39`, `SQ *MIKE'S CAFE`, `PURCHASE 09/12 CHEVRON #4021`).

Existing solutions force a bad trade-off:
1. **Manual Spreadsheets / Rigid Rules:** Inflexible regex rules break on minor string variations, requiring hours of repetitive categorization.
2. **Cloud AI Plugins:** Send confidential banking transactions, payee names, invoice values, and client identities to external third-party proprietary AI APIs (OpenAI, Anthropic). This violates confidentiality agreements, exposes client financial records to external data retention/training pipelines, and risks AI hallucination of non-existent account codes.

## The LedgerShield Solution

LedgerShield provides a mission-critical, local-first financial workspace that:
1. **Keeps Financial Data 100% Local:** Bank feeds, Chart of Accounts, and reconciliation records reside exclusively in an embedded local SQLite database on your device.
2. **Never Hallucinates Account Codes:** Strict schema enforcement ensures that AI and heuristic engines can *only* assign account codes that exist in the active Chart of Accounts.
3. **Never Silently Auto-Approves:** Bookkeepers retain complete authority. AI suggestions are flagged with audit rationale, evidence, and confidence estimates; human verification is always required.
4. **Combines Deterministic Rules with Semantic AI:** Deterministic matching and historical merchant learning resolve standard recurring bills in microseconds; local open-weight AI resolves ambiguous vendor names.
5. **Generates Client Questionnaires:** Ambiguous marketplace purchases (Amazon, PayPal, retail) are automatically compiled into structured, multiple-choice Markdown questionnaires ready to send to clients.
6. **Produces Clean General Ledger Exports:** One-click CSV export with pre-flight audit warnings, compatible with QuickBooks Online, Xero, and Sage.

---

## Architecture Overview

```
                   ┌──────────────────────────────────────┐
                   │        Bank Statement CSV File       │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │    Safe CSV Parser & Sanitizer       │
                   │ (Formula Injection & Dupe Filtering) │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │    Merchant Normalization Engine     │
                   │   (Strips prefixes, store #s, zip)   │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
       ┌──────────────────────────────┴──────────────────────────────┐
       │                                                             │
       ▼                                                             ▼
┌──────────────┐                                              ┌──────────────┐
│ Deterministic│                                              │ Local AI     │
│ Rule Match   │──[No match]──► Local Open-Weight Semantic ──►│ Chart of     │
│ & History    │                Engine (Gemma 2 / Ollama)     │ Accounts     │
└──────┬───────┘                                              │ Validator    │
       │                                                      └──────┬───────┘
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │  Human-in-the-Loop Review Studio     │
                   │  (Accept, Edit, Reject, Rules Drawer)│
                   └──────────────────┬───────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │  Client Inquiry Generator │             │  Clean Reconciliation CSV │
   │  (Structured Markdown)    │             │  (QBO / Xero Compatible)  │
   └───────────────────────────┘             └───────────────────────────┘
```

---

## Key Features

- **Reconciliation Studio:** High-density, professional financial table with tabular numerals, keyboard accessibility, status filtering, multi-row bulk approvals, and inline account assignment.
- **Transaction Inspector Drawer:** Slide-over audit drawer detailing raw vs. normalized strings, rationale, evidence, and a 1-click "Remember Reusable Rule" button.
- **Client Inquiry Builder:** Automatically turns ambiguous items into professional questionnaires with contextual multiple-choice options (e.g. Job Materials vs. Office Supplies vs. Personal Draw).
- **Chart of Accounts Validation:** Active session validation preventing invalid account assignment.
- **Live Model Benchmark:** Built-in evaluation harness measuring accuracy, review rate, and latency between deterministic rules and combined AI pipelines.
- **Privacy & Runtime Center:** Real-time diagnostics of local model status, SQLite file paths, and a 1-click local data purge control.
- **Demo Mode:** Pre-loaded with synthetic "Northstar Electrical Services" dataset (120+ realistic contractor transactions).

---

## Quickstart & Installation

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm (Tested on Node v24.21.0)
- *(Optional for live local LLM inference)* [Ollama](https://ollama.ai) with `gemma2:2b` or `gemma:2b`

### 1. Clone & Set Up Workspace
```bash
git clone https://github.com/Shreyansh00987/LedgerShield.git
cd LedgerShield
```

### 2. Backend Setup
```bash
# Install Python requirements
python -m pip install fastapi uvicorn pydantic httpx pandas pytest

# Start FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. (Optional) Run with Local Gemma 2
If you have Ollama installed:
```bash
ollama run gemma2:2b
```
LedgerShield will automatically detect the live local model runtime via `/api/health` and route ambiguous transactions through Gemma 2. If Ollama is offline, LedgerShield transparently falls back to its deterministic domain heuristic subsystem with honest UI disclosure.

---

## Running Automated Tests

Run the complete backend unit and integration test suite:
```bash
python -m pytest backend/tests/test_all.py -v
```

Run the end-to-end integration test:
```bash
python scripts/test_e2e.py
```

Run the design quality check:
```bash
npm --prefix frontend run build
```

---

## Project Structure

```
LedgerShield/
├── backend/
│   ├── core/ & config.py          # Configuration and paths
│   ├── database.py                # SQLite embedded storage with WAL mode
│   ├── models.py                  # Strict Pydantic models
│   ├── main.py                    # FastAPI application routes
│   ├── services/
│   │   ├── csv_parser.py          # Safe CSV parser with macro injection defense
│   │   ├── chart_of_accounts.py   # CoA manager & strict validator
│   │   ├── matching_engine.py     # Deterministic normalization & rule learner
│   │   ├── ai_reconciler.py       # Gemma/Ollama adapter & heuristic fallback
│   │   ├── client_inquiry.py      # Client inquiry questionnaire generator
│   │   ├── export_service.py      # Reconciliation CSV exporter
│   │   └── evaluator.py           # Benchmark evaluation harness
│   └── tests/
│       └── test_all.py            # Pytest test suite (13 tests)
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable financial UI components
│   │   │   ├── Header.tsx         # Brand, status, and session switcher
│   │   │   ├── Navigation.tsx     # Tabbed navigation bar
│   │   │   ├── TransactionTable.tsx # Dense Reconciliation Studio table
│   │   │   ├── TransactionDetailDrawer.tsx # Slide-over inspection drawer
│   │   │   ├── ImportView.tsx     # CSV import & column mapping
│   │   │   ├── InquiryView.tsx    # Client inquiry questionnaire builder
│   │   │   ├── ExportView.tsx     # Pre-flight checklist & CSV download
│   │   │   ├── RulesView.tsx      # Deterministic & learned rules manager
│   │   │   ├── BenchmarkView.tsx  # Live model benchmark interface
│   │   │   ├── PrivacyView.tsx    # Privacy audit & local data wipe
│   │   │   └── StatusBadge.tsx    # Semantic status indicators
│   │   ├── types.ts               # TypeScript data definitions
│   │   ├── api.ts                 # API client
│   │   └── App.tsx                # Application shell
│   └── vite.config.ts             # Vite configuration with Tailwind v4
├── data/
│   ├── demo_northstar_transactions.csv # Synthetic demo dataset
│   └── ledgershield.db            # Local SQLite database
├── scripts/
│   └── test_e2e.py                # End-to-end automated test script
├── PRODUCT.md                     # Durable product specification
├── DESIGN.md                      # Design system & tokens
├── ARCHITECTURE.md                # System architecture documentation
├── PRIVACY.md                     # Privacy claims & network audit
├── MODEL_EVALUATION.md            # Empirical benchmark evaluation report
├── DEMO_SCRIPT.md                 # 90-second live demonstration script
├── HACKATHON_SUBMISSION.md        # Hackathon submission document
├── KNOWN_LIMITATIONS.md           # Honest disclosure of current constraints
└── USER_VALIDATION.md             # Real-user testing script and protocol
```

---

## License

Apache 2.0 License. See [LICENSE](LICENSE) for details.
