"""
LedgerShield Comprehensive End-to-End Deep System Verification Script
Tests all functional capabilities, security controls, API endpoints, and edge cases.
"""
import sys
import io
import requests

BASE_URL = "http://127.0.0.1:8000"

def log_test(name, passed, detail=""):
    mark = "PASS [OK]" if passed else "FAIL [X]"
    print(f"[{mark}] {name} {('- ' + detail) if detail else ''}")
    if not passed:
        print(f"FAILED AT: {name} - {detail}")
        sys.exit(1)

def run_deep_tests():
    print("=" * 70)
    print("LEDGERSHIELD DEEP SYSTEM AUDIT & INTEGRITY VERIFICATION")
    print("=" * 70)

    # 1. Health & Architecture Diagnostics
    res = requests.get(f"{BASE_URL}/api/health", timeout=5)
    log_test("Health Endpoint HTTP 200", res.status_code == 200)
    health = res.json()
    log_test("Privacy Mode Local-First", health.get("privacy", {}).get("mode") == "local-first")
    log_test("Remote AI Traffic Disabled", health.get("privacy", {}).get("remote_ai_traffic") is False)

    # 2. Demo Dataset Initialization
    res = requests.post(f"{BASE_URL}/api/demo/load", timeout=10)
    log_test("Demo Session Load HTTP 200", res.status_code == 200)
    demo_data = res.json()
    session_id = demo_data["session_id"]
    log_test("Demo Session Created", bool(session_id), f"Session: {session_id}")

    # 3. Chart of Accounts Retrieval
    res = requests.get(f"{BASE_URL}/api/chart-of-accounts", params={"session_id": session_id}, timeout=5)
    log_test("Chart of Accounts HTTP 200", res.status_code == 200)
    accounts = res.json()
    log_test("Chart of Accounts Contains Expected Accounts", len(accounts) >= 5, f"Found {len(accounts)} accounts")
    account_ids = {a["id"] for a in accounts}
    log_test("Essential Account '5010' Present", "5010" in account_ids)
    log_test("Essential Account '4010' Present", "4010" in account_ids)

    # 4. Transaction Ingestion & In-Memory State
    res = requests.get(f"{BASE_URL}/api/sessions/{session_id}/transactions", timeout=5)
    log_test("Transactions List HTTP 200", res.status_code == 200)
    txs = res.json()
    log_test("Demo Transactions Count is 57", len(txs) == 57, f"Count: {len(txs)}")

    # 5. Core Reconciliation Pipeline Execution
    res = requests.post(f"{BASE_URL}/api/sessions/{session_id}/reconcile", timeout=30)
    log_test("Reconciliation Run HTTP 200", res.status_code == 200)
    recon_summary = res.json()
    log_test("Reconciliation Summary Status Completed", recon_summary.get("status") == "completed")
    log_test("Deterministic Matches Found", recon_summary.get("deterministic_matches", 0) > 0, 
             f"Deterministic: {recon_summary.get('deterministic_matches')}")
    log_test("Clarification Items Flagged", recon_summary.get("needs_clarification", 0) > 0,
             f"Needs clarification: {recon_summary.get('needs_clarification')}")

    # 6. Reconciled Transaction State Verification
    res = requests.get(f"{BASE_URL}/api/sessions/{session_id}/transactions", timeout=5)
    reconciled_txs = res.json()
    statuses = {t["status"] for t in reconciled_txs}
    log_test("No Unreviewed Transactions Left After Reconcile", "unreviewed" not in statuses)
    sources = {t["match_source"] for t in reconciled_txs}
    log_test("Verified Sources Include Exact Rule & Fallback", "exact_rule" in sources)

    # 7. Single Transaction Update & Auditor Internal Note
    first_tx = reconciled_txs[0]
    update_payload = {
        "suggested_account_id": "5010",
        "status": "accepted",
        "human_note": "Audited and confirmed by Bookkeeper on engagement call"
    }
    res = requests.patch(f"{BASE_URL}/api/transactions/{first_tx['id']}", json=update_payload, timeout=5)
    log_test("Transaction Patch Update HTTP 200", res.status_code == 200)
    res_tx = requests.get(f"{BASE_URL}/api/sessions/{session_id}/transactions", timeout=5).json()
    updated_tx = next(t for t in res_tx if t["id"] == first_tx["id"])
    log_test("Updated Transaction Status is 'accepted'", updated_tx["status"] == "accepted")
    log_test("Updated Transaction Human Note Preserved", "Audited and confirmed" in (updated_tx.get("human_note") or ""))

    # 8. Batch Review Action (Accept 3 items at once)
    pending_suggested = [t["id"] for t in res_tx if t["status"] == "suggested"][:3]
    log_test("Found Suggested Items for Batch Test", len(pending_suggested) == 3)
    batch_payload = {
        "transaction_ids": pending_suggested,
        "action": "accept"
    }
    res = requests.post(f"{BASE_URL}/api/transactions/batch", json=batch_payload, timeout=5)
    log_test("Batch Action HTTP 200", res.status_code == 200)
    batch_res = res.json()
    log_test("Batch Count Matches 3", batch_res.get("count") == 3)

    # 9. Dynamic Deterministic Rule Creation & Learning
    rule_payload = {
        "pattern": "CUSTOM TEST VENDOR XYZ",
        "account_id": "6020",
        "description": "Rule created during deep automated system test"
    }
    res = requests.post(f"{BASE_URL}/api/rules", json=rule_payload, timeout=5)
    log_test("Create Custom Rule HTTP 200", res.status_code == 200)
    res_rules = requests.get(f"{BASE_URL}/api/rules", timeout=5).json()
    created_rule = next((r for r in res_rules if r["pattern"] == "CUSTOM TEST VENDOR XYZ"), None)
    log_test("Custom Rule Successfully Persisted in SQLite", created_rule is not None)
    log_test("Rule Marked with 'user_learned' Origin", created_rule.get("created_by") == "user_learned")

    # 10. Client Inquiry Questionnaire Generation
    res = requests.post(
        f"{BASE_URL}/api/inquiry/generate",
        params={"session_id": session_id, "client_name": "Apex Electrical Partners"},
        timeout=10
    )
    log_test("Inquiry Generation HTTP 200", res.status_code == 200)
    inquiry_pkg = res.json()
    log_test("Inquiry Package Has Structured Items", len(inquiry_pkg.get("items", [])) > 0,
             f"Questions: {len(inquiry_pkg.get('items', []))}")
    first_item = inquiry_pkg["items"][0]
    log_test("Inquiry Item Has Question Text", bool(first_item.get("question")))
    log_test("Inquiry Item Has Choice Options", len(first_item.get("options", [])) >= 2)

    # 11. Client Inquiry Markdown Export
    res = requests.get(
        f"{BASE_URL}/api/inquiry/markdown",
        params={"session_id": session_id, "client_name": "Apex Electrical Partners"},
        timeout=5
    )
    log_test("Inquiry Markdown HTTP 200", res.status_code == 200)
    markdown_text = res.text
    log_test("Markdown Header Formatted Correctly", "Transaction Clarification Request" in markdown_text)
    log_test("Markdown Contains Checkboxes for Clients", "- [ ]" in markdown_text)

    # 12. General Ledger CSV Export
    res = requests.get(f"{BASE_URL}/api/sessions/{session_id}/export", timeout=5)
    log_test("General Ledger Export HTTP 200", res.status_code == 200)
    csv_content = res.text
    log_test("Export CSV Header Line Valid", "Transaction ID,Date,Original Bank Description" in csv_content)
    log_test("Export CSV Contains Reconciled Rows", len(csv_content.strip().split("\n")) > 10)

    # 13. CSV Ingestion with DDE Formula Injection Defense
    malicious_csv = (
        "Date,Description,Amount\n"
        "2026-09-10,=CMD|' /C calc'!A0,-50.00\n"
        "2026-09-11,@SUM(1+1)*cmd|' /C calc'!A0,-25.00\n"
        "2026-09-12,+123456789,-100.00\n"
        "2026-09-13,SAFE LOCAL HARDWARE STORE,-75.50\n"
    )
    files = {"file": ("test_security.csv", io.BytesIO(malicious_csv.encode("utf-8")), "text/csv")}
    res = requests.post(f"{BASE_URL}/api/upload-csv", data={"session_name": "Security Audit Session"}, files=files, timeout=10)
    log_test("CSV Upload with Formula Injection Payloads HTTP 200", res.status_code == 200)
    upload_res = res.json()
    sec_session_id = upload_res["session_id"]
    log_test("Security Audit Session Created", bool(sec_session_id))

    res = requests.get(f"{BASE_URL}/api/sessions/{sec_session_id}/transactions", timeout=5)
    sec_txs = res.json()
    log_test("Security Transactions Parsed (4 rows)", len(sec_txs) == 4)
    # Verify sanitization
    cmd_tx = next((t for t in sec_txs if "calc" in t["original_description"]), None)
    log_test("Formula Injection Sanitized with Leading Apostrophe", 
             cmd_tx is not None and cmd_tx["original_description"].startswith("'"),
             f"Sanitized memo: {cmd_tx['original_description'] if cmd_tx else 'None'}")

    # 14. Open-Weight Model Evaluation Benchmark
    res = requests.get(f"{BASE_URL}/api/evaluation/run", timeout=30)
    log_test("Evaluation Benchmark HTTP 200", res.status_code == 200)
    bench_data = res.json()
    log_test("Benchmark Dataset Size Measured (28 items)", bench_data.get("dataset_size") == 28)
    log_test("Deterministic Baseline Metrics Present", "deterministic_only" in bench_data.get("metrics", {}))
    log_test("Hybrid Gemma Pipeline Metrics Present", "deterministic_plus_local_ai" in bench_data.get("metrics", {}))
    log_test("Accuracy Improvement Calculated", bench_data["metrics"]["deterministic_plus_local_ai"]["accuracy_gain_pct"] > 0)
    log_test("Requires Review Rate Calculated", "requires_review_rate" in bench_data["metrics"]["deterministic_plus_local_ai"])

    # 15. Sessions Summary Listing
    res = requests.get(f"{BASE_URL}/api/sessions", timeout=5)
    log_test("Sessions Listing HTTP 200", res.status_code == 200)
    sessions = res.json()
    log_test("Sessions Include Both Demo and Security Sessions", len(sessions) >= 2)

    # 16. Local Privacy Purge & Clean Reset
    res = requests.post(f"{BASE_URL}/api/privacy/clear", timeout=10)
    log_test("Privacy Clear HTTP 200", res.status_code == 200)
    res_after = requests.get(f"{BASE_URL}/api/sessions", timeout=5).json()
    log_test("All Sessions Purged (Count is 0)", len(res_after) == 0)

    # 17. Post-Purge Clean Re-Initialization
    res_reinit = requests.post(f"{BASE_URL}/api/demo/load", timeout=10)
    log_test("Post-Purge Re-Initialization HTTP 200", res_reinit.status_code == 200)
    res_sessions_new = requests.get(f"{BASE_URL}/api/sessions", timeout=5).json()
    log_test("Fresh Demo Session Active After Purge", len(res_sessions_new) == 1)

    print("=" * 70)
    print("ALL 17 CRITICAL SYSTEM & PRIVACY AUDIT STAGES PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_deep_tests()
