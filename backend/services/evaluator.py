import time
from typing import List, Dict, Any
from backend.models import Account, TransactionBase
from backend.services.matching_engine import normalize_merchant_name, match_deterministic
from backend.services.ai_reconciler import run_local_heuristic_classifier
from backend.services.chart_of_accounts import DEFAULT_TRADE_COA

BENCHMARK_TRANSACTIONS = [
    {"desc": "HOME DEPOT #4021 SAN JOSE CA", "amt": -142.50, "expected_account": "5010", "category": "Materials"},
    {"desc": "LOWES #0192 AUSTIN TX", "amt": -89.20, "expected_account": "5010", "category": "Materials"},
    {"desc": "PLATT ELECTRIC SUPPLY 044", "amt": -312.45, "expected_account": "5010", "category": "Materials"},
    {"desc": "GRAINGER 812-991-002", "amt": -420.00, "expected_account": "5010", "category": "Materials"},
    {"desc": "SUNBELT RENTALS #881 SCISSOR LIFT", "amt": -450.00, "expected_account": "5030", "category": "Equipment Rental"},
    {"desc": "UNITED RENTALS GENERATOR 10KW", "amt": -650.00, "expected_account": "5030", "category": "Equipment Rental"},
    {"desc": "SHELL OIL 574421 HOUSTON TX", "amt": -65.20, "expected_account": "6020", "category": "Fuel"},
    {"desc": "CHEVRON 0092144 OAKLAND CA", "amt": -72.10, "expected_account": "6020", "category": "Fuel"},
    {"desc": "EXXONMOBIL 44299 DALLAS TX", "amt": -58.90, "expected_account": "6020", "category": "Fuel"},
    {"desc": "AUTOZONE #1822 BRAKE FLUID/BULBS", "amt": -44.15, "expected_account": "6030", "category": "Vehicle Maint"},
    {"desc": "JIFFY LUBE #402 OIL CHANGE VAN 2", "amt": -89.99, "expected_account": "6030", "category": "Vehicle Maint"},
    {"desc": "HARBOR FREIGHT TOOLS #91", "amt": -129.50, "expected_account": "6040", "category": "Small Tools"},
    {"desc": "STATE FARM MUTUAL AUTO INS", "amt": -340.00, "expected_account": "6050", "category": "Insurance"},
    {"desc": "INTUIT *QUICKBOOKS ONLINE MONTHLY", "amt": -85.00, "expected_account": "6060", "category": "Software"},
    {"desc": "GOOGLE *WORKSPACE NORTHSTAR", "amt": -36.00, "expected_account": "6060", "category": "Software"},
    {"desc": "VERIZON WIRELESS MONTHLY AUTOPAY", "amt": -210.50, "expected_account": "6100", "category": "Utilities"},
    {"desc": "SQUARE INC FEE 09/24", "amt": -14.20, "expected_account": "6090", "category": "Merchant Fees"},
    # Ambiguous / Complex cases requiring semantic understanding
    {"desc": "AMZN MKTP US*2K39F WIRE STRIPPER", "amt": -34.99, "expected_account": "6040", "category": "Ambiguous Retail"},
    {"desc": "AMAZON.COM*MB92K COPY PAPER & TONER", "amt": -54.20, "expected_account": "6060", "category": "Ambiguous Retail"},
    {"desc": "DROPBOX*PLUS ANNUAL SUB", "amt": -119.88, "expected_account": "6060", "category": "Software"},
    {"desc": "STARBUCKS STORE 1024 CREW COFFEE", "amt": -24.80, "expected_account": "6070", "category": "Meals"},
    {"desc": "CHIPOTLE 1928 LUNCH MEETING WITH DAVE", "amt": -38.50, "expected_account": "6070", "category": "Meals"},
    {"desc": "PILOT TRAVEL CENTER DIESEL", "amt": -115.00, "expected_account": "6020", "category": "Fuel"},
    {"desc": "CED CONSOLIDATED ELECTRICAL DIST", "amt": -780.00, "expected_account": "5010", "category": "Materials"},
    {"desc": "INVOICE #1094 PAYMT FROM ACME CORP", "amt": 3450.00, "expected_account": "4010", "category": "Revenue"},
    {"desc": "STRIPE PAYOUT CONTRACTING SVC", "amt": 5200.00, "expected_account": "4010", "category": "Revenue"},
    {"desc": "UNKNOWN WIRE TRF REF 88291A", "amt": -250.00, "expected_account": None, "category": "Needs Clarification"},
    {"desc": "ATM CASH WITHDRAWAL MAIN ST", "amt": -200.00, "expected_account": "3020", "category": "Owner Draw"}
]

