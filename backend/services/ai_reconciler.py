import json
import logging
import re
from typing import Dict, Any, List, Optional
import httpx
from pydantic import BaseModel, Field
from backend.models import Account, TransactionBase
from backend.config import OLLAMA_BASE_URL, DEFAULT_MODEL

logger = logging.getLogger("ledgershield.ai")

class ModelPrediction(BaseModel):
    transaction_id: str
    suggested_account_id: Optional[str]
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    evidence: str
    requires_review: bool = True
    missing_information: Optional[str] = None
    match_source: str = "local_ai"

import time

_HEALTH_CACHE = {"timestamp": 0, "data": None}

def check_local_model_health() -> Dict[str, Any]:
    """Check if local Ollama or OpenAI-compatible daemon is reachable with TTL cache."""
    now = time.time()
    if _HEALTH_CACHE["data"] is not None and (now - _HEALTH_CACHE["timestamp"]) < 5.0:
        return _HEALTH_CACHE["data"]
        
    res = {
        "available": False,
        "provider": "Local Heuristic / Pattern Engine (Honest Fallback)",
        "models": [],
        "active_model": "rule-heuristic-engine"
    }
    try:
        with httpx.Client(timeout=0.3) as client:
            resp = client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                models = [m.get("name") for m in resp.json().get("models", [])]
                res = {
                    "available": True,
                    "provider": "Ollama (Local Open-Weight)",
                    "models": models,
                    "active_model": DEFAULT_MODEL if DEFAULT_MODEL in models else (models[0] if models else DEFAULT_MODEL)
                }
    except Exception:
        pass
        
    _HEALTH_CACHE["timestamp"] = now
    _HEALTH_CACHE["data"] = res
    return res

def build_prompt_context(accounts: List[Account]) -> str:
    """Construct structured context of allowed Chart of Accounts."""
    lines = ["Chart of Accounts (You MUST ONLY select from these IDs):"]
    for a in accounts:
        lines.append(f"- ID: {a.id} | Name: {a.name} | Type: {a.type} | Desc: {a.description}")
    return "\n".join(lines)

def run_local_heuristic_classifier(
    tx_id: str,
    date: str,
    raw_desc: str,
    norm_merchant: str,
    amount: float,
    accounts: List[Account]
) -> ModelPrediction:
    """
    Deterministic semantic heuristic engine when a live local LLM daemon is offline.
    Uses domain semantic rules for trade contractors and small businesses.
    """
    desc_upper = (raw_desc + " " + norm_merchant).upper()
    valid_ids = {a.id for a in accounts}
    
    # 1. Revenue checks
    if amount > 0:
        if any(k in desc_upper for k in ["INVOICE", "PAYMENT RECEIVED", "STRIPE", "SQUARE INC", "ZELLE", "CUSTOMER"]):
            target_id = "4010" if "4010" in valid_ids else accounts[0].id
            return ModelPrediction(
                transaction_id=tx_id,
                suggested_account_id=target_id,
                confidence=0.88,
                explanation="Positive cash inflow from client customer payment or card merchant deposit",
                evidence="Positive amount with customer invoice/deposit keywords",
                requires_review=False,
                match_source="heuristic_fallback"
            )
        elif "INTEREST" in desc_upper or "REBATE" in desc_upper:
            target_id = "4090" if "4090" in valid_ids else accounts[0].id
            return ModelPrediction(
                transaction_id=tx_id,
                suggested_account_id=target_id,
                confidence=0.92,
                explanation="Interest credit or vendor rebate",
                evidence="Bank credit transaction mentioning interest/rebate",
                requires_review=False,
                match_source="heuristic_fallback"
            )

    # 2. Material / Hardware / Job supplies
    if any(k in desc_upper for k in ["HARDWARE", "SUPPLY", "ELECTRIC", "WIRE", "CONDUIT", "BREAKER", "LIGHTING", "FERGUSON", "FASTENAL", "CED"]):
        target_id = "5010" if "5010" in valid_ids else accounts[0].id
        return ModelPrediction(
            transaction_id=tx_id,
            suggested_account_id=target_id,
            confidence=0.85,
            explanation="Merchant name and line items indicate electrical parts and job installation materials",
            evidence=f"Matched electrical trade supply keywords in '{norm_merchant}'",
            requires_review=False,
            match_source="heuristic_fallback"
        )

    # 3. Fuel & Gas stations
    if any(k in desc_upper for k in ["FUEL", "GAS", "OIL", "PETRO", "7-ELEVEN", "CIRCLE K", "WAWA", "PILOT", "LOVES"]):
        target_id = "6020" if "6020" in valid_ids else accounts[0].id
        return ModelPrediction(
            transaction_id=tx_id,
            suggested_account_id=target_id,
            confidence=0.87,
            explanation="Gas station / convenience fuel vendor for fleet vehicles",
            evidence=f"Fuel vendor pattern in '{norm_merchant}'",
            requires_review=False,
            match_source="heuristic_fallback"
        )

    # 4. Meals / Coffee
    if any(k in desc_upper for k in ["CAFE", "COFFEE", "RESTAURANT", "BURGER", "PIZZA", "BAKERY", "DINER", "GRILL", "TACO", "MCDONALD", "CHIPOTLE", "STARBUCKS", "PANERA", "SUBWAY", "DUNKIN"]):
        target_id = "6070" if "6070" in valid_ids else accounts[0].id
        return ModelPrediction(
            transaction_id=tx_id,
            suggested_account_id=target_id,
            confidence=0.78,
            explanation="Food service or restaurant expense, subject to 50% business meal deduction limits",
            evidence=f"Dining/food keyword in '{norm_merchant}'",
            requires_review=True,
            missing_information="Was this meal with a prospective/existing client or an overtime crew meal?",
            match_source="heuristic_fallback"
        )

    # 5. Software / Subscriptions / Office
    if any(k in desc_upper for k in ["SOFTWARE", "CLOUD", "AWS", "MICROSOFT", "DROPBOX", "DOCUSIGN", "ZOOM", "ADOBE", "APPLE"]):
        target_id = "6060" if "6060" in valid_ids else accounts[0].id
        return ModelPrediction(
            transaction_id=tx_id,
            suggested_account_id=target_id,
            confidence=0.89,
            explanation="Digital subscription or cloud service software",
            evidence=f"Matched recurring cloud software vendor '{norm_merchant}'",
            requires_review=False,
            match_source="heuristic_fallback"
        )

    # 6. Ambiguous / Unknown / Amazon / PayPal without details
    if any(k in desc_upper for k in ["AMAZON", "AMZN", "TARGET", "WALMART", "EBAY"]):
        return ModelPrediction(
            transaction_id=tx_id,
            suggested_account_id=None,
            confidence=0.35,
            explanation="General retail marketplace purchase with mixed business and personal possibilities (tools vs office vs personal)",
            evidence="General marketplace merchant without line-item receipt",
            requires_review=True,
            missing_information="What specific items were purchased? (e.g. Job site supplies, office gear, or personal items?)",
            match_source="heuristic_fallback"
        )

    # 7. Unresolved fallback
    return ModelPrediction(
        transaction_id=tx_id,
        suggested_account_id=None,
        confidence=0.20,
        explanation=f"Unrecognized merchant '{norm_merchant}'. Requires client clarification or custom bookkeeping rule.",
        evidence=f"Original description: {raw_desc}",
        requires_review=True,
        missing_information="What was the business purpose of this vendor payment?",
        match_source="heuristic_fallback"
    )

