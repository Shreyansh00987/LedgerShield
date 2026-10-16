import csv
import io
import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

REQUIRED_COLUMNS = ["date", "description", "amount"]

COMMON_COLUMN_ALIASES = {
    "date": ["date", "tx_date", "transaction date", "posted date", "post date", "booking date", "trans date"],
    "description": ["description", "memo", "payee", "merchant", "details", "transaction description", "narrative", "name"],
    "amount": ["amount", "transaction amount", "amt", "total", "net amount"],
    "debit": ["debit", "withdrawal", "spent", "outflow", "paid out"],
    "credit": ["credit", "deposit", "received", "inflow", "paid in"]
}

def sanitize_cell(value: str) -> str:
    """Sanitize against CSV formula injection attacks (=, +, -, @)."""
    if not isinstance(value, str):
        return str(value) if value is not None else ""
    cleaned = value.strip()
    if cleaned and cleaned[0] in ("=", "+", "-", "@", "\t", "\r"):
        # If it looks like a formula rather than a negative number
        if cleaned[0] in ("=", "@", "\t", "\r") or (len(cleaned) > 1 and not cleaned[1:].replace(".", "", 1).isdigit()):
            cleaned = "'" + cleaned
    return cleaned

def parse_amount(val_str: Any) -> Optional[float]:
    """Parse various currency and financial amount formats safely."""
    if val_str is None:
        return None
    s = str(val_str).strip()
    if not s:
        return None
    
    # Check for accounting negative format: (123.45)
    is_paren_negative = False
    if s.startswith("(") and s.endswith(")"):
        is_paren_negative = True
        s = s[1:-1].strip()
        
    # Remove currency symbols and whitespace
    s = re.sub(r"[^\d.,\-+]", "", s)
    
    # Handle European format: 1.234,56 vs Standard: 1,234.56
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s and "." not in s:
        # e.g., "1234,56" or "1,234"
        parts = s.split(",")
        if len(parts) == 2 and len(parts[1]) in (1, 2):
            s = s.replace(",", ".")
        else:
            s = s.replace(",", "")
            
    try:
        val = float(s)
        return -val if is_paren_negative else val
    except ValueError:
        return None

def parse_date(date_str: str) -> Optional[str]:
    """Standardize date string to YYYY-MM-DD."""
    if not date_str:
        return None
    cleaned = date_str.strip()
    formats = [
        "%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y",
        "%d-%m-%Y", "%Y/%m/%d", "%b %d, %Y", "%d %b %Y",
        "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def detect_column_mappings(headers: List[str]) -> Dict[str, str]:
    """Auto-detect column mappings from headers."""
    mapping = {}
    normalized_headers = {h.strip().lower(): h for h in headers}
    
    for target_col, aliases in COMMON_COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_headers:
                mapping[target_col] = normalized_headers[alias]
                break
                
    return mapping

def parse_csv_content(
    content: str, 
    custom_mapping: Optional[Dict[str, str]] = None
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Safely parse CSV text into transaction records with diagnostics.
    """
    if not content or not content.strip():
        return [], {"error": "CSV file is empty"}
        
    # Read headers
    reader = csv.reader(io.StringIO(content.strip()))
    try:
        raw_headers = next(reader)
    except StopIteration:
        return [], {"error": "CSV file contains no rows"}
        
    headers = [sanitize_cell(h) for h in raw_headers]
    mapping = custom_mapping or detect_column_mappings(headers)
    
    # Check required mapping
    has_amount = "amount" in mapping or ("debit" in mapping and "credit" in mapping)
    if "date" not in mapping or "description" not in mapping or not has_amount:
        return [], {
            "error": "Could not automatically map required columns (date, description, amount)",
            "available_headers": headers,
            "detected_mapping": mapping
        }

    header_indices = {h: i for i, h in enumerate(headers)}
    date_col = mapping.get("date")
    desc_col = mapping.get("description")
    amt_col = mapping.get("amount")
    debit_col = mapping.get("debit")
    credit_col = mapping.get("credit")

    transactions = []
    skipped_rows = []
    seen_hashes = set()
    duplicate_count = 0

    for row_idx, row in enumerate(reader, start=2):
        if not row or all(c.strip() == "" for c in row):
            continue  # empty row

        try:
            raw_date = row[header_indices[date_col]] if date_col in header_indices and header_indices[date_col] < len(row) else ""
            raw_desc = row[header_indices[desc_col]] if desc_col in header_indices and header_indices[desc_col] < len(row) else ""
            
            # Amount handling
            parsed_amt = None
            if amt_col and amt_col in header_indices and header_indices[amt_col] < len(row):
                parsed_amt = parse_amount(row[header_indices[amt_col]])
            elif debit_col and credit_col:
                debit_val = parse_amount(row[header_indices[debit_col]]) if header_indices[debit_col] < len(row) else None
                credit_val = parse_amount(row[header_indices[credit_col]]) if header_indices[credit_col] < len(row) else None
                if debit_val is not None and debit_val > 0:
                    parsed_amt = -abs(debit_val)
                elif credit_val is not None and credit_val > 0:
                    parsed_amt = abs(credit_val)
                elif debit_val == 0 or credit_val == 0:
                    parsed_amt = 0.0

            std_date = parse_date(raw_date)
            std_desc = sanitize_cell(raw_desc)

            if not std_date:
                skipped_rows.append({"row": row_idx, "reason": f"Invalid date: {raw_date}"})
                continue
            if not std_desc:
                skipped_rows.append({"row": row_idx, "reason": "Missing description"})
                continue
            if parsed_amt is None:
                skipped_rows.append({"row": row_idx, "reason": "Invalid or missing amount"})
                continue

            # Duplicate check
            row_hash = f"{std_date}|{std_desc.lower()}|{parsed_amt:.2f}"
            is_duplicate = row_hash in seen_hashes
            if is_duplicate:
                duplicate_count += 1
            else:
                seen_hashes.add(row_hash)

            transactions.append({
                "source_row": row_idx,
                "date": std_date,
                "description": std_desc,
                "amount": round(parsed_amt, 2),
                "is_potential_duplicate": is_duplicate
            })

        except Exception as e:
            skipped_rows.append({"row": row_idx, "reason": f"Row processing error: {str(e)}"})

    diagnostics = {
        "total_parsed": len(transactions),
        "skipped_count": len(skipped_rows),
        "duplicate_count": duplicate_count,
        "mapping_used": mapping,
        "available_headers": headers,
        "skipped_details": skipped_rows[:10]  # first 10 for feedback
    }

    return transactions, diagnostics
