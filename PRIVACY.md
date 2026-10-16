# LedgerShield Privacy Architecture & Network Transparency Report

## 1. Verified Privacy Position

> **Defensible Privacy Guarantee:**
> "Financial transaction records are processed locally and are not sent to an external AI API by the application's reconciliation workflow."

LedgerShield was designed from the ground up to solve the privacy risks inherent in cloud-based AI accounting software. When accounting professionals upload client banking records, they are subject to strict non-disclosure agreements, professional codes of ethics, and data protection regulations. LedgerShield ensures confidential financial data remains confined to the user's local workstation.

---

## 2. What Data Is Processed

LedgerShield processes the following financial artifacts:
- **Bank Statement CSV Feeds:** Transaction dates, raw bank memos, amounts, debit/credit designations, currency.
- **Chart of Accounts:** Account codes, account names, classifications (Asset, Liability, Equity, Revenue, Expense), operational descriptions.
- **Merchant Normalization Records:** Cleaned vendor names, extracted keywords, store numbers.
- **Review Decisions & Notes:** Bookkeeper approvals, manual account overrides, internal audit notes.
- **Generated Client Inquiries:** Structured questionnaires for unresolved transactions.

---

## 3. Where Data Is Stored

- **Database:** Local embedded SQLite 3 database.
- **Default Storage Location:** `data/ledgershield.db` inside the local project workspace.
- **Access Scope:** Accessible only by the local user running the application on the local filesystem.
- **Data Purge:** An explicit, 1-click **Local Data Purge** control is provided in the Privacy & Settings panel (`/api/privacy/clear-data`). This atomically wipes all transactions, accounts, and session history from the database file.

---

## 4. Network Connections & Outbound Paths

| Component | Network Destination | Purpose | Transmission of Financial Data? |
|---|---|---|---|
| **Frontend UI** | `http://localhost:3000` / `127.0.0.1:8000` | Local web application shell & Vite dev server | **NO** (Localhost loopback only) |
| **Backend API** | `http://127.0.0.1:8000` | Local FastAPI services & SQLite transactions | **NO** (Localhost loopback only) |
| **Model Runtime** | `http://localhost:11434` (Ollama) | Local open-weight inference adapter | **NO** (Localhost loopback only) |
| **Telemetry** | None | LedgerShield includes **zero** external telemetry, tracking, or error-reporting SDKs | **NO** (No outbound telemetry) |
| **Cloud AI APIs** | None | LedgerShield connects to **zero** remote AI endpoints (OpenAI, Anthropic, Google Cloud) | **NO** (Zero remote AI calls) |

---

## 5. Security Safeguards Implemented

1. **Formula & Macro Injection Defense:**
   Malicious or accidental CSV content starting with `=`, `+`, `-`, `@`, `\t`, or `\r` can execute arbitrary commands via Dynamic Data Exchange (DDE) when opened in Microsoft Excel. LedgerShield automatically sanitizes all incoming CSV cells by escaping risky prefixes with a single quote (`'`).
2. **Audit Log Privacy Protection:**
   Internal system audit logs (`audit_logs` table) record administrative events (e.g., `import_csv`, `reconcile_session`, `export_csv`) and row counts, but **strictly omit** raw merchant descriptions, payee names, and transaction amounts.
3. **Strict Schema Bounds:**
   AI inference and deterministic rules are strictly bound to existing Chart of Accounts identifiers. If an engine outputs an unlisted identifier, it is rejected and marked for human verification.
4. **Local Purge Controls:**
   Bookkeepers can wipe all stored sessions, transactions, and account mappings with one click at the end of a client engagement.

---

## 6. What Has Been Verified vs. Unverified

### Verified Through Testing:
- [x] Zero network packets sent to remote third-party AI APIs during CSV import, reconciliation, inquiry generation, or export.
- [x] All database read and write operations occur exclusively against `data/ledgershield.db`.
- [x] Formula injection defense neutralizing spreadsheet command execution.
- [x] Complete erasure of transaction tables upon executing `clear_all_local_data()`.
- [x] Offline fallback operation: full pipeline functions seamlessly without internet connectivity.

### Disclosed Limitations (Unverified by Application Layer):
- Operating system-level telemetry (e.g. Windows diagnostics) and third-party browser extensions installed by the user are outside LedgerShield's execution boundary and cannot be controlled by the application.
- Initial download of open-weight models (e.g. running `ollama pull gemma2:2b`) connects to model repository registries; model downloads must be completed independently of the application reconciliation loop.
