# LedgerShield: 90-Second Demonstration Script

This script provides an exact, chronological 90-second live demonstration walkthrough for hackathon judges and evaluators.

---

## Demo Timing & Walkthrough

### 0:00 – 0:15 | The Problem & The Privacy Trap
- **Speaker:** "Every month, independent bookkeepers spend 20+ hours deciphering messy, truncated bank feeds like `AMZN MKTP US*2K39` or `SQ *MIKE'S CAFE`. Sending these confidential statements to cloud AI APIs leaks sensitive financial data and risks hallucinated account codes. LedgerShield solves this: **Reconcile confidently. Keep financial data local.**"
- **Action on Screen:** Open LedgerShield at `http://localhost:3000`. Point out the verified badge in the header: **"Local-First • 0 Cloud AI Requests"**.

---

### 0:15 – 0:30 | Load Dataset & Chart of Accounts
- **Speaker:** "Let's load our synthetic demonstration client: Northstar Electrical Services, complete with 57 realistic contractor transactions and an active Chart of Accounts."
- **Action on Screen:** Click **"Load Demo Data"** in the header. The application loads the Northstar session, and the 57 unreviewed transactions appear in the table. Show the status chip: *57 Unreviewed*.

---

### 0:30 – 0:50 | Run Reconciliation: Deterministic Rules + Local AI
- **Speaker:** "Now watch LedgerShield's two-stage pipeline in action. Deterministic rules resolve known merchants in microseconds, while our local open-weight AI adapter classifies ambiguous trade expenses—strictly validating against our Chart of Accounts."
- **Action on Screen:** Click the blue **"Run Reconciliation"** button.
- In ~1 second, the table updates:
  - 29 standard transactions match exact rules (Home Depot -> 5010 Materials, Shell -> 6020 Fuel, Intuit -> 6060 Software).
  - 28 ambiguous transactions are processed by local AI/heuristics with confidence ratings and audit rationale.
  - 9 tricky transactions (Amazon marketplace, unknown wire, cash withdrawals) are safely flagged as **Needs Clarification**.

---

### 0:50 – 1:05 | Transaction Inspection & One-Click Rule Learning
- **Speaker:** "LedgerShield never silently auto-approves. Let's inspect a transaction."
- **Action on Screen:** Click the eye icon on `PLATT ELECTRIC SUPPLY`.
  - The **Transaction Inspector Drawer** slides out.
  - Show the raw bank description, normalized merchant, audit explanation, and evidence.
  - Click **"Remember Rule for 'PLATT ELECTRIC SUPPLY'"**.
  - Show the confirmation: *Rule Persisted Locally in SQLite!* Future statements will match this merchant automatically without model latency.
  - Click **"Approve Entry"**.

---

### 1:05 – 1:18 | Client Inquiry Builder
- **Speaker:** "What about ambiguous marketplace charges where the bookkeeper doesn't have the receipt? Switch to the **Client Inquiry Builder**."
- **Action on Screen:** Click the **Client Inquiry Builder** tab.
  - Show the 9 generated clarification questions for items like Amazon and handwritten checks.
  - Point out the contextual multiple-choice options (e.g. *Job site materials* vs. *Office gear* vs. *Personal draw*).
  - Click **"Copy Markdown"** (toast appears: *Copied to Clipboard!*). The bookkeeper can paste this straight into Slack or an email to the client.

---

### 1:18 – 1:30 | Export & The Open-AI Advantage
- **Speaker:** "Finally, let's export. Our pre-flight audit checklist ensures complete reconciliation integrity. Let's check our live **Model Benchmark**."
- **Action on Screen:**
  - Click **Export & Audit**: Show the pre-flight checklist and download the clean CSV.
  - Click **Model Benchmark**: Show the live benchmark results: **+21.4% accuracy improvement** over rules alone, sub-millisecond execution, and **$0.00 marginal inference cost**.
- **Closing Speaker:** "LedgerShield: Reconcile confidently. Keep financial data local."
