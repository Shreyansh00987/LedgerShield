import re
import uuid
from typing import Optional, Tuple, List, Dict
from backend.models import Rule, TransactionBase
from backend.database import get_connection

# Known prefixes from bank feeds
PREFIX_PATTERNS = [
    r"^SQ\s*\*\s*",
    r"^TST\s*\*\s*",
    r"^PAYPAL\s*\*\s*",
    r"^SP\s*\*\s*",
    r"^STRIPE\s*\*\s*",
    r"^CHECKCARD\s+",
    r"^POS\s+(?:PURCHASE|DEBIT)\s+",
    r"^PURCHASE\s+AUTHORIZED\s+ON\s+\d{2}/\d{2}\s+",
    r"^DEBIT\s+CARD\s+PURCHASE\s+",
    r"^ACH\s+(?:DEBIT|CREDIT)\s+",
    r"^DIRECT\s+DEP\s+",
    r"^ONLINE\s+BANKING\s+TRANSFER\s+TO\s+",
    r"^ONLINE\s+BANKING\s+TRANSFER\s+FROM\s+",
    r"^BILL\s+PMT\s+"
]

# Patterns to strip from the end of merchant names
SUFFIX_PATTERNS = [
    r"\s+#\s*\d+",                   # #1234
    r"\s+STORE\s*#?\s*\d+",          # STORE 4021
    r"\s+LOC(?:ATION)?\s*#?\s*\d+",  # LOC 12
    r"\s+\d{3}-\d{3}-\d{4}",         # Phone numbers
    r"\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?", # State & Zip (e.g., CA 94105)
    r"\s+\d{6,}",                    # Long terminal reference numbers
    r"\.COM",
    r"\s+US\s*\*\s*[A-Z0-9]+",       # e.g., US*2K39
]

SYSTEM_DEFAULT_RULES = [
    Rule(id="sys-hd", pattern="HOME DEPOT", account_id="5010", is_exact=False, created_by="system", description="Electrical materials, wire, breakers"),
    Rule(id="sys-lowes", pattern="LOWE'S", account_id="5010", is_exact=False, created_by="system", description="Job materials and supplies"),
    Rule(id="sys-grainger", pattern="GRAINGER", account_id="5010", is_exact=False, created_by="system", description="Industrial electrical components"),
    Rule(id="sys-platt", pattern="PLATT ELECTRIC", account_id="5010", is_exact=False, created_by="system", description="Electrical supply house"),
    Rule(id="sys-rexel", pattern="REXEL", account_id="5010", is_exact=False, created_by="system", description="Electrical wholesale distributor"),
    Rule(id="sys-sunbelt", pattern="SUNBELT RENTALS", account_id="5030", is_exact=False, created_by="system", description="Scissor lift / job rental"),
    Rule(id="sys-united-rentals", pattern="UNITED RENTALS", account_id="5030", is_exact=False, created_by="system", description="Equipment rental"),
    Rule(id="sys-shell", pattern="SHELL OIL", account_id="6020", is_exact=False, created_by="system", description="Fleet vehicle fuel"),
    Rule(id="sys-chevron", pattern="CHEVRON", account_id="6020", is_exact=False, created_by="system", description="Fleet vehicle fuel"),
    Rule(id="sys-exxon", pattern="EXXON", account_id="6020", is_exact=False, created_by="system", description="Fleet vehicle fuel"),
    Rule(id="sys-speedway", pattern="SPEEDWAY", account_id="6020", is_exact=False, created_by="system", description="Fleet vehicle fuel"),
    Rule(id="sys-autozone", pattern="AUTOZONE", account_id="6030", is_exact=False, created_by="system", description="Fleet maintenance & truck parts"),
    Rule(id="sys-jiffy-lube", pattern="JIFFY LUBE", account_id="6030", is_exact=False, created_by="system", description="Work van oil changes"),
    Rule(id="sys-harbor-freight", pattern="HARBOR FREIGHT", account_id="6040", is_exact=False, created_by="system", description="Shop tools & equipment"),
    Rule(id="sys-state-farm", pattern="STATE FARM", account_id="6050", is_exact=False, created_by="system", description="Commercial vehicle & liability policy"),
    Rule(id="sys-quickbooks", pattern="INTUIT *QUICKBOOKS", account_id="6060", is_exact=False, created_by="system", description="Accounting software subscription"),
    Rule(id="sys-google-workspace", pattern="GOOGLE *WORKSPACE", account_id="6060", is_exact=False, created_by="system", description="Company email & cloud storage"),
    Rule(id="sys-verizon", pattern="VERIZON WIRELESS", account_id="6100", is_exact=False, created_by="system", description="Electrician crew cell phones"),
    Rule(id="sys-square-fee", pattern="SQUARE INC FEE", account_id="6090", is_exact=False, created_by="system", description="Credit card processing fees")
]

