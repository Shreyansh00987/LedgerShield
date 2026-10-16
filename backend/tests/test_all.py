import pytest
import io
import json
from backend.services.csv_parser import parse_csv_content, sanitize_cell, parse_amount, parse_date
from backend.services.matching_engine import normalize_merchant_name, match_deterministic, add_user_rule
from backend.services.chart_of_accounts import (
    DEFAULT_TRADE_COA, validate_account_id, save_chart_of_accounts, get_chart_of_accounts
)
from backend.services.ai_reconciler import run_local_heuristic_classifier, check_local_model_health
from backend.services.client_inquiry import generate_client_inquiry, format_inquiry_as_markdown
from backend.services.export_service import export_transactions_to_csv
from backend.models import TransactionBase, Account
from backend.database import init_db, get_connection

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

def test_csv_parser_valid():
    csv_data = """Date,Description,Amount
2026-09-01,HOME DEPOT #4021,-145.20
2026-09-02,INVOICE #1010 DEPOSIT,2500.00
"""
    txs, diag = parse_csv_content(csv_data)
    assert len(txs) == 2
    assert diag["total_parsed"] == 2
    assert diag["duplicate_count"] == 0
    assert txs[0]["amount"] == -145.20
    assert txs[1]["amount"] == 2500.00
    assert txs[0]["date"] == "2026-09-01"

def test_csv_parser_missing_required_columns():
    csv_data = """ColA,ColB,ColC
1,2,3
"""
    txs, diag = parse_csv_content(csv_data)
    assert len(txs) == 0
    assert "error" in diag

def test_csv_parser_invalid_date_and_amount():
    csv_data = """Date,Description,Amount
not-a-date,TEST STORE,-50.00
2026-09-05,ANOTHER STORE,invalid-amt
2026-09-06,VALID STORE,-25.50
"""
    txs, diag = parse_csv_content(csv_data)
    assert len(txs) == 1
    assert diag["skipped_count"] == 2
    assert txs[0]["description"] == "VALID STORE"

def test_csv_parser_formula_injection_defense():
    csv_data = """Date,Description,Amount
2026-09-01,=cmd|' /C calc'!A0,-10.00
2026-09-02,+SUM(A1:A10),-20.00
2026-09-03,@EVIL_FORMULA,-30.00
"""
    txs, diag = parse_csv_content(csv_data)
    assert len(txs) == 3
    # Check that leading formula triggers are escaped with single quote
    assert txs[0]["description"].startswith("'=")
    assert txs[1]["description"].startswith("'+")
    assert txs[2]["description"].startswith("'@")

def test_csv_parser_duplicate_detection():
    csv_data = """Date,Description,Amount
2026-09-01,SHELL OIL,-45.00
2026-09-01,SHELL OIL,-45.00
"""
    txs, diag = parse_csv_content(csv_data)
    assert len(txs) == 2
    assert diag["duplicate_count"] == 1
    assert txs[1]["is_potential_duplicate"] is True

def test_merchant_normalization():
    raw1 = "SQ *MIKE'S CAFE STORE #124 CA 94105"
    norm1 = normalize_merchant_name(raw1)
    assert "MIKE" in norm1
    assert "SQ *" not in norm1
    assert "94105" not in norm1

    raw2 = "PURCHASE AUTHORIZED ON 09/12 CHEVRON 0092144"
    norm2 = normalize_merchant_name(raw2)
    assert "CHEVRON" in norm2
    assert "PURCHASE AUTHORIZED" not in norm2

def test_chart_of_accounts_validation():
    session_id = "test-session-coa"
    save_chart_of_accounts(session_id, DEFAULT_TRADE_COA)
    
    assert validate_account_id(session_id, "5010") is True  # Materials
    assert validate_account_id(session_id, "6020") is True  # Fuel
    assert validate_account_id(session_id, "999999") is False # Non-existent

def test_deterministic_matching():
    valid_ids = {a.id for a in DEFAULT_TRADE_COA}
    
    # Test Home Depot match
    raw = "HOME DEPOT #4021 SAN JOSE CA"
    norm = normalize_merchant_name(raw)
    res = match_deterministic(raw, norm, valid_ids)
    assert res is not None
    acc_id, conf, source, expl, evid = res
    assert acc_id == "5010"
    assert conf >= 0.95
    assert source == "exact_rule"

