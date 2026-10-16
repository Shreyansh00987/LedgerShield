"""
LedgerShield Multi-Scenario Verification Script
Executes all 3 real-world business examples through the full reconciliation pipeline.
"""
import sys
from pathlib import Path
import requests

BASE_URL = "http://127.0.0.1:8000"
DATA_DIR = Path("d:/Project/LedgerShield/data")

def log(scenario, step, success, info=""):
    status = "SUCCESS" if success else "FAILED"
    print(f"[{status}] [{scenario}] {step} {f'({info})' if info else ''}")
    if not success:
        print(f"ERROR: Scenario '{scenario}' failed at step: {step}")
        sys.exit(1)

def run_scenario(csv_filename, session_name, custom_rules=None, expected_inquiry_min=1):
    print("\n" + "=" * 65)
    print(f"STARTING SCENARIO: {session_name}")
    print("=" * 65)

    csv_path = DATA_DIR / csv_filename
    if not csv_path.exists():
        log(session_name, "Find CSV File", False, f"Missing {csv_path}")

    # 1. Custom Rules Setup (if any)
    if custom_rules:
        for r in custom_rules:
            res = requests.post(f"{BASE_URL}/api/rules", json=r, timeout=5)
            log(session_name, f"Add Custom Rule '{r['pattern']}'", res.status_code == 200)

    # 2. Upload CSV
    with open(csv_path, "rb") as f:
        files = {"file": (csv_filename, f, "text/csv")}
        res = requests.post(f"{BASE_URL}/api/import", data={"session_name": session_name}, files=files, timeout=10)
    
    log(session_name, "Upload CSV", res.status_code == 200)
    data = res.json()
    session_id = data["session_id"]
    row_count = data["total_parsed"]
    log(session_name, "Parse CSV Rows", row_count > 0, f"{row_count} rows parsed")

    # 3. Fetch Transactions before Reconcile
    res = requests.get(f"{BASE_URL}/api/sessions/{session_id}/transactions", timeout=5)
    txs_initial = res.json()
    log(session_name, "Verify Ingestion", len(txs_initial) == row_count)

    # 4. Run Reconciliation Pipeline
    res = requests.post(f"{BASE_URL}/api/sessions/{session_id}/reconcile", timeout=30)
    log(session_name, "Run Reconciliation Pipeline", res.status_code == 200)
    summary = res.json()
    log(session_name, "Reconciliation Completion", summary.get("status") == "completed",
        f"Matches: {summary.get('deterministic_matches')}, Clarify: {summary.get('needs_clarification')}")

    # 5. Fetch Reconciled Transactions
    res = requests.get(f"{BASE_URL}/api/sessions/{session_id}/transactions", timeout=5)
    txs_reconciled = res.json()
    unreviewed = [t for t in txs_reconciled if t["status"] == "unreviewed"]
    log(session_name, "Zero Unreviewed Remaining", len(unreviewed) == 0)

    # 6. Generate Client Inquiry Questionnaire
    res = requests.post(
        f"{BASE_URL}/api/inquiry/generate",
        params={"session_id": session_id, "client_name": session_name},
        timeout=10
    )
    log(session_name, "Generate Client Inquiry", res.status_code == 200)
    inquiry_pkg = res.json()
    inquiry_count = len(inquiry_pkg.get("items", []))
    log(session_name, "Verify Inquiry Questions", inquiry_count >= expected_inquiry_min,
        f"{inquiry_count} clarification questions for client")

    # 7. Generate Client Markdown Output
    res = requests.get(
        f"{BASE_URL}/api/inquiry/markdown",
        params={"session_id": session_id, "client_name": session_name},
        timeout=5
    )
    log(session_name, "Generate Markdown Questionnaire", res.status_code == 200 and len(res.text) > 100)

    # 8. Batch Accept High Confidence Suggestions
    suggested_ids = [t["id"] for t in txs_reconciled if t["status"] == "suggested" and t["confidence"] >= 0.85]
    if suggested_ids:
        res = requests.post(
            f"{BASE_URL}/api/transactions/batch",
            json={"transaction_ids": suggested_ids[:5], "action": "accept"},
            timeout=5
        )
        log(session_name, "Batch Accept High Confidence Items", res.status_code == 200)

    # 9. General Ledger CSV Export
    res = requests.get(f"{BASE_URL}/api/sessions/{session_id}/export", timeout=5)
    log(session_name, "Export General Ledger CSV", res.status_code == 200 and "Transaction ID,Date" in res.text,
        f"{len(res.text.strip().splitlines())} lines exported")

    return {
        "session_id": session_id,
        "name": session_name,
        "rows": row_count,
        "inquiries": inquiry_count
    }

def main():
    print("=" * 65)
    print("RUNNING ALL 3 USER VERIFICATION SCENARIOS AGAINST LEDGERSHIELD")
    print("=" * 65)

    # Scenario 1: Apex Creative Studio (Digital Agency / Freelancer)
    s1 = run_scenario(
        csv_filename="example1_apex_creative_studio.csv",
        session_name="Apex Creative Studio",
        custom_rules=[
            {"pattern": "FIGMA INC", "account_id": "6060", "description": "Design software subscription"},
            {"pattern": "GOOGLE WORKSPACE", "account_id": "6060", "description": "Email and cloud suite"}
        ],
        expected_inquiry_min=1
    )

    # Scenario 2: Summit Plumbing & Heating (Trade Contractor)
    s2 = run_scenario(
        csv_filename="example2_summit_plumbing.csv",
        session_name="Summit Plumbing & Heating",
        custom_rules=[
            {"pattern": "FERGUSON ENTERPRISES", "account_id": "5010", "description": "Wholesale pipe and valves supplier"},
            {"pattern": "GRAINGER INDUSTRIAL", "account_id": "5010", "description": "Commercial pump motors"}
        ],
        expected_inquiry_min=2
    )

    # Scenario 3: Metro Cafe & Bakery (Hospitality & POS Retail)
    s3 = run_scenario(
        csv_filename="example3_metro_cafe.csv",
        session_name="Metro Cafe & Bakery",
        custom_rules=[
            {"pattern": "SYSCO FOOD", "account_id": "5010", "description": "Wholesale cafe bakery inventory"},
            {"pattern": "PACIFIC GAS", "account_id": "6070", "description": "Commercial electricity and kitchen gas"}
        ],
        expected_inquiry_min=1
    )

    print("\n" + "=" * 65)
    print("ALL 3 REAL-WORLD SCENARIOS EXECUTED WITH 100% SUCCESS!")
    print("=" * 65)
    print(f"1. {s1['name']}: {s1['rows']} txs, {s1['inquiries']} client inquiries generated.")
    print(f"2. {s2['name']}: {s2['rows']} txs, {s2['inquiries']} client inquiries generated.")
    print(f"3. {s3['name']}: {s3['rows']} txs, {s3['inquiries']} client inquiries generated.")

if __name__ == "__main__":
    main()