def normalize_merchant_name(raw_description: str) -> str:
    """Clean and extract canonical merchant name from raw bank description."""
    if not raw_description:
        return ""
        
    cleaned = raw_description.strip()
    
    # Strip known prefixes
    for prefix in PREFIX_PATTERNS:
        cleaned = re.sub(prefix, "", cleaned, flags=re.IGNORECASE).strip()
        
    # Strip trailing numbers, codes, state/zip
    for suffix in SUFFIX_PATTERNS:
        cleaned = re.sub(suffix, "", cleaned, flags=re.IGNORECASE).strip()
        
    # Remove special punctuation but keep alphanumeric and spaces
    cleaned = re.sub(r"[\*#_\\/|\^]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    
    return cleaned.upper()

def get_all_rules() -> List[Rule]:
    """Retrieve system rules combined with user-learned rules from DB."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, pattern, account_id, is_exact, created_by, description FROM rules")
    rows = cursor.fetchall()
    conn.close()
    
    rules = list(SYSTEM_DEFAULT_RULES)
    for r in rows:
        rules.append(Rule(
            id=r["id"],
            pattern=r["pattern"],
            account_id=r["account_id"],
            is_exact=bool(r["is_exact"]),
            created_by=r["created_by"],
            description=r["description"] or ""
        ))
    return rules

def add_user_rule(pattern: str, account_id: str, description: str = "") -> Rule:
    """Persist a new deterministic user rule."""
    rule_id = f"rule-{uuid.uuid4().hex[:8]}"
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO rules (id, pattern, account_id, is_exact, created_by, description) VALUES (?, ?, ?, ?, ?, ?)",
        (rule_id, pattern.upper().strip(), account_id, 0, "user_learned", description)
    )
    conn.commit()
    conn.close()
    return Rule(
        id=rule_id,
        pattern=pattern.upper().strip(),
        account_id=account_id,
        is_exact=False,
        created_by="user_learned",
        description=description
    )

def match_deterministic(
    raw_description: str,
    normalized_merchant: str,
    valid_account_ids: set
) -> Optional[Tuple[str, float, str, str, str]]:
    """
    Attempt deterministic matching.
    Returns: (account_id, confidence, match_source, explanation, evidence) or None.
    """
    rules = get_all_rules()
    norm_upper = normalized_merchant.upper()
    raw_upper = raw_description.upper()
    
    # 1. Check exact pattern matches
    for rule in rules:
        pat = rule.pattern.upper()
        if rule.is_exact:
            if pat == norm_upper or pat == raw_upper:
                if rule.account_id in valid_account_ids:
                    return (
                        rule.account_id,
                        0.99,
                        "exact_rule",
                        f"Matched exact user rule for '{rule.pattern}'",
                        f"Exact rule: {rule.description or rule.pattern}"
                    )
        else:
            # Substring match
            if pat in norm_upper or pat in raw_upper:
                if rule.account_id in valid_account_ids:
                    source = "exact_rule" if rule.created_by == "user_learned" else "exact_rule"
                    return (
                        rule.account_id,
                        0.95,
                        source,
                        f"Matched verified rule pattern '{rule.pattern}'",
                        f"Rule source: {rule.created_by} ({rule.description or 'merchant pattern'})"
                    )
                    
    # 2. Historical check: Look at past accepted transactions in DB
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT suggested_account_id, COUNT(*) as cnt 
           FROM transactions 
           WHERE status IN ('accepted', 'edited') 
             AND normalized_merchant = ? 
             AND suggested_account_id IS NOT NULL 
           GROUP BY suggested_account_id 
           ORDER BY cnt DESC LIMIT 1""",
        (norm_upper,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row and row["suggested_account_id"] in valid_account_ids:
        account_id = row["suggested_account_id"]
        count = row["cnt"]
        return (
            account_id,
            0.90,
            "historical_pattern",
            f"Matched {count} previously approved transaction(s) for merchant '{normalized_merchant}'",
            f"Historical database pattern count: {count}"
        )

    return None
