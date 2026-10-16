# Design System

<!-- impeccable:design-schema 1 -->

## Design Direction: Mission-Critical Financial Workspace

LedgerShield is an "Operate" mode workstation designed for professional bookkeepers and accounting practitioners who spend hours scanning dense rows of financial data.

### Aesthetics & Tone
- Deep neutral palette (`#0b0d14` background, `#111420` surface panels, `#151926` headers) providing high contrast and reduced eye strain during extended reconciliation sessions.
- Clean 1px subtle borders (`#242938` subtle, `#333a4f` strong) establishing clear surface hierarchy without nested card clutter.
- Tabular numerals (`font-variant-numeric: tabular-nums`) throughout all amount, date, and count displays.
- Strict avoidance of purple AI gradient blobs, glowing orbs, decorative charts without analytical purpose, and excessive modal popups.

## Reusable Tokens

### Colors
- **App Canvas:** `#0b0d14`
- **Surface Level 1:** `#111420`
- **Surface Level 2 (Elevated):** `#151926`
- **Surface Input:** `#0f121d`
- **Border Default:** `#242938`
- **Border Hover/Active:** `#3b82f6`
- **Text Primary:** `#f1f5f9`
- **Text Secondary:** `#94a3b8`
- **Text Muted:** `#64748b`

### Semantic Status Vocabularies
- **Accepted:** Background `rgba(16, 185, 129, 0.12)`, Text `#34d399`, Border `rgba(16, 185, 129, 0.28)`
- **Edited:** Background `rgba(6, 182, 212, 0.12)`, Text `#22d3ee`, Border `rgba(6, 182, 212, 0.28)`
- **Suggested:** Background `rgba(59, 130, 246, 0.12)`, Text `#60a5fa`, Border `rgba(59, 130, 246, 0.28)`
- **Needs Clarification:** Background `rgba(245, 158, 11, 0.12)`, Text `#fbbf24`, Border `rgba(245, 158, 11, 0.28)`
- **Rejected:** Background `rgba(239, 68, 68, 0.12)`, Text `#f87171`, Border `rgba(239, 68, 68, 0.28)`
- **Unreviewed:** Background `rgba(51, 65, 85, 0.40)`, Text `#cbd5e1`, Border `rgba(71, 85, 105, 0.40)`

### Typography & Data Scanning
- Primary Interface: System Sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- Data & Bank Feeds: Monospace (`ui-monospace, "Cascadia Code", Consolas, monospace`) for dates, raw descriptions, account codes, and amounts.
- Amounts: Aligned right, signed (`+$4,850.00` in emerald, `-$284.15` in slate-100), with fixed two-decimal precision.

### Layout Hierarchy
1. **Application Header:** Global branding, verified local-first badge, active model runtime status, session picker, and 1-click Demo quickstart.
2. **Tabbed Navigation:** Dense, fast switching between Studio, Import, Client Inquiry, Export & Audit, Rules, Benchmark, and Privacy.
3. **Reconciliation Studio:** Sticky header with search, status filter pills, select-all bulk actions bar, dense accounting table, inline Chart of Accounts dropdowns, and slide-over Transaction Inspector drawer.
4. **Interactive Drawers & Modals:** Progressive disclosure for deep audit trails without taking the user away from their reconciliation workflow.