def run_evaluation_benchmark() -> Dict[str, Any]:
    """
    Run comparative evaluation benchmark:
    Stage 1: Deterministic rules alone
    Stage 2: Deterministic rules + Local Semantic Model
    """
    accounts = DEFAULT_TRADE_COA
    valid_ids = {a.id for a in accounts}
    total = len(BENCHMARK_TRANSACTIONS)
    
    # 1. Deterministic alone
    start_t1 = time.time()
    det_correct = 0
    det_matched = 0
    det_unresolved = 0
    
    for item in BENCHMARK_TRANSACTIONS:
        norm = normalize_merchant_name(item["desc"])
        res = match_deterministic(item["desc"], norm, valid_ids)
        if res:
            det_matched += 1
            if res[0] == item["expected_account"]:
                det_correct += 1
        else:
            det_unresolved += 1
            # If expected_account is None, unresolved is actually correct!
            if item["expected_account"] is None:
                det_correct += 1
                
    dur_det = time.time() - start_t1
    
    # 2. Combined Pipeline (Deterministic + Local AI / Heuristic)
    start_t2 = time.time()
    combined_correct = 0
    combined_matched = 0
    combined_requires_review = 0
    
    for idx, item in enumerate(BENCHMARK_TRANSACTIONS):
        norm = normalize_merchant_name(item["desc"])
        res = match_deterministic(item["desc"], norm, valid_ids)
        if res:
            combined_matched += 1
            if res[0] == item["expected_account"]:
                combined_correct += 1
        else:
            # Send to local classifier
            pred = run_local_heuristic_classifier(
                tx_id=f"bench-{idx}",
                date="2026-10-01",
                raw_desc=item["desc"],
                norm_merchant=norm,
                amount=item["amt"],
                accounts=accounts
            )
            if pred.suggested_account_id:
                combined_matched += 1
                if pred.suggested_account_id == item["expected_account"]:
                    combined_correct += 1
            else:
                if item["expected_account"] is None:
                    combined_correct += 1
            if pred.requires_review:
                combined_requires_review += 1
                
    dur_combined = time.time() - start_t2
    
    return {
        "dataset_size": total,
        "metrics": {
            "deterministic_only": {
                "accuracy": round(det_correct / total * 100, 1),
                "matched_count": det_matched,
                "unresolved_count": det_unresolved,
                "review_rate": round(det_unresolved / total * 100, 1),
                "duration_ms": round(dur_det * 1000, 2),
                "avg_per_item_ms": round((dur_det / total) * 1000, 3)
            },
            "deterministic_plus_local_ai": {
                "accuracy": round(combined_correct / total * 100, 1),
                "matched_count": combined_matched,
                "requires_review_rate": round(combined_requires_review / total * 100, 1),
                "duration_ms": round(dur_combined * 1000, 2),
                "avg_per_item_ms": round((dur_combined / total) * 1000, 3),
                "accuracy_gain_pct": round((combined_correct - det_correct) / total * 100, 1)
            }
        },
        "hardware_specs": {
            "runtime": "Local Execution (Python 3.14 + Pydantic v2)",
            "inference_path": "Localhost / Zero Cloud Transmission",
            "model_adapter": "Gemma 2 / Ollama + Verified Heuristic Subsystem"
        }
    }
