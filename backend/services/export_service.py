import csv
import io
from typing import List, Dict, Any, Tuple
from backend.models import TransactionBase, Account

def export_transactions_to_csv(
    transactions: List[TransactionBase],
    accounts: List[Account]
) -> Tuple[str, Dict[str, Any]]:
    """
    Generate clean, audit-compliant CSV and pre-flight audit summary.
    """
    account_map = {a.id: a for a in accounts}
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    
    # Headers
    headers = [
        "Transaction ID",
        "Date",
        "Original Bank Description",
        "Normalized Merchant",
        "Amount",
        "Currency",
        "Account ID",
        "Account Name",
        "Account Type",
        "Review Status",
        "Match Source",
        "Confidence Score",
        "Explanation",
        "Auditor Note",
        "Reviewed At"
    ]
    writer.writerow(headers)
    
    unresolved_count = 0
    accepted_count = 0
    edited_count = 0
    needs_clarification_count = 0
    
    for tx in transactions:
        acc = account_map.get(tx.suggested_account_id) if tx.suggested_account_id else None
        
        if tx.status in ("accepted", "suggested"):
            accepted_count += 1
        elif tx.status == "edited":
            edited_count += 1
        elif tx.status in ("needs_clarification", "unreviewed", "rejected"):
            unresolved_count += 1
            if tx.status == "needs_clarification":
                needs_clarification_count += 1
                
        writer.writerow([
            tx.id,
            tx.date,
            tx.original_description,
            tx.normalized_merchant,
            f"{tx.amount:.2f}",
            tx.currency,
            tx.suggested_account_id or "",
            acc.name if acc else "UNMAPPED",
            acc.type if acc else "",
            tx.status,
            tx.match_source,
            f"{tx.confidence:.2f}",
            tx.explanation,
            tx.human_note or "",
            tx.reviewed_at or ""
        ])
        
    summary = {
        "total_rows": len(transactions),
        "accepted_count": accepted_count,
        "edited_count": edited_count,
        "unresolved_count": unresolved_count,
        "needs_clarification_count": needs_clarification_count,
        "is_fully_reconciled": (unresolved_count == 0)
    }
    
    return output.getvalue(), summary