def predict_transaction(
    tx_id: str,
    date: str,
    raw_desc: str,
    norm_merchant: str,
    amount: float,
    accounts: List[Account]
) -> ModelPrediction:
    """
    Main prediction router:
    Attempts local LLM inference if running (e.g., Gemma 2 via Ollama).
    Falls back gracefully and honestly to the local heuristic semantic engine.
    Always enforces strict Chart of Accounts validation.
    """
    health = check_local_model_health()
    valid_account_ids = {a.id for a in accounts}
    
    if health["available"]:
        try:
            # Query local Ollama instance with strict JSON instruction
            model_name = health.get("active_model", DEFAULT_MODEL)
            system_prompt = (
                "You are LedgerShield, an expert local accounting reconciliation assistant.\n"
                "Given a bank transaction and a Chart of Accounts, select the most appropriate account ID.\n"
                "CRITICAL: You must ONLY output a JSON object adhering to this schema:\n"
                "{\n"
                '  "suggested_account_id": "account_id_from_list_or_null",\n'
                '  "confidence": 0.0_to_1.0,\n'
                '  "explanation": "concise rationale based on business context",\n'
                '  "evidence": "keywords or vendor pattern observed",\n'
                '  "requires_review": true_or_false,\n'
                '  "missing_information": "what client question is needed if ambiguous"\n'
                "}\n"
                "DO NOT invent account IDs. If ambiguous or missing information, set suggested_account_id to null and requires_review to true."
            )
            
            user_msg = (
                f"{build_prompt_context(accounts)}\n\n"
                f"Transaction Details:\n"
                f"- ID: {tx_id}\n"
                f"- Date: {date}\n"
                f"- Description: {raw_desc}\n"
                f"- Normalized Merchant: {norm_merchant}\n"
                f"- Amount: ${amount:.2f}\n"
            )
            
            with httpx.Client(timeout=10.0) as client:
                res = client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_msg}
                        ],
                        "format": "json",
                        "stream": False
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("message", {}).get("content", "{}")
                    parsed = json.loads(content)
                    
                    suggested_id = parsed.get("suggested_account_id")
                    if suggested_id and suggested_id not in valid_account_ids:
                        # Reject hallucinated account code
                        suggested_id = None
                        requires_rev = True
                    else:
                        requires_rev = parsed.get("requires_review", True)
                        
                    conf = float(parsed.get("confidence", 0.5))
                    conf = max(0.0, min(1.0, conf))
                    
                    return ModelPrediction(
                        transaction_id=tx_id,
                        suggested_account_id=suggested_id,
                        confidence=conf,
                        explanation=parsed.get("explanation", "Local model inference categorization"),
                        evidence=parsed.get("evidence", f"Inferred by {model_name}"),
                        requires_review=requires_rev,
                        missing_information=parsed.get("missing_information"),
                        match_source="local_ai"
                    )
        except Exception as e:
            logger.warning(f"Local AI inference failed or timed out: {e}. Falling back to heuristic.")
            
    # Honest fallback when model runtime is offline
    return run_local_heuristic_classifier(tx_id, date, raw_desc, norm_merchant, amount, accounts)