def test_user_learned_rule():
    valid_ids = {a.id for a in DEFAULT_TRADE_COA}
    rule = add_user_rule("SPECIALTY WIRE CO", "5010", "Custom vendor rule")
    
    res = match_deterministic("PAYMENT TO SPECIALTY WIRE CO", "SPECIALTY WIRE CO", valid_ids)
    assert res is not None
    assert res[0] == "5010"

def test_local_heuristic_classifier_known_categories():
    accounts = DEFAULT_TRADE_COA
    
    # Test dining
    pred_food = run_local_heuristic_classifier("tx-1", "2026-09-01", "CHIPOTLE 1928", "CHIPOTLE", -32.50, accounts)
    assert pred_food.suggested_account_id == "6070"  # Meals
    assert pred_food.requires_review is True
    
    # Test software
    pred_sw = run_local_heuristic_classifier("tx-2", "2026-09-01", "DROPBOX*PLUS", "DROPBOX", -119.88, accounts)
    assert pred_sw.suggested_account_id == "6060" # Office Supplies & Software

    # Test ambiguous Amazon
    pred_amz = run_local_heuristic_classifier("tx-3", "2026-09-01", "AMZN MKTP US*2K39", "AMZN MKTP", -45.00, accounts)
    assert pred_amz.suggested_account_id is None
    assert pred_amz.requires_review is True
    assert pred_amz.missing_information is not None

def test_client_inquiry_generation():
    tx = TransactionBase(
        id="tx-inq-1",
        date="2026-09-17",
        original_description="AMZN MKTP US*8819",
        normalized_merchant="AMAZON",
        amount=-89.50,
        currency="USD",
        suggested_account_id=None,
        confidence=0.35,
        match_source="heuristic_fallback",
        status="needs_clarification",
        explanation="General marketplace purchase",
        requires_review=True,
        missing_information="What was the business purpose?"
    )
    
    pkg = generate_client_inquiry([tx], client_name="Northstar Electrical", period="September 2026")
    assert len(pkg.items) == 1
    assert "Amazon" in pkg.items[0].question
    assert len(pkg.items[0].options) > 1
    
    md = format_inquiry_as_markdown(pkg)
    assert "Northstar Electrical" in md
    assert "AMZN MKTP US*8819" in md

def test_export_service():
    tx1 = TransactionBase(
        id="tx-e1",
        date="2026-09-01",
        original_description="HOME DEPOT #4021",
        normalized_merchant="HOME DEPOT",
        amount=-150.00,
        currency="USD",
        suggested_account_id="5010",
        confidence=0.98,
        match_source="exact_rule",
        status="accepted",
        explanation="Matched rule"
    )
    tx2 = TransactionBase(
        id="tx-e2",
        date="2026-09-02",
        original_description="UNKNOWN VENDOR REF 101",
        normalized_merchant="UNKNOWN VENDOR",
        amount=-300.00,
        currency="USD",
        suggested_account_id=None,
        confidence=0.20,
        match_source="heuristic_fallback",
        status="needs_clarification",
        explanation="Ambiguous vendor"
    )
    
    csv_str, summary = export_transactions_to_csv([tx1, tx2], DEFAULT_TRADE_COA)
    assert "Transaction ID,Date,Original Bank Description" in csv_str
    assert "HOME DEPOT #4021" in csv_str
    assert "UNMAPPED" in csv_str
    assert summary["total_rows"] == 2
    assert summary["accepted_count"] == 1
    assert summary["unresolved_count"] == 1
    assert summary["is_fully_reconciled"] is False

def test_privacy_clear_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO sessions (id, name, created_at, filename) VALUES ('s-test', 'Test', '2026', 'test.csv')")
    cursor.execute("INSERT OR REPLACE INTO transactions (id, session_id, date, original_description, normalized_merchant, amount, status, match_source) VALUES ('t-test', 's-test', '2026-01-01', 'STORE', 'STORE', -10, 'unreviewed', 'exact_rule')")
    conn.commit()
    conn.close()

    from backend.main import clear_all_local_data
    res = clear_all_local_data()
    assert res["status"] == "cleared"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM transactions")
    cnt = cursor.fetchone()["cnt"]
    conn.close()
    assert cnt == 0
